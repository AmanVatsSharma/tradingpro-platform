// app/api/positions/route.ts - New user friendly version
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get or create trading account
    let tradingAccount = await prisma.tradingAccount.findFirst({
      where: { userId },
      include: {
        positions: {
          where: {
            quantity: {
              not: 0,
            },
          },
          include: {
            Stock: true,
          },
        },
      },
    })

    // Create trading account if doesn't exist (for new users)
    if (!tradingAccount) {
      tradingAccount = await prisma.tradingAccount.create({
        data: {
          userId,
          balance: 0,
          availableMargin: 0,
          usedMargin: 0,
        },
        include: {
          positions: true,
        },
      })
    }

    // Handle new users with no positions
    if (tradingAccount.positions.length === 0) {
      return NextResponse.json({
        positions: [],
        summary: {
          totalInvested: 0,
          totalMarketValue: 0,
          totalUnrealizedPnL: 0,
          totalDayPnL: 0,
          totalPositions: 0,
          bestPerformer: null,
          worstPerformer: null,
        },
        isNewUser: true,
        message: "No positions yet. Start trading to see your positions here!"
      })
    }

    // Get current market data for existing positions
    const symbols = tradingAccount.positions.map(p => p.symbol)
    const marketData = await getCurrentMarketData(symbols)

    // Calculate updated P&L for each position
    const updatedPositions = await Promise.all(
      tradingAccount.positions.map(async (position) => {
        const currentMarketData = marketData[position.symbol]
        const currentPrice = currentMarketData?.ltp || position.averagePrice
        
        const unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity
        const dayChange = currentMarketData?.change || 0
        const dayPnL = dayChange * Math.abs(position.quantity) * (position.quantity > 0 ? 1 : -1)
        const marketValue = currentPrice * Math.abs(position.quantity)
        const investedValue = position.averagePrice * Math.abs(position.quantity)
        
        // Update position in database
        const updatedPosition = await prisma.position.update({
          where: { id: position.id },
          data: {
            unrealizedPnL,
            dayPnL,
          },
        })

        return {
          ...updatedPosition,
          currentPrice,
          changePercent: currentMarketData?.changePercent || 0,
          marketValue,
          investedValue,
          unrealizedPnLPercent: investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : 0,
          dayPnLPercent: investedValue > 0 ? (dayPnL / investedValue) * 100 : 0,
          positionType: position.quantity > 0 ? 'LONG' : 'SHORT',
          Stock: position.Stock, // Include stock details
        }
      })
    )

    // Calculate portfolio summary
    const totalInvested = updatedPositions.reduce((sum, pos) => sum + pos.investedValue, 0)
    const totalMarketValue = updatedPositions.reduce((sum, pos) => sum + pos.marketValue, 0)
    const totalUnrealizedPnL = updatedPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0)
    const totalDayPnL = updatedPositions.reduce((sum, pos) => sum + pos.dayPnL, 0)

    // Find best and worst performers
    const sortedByPnL = [...updatedPositions].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
    const bestPerformer = sortedByPnL[0] || null
    const worstPerformer = sortedByPnL[sortedByPnL.length - 1] || null

    return NextResponse.json({
      positions: updatedPositions,
      summary: {
        totalInvested,
        totalMarketValue,
        totalUnrealizedPnL,
        totalDayPnL,
        totalPositions: updatedPositions.length,
        totalReturnPercent: totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0,
        dayReturnPercent: totalInvested > 0 ? (totalDayPnL / totalInvested) * 100 : 0,
        bestPerformer: bestPerformer ? {
          symbol: bestPerformer.symbol,
          unrealizedPnLPercent: bestPerformer.unrealizedPnLPercent
        } : null,
        worstPerformer: worstPerformer ? {
          symbol: worstPerformer.symbol,
          unrealizedPnLPercent: worstPerformer.unrealizedPnLPercent
        } : null,
      },
      isNewUser: false,
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Positions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

interface MarketData {
  [symbol: string]: {
    ltp: number;
    change: number;
    changePercent: number;
  }
}

async function getCurrentMarketData(symbols: string[]): Promise<MarketData> {
  if (symbols.length === 0) return {}
  
  const marketData: MarketData = {}
  
  for (const symbol of symbols) {
    const basePrice = 2000 + Math.random() * 1000
    const change = (Math.random() - 0.5) * 100
    
    marketData[symbol] = {
      ltp: basePrice + change,
      change: change,
      changePercent: (change / basePrice) * 100,
    }
  }
  
  return marketData
}
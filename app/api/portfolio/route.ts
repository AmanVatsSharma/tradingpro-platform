// app/api/portfolio/route.ts - New user friendly version
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create user's trading account
    let tradingAccount = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id },
      include: {
        positions: {
          where: { quantity: { not: 0 } },
          include: { Stock: true }
        },
        orders: {
          where: {
            status: { in: ["PENDING", "COMPLETED"] },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        trades: {
          orderBy: { createdAt: "desc" },
          take: 10,
        }
      },
    })

    // Create trading account if it doesn't exist (for new users)
    if (!tradingAccount) {
      tradingAccount = await prisma.tradingAccount.create({
        data: {
          userId: session.user.id,
          balance: 0,
          availableMargin: 0,
          usedMargin: 0,
        },
        include: {
          positions: true,
          orders: true,
          trades: true,
        }
      })
    }

    // Handle case where user has no positions (new user)
    if (tradingAccount.positions.length === 0) {
      return NextResponse.json({
        account: {
          balance: Number(tradingAccount.balance),
          availableMargin: Number(tradingAccount.availableMargin),
          usedMargin: Number(tradingAccount.usedMargin),
          totalPortfolioValue: Number(tradingAccount.balance),
          marginUtilization: 0,
        },
        portfolio: {
          totalInvestedValue: 0,
          totalCurrentValue: 0,
          totalUnrealizedPnL: 0,
          totalDayPnL: 0,
          dayPnLPercent: 0,
          totalPositions: 0,
          totalReturnPercent: 0,
        },
        positions: [],
        orders: {
          pending: tradingAccount.orders.filter(order => order.status === "PENDING"),
          recent: tradingAccount.orders.slice(0, 5),
          total: tradingAccount.orders.length,
        },
        transactions: tradingAccount.trades.map(trade => ({
          ...trade,
          amount: Number(trade.amount),
        })),
        isNewUser: tradingAccount.orders.length === 0 && tradingAccount.positions.length === 0,
        lastUpdated: new Date().toISOString(),
      })
    }

    // Calculate portfolio metrics for users with positions
    const symbols = tradingAccount.positions.map(p => p.symbol)
    const marketPrices = await getCurrentMarketPrices(symbols)

    let totalInvestedValue = 0
    let totalCurrentValue = 0
    let totalUnrealizedPnL = 0
    let totalDayPnL = 0

    const enrichedPositions = tradingAccount.positions.map(position => {
      const currentPrice = marketPrices[position.symbol] || position.averagePrice
      const investedValue = position.averagePrice * Math.abs(position.quantity)
      const currentValue = currentPrice * Math.abs(position.quantity)
      const unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity
      
      totalInvestedValue += investedValue
      totalCurrentValue += currentValue
      totalUnrealizedPnL += unrealizedPnL
      totalDayPnL += position.dayPnL || 0

      return {
        ...position,
        currentPrice,
        investedValue,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent: investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : 0,
      }
    })

    const totalPortfolioValue = Number(tradingAccount.balance) + totalCurrentValue
    const dayPnLPercent = totalInvestedValue > 0 ? (totalDayPnL / totalInvestedValue) * 100 : 0
    const marginUtilization = (Number(tradingAccount.availableMargin) + Number(tradingAccount.usedMargin)) > 0 
      ? (Number(tradingAccount.usedMargin) / (Number(tradingAccount.availableMargin) + Number(tradingAccount.usedMargin))) * 100 
      : 0

    const pendingOrders = tradingAccount.orders.filter(order => order.status === "PENDING")
    const recentOrders = tradingAccount.orders.slice(0, 5)

    return NextResponse.json({
      account: {
        balance: Number(tradingAccount.balance),
        availableMargin: Number(tradingAccount.availableMargin),
        usedMargin: Number(tradingAccount.usedMargin),
        totalPortfolioValue,
        marginUtilization,
      },
      portfolio: {
        totalInvestedValue,
        totalCurrentValue,
        totalUnrealizedPnL,
        totalDayPnL,
        dayPnLPercent,
        totalPositions: enrichedPositions.length,
        totalReturnPercent: totalInvestedValue > 0 ? (totalUnrealizedPnL / totalInvestedValue) * 100 : 0,
      },
      positions: enrichedPositions,
      orders: {
        pending: pendingOrders,
        recent: recentOrders,
        total: tradingAccount.orders.length,
      },
      transactions: tradingAccount.trades.map(trade => ({
        ...trade,
        amount: Number(trade.amount),
      })),
      isNewUser: tradingAccount.orders.length === 0 && tradingAccount.positions.length === 0,
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Portfolio API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getCurrentMarketPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {}
  
  const prices: Record<string, number> = {}
  
  for (const symbol of symbols) {
    const basePrice = 2000 + Math.random() * 1000
    const volatility = (Math.random() - 0.5) * 0.05
    prices[symbol] = basePrice * (1 + volatility)
  }
  
  return prices
}
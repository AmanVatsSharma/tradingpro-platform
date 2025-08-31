// app/api/stocks/route.ts - Search stocks for watchlist
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50) // Max 50 per page
    const sector = searchParams.get("sector")
    const exchange = searchParams.get("exchange")

    // Build search conditions
    const searchConditions = {
      isActive: true,
      ...(query && {
        OR: [
          { ticker: { contains: query.toUpperCase() } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }),
      ...(sector && { sector }),
      ...(exchange && { exchange }),
    }

    // Get total count for pagination
    const totalCount = await prisma.stock.count({
      where: searchConditions,
    })

    // Get stocks with pagination
    const stocks = await prisma.stock.findMany({
      where: searchConditions,
      orderBy: [
        { ticker: "asc" },
        { name: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        ticker: true,
        name: true,
        exchange: true,
        sector: true,
        ltp: true,
        change: true,
        changePercent: true,
        volume: true,
        high: true,
        low: true,
        open: true,
        close: true,
      },
    })

    // Add mock real-time price updates (replace with real market data)
    const enrichedStocks = stocks.map(stock => {
      const volatility = (Math.random() - 0.5) * 0.02 // ±1% random movement
      const newLtp = stock.ltp * (1 + volatility)
      const change = newLtp - stock.close
      const changePercent = stock.close > 0 ? (change / stock.close) * 100 : 0

      return {
        ...stock,
        ltp: Number(newLtp.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: stock.volume,
        marketCap: null, // Could calculate if you have shares outstanding
        isInWatchlist: false, // Will be updated below if needed
      }
    })

    // Check which stocks are in user's watchlist
    if (enrichedStocks.length > 0) {
      const userWatchlist = await prisma.watchlist.findFirst({
        where: { userId: session.user.id, name: "My Watchlist" },
        include: { items: { select: { stockId: true } } },
      })

      if (userWatchlist) {
        const watchlistStockIds = new Set(userWatchlist.items.map(item => item.stockId))
        enrichedStocks.forEach(stock => {
          stock.isInWatchlist = watchlistStockIds.has(stock.id)
        })
      }
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      stocks: enrichedStocks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        query,
        sector,
        exchange,
      },
    })

  } catch (error) {
    console.error("Stocks search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get popular/trending stocks for new users
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type = "popular" } = await request.json()

    let stocks;

    switch (type) {
      case "popular":
        // Most traded stocks (by volume)
        stocks = await prisma.stock.findMany({
          where: { isActive: true },
          orderBy: { volume: "desc" },
          take: 20,
          select: {
            id: true,
            ticker: true,
            name: true,
            exchange: true,
            sector: true,
            ltp: true,
            change: true,
            changePercent: true,
            volume: true,
          },
        })
        break

      case "gainers":
        // Top gainers
        stocks = await prisma.stock.findMany({
          where: { 
            isActive: true,
            changePercent: { gt: 0 }
          },
          orderBy: { changePercent: "desc" },
          take: 20,
          select: {
            id: true,
            ticker: true,
            name: true,
            exchange: true,
            sector: true,
            ltp: true,
            change: true,
            changePercent: true,
            volume: true,
          },
        })
        break

      case "losers":
        // Top losers
        stocks = await prisma.stock.findMany({
          where: { 
            isActive: true,
            changePercent: { lt: 0 }
          },
          orderBy: { changePercent: "asc" },
          take: 20,
          select: {
            id: true,
            ticker: true,
            name: true,
            exchange: true,
            sector: true,
            ltp: true,
            change: true,
            changePercent: true,
            volume: true,
          },
        })
        break

      case "nifty50":
        // Nifty 50 stocks (mock - you'd have this as a flag in your DB)
        stocks = await prisma.stock.findMany({
          where: { 
            isActive: true,
            ticker: { 
              in: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK", "KOTAKBANK", "SBIN", "BHARTIARTL", "ITC"]
            }
          },
          orderBy: { ticker: "asc" },
          select: {
            id: true,
            ticker: true,
            name: true,
            exchange: true,
            sector: true,
            ltp: true,
            change: true,
            changePercent: true,
            volume: true,
          },
        })
        break

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    return NextResponse.json({
      stocks,
      type,
      count: stocks.length,
      lastUpdated: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Popular stocks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
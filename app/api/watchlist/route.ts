// app/api/watchlist/route.ts - Complete implementation
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's default watchlist with stocks
    let watchlist = await prisma.watchlist.findFirst({
      where: {
        userId: session.user.id,
        name: "My Watchlist",
      },
      include: {
        items: {
          // include: {
          //   stock: true,
          // },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    // Create default watchlist if it doesn't exist
    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: {
          userId: session.user.id,
          name: "My Watchlist",
        },
        include: {
          items: {
            include: {
              stock: true,
            },
          },
        },
      })
    }

    const stocks = watchlist.items.map((item) => ({
      ...item.stockId,
      watchlistItemId: item.id,
      addedAt: item.createdAt,
    }))

    return NextResponse.json({ 
      watchlist: stocks,
      watchlistId: watchlist.id,
      totalItems: stocks.length 
    })
  } catch (error) {
    console.error("Watchlist API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stockId, symbol } = await request.json()
    
    if (!stockId && !symbol) {
      return NextResponse.json({ 
        error: "Either stockId or symbol is required" 
      }, { status: 400 })
    }

    // Find stock by ID or symbol
    let stock;
    if (stockId) {
      stock = await prisma.stock.findUnique({ where: { id: stockId } })
    } else if (symbol) {
      stock = await prisma.stock.findFirst({ where: { ticker: symbol.toUpperCase() } })
    }

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 })
    }

    // Get or create user's default watchlist
    let watchlist = await prisma.watchlist.findFirst({
      where: {
        userId: session.user.id,
        name: "My Watchlist",
      },
    })

    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: {
          userId: session.user.id,
          name: "My Watchlist",
        },
      })
    }

    // Check if stock already exists in watchlist
    const existingItem = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_stockId: {
          watchlistId: watchlist.id,
          stockId: stock.id,
        }
      }
    })

    if (existingItem) {
      return NextResponse.json({ 
        error: "Stock already in watchlist",
        stock: stock 
      }, { status: 409 })
    }

    // Add stock to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        stockId: stock.id,
      },
      include: {
        stock: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      stock: {
        ...watchlistItem.stock,
        watchlistItemId: watchlistItem.id,
        addedAt: watchlistItem.createdAt,
      }
    })
  } catch (error) {
    console.error("Add to watchlist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stockId = searchParams.get("stockId")
    const symbol = searchParams.get("symbol")

    if (!stockId && !symbol) {
      return NextResponse.json({ 
        error: "Either stockId or symbol parameter is required" 
      }, { status: 400 })
    }

    // Find user's watchlist
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        userId: session.user.id,
        name: "My Watchlist",
      },
    })

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 })
    }

    let targetStockId = stockId;
    
    // If symbol provided, find the stock ID
    if (!stockId && symbol) {
      const stock = await prisma.stock.findFirst({ 
        where: { ticker: symbol.toUpperCase() } 
      })
      if (!stock) {
        return NextResponse.json({ error: "Stock not found" }, { status: 404 })
      }
      targetStockId = stock.id
    }

    // Remove stock from watchlist
    const deletedItem = await prisma.watchlistItem.delete({
      where: {
        watchlistId_stockId: {
          watchlistId: watchlist.id,
          stockId: targetStockId!,
        },
      },
    }).catch(() => null)

    if (!deletedItem) {
      return NextResponse.json({ 
        error: "Stock not found in watchlist" 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Stock removed from watchlist" 
    })
  } catch (error) {
    console.error("Remove from watchlist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
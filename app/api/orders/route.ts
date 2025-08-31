// app/api/orders/route.ts - IMPROVED VERSION
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const orderSchema = z.object({
  symbol: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/),
  quantity: z.number().int().min(1).max(10000),
  price: z.number().positive().optional(),
  orderType: z.enum(["MARKET", "LIMIT"]),
  orderSide: z.enum(["BUY", "SELL"]),
  productType: z.enum(["MIS", "CNC"]).default("MIS"),
  stopLoss: z.number().positive().optional(),
  target: z.number().positive().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = orderSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { symbol, quantity, price, orderType, orderSide, productType, stopLoss, target } = validationResult.data

    // Validate price for limit orders
    if (orderType === "LIMIT" && !price) {
      return NextResponse.json({ error: "Price required for limit orders" }, { status: 400 })
    }

    // Get user's trading account with current positions
    const tradingAccount = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id },
      include: {
        positions: {
          where: { symbol }
        }
      }
    })

    if (!tradingAccount) {
      return NextResponse.json({ error: "Trading account not found" }, { status: 404 })
    }

    // Get current stock price (mock - replace with real data)
    const currentPrice = price || (Math.random() * 100 + 2000)
    
    // Calculate order value and required margin
    const orderValue = quantity * currentPrice
    const marginMultiplier = getMarginMultiplier(symbol) // Implement this based on instrument
    const requiredMargin = orderValue * marginMultiplier

    // Validate sufficient funds/margin
    if (orderSide === "BUY") {
      if (tradingAccount.availableMargin < requiredMargin) {
        return NextResponse.json({ 
          error: "Insufficient margin",
          required: requiredMargin,
          available: tradingAccount.availableMargin
        }, { status: 400 })
      }
    } else { // SELL
      const position = tradingAccount.positions[0]
      if (!position || position.quantity < quantity) {
        return NextResponse.json({ 
          error: "Insufficient position to sell",
          available: position?.quantity || 0,
          requested: quantity
        }, { status: 400 })
      }
    }

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          tradingAccountId: tradingAccount.id,
          symbol,
          quantity,
          price: price || null,
          orderType,
          orderSide,
          productType,
          status: "PENDING",
        },
      })

      // Update margin for buy orders
      if (orderSide === "BUY") {
        await tx.tradingAccount.update({
          where: { id: tradingAccount.id },
          data: {
            availableMargin: tradingAccount.availableMargin - requiredMargin,
            usedMargin: tradingAccount.usedMargin + requiredMargin,
          },
        })
      }

      return order
    })

    // Simulate order execution (replace with real broker integration)
    processOrderExecution(result.id, currentPrice)

    return NextResponse.json({
      success: true,
      orderId: result.id,
      message: "Order placed successfully",
      estimatedPrice: currentPrice
    })

  } catch (error) {
    console.error("Order placement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")

    const tradingAccount = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id },
      include: {
        orders: {
          where: status ? { status } : undefined,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        },
      },
    })

    if (!tradingAccount) {
      return NextResponse.json({ error: "Trading account not found" }, { status: 404 })
    }

    return NextResponse.json({
      orders: tradingAccount.orders,
      pagination: {
        page,
        limit,
        total: await prisma.order.count({
          where: { 
            tradingAccountId: tradingAccount.id,
            ...(status && { status })
          }
        })
      }
    })

  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions
function getMarginMultiplier(symbol: string): number {
  // Implement margin requirements based on instrument type
  // This should come from your broker's margin requirements
  const margins = {
    'NIFTY': 0.15,      // 15% for index futures
    'BANKNIFTY': 0.20,  // 20% for bank nifty
    'DEFAULT': 0.20     // 20% default for equity
  }
  
  return margins[symbol as keyof typeof margins] || margins.DEFAULT
}

async function processOrderExecution(orderId: string, estimatedPrice: number) {
  // Simulate execution delay
  setTimeout(async () => {
    try {
      const executionPrice = estimatedPrice * (1 + (Math.random() - 0.5) * 0.001) // Small slippage
      
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { tradingAccount: true }
        })

        if (!order || order.status !== "PENDING") return

        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "COMPLETED",
            filledQuantity: order.quantity,
            averagePrice: executionPrice,
            executedAt: new Date(),
          },
        })

        // Update or create position
        const existingPosition = await tx.position.findFirst({
          where: {
            tradingAccountId: order.tradingAccountId,
            symbol: order.symbol,
          },
        })

        if (existingPosition) {
          const newQuantity = order.orderSide === "BUY" 
            ? existingPosition.quantity + order.quantity
            : existingPosition.quantity - order.quantity

          if (newQuantity === 0) {
            // Close position
            await tx.position.delete({
              where: { id: existingPosition.id }
            })
          } else {
            // Update position with new average price
            const totalValue = (existingPosition.quantity * existingPosition.averagePrice) + 
              (order.quantity * executionPrice * (order.orderSide === "BUY" ? 1 : -1))
            const newAvgPrice = Math.abs(totalValue / newQuantity)

            await tx.position.update({
              where: { id: existingPosition.id },
              data: {
                quantity: newQuantity,
                averagePrice: newAvgPrice,
              },
            })
          }
        } else if (order.orderSide === "BUY") {
          // Create new position
          await tx.position.create({
            data: {
              tradingAccountId: order.tradingAccountId,
              symbol: order.symbol,
              quantity: order.quantity,
              averagePrice: executionPrice,
              unrealizedPnL: 0,
              dayPnL: 0,
            },
          })
        }
      })

    } catch (error) {
      console.error("Order execution error:", error)
      // Mark order as failed
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }
      })
    }
  }, Math.random() * 3000 + 1000) // Random delay 1-4 seconds
}
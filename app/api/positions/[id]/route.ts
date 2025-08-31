// app/api/positions/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { action } = body

    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (position.tradingAccount.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "close") {
      // Create a market order to close the position
      const closeOrder = await prisma.order.create({
        data: {
          tradingAccountId: position.tradingAccountId,
          symbol: position.symbol,
          quantity: Math.abs(position.quantity),
          orderType: "MARKET",
          orderSide: position.quantity > 0 ? "SELL" : "BUY",
          productType: "MIS",
          status: "PENDING",
        },
      })

      // Simulate immediate execution for market orders
      setTimeout(async () => {
        try {
          const currentPrice = position.averagePrice * (1 + (Math.random() - 0.5) * 0.02)

          await prisma.order.update({
            where: { id: closeOrder.id },
            data: {
              status: "COMPLETED",
              filledQuantity: Math.abs(position.quantity),
              averagePrice: currentPrice,
            },
          })

          // Close the position
          await prisma.position.delete({
            where: { id: position.id },
          })

          // Update account balance with realized P&L
          const realizedPnL = (currentPrice - position.averagePrice) * position.quantity
          await prisma.tradingAccount.update({
            where: { id: position.tradingAccountId },
            data: {
              balance: position.tradingAccount.balance + realizedPnL,
            },
          })
        } catch (error) {
          console.error("Position close execution error:", error)
        }
      }, 1000)

      return NextResponse.json({
        success: true,
        message: "Position close order placed",
        orderId: closeOrder.id,
      })
    }

    if (action === "update_stop_loss") {
      const { stopLoss } = body

      await prisma.position.update({
        where: { id },
        data: { stopLoss },
      })

      return NextResponse.json({ success: true, message: "Stop loss updated" })
    }

    if (action === "update_target") {
      const { target } = body

      await prisma.position.update({
        where: { id },
        data: { target },
      })

      return NextResponse.json({ success: true, message: "Target updated" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Position management error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// app/api/orders/[id]/route.tssssss
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.tradingAccount.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "cancel") {
      if (order.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 })
      }

      await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      })

      // Release margin for buy orders
      if (order.orderSide === "BUY") {
        const orderValue = order.quantity * (order.price || 0)
        const requiredMargin = orderValue * 0.2

        await prisma.tradingAccount.update({
          where: { id: order.tradingAccountId },
          data: {
            availableMargin: order.tradingAccount.availableMargin + requiredMargin,
            usedMargin: order.tradingAccount.usedMargin - requiredMargin,
          },
        })
      }

      return NextResponse.json({ success: true, message: "Order cancelled successfully" })
    }

    if (action === "modify") {
      const { price, quantity } = body

      if (order.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending orders can be modified" }, { status: 400 })
      }

      await prisma.order.update({
        where: { id },
        data: {
          price: price || order.price,
          quantity: quantity || order.quantity,
        },
      })

      return NextResponse.json({ success: true, message: "Order modified successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Order management error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.tradingAccount.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status === "PENDING") {
      // Release margin for buy orders
      if (order.orderSide === "BUY") {
        const orderValue = order.quantity * (order.price || 0)
        const requiredMargin = orderValue * 0.2

        await prisma.tradingAccount.update({
          where: { id: order.tradingAccountId },
          data: {
            availableMargin: order.tradingAccount.availableMargin + requiredMargin,
            usedMargin: order.tradingAccount.usedMargin - requiredMargin,
          },
        })
      }
    }

    await prisma.order.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Order deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

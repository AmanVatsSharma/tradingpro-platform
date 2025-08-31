import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const exchange = searchParams.get("exchange")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
    }

    const whereClause = {
      isActive: true,
      OR: [
        { ticker: { contains: query, mode: "insensitive" as const } },
        { name: { contains: query, mode: "insensitive" as const } },
      ],
      ...(exchange && { exchange }),
    }

    const stocks = await prisma.stock.findMany({
      where: whereClause,
      take: limit,
      orderBy: [{ ticker: "asc" }, { name: "asc" }],
      select: {
        id: true,
        instrumentId: true,
        exchange: true,
        ticker: true,
        name: true,
        ltp: true,
        change: true,
        changePercent: true,
        sector: true,
      },
    })

    return NextResponse.json({ stocks })
  } catch (error) {
    console.error("Stock search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

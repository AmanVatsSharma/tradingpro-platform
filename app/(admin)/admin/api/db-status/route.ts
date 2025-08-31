// app/api/admin/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`; // check DB
    const latest = await prisma.vortexSession.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      db: "✅ Connected",
      token: latest?.accessToken || null,
    });
  } catch (err) {
    return NextResponse.json({ db: "❌ Not Connected", token: null });
  }
}

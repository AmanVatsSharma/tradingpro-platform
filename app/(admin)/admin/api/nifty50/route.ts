// app/api/nifty50/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await prisma.vortexSession.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json({ error: "No token found" }, { status: 400 });
    }

    // Example NIFTY 50 instruments (replace with full list from instrument master)
    const instruments = [
      "NSE_EQ-26000", // NIFTY 50 Index
      "NSE_EQ-26009", // Reliance
      "NSE_EQ-1330",  // HDFC Bank
      "NSE_EQ-1594",  // Infosys
    ];

    const url = `https://vortex-api.rupeezy.in/v2/data/quotes?q=${instruments.join("&")}&mode=ltp`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

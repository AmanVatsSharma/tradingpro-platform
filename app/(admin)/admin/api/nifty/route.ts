// app/api/nifty/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // latest access token
    const session = await prisma.vortexSession.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json({ error: "No token found" }, { status: 400 });
    }

    // Example endpoint (replace with actual Vortex/Rupeezy ticker API)
    const url = "https://vortex-api.rupeezy.in/v2/data/quotes?q=NSE_EQ-22&q=NSE_EQ-26009&mode=ltp";
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

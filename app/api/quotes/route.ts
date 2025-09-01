// app/api/quotes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function GET(request: Request) {
  // 1. Read the API key from environment variables
  const apiKey = process.env.VORTEX_X_API_KEY;

  // 2. Add a guard clause to check if the key exists
  if (!apiKey) {
    console.error("VORTEX_X_API_KEY is not defined in environment variables.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    const session = await prisma.vortexSession.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!session?.accessToken) {
      return NextResponse.json({ error: "No active session token found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const instruments = searchParams.getAll('q');
    const mode = searchParams.get('mode') || 'ltp';

    if (instruments.length === 0) {
        return NextResponse.json({ error: "Query parameter 'q' is required." }, { status: 400 });
    }

    const queryString = instruments.map(inst => `q=${encodeURIComponent(inst)}`).join('&');
    const url = `https://vortex-api.rupeezy.in/v2/data/quotes?${queryString}&mode=${mode}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'x-api-key': apiKey,
      },
    });

    return NextResponse.json(response.data);
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.error("Axios error:", err.response?.data);
      return NextResponse.json(
        { error: "Failed to fetch from Vortex API", details: err.response?.data },
        { status: err.response?.status || 500 }
      );
    }
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET() {
    // 1. Read the API key from environment variables
    const apiKey = process.env.VORTEX_X_API_KEY;

    // 2. Add a guard clause to check if the key exists
    if (!apiKey) {
        console.error("VORTEX_X_API_KEY is not defined in environment variables.");
        // Return a server error response, not a client error
        return NextResponse.json(
            { error: "Server configuration error." },
            { status: 500 }
        );
    }

    try {
        // find latest vortex session 
        const session = await prisma.vortexSession.findFirst({
            orderBy: { createdAt: "desc" },
        });

        if (!session?.accessToken) {
            return NextResponse.json({ error: "No active session token found" }, { status: 401 });
        }

        // fetch instruments from vortex api 
        const apiUrl = `https://vortex-api.rupeezy.in/v2/data/instruments`
        // Axios request 
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'x-api-key': apiKey,
            },
        });

        return NextResponse.json(response.data);
    } catch (err: any) {
        // Axios provides better details on request errors
        if (axios.isAxiosError(err)) {
            console.error("Axios error:", err.response?.data);
            return NextResponse.json(
                { error: "Failed to fetch from Vortex API", details: err.response?.data },
                { status: err.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
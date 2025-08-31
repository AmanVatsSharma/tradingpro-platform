// app/api/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const authToken = searchParams.get("auth");

    if (!authToken) {
        return NextResponse.json({ error: "Missing auth token" }, { status: 400 });
    }

    const appId = process.env.VORTEX_APPLICATION_ID!;
    const apiKey = process.env.VORTEX_X_API_KEY!;

    const raw = appId + authToken + apiKey;
    const checksum = crypto.createHash("sha256").update(raw).digest("hex");

    const res = await fetch("https://vortex-api.rupeezy.in/v2/user/session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({
            checksum,
            applicationId: appId,
            token: authToken,
        }),
    });

    const data = await res.json();

    if (data.status === "success") {
        await prisma.vortexSession.create({
            data: {
                userId: 1, // admin ka ID, ya jo bhi current user hai
                accessToken: data.data.access_token,
            },
        });
        return NextResponse.redirect("http://localhost:3000/admin/dashboard");
    } else {
        return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }
}

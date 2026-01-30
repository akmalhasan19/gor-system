import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { external_id, amount } = body;

        if (!external_id || !amount) {
            return NextResponse.json(
                { error: "Missing required fields: external_id, amount" },
                { status: 400 }
            );
        }

        const secretKey = process.env.XENDIT_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json(
                { error: "Server configuration error: XENDIT_SECRET_KEY missing" },
                { status: 500 }
            );
        }

        // Call Xendit Simulate Endpoint
        // POST https://api.xendit.co/callback_virtual_accounts/{external_id}/simulate_payment
        const xenditRes = await fetch(
            `https://api.xendit.co/callback_virtual_accounts/${external_id}/simulate_payment`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
                },
                body: JSON.stringify({ amount }),
            }
        );

        const xenditData = await xenditRes.json();

        if (!xenditRes.ok) {
            console.error("Xendit Simulation Error:", xenditData);
            return NextResponse.json(
                { error: `Xendit Error: ${JSON.stringify(xenditData)}` },
                { status: xenditRes.status }
            );
        }

        return NextResponse.json({
            success: true,
            data: xenditData,
        });
    } catch (error: any) {
        console.error("Simulation Logic Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

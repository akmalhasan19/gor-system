import { NextRequest, NextResponse } from "next/server";
import { XenditService } from "@/lib/xendit";

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

        console.log(`Simulating Payment for External ID: ${external_id}, Amount: ${amount}`);

        try {
            // Debug: Check if VA exists first
            try {
                const vaCheck = await XenditService.getVA(external_id);
                console.log("VA Existence Check:", vaCheck ? "Found" : "Not Found", vaCheck);
            } catch (checkErr: any) {
                console.error("VA Existence Check Failed:", checkErr.response?.data || checkErr.message);
                // Continue anyway to see if simulate works (some APIs differ)
            }

            const xenditData = await XenditService.simulateVA(external_id, amount);
            console.log("Xendit Simulation Success:", xenditData);

            return NextResponse.json({
                success: true,
                data: xenditData,
            });
        } catch (xenditError: any) {
            console.error("Xendit Simulation Failed:", xenditError.response?.data || xenditError.message);
            return NextResponse.json(
                {
                    error: "Xendit Simulation Error",
                    details: xenditError.response?.data || xenditError.message
                },
                { status: xenditError.response?.status || 500 }
            );
        }

    } catch (error: any) {
        console.error("Simulation Logic Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

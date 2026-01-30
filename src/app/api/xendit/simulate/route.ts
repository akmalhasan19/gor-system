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

            // AUTO-UPDATE DATABASE FOR LOCALHOST/DEV EXPERIENCE
            // Since webhooks might not reach localhost, we manually update the status here

            // 1. Initialize Supabase Admin
            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        persistSession: false,
                    },
                }
            );

            // 2. Find the payment
            const { data: payment, error: fetchError } = await supabaseAdmin
                .from('payments')
                .select('*')
                .eq('external_id', external_id)
                .single();

            if (!fetchError && payment) {
                // 3. Update Payment Status
                await supabaseAdmin
                    .from('payments')
                    .update({
                        status: 'PAID',
                        updated_at: new Date().toISOString(),
                        metadata: { ...payment.metadata, simulation: true, xendit_response: xenditData }
                    })
                    .eq('id', payment.id);

                // 4. Update Transaction Status
                let transactionMethod = 'TRANSFER';
                if (payment.payment_method === 'QRIS') transactionMethod = 'QRIS';

                await supabaseAdmin
                    .from('transactions')
                    .update({
                        status: 'PAID',
                        payment_method: transactionMethod,
                        paid_amount: amount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.transaction_id);

                console.log('Simulate: Manually updated Payment and Transaction to PAID');
            }

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

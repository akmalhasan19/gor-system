import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { XenditService } from '@/lib/xendit';
import { validateRequestBody, CreatePaymentSchema } from '@/lib/validation';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
        },
    }
);

export async function POST(req: Request) {
    try {
        // Validate input with Zod schema
        const validation = await validateRequestBody(req, CreatePaymentSchema);
        if (!validation.success) return validation.error;

        const { transactionId, amount, paymentMethod, paymentChannel, customerName } = validation.data;

        console.log('Creating Payment:', { transactionId, amount, paymentMethod, paymentChannel });


        // 1. Verify Transaction exists
        const { data: transaction, error: fetchError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchError || !transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const externalId = `txn-${transactionId}-${Date.now()}`;
        let paymentData: any = {};
        let xenditResponse: any;

        // 2. Call Xendit API via helper
        if (paymentMethod === 'VA') {
            // Virtual Account
            xenditResponse = await XenditService.createVA({
                external_id: externalId,
                bank_code: paymentChannel || 'BCA',
                name: customerName || 'PELANGGAN',
                expected_amt: amount,
                is_closed: true,
                is_single_use: true,
                expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

            paymentData = {
                xendit_id: xenditResponse.id,
                xendit_virtual_account_number: xenditResponse.account_number,
                xendit_expiry_date: xenditResponse.expiration_date,
                status: 'PENDING'
            };

        } else if (paymentMethod === 'QRIS') {
            // QR Code
            xenditResponse = await XenditService.createQRCode({
                external_id: externalId,
                type: 'DYNAMIC',
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/xendit`,
                amount: amount,
            });

            paymentData = {
                xendit_id: xenditResponse.id,
                xendit_qr_string: xenditResponse.qr_string,
                xendit_expiry_date: xenditResponse.expires_at,
                status: xenditResponse.status
            };
        } else {
            return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
        }

        // 3. Save to Payments Table
        const { error: insertError } = await supabaseAdmin
            .from('payments')
            .insert({
                transaction_id: transactionId,
                external_id: externalId,
                amount: amount,
                status: 'PENDING',
                payment_method: paymentMethod,
                payment_channel: paymentChannel,
                xendit_id: paymentData.xendit_id,
                xendit_virtual_account_number: paymentData.xendit_virtual_account_number,
                xendit_qr_string: paymentData.xendit_qr_string,
                xendit_expiry_date: paymentData.xendit_expiry_date,
                metadata: xenditResponse
            });

        if (insertError) {
            console.error('Payment Insert Error:', insertError);
            return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: paymentData });

    } catch (e: any) {
        // Detailed Error Logging
        if (e.response?.data) {
            console.error('Xendit/API Error Response:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error('Payment API Error (No response data):', e);
        }

        const msg = e.response?.data?.message || e.message || 'Internal Server Error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

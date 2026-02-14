import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureRealQrisOrThrow, XenditService } from '@/lib/xendit';
import { validateRequestBody, CreatePaymentSchema } from '@/lib/validation';
import axios from 'axios';

interface XenditVAResponse extends Record<string, unknown> {
    id?: string;
    account_number?: string;
    expiration_date?: string;
}

interface XenditQRResponse extends Record<string, unknown> {
    id?: string;
    qr_string?: string;
    expires_at?: string;
    status?: string;
}

interface PaymentData {
    external_id: string;
    xendit_id?: string;
    xendit_virtual_account_number?: string;
    xendit_qr_string?: string;
    xendit_expiry_date?: string;
    status: string;
}

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
        let paymentData: PaymentData;
        let xenditResponse: Record<string, unknown> = {};

        // 2. Call Xendit API via helper
        if (paymentMethod === 'VA') {
            // Virtual Account
            const vaResponse = await XenditService.createVA({
                external_id: externalId,
                bank_code: paymentChannel || 'BCA',
                name: customerName || 'PELANGGAN',
                expected_amt: amount,
                is_closed: true,
                is_single_use: true,
                expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });
            xenditResponse = vaResponse as XenditVAResponse;

            paymentData = {
                external_id: externalId,
                xendit_id: (vaResponse as XenditVAResponse).id,
                xendit_virtual_account_number: (vaResponse as XenditVAResponse).account_number,
                xendit_expiry_date: (vaResponse as XenditVAResponse).expiration_date,
                status: 'PENDING'
            };

        } else if (paymentMethod === 'QRIS') {
            // QR Code
            const qrResponse = await XenditService.createQRCode({
                external_id: externalId,
                type: 'DYNAMIC',
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/xendit`,
                amount: amount,
            });
            ensureRealQrisOrThrow(qrResponse);
            xenditResponse = qrResponse as XenditQRResponse;

            paymentData = {
                external_id: externalId,
                xendit_id: (qrResponse as XenditQRResponse).id,
                xendit_qr_string: (qrResponse as XenditQRResponse).qr_string,
                xendit_expiry_date: (qrResponse as XenditQRResponse).expires_at,
                status: (qrResponse as XenditQRResponse).status || 'PENDING'
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

    } catch (error: unknown) {
        // Detailed Error Logging
        if (axios.isAxiosError(error) && error.response?.data) {
            console.error('Xendit/API Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Payment API Error (No response data):', error);
        }

        const msg = axios.isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message || error.message
            : error instanceof Error
                ? error.message
                : 'Internal Server Error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

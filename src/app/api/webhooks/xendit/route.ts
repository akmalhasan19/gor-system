import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyXenditWebhook } from '@/lib/xendit-webhook-validator';

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
        // Get raw body for signature verification (must be done before JSON parsing)
        const rawBody = await req.text();

        // Get signature headers
        const callbackSignature = req.headers.get('x-callback-signature');
        const callbackToken = req.headers.get('x-callback-token');
        const webhookSecret = process.env.XENDIT_WEBHOOK_SECRET;
        const validToken = process.env.XENDIT_CALLBACK_TOKEN;

        console.log('[Xendit Webhook] Received webhook');
        console.log('[Xendit Webhook] Headers:', {
            'x-callback-signature': callbackSignature ? '(present)' : '(missing)',
            'x-callback-token': callbackToken ? '(present)' : '(missing)',
            'content-length': req.headers.get('content-length')
        });
        console.log('[Xendit Webhook] Config:', {
            'XENDIT_WEBHOOK_SECRET': webhookSecret ? '(configured)' : '(missing)',
            'XENDIT_CALLBACK_TOKEN': validToken ? '(configured)' : '(missing)'
        });

        // Try HMAC signature verification first (more secure)
        if (webhookSecret) {
            console.log('[Xendit Webhook] Verifying via Signature...');
            // Parse body to get timestamp for replay attack prevention
            let body: any;
            try {
                body = JSON.parse(rawBody);
            } catch {
                console.error('[Xendit Webhook] Invalid JSON body');
                return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
            }

            const verification = verifyXenditWebhook(
                rawBody,
                callbackSignature,
                webhookSecret,
                body.created || body.updated // Use available timestamp
            );

            if (!verification.valid) {
                console.warn('[Xendit Webhook] Verification failed:', verification.error);
                // Log expected vs received for debugging (be careful with secrets in prod logs usually, but helpful here)
                // console.log('Expected:', verification.expected);
                // console.log('Received:', verification.received);
                return NextResponse.json({ error: 'Unauthorized', details: verification.error }, { status: 401 });
            }
            console.log('[Xendit Webhook] Signature verified successfully');
        } else if (validToken) {
            console.log('[Xendit Webhook] Verifying via Token...');
            // Fallback to token validation if signature not configured
            if (callbackToken !== validToken) {
                console.warn('[Xendit Webhook] Invalid Xendit Callback Token');
                console.warn(`[Xendit Webhook] Received: ${callbackToken}, Expected: ${validToken}`);
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            console.log('[Xendit Webhook] Token verified successfully');
        } else {
            console.warn('[Xendit Webhook] No verification method configured (Secret or Token missing)');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Parse the body (already parsed above if signature verification was used)
        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        console.log('Xendit Webhook:', JSON.stringify(body, null, 2));

        const externalId = body.external_id;
        const status = body.status; // 'PAID', 'COMPLETED', 'ACTIVE', 'EXPIRED', 'FAILED'

        if (!externalId) {
            return NextResponse.json({ message: 'No external_id provided' }, { status: 200 });
        }

        // Find the payment
        const { data: payment, error } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('external_id', externalId)
            .single();

        if (error || !payment) {
            console.warn('Payment not found for external_id:', externalId);
            return NextResponse.json({ message: 'Payment not found' }, { status: 200 });
        }

        // Check for success status
        // For Virtual Accounts, the event is usually just a payment notification. 
        // We assume any payment callback with amount > 0 is a success for VA.
        // For QR codes, status must be 'COMPLETED' or 'PAID'.

        let isPaid = false;
        if (status === 'COMPLETED' || status === 'PAID' || status === 'SETTLED') {
            isPaid = true;
        } else if (body.amount && payment.payment_method === 'VA') {
            // Callback for VA usually implies payment received
            isPaid = true;
        }

        if (isPaid) {
            // Update Payment Status
            const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({
                    status: 'PAID',
                    updated_at: new Date().toISOString(),
                    metadata: body
                })
                .eq('id', payment.id);

            if (updateError) throw updateError;

            // Map payment method for transaction
            let transactionMethod = 'TRANSFER';
            if (payment.payment_method === 'QRIS') transactionMethod = 'QRIS';

            // Update Transaction Status
            const { error: txnError } = await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'PAID',
                    payment_method: transactionMethod,
                    paid_amount: body.amount || payment.amount, // Use actual paid amount if available
                    updated_at: new Date().toISOString()
                })
                .eq('id', payment.transaction_id);

            if (txnError) throw txnError;

            console.log(`Payment ${payment.id} and Transaction ${payment.transaction_id} updated to PAID`);

        } else if (status === 'EXPIRED' || status === 'FAILED') {
            await supabaseAdmin
                .from('payments')
                .update({
                    status: status,
                    updated_at: new Date().toISOString(),
                    metadata: body
                })
                .eq('id', payment.id);

            // Optionally update transaction to FAILED or CANCELLED if supported
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Webhook Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { createClient } from '@supabase/supabase-js';
import { ensureRealQrisOrThrow, XenditService } from '@/lib/xendit';
import {
    PLAN_FEATURES,
    SubscriptionPaymentChannel,
    SubscriptionPaymentMethod,
    SubscriptionPaymentStatus,
    SubscriptionPlan,
} from '@/lib/constants/plans';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
        },
    }
);

export interface SubscriptionPaymentRecord {
    subscriptionPaymentId: string;
    venueId: string;
    targetPlan: SubscriptionPlan;
    amount: number;
    status: SubscriptionPaymentStatus;
    external_id: string;
    xendit_id: string | null;
    payment_method: SubscriptionPaymentMethod;
    payment_channel: SubscriptionPaymentChannel | null;
    xendit_qr_string: string | null;
    xendit_virtual_account_number: string | null;
    xendit_expiry_date: string | null;
}

interface CreateSubscriptionPaymentParams {
    venueId: string;
    targetPlan: SubscriptionPlan;
    paymentMethod: SubscriptionPaymentMethod;
    paymentChannel?: SubscriptionPaymentChannel;
    customerName?: string;
    metadata?: Record<string, unknown>;
    callbackBaseUrl?: string;
}

interface XenditVAResponse extends Record<string, unknown> {
    id?: string;
    account_number?: string;
    expiration_date?: string;
}

interface XenditQRResponse extends Record<string, unknown> {
    id?: string;
    qr_string?: string;
    expires_at?: string;
}

function createExternalId(venueId: string) {
    const shortVenue = venueId.replace(/-/g, '').slice(0, 12);
    return `sub-${shortVenue}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function createCallbackUrl(baseUrl?: string) {
    const base = (baseUrl || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    return base ? `${base}/api/webhooks/xendit` : undefined;
}

export async function createSubscriptionPayment(params: CreateSubscriptionPaymentParams): Promise<SubscriptionPaymentRecord> {
    const {
        venueId,
        targetPlan,
        paymentMethod,
        paymentChannel,
        customerName,
        metadata,
        callbackBaseUrl,
    } = params;

    const amount = PLAN_FEATURES[targetPlan].priceMonthly;
    const externalId = createExternalId(venueId);

    let xenditResponse: Record<string, unknown> = {};
    let xenditId: string | null = null;
    let qrString: string | null = null;
    let vaNumber: string | null = null;
    let expiryDate: string | null = null;

    if (paymentMethod === 'VA') {
        if (!paymentChannel) {
            throw new Error('paymentChannel is required for VA payments');
        }

        const vaResponse = await XenditService.createVA({
            external_id: externalId,
            bank_code: paymentChannel,
            name: customerName || 'SMASH PARTNER',
            expected_amt: amount,
            is_closed: true,
            is_single_use: true,
            expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        xenditResponse = vaResponse as XenditVAResponse;
        xenditId = (vaResponse as XenditVAResponse).id || null;
        vaNumber = (vaResponse as XenditVAResponse).account_number || null;
        expiryDate = (vaResponse as XenditVAResponse).expiration_date || null;
    } else {
        const callbackUrl = createCallbackUrl(callbackBaseUrl);

        const qrResponse = await XenditService.createQRCode({
            external_id: externalId,
            type: 'DYNAMIC',
            callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/xendit`,
            amount,
        });
        ensureRealQrisOrThrow(qrResponse);

        xenditResponse = qrResponse as XenditQRResponse;
        xenditId = (qrResponse as XenditQRResponse).id || null;
        qrString = (qrResponse as XenditQRResponse).qr_string || null;
        expiryDate = (qrResponse as XenditQRResponse).expires_at || null;
    }

    const { data, error } = await supabaseAdmin
        .from('subscription_payments')
        .insert({
            venue_id: venueId,
            target_plan: targetPlan,
            amount,
            status: 'PENDING',
            external_id: externalId,
            xendit_id: xenditId,
            payment_method: paymentMethod,
            payment_channel: paymentMethod === 'VA' ? paymentChannel || null : null,
            xendit_qr_string: qrString,
            xendit_virtual_account_number: vaNumber,
            xendit_expiry_date: expiryDate,
            metadata: {
                ...(metadata || {}),
                xendit_response: xenditResponse,
            },
        })
        .select('*')
        .single();

    if (error || !data) {
        throw new Error(`Failed to create subscription payment: ${error?.message || 'unknown error'}`);
    }

    return {
        subscriptionPaymentId: data.id,
        venueId: data.venue_id,
        targetPlan: data.target_plan as SubscriptionPlan,
        amount: Number(data.amount),
        status: data.status as SubscriptionPaymentStatus,
        external_id: data.external_id,
        xendit_id: data.xendit_id,
        payment_method: data.payment_method as SubscriptionPaymentMethod,
        payment_channel: (data.payment_channel as SubscriptionPaymentChannel | null) || null,
        xendit_qr_string: data.xendit_qr_string,
        xendit_virtual_account_number: data.xendit_virtual_account_number,
        xendit_expiry_date: data.xendit_expiry_date,
    };
}


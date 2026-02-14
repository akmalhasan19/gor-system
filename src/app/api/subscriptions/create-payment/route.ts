import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validateRequestBody, CreateSubscriptionPaymentSchema } from '@/lib/validation';
import { createSubscriptionPayment } from '@/lib/subscription-payments';

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value;
                    },
                    set() { },
                    remove() { },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - User not authenticated' },
                { status: 401 }
            );
        }

        const validation = await validateRequestBody(request, CreateSubscriptionPaymentSchema);
        if (!validation.success) return validation.error;

        const { venueId, targetPlan, paymentMethod, paymentChannel } = validation.data;

        const { data: membership, error: membershipError } = await supabase
            .from('user_venues')
            .select('role')
            .eq('venue_id', venueId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json(
                { success: false, error: 'Forbidden - venue does not belong to user' },
                { status: 403 }
            );
        }

        if (membership.role === 'staff') {
            return NextResponse.json(
                { success: false, error: 'Forbidden - insufficient role to create subscription payment' },
                { status: 403 }
            );
        }

        const payment = await createSubscriptionPayment({
            venueId,
            targetPlan,
            paymentMethod,
            paymentChannel,
            callbackBaseUrl: new URL(request.url).origin,
            metadata: {
                source: 'BILLING',
                requested_by: user.id,
            },
        });

        const { error: pendingError } = await supabase
            .from('venues')
            .update({
                pending_subscription_plan: targetPlan,
                pending_subscription_effective_date: new Date().toISOString(),
            })
            .eq('id', venueId);

        if (pendingError) {
            console.warn('Failed to update pending subscription fields:', pendingError);
        }

        return NextResponse.json({
            success: true,
            payment,
            subscriptionPaymentId: payment.subscriptionPaymentId,
            external_id: payment.external_id,
        });
    } catch (error: unknown) {
        console.error('Create subscription payment error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create subscription payment',
            },
            { status: 500 }
        );
    }
}


import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validateRequest, OnboardingSubmitSchema } from '@/lib/validation';
import { createSubscriptionPayment } from '@/lib/subscription-payments';

const TRIAL_DAYS = 7;

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

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const validation = validateRequest(OnboardingSubmitSchema, body);
        if (!validation.success) return validation.error;

        const {
            venueName,
            address,
            phone,
            courtsCount,
            operatingHoursStart,
            operatingHoursEnd,
            hourlyRatePerCourt,
            subscriptionPlan,
            selectedPlan,
            checkoutAction,
            paymentMethod,
            paymentChannel,
            xendit_account_id,
        } = validation.data;

        const desiredPlan = selectedPlan || subscriptionPlan || 'STARTER';

        const { data: existingVenue } = await supabase
            .from('user_venues')
            .select('venue_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

        let venueId = existingVenue?.venue_id || null;
        let createdNewVenue = false;

        if (!venueId) {
            const trialValidUntil = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

            const { data: venueRow, error: venueError } = await supabase
                .from('venues')
                .insert({
                    name: venueName,
                    address: address || null,
                    phone: phone || null,
                    operating_hours_start: operatingHoursStart || 8,
                    operating_hours_end: operatingHoursEnd || 23,
                    is_active: true,
                    subscription_plan: 'STARTER',
                    subscription_status: 'TRIAL',
                    subscription_valid_until: trialValidUntil,
                    xendit_account_id: xendit_account_id || null,
                })
                .select()
                .single();

            if (venueError || !venueRow) {
                throw new Error('Failed to create venue: ' + (venueError?.message || 'unknown error'));
            }

            venueId = venueRow.id;
            createdNewVenue = true;

            const { error: associationError } = await supabase
                .from('user_venues')
                .insert({
                    user_id: user.id,
                    venue_id: venueId,
                    role: 'owner',
                });

            if (associationError) {
                await supabase.from('venues').delete().eq('id', venueId);
                throw new Error('Failed to create user-venue association: ' + associationError.message);
            }

            const courtsToCreate = Array.from({ length: courtsCount }, (_, idx) => ({
                venue_id: venueId,
                name: `Lapangan ${idx + 1}`,
                court_number: idx + 1,
                is_active: true,
                hourly_rate: hourlyRatePerCourt,
            }));

            const { error: courtsError } = await supabase
                .from('courts')
                .insert(courtsToCreate);

            if (courtsError) {
                console.error('Courts creation error:', courtsError);
            }

            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    venue_id: venueId,
                },
            });

            if (metadataError) {
                console.warn('Failed to update user metadata with venue_id:', metadataError);
            }
        }

        if (!venueId) {
            throw new Error('Failed to resolve venue for onboarding');
        }

        if (checkoutAction === 'PAY_NOW') {
            const { error: pendingError } = await supabase
                .from('venues')
                .update({
                    pending_subscription_plan: desiredPlan,
                    pending_subscription_effective_date: new Date().toISOString(),
                })
                .eq('id', venueId);

            if (pendingError) {
                throw new Error('Failed to save pending subscription: ' + pendingError.message);
            }

            const payment = await createSubscriptionPayment({
                venueId,
                targetPlan: desiredPlan,
                paymentMethod: paymentMethod!,
                paymentChannel,
                customerName: venueName,
                callbackBaseUrl: new URL(request.url).origin,
                metadata: {
                    source: 'ONBOARDING',
                    requested_by: user.id,
                },
            });

            return NextResponse.json({
                success: true,
                venueId,
                mode: 'PAY_NOW',
                createdNewVenue,
                payment,
            });
        }

        return NextResponse.json({
            success: true,
            venueId,
            mode: 'TRIAL',
            createdNewVenue,
            message: createdNewVenue ? 'Venue created successfully' : 'Continuing with trial',
        });
    } catch (error: unknown) {
        console.error('Onboarding submission error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to create venue' },
            { status: 500 }
        );
    }
}


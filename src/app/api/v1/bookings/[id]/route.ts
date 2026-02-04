import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { updateBookingSchema } from '@/lib/validators/booking';
import { z } from 'zod';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // 1. Validation
        const payload = updateBookingSchema.parse(body);

        // 2. If status is LUNAS/DP and paid_amount not provided, fetch booking price
        let updateData: any = {
            ...payload,
            updated_at: new Date().toISOString()
        };

        if ((payload.status === 'LUNAS' || payload.status === 'DP') && payload.paid_amount === undefined) {
            // Fetch current booking to get the price
            const { data: currentBooking, error: fetchError } = await supabase
                .from('bookings')
                .select('price')
                .eq('id', id)
                .single();

            if (!fetchError && currentBooking) {
                // Set paid_amount = price for LUNAS, or keep existing logic for DP
                if (payload.status === 'LUNAS') {
                    updateData.paid_amount = currentBooking.price;
                }
            }
        }

        // 3. Update
        const { data, error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned, likely ID not found
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Booking updated successfully',
            data
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
        }
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

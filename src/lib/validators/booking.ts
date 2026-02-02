import { z } from 'zod';

export const createBookingSchema = z.object({
    venue_id: z.string().uuid(),
    court_id: z.string().uuid(),
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    duration: z.number().int().min(1),
    customer_name: z.string().min(1),
    phone: z.string().min(10),
});

export const updateBookingSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'paid', 'cancelled', 'completed', 'LUNAS', 'DP', 'BELUM_BAYAR']).optional(),
    paid_amount: z.number().optional(),
    price: z.number().optional(),
});

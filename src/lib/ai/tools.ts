
import { z } from 'zod';
import { getBookings, createBooking, deleteBooking } from '@/lib/api/bookings';
import { getCourts } from '@/lib/api/courts';
import { tool } from 'ai';

// Tool definitions for Vercel AI SDK
export const createTools = (venueId: string) => {
    return {
        checkAvailability: tool({
            description: 'Check court availability for a specific date',
            inputSchema: z.object({
                date: z.string().describe('Date in YYYY-MM-DD format'),
            }),
            execute: async ({ date }) => {
                try {
                    const bookings = await getBookings(venueId, date);
                    const courts = await getCourts(venueId);

                    // Simple availability logic: map bookings to courts
                    // In a real app, we might want to check operating hours too
                    return {
                        date,
                        totalCourts: courts.length,
                        bookingsCount: bookings.length,
                        bookings: bookings.map(b => ({
                            courtId: b.courtId,
                            time: b.startTime,
                            duration: b.duration,
                            status: b.status
                        })),
                        courts: courts.map(c => ({ id: c.id, name: c.name, number: c.courtNumber }))
                    };
                } catch (err: unknown) {
                    return { error: err instanceof Error ? err.message : 'Unknown error' };
                }
            },
        }),

        createBooking: tool({
            description: 'Create a new booking for a customer',
            inputSchema: z.object({
                customerName: z.string(),
                phone: z.string().optional(),
                courtId: z.string().describe('The UUID or Court Number (e.g., "1")'),
                date: z.string().describe('YYYY-MM-DD'),
                startTime: z.string().describe('HH:mm format (e.g., "10:00")'),
                duration: z.number().describe('Duration in hours'),
                price: z.number().describe('Total price'),
                paidAmount: z.number().optional().describe('Amount paid (DP)'),
            }),
            execute: async (input) => {
                try {
                    const booking = await createBooking(venueId, {
                        customerName: input.customerName,
                        phone: input.phone || '',
                        courtId: input.courtId,
                        bookingDate: input.date,
                        startTime: input.startTime,
                        duration: input.duration,
                        price: input.price,
                        paidAmount: input.paidAmount || 0,
                        status: (input.paidAmount && input.paidAmount >= input.price) ? 'LUNAS' : 'BELUM_BAYAR', // Simple logic
                        checkInTime: undefined,
                        isNoShow: false,
                        createdAt: new Date().toISOString()
                    });
                    return { success: true, bookingId: booking.id, message: `Booking created for ${booking.customerName}` };
                } catch (err: unknown) {
                    return { error: err instanceof Error ? err.message : 'Unknown error' };
                }
            },
        }),

        cancelBooking: tool({
            description: 'Cancel or delete a booking by ID',
            inputSchema: z.object({
                bookingId: z.string(),
            }),
            execute: async ({ bookingId }) => {
                try {
                    await deleteBooking(bookingId);
                    return { success: true, message: 'Booking deleted' };
                } catch (err: unknown) {
                    return { error: err instanceof Error ? err.message : 'Unknown error' };
                }
            }
        })
    };
};

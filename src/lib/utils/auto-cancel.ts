import { supabase } from '../supabase';
import { Venue } from '../api/venues';
import { differenceInMinutes, parseISO, isAfter, subMinutes } from 'date-fns';

// Default tolerance if not set in venue
const DEFAULT_TOLERANCE_MINUTES = 15;

/**
 * Checks for "No-Show" bookings and cancels them.
 * 
 * LOGIC:
 * 1. Calculate Cut-off Time based on Venue Tolerance (e.g., Now - 15 mins).
 * 2. Find Bookings where `start_time` <= Cut-off Time.
 * 3. Filter Bookings that are NOT checked-in and NOT cancelled/finished.
 * 4. Mark them as `cancelled` and `is_no_show = true`.
 * 5. QUOTA: We DO NOT refund quota. The penalty for no-show is forfeiture of quota.
 */
export async function runAutoCancelCheck(venueId: string, currentVenue?: Venue) {
    // console.log("Running Auto-Cancel Check...");

    // 1. Get Venue Settings
    let tolerance = DEFAULT_TOLERANCE_MINUTES;
    if (currentVenue?.bookingTolerance) {
        tolerance = currentVenue.bookingTolerance;
    }

    const now = new Date();
    // We only check for bookings TODAY to avoid messing with past/future dates ambiguously
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format for local time

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .eq('booking_date', todayStr)
        .is('check_in_time', null) // Not checked in
        .neq('status', 'cancelled')
        .neq('status', 'completed')
        .neq('status', 'COMPLETED'); // Case sensitivity safety

    if (error) throw error;

    let cancelledCount = 0;

    for (const booking of bookings) {
        // Construct Booking Start DateTime
        // booking_date is YYYY-MM-DD string
        // start_time is HH:MM:SS string
        const bookingStartStr = `${booking.booking_date}T${booking.start_time}`;
        const bookingStart = new Date(bookingStartStr);

        // Calculate if booking is "Late"
        // Late if: Now > BookingStart + Tolerance
        // checking: diff(Now, BookingStart) > Tolerance

        const minutesSinceStart = differenceInMinutes(now, bookingStart);

        if (minutesSinceStart > tolerance) {
            console.log(`[AutoCancel] Cancelling Booking ${booking.id}. Late by ${minutesSinceStart} mins (Tolerance: ${tolerance})`);

            // Mark as No-Show & Cancel
            // NO REFUNDING QUOTA
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    is_no_show: true
                })
                .eq('id', booking.id);

            if (!updateError) {
                cancelledCount++;
            } else {
                console.error(`[AutoCancel] Failed to cancel ${booking.id}:`, updateError);
            }
        }
    }

    return cancelledCount;
}

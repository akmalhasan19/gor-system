"use client";

import { useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import { logger } from "@/lib/logger";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export function AutoCancelTrigger() {
    const { currentVenueId } = useVenue();

    useEffect(() => {
        if (!currentVenueId) return;

        // Function to trigger the check
        const triggerCheck = async () => {
            // logger.debug("⏰ Triggering Auto-Cancel Check...");
            try {
                await fetch('/api/cron/auto-cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ venueId: currentVenueId }),
                });
            } catch (error) {
                logger.error("Failed to run auto-cancel check:", error);
            }
        };

        // Run immediately on mount
        triggerCheck();

        // Set interval
        const interval = setInterval(triggerCheck, CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [currentVenueId]);

    return null; // Invisible component
}

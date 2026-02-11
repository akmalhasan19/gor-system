"use client";

import { useEffect } from "react";
import { useVenue } from "@/lib/venue-context";
import { logger } from "@/lib/logger";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export function AutoCancelTrigger() {
    const { currentVenueId } = useVenue();
    const isProduction = process.env.NODE_ENV === 'production';

    useEffect(() => {
        if (!isProduction || !currentVenueId) return;

        const triggerCheck = async () => {
            try {
                const response = await fetch('/api/public/auto-cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ venueId: currentVenueId }),
                });

                if (response.ok) return;

                const body = await response.text();
                logger.warn('Auto-cancel request skipped/failed:', response.status, response.statusText, body);
            } catch (error) {
                logger.error("Failed to run auto-cancel check:", error);
            }
        };

        triggerCheck();
        const interval = setInterval(triggerCheck, CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [currentVenueId, isProduction]);

    return null;
}

'use client';

import { useMemo, useState } from 'react';
import { fetchWithCsrf, getCsrfHeaders } from '@/lib/hooks/use-csrf';

export type VenueItem = {
    id: string;
    name: string;
    is_active: boolean;
    subscription_plan: string | null;
    subscription_status: string | null;
    subscription_valid_until: string | null;
    days_left: number | null;
    owner_email: string | null;
    owner_name: string | null;
    pipeline_status: string | null;
    deactivated_reason: string | null;
};

type Props = {
    initialVenues: VenueItem[];
};

export function VenuesAdminClient({ initialVenues }: Props) {
    const [venues, setVenues] = useState(initialVenues);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [includeInactive, setIncludeInactive] = useState(true);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const visibleVenues = useMemo(() => {
        return venues.filter((venue) => {
            if (statusFilter === 'ALL') return true;
            return venue.subscription_status === statusFilter;
        });
    }, [venues, statusFilter]);

    async function refresh() {
        const query = includeInactive ? '?include_inactive=true&limit=100' : '?limit=100';
        const response = await fetch(`/api/internal/admin/venues${query}`);
        const payload = await response.json();
        if (response.ok && payload.success) {
            setVenues(payload.data || []);
        }
    }

    async function deactivateVenue(venueId: string) {
        const reason = window.prompt('Alasan deactivate venue:');
        if (!reason) return;

        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetchWithCsrf(`/api/internal/admin/venues/${venueId}/deactivate`, {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ reason }),
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || 'Failed to deactivate venue');
            }

            setMessage(`Venue deactivated: ${payload.data.name}`);
            await refresh();
        } catch (error: unknown) {
            setMessage(error instanceof Error ? error.message : 'Failed to deactivate venue');
        } finally {
            setIsLoading(false);
        }
    }

    async function reactivateVenue(venueId: string) {
        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetchWithCsrf(`/api/internal/admin/venues/${venueId}/reactivate`, {
                method: 'POST',
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || 'Failed to reactivate venue');
            }

            setMessage(`Venue reactivated: ${payload.data.name}`);
            await refresh();
        } catch (error: unknown) {
            setMessage(error instanceof Error ? error.message : 'Failed to reactivate venue');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="bg-white border-2 border-black p-4 flex flex-wrap gap-3 items-center">
                <select className="border-2 border-black p-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">ALL STATUS</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELED">CANCELED</option>
                </select>
                <label className="font-bold text-sm">
                    <input
                        type="checkbox"
                        checked={includeInactive}
                        onChange={(e) => setIncludeInactive(e.target.checked)}
                        className="mr-2"
                    />
                    Include inactive
                </label>
                <button onClick={refresh} className="px-3 py-2 border-2 border-black font-bold" disabled={isLoading}>
                    Refresh
                </button>
            </div>

            {message && <p className="font-mono text-sm">{message}</p>}

            <div className="bg-white border-2 border-black overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-black text-white">
                        <tr>
                            <th className="p-2 text-left">Venue</th>
                            <th className="p-2 text-left">Owner</th>
                            <th className="p-2 text-left">Subscription</th>
                            <th className="p-2 text-left">Pipeline</th>
                            <th className="p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleVenues.map((venue) => (
                            <tr key={venue.id} className="border-b border-gray-200">
                                <td className="p-2">
                                    <p className="font-bold">{venue.name}</p>
                                    <p className="text-xs text-gray-600">{venue.is_active ? 'Active' : 'Inactive'}</p>
                                    {!venue.is_active && venue.deactivated_reason && (
                                        <p className="text-xs text-red-600">{venue.deactivated_reason}</p>
                                    )}
                                </td>
                                <td className="p-2">
                                    <p>{venue.owner_name || '-'}</p>
                                    <p className="text-xs text-gray-600">{venue.owner_email || '-'}</p>
                                </td>
                                <td className="p-2">
                                    <p>{venue.subscription_plan || '-'}</p>
                                    <p className="text-xs">{venue.subscription_status || '-'}</p>
                                    <p className="text-xs text-gray-600">Days left: {venue.days_left ?? '-'}</p>
                                </td>
                                <td className="p-2">{venue.pipeline_status || '-'}</td>
                                <td className="p-2">
                                    {venue.is_active ? (
                                        <button className="px-2 py-1 border border-black font-bold" onClick={() => deactivateVenue(venue.id)} disabled={isLoading}>
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button className="px-2 py-1 border border-black font-bold" onClick={() => reactivateVenue(venue.id)} disabled={isLoading}>
                                            Reactivate
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

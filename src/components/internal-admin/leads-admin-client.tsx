'use client';

import { useMemo, useState } from 'react';
import { fetchWithCsrf, getCsrfHeaders } from '@/lib/hooks/use-csrf';

export type LeadItem = {
    id: string;
    source: string;
    partner_name: string | null;
    venue_name: string | null;
    email: string;
    phone: string | null;
    city: string | null;
    requested_plan: string | null;
    status: string;
    notes: string | null;
    pending_invite_id: string | null;
    pending_invite_expires_at: string | null;
    created_at: string;
};

type Props = {
    initialLeads: LeadItem[];
};

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'TRIAL', 'ACTIVE', 'CHURN_RISK', 'REJECTED'] as const;

export function LeadsAdminClient({ initialLeads }: Props) {
    const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [manualLead, setManualLead] = useState({
        partner_name: '',
        venue_name: '',
        email: '',
        phone: '',
        city: '',
        requested_plan: 'STARTER',
        notes: '',
    });

    const visibleLeads = useMemo(() => {
        return leads.filter((lead) => {
            const statusMatch = statusFilter === 'ALL' || lead.status === statusFilter;
            if (!statusMatch) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                (lead.partner_name || '').toLowerCase().includes(q) ||
                (lead.venue_name || '').toLowerCase().includes(q) ||
                lead.email.toLowerCase().includes(q)
            );
        });
    }, [leads, search, statusFilter]);

    async function refreshLeads() {
        const response = await fetch('/api/internal/admin/leads?limit=100');
        const payload = await response.json();
        if (response.ok && payload.success) {
            setLeads(payload.data || []);
        }
    }

    async function withLoading(task: () => Promise<void>) {
        setIsLoading(true);
        setMessage('');
        try {
            await task();
        } catch (error: unknown) {
            setMessage(error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateLead() {
        await withLoading(async () => {
            const response = await fetchWithCsrf('/api/internal/admin/leads', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    ...manualLead,
                    phone: manualLead.phone || null,
                    city: manualLead.city || null,
                    venue_name: manualLead.venue_name || null,
                    notes: manualLead.notes || null,
                }),
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || 'Failed to create lead');
            }

            setManualLead({
                partner_name: '',
                venue_name: '',
                email: '',
                phone: '',
                city: '',
                requested_plan: 'STARTER',
                notes: '',
            });
            await refreshLeads();
            setMessage('Lead created');
        });
    }

    async function updateLeadStatus(leadId: string, status: string) {
        await withLoading(async () => {
            const response = await fetchWithCsrf(`/api/internal/admin/leads/${leadId}/status`, {
                method: 'PATCH',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ status }),
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || 'Failed to update status');
            }
            await refreshLeads();
            setMessage('Lead status updated');
        });
    }

    async function provisionLead(leadId: string, mode: 'INVITE' | 'DIRECT') {
        await withLoading(async () => {
            const response = await fetchWithCsrf('/api/internal/admin/provision', {
                method: 'POST',
                headers: getCsrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    mode,
                    leadId,
                    courtsCount: mode === 'DIRECT' ? 3 : undefined,
                }),
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || `Failed to provision ${mode}`);
            }

            await refreshLeads();
            if (mode === 'INVITE') {
                setMessage(`Invite sent: ${payload.data.inviteUrl}`);
            } else {
                setMessage(`Venue created: ${payload.data.venueName}`);
            }
        });
    }

    async function resendInvite(inviteId: string) {
        await withLoading(async () => {
            const response = await fetchWithCsrf(`/api/internal/admin/invites/${inviteId}/resend`, {
                method: 'POST',
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || 'Failed to resend invite');
            }
            setMessage(`Invite resent: ${payload.data.inviteUrl}`);
            await refreshLeads();
        });
    }

    return (
        <div className="space-y-6">
            <section className="bg-white border-2 border-black p-4">
                <h2 className="font-black uppercase mb-3">Create Manual Lead</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="border-2 border-black p-2" placeholder="Partner name" value={manualLead.partner_name} onChange={(e) => setManualLead((prev) => ({ ...prev, partner_name: e.target.value }))} />
                    <input className="border-2 border-black p-2" placeholder="Venue name" value={manualLead.venue_name} onChange={(e) => setManualLead((prev) => ({ ...prev, venue_name: e.target.value }))} />
                    <input className="border-2 border-black p-2" placeholder="Email" value={manualLead.email} onChange={(e) => setManualLead((prev) => ({ ...prev, email: e.target.value }))} />
                    <input className="border-2 border-black p-2" placeholder="Phone" value={manualLead.phone} onChange={(e) => setManualLead((prev) => ({ ...prev, phone: e.target.value }))} />
                    <input className="border-2 border-black p-2" placeholder="City" value={manualLead.city} onChange={(e) => setManualLead((prev) => ({ ...prev, city: e.target.value }))} />
                    <select className="border-2 border-black p-2" value={manualLead.requested_plan} onChange={(e) => setManualLead((prev) => ({ ...prev, requested_plan: e.target.value }))}>
                        <option value="STARTER">STARTER</option>
                        <option value="PRO">PRO</option>
                        <option value="BUSINESS">BUSINESS</option>
                    </select>
                    <input className="border-2 border-black p-2 md:col-span-2" placeholder="Notes" value={manualLead.notes} onChange={(e) => setManualLead((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
                <button disabled={isLoading} onClick={handleCreateLead} className="mt-3 px-4 py-2 bg-black text-white font-bold uppercase">
                    {isLoading ? 'Processing...' : 'Create Lead'}
                </button>
            </section>

            <section className="bg-white border-2 border-black p-4">
                <div className="flex flex-wrap gap-3 mb-4">
                    <input className="border-2 border-black p-2" placeholder="Search partner / venue / email" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select className="border-2 border-black p-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">ALL STATUS</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {message && <p className="mb-3 font-mono text-sm">{message}</p>}

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="p-2 text-left">Partner</th>
                                <th className="p-2 text-left">Email</th>
                                <th className="p-2 text-left">Plan</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleLeads.map((lead) => (
                                <tr key={lead.id} className="border-b border-gray-200">
                                    <td className="p-2">
                                        <p className="font-bold">{lead.partner_name || '-'}</p>
                                        <p className="text-xs text-gray-500">{lead.venue_name || '-'}</p>
                                    </td>
                                    <td className="p-2">{lead.email}</td>
                                    <td className="p-2">{lead.requested_plan || 'STARTER'}</td>
                                    <td className="p-2">
                                        <select
                                            className="border border-black p-1"
                                            value={lead.status}
                                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                            disabled={isLoading}
                                        >
                                            {STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex flex-wrap gap-2">
                                            <button className="px-2 py-1 border border-black font-bold" onClick={() => provisionLead(lead.id, 'INVITE')} disabled={isLoading}>
                                                Invite
                                            </button>
                                            <button className="px-2 py-1 border border-black font-bold" onClick={() => provisionLead(lead.id, 'DIRECT')} disabled={isLoading}>
                                                Direct
                                            </button>
                                            {lead.pending_invite_id && (
                                                <button className="px-2 py-1 border border-black font-bold" onClick={() => resendInvite(lead.pending_invite_id!)} disabled={isLoading}>
                                                    Resend
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function InternalAdminOverviewPage() {
    const [newLeadsResult, trialLeadsResult, activeLeadsResult, trialVenuesResult, activeVenuesResult, pendingInvitesResult] = await Promise.all([
        supabaseAdmin.from('venue_leads').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
        supabaseAdmin.from('venue_leads').select('*', { count: 'exact', head: true }).eq('status', 'TRIAL'),
        supabaseAdmin.from('venue_leads').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabaseAdmin.from('venues').select('*', { count: 'exact', head: true }).eq('subscription_status', 'TRIAL').eq('is_active', true),
        supabaseAdmin.from('venues').select('*', { count: 'exact', head: true }).eq('subscription_status', 'ACTIVE').eq('is_active', true),
        supabaseAdmin.from('partner_invites').select('*', { count: 'exact', head: true }).eq('status', 'pending').is('revoked_at', null),
    ]);

    const newLeads = newLeadsResult.count || 0;
    const trialLeads = trialLeadsResult.count || 0;
    const activeLeads = activeLeadsResult.count || 0;
    const trialVenues = trialVenuesResult.count || 0;
    const activeVenues = activeVenuesResult.count || 0;
    const pendingInvites = pendingInvitesResult.count || 0;

    const cards = [
        { label: 'New Leads', value: newLeads },
        { label: 'Lead Trial', value: trialLeads },
        { label: 'Lead Active', value: activeLeads },
        { label: 'Venue Trial', value: trialVenues },
        { label: 'Venue Active', value: activeVenues },
        { label: 'Pending Invites', value: pendingInvites },
    ];

    return (
        <div className="space-y-6">
            <section className="bg-white border-2 border-black p-4">
                <h2 className="text-xl font-black uppercase mb-2">Early Launch Operations</h2>
                <p className="text-sm text-gray-600">
                    Gunakan panel ini untuk lead intake, provisioning akun venue, dan kontrol status trial/subscription.
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white border-2 border-black p-4">
                        <p className="text-xs font-bold uppercase text-gray-600">{card.label}</p>
                        <p className="text-3xl font-black">{card.value}</p>
                    </div>
                ))}
            </section>

            <section className="bg-white border-2 border-black p-4">
                <h3 className="font-black uppercase mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3 text-sm font-bold uppercase">
                    <Link href="/internal/admin/leads" className="border-2 border-black px-3 py-2">Open Lead Inbox</Link>
                    <Link href="/internal/admin/venues" className="border-2 border-black px-3 py-2">Open Venue Monitor</Link>
                    <Link href="/internal/admin/audit" className="border-2 border-black px-3 py-2">Open Audit Logs</Link>
                </div>
            </section>
        </div>
    );
}

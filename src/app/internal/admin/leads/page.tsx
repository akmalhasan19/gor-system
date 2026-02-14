import { supabaseAdmin } from '@/lib/supabase-admin';
import { LeadItem, LeadsAdminClient } from '@/components/internal-admin/leads-admin-client';

export default async function AdminLeadsPage() {
    const { data: leads } = await supabaseAdmin
        .from('venue_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    const emails = [...new Set((leads || []).map((lead) => lead.email?.toLowerCase()).filter(Boolean))];
    const { data: invites } = emails.length
        ? await supabaseAdmin
            .from('partner_invites')
            .select('id, email, status, expires_at, revoked_at')
            .in('email', emails)
            .order('created_at', { ascending: false })
        : { data: [] as Array<{ id: string; email: string; status: string; expires_at: string; revoked_at: string | null }> };

    const inviteByEmail = new Map<string, { id: string; expires_at: string }>();
    for (const invite of invites || []) {
        const key = invite.email?.toLowerCase();
        if (!key || inviteByEmail.has(key)) continue;
        const isPendingAndValid = invite.status === 'pending' && !invite.revoked_at && new Date(invite.expires_at) > new Date();
        if (isPendingAndValid) {
            inviteByEmail.set(key, { id: invite.id, expires_at: invite.expires_at });
        }
    }

    const hydratedLeads = (leads || []).map((lead) => {
        const pendingInvite = inviteByEmail.get((lead.email || '').toLowerCase());
        return {
            ...lead,
            pending_invite_id: pendingInvite?.id || null,
            pending_invite_expires_at: pendingInvite?.expires_at || null,
        };
    });

    return (
        <div className="space-y-4">
            <div className="bg-white border-2 border-black p-4">
                <h2 className="text-xl font-black uppercase">Lead Inbox & Provisioning</h2>
                <p className="text-sm text-gray-600">
                    Proses lead dari SmashCourts, kirim invite, atau direct create venue account.
                </p>
            </div>

            <LeadsAdminClient initialLeads={hydratedLeads as LeadItem[]} />
        </div>
    );
}

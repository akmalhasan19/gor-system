import { supabaseAdmin } from '@/lib/supabase-admin';
import { VenueItem, VenuesAdminClient } from '@/components/internal-admin/venues-admin-client';

function computeDaysLeft(validUntil?: string | null) {
    if (!validUntil) return null;
    const ts = new Date(validUntil).getTime();
    if (Number.isNaN(ts)) return null;
    return Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function AdminVenuesPage() {
    const { data: venues } = await supabaseAdmin
        .from('venues')
        .select('id, name, is_active, subscription_plan, subscription_status, subscription_valid_until, deactivated_reason')
        .order('created_at', { ascending: false })
        .limit(100);

    const venueIds = (venues || []).map((venue) => venue.id);
    const { data: ownerLinks } = venueIds.length
        ? await supabaseAdmin
            .from('user_venues')
            .select('venue_id, user_id')
            .in('venue_id', venueIds)
            .eq('role', 'owner')
        : { data: [] as Array<{ venue_id: string; user_id: string }> };

    const ownerIds = [...new Set((ownerLinks || []).map((row) => row.user_id))];
    const { data: profiles } = ownerIds.length
        ? await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name')
            .in('id', ownerIds)
        : { data: [] as Array<{ id: string; email: string | null; full_name: string | null }> };

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const ownerByVenue = new Map<string, { email: string | null; full_name: string | null }>();
    for (const ownerLink of ownerLinks || []) {
        const profile = profileById.get(ownerLink.user_id);
        ownerByVenue.set(ownerLink.venue_id, {
            email: profile?.email || null,
            full_name: profile?.full_name || null,
        });
    }

    const emails = [...new Set((profiles || []).map((profile) => profile.email?.toLowerCase()).filter(Boolean))];
    const { data: leads } = emails.length
        ? await supabaseAdmin
            .from('venue_leads')
            .select('email, status, created_at')
            .in('email', emails)
            .order('created_at', { ascending: false })
        : { data: [] as Array<{ email: string; status: string; created_at: string }> };

    const leadStatusByEmail = new Map<string, string>();
    for (const lead of leads || []) {
        const key = lead.email?.toLowerCase();
        if (!key || leadStatusByEmail.has(key)) continue;
        leadStatusByEmail.set(key, lead.status);
    }

    const hydratedVenues = (venues || []).map((venue) => {
        const owner = ownerByVenue.get(venue.id);
        const ownerEmail = owner?.email?.toLowerCase() || null;
        return {
            ...venue,
            owner_email: ownerEmail,
            owner_name: owner?.full_name || null,
            pipeline_status: ownerEmail ? leadStatusByEmail.get(ownerEmail) || null : null,
            days_left: computeDaysLeft(venue.subscription_valid_until),
        };
    });

    return (
        <div className="space-y-4">
            <div className="bg-white border-2 border-black p-4">
                <h2 className="text-xl font-black uppercase">Venue Monitoring</h2>
                <p className="text-sm text-gray-600">
                    Monitor status trial/langganan dan jalankan deactivate/reactivate venue.
                </p>
            </div>

            <VenuesAdminClient initialVenues={hydratedVenues as VenueItem[]} />
        </div>
    );
}

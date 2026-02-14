import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

type ProfileRow = {
    id: string;
    email: string | null;
    full_name: string | null;
};

type InviteRow = {
    id: string;
    email: string;
    status: string;
    expires_at: string;
};

function sanitizePage(value: string | null, fallback: number) {
    const parsed = Number(value || fallback);
    if (Number.isNaN(parsed) || parsed < 1) return fallback;
    return parsed;
}

function computeDaysLeft(validUntil?: string | null) {
    if (!validUntil) return null;
    const expiry = new Date(validUntil).getTime();
    if (Number.isNaN(expiry)) return null;
    const now = Date.now();
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const { searchParams } = new URL(request.url);
    const page = sanitizePage(searchParams.get('page'), 1);
    const limit = Math.min(sanitizePage(searchParams.get('limit'), 20), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const status = searchParams.get('subscription_status');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let venuesQuery = supabaseAdmin
        .from('venues')
        .select('id, name, is_active, subscription_plan, subscription_status, subscription_valid_until, created_at, deactivated_at, deactivated_reason', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (!includeInactive) {
        venuesQuery = venuesQuery.eq('is_active', true);
    }

    if (status) {
        venuesQuery = venuesQuery.eq('subscription_status', status);
    }

    const { data: venues, error: venuesError, count } = await venuesQuery.range(from, to);
    if (venuesError) {
        return NextResponse.json(
            { success: false, error: venuesError.message },
            { status: 500 }
        );
    }

    if (!venues || venues.length === 0) {
        return NextResponse.json({
            success: true,
            data: [],
            meta: { total: count || 0, page, limit, lastPage: 1 },
        });
    }

    const venueIds = venues.map((venue) => venue.id);
    const { data: ownerRows } = await supabaseAdmin
        .from('user_venues')
        .select('venue_id, user_id')
        .in('venue_id', venueIds)
        .eq('role', 'owner');

    const ownerUserIds = [...new Set((ownerRows || []).map((row) => row.user_id))];
    const profilesPromise = ownerUserIds.length
        ? supabaseAdmin.from('profiles').select('id, email, full_name').in('id', ownerUserIds)
        : Promise.resolve({ data: [] as ProfileRow[], error: null });

    const [profilesResult, leadsResult, invitesResult] = await Promise.all([
        profilesPromise,
        supabaseAdmin
            .from('venue_leads')
            .select('id, email, status, created_at')
            .order('created_at', { ascending: false })
            .limit(500),
        supabaseAdmin
            .from('partner_invites')
            .select('id, email, status, expires_at')
            .eq('status', 'pending')
            .is('revoked_at', null),
    ]);

    const profileMap = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));
    const ownerByVenue = new Map<string, { email: string | null; fullName: string | null }>();

    for (const row of ownerRows || []) {
        const profile = profileMap.get(row.user_id);
        ownerByVenue.set(row.venue_id, {
            email: profile?.email || null,
            fullName: profile?.full_name || null,
        });
    }

    const latestLeadStatusByEmail = new Map<string, string>();
    for (const lead of leadsResult.data || []) {
        const email = (lead.email || '').toLowerCase();
        if (!email) continue;
        if (!latestLeadStatusByEmail.has(email)) {
            latestLeadStatusByEmail.set(email, lead.status);
        }
    }

    const pendingInviteByEmail = new Set(
        (invitesResult.data || [])
            .filter((invite) => new Date((invite as InviteRow).expires_at) > new Date())
            .map((invite) => (invite as InviteRow).email.toLowerCase())
    );

    const result = venues.map((venue) => {
        const owner = ownerByVenue.get(venue.id);
        const ownerEmail = owner?.email?.toLowerCase() || null;
        return {
            ...venue,
            days_left: computeDaysLeft(venue.subscription_valid_until),
            owner_email: ownerEmail,
            owner_name: owner?.fullName || null,
            pipeline_status: ownerEmail ? latestLeadStatusByEmail.get(ownerEmail) || null : null,
            has_pending_invite: ownerEmail ? pendingInviteByEmail.has(ownerEmail) : false,
        };
    });

    return NextResponse.json({
        success: true,
        data: result,
        meta: {
            total: count || 0,
            page,
            limit,
            lastPage: Math.max(1, Math.ceil((count || 0) / limit)),
        },
    });
}

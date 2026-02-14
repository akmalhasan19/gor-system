import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/admin-audit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateRequestBody, AdminLeadCreateSchema } from '@/lib/validation';

function sanitizePage(value: string | null, fallback: number) {
    const parsed = Number(value || fallback);
    if (Number.isNaN(parsed) || parsed < 1) return fallback;
    return parsed;
}

export async function GET(request: NextRequest) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('query');
    const page = sanitizePage(searchParams.get('page'), 1);
    const limit = Math.min(sanitizePage(searchParams.get('limit'), 20), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let dbQuery = supabaseAdmin
        .from('venue_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (status) {
        dbQuery = dbQuery.eq('status', status);
    }

    if (query) {
        const escaped = query.replace(/%/g, '');
        dbQuery = dbQuery.or(`email.ilike.%${escaped}%,partner_name.ilike.%${escaped}%,venue_name.ilike.%${escaped}%`);
    }

    const { data, error, count } = await dbQuery.range(from, to);

    if (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }

    const normalizedEmails = [...new Set((data || []).map((lead) => lead.email?.toLowerCase()).filter(Boolean))] as string[];
    const { data: invites } = normalizedEmails.length
        ? await supabaseAdmin
            .from('partner_invites')
            .select('id, email, status, expires_at, revoked_at')
            .in('email', normalizedEmails)
            .order('created_at', { ascending: false })
        : { data: [] as Array<{ id: string; email: string; status: string; expires_at: string; revoked_at: string | null }> };

    const inviteByEmail = new Map<string, { id: string; expires_at: string }>();
    for (const invite of invites || []) {
        const email = invite.email?.toLowerCase();
        if (!email || inviteByEmail.has(email)) continue;
        const isPendingAndValid = invite.status === 'pending' && !invite.revoked_at && new Date(invite.expires_at) > new Date();
        if (isPendingAndValid) {
            inviteByEmail.set(email, { id: invite.id, expires_at: invite.expires_at });
        }
    }

    const enrichedData = (data || []).map((lead) => {
        const pendingInvite = inviteByEmail.get((lead.email || '').toLowerCase());
        return {
            ...lead,
            pending_invite_id: pendingInvite?.id || null,
            pending_invite_expires_at: pendingInvite?.expires_at || null,
        };
    });

    return NextResponse.json({
        success: true,
        data: enrichedData,
        meta: {
            total: count || 0,
            page,
            limit,
            lastPage: Math.max(1, Math.ceil((count || 0) / limit)),
        },
    });
}

export async function POST(request: NextRequest) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const validation = await validateRequestBody(request, AdminLeadCreateSchema);
    if (!validation.success) return validation.error;

    const input = validation.data;
    const normalizedEmail = input.email.toLowerCase();

    const { data: createdLead, error } = await supabaseAdmin
        .from('venue_leads')
        .insert({
            source: input.source,
            partner_name: input.partner_name,
            venue_name: input.venue_name || null,
            email: normalizedEmail,
            phone: input.phone || null,
            city: input.city || null,
            requested_plan: input.requested_plan,
            notes: input.notes || null,
            status: 'NEW',
            processed_by: adminContext.user.id,
            processed_at: new Date().toISOString(),
        })
        .select('*')
        .single();

    if (error || !createdLead) {
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to create lead' },
            { status: 500 }
        );
    }

    await logAdminAction({
        actorUserId: adminContext.user.id,
        actorRole: adminContext.admin.role,
        actionType: 'LEAD_CREATED',
        targetType: 'venue_lead',
        targetId: createdLead.id,
        afterData: createdLead,
        request,
    });

    return NextResponse.json({
        success: true,
        data: createdLead,
    }, { status: 201 });
}

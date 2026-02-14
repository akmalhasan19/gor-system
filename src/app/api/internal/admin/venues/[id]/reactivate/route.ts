import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/admin-audit';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const { id } = await params;

    const { data: beforeVenue } = await supabaseAdmin
        .from('venues')
        .select('id, name, is_active, deactivated_at, deactivated_by, deactivated_reason')
        .eq('id', id)
        .maybeSingle();

    if (!beforeVenue) {
        return NextResponse.json(
            { success: false, error: 'Venue not found' },
            { status: 404 }
        );
    }

    if (beforeVenue.is_active) {
        return NextResponse.json({
            success: true,
            data: beforeVenue,
            message: 'Venue already active',
        });
    }

    const { data: updatedVenue, error } = await supabaseAdmin
        .from('venues')
        .update({
            is_active: true,
            deactivated_at: null,
            deactivated_by: null,
            deactivated_reason: null,
        })
        .eq('id', id)
        .select('id, name, is_active, deactivated_at, deactivated_by, deactivated_reason')
        .single();

    if (error || !updatedVenue) {
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to reactivate venue' },
            { status: 500 }
        );
    }

    await logAdminAction({
        actorUserId: adminContext.user.id,
        actorRole: adminContext.admin.role,
        actionType: 'VENUE_REACTIVATED',
        targetType: 'venue',
        targetId: id,
        beforeData: beforeVenue,
        afterData: updatedVenue,
        request,
    });

    return NextResponse.json({
        success: true,
        data: updatedVenue,
    });
}

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/admin-audit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateRequestBody, AdminLeadStatusUpdateSchema } from '@/lib/validation';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const { id } = await params;
    const validation = await validateRequestBody(request, AdminLeadStatusUpdateSchema);
    if (!validation.success) return validation.error;

    const { status, notes } = validation.data;

    const { data: beforeLead } = await supabaseAdmin
        .from('venue_leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!beforeLead) {
        return NextResponse.json(
            { success: false, error: 'Lead not found' },
            { status: 404 }
        );
    }

    const updates: Record<string, unknown> = {
        status,
        processed_by: adminContext.user.id,
        processed_at: new Date().toISOString(),
    };

    if (typeof notes !== 'undefined') {
        updates.notes = notes;
    }

    const { data: updatedLead, error } = await supabaseAdmin
        .from('venue_leads')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

    if (error || !updatedLead) {
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to update lead' },
            { status: 500 }
        );
    }

    await logAdminAction({
        actorUserId: adminContext.user.id,
        actorRole: adminContext.admin.role,
        actionType: 'LEAD_STATUS_UPDATED',
        targetType: 'venue_lead',
        targetId: id,
        beforeData: beforeLead,
        afterData: updatedLead,
        request,
    });

    return NextResponse.json({
        success: true,
        data: updatedLead,
    });
}

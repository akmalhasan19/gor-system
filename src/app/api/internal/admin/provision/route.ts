import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/admin-audit';
import { provisionVenue } from '@/lib/admin-provisioning';
import { validateRequestBody, AdminProvisionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const validation = await validateRequestBody(request, AdminProvisionSchema);
    if (!validation.success) return validation.error;

    try {
        const payload = validation.data;
        const baseInput = {
            leadId: payload.leadId,
            partnerName: payload.partnerName,
            venueName: payload.venueName,
            email: payload.email,
            phone: payload.phone,
            city: payload.city,
            requestedPlan: payload.requestedPlan,
            notes: payload.notes,
            baseUrl: new URL(request.url).origin,
            actorUserId: adminContext.user.id,
        };

        const result = payload.mode === 'DIRECT'
            ? await provisionVenue({
                ...baseInput,
                mode: 'DIRECT',
                courtsCount: payload.courtsCount!,
                hourlyRatePerCourt: payload.hourlyRatePerCourt,
                address: payload.address,
            })
            : await provisionVenue({
                ...baseInput,
                mode: 'INVITE',
            });

        await logAdminAction({
            actorUserId: adminContext.user.id,
            actorRole: adminContext.admin.role,
            actionType: result.mode === 'DIRECT' ? 'PROVISION_DIRECT' : 'PROVISION_INVITE',
            targetType: result.mode === 'DIRECT' ? 'venue' : 'partner_invite',
            targetId: result.mode === 'DIRECT' ? result.venueId : result.inviteId,
            metadata: {
                leadId: payload.leadId || null,
                mode: payload.mode,
            },
            afterData: result as unknown as Record<string, unknown>,
            request,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Provision failed' },
            { status: 500 }
        );
    }
}

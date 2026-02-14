import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/admin-audit';
import { resendInviteById } from '@/lib/admin-provisioning';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    const { id } = await params;

    try {
        const result = await resendInviteById({
            inviteId: id,
            actorUserId: adminContext.user.id,
            baseUrl: new URL(request.url).origin,
        });

        await logAdminAction({
            actorUserId: adminContext.user.id,
            actorRole: adminContext.admin.role,
            actionType: 'INVITE_RESENT',
            targetType: 'partner_invite',
            targetId: id,
            afterData: result as unknown as Record<string, unknown>,
            request,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to resend invite' },
            { status: 500 }
        );
    }
}

import 'server-only';

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuditActionType, PlatformAdminRole } from '@/types/admin';

type Jsonish = Record<string, unknown> | null;

function getRequestMeta(request?: NextRequest) {
    if (!request) {
        return { ip: null as string | null, userAgent: null as string | null };
    }

    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null;
    const userAgent = request.headers.get('user-agent');

    return { ip, userAgent };
}

export async function logAdminAction(params: {
    actorUserId: string;
    actorRole: PlatformAdminRole;
    actionType: AuditActionType;
    targetType: string;
    targetId: string;
    beforeData?: Jsonish;
    afterData?: Jsonish;
    metadata?: Jsonish;
    request?: NextRequest;
}) {
    const { ip, userAgent } = getRequestMeta(params.request);

    await supabaseAdmin.from('admin_audit_logs').insert({
        actor_user_id: params.actorUserId,
        actor_role: params.actorRole,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId,
        before_data: params.beforeData ?? null,
        after_data: params.afterData ?? null,
        metadata: params.metadata ?? null,
        ip_address: ip,
        user_agent: userAgent,
    });
}

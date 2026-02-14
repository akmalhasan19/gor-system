import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { PlatformAdminRole } from '@/types/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

type AdminRow = {
    id: string;
    user_id: string;
    role: PlatformAdminRole;
    is_active: boolean;
};

function createRequestScopedSupabase(request: NextRequest) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );
}

export async function getCurrentPlatformAdminFromRequest(request: NextRequest): Promise<{
    user: { id: string; email?: string | null };
    admin: AdminRow;
} | null> {
    const supabase = createRequestScopedSupabase(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }

    const { data: admin } = await supabaseAdmin
        .from('platform_admins')
        .select('id, user_id, role, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!admin || !admin.is_active) {
        return null;
    }

    return {
        user: { id: user.id, email: user.email },
        admin: admin as AdminRow,
    };
}

export async function requirePlatformAdmin(
    request: NextRequest,
    options?: { roles?: PlatformAdminRole[] }
): Promise<{
    user: { id: string; email?: string | null };
    admin: AdminRow;
} | NextResponse> {
    const result = await getCurrentPlatformAdminFromRequest(request);
    if (!result) {
        return NextResponse.json({ success: false, error: 'Forbidden - admin access required' }, { status: 403 });
    }

    if (options?.roles?.length && !options.roles.includes(result.admin.role)) {
        return NextResponse.json({ success: false, error: 'Forbidden - insufficient admin role' }, { status: 403 });
    }

    return result;
}

export async function getCurrentPlatformAdminFromCookies(): Promise<{
    user: { id: string; email?: string | null };
    admin: AdminRow;
} | null> {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }

    const { data: admin } = await supabaseAdmin
        .from('platform_admins')
        .select('id, user_id, role, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!admin || !admin.is_active) {
        return null;
    }

    return {
        user: { id: user.id, email: user.email },
        admin: admin as AdminRow,
    };
}

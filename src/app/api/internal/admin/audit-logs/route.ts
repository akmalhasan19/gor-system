import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
    const page = sanitizePage(searchParams.get('page'), 1);
    const limit = Math.min(sanitizePage(searchParams.get('limit'), 20), 100);
    const actionType = searchParams.get('action_type');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (actionType) {
        query = query.eq('action_type', actionType);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        data: data || [],
        meta: {
            total: count || 0,
            page,
            limit,
            lastPage: Math.max(1, Math.ceil((count || 0) / limit)),
        },
    });
}

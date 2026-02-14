import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const adminContext = await requirePlatformAdmin(request);
    if (adminContext instanceof NextResponse) {
        return adminContext;
    }

    return NextResponse.json({
        success: true,
        data: {
            userId: adminContext.user.id,
            email: adminContext.user.email || null,
            role: adminContext.admin.role,
        },
    });
}

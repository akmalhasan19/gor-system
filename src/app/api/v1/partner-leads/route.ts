import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateRequestBody, PartnerLeadIngestionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
    try {
        const validation = await validateRequestBody(request, PartnerLeadIngestionSchema);
        if (!validation.success) return validation.error;

        const input = validation.data;
        const normalizedEmail = input.email.toLowerCase();

        const { data: existingLead } = await supabaseAdmin
            .from('venue_leads')
            .select('id, status, created_at')
            .eq('email', normalizedEmail)
            .in('status', ['NEW', 'CONTACTED', 'TRIAL'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingLead) {
            return NextResponse.json({
                success: true,
                lead_id: existingLead.id,
                status: existingLead.status,
                deduplicated: true,
            });
        }

        const { data: createdLead, error } = await supabaseAdmin
            .from('venue_leads')
            .insert({
                source: 'smashcourts',
                partner_name: input.partner_name,
                venue_name: input.venue_name || null,
                email: normalizedEmail,
                phone: input.phone || null,
                city: input.city || null,
                requested_plan: input.requested_plan,
                notes: input.notes || null,
                status: 'NEW',
            })
            .select('id, status')
            .single();

        if (error || !createdLead) {
            return NextResponse.json(
                { success: false, error: error?.message || 'Failed to ingest lead' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            lead_id: createdLead.id,
            status: createdLead.status,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

import 'server-only';

import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { LeadStatus, ProvisionMode } from '@/types/admin';
import { SubscriptionPlan } from '@/lib/constants/plans';

const TRIAL_DAYS = 7;
const INVITE_EXPIRY_DAYS = 7;

type ProvisionBaseInput = {
    leadId?: string;
    partnerName?: string | null;
    venueName?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    requestedPlan?: SubscriptionPlan;
    notes?: string | null;
    baseUrl: string;
    actorUserId: string;
};

export type DirectProvisionInput = ProvisionBaseInput & {
    mode: 'DIRECT';
    courtsCount: number;
    hourlyRatePerCourt?: number;
    address?: string | null;
};

export type InviteProvisionInput = ProvisionBaseInput & {
    mode: 'INVITE';
};

export type ProvisionInput = DirectProvisionInput | InviteProvisionInput;

type LeadRow = {
    id: string;
    partner_name: string | null;
    venue_name: string | null;
    email: string;
    phone: string | null;
    city: string | null;
    requested_plan: SubscriptionPlan | null;
    notes: string | null;
    status: LeadStatus;
};

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function createInviteToken() {
    return randomBytes(32).toString('hex');
}

function getInviteExpiryIso() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + INVITE_EXPIRY_DAYS);
    return expiry.toISOString();
}

function getTrialValidUntilIso() {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + TRIAL_DAYS);
    return validUntil.toISOString();
}

async function resolveLeadAndInput(input: ProvisionInput): Promise<{
    lead: LeadRow | null;
    partnerName: string | null;
    venueName: string;
    email: string;
    phone: string | null;
    requestedPlan: SubscriptionPlan;
    notes: string | null;
    city: string | null;
}> {
    let lead: LeadRow | null = null;

    if (input.leadId) {
        const { data } = await supabaseAdmin
            .from('venue_leads')
            .select('id, partner_name, venue_name, email, phone, city, requested_plan, notes, status')
            .eq('id', input.leadId)
            .maybeSingle();

        if (!data) {
            throw new Error('Lead not found');
        }

        lead = data as LeadRow;
    }

    const venueName = (input.venueName || lead?.venue_name || input.partnerName || lead?.partner_name || '').trim();
    const rawEmail = input.email || lead?.email || '';
    const email = normalizeEmail(rawEmail);

    if (!venueName) {
        throw new Error('venueName is required');
    }

    if (!email) {
        throw new Error('email is required');
    }

    const requestedPlan = input.requestedPlan || lead?.requested_plan || 'STARTER';

    return {
        lead,
        partnerName: input.partnerName || lead?.partner_name || null,
        venueName,
        email,
        phone: input.phone || lead?.phone || null,
        requestedPlan,
        notes: input.notes || lead?.notes || null,
        city: input.city || lead?.city || null,
    };
}

async function sendInviteEmail(email: string, inviteUrl: string) {
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteUrl,
        data: {
            invited_via: 'internal_admin_panel',
        },
    });

    if (!inviteResult.error) {
        return;
    }

    // If user already exists, fallback to reset-password email with the same redirect target.
    if (inviteResult.error.message.toLowerCase().includes('already')) {
        const resetResult = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: inviteUrl,
        });

        if (!resetResult.error) {
            return;
        }
    }

    throw new Error(inviteResult.error.message);
}

async function sendResetPasswordEmail(email: string, baseUrl: string) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/reset-password`,
    });

    if (error) {
        return false;
    }

    return true;
}

async function upsertLeadStatus(params: {
    leadId?: string;
    status: LeadStatus;
    actorUserId: string;
    venueId?: string;
}) {
    if (!params.leadId) return;

    const updates: Record<string, unknown> = {
        status: params.status,
        processed_by: params.actorUserId,
        processed_at: new Date().toISOString(),
    };

    if (params.venueId) {
        updates.provisioned_venue_id = params.venueId;
    }

    await supabaseAdmin
        .from('venue_leads')
        .update(updates)
        .eq('id', params.leadId);
}

async function resolveOrCreateOwnerUserId(email: string): Promise<string> {
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

    if (existingProfile?.id) {
        return existingProfile.id;
    }

    const password = randomBytes(24).toString('base64url');
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            phone_verified: false,
            created_via_admin_panel: true,
        },
    });

    if (error || !created.user) {
        throw new Error(error?.message || 'Failed to create owner user');
    }

    return created.user.id;
}

export async function provisionVenue(input: ProvisionInput) {
    const resolved = await resolveLeadAndInput(input);

    if (input.mode === 'INVITE') {
        const token = createInviteToken();
        const expiresAt = getInviteExpiryIso();

        const { data: existingInvite } = await supabaseAdmin
            .from('partner_invites')
            .select('id, token, expires_at, status')
            .eq('email', resolved.email)
            .is('revoked_at', null)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let invite = existingInvite;
        if (!invite) {
            const { data: insertedInvite, error: insertedInviteError } = await supabaseAdmin
                .from('partner_invites')
                .insert({
                    token,
                    email: resolved.email,
                    partner_name: resolved.partnerName || resolved.venueName,
                    status: 'pending',
                    expires_at: expiresAt,
                    created_by_admin_id: input.actorUserId,
                    lead_id: input.leadId || null,
                    resend_count: 0,
                    last_sent_at: new Date().toISOString(),
                })
                .select('id, token, expires_at, status')
                .single();

            if (insertedInviteError || !insertedInvite) {
                throw new Error(insertedInviteError?.message || 'Failed to create partner invite');
            }

            invite = insertedInvite;
        }

        if (!invite) {
            throw new Error('Failed to create partner invite');
        }

        const inviteUrl = `${input.baseUrl}/register?token=${invite.token}`;
        await sendInviteEmail(resolved.email, inviteUrl);

        await supabaseAdmin
            .from('partner_invites')
            .update({
                last_sent_at: new Date().toISOString(),
                created_by_admin_id: input.actorUserId,
                lead_id: input.leadId || null,
            })
            .eq('id', invite.id);

        await upsertLeadStatus({
            leadId: input.leadId,
            status: 'CONTACTED',
            actorUserId: input.actorUserId,
        });

        return {
            mode: 'INVITE' as ProvisionMode,
            inviteId: invite.id,
            inviteUrl,
            email: resolved.email,
            expiresAt: invite.expires_at,
        };
    }

    const hourlyRatePerCourt = input.hourlyRatePerCourt ?? 50000;
    const ownerUserId = await resolveOrCreateOwnerUserId(resolved.email);
    const trialValidUntil = getTrialValidUntilIso();

    const { data: createdVenue, error: venueError } = await supabaseAdmin
        .from('venues')
        .insert({
            name: resolved.venueName,
            address: input.address || null,
            phone: resolved.phone,
            city: resolved.city,
            email: resolved.email,
            operating_hours_start: 8,
            operating_hours_end: 23,
            is_active: true,
            subscription_plan: resolved.requestedPlan,
            subscription_status: 'TRIAL',
            subscription_valid_until: trialValidUntil,
        })
        .select('id, name, subscription_status, subscription_valid_until')
        .single();

    if (venueError || !createdVenue) {
        throw new Error(venueError?.message || 'Failed to create venue');
    }

    const { error: membershipError } = await supabaseAdmin
        .from('user_venues')
        .insert({
            user_id: ownerUserId,
            venue_id: createdVenue.id,
            role: 'owner',
        });

    if (membershipError && membershipError.code !== '23505') {
        await supabaseAdmin.from('venues').delete().eq('id', createdVenue.id);
        throw new Error(membershipError.message);
    }

    const courtsToCreate = Array.from({ length: input.courtsCount }, (_, index) => ({
        venue_id: createdVenue.id,
        name: `Lapangan ${index + 1}`,
        court_number: index + 1,
        is_active: true,
        hourly_rate: hourlyRatePerCourt,
    }));

    const { error: courtError } = await supabaseAdmin.from('courts').insert(courtsToCreate);
    if (courtError) {
        await supabaseAdmin.from('venues').delete().eq('id', createdVenue.id);
        throw new Error(courtError.message);
    }

    await supabaseAdmin.auth.admin.updateUserById(ownerUserId, {
        user_metadata: {
            venue_id: createdVenue.id,
            created_via_admin_panel: true,
        },
    });

    const resetEmailSent = await sendResetPasswordEmail(resolved.email, input.baseUrl);

    await upsertLeadStatus({
        leadId: input.leadId,
        status: 'TRIAL',
        actorUserId: input.actorUserId,
        venueId: createdVenue.id,
    });

    return {
        mode: 'DIRECT' as ProvisionMode,
        venueId: createdVenue.id,
        venueName: createdVenue.name,
        ownerUserId,
        ownerEmail: resolved.email,
        trialValidUntil: createdVenue.subscription_valid_until,
        resetEmailSent,
    };
}

export async function resendInviteById(params: {
    inviteId: string;
    actorUserId: string;
    baseUrl: string;
}) {
    const { data: invite } = await supabaseAdmin
        .from('partner_invites')
        .select('id, token, email, status, expires_at, resend_count, used_at, revoked_at')
        .eq('id', params.inviteId)
        .maybeSingle();

    if (!invite) {
        throw new Error('Invite not found');
    }

    if (invite.used_at) {
        throw new Error('Invite has already been used');
    }

    if (invite.revoked_at) {
        throw new Error('Invite has been revoked');
    }

    const isExpired = new Date(invite.expires_at) < new Date() || invite.status === 'expired';
    const nextToken = isExpired ? createInviteToken() : invite.token;
    const nextExpiry = isExpired ? getInviteExpiryIso() : invite.expires_at;
    const nextStatus = isExpired ? 'pending' : invite.status;

    const { error: updateError } = await supabaseAdmin
        .from('partner_invites')
        .update({
            token: nextToken,
            expires_at: nextExpiry,
            status: nextStatus,
            resend_count: (invite.resend_count || 0) + 1,
            last_sent_at: new Date().toISOString(),
            created_by_admin_id: params.actorUserId,
        })
        .eq('id', invite.id);

    if (updateError) {
        throw new Error(updateError.message);
    }

    const inviteUrl = `${params.baseUrl}/register?token=${nextToken}`;
    await sendInviteEmail(invite.email, inviteUrl);

    return {
        inviteId: invite.id,
        email: invite.email,
        inviteUrl,
        expiresAt: nextExpiry,
    };
}

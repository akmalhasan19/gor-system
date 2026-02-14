export type PlatformAdminRole = 'super_admin' | 'ops_admin';

export type LeadSource = 'smashcourts' | 'manual';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'TRIAL' | 'ACTIVE' | 'CHURN_RISK' | 'REJECTED';

export type ProvisionMode = 'DIRECT' | 'INVITE';

export type AuditActionType =
    | 'LEAD_CREATED'
    | 'LEAD_STATUS_UPDATED'
    | 'PROVISION_DIRECT'
    | 'PROVISION_INVITE'
    | 'INVITE_RESENT'
    | 'VENUE_DEACTIVATED'
    | 'VENUE_REACTIVATED';

export interface PlatformAdmin {
    id: string;
    user_id: string;
    role: PlatformAdminRole;
    is_active: boolean;
}

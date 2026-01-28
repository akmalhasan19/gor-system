export type AppRole = 'owner' | 'manager' | 'staff' | 'cashier';

export const PERMISSIONS = {
    VIEW_FINANCE: ['owner'],
    MANAGE_TEAM: ['owner'],
    DELETE_BOOKING: ['owner', 'manager'],
    EDIT_BOOKING: ['owner', 'manager', 'staff', 'cashier'],
    VIEW_SETTINGS: ['owner', 'manager', 'staff', 'cashier'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

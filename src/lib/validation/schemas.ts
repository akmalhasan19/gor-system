/**
 * Zod Validation Schemas for API Input Validation
 * 
 * Provides type-safe validation for all API endpoints to prevent:
 * - Negative/invalid amounts
 * - Integer overflow attacks
 * - Type confusion/injection attacks
 * - Invalid UUIDs
 * - Missing required fields
 * 
 * Using Zod v4 syntax
 */

import { z } from 'zod';

// ============================================
// Base/Reusable Schemas
// ============================================

/** UUID format validation */
export const UUIDSchema = z.string().uuid();

/** Venue ID wrapper - used by many endpoints */
export const VenueIdSchema = z.object({
    venueId: UUIDSchema,
});

/** Email validation with reasonable limits */
export const EmailSchema = z.string()
    .email()
    .min(5)
    .max(254);

/** Password validation */
export const PasswordSchema = z.string()
    .min(8)
    .max(128);

// ============================================
// Payment Schemas
// ============================================

export const PaymentMethodSchema = z.enum(['QRIS', 'VA']);

export const PaymentChannelSchema = z.enum(['BCA', 'BRI', 'MANDIRI', 'BNI', 'PERMATA', 'BSI']);

export const CreatePaymentSchema = z.object({
    transactionId: UUIDSchema,
    amount: z.number()
        .positive()
        .int()
        .min(1)
        .max(100_000_000),
    paymentMethod: PaymentMethodSchema,
    paymentChannel: PaymentChannelSchema.optional(),
    customerName: z.string()
        .max(100)
        .regex(/^[a-zA-Z\s]*$/)
        .optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// ============================================
// Onboarding Schemas
// ============================================

export const SubscriptionPlanSchema = z.enum(['STARTER', 'PRO', 'BUSINESS']);

export const OnboardingSubmitSchema = z.object({
    venueName: z.string()
        .min(1)
        .max(100)
        .trim(),
    address: z.string()
        .max(500)
        .optional()
        .nullable(),
    phone: z.string()
        .max(20)
        .regex(/^[0-9+\-\s]*$/)
        .optional()
        .nullable(),
    courtsCount: z.number()
        .int()
        .min(1)
        .max(20),
    operatingHoursStart: z.number()
        .int()
        .min(0)
        .max(23)
        .optional()
        .default(8),
    operatingHoursEnd: z.number()
        .int()
        .min(0)
        .max(24)
        .optional()
        .default(23),
    hourlyRatePerCourt: z.number()
        .int()
        .min(0)
        .max(10_000_000)
        .optional()
        .default(50000),
    subscriptionPlan: SubscriptionPlanSchema
        .optional()
        .default('STARTER'),
    xendit_account_id: z.string()
        .max(100)
        .optional()
        .nullable(),
}).refine(
    (data) => data.operatingHoursStart < data.operatingHoursEnd,
    { message: 'Operating end time must be after start time', path: ['operatingHoursEnd'] }
);

export type OnboardingSubmitInput = z.infer<typeof OnboardingSubmitSchema>;

// ============================================
// Phone Verification Schemas
// ============================================

export const PhoneVerifyInitiateSchema = z.object({
    phoneNumber: z.string()
        .min(8)
        .max(15)
        .regex(/^[0-9]+$/),
    accountName: EmailSchema,
    countryCode: z.string()
        .regex(/^\+[0-9]{1,4}$/)
        .optional()
        .default('+62'),
});

export type PhoneVerifyInitiateInput = z.infer<typeof PhoneVerifyInitiateSchema>;

export const PhoneVerifyCodeSchema = z.object({
    code: z.string()
        .length(6)
        .regex(/^[0-9]{6}$/),
    accountName: EmailSchema,
});

export type PhoneVerifyCodeInput = z.infer<typeof PhoneVerifyCodeSchema>;

// ============================================
// Auth Schemas
// ============================================

export const AdminSignupSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    inviteToken: z.string().optional(), // Optional for backward compatibility
});

export type AdminSignupInput = z.infer<typeof AdminSignupSchema>;

export const SyncSessionSchema = z.object({
    venueId: UUIDSchema.optional().nullable(),
});

export type SyncSessionInput = z.infer<typeof SyncSessionSchema>;

// ============================================
// WhatsApp Schemas
// ============================================

export const WhatsAppVenueSchema = VenueIdSchema;

export type WhatsAppVenueInput = z.infer<typeof WhatsAppVenueSchema>;

// ============================================
// Webhook Schemas
// ============================================

export const XenditWebhookStatusSchema = z.enum([
    'PENDING', 'PAID', 'COMPLETED', 'SETTLED', 'ACTIVE',
    'EXPIRED', 'FAILED', 'INACTIVE'
]);

export const XenditWebhookSchema = z.object({
    external_id: z.string().optional(),
    status: XenditWebhookStatusSchema.optional(),
    amount: z.number().optional(),
    id: z.string().optional(),
}).passthrough();

export type XenditWebhookInput = z.infer<typeof XenditWebhookSchema>;

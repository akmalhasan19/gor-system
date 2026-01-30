# IMPLEMENATION PLAN: SUBSCRIPTION SYSTEM (SaaS Architecture)

## 1. Goal Description
Implement a robust subscription management system to handle tiered access (STARTER, PRO, BUSINESS) for GOR managers. This system will control feature access (Feature Gating) and resource limits (e.g., max courts) based on the active plan of the Venue.

## 2. Technical Architecture

### A. Database Schema Updates
We will modify the `venues` table to include subscription details. Subscriptions are tied to the **VENUE**, not the individual user.

**New Enums:**
```sql
CREATE TYPE subscription_plan_type AS ENUM ('STARTER', 'PRO', 'BUSINESS');
CREATE TYPE subscription_status_type AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIAL');
```

**Table Modifications (`venues`):**
- `subscription_plan`: `subscription_plan_type` (Default: 'STARTER')
- `subscription_status`: `subscription_status_type` (Default: 'TRIAL')
- `subscription_valid_until`: `TIMESTAMPTZ` (Nullable)
- `max_courts`: `INTEGER` (Managed by trigger based on plan)

### B. Plan Definitions & Limits (Codebase)
We will define a centralized configuration for plans in `src/lib/constants/plans.ts`:

| Feature | STARTER | PRO | BUSINESS |
| :--- | :--- | :--- | :--- |
| **Max Courts** | 3 | 8 | Unlimited |
| **POS System** | ❌ | ✅ | ✅ |
| **Inventory** | ❌ | ✅ | ✅ |
| **Staff Report** | ❌ | ✅ | ✅ |
| **WhatsApp Notif**| ❌ | ✅ | ✅ |
| **Multi-Staff** | ❌ | ❌ | ✅ |
| **Analytics** | Basic | Standard | Advanced |

### C. Feature Gating Implementation
1.  **Backend RLS (Row Level Security)**:
    - Prevent creating courts if `count >= max_courts`.
    - Prevent accessing `products` / `inventory` tables if plan < PRO.
2.  **Frontend "Gate" Component**:
    - Create `<FeatureGate feature="POS">` component.
    - If user has access: Render children.
    - If user restricted: Render "Upgrade to PRO" banner/blur effect.

### D. Subscription Lifecycle Flows

#### 1. Start / Upgrade Plan
- **User Action**: Selects plan in `/settings/billing`.
- **System**:
    - Updates `venues.subscription_plan` = 'PRO'.
    - Updates `venues.subscription_status` = 'ACTIVE'.
    - Updates `venues.subscription_valid_until` = `NOW() + 1 month`.
    *(Note: Payment Integration is stubbed for now, manually triggered or dummy button)*.

#### 2. Downgrade / Cancel
- **User Action**: Clicks "Cancel Subscription" (Reverts to STARTER at end of period).
- **System**: Sets `subscription_status` = 'CANCELED'. Cron job checks `valid_until` to revert to STARTER.

#### 3. Access Control (Check Logic)
- **Middleware**: Fetches Venue Profile + Plan.
- **Hook**: `useSubscription()` hook to expose `plan`, `features`, `isValid`.

## 3. Proposed Changes

### Database (Supabase Migrations)
#### [NEW] `supabase/migrations/20260201000000_add_subscription_to_venues.sql`
- Create Enums.
- Alter `venues` table.
- Create Trigger to enforce court limits.

### Frontend Code
#### [NEW] `src/lib/constants/plans.ts`
- Define `PLAN_FEATURES` object.

#### [NEW] `src/components/subscription/FeatureGate.tsx`
- Component to wrap protected UI elements.

#### [NEW] `src/hooks/useSubscription.ts`
- Hook to get current venue plan and check permissions.

#### [MODIFY] `src/app/(main)/settings/billing/page.tsx`
- UI to view current plan and upgrade/downgrade.

#### [MODIFY] `src/app/(main)/layout.tsx`
- Inject subscription state context.

## 4. Verification Plan

### Manual Verification
1.  **Schema Check**:
    - Run migration.
    - Verify `venues` table has new columns in Supabase dashboard.
2.  **Limit Testing (STARTER)**:
    - Set venue to 'STARTER'.
    - Try to create 4th Court. -> Expect Error.
    - Try to access POS Menu. -> Expect Blocked/Upgrade Message.
3.  **Upgrade Flow**:
    - Click "Upgrade to PRO".
    - Verify database updates (`plan` becomes 'PRO').
    - Verify POS access is now open.
4.  **Downgrade Flow**:
    - Manually set `subscription_valid_until` to yesterday.
    - Verify access reverts to STARTER restrictions.

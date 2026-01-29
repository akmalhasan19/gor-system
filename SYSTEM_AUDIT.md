# Smash PWA System Audit Report

## 🔍 Executive Summary
A comprehensive review of the codebase (Next.js 16 + Supabase) has revealed a solid foundation with a "Neo-Brutalism" design aesthetic. However, there are significant opportunities to improve **System Performance**, **User Experience (UX)**, and **Scalability**.

---

## 🚨 1. Critical Performance & Security (Middleware)
**Severity: HIGH**

### The Issue
Your `middleware.ts` performs database queries on **every single request** for authenticated users to check `phone_verified` and `has_venue` status.
- **Impact:** This significantly increases latency (Time to First Byte) and puts unnecessary load on your Supabase database. If you have 1000 active users, you are hitting your DB 1000+ times per second just for navigation.
- **Recommendation:** 
- **Status:** ✅ **RESOLVED (Previously Implemented)**.
- **Verification:** Inspection of `src/middleware.ts` confirms that `phone_verified` and `venue_id` checks are performed against `user_metadata` (session) rather than via database queries for general requests. Database queries are restricted to the `/login` route only.

---

## 🎨 2. UX: Navigation State Persistence
**Severity: MEDIUM (High User Annoyance)**

### The Issue
The application uses a single `page.tsx` with a local state `const [activeTab, setActiveTab]` to switch views.
- **Problem:** If a user is on the "Kantin / POS" tab and refreshes the browser, they are forced back to the "Dashboard". This makes deep linking (sharing a URL to the schedule) impossible.
- **Status:** ✅ **RESOLVED (App Router Implemented)**.
- **Verification:** The application has been refactored to use Next.js App Router. Distinct modules now exist at `/dashboard`, `/scheduler`, `/pos`, etc., inside `src/app/(main)/`. This ensures deep linking works natively.

---

## ⚡ 3. Realtime Efficiency & Scalability
**Severity: MEDIUM**

### The Issue
In `src/lib/hooks/use-realtime-subscription.ts`, the app listens for changes and triggers **full re-fetches** (`syncBookings`, `syncProducts`) whenever an event occurs.
```typescript
// Current Behavior
.on('postgres_changes', { table: 'bookings' }, async () => {
    await syncBookings(currentVenueId); // Fetches ALL bookings again
})
```
- **Impact:** As data grows, a single insert by one staff member causes every other online staff member to re-download the entire database table. This is a "Read Bomb".
- **Recommendation:** 
    - **Optimistic Updates:** ✅ **RESOLVED**. Implemented in `src/lib/store.ts` and `use-realtime-subscription.ts`. Now processes realtime payloads locally without re-fetching.

---

## 🛡️ 4. Security: "Nuclear" RLS & Admin Functions
**Severity: LOW (Currently Safe, but sensitive)**

### The Observation
The recent migration `...fix_rls_nuclear.sql` uses `SECURITY DEFINER` functions (`is_venue_owner`) to bypass RLS recursion.
- **Status:** **RESOLVED / SAFE**. 
    - `fix_rls_nuclear.sql`: Verified Safe. (`is_venue_owner`, `get_my_venue_ids`)
    - **FIXED**: `get_shift_totals` was vulnerable (missing access check). Created migration `20260129120000_secure_rpc_functions.sql` to secure it.
- **Note:** Any new `SECURITY DEFINER` functions must immediately check `auth.uid()` or rely on helper functions like `is_venue_owner`.

---

## 📱 5. Mobile UX Refinements
**Severity: LOW**

- **Status:** ✅ **RESOLVED**.
    - **Cart Overlay:** `FloatingCart` updated to `z-40` and `bottom-20` (mobile) to avoid blocking interactions.
    - **Booking Flow:** "Advanced Options" (Recurring, Manual Payment) are now collapsed by default under an "Opsi Tambahan" details section.

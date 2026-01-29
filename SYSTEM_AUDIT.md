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
    1.  **Move Checks to Session:** Store `phone_verified` and `venue_id` inside the Supabase User Metadata or a signed cookie.
    2.  **Client-Side Redirection:** Handle these checks in a `Wrapper` component (e.g., `<AuthGuard>`) on the client side, or only check once per session.

---

## 🎨 2. UX: Navigation State Persistence
**Severity: MEDIUM (High User Annoyance)**

### The Issue
The application uses a single `page.tsx` with a local state `const [activeTab, setActiveTab]` to switch views.
- **Problem:** If a user is on the "Kantin / POS" tab and refreshes the browser, they are forced back to the "Dashboard". This makes deep linking (sharing a URL to the schedule) impossible.
- **Recommendation:** 
    - **Use URL Parameters:** Sync the active tab with the URL (e.g., `?tab=pos` or `?tab=scheduler`).
    - **App Router Structure:** Ideally, migrate distinct modules to their own routes (`/dashboard`, `/pos`, `/scheduler`) to leverage Next.js caching and distinct layouts.

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
    - **Optimistic Updates:** Use the `payload` (the new/updated row data) from the event to directly update the local Zustand store without re-fetching from the server.

---

## 🛡️ 4. Security: "Nuclear" RLS & Admin Functions
**Severity: LOW (Currently Safe, but sensitive)**

### The Observation
The recent migration `...fix_rls_nuclear.sql` uses `SECURITY DEFINER` functions (`is_venue_owner`) to bypass RLS recursion.
- **Status:** **Safe**. The implementation correctly scopes checks to `auth.uid()`.
- **Note:** Ensure strict review of any future functions marked `SECURITY DEFINER`, as they essentially run as "Super Admin".

---

## 📱 5. Mobile UX Refinements
**Severity: LOW**

### The Issue
- **Cart Overlay:** On mobile, the cart interaction overlays the entire screen. The "Floating Cart Button" (`z-50`) might obstruct other interactive elements (like toast notifications or modal actions) on smaller screens.
- **Booking Flow:** The "Advanced Options" in Booking Modal are always visible, adding cognitive load. Grouping them (as planned in your `ux_optimization_plan.md`) is a good move.

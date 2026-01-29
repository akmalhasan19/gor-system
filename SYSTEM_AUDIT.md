# System Audit & Optimization Tracker
**Date:** 2026-01-29
**System:** Smash Partner PWA (GOR System)

## 🚨 CRITICAL PRIORITY (Must Fix Immediately)

### 1. Security: Unsecured Admin Signup Route
- **Severity**: 🔴 Critical
- **Location**: `src/app/api/auth/admin-signup/route.ts`
- **Issue**: The endpoint allows **anyone** to create an administrator account. It bypasses email confirmation using the service role key and has no access control (API Key/Secret).
- **Risk**: Full system takeover if discovered in production.
- **Remediation Plan**:
  - [x] Add strict Environment check (`NODE_ENV === 'development'`).
  - [x] Implement a Master Secret Key header requirement.
  - [x] (Preferred) Delete/Disable the route in production builds.

### 2. PWA: Missing Service Worker
- **Severity**: 🟠 High
- **Location**: Project Root
- **Issue**: The application lacks a Service Worker (`sw.js`). Without this, it is not a "Progressive Web App" in the technical sense:
  - No Offline capability.
  - "Install App" prompt is unreliable (browser won't prompt if PWA criteria aren't met).
  - Static assets are not cached aggressively.
- **Remediation Plan**:
  - [x] Install PWA library (recommended: local `next-pwa` setup or `@serwist/next` for modern Next.js 16).
  - [x] Configure `next.config.ts` to generate `sw.js`.
  - [x] Verify `manifest.webmanifest` linkage.

---

## ⚠️ HIGH PRIORITY (Performance & UX)

### 3. Middleware Performance Bottleneck
- **Severity**: 🟡 Medium
- **Location**: `src/middleware.ts`
- **Issue**: Middleware performs a Database Query (`supabase.from('phone_verifications')...`) when accessing the login page.
- **Impact**: Middleware runs on Edge. Blocking it with a DB call adds latency to the *initial paint* of the login page and consumes DB connections unnecessarily.
- **Remediation Plan**:
  - [ ] Remove DB queries from Middleware.
  - [ ] Rely on `user_metadata` (session claims) for redirection logic.
  - [ ] Move strict "double-checks" to the Client Side (`AuthGuard.tsx`) or a specific API endpoint.

### 4. Manifest & Install Experience
- **Severity**: 🔵 Low
- **Location**: `src/app/manifest.ts`
- **Issue**: Manifest is minimal.
- **Remediation Plan**:
  - [ ] Add `screenshots` array (required for "Richer Install UI" on Android/Desktop).
  - [ ] Add `categories`, `orientation`, and `scope`.
  - [ ] Ensure `apple-mobile-web-app-capable` meta tags are perfect in `layout.tsx`.

---

## 🔍 CODE QUALITY & ARCHITECTURE

### 5. RLS Policy ("Nuclear Option")
- **Status**: ✅ **APPROVED**
- **Analysis**: The move to `SECURITY DEFINER` functions in `20260129006000_fix_rls_nuclear.sql` is the correct architectural decision to solve the infinite recursion issues in Supabase RLS. It effectively separates the "Permission Check" privileges from the "User Context", avoiding the trigger loop.

### 6. Tech Stack
- **Status**: ✅ **EXCELLENT**
- **Analysis**:
  - **Next.js 16**: Cutting edge.
  - **React 19**: Ready for latest features.
  - **Tailwind 4**: CSS-based configuration is future-proof.
  - **Supabase SSR**: Correct pattern used.

---

## 🏃 INITIAL OPTIMIZATION PLAN (Recommended Order)

1. [ ] **FIX**: Secure `src/app/api/auth/admin-signup/route.ts` immediately.
2. [ ] **FEAT**: Implement Service Worker for true PWA support.
3. [ ] **PERF**: Refactor Middleware to remove DB dependency.
4. [ ] **UX**: Enhance `manifest.ts` with screenshots and categories.

# 🔍 COMPREHENSIVE SMASH PWA AUDIT: Next.js 16 & Serwist Edition

## Mission Objective
Conduct an exhaustive, production-grade audit of the **Smash Partner System** (gor-system), specifically targeted at its **Next.js 16 App Router**, **Serwist PWA**, **Supabase SSR**, and **Tailwind 4** architecture.

## Audit Methodology

### Phase 1: Stack-Specific Reconnaissance (MANDATORY)
Before making conclusions, verify the current state of these critical core technologies:

1.  **Next.js 16 App Router Verification**
    *   Check `src/app` structure for proper Route Groups usage (e.g., `(dashboard)`, `(auth)`).
    *   Verify `layout.tsx` hierarchy and metadata API usage.
    *   Identify Server Components vs Client Components (`'use client'`) balance.

2.  **Serwist PWA Integration Check**
    *   Inspect `src/app/sw.ts` for logic (strategies like `CacheFirst` for Supabase storage).
    *   Verify `next.config.ts` Serwist plugin configuration (`swSrc`, `swDest`, `disable` logic).
    *   Confirm `public/sw.js` generation in build output (if available).

3.  **Supabase Security & State**
    *   Review `middleware.ts` for efficient session handling (avoiding DB calls on Edge).
    *   Check `src/utils/supabase` or similar for client/server client instantiation.
    *   **CRITICAL**: Verify adherence to "Nuclear RLS" strategy (Security Definer functions) to prevent infinite recursion.

---

## Phase 2: Multi-Dimensional Analysis

### 🎯 1. PWA & SERWIST COMPLIANCE (Critical)

#### A. Advanced Manifest Audit (`src/app/manifest.ts`)
*   [ ] **Screenshots**: Verify `screenshots` array has correct paths to existing files in `public/screenshots/`.
*   [ ] **Icons**: Confirm `512x512` and `maskable` purposes are clearly defined.
*   [ ] **Theme**: Check if `theme_color` (#D9F99D) matches Tailwind config and current brand guidelines.
*   [ ] **Short Name**: strict check on `short_name` length (must be < 12 chars for mobile homescreens).

#### B. Service Worker (Serwist) Strategy (`src/app/sw.ts`)
*   [ ] **Supabase Storage Caching**: Verify `CacheFirst` strategy for `storage/v1/object/public/`.
*   [ ] **StaleWhileRevalidate**: Are API routes or dynamic content using appropriate strategies?
*   [ ] **Precache Manifest**: Ensure `self.__SW_MANIFEST` is correctly injected.
*   [ ] **Offline Capability**: Test if `offline` fallback is handled (either page or generic response).

#### C. Install Ecosystem
*   [ ] **Meta Tags**: Verify `apple-mobile-web-app-capable` in `src/app/layout.tsx`.
*   [ ] **Splash Screens**: Review if iOS splash screens are generated or shimmed.

---

### 🚀 2. PERFORMANCE (Next.js 16 + Tailwind 4)

#### A. Core Web Vitals & Next.js Features
*   [ ] **Image Optimization**: Confirm usage of `<Image>` for Supabase hosted images (check `remotePatterns` in `next.config.ts`).
*   [ ] **Font Optimization**: Verify `next/font/google` usage (e.g., `Inter` or `Outfit`) with `variable` definition.
*   [ ] **Bundle Analysis**: Check if heavy libraries (like `recharts`, `date-fns`, `framer-motion`) are lazy-loaded or tree-shaken.
*   [ ] **Server Actions**: Are mutations using Server Actions instead of API Routes where possible? (Reduces client JS).

#### B. Tailwind 4 & Shadcn/UI Efficiency
*   [ ] **JIT/Compiler**: Confirm `@tailwindcss/postcss` setup in `postcss.config.mjs`.
*   [ ] **Unused CSS**: Ensure `purge` / `content` paths cover all `src` files.
*   [ ] **Component Weight**: Are Shadcn components (Dialogs, Sheets) lazy-loaded?

---

### 🔒 3. SECURITY HARDENING (Supabase Specialized)

#### A. RLS & Data Access
*   **CRITICAL CHECK**: Review `migration_list.txt` or recent SQL files.
    *   [ ] Confirm sensitive tables have RLS enabled.
    *   [ ] Verify "Security Definer" functions are used for complex logic (preventing recursion).
    *   [ ] Ensure `supabase-js` client creation in `api` routes uses `createClient` (SSR) with cookies, NOT generic client.

#### B. Auth & Headers
*   [ ] **Admin Routes**: Re-verify `src/app/api/auth/admin-signup/route.ts` is DISABLED or strictly protected.
*   [ ] **Middleware**: Ensure strict matcher config to avoid running middleware on static assets.
*   [ ] **Strict-Transport-Security**: Confirm HSTS headers in `next.config.ts`.
*   [ ] **Content-Security-Policy**: Review CSP in `next.config.ts` (images from Supabase allowed?).

---

### ♿ 4. ACCESSIBILITY (Shadcn/UI Base)

#### A. Component Implementation
*   [ ] **Radix UI Primitives**: Verify `Dialog`, `Popover`, `Select` correctly manage focus.
*   [ ] **Forms (`react-hook-form`)**: Ensure `FormLabel` and `FormMessage` are correctly linked via ARIA.
*   [ ] **Color Contrast**: Test the specialized brand colors (e.g., `#D9F99D`) against white/black backgrounds.

---

### 🎨 5. GOR MANAGEMENT UX (Domain Specific)

#### A. Mobile-First Operational Flows
*   [ ] **POS (Point of Sale)**: Test reliability of "Add to Cart" on small touch screens.
*   [ ] **Scheduler**: Verify horizontal scrolling or calendar view usability on mobile.
*   [ ] **Navigation**: Is the Bottom Navigation Bar (if present) blocking critical content or FABs?

#### B. Error Recovery
*   [ ] **Toast Notifications (`sonner`)**: Are success/error toasts visible on mobile (z-index check)?
*   [ ] **Empty States**: Do "No Bookings" or "No Members" views guide the user to Create actions?

---

### 🏗️ 7. CODE QUALITY (TypeScript & Zustand)

#### A. Type Safety
*   [ ] **Supabase Types**: Are Database types generated and imported?
*   [ ] **Zustand Stores**: Are stores properly typed?
*   [ ] **No Implicit Any**: Check `tsconfig.json` `strict: true`.

#### B. Code Organization
*   [ ] **Feature Folder Structure**: Are components grouped by feature (e.g., `components/booking`, `components/pos`) vs generic?

---

## Phase 3: Reporting Format

(Use the same Reporting Format as the original request, but include a section for "Supabase & Serwist Configuration Status".)

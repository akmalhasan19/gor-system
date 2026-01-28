# 🚦 Status & Error UI Implementation Tracker

**Objective:** Implement feedback UIs for all non-optimal system states (Offline, Errors, etc.) using the **Neo-brutalist** design language (Bold, Vibrant, Hard Shadows).

## 🎨 Design Guidelines (Neo-brutalist)
- **Borders:** `border-2 border-black` or `border-4`.
- **Shadows:** Hard shadows, e.g., `shadow-[4px_4px_0px_0px_black]`.
- **Colors:** 
  - Standard: Black & White.
  - Accents: `bg-brand-lime` (Success/Active), `bg-brand-orange` (Warning/Action), `bg-brand-lilac` (Info), `bg-red-500` (Error).
- **Typography:** Uppercase headers, bold weights (`font-black`), distinct hierarchy.
- **Icons:** Large, bold Lucide icons.

---

## 📋 Implementation Checklist

### 1. 📶 Network Disconnected (Offline Indicator)
**Scenario:** Device loses internet connection.
- [x] **Component:** `src/components/ui/network-status.tsx`
  - [x] Design: Sticky banner (Bottom/Top), Yellow/Red scheme.
  - [x] Text: "⚠️ KONEKSI TERPUTUS / OFFLINE".
  - [x] Logic: Listen to `window.online` / `window.offline` events.
- [x] **Integration:** Add to `src/app/layout.tsx`.

### 2. 🔍 404 Not Found (Page Missing)
**Scenario:** User navigates to a URL that doesn't exist.
- [x] **Page:** `src/app/not-found.tsx`
  - [x] Visual: "OUT OF BOUNDS" or "404" with Badminton/Court theme.
  - [x] Action: Button "KEMBALI KE LAPANGAN" (Back to Home).

### 3. 💥 Global System Error (500/Crash)
**Scenario:** React rendering error or unhandled exception.
- [x] **Page:** `src/app/error.tsx`
  - [x] Visual: "FAULT!" or "SISTEM ERROR". Red/Black theme.
  - [x] Action: Button "ULANGI PEMAINAN" (Try Again/Reload).
- [x] **Page:** `src/app/global-error.tsx` (Critical fallback).

### 4. ⛔ Access Denied (403 Unauthorized)
**Scenario:** User tries to access a restricted page (e.g., Cashier -> Owner Settings).
- [x] **Component:** `src/components/ui/access-denied.tsx`
  - [x] Visual: "PELANGGARAN!" or "AKSES DITOLAK".
  - [x] Action: Button "KEMBALI KE AREA AMAN".

### 5. 🚧 Maintenance Mode (System Updating)
**Scenario:** System is manually put into maintenance mode via Env Var or Database Config.
- [x] **Page/Component:** `src/components/maintenance-screen.tsx`
  - [x] Visual: "SEDANG PERBAIKAN LAPANGAN". Construction theme.
  - [x] Logic: Check `NEXT_PUBLIC_MAINTENANCE_MODE` or Supabase config.

---

## 📝 Notes
- Ensure all components use `lucide-react` icons.
- Buttons should have hover effects: `hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`.

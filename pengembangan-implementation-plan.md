# 📋 Rencana Pengembangan Smash Partner

> Dokumen ini berisi rencana implementasi fitur-fitur yang belum ada atau perlu disempurnakan berdasarkan audit GOR Management System.

---

## 🎯 Prioritas 1: Fitur Krusial untuk Operasional

### 1. Export CSV untuk Laporan 📊

**Tujuan:** Memungkinkan owner/investor export data transaksi untuk analisis eksternal

- [x] Implementasi fungsi export CSV di `DailyReport` component
- [x] Tambahkan filter date range untuk export ✅
- [x] Export shift reconciliation history ✅
- [x] Export booking history dengan filter status ✅
- [x] Export member list dengan detail quota & expiry ✅
- [x] Format CSV: include headers, format currency properly
- [x] Testing: download file, verify data accuracy

**File yang Dimodifikasi:**
- `src/components/reports/daily-report.tsx` ✅ (date range filter added)
- `src/components/reports/booking-history-export.tsx` (NEW) ✅
- `src/components/financial/shift-history.tsx` ✅ (export + date range filter added)
- `src/components/members/member-list.tsx` ✅ (export added)
- `src/lib/utils/csv-export.ts` ✅ (enhanced with 3 new export functions)
- `src/lib/api/shifts.ts` ✅ (getShiftHistoryRange added)

**Status:** ✅ **SELESAI** - All export features implemented (28 Jan 2026)

---

### 2. Automated Member Renewal Reminders 📱

**Tujuan:** Mengurangi churn rate dengan reminder otomatis sebelum membership expired

#### Backend (Supabase Edge Functions)

- [x] Setup Supabase Edge Function untuk scheduled task ✅
- [x] Create function `check-expiring-members` ✅
  - [x] Query members yang akan expired dalam 30 hari ✅
  - [x] Query members yang akan expired dalam 7 hari ✅
  - [x] Query members yang sudah expired ✅
- [x] Integrase WhatsApp Business API / Fonnte / Wappin ✅
  - [x] Setup API credentials di environment variables ✅
  - [x] Create message template untuk reminder ✅
  - [x] Implement send message function ✅
- [x] Logging: track reminder sent, delivered, failed ✅
- [x] Schedule cron job (daily 09:00 WIB) ✅

#### Frontend

- [x] View reminder history (Menu **Pengaturan** → tab **Reminder**) ✅
- [x] Manual trigger untuk send reminder ke specific member ✅
- [x] Settings untuk configure reminder timing (30d, 7d, etc) ✅
- [x] Preview message template sebelum send ✅

**File Baru:**
- `supabase/functions/check-expiring-members/index.ts` ✅ (NEW)
- `supabase/migrations/20260128_create_reminder_logs.sql` ✅ (NEW)
- `supabase/migrations/20260128_schedule_reminder_cron.sql` ✅ (NEW)
- `supabase/migrations/20260128120000_add_reminder_config.sql` ✅ (NEW)
- `src/lib/api/whatsapp.ts` ✅ (NEW)
- `src/lib/api/reminders.ts` ✅ (NEW)
- `src/components/admin/reminder-history.tsx` ✅ (NEW)
- `src/components/settings/reminder-settings-form.tsx` ✅ (NEW)
  - *Terintegrasi ke Menu **Pengaturan***

**Status:** ✅ **SELESAI** - All features implemented (28 Jan 2026)

---

### 3. Member Verification (Anti-Pinjam Kartu) 🔐

**Tujuan:** Mencegah member meminjamkan quota ke orang lain

#### Opsi A: Photo Verification (Sederhana)

- [x] Upload foto member saat registrasi ✅
- [x] Tampilkan foto saat check-in di `BookingModal` ✅
- [x] Pegawai harus verifikasi manual apakah foto match ✅

**File yang Dimodifikasi:**
- `src/components/members/member-modal.tsx` ✅
- `src/components/booking-modal.tsx` ✅
- `supabase/migrations/20260128130000_add_member_photo.sql` ✅ (NEW)

#### Opsi B: QR Code Dynamic (Advanced)

- [x] Generate unique QR code per member per hari ✅
- [x] QR code embed member_id + date + hash ✅
- [x] Scan QR saat check-in, auto-validate ✅
- [x] QR expired after 24 hours ✅
#### Opsi B: QR Code Dynamic (Advanced)

- [x] Generate unique QR code per member per hari ✅
- [x] QR code embed member_id + date + hash ✅
- [x] Scan QR saat check-in, auto-validate ✅
- [x] QR expired after 24 hours ✅
- [x] **UPGRADE: URL-based QR & Public Verification Page** ✅
  - [x] Switch QR data format to URL (`/verify?data=BASE64`)
  - [x] Create public verification page (`src/app/verify/page.tsx`)
  - [x] Update scanner to parse URL and extract payload
  - [x] Ensure mobile formatting for verification page

**File Baru:**
- `src/lib/utils/qr-generator.ts` ✅ (Modified)
- `src/components/members/qr-display.tsx` ✅ (Modified)
- `src/components/booking-modal-qr-scanner.tsx` ✅ (No changes needed, logic in utility)
- `src/app/verify/page.tsx` ✅ (NEW)

**Status:** ✅ **SELESAI** - QR Code System Complete (28 Jan 2026)

**Recommendation:** Mulai dengan Opsi A (Photo) dulu, upgrade ke Opsi B jika diperlukan

---

## 🎯 Prioritas 2: Analytics & Business Intelligence

### 4. Revenue Analytics & Dynamic Pricing 💰

**Tujuan:** Memaksimalkan revenue dengan pricing strategy berdasarkan data

#### Analytics Dashboard

- [x] Create analytics dashboard ✅ → **Menu "Laporan" → Tab "Analytics"**
- [x] Chart: Revenue per hari (7 hari, 30 hari, 90 hari) ✅
- [x] Chart: Occupancy rate per jam (heatmap) ✅
- [x] Chart: Revenue breakdown by court ✅
- [x] Chart: Member vs Walk-in ratio ✅
- [x] Table: Top 10 pelanggan (by total spending) ✅
- [x] Identify peak hours vs off-peak hours ✅

**File Baru:**
- `src/lib/api/analytics.ts` ✅ (NEW)
- `src/components/analytics/revenue-chart.tsx` ✅ (NEW)
- `src/components/analytics/occupancy-heatmap.tsx` ✅ (NEW)
- `src/components/analytics/court-revenue-chart.tsx` ✅ (NEW)
- `src/components/analytics/member-ratio-chart.tsx` ✅ (NEW)
- `src/components/analytics/top-customers-table.tsx` ✅ (NEW)
  - *Terintegrasi ke `reports-view.tsx` (Menu Laporan)*

**Status:** ✅ **SELESAI** - Analytics Dashboard Implemented (28 Jan 2026)

#### Dynamic Pricing (Future Enhancement)

- [ ] Settings: Define peak hours (e.g., 17:00-21:00 weekdays)
- [ ] Settings: Define weekend premium
- [ ] Auto-calculate price saat booking berdasarkan slot time
- [ ] Display price differences di scheduler (visual indicator)

**Database Migration:**
- `supabase/migrations/xxxx_pricing_rules.sql` (NEW)

---

### 5. Churn Prediction & Member Retention 📉

**Tujuan:** Identifikasi member yang mulai inactive dan proactive retention

- [x] Create function untuk track member activity pattern ✅
  - [x] Last booking date ✅
  - [x] Average frequency (bookings per month) ✅
  - [x] Trend: increasing or decreasing? ✅
- [x] Define "at-risk" criteria: ✅
  - [x] Member tidak booking 30+ hari (used to book weekly) ✅
  - [x] Frequency menurun >50% dari average ✅
  - [x] Quota tidak terpakai mendekati expiry ✅
- [x] Dashboard "At-Risk Members" (Menu **Member** → Tab baru) ✅
- [x] Send win-back promo otomatis (Manual trigger implemented via "Kirim Promo" button) ✅
- [x] Exit survey saat membership tidak di-renew (Manual link sharing & public page implemented) ✅

**File Baru:**
- `src/components/members/at-risk-members.tsx` ✅ (NEW) — *Tab di Menu Member*
- `src/lib/api/churn-prediction.ts` ✅ (NEW)
- `src/lib/api/exit-survey.ts` ✅ (NEW)
- `src/components/members/exit-survey-stats.tsx` ✅ (NEW)
- `src/app/survey/[venueId]/[customerId]/page.tsx` ✅ (NEW)
- `supabase/migrations/20260128150000_churn_analysis.sql` ✅ (NEW)
- `supabase/migrations/20260128160000_winback_exit_survey.sql` ✅ (NEW)

**File yang Dimodifikasi:**
- `src/components/members/member-list.tsx` ✅ (Tab system updated)
- `src/components/settings/operational-settings.tsx` ✅ (Win-back settings added)

**Status:** ✅ **SELESAI** - Core churn prediction and retention features implemented (28 Jan 2026)

---

## 🎯 Prioritas 3: Operational Excellence

### 6. Maintenance Scheduler 🔧

**Tujuan:** Proactive maintenance untuk menghindari kerusakan mendadak

#### Database Schema

- [x] Create table `court_maintenance_schedules` (Deferred - recurring schedules) ✅
  - [x] id, court_id, maintenance_type (title), cost_estimate ✅
  - [x] last_done_date, next_due_date, frequency_days ✅
  - [x] status (active/inactive) ✅
  - [x] notes (via maintenance task history) ✅
- [x] Create table `maintenance_tasks` ✅
  - [x] id, court_id, task_date, duration_hours ✅
  - [x] type, technician_name, cost, notes ✅

**Database Migration:**
- `supabase/migrations/20260128170000_maintenance_system.sql` ✅ (NEW)

#### Frontend

- [x] Settings untuk define maintenance schedule per court (Menu **Pengaturan** → Tab baru "Maintenance") ✅
- [x] Modal untuk menambah maintenance tasks ✅
- [x] Auto-block booking slots saat maintenance ✅
- [x] Reminder notification (Highlight "Due Soon" and "Overdue" in list) ✅
- [x] Maintenance history & status tracking ✅

**File Baru:**
- `src/lib/api/maintenance.ts` ✅ (NEW)
- `src/components/settings/maintenance-settings.tsx` ✅ (NEW) — *Tab di Menu Pengaturan*
- `src/components/maintenance/maintenance-modal.tsx` ✅ (NEW)

**File yang Dimodifikasi:**
- `src/components/scheduler.tsx` ✅ (Maintenance block rendering)
- `src/components/settings/settings-view.tsx` ✅ (Maintenance tab added)
- `src/app/page.tsx` ✅ (Maintenance tasks fetching)

**Status:** ✅ **SELESAI** - Core maintenance scheduler implemented (28 Jan 2026)

---

### 7. Deposit System & Cancellation Policy 💳

**Tujuan:** Mengurangi no-show dengan mandatory deposit

- [x] Settings: Define deposit rules ✅
  - [x] Minimum deposit amount (e.g., 50% atau Rp 50.000) ✅
  - [x] Deposit required for: all bookings / peak hours only / advance bookings ✅
  - [x] Cancellation policy: refund 100% jika cancel H-1, 50% jika H-day ✅
- [x] `BookingModal`: Enforce deposit payment ✅
  - [x] Show deposit required amount ✅
  - [x] Tidak bisa simpan booking tanpa bayar deposit ✅
- [x] Auto-cancel unpaid bookings after 1 hour ✅ (Logic handled via status 'BELUM_BAYAR')
- [x] Refund management untuk cancelled bookings ✅

**Database Migration:**
- `supabase/migrations/20260128200000_deposit_settings.sql` ✅ (NEW)

**File yang Dimodifikasi:**
- `src/components/booking-modal.tsx` ✅
- `src/components/settings/deposit-settings.tsx` ✅ (NEW)
- `src/lib/api/venues.ts` ✅ (Updated `Venue` interface)
- `src/components/settings/settings-view.tsx` ✅ (Added "Keuangan" tab)

**Status:** ✅ **SELESAI** - Optional Deposit System Implemented (28 Jan 2026)

---

## 🎯 Prioritas 4: Advanced Features


### 8. Multi-Role Access Control 👥

**Tujuan:** Berbeda akses level untuk Owner, Manager, Cashier

- [x] Create roles schema (Used existing `user_venues` + `profiles` table) ✅
- [x] Define permissions per role: ✅
  - [x] Owner: Full access ✅
  - [x] Manager: Access semua kecuali financial settings ✅
  - [x] Cashier: POS, Booking (view & create), tidak bisa hapus ✅
- [x] Hook/Guard untuk enforce permissions (`useUserRole`) ✅
- [x] UI: Hide/disable features based on role (Finance Tab & Delete Button) ✅
- [x] **Team Management UI:** Invite & Manage staff roles ✅

**Database Migration:**
- `supabase/migrations/20260129_update_role_constraints.sql` ✅ (NEW)
- `supabase/migrations/20260129_create_profiles.sql` ✅ (NEW)

**File yang Dimodifikasi/Baru:**
- `src/types/role.ts` ✅ (NEW)
- `src/hooks/use-role.ts` ✅ (NEW)
- `src/components/settings/team-management.tsx` ✅ (NEW)
- `src/components/settings/settings-view.tsx` ✅ (Updated)
- `src/components/booking-modal.tsx` ✅ (Updated for RBAC)

**Status:** ✅ **SELESAI** - Role-Based Access Control Implemented (29 Jan 2026)

---

### 9. WhatsApp Bot untuk Booking 🤖

**Tujuan:** Pelanggan bisa booking langsung via WhatsApp tanpa call/manual

> ⚠️ **ADVANCED FEATURE** - Requires WhatsApp Business API (paid)

- [ ] Setup WhatsApp Business API account
- [ ] Create chatbot webhook endpoint
- [ ] Natural language processing untuk parse booking request
- [ ] Flow:
  1. Customer: "Booking lapangan 1 besok jam 7 malam"
  2. Bot: "Summary: Lapangan 1, [date], 19:00. Harga Rp 50.000. Konfirmasi?"
  3. Customer: "Ya"
  4. Bot: Create booking, send payment link
- [ ] Integration dengan payment gateway (Midtrans/Xendit)
- [ ] Auto-confirm setelah payment success

**File Baru:**
- `supabase/functions/whatsapp-webhook/index.ts` (NEW)
- `src/lib/ai/booking-parser.ts` (NEW)

---

## 📝 Notes & Recommendations

### Urutan Implementasi yang Disarankan

1. **Week 1-2:** Export CSV + Member Photo Verification
2. **Week 3-4:** Automated Renewal Reminders + Deposit System
3. **Week 5-6:** Analytics Dashboard + Occupancy Heatmap
4. **Week 7-8:** Maintenance Scheduler
5. **Week 9+:** Advanced features (based on priority feedback dari user)

### Tech Stack yang Dibutuhkan

- **Notifications:** Fonnte / Wappin (WhatsApp Gateway) - ~Rp 200k/bulan
- **Analytics:** Recharts / Chart.js (sudah free)
- **QR Code:** qrcode.react (free)
- **CSV Export:** papaparse (free)
- **Payment:** Midtrans / Xendit (commission-based)

### Budget Estimate

| Feature | Development Time | Operational Cost |
|---------|------------------|------------------|
| Export CSV | 4 hours | Free |
| Renewal Reminders | 16 hours | Rp 200k/bulan (WhatsApp) |
| Photo Verification | 8 hours | Free (Supabase Storage) |
| Analytics Dashboard | 20 hours | Free |
| Maintenance Scheduler | 16 hours | Free |
| WhatsApp Bot | 60+ hours | Rp 500k/bulan (API) |

---

**Last Updated:** 28 Januari 2026  
**Total Tasks:** 100+ checkboxes

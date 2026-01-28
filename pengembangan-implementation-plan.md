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

- [x] Create admin page untuk view reminder history ✅
- [x] Manual trigger untuk send reminder ke specific member ✅
- [x] Settings page untuk configure reminder timing (30d, 7d, etc) ✅
- [x] Preview message template sebelum send ✅

**File Baru:**
- `supabase/functions/check-expiring-members/index.ts` ✅ (NEW)
- `supabase/migrations/20260128_create_reminder_logs.sql` ✅ (NEW)
- `supabase/migrations/20260128_schedule_reminder_cron.sql` ✅ (NEW)
- `supabase/migrations/20260128120000_add_reminder_config.sql` ✅ (NEW)
- `src/lib/api/whatsapp.ts` ✅ (NEW)
- `src/lib/api/reminders.ts` ✅ (NEW)
- `src/components/admin/reminder-history.tsx` ✅ (NEW)
- `src/app/admin/settings/reminders/page.tsx` ✅ (NEW)
- `src/components/settings/reminder-settings-form.tsx` ✅ (NEW)

**Status:** ✅ **SELESAI** - All features implemented (28 Jan 2026)

---

### 3. Member Verification (Anti-Pinjam Kartu) 🔐

**Tujuan:** Mencegah member meminjamkan quota ke orang lain

#### Opsi A: Photo Verification (Sederhana)

- [ ] Upload foto member saat registrasi
- [ ] Tampilkan foto saat check-in di `BookingModal`
- [ ] Pegawai harus verifikasi manual apakah foto match

**File yang Dimodifikasi:**
- `src/components/members/member-modal.tsx`
- `src/components/booking-modal.tsx`
- `supabase/migrations/xxxx_add_member_photo.sql` (NEW)

#### Opsi B: QR Code Dynamic (Advanced)

- [ ] Generate unique QR code per member per hari
- [ ] QR code embed member_id + date + hash
- [ ] Scan QR saat check-in, auto-validate
- [ ] QR expired after 24 hours

**File Baru:**
- `src/lib/utils/qr-generator.ts` (NEW)
- `src/components/members/qr-display.tsx` (NEW)
- `src/components/booking-modal-qr-scanner.tsx` (NEW)

**Recommendation:** Mulai dengan Opsi A (Photo) dulu, upgrade ke Opsi B jika diperlukan

---

## 🎯 Prioritas 2: Analytics & Business Intelligence

### 4. Revenue Analytics & Dynamic Pricing 💰

**Tujuan:** Memaksimalkan revenue dengan pricing strategy berdasarkan data

#### Analytics Dashboard

- [ ] Create analytics page `/admin/analytics`
- [ ] Chart: Revenue per hari (7 hari, 30 hari, 90 hari)
- [ ] Chart: Occupancy rate per jam (heatmap)
- [ ] Chart: Revenue breakdown by court
- [ ] Chart: Member vs Walk-in ratio
- [ ] Table: Top 10 pelanggan (by total spending)
- [ ] Identify peak hours vs off-peak hours

**File Baru:**
- `src/app/admin/analytics/page.tsx` (NEW)
- `src/components/analytics/revenue-chart.tsx` (NEW)
- `src/components/analytics/occupancy-heatmap.tsx` (NEW)
- `src/lib/api/analytics.ts` (NEW)

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

- [ ] Create function untuk track member activity pattern
  - [ ] Last booking date
  - [ ] Average frequency (bookings per month)
  - [ ] Trend: increasing or decreasing?
- [ ] Define "at-risk" criteria:
  - [ ] Member tidak booking 30+ hari (used to book weekly)
  - [ ] Frequency menurun >50% dari average
  - [ ] Quota tidak terpakai mendekati expiry
- [ ] Admin dashboard untuk "At-Risk Members"
- [ ] Send win-back promo otomatis
- [ ] Exit survey saat membership tidak di-renew

**File Baru:**
- `src/app/admin/retention/page.tsx` (NEW)
- `src/lib/api/churn-prediction.ts` (NEW)
- `supabase/functions/calculate-churn-risk/index.ts` (NEW)

---

## 🎯 Prioritas 3: Operational Excellence

### 6. Maintenance Scheduler 🔧

**Tujuan:** Proactive maintenance untuk menghindari kerusakan mendadak

#### Database Schema

- [ ] Create table `court_maintenance_schedules`
  - [ ] id, court_id, maintenance_type (floor_wax, net_replace, lighting, etc)
  - [ ] last_done_date, next_due_date, frequency_days
  - [ ] status (pending, in_progress, completed)
  - [ ] notes, cost
- [ ] Create table `maintenance_tasks`
  - [ ] id, court_id, task_date, duration_hours
  - [ ] type, technician_name, cost, notes

**Database Migration:**
- `supabase/migrations/xxxx_maintenance_system.sql` (NEW)

#### Frontend

- [ ] Settings page untuk define maintenance schedule per court
- [ ] Calendar view untuk maintenance tasks
- [ ] Auto-block booking slots saat maintenance
- [ ] Reminder notification 7 days before due
- [ ] Maintenance history & cost tracking

**File Baru:**
- `src/app/admin/maintenance/page.tsx` (NEW)
- `src/components/maintenance/schedule-calendar.tsx` (NEW)
- `src/components/maintenance/maintenance-form.tsx` (NEW)

---

### 7. Deposit System & Cancellation Policy 💳

**Tujuan:** Mengurangi no-show dengan mandatory deposit

- [ ] Settings: Define deposit rules
  - [ ] Minimum deposit amount (e.g., 50% atau Rp 50.000)
  - [ ] Deposit required for: all bookings / peak hours only / advance bookings
  - [ ] Cancellation policy: refund 100% jika cancel H-1, 50% jika H-day
- [ ] `BookingModal`: Enforce deposit payment
  - [ ] Show deposit required amount
  - [ ] Tidak bisa simpan booking tanpa bayar deposit
- [ ] Auto-cancel unpaid bookings after 1 hour
- [ ] Refund management untuk cancelled bookings

**Database Migration:**
- `supabase/migrations/xxxx_deposit_settings.sql` (NEW)

**File yang Dimodifikasi:**
- `src/components/booking-modal.tsx`
- `src/components/settings/deposit-settings.tsx` (NEW)

---

## 🎯 Prioritas 4: Advanced Features

### 8. Offline Mode & PWA Support 📴

**Tujuan:** Tetap bisa operasi saat internet mati

> ⚠️ **PERHATIAN:** Fitur ini kompleks dan memerlukan architectural changes signifikan. Recommended untuk ditunda hingga prioritas 1-3 selesai.

- [ ] Setup Service Worker untuk PWA
- [ ] Cache critical assets (scheduler, POS)
- [ ] IndexedDB untuk local data storage
- [ ] Sync queue untuk pending mutations
- [ ] Conflict resolution strategy saat reconnect
- [ ] Offline indicator di UI
- [ ] Testing: simulate offline scenarios

**File Baru:**
- `public/service-worker.js` (NEW)
- `src/lib/offline/sync-manager.ts` (NEW)
- `src/lib/offline/conflict-resolver.ts` (NEW)

---

### 9. Multi-Role Access Control 👥

**Tujuan:** Berbeda akses level untuk Owner, Manager, Cashier

- [ ] Create roles table di database
- [ ] Define permissions per role:
  - [ ] Owner: Full access
  - [ ] Manager: Access semua kecuali financial settings
  - [ ] Cashier: POS, Booking (view & create), tidak bisa hapus/edit
- [ ] Middleware untuk enforce permissions
- [ ] UI: Hide/disable features based on role
- [ ] Audit log: track who did what

**Database Migration:**
- `supabase/migrations/xxxx_roles_permissions.sql` (NEW)

**File yang Dimodifikasi:**
- `src/middleware.ts`
- `src/lib/auth.ts`

---

### 10. WhatsApp Bot untuk Booking 🤖

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
| Offline Mode | 40+ hours | Free |
| WhatsApp Bot | 60+ hours | Rp 500k/bulan (API) |

---

**Last Updated:** 28 Januari 2026  
**Total Tasks:** 100+ checkboxes

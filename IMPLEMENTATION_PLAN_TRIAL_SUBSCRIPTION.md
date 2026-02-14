# Implementasi Trial + Paywall Onboarding (Xendit) untuk Smash Partner

## Ringkasan
Kita akan ubah onboarding jadi 2 jalur:
1. **Bayar Sekarang**: user isi onboarding, sistem buat akun venue dalam mode trial Starter 7 hari + generate payment Xendit sesuai plan yang dipilih, tampilkan form QRIS/VA di onboarding, lalu saat webhook sukses user diarahkan ke dashboard dengan plan aktif berbayar.
2. **Lanjut Nanti**: user langsung ke dashboard dengan **Starter TRIAL 7 hari**.

Selain onboarding, **upgrade dari dashboard/settings juga wajib lewat Xendit**.  
Saat trial habis, user diblokir ke halaman upgrade sampai berlangganan.

## Perubahan API/Interface/Type (publik/internal)

1. **Schema request onboarding**
- `OnboardingSubmitSchema` ditambah:
  - `checkoutAction: 'PAY_NOW' | 'CONTINUE_LATER'`
  - `selectedPlan: 'STARTER' | 'PRO' | 'BUSINESS'` (plan yang dipilih di step subscription)
  - `paymentMethod?: 'QRIS' | 'VA'`
  - `paymentChannel?: 'BCA' | 'BRI' | 'MANDIRI' | 'BNI' | 'PERMATA' | 'BSI'`

2. **API onboarding**
- `POST /api/onboarding/submit` response diperluas:
  - untuk `CONTINUE_LATER`: `{ success, venueId, mode: 'TRIAL' }`
  - untuk `PAY_NOW`: `{ success, venueId, mode: 'PAY_NOW', payment: { ...qr/va payload... } }`

3. **API baru subscription payment**
- `POST /api/subscriptions/create-payment`
  - input: `venueId`, `targetPlan`, `paymentMethod`, `paymentChannel?`
  - output: detail QRIS/VA + `subscriptionPaymentId`, `external_id`
- dipakai di Billing Settings (upgrade dari dashboard).

4. **Webhook**
- `POST /api/webhooks/xendit` ditambah branch khusus `subscription payment` (berdasarkan `external_id` prefix, mis. `sub-*`), idempotent.

5. **Type baru**
- `SubscriptionPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'`
- `SubscriptionCheckoutAction = 'PAY_NOW' | 'CONTINUE_LATER'`

## Perubahan Data Model (Supabase)

1. **Pastikan kolom subscription tersedia dan konsisten**
- `venues.subscription_plan`
- `venues.subscription_status`
- `venues.subscription_valid_until`
- `venues.pending_subscription_plan`
- `venues.pending_subscription_effective_date`
- Catatan: ada indikasi schema drift (`current_schema.sql` belum memuat pending columns), jadi migrasi harus jadi source of truth.

2. **Tabel baru: `subscription_payments`**
- kolom minimum:
  - `id`, `venue_id`, `target_plan`, `amount`, `status`
  - `external_id` (unique), `xendit_id`
  - `payment_method`, `payment_channel`
  - `xendit_qr_string`, `xendit_virtual_account_number`, `xendit_expiry_date`
  - `metadata`, `created_at`, `updated_at`, `paid_at`
- index:
  - `external_id`, `venue_id`, `status`

3. **RLS**
- `SELECT`: hanya user yang tergabung di venue itu.
- `INSERT/UPDATE`: via server route (service role), bukan langsung dari client.

4. **Backfill trial**
- Untuk venue yang status `TRIAL` tapi `subscription_valid_until` null:
  - set `subscription_valid_until = created_at + interval '7 days'` (jika sudah lewat, otomatis dianggap expired).

## Perubahan Backend Logic

1. **Onboarding completion rule**
- Saat onboarding selesai (baik pay now maupun lanjut nanti):
  - selalu buat venue dengan:
    - `subscription_plan = 'STARTER'`
    - `subscription_status = 'TRIAL'`
    - `subscription_valid_until = now() + interval '7 days'`
- Jika user pilih `PAY_NOW`:
  - simpan `pending_subscription_plan = selectedPlan`
  - generate `subscription_payment` baru (setiap klik bayar = invoice baru)

2. **Webhook subscription success**
- Validasi signature/token tetap wajib.
- Jika event sukses:
  - update `subscription_payments.status = 'PAID'`, `paid_at`.
  - update venue:
    - `subscription_plan = target_plan`
    - `subscription_status = 'ACTIVE'`
    - `subscription_valid_until`:
      - jika masih aktif: extend dari `valid_until` lama + 30 hari
      - jika sudah lewat/null: `now() + 30 hari`
    - clear `pending_subscription_*`
- duplicate callback harus aman (idempotent, no double extend).

3. **Trial expiry enforcement**
- Middleware/guard tambahan:
  - jika `subscription_status` in (`PAST_DUE`, `CANCELED`) atau `TRIAL` expired:
    - redirect ke halaman paywall/subscription lock.
  - exception path: auth, webhook, endpoint pembayaran subscription, static, health.

4. **Upgrade dari settings via Xendit**
- Upgrade flow existing (yang langsung update plan) diganti:
  - generate subscription payment
  - aktifkan plan hanya setelah webhook sukses
- Downgrade terjadwal bisa tetap existing (pending plan next month) jika tidak mengubah requirement.

## Perubahan Frontend

1. **Onboarding Step akhir**
- Tombol final jadi:
  - `Bayar Sekarang`
  - `Lanjut Nanti`
- `Bayar Sekarang`:
  - submit onboarding + buka panel pembayaran QRIS/VA (reuse pola komponen `XenditPayment`, tapi untuk subscription).
  - listen realtime status `subscription_payments`; saat `PAID` -> `refreshVenue()` + redirect `/dashboard`.
- `Lanjut Nanti`:
  - submit onboarding + redirect `/dashboard`.

2. **Dashboard trial notice**
- Banner persisten selama status `TRIAL`:
  - teks persuasif + sisa hari/jam trial
  - CTA ke billing upgrade
  - tampil juga untuk user yang sempat klik bayar sekarang tapi belum lunas (karena tetap trial).

3. **Billing Settings**
- Upgrade plan -> buka payment modal Xendit (bukan update langsung).
- Setelah pembayaran sukses (realtime/webhook), refresh state dan tampilkan status ACTIVE + valid until baru.

4. **Halaman lock saat trial habis**
- Tampilkan alasan plan expired + CTA berlangganan.
- Batasi akses ke fitur utama sampai payment sukses.

## Skenario Uji (Test Cases)

1. **Onboarding - Lanjut Nanti**
- selesai onboarding -> masuk dashboard.
- venue tersimpan `STARTER + TRIAL`, `valid_until = now+7d`.

2. **Onboarding - Bayar Sekarang sukses**
- form QRIS/VA tampil.
- webhook sukses -> venue jadi ACTIVE sesuai plan pilih.
- redirect dashboard otomatis.

3. **Onboarding - Bayar Sekarang tidak dilanjutkan**
- user keluar/login lagi -> tetap masuk dashboard sebagai Starter TRIAL.
- banner ajakan berlangganan tampil.

4. **Retry payment**
- klik bayar berkali-kali -> setiap klik buat payment record baru.
- hanya payment sukses terakhir yang mengubah plan (idempotent & konsisten).

5. **Trial expiry**
- setelah lewat `valid_until` -> user diarahkan ke lock page, tidak bisa akses dashboard normal.

6. **Upgrade dari Billing**
- pilih plan -> payment dibuat.
- webhook sukses -> plan aktif + validity extend sesuai rule.

7. **Webhook security**
- signature/token invalid -> 401.
- duplicate webhook event -> tidak double-update.

8. **RLS/authorization**
- user venue A tidak bisa lihat payment venue B.
- endpoint create-payment menolak venue yang bukan milik user.

## Rollout dan Monitoring

1. Deploy migration dulu (`subscription_payments` + backfill trial).
2. Deploy API/webhook update.
3. Deploy UI onboarding + dashboard banner + billing payment flow.
4. Pantau log:
- webhook success/fail rate
- jumlah trial expired yang kena lock
- conversion trial -> paid
- error create-payment per method (QRIS/VA)

## Asumsi & Default yang Dipakai (sudah dikunci)

1. Payment onboarding pakai **modal QRIS/VA internal** (bukan redirect hosted checkout).
2. Trial dimulai saat user klik **Lanjut Nanti** (dan untuk Bayar Sekarang yang belum lunas, diperlakukan sama).
3. Trial = **7 hari** dengan Starter.
4. Notifikasi trial di dashboard = **banner persisten**.
5. Saat trial habis = **blokir akses sampai upgrade**.
6. Jika Bayar Sekarang belum lunas = user tetap bisa masuk dashboard trial.
7. Retry bayar = **buat invoice/payment baru tiap klik**.
8. Upgrade setelah onboarding juga wajib via **Xendit**.
9. Plan berbayar aktif **30 hari** dari pembayaran.
10. Jika masih ada sisa masa aktif, pembayaran baru **extend dari valid_until lama** (tidak hangus).

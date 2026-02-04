# Panduan Integrasi Xendit Webhook (Untuk Tim PWA/User App)

Dokumen ini dibuat untuk memastikan sinkronisasi data pembayaran antara **Website Booking (PWA)** dan **Dashboard Partner (Smash Partner)** berjalan lancar, mengingat kita menggunakan Akun Xendit yang sama.

## Konteks Masalah
Dashboard Partner membaca status pembayaran dari tabel `bookings` di database Supabase. Jika pembayaran sukses tapi tabel `bookings` tidak diupdate (hanya update tabel `payments` atau `transactions`), maka di Dashboard akan terlihat **"TAGIH!"** atau **"BELUM BAYAR"**.

## Status Webhook Dashboard
Saat ini, **Dashboard Partner (`smash-partner`)** sudah memiliki endpoint webhook di:
`POST /api/webhooks/xendit`

Logika di dashboard sudah diperbaiki untuk melakukan:
1. Update status tabel `payments` -> `PAID`
2. Update status tabel `transactions` -> `PAID`
3. **(CRITICAL)** Update status tabel `bookings` -> `LUNAS` dan `paid_amount` sesuai harga.

## Apa yang Perlu Dicek di Sisi PWA?

Karena Xendit biasanya hanya mengirimkan webhook ke **SATU URL Utama** yang disetting di Dashboard Xendit, ada dua skenario:

### Skenario A: Xendit Dikonfigurasi ke URL Dashboard (`smash-partner`)
Jika URL Callback di Xendit diarahkan ke domain Dashboard Partner, maka **PWA tidak perlu melakukan apa-apa** untuk update status database. Dashboard yang akan menangani update database, dan PWA tinggal mendengarkan perubahan via Supabase Realtime atau refresh data.

### Skenario B: Xendit Dikonfigurasi ke URL PWA
Jika URL Callback di Xendit diarahkan ke backend PWA, maka **Backend PWA WAJIB melakukan update database yang lengkap**.

**Checklist untuk Developer PWA:**
1. [ ] Saat menerima callback `PAID` dari Xendit, pastikan Anda mengupdate tabel `transactions` menjadi `PAID`.
2. [ ] **PENTING:** Anda juga harus mencari dr record `transaction_items` atau `bookings` yang berelasi, dan mengupdate field:
   - `bookings.status` = `'LUNAS'` (Jangan `'pending'` atau `'PAID'`) - *Case Sensitive*
   - `bookings.paid_amount` = `full_amount`
3. [ ] Jika poin 2 tidak dilakukan, Dashboard Partner akan menganggap user belum lunas!

## Kesimpulan
Untuk keamanan maksimal, pastikan logika "Update Booking jadi LUNAS" ada di sistem manapun yang menerima Webhook dari Xendit.

---
**Shared Credentials:**
- Kita menggunakan `XENDIT_CALLBACK_TOKEN` yang sama. Pastikan validasi token dilakukan untuk keamanan.

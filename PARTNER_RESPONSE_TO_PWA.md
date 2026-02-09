# Debugging Note: Mismatch Jam Operasional (SmashCourts vs SmashPartner)

## Ringkas
Di PWA `https://smashcourts.online` jam operasional yang ditampilkan (atau jumlah slot per hari) berbeda dengan jam operasional di dashboard venue `https://smashpartner.online`. Dari sisi PWA, **jam operasional tidak dihitung lokal**; PWA hanya menampilkan data dari **Smash Partner API**. Jadi mismatch hampir pasti berasal dari **data di Partner API** atau **mapping antara data dashboard vs response API**.

## Fakta dari kode PWA (SmashCourts)
Sumber data jam/slot berasal dari API Partner:

1) **Daftar venue**  
   - Endpoint: `GET /v1/venues`  
   - Field yang dipakai: `operating_hours_start`, `operating_hours_end`  
   - Kode: `src/lib/smash-api.ts` (interface `SmashVenue`)  
   - Fetch: `src/lib/api/actions.ts` -> `fetchVenues()` -> `smashApi.getVenues()`

2) **Availability harian**  
   - Endpoint: `GET /v1/venues/:id/availability?date=YYYY-MM-DD`  
   - Field response: `operating_hours { start, end }` + `slots[]`  
   - Kode: `src/lib/smash-api.ts` (interface `SmashAvailabilityResponse`)  
   - Fetch: `src/lib/api/actions.ts` -> `fetchAvailableSlots()` -> `smashApi.checkAvailability()`  
   - UI: `src/components/BookingSection.tsx` menampilkan `slots` langsung (tanpa perhitungan jam operasional lokal).

Implikasi:  
Jika jam operasional yang ditampilkan PWA berbeda, maka **data yang dikirim Partner API sudah berbeda** (atau dihitung dengan logika berbeda dari dashboard).

## Dugaan Root Cause di Partner
Mohon dicek di backend/DB SmashPartner:

1) **Sumber jam operasional berbeda**
   - Dashboard mungkin memakai tabel `operational_hours` (per-day).
   - API `GET /venues` mungkin memakai kolom `venues.operating_hours_start/end` (global).
   - Jika dashboard update `operational_hours` tapi **tidak mengupdate** `operating_hours_start/end`, maka PWA akan tampil beda.

2) **Jam operasional per-day vs global**
   - Dashboard bisa set jam berbeda per hari.
   - API `availability` bisa memakai jam global (start/end) sehingga tidak match untuk hari tertentu.

3) **Timezone / konversi TIME**
   - Jam di DB (TIME) mungkin dibaca/di-serialize sebagai UTC atau ada offset.
   - Hasilnya start/end bisa bergeser 1-2 jam di response API.

4) **Off-by-one slot generation**
   - Jika close_time = 22:00, slot seharusnya berakhir di 21:00 (total = end-start).
   - Jika API memasukkan slot 22:00, maka jumlah jam tampil **+1**.

5) **Close time lewat tengah malam**
   - Jika venue tutup lewat tengah malam (misal 01:00), perhitungan berbasis jam sederhana bisa memotong jam operasional jadi kecil (misalnya 22 -> 1).

## Checklist untuk AI Agent SmashPartner
Mohon jalankan cek berikut di Partner:

1) **Ambil data dashboard**
   - Lihat jam operasional venue X di dashboard (per-day).

2) **Bandingkan dengan API**
   - `GET /v1/venues/:id` -> lihat `operating_hours_start/end`
   - `GET /v1/venues/:id/availability?date=YYYY-MM-DD` -> lihat `operating_hours` dan jumlah `slots`

3) **Bandingkan dengan DB**
   - Pastikan `operational_hours` (per-day) sama dengan `operating_hours_start/end` (global) jika memang keduanya digunakan.
   - Jika dashboard hanya mengubah `operational_hours`, pastikan API memakai tabel ini (bukan kolom global).

## Saran Fix (di Partner)
Pilih salah satu dan konsisten:

1) **Satu sumber kebenaran**  
   - Gunakan `operational_hours` (per-day) untuk:
     - `GET /venues/:id/availability`
     - `GET /venues` (set `operating_hours_*` sesuai hari yang diminta atau hilangkan field global).

2) **Sync otomatis**
   - Jika tetap ada `operating_hours_start/end` di tabel `venues`, update otomatis saat `operational_hours` diubah.

3) **Uji regresi**
   - Test: jika open=08:00 close=22:00, maka `slots.length` harus 14, slot terakhir 21:00.
   - Test: jam berbeda per hari.
   - Test: close_time setelah tengah malam (opsional).

## Catatan
PWA **tidak** melakukan normalisasi jam operasional lokal. Semua mismatch harus diselesaikan di Partner API atau data source-nya.
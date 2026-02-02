# Panduan Implementasi & Kebutuhan API (Website <-> PWA Smash)

Dokumen ini merangkum spesifikasi teknis dan kebutuhan API yang diperlukan oleh **Website Badminton Court Booking System** untuk dapat berinteraksi sepenuhnya dengan **PWA Smash**.

Berdasarkan *External API Guide v1*, beberapa fitur sudah tersedia, namun terdapat **gap (kekurangan)** yang perlu dilengkapi agar website dapat menampilkan data Venue, Foto, dan Fasilitas secara dinamis.

---

## 1. Arsitektur Integrasi

*   **Client**: Website Badminton Court Booking System.
*   **Server**: PWA Smash (Sistem Manajemen GOR).
*   **Auth**: Semua request wajib menyertakan header `x-api-key`.

---

## 2. API yang Sudah Tersedia (Ready to Implement)

Berikut adalah fungsi yang dapat langsung diimplementasikan menggunakan endpoint yang ada di `external-api-guide.md`:

### A. Cek Ketersediaan Lapangan
*   **Fitur Website**: Halaman "Booking" / Calendar.
*   **Endpoint**: `GET /bookings/availability`
*   **Kegunaan**: Mengetahui slot jam berapa saja yang sudah *booked* (terisi) sehingga website bisa men-disable tombol booking di jam tersebut.
*   **Logic**:
    *   Ambil data `occupied`.
    *   Render slot waktu 08:00 - 23:00.
    *   Jika jam ada di list `occupied`, tandai sebagai "Tidak Tersedia".

### B. Membuat Booking (Checkout)
*   **Fitur Website**: Checkout & Payment.
*   **Endpoint**: `POST /bookings`
*   **Kegunaan**: Meneruskan data booking dari user website ke database PWA Smash.
*   **Mapping Data**:
    *   `customerName` -> Diambil dari Nama User yang login di Website.
    *   `phone` -> Diambil dari No HP User di Website.
    *   `status` -> Dikirim `LUNAS` jika Website menghandle payment gateway langsung. Dikirim `pending` jika user memilih bayar di tempat (COD) atau transfer manual nanti.

---

## 3. Kebutuhan API Tambahan (GAP Analysis)

Agar Website dapat berfungsi sebagai platform booking yang lengkap dan informatif (menampilkan profil GOR, foto, dll), **PWA Smash perlu menyediakan endpoint tambahan berikut**:

### A. Booking Flow Improvements (PENTING)

#### 1. Update Status Pembayaran (`PATCH /bookings/{id}/status`)
*   **Masalah**: Endpoint `POST /bookings` hanya untuk booking baru.
*   **Kebutuhan**: Jika user melakukan booking (Pending) -> lalu melakukan Pembayaran 5 menit kemudian via Payment Gateway -> Website perlu cara untuk mengupdate status booking tersebut menjadi `LUNAS` tanpa membuat booking ganda.
*   **Usulan Endpoint**:
    ```http
    PATCH /bookings/:id/payment
    Body: { "status": "LUNAS", "payment_ref": "ORDER_123" }
    ```

### B. Venue & Court Data (PENTING)

#### 2. Get Venue Profile (`GET /venue/profile` atau `GET /venues/{id}`)
*   **Masalah**: Saat ini tidak ada endpoint untuk mengambil Nama GOR, Alamat Lengkap, Link Google Maps, Deskripsi GOR, Jam Operasional, dan List Fasilitas (Wifi, Toilet, Kantin).
*   **Kebutuhan**: Website perlu menampilkan landing page GOR yang menarik.
*   **Usulan Response**:
    ```json
    {
      "id": "uuid-venue",
      "name": "GOR Smash Juara",
      "address": "Jl. Raya Badminton No. 1, Jakarta",
      "maps_url": "https://maps.google.com/...",
      "description": "GOR Badminton standar internasional dengan lantai karpet.",
      "start_hour": "08:00",
      "end_hour": "23:00",
      "facilities": ["Toilet", "Musholla", "Parkir Luas", "Kantin"],
      "photos": [
         "https://api.smash/uploads/venue_main.jpg",
         "https://api.smash/uploads/venue_lobby.jpg"
      ]
    }
    ```

#### 3. Get Court Details with Photos (`GET /courts`)
*   **Masalah**: Endpoint `GET /courts` saat ini hanya mengembalikan ID, Nama, dan Harga.
*   **Kebutuhan**: User ingin melihat foto kondisi lapangan sebelum booking.
*   **Usulan Update Response `GET /courts`**:
    *   Tambahkan field `photo_url` (Array string) untuk gambar lapangan.
    *   Tambahkan field `description` (String) misal "Lantai Karpet Vinyl, Pencahayaan 500 Lux".

### C. User Experience (Opsional tapi Disarankan)

#### 4. My Booking History (`GET /bookings/history`)
*   **Kebutuhan**: User website ingin melihat daftar booking yang pernah mereka buat di GOR tersebut.
*   **Parameter**: Filter by `phone` atau `customerId` (jika ada sinkronisasi user).
*   **Usulan Request**:
    `GET /bookings/history?phone=081234567890`

---

## 4. Rangkuman Implementasi

Untuk Developer Website:
1.  Gunakan `GET /bookings/availability` untuk real-time slot checking.
2.  Gunakan `POST /bookings` untuk lock slot.
3.  **Request ke Tim Backend PWA Smash**:
    *   "Tolong tambahkan endpoint untuk data Venue (Nama, Alamat, Foto)."
    *   "Tolong tambahkan field foto (`photo_url`) di endpoint list lapangan."
    *   "Tolong sediakan endpoint update status pembayaran agar bisa integrasi Payment Gateway dengan sempurna."

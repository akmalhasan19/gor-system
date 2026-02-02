# Panduan Integrasi External API Smash Partner v1

Dokumen ini ditujukan untuk **Developer Eksternal** atau Tim IT yang ingin menghubungkan aplikasi pihak ketiga (seperti Aplikasi Booking Online Publik) ke sistem Manajemen GOR Smash Partner.

---

## 🔐 Autentikasi (API Key)

Semua request ke External API harus menyertakan header `x-api-key`.

*   **Header Name**: `x-api-key`
*   **Value**: Kunci rahasia yang digenerate oleh Admin.
    *   **Cara Generate**: Jalankan script `node generate-key.js` di terminal server.
    *   **Penting**: Kunci ini bersifat rahasia. Jika bocor, segera generate baru dan hapus kunci lama di database.

---

> [!IMPORTANT]
> **API KEY BARU (Efektif per 2026-02-02)**
> Gunakan key yang telah diberikan secara aman (lihat .env Anda). Key tidak ditulis di dokumen ini untuk keamanan.

---

## 📡 Endpoints

Base URL: `https://[BERUBAH-SESUAI-DOMAIN-ANDA]/api/external/v1`

### 1. Cek Ketersediaan Lapangan (`GET /bookings/availability`)
Mengecek slot mana yang sudah terisi pada tanggal tertentu.

**Request:**
`GET /bookings/availability?venueId=[UUID]&date=YYYY-MM-DD`

**Header:**
`x-api-key: sk_live_...`

**Response Success (200):**
```json
{
  "data": {
    "date": "2026-02-01",
    "venueId": "...",
    "courts": [
      { "id": "uuid-1", "name": "LAPANGAN 1", "court_number": 1 },
      { "id": "uuid-2", "name": "LAPANGAN 2", "court_number": 2 }
    ],
    "occupied": [
      { "courtId": "uuid-1", "startTime": "10:00:00", "duration": 1 },
      { "courtId": "uuid-2", "startTime": "14:00:00", "duration": 2 }
    ]
  },
  "meta": {
    "count": 2
  }
}
```
*Note: Jika slot tidak ada di list `occupied`, berarti slot tersebut KOSONG dan bisa dibooking.*

---

### 2. Membuat Booking Baru (`POST /bookings`)
Membuat reservasi baru. Status default adalah `pending` (menunggu pembayaran), namun Anda bisa mengirim status `LUNAS` jika user sudah membayar.

**Request:**
`POST /bookings`

**Header:**
`x-api-key: sk_live_...`
`Content-Type: application/json`

**Body:**
```json
{
  "venueId": "UUID_VENUE",
  "courtId": "UUID_COURT_ATAU_NOMOR",
  "bookingDate": "2026-02-01",
  "startTime": "18:00:00",
  "duration": 1,
  "customerName": "Rizky (Online)",
  "phone": "081234567890",
  "phone": "081234567890",
  "price": 50000,
  "status": "LUNAS"
}
```
**Field `status` (Optional):**
*   `pending` (Default): Belum bayar / Menunggu pembayaran.
*   `LUNAS`: Sudah dibayar lunas.
*   `DP`: Sudah bayar DP.
*   `BELUM_BAYAR`: Belum bayar (sama dengan pending tapi status eksplisit).
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-booking",
    "status": "pending",
    ...
  }
}
```

---

---

### 3. Update Status Booking (`PATCH /bookings/:id/payment`)
Mengupdate status pembayaran booking (misal menjadi `LUNAS`).

**Request:**
`PATCH /bookings/[BOOKING_UUID]/payment`

**Body:**
```json
{
  "status": "LUNAS"
}
```
*Valid Status*: `"LUNAS"`, `"DP"`, `"BELUM_BAYAR"`, `"pending"`, `"cancelled"`.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Booking ... status updated to LUNAS"
}
```

---

### 4. Mendapatkan Profil GOR (`GET /venues/:id`)
Mendapatkan detail lengkap venue termasuk fasilitas dan foto (jika ada).

**Request:**
`GET /venues/[VENUE_UUID]`

**Response Success (200):**
```json
{
  "id": "...",
  "name": "GOR Smash Juara",
  "address": "Jl. Raya...",
  "maps_url": "https://maps.google.com/...",
  "description": "...",
  "start_hour": "08:00",
  "end_hour": "23:00",
  "facilities": ["Toilet", "Musholla", "Parkir"],
  "photos": ["url1.jpg", "url2.jpg"]
}
```

---

### 5. Mendapatkan Info Lapangan & Harga (`GET /courts`)
Mendapatkan daftar lapangan aktif beserta harganya.

**Request:**
`GET /courts`

**Response Success (200):**
```json
{
  "data": [
    {
      "id": "uuid-court",
      "name": "LAPANGAN 1",
      "hourly_rate": 50000,
      "is_active": true,
      "description": "Lantai Karpet Vinyl...",
      "photo_url": ["https://..."]
    },
    ...
  ]
}
```

---

## 🚫 Error Codes

*   `401 Unauthorized`: API Key tidak ada.
*   `403 Forbidden`: API Key salah atau tidak aktif.
*   `400 Bad Request`: Parameter kurang / format tanggal salah.
*   `500 Internal Server Error`: Kesalahan sistem.

---

## 🧪 Cara Testing

Anda bisa menggunakan cURL atau Postman.

**Contoh cURL Cek Jadwal:**
```bash
curl -X GET "http://localhost:3000/api/external/v1/bookings/availability?venueId=VENUE_UUID&date=2026-02-01" \
     -H "x-api-key: sk_live_test_12345"
```

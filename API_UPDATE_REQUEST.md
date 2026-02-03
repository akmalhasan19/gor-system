# 📋 Permintaan Update API: Location-Based Venue Filtering

> **Dari**: Badminton Court Booking System (Frontend)  
> **Untuk**: PWA Smash API Team  
> **Tanggal**: 4 Februari 2026  
> **Prioritas**: High

---

## 🎯 Tujuan

Mengaktifkan fitur **filter venue berdasarkan lokasi user** di frontend Booking System. Saat ini, semua venue ditampilkan tanpa mempertimbangkan jarak, sehingga user di Jakarta tetap melihat venue di Magelang sebagai "tersedia di sekitar".

---

## 📦 Yang Diperlukan

### 1. Tambahkan Field Baru di Response `GET /venues`

Response saat ini:
```json
{
  "id": "uuid",
  "name": "GOR Djarum Magelang",
  "address": "Jl. Raya Magelang...",
  "photo_url": "...",
  "courts_count": 4,
  "operating_hours_start": 6,
  "operating_hours_end": 22,
  "booking_tolerance": 30,
  "description": "..."
}
```

**Response yang diharapkan (dengan 3 field baru):**
```json
{
  "id": "uuid",
  "name": "GOR Djarum Magelang",
  "address": "Jl. Raya Magelang...",
  "latitude": -7.4797,       // ← BARU
  "longitude": 110.2177,     // ← BARU
  "city": "Magelang",        // ← BARU
  "photo_url": "...",
  "courts_count": 4,
  "operating_hours_start": 6,
  "operating_hours_end": 22,
  "booking_tolerance": 30,
  "description": "..."
}
```

---

### 2. Update Schema Database (Tabel `venues`)

Tambahkan kolom berikut jika belum ada:

| Kolom       | Tipe Data        | Nullable | Keterangan                          |
|-------------|------------------|----------|-------------------------------------|
| `latitude`  | DECIMAL(10, 8)   | YES      | Koordinat latitude venue            |
| `longitude` | DECIMAL(11, 8)   | YES      | Koordinat longitude venue           |
| `city`      | VARCHAR(100)     | YES      | Nama kota untuk display di frontend |

**Contoh Migration (PostgreSQL/Supabase):**
```sql
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city VARCHAR(100);
```

---

### 3. Isi Data Koordinat untuk Venue yang Ada

Untuk venue **"GOR Djarum Magelang"**, gunakan data berikut:

| Field       | Value           |
|-------------|-----------------|
| `latitude`  | `-7.4797`       |
| `longitude` | `110.2177`      |
| `city`      | `Magelang`      |

> 💡 **Tip**: Koordinat venue bisa didapat dari Google Maps dengan cara:
> 1. Search nama venue di Google Maps
> 2. Klik kanan pada lokasi → "What's here?"
> 3. Copy koordinat yang muncul (contoh: -7.4797, 110.2177)

---

## 🔧 Cara Kerja di Frontend

Setelah API diupdate, frontend akan:

1. **Mendeteksi lokasi user** menggunakan browser Geolocation API
2. **Menghitung jarak** antara lokasi user dan setiap venue menggunakan formula Haversine
3. **Filter venue** berdasarkan jarak:
   - ✅ **Tampil**: Venue dalam radius 50km
   - ⚠️ **Tidak tampil**: Venue di luar radius 50km (dengan info "Tidak ada venue di sekitarmu")
4. **Menampilkan badge jarak** pada setiap venue card (contoh: "15 km")

---

## ⚠️ Catatan Penting

- Field `latitude`, `longitude`, dan `city` boleh **nullable** untuk backward compatibility
- Jika venue tidak memiliki koordinat, frontend akan tetap menampilkannya (benefit of doubt)
- Pastikan response `GET /venues/:id` juga menyertakan field baru ini

---

## 📞 Kontak

Jika ada pertanyaan, silahkan hubungi tim frontend Booking System.

---

**Status**: ✅ Implementasi selesai (4 Februari 2026)

### Implementasi yang dilakukan:
1. ✅ Migration database: `20260204000000_add_venue_location_fields.sql`
2. ✅ API endpoint `GET /venues` - field baru sudah tersedia
3. ✅ API endpoint `GET /venues/:id` - field baru sudah tersedia
4. ✅ Dokumentasi API di `API_V1_GUIDE.md` sudah diupdate

> **⚠️ Catatan**: Jalankan migration dengan `npx supabase db push` dan isi data koordinat venue via Supabase Dashboard atau SQL.

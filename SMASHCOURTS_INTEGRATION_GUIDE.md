# Panduan Implementasi: PWA Agent (smashcourts.online)

**TUJUAN:**  
Memperbaiki kalkulasi revenue di Dashboard Partner (`smashpartner.online`). Saat ini, webhbook mengirimkan **Full Amount** (termasuk fee Xendit) sehingga laporan keuangan tidak akurat.

**TUGAS ANDA:**  
Ubah logic pengiriman webhook ke `smashpartner.online` agar hanya mengirimkan **Nominal Bersih (Net Revenue)**.

---

## 1. Masalah Saat Ini

*   **Logic Lama:** Mengirim `amount` dari callback Xendit (misal: 32,000).
*   **Efek:** Dashboard "Pendapatan Hari Ini" mencatat 32,000.
*   **Target:** Dashboard harus mencatat 30,000 (Harga asli lapangan).

## 2. Instruksi Perubahan Code

Di file handler webhook Anda (kemungkinan di `src/app/api/webhooks/xendit/route.ts` atau `lib/partner-sync.ts`), **jangan** kirim raw amount dari Xendit.

### Logic Baru (Required)
Saat memanggil endpoint sync partner (`/api/webhooks/pwa-sync`), pastikan field `paid_amount` diisi dengan **Harga Booking** (`booking.price`), BUKAN total yang dibayar user.

### Contoh Code (TypeScript)

```typescript
// Dapatkan data booking dari database lokal Anda
const booking = await prisma.booking.findUnique({ ... });

// Tentukan Net Revenue (Harga Asli Lapangan)
// HINDARI: const revenue = xenditCallback.amount; (INI SALAH karena ada admin fee)
const revenue = booking.price; 

// Kirim ke Partner URL
await fetch(process.env.SMASHPARTNER_SYNC_URL + '/api/webhooks/pwa-sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-pwa-signature': generateSignature(...) 
  },
  body: JSON.stringify({
    event: 'booking.paid',
    booking_id: booking.id,
    
    // [CRITICAL CHANGE]
    // Kirim harga asli lapangan, bukan total bayar Xendit
    paid_amount: revenue, 
    
    status: 'LUNAS',
    timestamp: new Date().toISOString()
  })
});
```

## 3. Verifikasi
Pastikan payload yang terkirim ke `smashpartner.online` terlihat seperti ini untuk booking seharga 30,000 dengan admin fee 2,000:

```json
{
  "event": "booking.paid",
  "booking_id": "...",
  "paid_amount": 30000, 
  "status": "LUNAS",
  ...
}
```
*(Perhatikan `paid_amount` adalah 30000, bukan 32000)*

---
**Catatan:**  
Perubahan ini hanya perlu dilakukan di sisi pengirim (`smashcourts.online`). Sisi penerima (`smashpartner.online`) akan mencatat apa saja yang Anda kirimkan di field `paid_amount`.

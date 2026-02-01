# Panduan Logika Bisnis PWA Smash (Deep Dive)

**Konteks Sistem**: PWA Smash adalah **Internal Management System** (POS & Booking Management) yang digunakan HANYA oleh Kasir/Admin/Owner GOR. Pemain/Customer tidak memiliki akses langsung ke sistem ini.

Dokumen ini menganalisis logika bisnis untuk membantu operasional GOR menghindari *human error* dan masalah administrasi.

---

## 1. Logika Booking (Pemesanan)

Fitur ini digunakan Admin untuk mencatat reservasi dari customer (via WA/Telpon/Datang Langsung).

### A. Booking Creation & Validation
*   **Aktor**: Admin/Kasir.
*   **Trigger**: Admin menginput data booking di halaman Scheduler.
*   **Validasi**:
    *   **Visual**: Admin melihat slot kosong di layar.
    *   **System**: Validasi input (nama, no hp).
    *   **Potensi Masalah**: Karena *Human Error* adalah musuh utama, sistem saat ini belum memblokir jika ada 2 Admin (misal: Owner di rumah & Kasir di GOR) yang mencoba booking slot yang sama bersamaan (*Race Condition*), meskipun kemungkinannya kecil untuk penggunaan internal.
*   **Data Flow**: Admin Submit -> `insert` ke Supabase -> Update tampilan Jadwal.

### B. Auto-Cancel System (Pencegah "Ghost Booking")
Fitur ini membantu Admin membersihkan jadwal dari booking yang "menggantung" (lupa di-update atau orangnya tidak datang), agar Admin tidak perlu cek satu-satu secara manual.

*   **Logic Location**: `src/lib/utils/auto-cancel.ts`.
*   **Trigger**: Otomatis (Cron Job).
*   **Fungsi**:
    *   Mendeteksi booking hari ini yang **Belum Check-in** DAN **Belum Bayar** lewat dari batas toleransi (15 menit).
    *   **Action**: Batalkan booking otomatis.
    *   **Benefit**: Admin tidak perlu repot menghapus booking "PHP" (Pemberi Harapan Palsu) satu per satu. Lapangan jadi terlihat "Kosong" lagi untuk bisa dijual ke orang lain.

---

## 2. Logika Langganan (Membership)

Membantu Admin mengelola jatah main member tanpa perlu kartu fisik atau catatan buku.

### A. Model Data
*   Sistem mencatat siapa Member, kapan expired, dan sisa kuota.

### B. Penggunaan Membership (Quota Deduction)
*   **Masalah Operasional**: Admin sering lupa mencatat/mengurangi jatah member jika sedang ramai.
*   **Logika Saat Ini**:
    *   **Via Scheduler**: Saat Admin input booking member, ada opsi "Gunakan Kuota". Jika dicentang -> Kuota otomatis berkurang. (Aman).
    *   **Via POS (Kasir)**: Jika Member datang langsung (Walk-in) dan Admin memproses lewat menu Kasir/POS, logika *pengurangan kuota belum berjalan otomatis*.
    *   **Risiko**: Admin harus ingat mengurangi kuota manual. Jika lupa, Member untung, GOR rugi.

### C. Perpanjangan Membership
*   **Status**: Manual.
*   Saat Member bayar perpanjangan, Admin yang harus mengedit tanggal expired di data customer secara manual.

---

## 3. Logika Pembayaran (Keuangan & Kasir)

Mencatat arus uang masuk agar "Tutup Buku" di akhir hari akurat dan tidak selisih.

### A. POS Transaction (Kasir)
*   **Fungsi**: Admin mencatat pembayaran Cash, QRIS, atau Transfer.
*   **Metode Online (Xendit)**:
    *   Admin bisa membuatkan tagihan QRIS/Virtual Account langsung dari kasir agar tercatat sistem.
    *   Admin menunjukkan QR/Link ke Customer -> Customer Bayar -> Sistem otomatis status "LUNAS".
    *   **Benefit**: Mengurangi risiko Admin salah input nominal "Sudah Bayar" padahal uang belum masuk mutasi.

### B. Rekonsiliasi
*   Semua transaksi masuk ke tabel `transactions` untuk laporan harian.
*   Memisahkan mana uang Cash (di laci) dan uang Transfer (di bank) untuk memudahkan hitungan setoran.

---

## 4. Logika Notifikasi (Customer Retention)

Membantu Admin menjaga hubungan dengan pelanggan tanpa perlu WA manual satu-satu.

### A. Integrasi WhatsApp
*   Sistem terhubung ke WA Gateway (Fonnte) untuk mengirim pesan atas nama GOR.

### B. Pengingat Otomatis (Reminders)
*   **Konsep**: Sistem otomatis WA member yang masa aktifnya mau habis (H-7, H-30).
*   **Kondisi Code**: Logika sudah ada, tapi "Pemicu"-nya (Trigger) belum dipasang.
*   **Dampak**: Saat ini Admin masih harus cek manual siapa yang mau expired dan chat manual. Jika trigger diaktifkan, Admin bisa hemat waktu.

---

## Ringkasan untuk Manajemen GOR

Sistem ini dirancang untuk menutup celah *Human Error*:
1.  **Lupa Hapus Booking Batal** -> Ditangani **Auto-Cancel**.
2.  **Lupa Kurangi Kuota Member** -> Sudah aman di Scheduler, tapi **masih berisiko di POS (Walk-in)**.
3.  **Salah Hitung Uang** -> Ditangani sistem **POS & Laporan Harian**.
4.  **Lupa Follow-up Member** -> Fitur **Auto-Reminder** perlu diaktifkan agar Admin tidak perlu chat manual.

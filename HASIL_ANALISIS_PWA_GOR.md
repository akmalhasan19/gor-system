# EXECUTIVE SUMMARY

*   **High Potential, Niche Market**: Badminton adalah olahraga populer #2 di Indonesia. Pasar GOR sangat terfragmentasi dengan ribuan pemilik usaha kecil (UKM) yang masih bergantung pada sistem manual (kertas & pulpen), membuka peluang digitalisasi yang masif.
*   **Critical Pain Point**: Kebocoran pendapatan (*revenue leakage*) akibat fraud atau kesalahan pencatatan adalah masalah #1 bagi pemilik GOR. Solusi Anda secara langsung mengatasi masalah "berdarah" ini.
*   **Adoption Barrier**: Literasi teknologi staff/admin GOR adalah tantangan terbesar. UX aplikasi harus seintuitif WhatsApp agar bisa diadopsi.
*   **Verdict**: **GO 🚀**.

# VERDICT: GO 🚀

**Reasoning**: Anda memiliki MVP yang *production-ready* yang menyelesaikan masalah finansial nyata dan menyakitkan (kebocoran pendapatan & kesalahan manual) di pasar yang besar dan relevan secara kultural (Badminton Indonesia). *Tech stack* yang digunakan (Next.js, Supabase, Xendit) modern dan *scalable*. Risiko utamanya bukan teknikal, melainkan perilaku/behavioral (mengubah kebiasaan lama). Sebagai *solo founder* dengan *burn rate* rendah, Anda memiliki waktu untuk mencari *Product-Market Fit* (PMF).

# MARKET ANALYSIS (Konteks Indonesia)

**a) Market Opportunity**
*   **Estimasi Jumlah GOR**: Diperkirakan ada 3.000 - 5.000 GOR badminton komersial di Indonesia. (Jabodetabek ~500+, Surabaya ~200+, Bandung ~150+).
*   **Digital Adoption**: ~80% masih manual (buku tulis/WhatsApp). ~15% menggunakan Excel sederhana. <5% menggunakan *dedicated software*.
*   **Early Adopter Profile**: Pemilik GOR generasi muda (Gen Y/Z) yang meneruskan bisnis keluarga, atau investor GOR modern. Mereka sadar bahwa "data adalah uang".

**b) Segmentasi & Willingness to Pay**
1.  **GOR "Kampung" (1-3 Lapangan)**: Sangat sensitif harga. Margin tipis. Sering dikelola langsung pemilik. *Willingness to Pay (WTP)*: Rp 100k - 200k/bulan.
2.  **GOR Menengah (4-8 Lapangan)**: *Sweet spot*. Memiliki staff admin (risiko fraud tinggi). Butuh kontrol jarak jauh. *WTP*: Rp 300k - 500k/bulan.
3.  **GOR Besar/Chain (9+ Lapangan / Multi-cabang)**: Bisnis serius. Butuh inventory, POS, dan shift management. *WTP*: Rp 750k - 1.5jt+/bulan.

**c) Competitive Landscape**
*   **Pemain Eksisting**: Coda, Gelora, Ayo Indonesia (namun mereka lebih fokus ke *Booking App* untuk *player* / marketplace).
*   **Diferensiasi**: Kompetitor fokus ke "User Booking" (B2C Marketplace). Anda fokus ke "GOR Management" (B2B SaaS / Operating System). Posisi ini lebih *sticky* (sulit diganti) karena menyangkut operasional harian.

# MONETIZATION RECOMMENDATION

**Model Terbaik**: **Tiered Subscription with 14-Day Free Trial**.
Model *Freemium* berisiko memberatkan biaya server tanpa *revenue* yang jelas di awal untuk solo founder.

**Strategi Harga (Bulanan):**

*   **STARTER (Rp 199.000)**
    *   Cocok untuk: GOR Kecil (1-3 Lapangan).
    *   Fitur: Manajemen Booking Dasar, Member Database, Laporan Keuangan Sederhana.
    *   *No POS, No Inventory.*

*   **PRO (Rp 399.000) - REKOMENDASI TERBAIK (Best Value)**
    *   Cocok untuk: GOR Menengah (4-8 Lapangan).
    *   Fitur: Semua fitur Starter + **POS System**, **Inventory Management**, Notifikasi WhatsApp (Manual Trigger/Template), Laporan Shift Staff.
    *   *Justifikasi*: Harga Rp 399k setara sewa lapangan 3-4 jam. Jika sistem mencegah 1 error/fraud per bulan, ROI sudah positif.

*   **BUSINESS (Rp 699.000)**
    *   Cocok untuk: GOR Besar/Chain.
    *   Fitur: Unlimited Lapangan, Multi-Staff/Admin, Advanced Analytics (Export Excel/PDF), Priority Support.

**Revenue Streams:**
1.  **SaaS Subscription**: Primer (Recurring).
2.  **Payment Processing (Future)**: Markup fee MDR Xendit (misal charge 1-2% lebih ke user) atau biaya admin flat.
3.  **Hardware Bundling (Future)**: Jual paket "Kasir in a Box" (Tablet Murah + Printer Thermal + Stand) yang sudah pre-install aplikasi.

# 6-MONTH ROADMAP

**Bulan 1: Validasi & First Blood**
*   **Minggu 1**: *UX Polishing*. Pastikan flow "Walk-in Booking" < 10 detik. Siapkan "Sales Deck" 1 halaman.
*   **Minggu 2**: *Direct Sales*. Datangi 10 GOR terdekat secara fisik. Tawarkan akses **Lifetime Free/Huge Discount** untuk 3 GOR pertama sebagai "Design Partner".
*   **Minggu 3**: *Onboarding*. Install sistem di 3 GOR pertama. Monitor error log setiap malam. Perbaiki bug secepat kilat.
*   **Minggu 4**: *Feedback Loop*. Minta testimoni video/foto. Tanya admin: "Bagian mana yang paling bikin pusing?".

**Bulan 2: Stabilisasi & Fitur Kunci**
*   Perbaiki isu UX kritis dari feedback admin lapangan.
*   Implementasi fitur "Wajib Ada" yang mungkin terlewat (contoh: Support print struk di berbagai printer thermal bluetooth murah).
*   Scraping Google Maps untuk database leads GOR di satu kota target.

**Bulan 3-5: Sales Engine**
*   Luncurkan **Program Referral**: Beri komisi uang tunai (misal Rp 100k) ke admin GOR yang mereferensikan teman sesama admin GOR (komunitas admin kuat).
*   Content Marketing: Artikel/Post LinkedIn/IG tentang "Cara Mencegah Korupsi di Kasir GOR".
*   Target: Mencapai 10 *Paying Customers*.

**Bulan 6: Automation & Review**
*   Siapkan *Self-serve Onboarding* (User bisa daftar & setup sendiri tanpa bantuan manual Anda).
*   Review Financials: Bandingkan *Burn Rate* vs *Revenue*.

# TOP 5 RISKS & MITIGATION

1.  **Resistensi Staff (Severity: TINGGI)**
    *   *Risiko*: Admin/Staff menolak pakai karena "ribet" (atau karena sistem menutup celah kecurangan mereka).
    *   *Mitigasi*: Design UX super simpel khusus akun staff. Jual fitur "Shift Report" ke Owner sebagai alat pengaman, sehingga Owner yang memaksa Staff pakai.
2.  **Churn / Berhenti Langganan (Severity: SEDANG)**
    *   *Risiko*: Setelah 1-2 bulan, balik ke buku manual karena malas input data.
    *   *Mitigasi*: Fitur "Laporan Harian via WA ke Owner". Owner akan ketagihan laporan ini & memaksa sistem tetap jalan.
3.  **Masalah Konektivitas (Severity: SEDANG)**
    *   *Risiko*: Internet GOR mati, tidak bisa input booking.
    *   *Mitigasi*: Pastikan PWA memiliki kapabilitas **Offline Mode** yang solid untuk fungsi vital (Input Booking & POS). Sync otomatis saat online.
4.  **Kompetitor Copycat (Severity: RENDAH)**
    *   *Mitigasi*: Data Lock-in. Semakin banyak histori transaksi tersimpan, semakin sulit/malas mereka pindah aplikasi.
5.  **Isu Payment Gateway (Severity: RENDAH)**
    *   *Risiko*: Dana tertahan atau isu compliance.
    *   *Mitigasi*: Fokus payment gateway sebagai "fitur tambahan", jangan jadi revenue utama dulu. Gunakan direct settlement jika memungkinkan.

# CRITICAL SUCCESS FACTORS

1.  **Speed to Booking**: Admin harus bisa input booking via telepon dalam waktu **< 10 detik**. Jika lebih lama dari menulis di buku, mereka akan menolak pakai.
2.  **Owner "Aha!" Moment**: Owner harus bisa melihat nominal pendapatan hari ini secara **Real-time dari HP mereka** di rumah. Ini *value proposition* utama yang dijual.
3.  **Reliability**: **Zero Downtime** di jam *Prime Time* (17.00 - 23.00 WIB). Aplikasi tidak boleh lemot saat antrian panjang.

# ANALISIS BIAYA TEKNIS & OPERASIONAL (COST BREAKDOWN)

Berikut rincian biaya yang perlu disiapkan untuk menjalankan SaaS ini hingga mencapai skala 50 Customer.

**1. Platform Hosting: VERCEL**
*   **Status: WAJIB UPGRADE ke PRO** saat mulai komersial (ada transaksi/customer berbayar).
*   **Free Tier (Hobby)**:
    *   Hanya untuk *personal/non-commercial project*.
    *   **Risiko**: Jika Vercel mendeteksi penggunaan komersial (SaaS) di akun Hobby, mereka berhak mematikan layanan tanpa peringatan (Terms of Service Violation). Jangan ambil risiko ini untuk bisnis B2B.
*   **Pro Tier**: **$20USD / bulan (~Rp 320.000)**.
    *   Cukup untuk menampung >50 GOR (Bandwidth 1TB, Serverless Function execution limit sangat tinggi).
    *   Biaya ini flat per "seat" (hanya Anda dev-nya, jadi tetap $20).

**2. Database & Backend: SUPABASE**
*   **Status: BISA FREE TIER (Awal), WAJIB UPGRADE (Saat Scale up)**.
*   **Free Tier (Tier 0)**:
    *   Database Size: 500MB (Cukup untuk ~200.000 data booking text only).
    *   **Risiko Utama**: Project akan **PAUSE** (mati suri) jika tidak ada aktivitas selama 7 hari. Untuk aplikasi kasir/SaaS, ini sangat berbahaya jika tiba-tiba apps tidak bisa diakses user saat mereka buka.
    *   Rekomendasi: Pakai Free Tier hanya saat fase development/demo. Begitu ada **1 Paying Customer**, upgrade untuk stabilitas.
*   **Pro Tier**: **$25USD / bulan (~Rp 400.000)**.
    *   No Pausing.
    *   8GB Database (Sangat cukup untuk 50-100 GOR bertahun-tahun selama tidak menyimpan banyak foto/video berat di DB langsung).
    *   Daily Backup (Penting untuk keamanan data pelanggan).

**3. Pendukung Lainnya**
*   **Domain (.com/.id)**: ~Rp 150.000 - Rp 250.000 / tahun (~Rp 20.000/bulan).
*   **Email (Transactional)**: Gunakan **Resend.com** (Ada Free Tier generous: 3.000 email/bulan, cukup untuk notifikasi reset password untuk 50 GOR awal).
*   **WhatsApp Notification**:
    *   *Opsi Hemat (Unofficial)*: Sewa VPS murah ($5/bulan) + Library open source (Baileys/Waha) -> **Rp 80.000/bulan**.
    *   *Opsi Resmi (BSP)*: Biaya per percakapan (Mahal). Rekomendasi: Mulai dengan Opsi Hemat/VPS dulu.
*   **Midtrans/Xendit**: Tidak ada biaya bulanan (Pay as you go). Biaya dipotong per transaksi (misal: Rp 4.500/trx VA). Bebankan ini ke customer (Add admin fee).

**REKAP TOTAL ESTIMASI BIAYA BULANAN (FIXED COST)**
*   Saat masih 0-5 Customer (Early):
    *   Bisa nekat pakai Free Tier Vercel/Supabase (Risiko tanggung sendiri) = **Rp 0**.
*   Saat mulai serius (5-50 Customer):
    *   Vercel Pro: Rp 320.000
    *   Supabase Pro: Rp 400.000
    *   VPS (WA Notif): Rp 80.000
    *   Domain/Lainnya: Rp 50.000
    *   **TOTAL BURN RATE: ~Rp 850.000 / bulan.**

**Kesimpulan:**
Dengan harga langganan **Paket PRO (Rp 399.000)**, Anda hanya butuh **3 GOR berbayar** untuk menutup seluruh biaya operasional teknis (Break-even). Sisanya adalah profit bersih.

# FINANCIAL PROJECTIONS (Conservative - Solo Founder)

*Asumsi: Menggunakan plan PRO (Rp 399.000/bulan).*

*   **Skenario Bulan ke-6**:
    *   Total Customers: 15 GOR.
    *   **MRR (Monthly Recurring Revenue)**: Rp ~6.000.000.
    *   Biaya Operasional (Server, Domain): ~Rp 500.000.
    *   **Net Profit**: Rp 5.500.000 (Cukup untuk cover operasional dasar solo founder di fase awal).
*   **Skenario Bulan ke-12**:
    *   Total Customers: 50 GOR.
    *   **MRR**: Rp ~20.000.000.
    *   **Net Profit**: Rp ~19.000.000. (Sudah *sustainable* secara finansial untuk solo founder full-time).

# IMMEDIATE NEXT STEPS (Minggu Ini)

1.  **Tech Check**: Pastikan `manifest.ts` PWA valid & Service Worker caching berjalan mulus. Coba install di HP sendiri & test matikan internet (Offline Mode basics).
2.  **Sales Material**: Buat 1 akun "Demo" yang sudah diisi data dummy (transaksi, booking minggu depan, data member). Jangan demo kosongan!
3.  **Database Awal**: Cari 20 GOR di Google Maps radius 5-10km dari lokasi Anda. Catat nomor WA yang tertera.
4.  **Field Research**: Kunjungi 1 GOR sore/malam ini. Jangan langsung jualan. Ajak ngobrol admin, tanya: "Suka pusing nggak ngitung setoran duit pas tutup kasir malam-malam?". Validasi masalah *reconcilliation*.
5.  **Siapkan Mental**: Bersiap untuk penolakan. Sales B2B butuh ketekunan.

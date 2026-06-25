# Changelog SIPANDU

## 2026-07-02
- Perbaikan sistem notifikasi lonceng: createEditRequest() sekarang benar-benar mengirim - notifikasi ke Admin saat Sekretaris minta revisi absensi
- Perbaikan approveEditRequest() dan rejectEditRequest() sekarang mengirim notifikasi ke pemohon (Sekretaris/WK) dengan pesan yang jelas
- Tambah Strategi 0 di getWaliKelasUserId() dan getSekretarisUserId(): gabungan kelas+jurusan ("X TKRO") untuk mencocokkan format tabel users ("X TKRO 1")
- Icon notifikasi Pengajuan Izin diganti dari 🤒 menjadi 📋 agar mudah dibedakan dengan Sakit
- Ubah jeda getaran lonceng dari 8 detik menjadi 20 detik agar tidak terlalu sering
- Dokumentasi tabel notifications di DATABASE_SCHEMA.md (type, priority, action_url)

## 2026-07-01

- Tambah kolom kop_logo_dinas dan kop_logo_sekolah di tabel app_settings (Supabase)
- Buat helper lib/kopSuratHelper.js: loadImageAsBase64() dan generateKopSuratHTML()
- Tambah server action getKopSuratSettings() di siswaActions.js
- Tambah section "Setting KOP Surat (Print PDF)" di halaman Profil SIPANDU
- Upload logo dinas & logo sekolah ke Supabase Storage (bucket: assets)
- Preview KOP Surat langsung di halaman profil (3 kolom: logo dinas — teks — logo sekolah)
- Indikator status tersimpan/belum tersimpan pada masing-masing logo
- Integrasi KOP Surat dinamis di Print PDF Rekap Kehadiran (tab Semester)
- Integrasi KOP Surat dinamis di Print PDF Rekap Reward
- Integrasi KOP Surat dinamis di Print PDF Rekap Pelanggaran (Per Tingkat Semua Jurusan)
- Integrasi KOP Surat dinamis di Cetak Rekap Pindah & Keluar
- Integrasi KOP Surat dinamis di Cetak Rekap Formulir (Tracer / Karir / SNBP-SNBT)
- Logo dikonversi ke base64 sebelum embed ke HTML print (menjamin 100% muncul)
- Fallback placeholder teks jika logo belum diupload
- Nama sekolah & alamat di kop surat otomatis mengikuti data pengaturan profil
- Tambah kolom kop_logo_dinas dan kop_logo_sekolah di tabel app_settings (Supabase)
- Buat helper lib/kopSuratHelper.js: loadImageAsBase64() dan generateKopSuratHTML()
- Tambah server action getKopSuratSettings() di siswaActions.js
- Tambah section "Setting KOP Surat (Print PDF)" di halaman Profil SIPANDU
- Upload logo dinas & logo sekolah ke Supabase Storage (bucket: assets)
- Preview KOP Surat langsung di halaman profil (3 kolom: logo dinas — teks — logo sekolah)
- Indikator status tersimpan/belum tersimpan pada masing-masing logo
- Integrasi KOP Surat dinamis di Print PDF Rekap Kehadiran (tab Semester)
- Integrasi KOP Surat dinamis di Print PDF Rekap Reward
- Integrasi KOP Surat dinamis di Print PDF Rekap Pelanggaran (Per Tingkat Semua Jurusan)
- Integrasi KOP Surat dinamis di Cetak Rekap Pindah & Keluar
- Integrasi KOP Surat dinamis di Cetak Rekap Formulir (Tracer / Karir / SNBP-SNBT)
- Logo dikonversi ke base64 sebelum embed ke HTML print (menjamin 100% muncul)
- Fallback placeholder teks jika logo belum diupload
- Nama sekolah & alamat di kop surat otomatis mengikuti data pengaturan profil

## 2026-06-30

- Fix nama Wali Kelas tidak muncul di halaman Entri Reward setelah pencarian siswa
- Fix nama Wali Kelas tidak muncul di halaman Entri Pelanggaran setelah pencarian siswa
- Kedua halaman sekarang menggunakan getPJByClass dari penanggungJawabActions.js (sumber data sama dengan halaman Penanggung Jawab)
- Revamp tampilan gagal GPS di Absen Hadir Mandiri: Layar penuh merah dengan ikon XCircle putih, "Absensi Ditolak!", "Lokasi Anda DI LUAR radius", detail jarak 1 desimal, selisih meter, badge "QR Tidak Terverifikasi", tombol "Coba Lagi"
- Tambah layar gagal GPS terpisah: "Gagal Mendapatkan Lokasi!" ketika GPS tidak bisa diakses (timeout/permission denied)
- Perbaikan kritis: Validasi GPS sekarang WAJIB ketika pengaturan GPS sudah diatur — hapus silent skip di catch block yang menyebabkan absensi tetap masuk walau di luar radius
- Tambah console log di setiap tahap validasi GPS (settings loaded, jarak, error) untuk debugging
- Tambah fallback format return getQRSettings (settings?.settings || settings?.data || settings)
- Tambah server action deleteAllRewardAction() — hapus semua record dari tb_reward_siswa dan reset total_reward ke 0 di tabel siswa
- app/admin/rekap-reward/page.js
- Import: Tambah Printer, deleteAllRewardAction
- Tombol Print PDF: Mengganti placeholder PDF — buka window baru dengan kop surat (logo Dinas Jabar + logo Sekolah), statistik, tabel data lengkap, auto-print
- Tombol Hapus Semua: Di header tabel, sejajar dengan Print PDF
- Modal Hapus Semua (2x Konfirmasi):
Step 1: Peringatan dengan detail apa yang akan dihapus + tombol "Lanjutkan"
Step 2: Input teks "HAPUS SEMUA" untuk konfirmasi akhir + tombol disabled sampai teks cocok
- State baru: showDeleteAllModal, deleteAllStep, deleteAllText, deletingAll
- Header tabel: Ditambahkan counter jumlah siswa dan layout responsive (flex-col di HP)
- Perubahan dari kode sebelumnya: Hapus deklarasi origin yang terpisah di atas — cukup tulis sekali di baris pertama fungsi, lalu gunakan ${origin}/logo-dinas.png di semua tag <img>

## 2026-06-29

- Fix Portal Orang Tua: Matching Wali Kelas & Sekretaris tidak sinkron dengan kelas siswa (WK XII muncul di siswa kelas X) diganti menggunakan getPJByClass dari penanggungJawabActions.js — sumber data sama persis dengan halaman Penanggung Jawab
- Tambah tombol hapus pesan di chat Pesan Wali Kelas Portal Orang Tua (hanya pesan dari Orang Tua, validasi sender_type, ikon muncul saat hover)
- Tambah server action deleteParentMessage di parentPortalActions.js
- Ubah grid Tiga Besar Peraih Poin Reward: 2 kolom di HP, 3 kolom desktop, kartu ke-3 centered di HP
- Ubah grid Rekapitulasi Jumlah Siswa: 2 kolom di HP untuk class cards dan donut charts, item ke-3 centered di HP
- Responsif ukuran elemen TopReward & RekapSiswa (icon, donut, font, padding menyesuaikan HP/desktop)
- Revamp tampilan gagal GPS di Absen Hadir Mandiri: Dari toast kecil menjadi layar penuh merah dengan ikon XCircle, detail jarak vs radius, selisih meter, badge "Di Luar Jangkauan Radius", tombol "Scan Ulang QR Code"
- Tambah spinner biru "Sedang Memvalidasi GPS..." saat proses cek lokasi setelah QR terbaca
- Tombol "Scan Ulang" mereset state gpsFailed dan scannedResult tanpa perlu input NISN ulang
- Fix import XCircle dari lucide-react di halaman Manajemen Siswa (sebelumnya Runtime ReferenceError saat validasi GPS di tab QR Absensi)

## 2026-06-28

- Fix filter Jurusan & Kelas di Rekap Kehadiran: Dropdown hardcoded 24 opsi (KL 1-4, FKK dll yang tidak ada) diganti dropdown dinamis dari database
- Fix filter Jurusan di Rekap Sakit & Izin: Dropdown hardcoded 12 opsi (hanya sampai 2 per jurusan, KL dan FKK hilang) diganti dropdown dinamis dari database
- Tambah kelasJurusanList di getKelasFilters() (absensiActions.js): Kombinasi unik kelas + jurusan dari tabel siswa untuk keperluan filter dropdown
- Tambah filter Tingkat & Jurusan di halaman Rekap Pelanggaran (Wali Kelas)
- Tambah kolom pencarian (nama, NISN, kelas) di halaman Rekap Pelanggaran
- Tambah tombol Print PDF Per Tingkat Semua Jurusan di Rekap Pelanggaran (group by jurusan, status disiplin)
- Tambah tombol Hapus Semua Rekap di Rekap Pelanggaran (2x konfirmasi ketik "HAPUS SEMUA")
- Tambah server action deleteAllPelanggaran di pelanggaranActions.js
- Stats kartu Rekap Pelanggaran dihitung ulang saat filter aktif
- Hapus foto otomatis di Rekap Sakit & Izin dalam waktu lebih dari 1 hari
- Menghapus fitur "Upload Bukti (Opsional)" di halaman Entri Reward
- Menghapus fitur "Bukti Pelanggaran (Wajib Foto)" di halaman Entri Pelanggaran
- Fix filter Jurusan di Absensi Kehadiran: Dropdown dinamis dari database (bukan hardcode 12 opsi manual)
- Dropdown jurusan otomatis menyesuaikan berdasarkan tingkat yang dipilih
- Menggunakan getKelasFilters() sama seperti Rekap Kehadiran

## 2026-06-27

- Perbaikan tombol H/S/I/A di halaman Absensi Kehadiran Sekretaris (hanya update tampilan lokal, tidak langsung simpan ke DB)
- Tombol "Kirim & Kunci" sekarang menyimpan semua status ke DB baru kemudian mengunci (sebelumnya langsung simpan per klik)
- Tombol "Simpan Perubahan" menyimpan dari tampilan lokal tanpa mengunci (untuk setelah Admin approve edit request)
- Siswa yang absen via Sakit/Izin Online atau QR Mandiri otomatis terkunci di tabel (tombol dikunci + ikon gembok)
- Sekretaris hanya bisa klik H dan A, Sakit/Izin dikunci (harus via halaman terpisah)
- Admin bebas klik semua tombol tanpa batasan waktu
- Batasan scan QR Hanya 1x per hari per siswa (cek tabel absensi input_by='QR Mandiri' hari ini)
- Validasi GPS radius pada Absen Hadir Mandiri (ambil pengaturan dari tabel qr_settings, hitung jarak Haversine)
- Tolak absen jika jarak melebihi radius dengan pesan jarak dan batas radius
- Admin bebas dari validasi GPS (langsung simpan tanpa cek jarak)
- Fallback: jika GPS tidak tersedia, validasi GPS dilewati (absensi tetap bisa dilakukan)
- Kartu statistik QR Absensi di tab Manajemen Siswa sekarang menampilkan data real dari database
- Kartu "Hadir Hari Ini" menampilkan jumlah siswa yang scan QR hari ini
- Kartu "Belum Hadir" menampilkan total siswa aktif dikurangi hadir QR hari ini
- Grid QR Code Kelas: 2 kolom di tampilan HP (grid-cols-2), 3 kolom tablet, 4 kolom desktop
- Tambah fungsi checkQRScanToday di absensiActions.js
- Tambah fungsi getQRStats di qrAbsensiActions.js
- Ubah submitAbsensi di absensiActions.js (simpan records dulu baru kunci, terima parameter records opsional)
- Hapus file /qr-absensi/page.js yang sudah tidak terpakai

## 2026-06-26

- Fix teks "Semester $2 Tahun Ajaran $2025/$2026" di Rekap Kehadiran (template literal salah di JSX)
- Fix kolom No/Nama/L/P dibekukan di HP pada tab Bulanan, Semester, Tahunan Rekap Kehadiran (sticky hanya aktif di desktop md:sticky)
- Fix background transparan /30 pada hover kolom sticky menyebabkan teks tembus saat scroll horizontal (ganti ke warna solid)
- Tambah section Siswa Kritis (Alpha > 5x) di tab Bulanan Rekap Kehadiran (banner, 5 kartu statistik, bar chart top 10, tabel detail dengan severity badge)
- Fix tombol Cari tertutup di layar HP pada halaman Absen Sakit & Izin (flex-col sm:flex-row)
- Fix referensi .nis menjadi .nisn di halaman Absen Sakit & Izin
- Tambah batasan waktu 06:00-09:04 WIB di halaman Absen Hadir Mandiri (sama seperti Absen Sakit & Izin)
- Tampilan terkunci di luar jam absensi pada halaman Absen Hadir Mandiri (countdown timer, blokir form & kamera)
- Admin bebas akses Absen Hadir Mandiri kapan saja (Mode Admin / Bebas Waktu)
- Fix tombol Cari tertutup di layar HP pada halaman Absen Hadir Mandiri (flex-col sm:flex-row)
- Fix referensi .nis menjadi .nisn di halaman Absen Hadir Mandiri
- Fix fungsi getSiswaByNISN: coba kolom nisn dulu, fallback ke kolom nis, trim input, standardisasi output
- Revamp tab QR Absensi di Manajemen Siswa: Validasi GPS fungsional (Ambil Lokasi + Validasi Haversine)
- Tambah tombol Simpan Pengaturan GPS & Waktu ke database (tabel qr_settings)
- Pengaturan GPS otomatis dimuat dari database saat halaman dibuka
- Badge GPS Terkunci/Belum Diatur di header pengaturan QR
- Tambah server action qrAbsensiActions.js (getQRSettings, saveQRSettings)
- Buat tabel baru qr_settings di Supabase (gps_latitude, gps_longitude, gps_radius, jam_masuk, jam_terlambat, jam_tutup)
- Hapus halaman terpisah /qr-absensi/page.js (fungsi sudah terintegrasi di tab Manajemen Siswa)

## 2026-06-01

- Migrasi ke Supabase
- Login menggunakan Supabase Auth
- Dashboard selesai

## 2026-06-5

- Perbaikan halaman profil dan komponen rekap siswa

## 2026-06-07

- Tambah fitur upload logo jurusan di menu Profil
- Tambah 6 slot logo jurusan: TKR, PH, DKV, KL, RPL, LPKKK
- Tambah komponen MajorLogoManager di halaman Profil
- Integrasi logo jurusan dengan RekapSiswa di Dashboard
- Buat Supabase Storage bucket logos (public)
- Buat RLS policies untuk bucket logos
- Tambah server action majorLogoActions.js (get, upload, save)
- Tambah supabase-admin.js (service role client untuk bypass RLS)
- Tambah variabel SUPABASE_SERVICE_ROLE_KEY di .env.local
- Perbaikan bug upload logo PH (ganti label→button+useRef)
- Layout grid 3 kolom sejajar untuk kartu jurusan

## 2026-06-08

- Pindahkan Sidebar & Header ke AppShell (Layout Persisten)
- Semua halaman kini memiliki Sidebar & Header yang tetap tampil
- Tambah menu "Absen Hadir Mandiri" di sidebar MENU SISWA
- Buat halaman placeholder /absen-mandiri
- Tambah komponen SiswaBerprestasiBerita (Featured + List)
- Tambah komponen TopReward (3 kartu animasi emas/perak/perunggu)
- Tambah komponen DaftarTidakHadir (Donut chart, auto-slide, ikon status warna)
- Tambah komponen RekapReward (Accordion kategori & poin reward, 21 item)
- Tambah komponen RekapPelanggaran (Accordion kategori ringan/sedang/berat, ambang batas, force majeure)
- Tambah komponen AksesCepatInformasi (Kartu biru/ungu/hijau)
- Pindahkan tabel Siswa Berprestasi & Berita ke atas grafik reward & pelanggaran
- Perbaikan teks donut chart tegak di DaftarTidakHadir
- Tambah angka dinamis di legenda Alpha/Sakit/Izin
- Perbaikan warna teks pencarian jadi hitam
- Tambah jarak antara Akses Cepat Informasi dan Footer
- Perbaikan tombol SNBP/SNBT/Tracer Studi di footer (panah + efek tertekan)
- Header tabel kategori reward & pelanggaran ganti hitam bold

## 2026-06-09

- Revamp total halaman Manajemen Data Siswa
- Integrasi Data Siswa dengan Rekapitulasi Jumlah Siswa di Dashboard (Real-time)
- Tambah fitur Tambah, Edit, Hapus Siswa via Server Actions (bypass RLS)
- Tambah fitur Import CSV, Export CSV, Cetak Data
- Tambah fitur Hapus Semua Data
- Tambah fitur Kenaikan Kelas (X→XI, XI→XII) dengan checklist siswa
- Tambah fitur Kelulusan XII (hapus data + download arsip CSV)
- Tambah halaman QR Absensi (Generate QR per kelas dinamis, Pengaturan GPS & Waktu)
- Tambah halaman Absen Hadir Mandiri (Simulasi alur scan QR + validasi)
- RekapSiswa di Dashboard sekarang menampilkan 6 jurusan tetap (TKRO, DKV, RPL, PH, KL, LPKKK)
- Fix filter Data Siswa menggunakan logika ekstraksi yang sama dengan dropdown
- Fix teks hitam pada semua kolom input dan select di halaman admin
- Tambah kolom jenis_kelamin di tabel siswa (Supabase)
- Tambah server action siswaActions.js
- Tambah server action userActions.js
- Tambah server admin users page.js

## 2026-06-10

- Aktifkan halaman Manajemen User (/admin/users)
- Tambah kartu statistik pengguna dengan animasi count-up dan gradient (5 kartu)
- Tambah fitur Tambah, Edit, Hapus User via Server Actions
- Tambah fitur Upload Foto Profil ke Supabase Storage
- Tambah fitur Import CSV, Export CSV, Cetak Data
- Tambah fitur Hapus Semua Data (2x konfirmasi ketik "HAPUS SEMUA")
- Tambah kolom Jurusan di tabel users (Supabase)
- Tambah 3 dropdown Kelas (Tingkat + Jurusan + Nomor) di form dengan auto-compose
- Tambah sorting kolom tabel (klik header)
- Tambah filter Kelas dinamis dari database siswa
- Tambah validasi kelas wajib untuk role selain Administrator
- Tambah avatar default gradient jika tidak ada foto
- Implementasi role-based navigation di sidebar (4 role)
- Administrator: semua menu | Wali Kelas: umum+siswa+wali | Sekretaris: umum+siswa+sekretaris | OSIS: umum+siswa+osis
- Belum login hanya tampil menu umum dan siswa
- Tambah panel profil pengguna di sidebar (foto, nama, peran + kelas lengkap, indikator online)
- Tambah tombol Profil Saya & Logout sejajar di sidebar
- Tambah modal Profil Saya (lihat detail + edit email & whatsapp + simpan)
- Tambah Server Action updateProfileData
- Tambah Server Action getUserStats, getAvailableKelas, uploadUserPhotoAction, importUsersCSV
- Perbaikan login: simpan userData ke localStorage, loading state "⏳ Memproses...", login via database
- Perbaikan SubLink active state highlight di sidebar
- Perbaikan auto-open dropdown saat navigasi ke halaman admin/users
- Perbaikan null value pada input form (select & input)
- Perbaikan fungsi CountUp agar update saat data berubah
- Sub menu Managemen User di sidebar MENU SETTING kini berfungsi (href /admin/users)
- Aktifkan halaman Manajemen User (/admin/users)
- Tambah kartu statistik pengguna dengan animasi count-up dan gradient (5 kartu)
- Tambah fitur Tambah, Edit, Hapus User via Server Actions
- Tambah fitur Upload Foto Profil ke Supabase Storage
- Tambah fitur Import CSV, Export CSV, Cetak Data
- Tambah fitur Hapus Semua Data (kecuali admin yang sedang aktif)

## 2026-06-10

- Aktifkan halaman Manajemen User (/admin/users)
- Tambah kartu statistik pengguna dengan animasi count-up dan gradient (5 kartu)
- Tambah fitur Tambah, Edit, Hapus User via Server Actions (bypass RLS)

## 2026-06-11

- Aktifkan halaman Rekap Kehadiran (/rekap-kehadiran)
- Tambah 4 Tab Rekap: Harian, Bulanan, Semester, Tahunan
- Tambah Freeze Table (Sticky Header & Sidebar) di tab Bulanan, Semester, Tahunan
- Tambah Auto-Alpha Sinkronisasi di Server Action (Otomatis >14:00 WIB)
- Tambah Export PDF dengan Kop Surat Resmi (Logo Dinas Jabar & Logo Sekolah)
- Tambah Export Excel Data Semester (Format kolom bulanan H/S/I/A)
- Tambah tombol Reset Semester & Reset Semua Absensi (Hapus data kelas terpilih)
- Tambah diagram Distribusi & Perbandingan Status di tab Semester/Tahunan
- Perbaikan query filter bulanan (gunakan gte/lte alih-alih like untuk tipe date)
- Perbaikan grouping kelas di Dashboard DaftarTidakHadir (Gabung kelas+jurusan)
- Tambah Supabase Realtime Subscription di komponen DaftarTidakHadir
- Simpan aset logo (logo-dinas.png, logo-sekolah.png) ke folder public

## 2026-06-12

- Aktifkan halaman Absen Sakit & Izin (/absen-sakit-izin)
- Aktifkan halaman Rekap Sakit & Izin (/wali-kelas/rekap-sakit-izin)
- Buat halaman placeholder Penanganan Siswa (/admin/siswa/penanganan)
- Buat tabel tb_absensi_sakit_izin di Supabase
- Buat Storage bucket bukti-sakit-izin di Supabase
- Install library html5-qrcode
- Revamp total halaman Absen Hadir Mandiri (NISN search + Real Camera QR Scan)
- Integrasi Kamera HP untuk scan QR Code di Absen Hadir Mandiri
- Validasi QR Code JSON (Regex kelas_id ke format database)
- Sinkronisasi Otomatis: Input Sakit/Izin langsung mengisi tabel absensi utama (locked)
- Sinkronisasi Otomatis: Scan QR Hadir langsung mengisi tabel absensi utama (locked)
- Integrasi halaman Sekretaris: Badge ONLINE/SCAN QR & Lock tombol status inputan sistem
- Integrasi halaman Rekap Kehadiran: Data Sakit/Izin otomatis masuk ke rekap
- Fix bug Timezone: Semua input tanggal diseragamkan menggunakan format WIB (toLocaleDateString 'sv-SE')
- Tambah filter kelas/jurusan dan statistik di Rekap Sakit & Izin
- Tambah kolom Peta (Google Maps link) di Rekap Sakit & Izin
- Tambah logika Tolak Pengajuan (Otomatis ubah status jadi Alpha di tabel absensi)
- Fix upload foto bukti (Jika bucket storage gagal, data tetap tersimpan tanpa foto)

## 2026-06-12

- Fix layout tabel Manajemen User (tambah min-w-[1200px], whitespace-nowrap, truncate)
- Fix header cetak PDF Manajemen User (Sync kolom: No, Nama, Username, Email, Peran, Kelas, Jurusan, WhatsApp, Status)
- Fix validasi "Hapus Semua User" (Error ID Admin tidak valid, tambah pengecekan userData)
- Migrasi fitur Import dari CSV murni ke Excel/CSV (Menggunakan library xlsx)
- Tambah tombol "Unduh Format CSV" di dalam Modal Import User
- Skip data duplikat saat Import User (Skip jika username sudah ada di DB/kosong)

## 2026-06-14

- Aktifkan halaman entri reward
- Aktifkan halaman entri pelanggaran
- Aktifkan halaman rekap pelanggaran
- Aktifkan halaman rekap reward

## 2026-06-15

- Revamp Kalkulasi Reward (Hitung langsung dari tb_reward_siswa, tidak bergantung pada kolom siswa)
- Aktifkan 3 Grafik di Rekap Reward (Bar Chart Per Kelas, Donut Chart Per Jurusan, Line Chart Perkembangan Bulanan)
- Tambah kolom NISN di Tabel Rekap Data Siswa Berpoint & Modal Detail Reward
- Penyesuaian tampilan Rekap Kehadiran (NISN hanya muncul di tab Harian)
- Tambah kolom Nomor Urut di tab Bulanan Rekap Kehadiran
- Hapus fungsi duplikat Reward di rekapActions.js (Sudah terakomodasi di rewardActions.js)

## 2026-06-16

- Aktifkan halaman Penanganan Siswa (Menu Administrator)
- Aktifkan halaman Rekap Pindah & Keluar (Menu Administrator)
- Buat tabel baru di Supabase: tb_penanganan_siswa, tb_penanganan_history, tb_pindah_keluar, tb_pindah_keluar_dokumen
- Buat Storage bucket baru: dokumen-penanganan
- Tambah server action penangananActions.js (CRUD Penanganan, Stats, Reset, Dokumen Upload)
- Integrasi logika pembinaan bertahap (BK -> SP1 -> SP2 -> SP3 -> Pindah/Keluar)
- Siswa Pindah/Keluar otomatis dikunci, diberi tanda merah di tabel, dan dipindah ke bawah daftar
- Kartu statistik Dalam Pembinaan kini memasukkan total siswa yang sedang dalam SP1/SP2/SP3
- Tambah fungsi Reset Semua Penanganan (Mengembalikan semua status ke awal)
- Tambah kolom Alasan Pindah/Keluar di halaman Rekap
- Fix filter status penanganan agar bisa memfilter status Pindah/Keluar dengan benar

## 2026-06-17

- Ganti menu "Informasi" menjadi "Formulir" di Header AppShell
- Aktifkan halaman Pusat Formulir (/formulir) dengan 3 kartu pilihan
- Aktifkan halaman Rekap Formulir (/admin/rekap-formulir)
- Buat 3 tabel baru di Supabase: form_tracer_studi, form_pemetaan_karir, form_snbp_snbt
- Buat Storage bucket baru: bukti-formulir
- Tambah server action formulirActions.js (Save Tracer, Save Karir, Save SNBP, Get Stats, Get Rekap, Reset All)
- Implementasi UI Form Tracer Studi (Field dinamis berdasarkan status saat ini)
- Implementasi UI Form Pemetaan Karir (Multi-select minat karir)
- Implementasi UI Form SNBP/SNBT (Jalur, Prodi, Upload bukti)
- Integrasi widget Statistik Formulir di Dashboard Utama
- Tambah tombol Reset Semua Data Formulir di halaman Rekap Admin
- Update link di Footer agar mengarah ke halaman formulir yang benar

## 2026-06-18

- Aktifkan halaman Penanggung Jawab Kelas (/setting/penanggung-jawab)
- Data PJ otomatis derive dari Manajemen User (Role Wali Kelas/Sekretaris)
- Tambah komponen PJInfoCard (integrasi ke Rekap Kehadiran & Penanganan Siswa)
- Hapus widget Monitoring PJ dari Dashboard (atas permintaan user)
- Tambah Badge Oranye/Ungu untuk No. WhatsApp di tabel PJ
- Aktifkan halaman Hari Efektif (/setting/hari-efektif)
- Buat tabel baru: effective_days, academic_calendar, effective_day_logs
- Fitur Hari Efektif: CRUD Libur, Import/Export CSV, Hapus Semua, Setup Kalender Pendidikan
- Tambah tab Preview Kalender & Audit Trail (Riwayat Aktivitas)
- Integrasi Hari Efektif ke Rekap Kehadiran:
- Tab Bulanan: Blok merah pekat untuk Sabtu/Minggu/Libur, tambah kolom E (Efektif)
- Tab Semester/Tahunan: Tambah kolom Hari Efektif
- Perhitungan Persentase Kehadiran menggunakan Hari Efektif
- Sesuaikan Export Excel (Data Bulanan) & PDF (Data Semester) dengan Hari Efektif

## 2026-06-19

- Aktifkan halaman Pos Berita (/setting/pos-berita)
- Buat tabel baru di Supabase: news_posts
- Buat Storage bucket baru: news-media (public)
- Tambah server action newsActions.js (CRUD, Stats, Upload Cover, View Counter)
- Fitur upload cover berita dengan kompresi gambar otomatis (Canvas API)
- Tambah tombol Hapus Semua Berita di halaman Pos Berita
- Fix referrer policy (referrerPolicy="no-referrer") pada tag img agar gambar Supabase muncul
- Update komponen SiswaBerprestasiBerita.js: Data mockup diganti dengan data dinamis dari database
- Aktifkan halaman publik Siswa Berprestasi (/siswa-berprestasi)
- Aktifkan halaman publik Berita Sekolah (/berita-sekolah)
- Aktifkan halaman Detail Berita (/berita/[slug]) dengan View Counter & Berita Terkait
- Integrasi tombol Akses Cepat Informasi (Seputar Sekolah) ke /berita-sekolah
- Integrasi menu Sidebar (Siswa Berprestasi) ke /siswa-berprestasi

## 2026-06-20

- Perbaikan gambar berita tidak muncul di semua halaman (Dashboard, Pos Berita, Siswa Berprestasi, Berita Sekolah, Detail Berita, Semua Berita)
- Tambah fungsi getImageUrl() di seluruh komponen berita untuk menangani format URL cover yang berbeda-beda
- Tambah referrerPolicy="no-referrer" pada setiap tagberita
- Tambah fallback SVG rapi saat cover_url null atau gambar gagal load (sebelumnya hitam pekat)
- Tambah konfigurasi images.remotePatterns di next.config.ts untuk domain *.supabase.co
- Fix layout ganda: Hapus AppShell wrapper dari halaman Pos Berita, Siswa Berprestasi, - Berita Sekolah, Semua Berita, dan Detail Berita
- Fix tombol "Lihat Berita" di Akses Cepat Informasi tidak berfungsi (gunakan useRouter().push)
- Buat halaman baru Semua Berita (/semua-berita) gabungan Siswa Berprestasi & Berita Sekolah dengan tab filter & pencarian
- Ubah tombol "LIHAT SEMUA BERITA" di Dashboard mengarah ke /semua-berita
- Fix Featured News tidak tampil di utama: Tambah order('featured', ascending: false) di getPublishedNews
- Tingkatkan kualitas kompresi gambar cover: 800px/80% → 1400px/92%
- Tambah kartu Pemetaan Karir di Akses Cepat Informasi (total 4 kartu)
- Pindah posisi Akses Cepat Informasi ke atas Siswa Berprestasi & Berita di Dashboard
- Tambah animasi hover pada kartu Akses Cepat: timbul naik, bayangan membesar, lingkaran dekoratif scale
- Tambah animasi ikon naik turun (bounce-slow) dengan delay berbeda tiap kartu
- Ubah grid Akses Cepat Informasi: 4 kolom desktop, 2 kolom HP
- Perbaikan import: Ganti createClient menjadi supabase sesuai ekspor di lib/supabase.js

## 2026-06-21

- Aktifkan halaman Portal Orang Tua (/portal-ortu) sebagai Parent Monitoring Center
- Buat Hero Section (profil siswa, NISN, kelas, jurusan, status hadir hari ini)
- Buat 6 Summary Card (kehadiran %, total reward, pelanggaran, status hari ini, ranking, pesan WK)
- Buat Section Profil Akademik & Siswa (integrasi tabel siswa + users untuk Wali Kelas & Sekretaris)
- Buat Section Kehadiran Bulan Ini dengan Donut Chart SVG custom + statistik + timeline
- Buat Section Status Kehadiran Hari Ini (card besar dengan detail metode absensi)
- Buat Section Kalender Akademik Interaktif (navigasi bulan, 5 warna highlight)
- Buat Section Pesan Wali Kelas (layout chat modern)
- Buat Section Kedisiplinan & Prestasi (2 panel: reward + pelanggaran + grafik bar bulanan)
- Buat Section Catatan Surat Peringatan (SP1/SP2/SP3, integrasi tb_penanganan_siswa)
- Buat Section Ringkasan Perkembangan (Radar Chart 5 dimensi)
- Buat Section Riwayat Aktivitas Terbaru (timeline gabungan)
- Buat Notification Center (dropdown dengan badge unread)
- Buat Export PDF Laporan Bulanan (window baru, kop, tabel kehadiran/reward/pelanggaran)
- Buat 2 tabel baru di Supabase: parent_messages, parent_notifications + RLS + Index
- Buat server action parentPortalActions.js (search, dashboard, messages, notifications)
- Fix matching Wali Kelas & Sekretaris: logika fleksibel (exact, tingkat, substring)
- Fix kelas/jurusan kosong: kirim langsung dari frontend, bukan query ulang di server
- Fix date filter bulanan: ganti lt('tanggal', 'YYYY-MM-32') ke lte dengan last day yang dihitung benar
- 2026-06-20
- Perbaikan gambar berita tidak muncul di semua halaman (Dashboard, Pos Berita, Siswa Berprestasi, Berita Sekolah, Detail Berita, Semua Berita)
- Tambah fungsi getImageUrl() di seluruh komponen berita untuk menangani format URL cover yang berbeda-beda
- Tambah referrerPolicy="no-referrer" pada setiap tagberita
- Tambah fallback SVG rapi saat cover_url null atau gambar gagal load
- Tambah konfigurasi images.remotePatterns di next.config.ts untuk domain *.supabase.co
- Fix layout ganda: Hapus AppShell wrapper dari halaman Pos Berita, Siswa Berprestasi, - Berita Sekolah, Semua Berita, dan Detail Berita
- Fix tombol "Lihat Berita" di Akses Cepat Informasi tidak berfungsi (gunakan useRouter().push)
- Buat halaman Semua Berita (/semua-berita) gabungan Siswa Berprestasi & Berita Sekolah dengan tab filter & pencarian
- Ubah tombol "LIHAT SEMUA BERITA" di Dashboard mengarah ke /semua-berita
- Fix Featured News tidak tampil di utama: Tambah order('featured', ascending: false) - di getPublishedNews
- Tingkatkan kualitas kompresi gambar cover: 800px/80% → 1400px/92%
- Tambah kartu Pemetaan Karir di Akses Cepat Informasi (total 4 kartu)
- Pindah posisi Akses Cepat Informasi ke atas Siswa Berprestasi & Berita di Dashboard
- Tambah animasi hover pada kartu Akses Cepat: timbul naik, bayangan membesar, lingkaran dekoratif scale
- Tambah animasi ikon naik turun (bounce-slow) dengan delay berbeda tiap kartu
- Ubah grid Akses Cepat Informasi: 4 kolom desktop, 2 kolom HP
- Perbaikan import: Ganti createClient menjadi supabase sesuai ekspor di lib/supabase.js
- Fix Sidebar NavLink active state: gunakan href sebagai fallback identifier untuk menu tanpa menuId

## 2026-06-22

- Aktifkan menu Cari Data Siswa (Sidebar + Kolom Pencarian Dashboard)
- Buat halaman Cari Data Siswa (/cari-data-siswa) dengan autocomplete realtime
- Buat halaman Detail Siswa (/cari-data-siswa/[id]) dengan 8 section terintegrasi
- Buat komponen CariDataSiswaWidget di Dashboard (search bar + dropdown via Portal)
- Buat server action cariSiswaActions.js (searchSiswa + getSiswaDetail)
- Dropdown pencarian menggunakan createPortal ke document.body agar tidak terpotong
- Posisi dropdown mengikuti scroll secara realtime (scroll listener)
- Tampilan dropdown responsif: full-width di HP, sesuai lebar input di desktop
- Stat Cards Kehadiran: 4 kartu gradient modern (Hadir/Sakit/Izin/Alpha) dengan icon SVG, hover timbul, 2 kolom HP
- Donut Chart SVG custom untuk Statistik Kehadiran
- Timeline visual Penanganan Siswa (BK → SP1 → SP2 → SP3)
- Ringkasan Siswa: 4 skor circular progress (2 kolom HP)
- Export PDF Profil Siswa (data lengkap: profil, kehadiran, reward, pelanggaran, ringkasan)
- QR Code per siswa via dynamic import qrcode
- Standardisasi kolom nisn di seluruh file Cari Data Siswa
- Tambah menu Dashboard (atas Umum, hanya login)
- Ganti Tracer Studi → Seputar Sekolah

## 2026-06-23

- Fix Total Siswa di kartu statistik Dashboard mentok di angka 1000 (ganti data.length ke count: 'exact')
- Fix NISN muncul di kolom Nama pada tabel Top 10 Siswa Berprestasi (Admin Dashboard)
- Fix NISN muncul di kolom Nama pada tabel Top 10 Pelanggaran Tertinggi (Admin Dashboard)
- Fix NISN muncul di kolom Nama pada Top 5 Reward & Pelanggaran (Wali Kelas Dashboard)
- Perbaiki icon peringkat Top 10 Siswa Berprestasi (posisi 4-10 pakai lingkaran berangka, bukan teks #4)
- Ganti Line Chart 30 Hari Admin dari data random ke data real dari database
- Ganti Bar Chart 30 Hari OSIS dari data kosong ke data real dari database
- Upgrade komponen CountUp ke requestAnimationFrame (presisi tinggi untuk angka besar)
- Tambah null safety pada seluruh properti data di 4 dashboard (Admin, Wali Kelas, Sekretaris, OSIS)
- Tambah empty state untuk setiap section yang bisa kosong (chart, tabel, list)
- Fix layout Dashboard Wali Kelas, Sekretaris, OSIS yang mepet ke tepi (tambah padding & max-width konsisten dengan Admin)
- Fix error Tooltip is not defined di Wali Kelas Dashboard (Tambah Tooltip ke import recharts)
- Tambah jam dan tanggal realtime di header Dashboard Wali Kelas, Sekretaris, dan OSIS
- Lengkapi kode OsisDashboard.js yang sebelumnya terpotong (Bar Chart 30 Hari, Timeline Reward/Pelanggaran, Tab Berita/Prestasi)

## 2026-06-23

- Tambah relative ke header agar dropdown lonceng muncul di posisi yang benar	AppShell.js
- Trigger notifikasi ke Sekretaris saat revisi disetujui	absensiActions.js (approveEditRequest)
- Trigger notifikasi ke Sekretaris saat revisi ditolak	absensiActions.js (rejectEditRequest)
- Aktifkan browser push notification	AppShell.js (checkLogin)
- Hapus duplikat import createNotification	absensiActions.js
-	Tambah relative ke header agar dropdown posisi benar	AppShell.js
-	Aktifkan Push Notification permission	AppShell.js
-	Trigger: Revisi Disetujui → Sekretaris	absensiActions.js (approveEditRequest)
-	Trigger: Revisi Ditolak → Sekretaris	absensiActions.js (rejectEditRequest)

## 2026-06-24

- Perbaikan fitur Notifikasi (revisi lanjutan)
- Fix build error: Hapus import { Notification } dari framer-motion (bukan export yang valid)
- Fix hydration mismatch: Ganti

## 2026-06-25

- Revamp tampilan sidebar & navigasi bawah mobile
- Fix icon sidebar tidak rata tengah dengan logo saat collapsed (tambah padding centering px-[26px])
- Ubah sidebar dari push konten menjadi overlay (konten tidak bergeser saat sidebar expand)
- Perkecil lebar sidebar dari 272px (w-72) menjadi 224px (w-56)
- Ganti bottom nav dropdown menjadi navigasi halaman khusus (/mobile/*)
- Buat 5 halaman mobile: Siswa, Sekretaris, OSIS, Wali Kelas, Admin
- Desain halaman mobile: header gradient + grid kartu 2 kolom + border warna + deskripsi
- Animasi staggered slide-up pada kartu menu mobile (80ms delay)
- Akses control pada halaman mobile (tampilkan "Akses Ditolak" jika role tidak sesuai)
- Tambah animasi tap pada tombol header (scale-90 + warna biru menyala)
- Ubah NavLink & SubLink dari Link menjadi button untuk kontrol state sidebar
- Hapus state bottomNavOpen, ganti dengan navigasi langsung via router
- Bottom nav tombol hanya muncul sesuai role pengguna

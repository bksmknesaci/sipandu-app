# Changelog SIPANDU

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
- Perbaikan bug Entri Reward (Pencarian siswa tidak muncul setelah 3 huruf karena mismatch kolom nis/nisn)
- Standardisasi kolom database (Merubah pemanggilan nis menjadi nisn di seluruh Server Actions & Frontend sesuai schema Supabase terbaru)
- Penyesuaian tampilan Rekap Kehadiran (NISN hanya muncul di tab Harian)
- Tambah kolom Nomor Urut di tab Bulanan Rekap Kehadiran
- Hapus fungsi duplikat Reward di rekapActions.js (Sudah terakomodasi di rewardActions.js)
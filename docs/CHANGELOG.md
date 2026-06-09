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
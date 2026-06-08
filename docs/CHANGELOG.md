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
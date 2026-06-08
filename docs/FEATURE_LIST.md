# Feature List SIPANDU

## Authentication
- Login
- Logout
- Role Based Access

Status: ACTIVE

---

## Dashboard
- Siswa Berprestasi & Berita
- Tiga Besar Peraih Poin Reward Tertinggi
- Daftar Siswa Tidak Hadir
- Rekapitulasi Jumlah Siswa (Real-time dari Database, 6 Jurusan Tetap)
- Rekap Reward & Pelanggaran (Accordion Kategori)
- Akses Cepat Informasi

Status: ACTIVE

---

## Data Siswa
- Tambah Siswa (Modal Form)
- Edit Siswa
- Hapus Siswa
- Hapus Semua Data (2x Konfirmasi)
- Import CSV (Batch Insert)
- Export CSV (Filtered Data)
- Cetak Data (Print Browser)
- Filter Dinamis (Tingkat & Jurusan dari Database)
- Pencarian Realtime (Nama/NISN)
- Pagination
- Kenaikan Kelas (X → XI, XI → XII dengan Checklist Siswa)
- Kelulusan (XII → Lulus/Hapus dengan Download Arsip CSV)

Status: ACTIVE

---

## Profil Sekolah
- Edit Profil Sekolah
- Upload Foto Hero Dashboard (Maks. 5)
- Upload Logo Jurusan (6 Slot: TKR, PH, DKV, KL, RPL, LPKKK)
- Tampilkan Logo Jurusan di Rekapitulasi Jumlah Siswa
- Hapus Logo Jurusan

Status: ACTIVE

---

## Navigation & Layout
- Persistent Sidebar & Header (AppShell)
- Sidebar selalu tampil di semua halaman tanpa reload
- Menu Absen Hadir Mandiri

Status: ACTIVE

---

## Absen Hadir Mandiri
- Halaman Absensi Mandiri Siswa
- Step-by-step UI (Idle → Camera → Validating → Result)
- Validasi GPS (Radius Sekolah)
- Validasi Waktu (Hadir/Terlambat/Diluar Jam)
- Validasi Duplikat (1 Absensi per Hari)
- Validasi Kelas (QR harus sesuai kelas siswa)

Status: ACTIVE (Simulasi UI)

---

## QR Absensi

- Dashboard Statistik Kehadiran
- Generate QR Code per Kelas (Dinamis dari Data Siswa)
- Download QR Code (PNG)
- Aktifkan/Nonaktifkan QR Code
- Regenerate QR Code
- Pengaturan Validasi GPS (Latitude, Longitude, Radius)
- Pengaturan Validasi Waktu (Jam Masuk, Terlambat, Tutup)
- QR Code Security (Token, Timestamp, Signature)

Status: ACTIVE
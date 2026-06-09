# Feature List SIPANDU

## Authentication
- Login
- Logout
- Role Based Access (4 Role: Administrator, Wali Kelas, Sekretaris Kelas, OSIS)
- Login via Database (loginUserAction)
- Login Hardcoded Admin (admin/admin123)
- Simpan Data User ke localStorage saat Login
- Loading State "⏳ Memproses..." saat Login

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

## Managemen User
- Statistik Pengguna (Count-Up Animation, 5 Kartu Gradient)
- Tambah User (Modal Form + Upload Foto Profil)
- Edit User
- Hapus User (Modal Konfirmasi Ketik "HAPUS")
- Hapus Semua Data (2x Konfirmasi Ketik "HAPUS SEMUA")
- Import CSV
- Export CSV (Filtered Data)
- Cetak Data (Print Browser)
- Filter Dinamis (Peran, Kelas, Status)
- Pencarian Realtime (Nama/Username/Email/WhatsApp)
- Sorting Kolom Tabel (Klik Header)
- Pagination
- Upload Foto Profil ke Supabase Storage
- Kolom Jurusan di Form & Tabel
- Pemilihan Kelas via 3 Dropdown (Tingkat + Jurusan + Nomor) dengan Auto-Compose
- Validasi Kelas Wajib untuk Non-Administrator
- Avatar Default Gradient (Jika Tidak Ada Foto)

Status: ACTIVE

## Profil Saya

- Modal Profil Pengguna di Sidebar
- Tampilkan Foto, Nama, Peran + Kelas, Username, Email, WhatsApp, Kelas, Jurusan, Status
- Mode Edit (Email & WhatsApp)
- Simpan Perubahan via Server Action (updateProfileData)
- Update Otomatis ke localStorage & Sidebar
- Tombol Profil Saya & Logout Sejajar di Sidebar

Status: ACTIVE

## Role-Based Navigation

- Administrator: Semua Menu (Umum, Siswa, Sekretaris, OSIS, Wali Kelas, Admin, Setting)
- Wali Kelas: Menu Umum, Siswa, Wali Kelas
- Sekretaris Kelas: Menu Umum, Siswa, Sekretaris
- OSIS: Menu Umum, Siswa, OSIS
- Belum Login: Menu Umum, Siswa saja
- SubLink Active State (Highlight otomatis sesuai URL)
- Auto-Open Dropdown sesuai Halaman Aktif

Status: ACTIVE
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
- Tambah User (Modal Form + Upload Foto Profil)
- Edit User
- Hapus User

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

## Menu Rekap Kehadiran

- Halaman Rekap Kehadiran (Akses: Wali Kelas & Administrator)
- Tab Harian (Tabel Detail, Status Badge, Sumber Absensi, Waktu)
- Tab Bulanan (Freeze Table Nama & Header, Kolom Tanggal 1-31, Auto-Alpha di tanggal kosong)
- Tab Semester (6 Bulan, Format H/S/I/A vertikal, Freeze Table, Total & Persentase)
- Tab Tahunan (12 Bulan, Format H/S/I/A vertikal, Freeze Table, Total & Persentase)
- Auto-Alpha Sinkronisasi (Otomatis mengisi Alpha jika tidak ada record >14:00 WIB)
- Export PDF (Kop Surat Resmi, Logo Dinas Jabar & Logo Sekolah, Data Semester)
- Export Excel (Data Rekap Semester Format Lengkap)
- Reset Semester (Hapus data absensi semester aktif)
- Reset Semua / Tahunan (Hapus seluruh data absensi kelas terpilih)
- Diagram Distribusi Kehadiran (Donut Chart Hari Ini)
- Diagram Perbandingan Status (Bar Chart Hari Ini)

Status: ACTIVE

## Dashboard - Daftar Siswa Tidak Hadir

- Integrasi Supabase Realtime Subscription (Auto-update tanpa reload)
- Perbaikan Label Kelas (Gabungan Kelas + Jurusan, cont: "XI TKRO 1")

Status: ACTIVE

## Absen Sakit & Izin

- Halaman pengajuan ketidakhadiran untuk siswa
- Input NISN untuk verifikasi identitas siswa
- Batas waktu pengajuan 06:00 WIB - 09:04 WIB (Admin bebas waktu)
- Pilihan Jenis: Sakit atau Izin
- Wajib ambil foto langsung dari kamera (bukan galeri)
- Kompresi foto otomatis (target 100-300 KB)
- Deteksi lokasi GPS otomatis (Wajib untuk siswa, opsional admin)
- Sinkronisasi Otomatis ke Tabel Absensi Utama (locked=true, input_by='Sakit/Izin Online')
- Cegah duplikasi pengajuan (1x per hari)
- Mode Admin (Bebas waktu, GPS & Foto opsional)

Status: ACTIVE

## Rekap Sakit & Izin (Wali Kelas)

- Halaman verifikasi pengajuan untuk Wali Kelas & Administrator
- Statistik Pengajuan (Total, Menunggu, Disetujui, Ditolak)
- Filter Kelas & Jurusan (Otomatis untuk Wali Kelas, Dropdown untuk Admin)
- Tab Filter Status (Menunggu, Disetujui, Ditolak)
- Kolom Peta (Link Google Maps berdasarkan koordinat siswa)
- Lihat Bukti Foto (Modal pop-up)
- Aksi Setujui (Status di absensi utama tetap Sakit/Izin)
- Aksi Tolak (Status di absensi utama otomatis berubah menjadi Alpha, wajib isi catatan)
- Reset Filter

Status: ACTIVE

## Absen Hadir Mandiri (Revamp)

- Input NISN untuk mencari data siswa
- Integrasi Kamera HP via library html5-qrcode
- Scan QR Code Kelas (Format JSON dari halaman QR Absensi)
- Validasi Kelas (Jika QR kelas tidak cocok, sistem menolak)
- Sinkronisasi Otomatis ke Tabel Absensi Utama (locked=true, input_by='QR Mandiri')

Status: ACTIVE

## Integrasi Absensi Otomatis

- Data dari Sakit/Izin & QR Mandiri langsung masuk ke Tabel Absensi Utama
- Status otomatis terkunci (locked=true) bagi Sekretaris
- Badge Keterangan di halaman Sekretaris (ONLINE / SCAN QR)
- Sekretaris tidak dapat mengubah status yang dikunci dari sistem online
- Timezone Sinkron (Semua halaman menggunakan format tanggal WIB 'sv-SE')

Status: ACTIVE
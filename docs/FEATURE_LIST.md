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

## Beranda
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

---

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

---

## Manajemen User (Update)
- Statistik Pengguna (Count-Up Animation, 5 Kartu Gradient)
- Tambah User (Modal Form + Upload Foto Profil)
- Edit User
- Hapus User (Modal Konfirmasi Ketik "HAPUS")
- Hapus Semua Data (2x Konfirmasi Ketik "HAPUS SEMUA", Validasi ID Admin)
- Import Excel/CSV (Support .xlsx, .xls, .csv via library xlsx)
- Unduh Format CSV Template (Di dalam Modal Import)
- Export CSV (Filtered Data)
- Cetak Data (Print Browser, Header sinkron dengan kolom tabel utama)
- Filter Dinamis (Peran, Kelas, Status)
- Pencarian Realtime (Nama/Username/Email/WhatsApp)
- Sorting Kolom Tabel (Klik Header)
- Pagination
- Upload Foto Profil ke Supabase Storage
- Kolom Jurusan di Form & Tabel
- Pemilihan Kelas via 3 Dropdown (Tingkat + Jurusan + Nomor) dengan Auto-Compose
- Validasi Kelas Wajib untuk Non-Administrator
- Avatar Default Gradient (Jika Tidak Ada Foto)
- Fix Layout Tabel (Horizontal Scroll, min-width agar tidak berantakan)

Status: ACTIVE

---

## Profil Saya
- Modal Profil Pengguna di Sidebar
- Tampilkan Foto, Nama, Peran + Kelas, Username, Email, WhatsApp, Kelas, Jurusan, Status
- Mode Edit (Email & WhatsApp)
- Simpan Perubahan via Server Action (updateProfileData)
- Update Otomatis ke localStorage & Sidebar
- Tombol Profil Saya & Logout Sejajar di Sidebar

Status: ACTIVE

---

## Role-Based Navigation
- Administrator: Semua Menu (Umum, Siswa, Sekretaris, OSIS, Wali Kelas, Admin, Setting)
- Wali Kelas: Menu Umum, Siswa, Wali Kelas
- Sekretaris Kelas: Menu Umum, Siswa, Sekretaris
- OSIS: Menu Umum, Siswa, OSIS
- Belum Login: Menu Umum, Siswa saja
- SubLink Active State (Highlight otomatis sesuai URL)
- Auto-Open Dropdown sesuai Halaman Aktif

Status: ACTIVE

---

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

---

## Beranda - Daftar Siswa Tidak Hadir
- Integrasi Supabase Realtime Subscription (Auto-update tanpa reload)
- Perbaikan Label Kelas (Gabungan Kelas + Jurusan, cont: "XI TKRO 1")

Status: ACTIVE

---

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

---

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

---

## Absen Hadir Mandiri (Revamp)
- Input NISN untuk mencari data siswa
- Integrasi Kamera HP via library html5-qrcode
- Scan QR Code Kelas (Format JSON dari halaman QR Absensi)
- Validasi Kelas (Jika QR kelas tidak cocok, sistem menolak)
- Sinkronisasi Otomatis ke Tabel Absensi Utama (locked=true, input_by='QR Mandiri')

Status: ACTIVE

---

## Integrasi Absensi Otomatis
- Data dari Sakit/Izin & QR Mandiri langsung masuk ke Tabel Absensi Utama
- Status otomatis terkunci (locked=true) bagi Sekretaris
- Badge Keterangan di halaman Sekretaris (ONLINE / SCAN QR)
- Sekretaris tidak dapat mengubah status yang dikunci dari sistem online
- Timezone Sinkron (Semua halaman menggunakan format tanggal WIB 'sv-SE')

Status: ACTIVE

---

## Menu OSIS
- Entri Reward
- Entri Pelanggaran

Status: ACTIVE

---

## Menu Wali Kelas
- Entri Reward
- Entri Pelanggaran
- Rekap Pelanggaran
- Rekap Sakit & Izin
- Rekap Kehadiran

Status: ACTIVE

---

## Menu Rekap Reward (Update)
- Statistik Pengguna (Count-Up Animation, 4 Kartu Gradient: Siswa Dapat Reward, Total Poin Sekolah, Siswa Berprestasi, Entri Bulan Ini)
- Tiga Besar Peraih Poin Reward Tertinggi (Dinamis dari Database)
- Tabel Rekap Data Siswa Berpoint (Kolom NISN, Nama, Kelas, Total Poin, Kategori, Reward Terakhir, Aksi Detail)
- Grafik Batang Reward Per Kelas (Dinamis dari Database)
- Grafik Lingkaran (Donut) Reward Per Jurusan (Dinamis dari Database)
- Grafik Garis Perkembangan Reward Bulanan (Dinamis dari Database)
- Filter Data (Kelas & Jurusan)
- Detail Siswa (Modal Timeline Riwayat Reward)
- Hapus Reward (Kurangi poin otomatis)
- Kalkulasi Poin Otomatis (Langsung dari tb_reward_siswa, tidak bergantung pada kolom total_reward di tabel siswa)

Status: ACTIVE

---

## Entri Reward & Pelanggaran (Update)
- Pencarian Siswa Realtime (Berdasarkan Nama atau NISN, Min 3 Karakter)
- Fix Bug Pencarian (Sinkronisasi nama kolom NISN di database)

Status: ACTIVE

---

## Menu Rekap Kehadiran (Update)
- Tab Harian (Tabel Detail, Kolom NISN, Status Badge, Sumber Absensi, Waktu)
- Tab Bulanan (Freeze Table Nama & Header, Kolom Nomor Urut, Kolom Tanggal 1-31, Tanpa Kolom NISN)
- Tab Semester (6 Bulan, Format H/S/I/A vertikal, Freeze Table, Tanpa Kolom NISN)
- Tab Tahunan (12 Bulan, Format H/S/I/A vertikal, Freeze Table, Tanpa Kolom NISN)

Status: ACTIVE

---

## Menu Penanganan Siswa (Administrator & Wali Kelas)
- Halaman monitoring dan tindak lanjut siswa berdasarkan akumulasi pelanggaran
- Statistik Kartu Pembinaan (Dalam Pembinaan, SP1, SP2, SP3, Pindah, Keluar) dengan Count Animation
- Tabel Daftar Siswa per kelas (Termasuk siswa Pindah/Keluar diletakkan di baris bawah dengan latar merah)
- Kolom Status Saat Ini dengan Badge (Belum Pembinaan, Pembinaan BK, SP1, SP2, SP3, Pindah[Hijau], Keluar[Merah])
- Filter Dinamis (Tingkat, Jurusan, Status Penanganan, Pencarian Nama/NISN)
- Reset Semua Penanganan (Hapus riwayat dan kembalikan status siswa ke Aktif)
- Modal Detail Siswa:
  * Tab Riwayat Pelanggaran
  * Tab Riwayat Reward
  * Tab Kehadiran Hari Ini
  * Tab Form Penanganan (Layanan BK, Tahap, SP1/2/3 & Tanggal, Status Akhir, Tanggal Keputusan, Catatan, Upload Dokumen)
- Logika Otomatis: Siswa SP1/SP2/SP3 otomatis masuk hitungan kartu "Dalam Pembinaan"
- Logika Kunci: Siswa Pindah/Keluar tidak bisa diedit formnya (Terkunci) dan otomatis tidak masuk hitungan aktif
- Integrasi: Mengubah status ke Pindah/Keluar otomatis mengubah status tabel siswa dan mengirim data ke Rekap Pindah & Keluar

Status: ACTIVE

---

## Menu Rekap Pindah & Keluar (Administrator)
- Halaman daftar siswa yang sudah tidak aktif karena pindah atau keluar sekolah
- Statistik Kartu (Total Pindah, Total Keluar, Total Tahun Ini, Total Semester Ini)
- Tabel Rekap (NISN, Nama, Kelas, Jurusan, L/P, Status, Tgl Keputusan, Alasan Pindah/Keluar, Dokumen, Aksi)
- Filter Dinamis (Status, Kelas, Jurusan, Pencarian)
- Export CSV & Cetak Data (Print Browser dengan format tabel rapi)
- Modal Detail Siswa (Profil, Alasan, Dokumen Pendukung, Total Pelanggaran/Reward)

Status: ACTIVE

---
## Menu Formulir (Siswa & Alumni)
- Ganti menu "Informasi" menjadi "Formulir" di Header (AppShell)
- Halaman Pusat Formulir (3 Kartu Pilihan dengan gradient & hover animasi)
- Form Tracer Studi Lulusan (Dinamis berdasarkan status: Kuliah, Bekerja, Wirausaha)
- Form Pemetaan Karir (Multi-select minat karir)
- Form Pendataan SNBP & SNBT (Upload bukti PDF/JPG/PNG)
- Upload file bukti ke Supabase Storage (Bucket: bukti-formulir)
- Halaman sukses setelah submit formulir

Status: ACTIVE

---

## Menu Rekap Formulir (Administrator)
- Halaman rekapitulasi seluruh isian formulir siswa & alumni
- Statistik Kartu (Total Tracer, Total Karir, Total SNBP, Total Semua) dengan Count Animation
- Tab Modern (Tracer Studi, Pemetaan Karir, SNBP/SNBT)
- Tabel Rekap Dinamis dengan Pencarian real-time
- Export CSV & Cetak Data (Print Browser dengan format tabel rapi)
- Modal Detail Data Formulir (Menampilkan semua field dinamis termasuk link file bukti)
- Tombol Reset Semua Data Formulir (Hapus permanen semua isian dari 3 tabel)

Status: ACTIVE

---

## Beranda (Update)
- Tambah widget Statistik Formulir (Total Formulir Masuk, Tracer, Karir, SNBP)
- Update link footer (Tracer Studi, SNBP/SNBT, Pemetaan Karir mengarah ke /formulir/...)

Status: ACTIVE

---

## Menu Penanggung Jawab Kelas (Setting)
- Halaman Manajemen Penanggung Jawab (/setting/penanggung-jawab)
- Data Wali Kelas & Sekretaris otomatis diambil dari Manajemen User (Role & Kelas)
- Kartu Statistik (Total Kelas Aktif, Total Wali, Total Sekretaris, Total PJ)
- Tabel Data PJ dengan Badge WhatsApp (Oranye untuk Wali, Ungu untuk Sekretaris)
- Filter Pencarian Realtime
- Modal Detail Penanggung Jawab
- Komponen PJInfoCard yang terintegrasi di Rekap Kehadiran & Penanganan Siswa

Status: ACTIVE

---

## Menu Hari Efektif (Setting)
- Halaman Manajemen Hari Efektif & Kalender Akademik (/setting/hari-efektif)
- Kartu Statistik (Hari Efektif, Libur Nasional, Libur Sekolah, Total Non-Efektif)
- 4 Tab Navigasi: Hari Libur Manual, Kalender Pendidikan, Preview Kalender, Riwayat Aktivitas
- Tab Libur: CRUD Hari Libur, Import/Export CSV, Tombol Hapus Semua Data
- Tab Kalender: Setup Tahun Pelajaran, Semester, Tanggal, Hanya 1 Kalender Boleh Aktif
- Tab Preview: Tampilan Kalender Bulan Ini (Warna blok sesuai status)
- Tab Riwayat: Audit Trail aktivitas admin
- Otomatis Sabtu & Minggu dihitung sebagai hari non-efektif

Status: ACTIVE

---

## Integrasi Hari Efektif dengan Rekap Kehadiran
- Tab Bulanan: Tanggal hari libur dan Sabtu/Minggu otomatis diberi blok merah pekat tanpa inisial
- Tab Bulanan: Penambahan kolom E (Efektif) di samping kiri kolom H
- Tab Semester/Tahunan: Penambahan kolom "Hari Efektif" di samping kiri Total H
- Perhitungan Persentase Kehadiran otomatis menggunakan Hari Efektif
- Export Excel/PDF menyesuaikan format dan kolom Hari Efektif

Status: ACTIVE

---

## Menu Pos Berita (Setting)
- Halaman manajemen berita terpusat (/setting/pos-berita)
- Kartu Statistik (Total Berita, Berita Sekolah, Siswa Berprestasi, Dilihat Bulan Ini)
- Tab Navigasi: Semua, Siswa Berprestasi, Berita Sekolah, Draft
- CRUD Berita (Modal Form)
- Fitur Upload Cover dengan Kompresi Otomatis (Max 800x600, 80% Quality)
- Toggle Featured News (Berita Utama)
- Tab View Counter otomatis bertambah saat berita dibaca
- Tombol Hapus Semua Berita
- Fix referrer policy untuk menampilkan gambar dari Supabase Storage

Status: ACTIVE

---

## Integrasi Berita ke Dashboard & Halaman Publik
- Widget "Siswa Berprestasi & Berita" di Dashboard kini mengambil data dinamis dari database (5 berita terbaru berstatus Publish)
- Halaman Publik Siswa Berprestasi (/siswa-berprestasi) menampilkan grid card berita kategori prestasi
- Halaman Publik Berita Sekolah (/berita-sekolah) menampilkan grid card berita kategori sekolah
- Halaman Detail Berita (/berita/[slug]) menampilkan isi berita, view counter, dan berita terkait
- Tombol "Seputar Sekolah" di Akses Cepat Informasi mengarah ke /berita-sekolah
- Tombol "Siswa Berprestasi" di Sidebar mengarah ke /siswa-berprestasi

Status: ACTIVE

---

## Integrasi Berita ke Dashboard & Halaman Publik (Update)
- Widget "Siswa Berprestasi & Berita" di Dashboard kini mengambil data dinamis dari database (5 berita terbaru berstatus Publish)
- Berita yang dicentang "Featured" otomatis tampil sebagai konten utama (kolom kiri besar) di Dashboard
- Halaman Publik Semua Berita (/semua-berita) menampilkan gabungan Siswa Berprestasi & Berita Sekolah dalam satu halaman dengan tab filter
- Halaman Publik Siswa Berprestasi (/siswa-berprestasi) menampilkan grid card berita kategori prestasi
- Halaman Publik Berita Sekolah (/berita-sekolah) menampilkan grid card berita kategori sekolah
- Halaman Detail Berita (/berita/[slug]) menampilkan isi berita, view counter, dan berita terkait
- Fungsi getImageUrl() menangani semua format URL cover (lengkap, relatif, null) dengan fallback SVG rapi
- Atribut referrerPolicy="no-referrer" pada setiap tagagar gambar Supabase Storage muncul
- Konfigurasi images.remotePatterns di next.config.ts untuk domain *.supabase.co
- Tombol "LIHAT SEMUA BERITA" di Dashboard mengarah ke /semua-berita (gabungan dua kategori)
- Halaman Pos Berita, Siswa Berprestasi, Berita Sekolah, Semua Berita, dan Detail Berita tidak menggunakan AppShell (menghindari layout ganda)

Status: ACTIVE

---

## Akses Cepat Informasi (Update)
- Kartu Pemetaan Karir ditambahkan (arah ke /formulir/pemetaan-karir)
- Total 4 kartu: Tracer Studi, SNBP/SNBT, Pemetaan Karir, Seputar Sekolah
- Grid 4 kolom di desktop, 2 kolom di HP
- Efek hover: kartu timbul naik (translate-y) + bayangan membesar + lingkaran dekoratif membesar
- Animasi ikon naik turun (bounce-slow 2 detik) dengan delay berbeda tiap kartu
- Posisi dipindahkan ke atas widget Siswa Berprestasi & Berita di Dashboard
- Tombol "Seputar Sekolah" menggunakan useRouter().push() (fix navigasi tidak berfungsi)

Status: ACTIVE

---

## Pos Berita (Update)
- Kompresi gambar cover ditingkatkan: max 1400px (sebelumnya 800px), quality 92% (sebelumnya 80%)
- Thumbnail di tabel menggunakan fungsi getImageUrl() + fallback SVG
- Halaman tidak menggunakan AppShell (menghindari layout ganda)

Status: ACTIVE

---
## Server Action getPublishedNews (Update)
- Penambahan order('featured', { ascending: false }) sebelum order tanggal
- Berita Featured selalu muncul paling atas dalam daftar

Status: ACTIVE

---

## Portal Orang Tua (/portal-ortu)
- Halaman search NISN untuk akses dashboard (tidak memerlukan login)
- Pencarian fleksibel: mencocokkan kolom nisn dan nis (fallback untuk format lama)
- Hero Section: foto profil, nama, NISN, kelas, jurusan, tahun pelajaran, status hadir hari ini
- Badge status hadir: 🟢 Hadir, 🟡 Izin, 🟠 Sakit, 🔴 Alpha, 🔴 Belum Absen
- 6 Summary Card: Kehadiran (%), Total Reward, Pelanggaran, Status Hari Ini, Ranking Reward, Pesan WK
- Profil Akademik & Siswa: data lengkap dari tabel siswa + info Wali Kelas & Sekretaris dari tabel users (matching fleksibel)
- Kehadiran Bulan Ini: Donut Chart SVG custom (persentase di tengah), statistik H/I/S/A, timeline riwayat terakhir
- Status Kehadiran Hari Ini: card besar dengan ikon, jam, metode absensi
- Kalender Akademik Interaktif: navigasi bulan, highlight warna (hijau=efektif, merah=libur nasional, kuning=libur sekolah, biru=ujian, ungu=kegiatan, abu=weekend)
- Pesan Wali Kelas: layout chat modern, kirim pesan, riwayat percakapan, badge belum dibaca
- Kedisiplinan & Prestasi: panel kiri (reward + grafik bar bulanan), panel kanan (pelanggaran + grafik bar bulanan)
- Catatan Surat Peringatan (SP): integrasi dengan tb_penanganan_siswa, tampil SP1/SP2/SP3 dengan tanggal dan keterangan, status pembinaan BK, catatan BK, total poin
- Ringkasan Perkembangan: Radar Chart (Kehadiran, Prestasi, Disiplin, Aktivitas, Akademik) skala 0-100
- Riwayat Aktivitas Terbaru: timeline gabungan (reward, pelanggaran, pesan)
- Notification Center: dropdown notifikasi dengan badge unread, mark as read
- Export PDF Laporan Bulanan: buka window baru dengan laporan kehadiran, reward, pelanggaran
- Tombol Ganti Siswa untuk kembali ke halaman search
- Skeleton loading saat memuat data
- Halaman tidak menggunakan AppShell (standalone page)
- Matching Wali Kelas & Sekretaris menggunakan logika fleksibel (exact, tingkat, substring)

Status: ACTIVE

---

## Halaman Semua Berita (/semua-berita)
- Halaman gabungan Siswa Berprestasi & Berita Sekolah
- Tab filter: Semua Berita, Siswa Berprestasi, Berita Sekolah
- Pencarian real-time (judul, ringkasan)
- Grid card responsif dengan cover, kategori badge, view counter
- Halaman tidak menggunakan AppShell (standalone page)

Status: ACTIVE

---

## Integrasi Berita ke Dashboard & Halaman Publik (Update)
- Widget "Siswa Berprestasi & Berita" menggunakan getPublishedNews dari server action
- Berita Featured otomatis tampil sebagai konten utama (kolom kiri besar) di Dashboard
- Fungsi getImageUrl() menangani semua format URL cover (lengkap, relatif, null) dengan fallback SVG rapi
- Atribut referrerPolicy="no-referrer" pada setiap tagberita
- Konfigurasi images.remotePatterns di next.config.ts untuk domain *.supabase.co
- Tombol "LIHAT SEMUA BERITA" di Dashboard mengarah ke /semua-berita

Status: ACTIVE

---

## Akses Cepat Informasi (Update)
- 4 kartu: Tracer Studi, SNBP/SNBT, Pemetaan Karir, Seputar Sekolah
- Grid 4 kolom desktop, 2 kolom HP
- Efek hover: kartu timbul naik (translate-y-3), bayangan membesar, lingkaran dekoratif scale
- Animasi ikon naik turun (bounce-slow 2 detik) dengan delay berbeda tiap kartu (0s, 0.3s, 0.6s, 0.9s)
- Posisi dipindahkan ke atas Siswa Berprestasi & Berita di Dashboard
- Tombol Seputar Sekolah menggunakan useRouter().push() (fix navigasi tidak berfungsi)

Status: ACTIVE


## Pos Berita (Update)
- Kompresi gambar cover: max 1400px, quality 92% (sebelumnya 800px/80%)
- Thumbnail di tabel menggunakan getImageUrl() + fallback SVG abu-abu
- Halaman tidak menggunakan AppShell (menghindari layout ganda)

Status: ACTIVE

---

## getPublishedNews Server Action (Update)
- Penambahan order('featured', { ascending: false }) sebelum order tanggal
- Berita Featured selalu muncul paling atas dalam daftar

Status: ACTIVE

---

## Sidebar Navigation (Update)
- Fix NavLink active state: menggunakan href sebagai fallback identifier ketika menuId tidak diberikan
- Menu umum (Portal Orang Tua, Siswa Berprestasi, Tracer Studi) sekarang masing-masing highlight secara independen

Status: ACTIVE

---

## parentPortalActions.js (Server Action Baru)
- searchStudentByNIS: pencarian fleksibel di kolom nisn dan nis
- getDashboardData: mengambil seluruh data dashboard dalam satu panggilan (kehadiran, - reward, pelanggaran, penanganan, PJ, kalender, pesan, notifikasi, ranking)
- sendParentMessage: kirim pesan dari orang tua
- markNotificationRead: tandai notifikasi sudah dibaca

Status: ACTIVE

---

## Cari Data Siswa (Dashboard Widget)
- Search bar di Dashboard dengan tombol lingkaran biru
- Autocomplete realtime (debounce 300ms, minimal 3 huruf)
- Pencarian berdasarkan: Nama, NISN, Kelas
- Dropdown via Portal (tidak terpotong parent overflow)
- Posisi dropdown mengikuti scroll secara realtime
- Tampilan responsif: full-width di HP, sesuai lebar input di desktop
- Menampilkan: Avatar inisial, Nama, Kelas, Jurusan, NISN, Status Kehadiran Hari Ini
- Klik siswa langsung buka halaman detail
- Tombol "Lihat Semua Hasil" ke halaman pencarian penuh
- Filter otomatis mengecualikan siswa Pindah/Keluar/Lulus

Status: ACTIVE

---

## Halaman Cari Data Siswa (/cari-data-siswa)
- Header gradient biru dengan judul dan deskripsi
- Search box besar dengan tombol lingkaran biru
- Tag pencarian: Nama, NISN, Kelas
- Auto-search dari URL parameter (?q=...)
- Skeleton loading saat mencari
- Hasil pencarian berupa card modern (grid 3 kolom)
- Setiap card: Avatar, Nama, NISN, Kelas, Jurusan, Status Kehadiran, Tombol "Lihat Detail"
- Hover effect: timbul naik + garis gradient biru muncul
- State kosong: ilustrasi "Mulai Pencarian"
- State tidak ditemukan: ilustrasi "Siswa Tidak Ditemukan"
- Halaman tidak menggunakan AppShell (standalone page)

Status: ACTIVE

---

## Halaman Detail Siswa (/cari-data-siswa/[id])
- Sticky top bar (Kembali + Cetak Profil)
- Section 1 — Profil Siswa: Gradient biru, avatar inisial, Nama, NISN, Kelas, Jurusan, Status, QR Code profil
- Stat Cards Kehadiran: 4 kartu gradient (Hadir hijau, Sakit kuning, Izin biru, Alpha merah) dengan icon modern, hover timbul, 2 kolom di HP
- Section 2 — Status Kehadiran Hari Ini: Badge status dengan icon, metode, jam
- Section 3 — Statistik Kehadiran: Donut Chart SVG custom, persentase di tengah, legend warna
- Section 4 — Riwayat Absensi Terakhir: Tabel dengan filter Minggu/Bulan/Semester
- Section 5 — Reward & Prestasi: Total reward, total poin, timeline prestasi
- Section 6 — Pelanggaran: Total pelanggaran, total poin, kategori ringan/sedang/berat, timeline
- Section 7 — Status Penanganan Siswa: Timeline visual BK → SP1 → SP2 → SP3, catatan BK
- Section 8 — Ringkasan Siswa: 4 skor circular progress (Kehadiran, Disiplin, Prestasi, Keseluruhan), badge status, 2 kolom di HP
- Export PDF Profil Siswa (window baru, kop, semua data terintegrasi)
- QR Code per siswa (scan langsung buka halaman profil)
- Skeleton loading saat memuat data
- Halaman tidak menggunakan AppShell (standalone page)
- Tidak menampilkan fitur Portal Orang Tua (chat, WA, kontak guru)

Status: ACTIVE

---

## Cari Data Siswa (Server Action)
- searchSiswa: Pencarian realtime siswa berdasarkan nama/NISN/kelas via supabaseAdmin
- getSiswaDetail: Mengambil seluruh data siswa dalam satu panggilan (profil, absensi hari ini, semua absensi, statistik semester, reward, pelanggaran, penanganan)
- Integrasi tanggal WIB (toLocaleDateString 'sv-SE')
- Filter absensi semester berdasarkan academic_calendar aktif
- Match NISN siswa ke tb_reward_siswa.nisn dan tb_pelanggaran_siswa.nisn

Status: ACTIVE

---

## Dashboard Baru (Update — 2026-06-23)
- Tambah menu Dashboard (atas Umum, hanya login), ganti Tracer Studi → Seputar Sekolah
- 4 server actions untuk 4 role
- Dashboard Administrator lengkap dengan 12 stat cards, 3 chart Recharts, top 10 reward/pelanggaran, monitoring per kelas, berita, aktivitas
- placeholder fungsional
- placeholder fungsional dengan progress ring
- +3 fungsi extended: getWaliKelasDashboardFull (top 5 reward/pelanggaran + pesan ortu), getSekretarisDashboardFull (chart 7 hari + izin pending), getOsisDashboardFull (chart 30 hari + prestasi news)
- Wali Kelas : Full: donut chart kehadiran, siswa belum absen, izin pending, top 5 reward/pelanggaran, penanganan aktif, chat pesan orang tua
- Sekretaris : Full: progress ring animasi, bar chart 7 hari (H/S/I/A), izin pending, daftar belum absen, 3 quick action buttons
- Osis : Full: bar chart 30 hari (reward vs pelanggaran), timeline reward/pelanggaran, tab berita/prestasi dengan card modern
- Fix Total Siswa mentok di angka 1000: Ganti data.length ke { count: 'exact', head: true } di seluruh query count (4 role)
- Fix NISN muncul di kolom Nama pada Top 10 Reward & Top 10 Pelanggaran: Ambil field nama_siswa dari tabel tb_reward_siswa / tb_pelanggaran_siswa, bukan nisn
- Fix Line Chart 30 Hari Admin: Ganti Math.random() dengan data real dari query absensi 30 hari terakhir
- Fix Bar Chart 30 Hari OSIS: Ganti data kosong dengan data real dari query tb_reward_siswa & tb_pelanggaran_siswa 30 hari terakhir
- Fix Bar Chart 7 Hari Sekretaris: Data real dari query absensi 7 hari terakhir
- Tambah komponen RankBadge di Top 10 Siswa Berprestasi (posisi 4-10 menggunakan lingkaran berangka, bukan teks #4)
- Upgrade CountUp ke requestAnimationFrame (presisi tinggi untuk angka besar di atas 1000)
- Tambah null safety (|| 0, || []) pada seluruh properti data di 4 dashboard
- Tambah empty state untuk setiap section yang bisa kosong (chart, tabel, list)

Status: ACTIVE

---

## Notifikasi
- Komponen NotificationCenter (Dropdown di Header, Bell icon + badge unread)
- Komponen DashboardNotifications (Widget 5 notifikasi terbaru di Dashboard)
- Halaman Pusat Notifikasi (/notifikasi) dengan filter lengkap
- Tab Status: Semua, Belum Dibaca, Sudah Dibaca, Penting, Sistem
- Tab Waktu: Semua Waktu, Hari Ini, 7 Hari, 30 Hari
- Pencarian notifikasi real-time
- Tandai Dibaca (satu / semua), Hapus (satu / semua)
- Pagination halaman notifikasi
- Supabase Realtime subscription (auto-update tanpa reload)
- Animasi bell shake saat notifikasi baru masuk
- Push Notification permission (Browser Web Notification API)
- Icon & label per tipe: Sakit/Izin, Pesan Orang Tua, Revisi Absensi, Reward, Pelanggaran, Penanganan, Sistem
- Priority styling: INFO (biru), SUCCESS (hijau), WARNING (kuning), DANGER (merah)
- Action button per notifikasi (navigasi ke halaman terkait)
- Trigger: Pengajuan Sakit/Izin → Wali Kelas
- Trigger: Revisi Absensi Disetujui → Sekretaris + Wali Kelas
- Trigger: Revisi Absensi Ditolak → Sekretaris + Wali Kelas
- Trigger: Pelanggaran Berat → Administrator
- Bell icon tampil untuk semua role termasuk Admin hardcoded
- Halaman Pusat Notifikasi aksesibel untuk semua role yang login
- Login hardcoded Admin mengambil ID user dari database (notifikasi berfungsi penuh)

Status: ACTIVE

--- 

## Sidebar & Navigasi (Update)
- Sidebar icon rata tengah sejajar logo saat collapsed (px-[26px] centering)
- Sidebar overlay di atas konten (tidak menggeser halaman saat expand)
- Lebar sidebar 224px (w-56), cukup untuk teks submenu terpanjang
- Tap sidebar untuk expand di HP desktop mode (tanpa kursor hover)
- Tap di luar sidebar otomatis collapse
- Sidebar tersembunyi di portrait HP (<640px), buka via hamburger overlay
- Tombol header dengan animasi tap (scale-90 + warna biru menyala)
- Profil dropdown panah dengan glow effect saat aktif
- Navigasi NavLink & SubLink menggunakan button (bukan Link) untuk kontrol state

Status: ACTIVE

---

## Navigasi Bawah Mobile (Halaman Khusus)
- 5 tombol navigasi bawah: Siswa, Sekretaris, OSIS, Wali Kelas, Admin
- Setiap tombol mengarah ke halaman khusus (/mobile/*)
- Halaman Mobile Siswa: 6 menu (Portal Orang Tua, Absen Sakit/Izin, Cari Data Siswa, Absen Mandiri, Siswa Berprestasi, Seputar Sekolah)
- Halaman Mobile Sekretaris: 1 menu (Absensi Kehadiran)
- Halaman Mobile OSIS: 2 menu (Entri Reward, Entri Pelanggaran)
- Halaman Mobile Wali Kelas: 5 menu (Entri Reward, Entri Pelanggaran, Rekap Pelanggaran, - Rekap Sakit/Izin, Rekap Kehadiran)
- Halaman Mobile Admin: 10 menu (Daftar Siswa, Penanganan, Rekap Reward, Rekap Formulir, - Rekap Pindah/Keluar, Manajemen User, Profil SIPANDU, Penanggung Jawab, Hari Efektif, Pos Berita)
- Desain kartu grid 2 kolom dengan border warna kiri unik per menu
- Animasi staggered slide-up (80ms delay per kartu)
- Header gradient dengan ikon unik per kategori
- Akses control: halaman menampilkan "Akses Ditolak" jika role tidak sesuai
- Tap feedback: active:scale-95 pada setiap kartu
- Tombol navigasi bawah hanya muncul sesuai role (Sekretaris/OSIS/Wali/Admin)

Status: ACTIVE

---

## Rekap Kehadiran (Update)
- Fix teks "Semester $2 Tahun Ajaran $2025/$2026" (template literal salah di JSX, sekarang menggunakan backtick + curly braces)
- Tab Bulanan, Semester, Tahunan: Kolom No/Nama/L/P tidak dibekukan (sticky) di tampilan HP agar scroll horizontal tidak terblokir
- Tab Bulanan, Semester, Tahunan: Kolom sticky hanya aktif di desktop (md:sticky) dengan background solid saat hover (menghilangkan efek transparan /30 yang menyebabkan teks tembus)
- Tab Bulanan: Tambah section "Siswa Kritis — Alpha > 5 Kali" di bawah tabel
- Section Siswa Kritis: Banner merah gradient dengan ikon pulse
- Section Siswa Kritis: 5 kartu statistik (Siswa Kritis, Alpha Tertinggi, Rata-rata, Sangat Kritis ≥15, Donut Rasio Kritis)
- Section Siswa Kritis: Legend severity 3 tingkat (Sangat Kritis/Kritis/Perlu Perhatian)
- Section Siswa Kritis: Horizontal bar chart Top 10 siswa alpha tertinggi dengan gradient warna berbeda per level
- Section Siswa Kritis: Tabel detail lengkap dengan badge severity, baris berwarna merah untuk sangat kritis

Status: ACTIVE

---

## Absen Sakit & Izin (Update)
- Fix layout tombol Cari di HP (flex-col di mobile, flex-row di SM ke atas) agar tidak tertutup tabel
- Fix referensi kolom .nis menjadi .nisn saat cek duplikasi pengajuan dan kirim data (sinkron dengan perbaikan getSiswaByNISN)

Status: ACTIVE

--- 

## Absen Hadir Mandiri (Update)
- Tambah batasan waktu absensi 06:00 WIB s.d. 09:04 WIB (sama seperti halaman Absen Sakit & Izin)
- Tampilan terkunci di luar jam: "⏳ Absensi Belum Dibuka" atau "❌ Waktu Absensi Telah Berakhir"
- Countdown timer mundur jika belum dibuka (format: Xj Ym Zd)
- Admin bebas akses kapan saja (tampil "Mode Admin (Bebas Waktu)")
- Fix layout tombol Cari di HP (flex-col di mobile, flex-row di SM ke atas)
- Fix referensi kolom .nis menjadi .nisn saat tampilkan data siswa

Status: ACTIVE

--- 

## QR Absensi (Update — Integrasi ke Tab Manajemen Siswa)
- Hapus halaman terpisah /qr-absensi/page.js (fungsi dipindah ke tab QR Absensi di Manajemen Siswa)
- Validasi GPS Sekolah: Tombol "Ambil Lokasi" (deteksi koordinat otomatis via Geolocation API)
- Validasi GPS Sekolah: Tombol "Validasi GPS" (hitung jarak Haversine dari posisi saat ini ke titik tengah)
- Hasil validasi GPS: Tampilan hijau/merah dengan jarak meter, radius, dan akurasi GPS
- Badge status GPS: "Terkunci" (hijau) atau "Belum Diatur" (kuning) di header pengaturan
- Tombol "SIMPAN PENGATURAN GPS & WAKTU" (simpan ke tabel qr_settings di database)
- Pengaturan GPS & Waktu otomatis dimuat dari database saat halaman dibuka
- Koordinat GPS yang tersimpan ditampilkan di bawah header Daftar QR Code Kelas
- Tambah server action qrAbsensiActions.js (getQRSettings, saveQRSettings)
- Buat tabel baru qr_settings di Supabase (gps_latitude, gps_longitude, gps_radius, jam_masuk, jam_terlambat, jam_tutup)

Status: ACTIVE

---

## Fix NISN Tidak Ditemukan (Update)
- Perbaikan fungsi getSiswaByNISN di absensiActions.js
- Coba kolom nisn terlebih dahulu, jika tidak ditemukan fallback ke kolom nis (format lama)
- Input NISN di-trim sebelum query
- Standardisasi output: jika data hanya memiliki kolom nis, otomatis isi juga ke field nisn
- Dampak: Absen Sakit/Izin, Absen Hadir Mandiri, Portal Orang Tua, Cari Data Siswa — semuanya bisa membaca NISN dengan benar

Status: ACTIVE

---

## Absen Hadir Mandiri (Update)
Validasi GPS radius dari pengaturan QR Absensi (ambil dari tabel qr_settings)
Hitung jarak menggunakan rumus Haversine, bandingkan dengan radius yang ditentukan Admin
Tolak absensi jika jarak melebihi radius dengan pesan: "Jarak Anda X meter dari titik sekolah (batas radius Y meter)"
Batasan scan QR hanya 1x per hari per siswa (ce tabel absensi input_by='QR Mandiri' hari ini)
Jika siswa sudah scan QR hari ini, tampilkan pesan "Scan QR hanya bisa dilakukan 1x per hari"
Admin bebas dari validasi GPS (langsung simpan tanpa cek jarak)
Jika GPS tidak tersedia, validasi GPS dilewati (fallback, absensi tetap bisa dilakukan)

Status: ACTIVE

---

## QR Absensi — Tab Manajemen Siswa (Update)
Kartu statistik QR Absensi sekarang menampilkan data real dari database (bukan statik lokal)
Kartu "Hadir Hari Ini" menampilkan jumlah siswa yang scan QR dan status Hadir hari ini
Kartu "Belum Hadir" menampilkan total siswa aktif dikurangi hadir QR hari ini
Kartu "Terlambat" placeholder (belum ada logika terlambat di tabel absensi)
Kartu "QR Aktif" menampilkan jumlah QR yang statusnya aktif
Kartu "Total Scan" menampilkan total scan QR dari awal hingga hari ini
Tambah fungsi getQRStats di qrAbsensiActions.js (hitung hadirHadir & totalScan dari tabel absensi)
Grid QR Code Kelas: 2 kolom di tampilan HP (grid-cols-2), 3 kolom tablet, 4 kolom desktop

Status: ACTIVE

---

## Absensi Kehadiran — Sekretaris (Update)
Tombol H/S/I/A hanya mengubah tampilan lokal, TIDAK langsung menyimpan ke database
Tombol "Kirim & Kunci" baru menyimpan semua status ke database sekaligus, baru kemudian mengunci
Tombol "Simpan Perubahan" menyimpan dari tampilan lokal (untuk setelah Admin approve edit request)
Siswa yang sudah absen via Sakit/Izin Online atau QR Mandiri otomatis terkunci (tombol dikunci + ikon gembok)
Sekretaris hanya bisa klik H dan A (Sakit/Izin dikunci karena harus via halaman terpisah)
Admin bebas klik semua tombol tanpa batasan
Fix: tidak ada lagi duplikasi data saat sekretaris klik tombol berkali-kali sebelum simpan

Status: ACTIVE
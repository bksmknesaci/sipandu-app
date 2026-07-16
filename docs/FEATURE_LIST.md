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
- Hapus Siswa: Konfirmasi menggunakan modal popup modern — tampil nama & NISN siswa, ketik "HAPUS", loading spinner
- Hapus Semua Data: Konfirmasi menggunakan modal popup modern — daftar 5 dampak penghapusan (data siswa, absensi, pelanggaran, reward, formulir), ketik "HAPUS SEMUA", loading spinner

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
- Fix dropdown jurusan ganda: deduplikasi berbasis normalisasi string — "TKRO 1" dan "TKRO 1" (double space) dianggap sama, hanya tampil 1 di dropdown
- Fix filter kelas & jurusan: menggunakan perbandingan ternormalisasi (trim + collapse multiple spaces) agar data dengan whitespace berbeda tetap terfilter

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
- Fix filter Wali Kelas: Sekarang hanya menampilkan data siswa sesuai kelas binaannya (menggunakan getUserKelasInfo dari database, bukan parse u.kelas yang hanya mengambil tingkat)
- Filter tanggal: Date picker untuk memfilter pengajuan berdasarkan tanggal tertentu, tombol "Semua Tanggal" untuk reset
- Kartu statistik "Pengajuan Hari Ini": Selalu menampilkan total pengajuan hari ini dari seluruh data (tidak terpengaruh filter tanggal/status)
- Icon mata (Eye) di kolom Aksi: Modal detail lengkap siswa yang mengajukan (profil, jenis, tanggal, jam, alasan, foto bukti klik-zoom, koordinat GPS + akurasi + tombol Google Maps, catatan WK jika ditolak, timestamp verifikasi)
- Hapus otomatis riwayat pengajuan sakit/izin yang sudah lebih dari 30 hari (record + foto bukti di Storage) — tidak berpengaruh ke data Rekap Kehadiran karena sumber data terpisah
- Fix filter tanggal tidak menampilkan format dd/mm/yyyy di layar HP — tambahkan label tanggal terformat yang hanya muncul di layar kecil (sm:hidden)

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
- Wali Kelas: Bisa mengisi form penanganan siswa binaannya (Pendampingan BK, Tahap, SP, Catatan, Penggalian, Tindakan, Hasil) — bukan hanya read-only
- Wali Kelas: Filter otomatis hanya menampilkan siswa kelas binaannya (berdasarkan kolom users.kelas + users.jurusan dari database)
- Wali Kelas: Info Penanggung Jawab (Wali Kelas & Sekretaris) ditampilkan via PJInfoCard
- Wali Kelas: Tidak bisa mengubah Status Akhir (Pindah/Keluar) — hanya Administrator
- Wali Kelas: Tidak bisa menekan tombol Reset Semua Penanganan — hanya Administrator
- Dropdown Pendampingan BK otomatis set Tahap Penanganan: Belum Pendampingan→Belum Pembinaan, Pendampingan 1→Dalam Pembinaan, Pendampingan 2→SP1, Pendampingan 3→SP2, Pendampingan 4→SP3, Pendampingan Terakhir→Mutasi
- Dropdown Tahap Penanganan otomatis sinkronisasi checkbox SP1/SP2/SP3 saat dipilih
- Dropdown Status Akhir: Hanya opsi Aktif, Pindah, Keluar (opsi Mutasi dihapus)
- Badge STATUS SAAT INI: Pindah tampil badge hijau "Pindah", Keluar tampil badge merah "Keluar" (bukan "Mutasi")
- Halaman Penanganan Siswa untuk Wali Kelas diakses via /wali-kelas/penanganan (import komponen yang sama dengan Admin)
- Filter Status Penanganan (SP1/SP2/SP3): Menggunakan batch query (100 NISN per batch) agar data lengkap meski tanpa filter Tingkat
- Konfirmasi Reset Semua Penanganan menggunakan modal popup 2 langkah (bukan browser confirm): Step 1 peringatan detail apa yang dihapus + jumlah per kategori, Step 2 ketik "HAPUS SEMUA", loading state spinner, result sukses/gagal — hanya Administrator

Status: ACTIVE

---

## Menu Rekap Pindah & Keluar (Administrator)
- Halaman daftar siswa yang sudah tidak aktif karena pindah atau keluar sekolah
- Statistik Kartu (Total Pindah, Total Keluar, Total Tahun Ini, Total Semester Ini)
- Tabel Rekap (NISN, Nama, Kelas, Jurusan, L/P, Status, Tgl Keputusan, Alasan Pindah/Keluar, Dokumen, Aksi)
- Filter Dinamis (Status, Kelas, Jurusan, Pencarian)
- Export CSV & Cetak Data (Print Browser dengan format tabel rapi)
- Modal Detail Siswa (Profil, Alasan, Dokumen Pendukung, Total Pelanggaran/Reward)
- Hapus kolom Dokumen dari tabel utama (dokumen pendukung masih bisa diakses melalui modal detail siswa)

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
- Tombol Reset Semua Data Formulir menggunakan modal popup modern (bukan browser confirm) — peringatan detail 3 jenis formulir yang dihapus → ketik "HAPUS SEMUA", loading spinner, tombol disabled sampai teks cocok persis

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
- Pengelompokan berdasarkan gabungan kolom kelas + jurusan (bukan kelas saja) — sesuai format data terbaru
- Normalisasi whitespace otomatis saat grouping — data "TKRO 1" dan "TKRO 1" dikelompokkan ke baris yang sama
- Kartu Statistik (Total Kelas Aktif dari kombinasi kelas+jurusan, Total Wali, Total Sekretaris, Total PJ)
- Status badge 3 tingkat: Aktif (hijau), Tidak Aktif (abu), Belum Ada PJ (kuning)
- Tabel Data PJ dengan Badge WhatsApp (Oranye untuk Wali, Ungu untuk Sekretaris)
- Filter Pencarian Realtime (kelas, jurusan, nama wali, nama sekretaris)
- Empty state berbeda: "tidak cocok dengan pencarian" vs "belum ada data kelas"
- Sorting otomatis: X → XI → XII, lalu jurusan alfabet
- Modal Detail Penanggung Jawab
- Komponen PJInfoCard yang terintegrasi di Rekap Kehadiran & Penanganan Siswa
- getPJByClass() menggunakan query terpisah per kolom kelas & jurusan — bukan gabungan string lama

Status: ACTIVE

---

## Menu Hari Efektif (Setting)
- Halaman Manajemen Hari Efektif & Kalender Akademik (/setting/hari-efektif)
- Kartu Statistik (7 kartu: Hari Efektif, Nasional, Sekolah, Semester, Ujian, Kegiatan, Khusus) dengan warna berbeda per kategori
- 4 Tab Navigasi: Hari Libur Manual, Kalender Pendidikan, Preview Kalender, Riwayat Aktivitas
- Tab Libur: CRUD Hari Libur, Import/Export CSV dengan loading state, Tombol Hapus Semua Data
- Tab Libur: Filter dropdown lengkap 6 kategori (Nasional, Sekolah, Semester, Ujian, Kegiatan Sekolah, Khusus)
- Tab Libur: Badge kategori di tabel berwarna sesuai jenis (merah/kuning/ungu/biru/teal/abu)
- Tab Kalender: Setup Tahun Pelajaran, Semester, Tanggal, Hanya 1 Kalender Boleh Aktif
- Tab Preview: Tampilan Kalender per Bulan dengan navigasi bulan lalu/depan (ChevronLeft/Right)
- Tab Preview: Warna blok sesuai 6 kategori + highlight tanggal hari ini (ring biru)
- Tab Preview: Fix off-by-1 tanggal menggunakan toLocaleDateString('sv-SE') bukan toISOString()
- Tab Riwayat: Audit Trail aktivitas admin, otomatis terhapus saat klik "Hapus Semua Data"
- Otomatis Sabtu & Minggu dihitung sebagai hari non-efektif
- Import CSV: Batch insert (1 query untuk semua row) dengan fallback per-row, 1x cache invalidation, 1x log aktivitas
- Fix cache: invalidateCacheByPrefix digunakan di semua operasi write (sebelumnya invalidateCache yang tidak ada menyebabkan error)
- Fix perhitungan Hari Efektif: Sekarang mengecualikan Sabtu & Minggu (hanya Senin-Jumat) sehingga konsisten dengan Rekap Kehadiran — sebelumnya menghitung semua hari kalender minus libur termasuk weekend

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
- Fix matching Wali Kelas & Sekretaris: Gunakan getPJByClass dari penanggungJawabActions.js (sumber data sama dengan halaman Penanggung Jawab) agar 100% konsisten dan sinkron dengan database
- Hapus pesan di chat Pesan Wali Kelas (hanya pesan dari Orang Tua, dengan validasi sender_type, tombol muncul saat hover)
- Lonceng Notifikasi: Tombol lonceng di top nav dengan badge unread, Supabase Realtime subscription, polling fallback 15 detik
- Lonceng Notifikasi: Animasi shake berulang setiap 5 detik saat ada notif belum dibaca
- Lonceng Notifikasi: Notifikasi muncul saat Wali Kelas membalas pesan (judul "💬 Balasan dari Wali Kelas" + preview pesan)
- Lonceng Notifikasi: Click outside untuk menutup dropdown (mouse + touch)
- Lonceng Notifikasi: Notifikasi orang tua otomatis dihapus setelah 7 hari
- Auto-hapus pesan chat diubah dari 10 hari menjadi 7 hari
- Kalender Akademik: Navigasi bulan lalu/depan sekarang menampilkan hari libur yang benar  sebelumnya hanya fetch data libur bulan ini sehingga bulan lain kosong
- Kalender Akademik: Cache key disesuaikan agar otomatis ter-clear saat Admin menambah/edit/hapus hari libur di halaman Hari Efektif
- Fix Tahun Pelajaran & Semester kosong: Hapus cache yang menyimpan null lama, query langsung ke academic_calendar agar selalu sinkron dengan DB
- Tambahkan banner peringatan status non-aktif jika status siswa "Pindah" atau "Keluar" — muncul tepat di bawah Hero Header, sebelum Summary Cards
- Info PKL Otomatis: Siswa yang terdaftar sebagai siswa PKL menampilkan profil PKL (perusahaan, alamat, pembimbing, periode, jam kerja, hari kerja, link Google Maps) menggantikan sebagian tampilan kehadiran sekolah
- Info PKL Otomatis: Status kehadiran hari ini di Hero Header, kartu Kehadiran & Hari Ini di Summary Cards otomatis menampilkan data PKL (Hadir/Terlambat/Sakit/Izin/Alpha) jika siswa terdaftar PKL
- Info PKL Otomatis: Section "Status Hari Ini" kehadiran sekolah disembunyikan jika siswa PKL (sudah ditampilkan di PklInfoSection)
- Info PKL Otomatis: Statistik bulanan PKL (Hadir, Terlambat, Sakit, Izin, Alpha, Libur) dengan progress bar persentase kehadiran
- Info PKL Otomatis: Riwayat absensi PKL terakhir (20 record) dengan ikon status, jam masuk/pulang, keterangan terlambat, catatan sakit/izin

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
- Info PKL Otomatis: Siswa yang terdaftar sebagai siswa PKL menampilkan PklInfoSection (profil PKL, status hari ini, statistik bulanan, riwayat absensi) menggantikan section kehadiran sekolah
- Info PKL Otomatis: 4 kartu stat kehadiran sekolah (Hadir/Sakit/Izin/Alpha) diganti 6 kartu stat PKL (Hadir/Terlambat/Sakit/Izin/Alpha/Libur) dengan gradient warna berbeda
- Info PKL Otomatis: Section Status Kehadiran Hari Ini, Statistik Kehadiran (donut chart), dan Riwayat Absensi sekolah disembunyikan jika siswa PKL

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
- Pengguna Aktif (Admin Dashboard): Tabel daftar user yang sedang login secara real-time, menampilkan avatar inisial dengan gradient warna, nama user, badge peran (Administrator/Wali Kelas/Sekretaris/OSIS) dengan ikon, waktu login, dan durasi aktif
- Pengguna Aktif: Auto-refresh setiap 15 detik, indikator online hijau berdenyut, session otomatis dihapus setelah 2 menit tidak ada heartbeat
- Pengguna Aktif: Heartbeat dikirim setiap 45 detik dari AppShell, session dihapus saat logout atau navigasi keluar
- Pengguna Aktif: Empty state saat tidak ada user aktif, loading state dengan spinner, error state dengan tombol coba lagi

Status: ACTIVE

---

## Notifikasi
- Komponen NotificationCenter (Dropdown di Header, Bell icon + badge unread)
- Komponen DashboardNotifications (Widget 5 notifikasi terbaru di Dashboard)
- Halaman Pusat Notifikasi (/notifikasi) dengan filter lengkap
- Tab Status: Semua, Belum Dibaca, Sudah Dibaca, Penting, Sistem
- Tab Waktu: Semua Waktu, Hari Ini, 7 Hari
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
- Halaman Mobile Siswa: 7 menu (Portal Orang Tua, Absen Sakit/Izin, Cari Data Siswa, Absen Mandiri, Absensi PKL, Siswa Berprestasi, Seputar Sekolah)
- Halaman Mobile Sekretaris: 1 menu (Absensi Kehadiran)
- Halaman Mobile OSIS: 2 menu (Entri Reward, Entri Pelanggaran)
- Halaman Mobile Wali Kelas: 7 menu (Entri Reward, Entri Pelanggaran, Rekap Pelanggaran, Rekap Sakit & Izin, Rekap Kehadiran, Rekap Kehadiran PKL, Penanganan Siswa)
- Halaman Mobile Admin: 12 menu (Daftar Siswa, Penanganan Siswa, Rekap Reward, Rekap Formulir, Rekap Pindah/Keluar, Manajemen User, Profil SIPANDU, Penanggung Jawab, Hari Efektif, QR Absensi, Konfigurasi WhatsApp, Pos Berita)
- Desain kartu menu full gradient warna dengan ikon putih transparan
- Animasi hover: kartu naik (translate-y-2), bayangan membesar (shadow-2xl), dekorasi lingkaran pojok mengembang (scale 1.5x/1.8x)
- Ikon kartu berwarna putih transparan (bg-white/20) dengan animasi bounce naik-turun (2 detik per siklus, 100ms stagger per kartu)
- Dekorasi lingkaran putih transparan di pojok kanan bawah setiap kartu
- Teks judul putih, deskripsi putih transparan (white/65)
- Gradient dan shadow menggunakan inline style (bukan class Tailwind dinamis) untuk menghindari masalah JIT purge
- Header gradient 3 warna dengan dekorasi lingkaran, emoji, tombol kembali
- Akses control: halaman menampilkan "Akses Ditolak" jika role tidak sesuai
- Tap feedback: active:scale-95 pada setiap kartu
- Tombol navigasi bawah hanya muncul sesuai role (Sekretaris/OSIS/Wali/Admin)
- Fix link "Rekap Kehadiran" di halaman Mobile Wali Kelas: dari /wali-kelas/rekap-kehadiran menjadi /rekap-kehadiran (sesuai lokasi file sebenarnya)

Status: ACTIVE

---

## Rekap Kehadiran (Update — 2026-07-10)
- Tab Bulanan: Header "BULAN" diganti menjadi nama bulan aktual sesuai dateFilter (contoh: "Juli", "Agustus")
- Tab Bulanan: Kolom "E" diganti menjadi "Hari Efektif" (tampil 2 baris: "Hari" + "Efektif")
- Tab Bulanan: Kolom L/P garis kiri kembali muncul (semua kolom pakai border-b border-r secara konsisten)
- Tab Bulanan, Semester, Tahunan: Header tabel berwarna abu-abu (`bg-gray-100`, border `border-gray-300`) agar kontras dengan baris data
- Tab Bulanan, Semester, Tahunan: Kolom No, Nama Siswa, L/P hanya dibekukan sticky di desktop (`md:sticky`), di HP bebas digeser left-right
- Tab Harian: Kolom L/P, Kelas, Jurusan, Status, Waktu, Sumber beserta isinya dirata tengah (`text-center`)
- Tab Bulanan: Section "Siswa Kritis — Alpha > 3 Kali" dipulihkan di bawah tabel bulanan
- Siswa Kritis: Data dihitung via `useMemo` dengan logika inline (tidak memanggil fungsi eksternal `isHoliday`/`getEffectiveDaysInquiry` untuk menghindari masalah dependency)
- Siswa Kritis: Banner merah gradient dengan ikon pulse
- Siswa Kritis: 5 kartu statistik (Siswa Kritis, Alpha Tertinggi, Rata-rata, Sangat Kritis ≥10, Donut Rasio Kritis)
- Siswa Kritis: Legend severity 3 tingkat (Sangat Kritis/Kritis/Perlu Perhatian) dengan jumlah per tingkat
- Siswa Kritis: Horizontal bar chart Top 10 siswa alpha tertinggi dengan gradient warna berbeda per level (merah tua/merah/oranye muda)
- Siswa Kritis: Tabel detail lengkap dengan badge severity, baris berwarna merah untuk sangat kritis
- Siswa Kritis: Jika tidak ada siswa alpha > 3, tampil pesan hijau "Tidak Ada Siswa Kritis Bulan Ini" sebagai indikator visual
- Tab Bulanan: Blok warna hari libur mengikuti kategori dari Halaman Hari Efektif — Nasional (rose/merah muda), Sekolah (amber/kuning), Semester (violet/ungu), Ujian (blue/biru), Kegiatan Sekolah (teal/hijau), Khusus (gray/abu). Sabtu & Minggu tetap merah pekat
- Tab Bulanan: Header tabel tanggal libur menggunakan warna gelap sesuai kategori, sel data menggunakan warna terang sesuai kategori
- Tab Bulanan: Legenda hari libur ditampilkan di bawah tabel — kotak warna sesuai kategori + tanggal + nama libur dari database + baris Sabtu & Minggu
- Tab Bulanan: Auto-sync data hari libur saat admin edit di Halaman Hari Efektif — menggunakan usePathname listener + polling 15 detik untuk menangani cache server di lingkungan serverless (Vercel)
- Export PDF Tab Bulanan: Warna blok hari libur di header dan sel data mengikuti kategori (sama dengan tampilan aplikasi)
- Export PDF Tab Bulanan: Legenda hari libur ditambahkan di bawah tabel PDF — kotak warna + tanggal + nama libur
- Reset Semester: Konfirmasi menggunakan modal popup modern (bukan browser confirm) — Step 1 peringatan detail (kelas, semester, tahun ajaran) → Step 2 ketik "RESET SEMESTER", loading spinner, tombol disabled sampai teks cocok persis
- Reset Semua (Tahunan): Konfirmasi menggunakan modal popup modern — Step 1 peringatan detail (kelas, semester 1 & 2, tahun ajaran) → Step 2 ketik "RESET TAHUNAN", loading spinner, tombol disabled sampai teks cocok persis

Status: ACTIVE

---

## Absen Sakit & Izin (Update)
- Fix layout tombol Cari di HP (flex-col di mobile, flex-row di SM ke atas) agar tidak tertutup tabel
- Fix referensi kolom .nis menjadi .nisn saat cek duplikasi pengajuan dan kirim data (sinkron dengan perbaikan getSiswaByNISN)
- Siswa yang terdaftar sebagai PKL (status Berjalan) ditolak saat input NISN — tampil kartu peringatan kuning dengan informasi siswa sedang PKL
- Tombol langsung menuju halaman Absensi PKL (/absensi-pkl) pada kartu peringatan
- Tombol "Cari NISN lain" untuk menginput ulang tanpa reload halaman
- Server action checkStudentPKLStatus: cek pkl_profiles dengan status Berjalan berdasarkan student_id

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
- Tombol "Cetak PDF" di header Daftar QR Code Kelas — mencetak semua QR dalam format kartu 2 per baris kertas A4
- Format PDF: header "ABSEN ONLINE SIPANDU", subtitle "> Tata Cara Absen Hadir <", 7 langkah tata cara, QR Code 130px, nama kelas, nama sekolah
- Nama sekolah diambil dinamis dari app_settings (otomatis ikut berubah jika admin edit profil sekolah)
- Otomatis generate QR yang belum ada sebelum cetak
- Server action getSchoolName: ambil nama_sekolah dari tabel app_settings

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
- Validasi GPS radius dari pengaturan QR Absensi (ambil dari tabel qr_settings)
- Hitung jarak menggunakan rumus Haversine, bandingkan dengan radius yang ditentukan Admin
- Tolak absensi jika jarak melebihi radius dengan pesan: "Jarak Anda X meter dari titik sekolah (batas radius Y meter)"
- Batasan scan QR hanya 1x per hari per siswa (ce tabel absensi input_by='QR Mandiri' hari ini)
- Jika siswa sudah scan QR hari ini, tampilkan pesan "Scan QR hanya bisa dilakukan 1x per hari"
- Admin bebas dari validasi GPS (langsung simpan tanpa cek jarak)
Jika GPS tidak tersedia, validasi GPS dilewati (fallback, absensi tetap bisa dilakukan)

Status: ACTIVE

---

## QR Absensi — Tab Manajemen Siswa (Update)
- Kartu statistik QR Absensi sekarang menampilkan data real dari database (bukan statik lokal)
- Kartu "Hadir Hari Ini" menampilkan jumlah siswa yang scan QR dan status Hadir hari ini
- Kartu "Belum Hadir" menampilkan total siswa aktif dikurangi hadir QR hari ini
- Kartu "Terlambat" placeholder (belum ada logika terlambat di tabel absensi)
- Kartu "QR Aktif" menampilkan jumlah QR yang statusnya aktif
- Kartu "Total Scan" menampilkan total scan QR dari awal hingga hari ini
- Tambah fungsi getQRStats di qrAbsensiActions.js (hitung hadirHadir & totalScan dari tabel absensi)
- Grid QR Code Kelas: 2 kolom di tampilan HP (grid-cols-2), 3 kolom tablet, 4 kolom desktop

Status: ACTIVE

---

## Absensi Kehadiran — Sekretaris (Update)
- Tombol H/S/I/A hanya mengubah tampilan lokal, TIDAK langsung menyimpan ke database
- Tombol "Kirim & Kunci" baru menyimpan semua status ke database sekaligus, baru kemudian mengunci
- Tombol "Simpan Perubahan" menyimpan dari tampilan lokal (untuk setelah Admin approve edit request)
- Siswa yang sudah absen via Sakit/Izin Online atau QR Mandiri otomatis terkunci (tombol dikunci + ikon gembok)
- Sekretaris hanya bisa klik H dan A (Sakit/Izin dikunci karena harus via halaman terpisah)
- Admin bebas klik semua tombol tanpa batasan waktu
- Filter tanggal khusus Administrator: date picker untuk mengisi/edit absensi hari lampau
- Admin: banner kuning "Mode Edit Absensi Hari Lampau" saat tanggal != hari ini
- Admin: tombol "Hari Ini" untuk reset ke tanggal sekarang
- Admin: tidak ada batasan tanggal maksimal masa depan (max={today})
- Status submitted otomatis reset saat Admin ganti tanggal
- Fix: tidak ada lagi duplikasi data saat sekretaris klik tombol berkali-kali sebelum simpan
- Sekretaris: Setelah klik "Kirim & Kunci Absensi", jika ada siswa Alpha maka modal konfirmasi WhatsApp otomatis terbuka — cukup 1x klik untuk kirim absen + finalisasi WA
- Sekretaris: Tombol "Minta Persetujuan Edit" baru muncul setelah seluruh alur kirim absensi selesai (termasuk modal WA ditutup/dilewati)
- Modal WhatsApp: Tombol "Batal" diganti "Lewati" agar Sekretaris bisa melewati pengiriman WA tanpa membatalkan
- Modal WhatsApp: Tambahkan empty state saat tidak ada siswa Alpha yang memiliki nomor WA valid

Status: ACTIVE

---

## Rekap Kehadiran (Update)
- Fix filter Jurusan & Kelas: Dropdown dinamis dari database (bukan hardcode manual)
- Dropdown jurusan otomatis menyesuaikan berdasarkan tingkat yang dipilih
- Hanya menampilkan jurusan yang benar-benar ada di database
- Menggunakan getKelasFilters() dengan kelasJurusanList (kombinasi kelas + jurusan dari tabel siswa)

Status: ACTIVE

---

## Rekap Sakit & Izin (Update)
- Fix filter Jurusan: Dropdown dinamis dari database (bukan hardcode 12 opsi manual)
- Dropdown jurusan otomatis menyesuaikan berdasarkan tingkat yang dipilih
- Menggunakan getKelasFilters() sama seperti Rekap Kehadiran
- Hapus foto otomatis di Rekap Sakit & Izin dalam waktu lebih dari 1 hari

Status: ACTIVE

---

## Menu Rekap Pelanggaran (Update)
- Tambah filter Tingkat (dropdown dinamis dari database)
- Tambah filter Jurusan (otomatis sesuai tingkat yang dipilih)
- Tambah kolom pencarian (cari nama, NISN, atau kelas)
- Kartu statistik dihitung ulang dari data terfilter (bukan data mentah)
- Badge counter saat filter aktif ("12 dari 45 siswa")
- Pesan empty state berbeda antara "belum ada data" vs "tidak cocok dengan filter"
- Tombol Print PDF Per Tingkat Semua Jurusan (dikelompokkan per jurusan, dengan status disiplin)
- Tombol Hapus Semua Rekap (2x konfirmasi: confirm + ketik "HAPUS SEMUA") — khusus Administrator
- Tombol Reset Filter (muncul hanya saat filter aktif)
- Tombol Refresh Data di header tabel
- Optimalisasi: Stats dihitung langsung dari data tabel tanpa query terpisah (hemat 1 DB round-trip)
- Wali Kelas: dropdown Tingkat & Jurusan disabled, hanya data kelas binaan, tombol Hapus Semua tersembunyi
- Konfirmasi Hapus Semua menggunakan modal popup 2 langkah (bukan browser prompt): Step 1 peringatan detail jumlah siswa & poin, Step 2 ketik "HAPUS SEMUA", loading state spinner, result sukses/gagal

Status: ACTIVE

## Entri Reward (Update)
- Menghapus fitur "Upload Bukti (Opsional)" di halaman Entri Reward

Status: ACTIVE

## Absensi Kehadiran (Update)
- Fix filter Jurusan: Dropdown dinamis dari database (bukan hardcode 12 opsi manual)
- Dropdown jurusan otomatis menyesuaikan berdasarkan tingkat yang dipilih
- Menggunakan getKelasFilters() sama seperti Rekap Kehadiran

Status: ACTIVE

## Beranda (Update)
- Tiga Besar Peraih Poin Reward Tertinggi: Grid 2 kolom di tampilan HP, 3 kolom desktop, kartu ke-3 centered di HP
- Rekapitulasi Jumlah Siswa: Grid 2 kolom di tampilan HP untuk class cards dan donut charts, item ke-3 centered di HP

Status: ACTIVE

## Absen Hadir Mandiri (Update)
- Validasi GPS gagal: Tampilan layar penuh merah (bukan toast kecil) dengan ikon XCircle, info jarak siswa vs batas radius, selisih melebihi berapa meter, badge "Di Luar Jangkauan Radius", dan tombol "Scan Ulang QR Code"
- Validasi GPS proses: Tampilan spinner biru "QR Terbaca! Sedang Memvalidasi GPS..." saat menunggu hasil cek lokasi
- Tombol "Scan Ulang" mereset state tanpa perlu input NISN ulang

Status: ACTIVE

## Manajemen Data Siswa (Update)
- Fix import XCircle dari lucide-react (sebelumnya menyebabkan Runtime ReferenceError di halaman QR Absensi saat validasi GPS)

Status: ACTIVE

## Entri Reward (Update)
- Fix nama Wali Kelas tidak muncul pada profil siswa setelah pencarian
- Menggunakan getPJByClass dari penanggungJawabActions.js untuk mengambil nama Wali Kelas yang sinkron dengan database

Status: ACTIVE

## Absen Hadir Mandiri (Update)
- Validasi GPS gagal (di luar radius): Tampilan layar penuh merah dengan ikon XCircle putih di lingkaran merah, judul "Absensi Ditolak!", pesan "Lokasi Anda DI LUAR radius", detail jarak dengan 1 desimal, selisih melebihi radius, badge "QR Tidak Terverifikasi", tombol "Coba Lagi"
- Validasi GPS gagal (tidak bisa diakses): Tampilan layar penuh dengan ikon AlertTriangle, pesan "Gagal Mendapatkan Lokasi!", badge "GPS Tidak Tersedia", tombol "Coba Lagi"
- Validasi GPS menjadi WAJIB ketika pengaturan GPS sudah diatur — tidak ada lagi silent skip yang menyebabkan absensi tetap masuk walau di luar radius
- Spinner biru "QR Terbaca! Sedang Memvalidasi Lokasi GPS..." saat proses cek lokasi
Console log di setiap tahap validasi GPS untuk memudahkan debugging

Status: ACTIVE

## Rekap Reward (Update)
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

Status: ACTIVE

## Setting KOP Surat (Profil SIPANDU)
- Section "Setting KOP Surat (Print PDF)" di halaman Profil SIPANDU
- Upload Logo Dinas Pendidikan ke Supabase Storage (bucket: assets)
- Upload Logo Sekolah ke Supabase Storage (bucket: assets)
- Preview KOP Surat langsung di halaman profil (layout 3 kolom: logo dinas — teks kop — logo sekolah)
- Indikator status: "✓ Sudah tersimpan" (hijau) atau "⚠ Klik Simpan untuk menyimpan" (kuning)
- Logo disimpan di kolom kop_logo_dinas dan kop_logo_sekolah di tabel app_settings
- Nama sekolah dan alamat di kop surat otomatis mengikuti data Informasi Sekolah
Fallback placeholder teks "LOGO DINAS" / "LOGO SEKOLAH" jika belum diupload

Status: ACTIVE

## KOP Surat Dinamis di Print PDF
- Helper kopSuratHelper.js: konversi logo URL → base64 agar 100% muncul di window print
- Server action getKopSuratSettings() fetch data kop dari database
- Integrasi KOP Surat di Print PDF Rekap Kehadiran (tab Semester)
- Integrasi KOP Surat di Print PDF Rekap Reward
- Integrasi KOP Surat di Print PDF Rekap Pelanggaran (Per Tingkat Semua Jurusan)
- Integrasi KOP Surat di Cetak Rekap Pindah & Keluar
- Integrasi KOP Surat di Cetak Rekap Formulir (Tracer Studi / Pemetaan Karir / SNBP-SNBT)
- Semua logo menggunakan base64 embed (tidak bergantung pada file static public/)

Status: ACTIVE

---

## Notifikasi Lonceng (Perbaikan)
- Getaran lonceng otomatis saat ada notif baru masuk (dari Supabase Realtime)
- Badge angka kecil nempel di lonceng menampilkan jumlah unread
- Animasi shake berulang setiap 20 detik selama ada notif belum dibaca
- Tab filter: Semua, Belum Dibaca, Penting, Sistem
- Tombol Tandai Semua Dibaca & Hapus Semua
- Tombol aksi per notifikasi (navigasi ke halaman terkait)
- Footer "Lihat Semua Notifikasi →" ke halaman pusat notifikasi
- Popup konfirmasi revisi absensi untuk Admin: klik notif "Permintaan Revisi Baru" → muncul popup detail (kelas, tanggal, alasan) dengan tombol Setujui/Tolak, bukan redirect ke halaman Absensi
- Popup konfirmasi revisi absensi juga berfungsi di halaman Pusat Notifikasi (/notifikasi) — konsisten dengan tombol lonceng
- Setelah Admin setujui → notif ke Sekretaris "✅ Revisi Absensi Disetujui" dengan action ke /absensi
- Setelah Admin tolak → notif ke Sekretaris "❌ Revisi Absensi Ditolak"
- Polling fallback 15 detik di NotificationCenter — notif tetap muncul meski WebSocket Supabase gagal connect
- Tambah server action getEditRequestDetails() untuk fetch detail permintaan revisi di popup
- Fix dropdown mobile: Scroll di dalam panel tidak lagi menutup dropdown — sebelumnya scroll event menutup panel sehingga tombol "Lihat Semua Notifikasi" tidak bisa dicapai
- Auto-hapus notifikasi diubah dari 30 hari menjadi 7 hari

Status: ACTIVE
- Fix shake interval dari 4000ms menjadi 5000ms (tidak terlalu sering)
- WebSocket subscribe ditambahkan error callback — error "Failed to fetch" tidak lagi muncul sebagai uncaught di console

---

## Alur Notifikasi Aktif

### Sekretaris → Admin → Sekretaris
- Sekretaris kirim absensi → klik "Minta Persetujuan Edit" → **Admin muncul notif** "📝 Permintaan Revisi Absensi Baru"
- Admin klik Approve → **Sekretaris muncul notif** "✅ Revisi Absensi Disetujui" dengan tombol ke halaman Absensi
- Admin klik Reject → **Sekretaris muncul notif** "❌ Revisi Absensi Ditolak" dengan tombol ke halaman Absensi
- Sekretaris juga muncul konfirmasi "📨 Permintaan Revisi Terkirim" setelah klik kirim permintaan

### Siswa → Wali Kelas
- Siswa submit Sakit → **WK muncul notif** "🤒 Pengajuan Sakit Baru" dengan tombol "Verifikasi"
- Siswa submit Izin → **WK muncul notif** "📋 Pengajuan Izin Baru" dengan tombol "Verifikasi"
- Orang Tua kirim pesan → **WK muncul notif** "💬 Pesan Baru dari Orang Tua" dengan tombol "Balas"

### Pencarian User ID untuk Notifikasi
- Fungsi getWaliKelasUserId: 4 strategi fallback (gabungan "X TKRO", pisah tingkat+jurusan, jurusan saja, full kelas ILIKE)
- Fungsi getSekretarisUserId: 4 strategi fallback (sama)
- Mencocokkan format kelas antara tabel siswa ("X") dan tabel users ("X TKRO 1")
- Fungsi getAdminUserIds: ambil semua user aktif berrole Administrator

Status: ACTIVE

## Entri Reward (Update — 2026-07-03)
- Fix pencarian siswa untuk role Wali Kelas: Filter otomatis berdasarkan kelas binaan (ekstrak tingkat + jurusan dari userData.kelas)
- Format parsing: "XI TKRO 1" → kelas="XI", jurusan="TKRO 1" (menggunakan slice join agar cocok dengan format kolom jurusan di tabel siswa)
- Prioritas ambil kelas dari database (tabel users) jika userId tersedia, fallback ke userData.kelas dari localStorage

Status: ACTIVE

## Entri Pelanggaran (Update)
- Menghapus fitur "Bukti Pelanggaran (Wajib Foto)" di halaman Entri Pelanggaran
- Fix nama Wali Kelas tidak muncul pada profil siswa setelah pencarian
- Menggunakan getPJByClass dari penanggungJawabActions.js untuk mengambil nama Wali Kelas yang sinkron dengan database
- Fix pencarian siswa untuk role Wali Kelas: Filter otomatis berdasarkan kelas binaan (sama logikanya dengan Entri Reward)
- Format parsing: "XI TKRO 1" → kelas="XI", jurusan="TKRO 1"
- Prioritas ambil kelas dari database (tabel users) jika userId tersedia, fallback ke userData.kelas dari localStorage
- Fix key prop duplikat pada dropdown Jenis Pelanggaran (item Sedang & Berat memiliki key "undefined" akibat properti "name"instead of "nama")
- Fix dropdown Jenis Pelanggaran kosong untuk kategori Sedang dan item "Tawuran" hilang dari kategori Berat — akar masalah 4 item di kategoriPelanggaran menggunakan key "name" bukan "nama"

Status: ACTIVE

## Rekap Kehadiran (Update — 2026-07-03)
- Tombol "Reset Semester" hanya ditampilkan untuk role Administrator
- Tombol "Reset Semua (Tahunan)" hanya ditampilkan untuk role Administrator
- Role Wali Kelas dan role lainnya tidak melihat kedua tombol reset tersebut

Status: ACTIVE

## Dashboard Admin (Update — 2026-07-03)
- Stat card "Total Reward" dan "Total Pelanggaran" sekarang menampilkan total POIN (SUM dari tb_reward_siswa dan tb_pelanggaran_siswa), bukan jumlah entri (COUNT)
- Label stat card diubah menjadi "Total Poin Reward" dan "Total Poin Pelanggaran" agar jelas
- Tabel Top 10 Siswa Berprestasi: tambah info kelas dan jurusan di bawah nama siswa
- Tabel Top 10 Pelanggaran Tertinggi: tambah kolom "Kelas" untuk menunjukkan asal kelas siswa
- Query dioptimasi: hapus 2 query count terpisah, hitung total langsung dari data utama

Status: ACTIVE

## Beranda Home (Update — 2026-07-03)
- Grafik Rekap Reward Terbaik sekarang menggunakan data real dari tb_reward_siswa (bukan mockup)
- Grafik Rekap Pelanggaran Tertinggi sekarang menggunakan data real dari tb_pelanggaran_siswa (bukan mockup)
- Data grafik dikelompokkan per kelas+jurusan dengan sum poin, diurutkan dari tertinggi
- Tambah server action getHomeRewardChart() di rewardActions.js
- Tambah server action getHomePelanggaranChart() di pelanggaranActions.js
- Hapus data mockup hardcoded (allRewardData, allPelanggaranData) dari page.js
- Grafik otomatis sinkron dengan setiap entri reward/pelanggaran baru

Status: ACTIVE

## ## Menu Rekap Formulir (Update)
- Tab Tracer: tambah 3 tombol per baris — ✅ Publikasikan/Sembunyikan, ⭐ Jadikan Pilihan/Lepas, 📌 Sematkan di Atas
- Tambah Kisah Inspiratif Alumni di halaman HOME (Beranda)
- Tambah Halaman daftar semua kisah alumni dengan search, filter (tahun/jurusan/status/kota), pagination, modal detail

Status: ACTIVE

## Menu Formulir (Siswa & Alumni)
- Ganti menu "Informasi" menjadi "Formulir" di Header (AppShell)
- Halaman Pusat Formulir (3 Kartu Pilihan dengan gradient & hover animasi)
- Form Tracer Studi Lulusan (Dinamis berdasarkan status: Kuliah, Bekerja, Wirausaha)
- Form Pemetaan Karir (Multi-select minat karir)
- Form Pendataan SNBP & SNBT (Upload bukti PDF/JPG/PNG)
- Pilihan Status Saat Ini: 9 opsi (Kuliah, Bekerja, Wirausaha, Kuliah dan Bekerja, Kursus/Pelatihan, Mencari Kerja, TNI/Polri, Gap Year, Lainnya)
- Upload file bukti ke Supabase Storage (Bucket: bukti-formulir)
- Halaman sukses setelah submit formulir

Status: ACTIVE

## Kisah Inspiratif Alumni (Beranda HOME)
- Carousel otomatis (8 detik) menampilkan testimoni alumni yang dipublikasikan
- Avatar lingkaran inisial (gradient warna via inline style) di samping kiri nama alumni
- Navigasi panah kiri/kanan (desktop) dan dot indicator
- Tombol "Baca Selengkapnya" untuk testimoni panjang (>300 karakter)
- Modal detail alumni (tanpa framer-motion, pakai CSS @keyframes)
- Stats mini cards: menampilkan semua 9 status alumni (Kuliah, Bekerja, Wirausaha, Kuliah dan Bekerja, Kursus/Pelatihan, Mencari Kerja, TNI/Polri, Gap Year, Lainnya)
- CTA Banner "Jadilah Alumni Inspiratif Berikutnya" ke halaman /alumni
- Data dari server action getPublishedAlumni() & getAlumniStats()

Status: ACTIVE

## Halaman Semua Kisah Alumni (/alumni)
- Header gradient biru-ungu dengan ikon GraduationCap
- Pencarian real-time (nama, NISN, kata kunci)
- Filter dropdown dinamis dari database: Tahun Lulus, Jurusan, Status (9 opsi), Kota
- Grid kartu 2 kolom di HP, 3 kolom di desktop
- Avatar lingkaran inisial (gradient warna via inline style) di tengah atas kartu
- Status badge warna per jenis (9 variasi)
- Info instansi, lokasi, dan preview testimoni (desktop only)
- Modal detail alumni (tanpa framer-motion, pakai CSS @keyframes)
- Pagination dengan nomor halaman
- Empty state berbeda untuk "belum ada data" vs "tidak cocok filter"
- Data dari server action getAllAlumni() dengan filter & pagination server-side

Status: ACTIVE

--- 

## Login Admin Hardcoded (Update — 2026-07-06)
- Fix kritis: Login admin/admin123 sekarang menggunakan server action getAdminLoginData() (supabaseAdmin, bypass RLS) bukan client supabase yang diblokir RLS
- Sebelumnya: adminData.id selalu null karena query client diblokir RLS → notif tidak pernah muncul di lonceng Admin
- Sesudah: adminData.id = users.id dari database (contoh: 1) → notif cocok dan muncul
- Safety net di AppShell: otomatis memperbaiki admin ID yang null di localStorage dari session lama
- Tambah server action getAdminLoginData() dan resolveAdminUserId() di userActions.js

Status: ACTIVE

## Absensi Kehadiran — Penguncian & Hak Edit Sekretaris (Update — 2026-07-06)
- Data dari Sakit/Izin Online, QR Mandiri, Sistem Otomatis, dan Administrator langsung tersimpan dengan locked: false (tidak dikunci sebelum Sekretaris klik "Kirim & Kunci")
- Sekretaris hanya bisa mengedit status Hadir dan Alpha — tombol Sakit & Izin terkunci (harus via halaman terpisah)
- Record dari inputan siswa online/QR/Sistem/Admin dikunci total untuk Sekretaris (gembok + tooltip "Dikunci: Input via ...")
- Badge "SCAN QR" dan "ONLINE" di kolom Keterangan tetap ditampilkan dan tidak berubah menjadi "Sekretaris Kelas" setelah Sekretaris kirim absensi
- Setelah Admin setujui revisi dan Sekretaris klik "Simpan Perubahan" → data langsung terkunci otomatis (1x edit saja)
- isAbsensiSubmitted() diperbaiki: sekarang WAJIB cek jumlah record == total siswa, mencegah false "submitted" saat hanya sebagian siswa yang ada datanya

Status: ACTIVE

## Rekap Kehadiran (Update — 2026-07-06)
- Tab Semester & Tahunan: siswa yang belum absen di hari efektif yang sudah lewat sekarang otomatis tercatat Alpha (sinkron dengan logika tab Bulanan & Harian)
- Tambah fungsi getCountsWithAlpha() yang menghitung Alpha implisit: hari efektif lewat tanpa record = Alpha
- Tab Bulanan: tambah garis horizontal dan vertikal pada tabel agar pembatas antar kolom terlihat jelas
- Tab Semester & Tahunan: tambah garis horizontal dan vertikal pada tabel
- Sebelumnya: tab Semester/Tahunan menampilkan 0 Alpha untuk siswa yang tidak ada record sama sekali

Status: ACTIVE

## Konfigurasi WhatsApp (Fonnte API)
- Halaman Konfigurasi WhatsApp (/setting/konfigurasi-whatsapp)
- 3 Tab: Konfigurasi API, Pengaturan Pengiriman, Riwayat Pengiriman
- Tab Konfigurasi API:
- Input Fonnte API Token (disimpan terenkripsi di server, tidak ditampilkan lengkap di frontend)
- Input Device ID (opsional)
- Input Nama Pengirim
- Pilih Mode Testing/Production
- Tombol "🔗 Uji Koneksi" dengan pesan error detail dari Fonnte (HTTP status, alasan gagal, timeout)
- Card Status Integrasi (Terhubung/Belum Terhubung, info gateway phone, device name, last sync)
- Tab Pengaturan Pengiriman:
- Switch "Kirim otomatis ke Orang Tua siswa Alpha" (aktif default)
- Switch "Kirim otomatis ke Orang Tidak Terlambat" (disiapkan untuk pengembangan selanjutnya)
- Switch "Kirim otomatis ke Orang Tua siswa Pulang sebelum waktunya" (disiapkan untuk pengembangan selanjutnya)
- Tab Riwayat Pengiriman:
- Tabel riwayat lengkap (tanggal, nama siswa, kelas, no WA, status, pesan error, aksi)
- Filter status (Semua/Berhasil/Gagal/Menunggu), pencarian nama/nomor
- Pagination
- Tombol "🔄 Kirim Ulang" untuk log yang gagal
- Tombol "Hapus Semua Riwayat" dengan konfirmasi ketik "HAPUS SEMUA" (2x konfirmasi)
- Server action whatsappActions.js: getWhatsAppConfig, saveWhatsAppConfig, testWhatsAppConnection, getAlphaStudentsForWA, executeSendWA, getWhatsAppLogs, retryWhatsAppLog, deleteAllWALogs, getWhatsAppTodayStats
- Keamanan: API Token disimpan di server via supabaseAdmin, tidak pernah dikirim ke frontend secara utuh (masking ●●●●●)

Status: ACTIVE

## Konfigurasi WhatsApp (Update)
- Fix tabs navigasi melebihi layar HP — tambahkan overflow-x-auto dan whitespace-nowrap
- Fix filter bar Riwayat Pengiriman melebihi garis layar HP — layout flex-col di HP, flex-row di SM ke atas
- Fix tombol "Hapus Semua Riwayat" terlalu panjang di HP — teks dipendekkan menjadi "Hapus" di layar kecil

Status: ACTIVE

## Kolom No WA Orang Tua di Daftar Siswa
- Tambah kolom "No WA Oru" di tabel Daftar Siswa (posisi setelah Jurusan, sebelum Status)
- Badge hijau dengan ikon 📱 untuk siswa yang sudah punya nomor
- Validasi nomor sebelum disimpan (format internasional Indonesia: 08xxx → 628xxx, 10-15 digit)
- Normalisasi otomatis saat simpan (trim, hapus spasi berlebih, 08→62)
- Field input di modal Tambah/Edit Siswa dengan placeholder dan petunjuk format
- Kolom termasuk di pencarian (cari by nomor WA)

Status: ACTIVE

## Import CSV Siswa (Update)
- Template Import diperbarui: kolom "No WA Ortu" ditambahkan di index 6 (setelah Jurusan, sebelum Status)
- Status berpindah ke index 7
- Nomor WA otomatis dinormalisasi saat import (08xxx → 628xxx)

Status: ACTIVE

## Export CSV & Cetak Siswa (Update)
- Kolom "No WA Ortu" ditambahkan di export CSV (setelah Jurusan, sebelum Status)
- Kolom "No WA Ortu" ditambahkan di cetak/print browser (setelah Jurusan, sebelum Status)

Status: ACTIVE

## Absensi Kehadiran - Finalisasi & Kirim WhatsApp
- Tombol "✅ Finalisasi & Kirim WA" muncul di halaman Absensi Kehadiran (hanya untuk Administrator, hanya jika ada siswa Alpha)
- Alur: Admin isi absensi → Simpan Semua → Klik "Finalisasi & Kirim WA"
- Modal konfirmasi 3 step:
- Konfirmasi: Ringkasan (kelas, tanggal, total alpha, punya WA, tidak punya WA)
- Sending: Spinner animasi + progress info
- Result: Summary cards (Berhasil/Gagal/Total) + detail per siswa
- Sistem mencari siswa Alpha yang memiliki parent_whatsapp valid dari tabel siswa
- Template pesan profesional (Assalamu'alaikum, nama siswa, kelas, tanggal, status, nama sekolah, SIPANDU)
- Log pengiriman dicatat di tabel whatsapp_logs (termasuk yang gagal)
- Siswa tanpa No WA tetap ditampilkan di daftar yang tidak akan menerima WA
- Tombol hanya muncul jika stats.alpha > 0

Status: ACTIVE

## Dashboard Admin - Widget WhatsApp Hari Ini
- Widget kecil 3 kartu di Dashboard Admin (setelah baris Operasional, sebelum Charts)
- Kartu: WA Terkirim (hijau), WA Gagal (merah), WA Menunggu (kuning)
- Data diambil dari tabel whatsapp_logs yang terjadi hari ini
- Angka menggunakan komponen CountUp animasi

Status: ACTIVE

## Modul Absensi PKL (Siswa)
- Halaman Absensi PKL (/absensi-pkl) — standalone page tanpa AppShell
- Login menggunakan NISN (pencarian di tabel siswa, fallback kolom nis)
- Profil PKL: Informasi perusahaan (nama, alamat, pembimbing industri)
- Profil PKL: Tanggal mulai dan selesai PKL dengan auto-update status (Belum Mulai → Berjalan → Selesai)
- Profil PKL: Pengaturan jam kerja (jam masuk, jam pulang)
- Profil PKL: Pengaturan hari kerja (pilih hari rutin: Senin-Minggu)
- Profil PKL: Lokasi PKL via GPS (titik koordinat, akurasi)
- Profil PKL: Radius absensi dikunci permanen 50 meter (tidak dapat diubah siswa)
- Tombol Atur Ulang Profil PKL — hanya muncul jika profil sudah tersimpan
- Validasi GPS: Ambil lokasi otomatis, hitung jarak Haversine, bandingkan dengan radius 50m
- Validasi GPS: Status terverifikasi (hijau) atau di luar area (merah) dengan detail jarak
- Validasi waktu: Absen masuk dibuka 60 menit sebelum jam kerja, ditutup 180 menit setelah
- Validasi waktu: Absen pulang dibuka 60 menit sebelum jam pulang, ditutup 120 menit setelah
- Toleransi keterlambatan: 15 menit dari jam masuk
- Jenis absensi: Hadir (dengan GPS + selfie), Sakit (selfie + koordinat + alasan), Izin (selfie + koordinat + alasan)
- Foto selfie wajib dari kamera langsung (tidak boleh galeri), kompresi otomatis
- Koordinat GPS Sakit/Izin: Direkam tanpa validasi radius (berbeda dengan Hadir yang harus dalam radius PKL)
- Status otomatis: Hadir, Terlambat (>15 menit), Sakit, Izin, Alpha (tidak absen di hari kerja), Libur (hari non-kerja)
- Alur Hadir: Pilih Jenis → Validasi GPS → Ambil Foto → Kirim
- Alur Sakit/Izin: Pilih Jenis → Ambil Koordinat → Ambil Foto → Isi Alasan → Kirim
- Alur Checkout: Sudah masuk → Validasi GPS → Ambil Foto → Kirim Pulang
- Duplikasi dicegah: 1x absen masuk per hari, 1x absen pulang per hari, 1x sakit/izin per hari
- Status PKL non-aktif menampilkan informasi tanpa tombol absensi

Status: ACTIVE

## Modul Rekap Kehadiran PKL (Wali Kelas & Administrator)
- Halaman Rekap Kehadiran PKL (/wali-kelas/rekap-pkl)
- Dashboard Ringkas: 7 stat card (Peserta PKL, Hadir, Sakit, Izin, Alpha, Terlambat, % Kehadiran) dengan CountUp animation
- Diagram Donut: Distribusi kehadiran (6 status dengan warna berbeda + legend)
- Tab Harian: Kolom No, NISN, Nama, L/P, Kelas, Jurusan, Perusahaan, Jam Masuk, Jam Pulang, Status, Terlambat, Aksi
- Tab Bulanan: Kalender kehadiran per tanggal dengan kode H/S/I/A/T/L, sticky kolom Nama+L/P+Kelas+Jurusan+Perusahaan
- Tab Semester: Rekap jumlah H/S/I/A/T/L, Total Kerja, Persentase Kehadiran
- Tab Bulanan: Hari libur ditandai background merah pekat dengan huruf L
- Tab Bulanan & Semester: Tidak ada kolom Hari Efektif (berbeda dengan Rekap Kehadiran reguler)
- Status Alpha dihitung otomatis untuk hari kerja tanpa record absensi
- Status Libur dihitung otomatis berdasarkan work_days di pkl_profiles (bukan effective_days)
- Filter: Perusahaan, Tingkat, Jurusan, Status PKL
- Filter dinamis: Tingkat dan Jurusan diambil dari database
- Detail absensi: Modal popup dengan foto selfie masuk/pulang, koordinat GPS, alamat, jam, alasan
- Export CSV: Tersedia untuk ketiga tab (Harian, Bulanan, Semester)
- Export PDF: Tersedia untuk ketiga tab dengan auto-print
- Reset Semua Data: 2x konfirmasi (konfirmasi + ketik "HAPUS SEMUA"), hapus semua profil + absensi + foto storage
- Auto cleanup: Foto selfie yang sudah > 1 hari otomatis dihapus dari storage saat halaman dibuka
- Kolom L/P tersedia di semua tab (Harian, Bulanan, Semester)
- Kolom Kelas dan Jurusan tersedia di semua tab
- Fix stats card Sakit/Izin selalu nol: Case sensitivity bug — database menyimpan "Sakit" tapi stats object menggunakan key "sakit" (lowercase)
- Solusi: Normalisasi key ke lowercase sebelum increment: stats[a.status?.toLowerCase()]
- Kolom L/P, Kelas, Jurusan tersedia di semua tab (Harian, Bulanan, Semester) dan di Export CSV/PDF
- Tampilan nama Wali Kelas dan nama Sekretaris di halaman via komponen PJInfoCard (sama seperti di Rekap Kehadiran reguler)
- PJInfoCard hanya muncul ketika filter tingkat dan jurusan sudah dipilih
- Export PDF: Kop surat dinamis dengan logo dinas dan logo sekolah (menggunakan generateKopSuratHTML dari kopSuratHelper)
- Export PDF: Judul uppercase, subtitle mencantumkan tab/periode, kelas, perusahaan, dan tanggal cetak
- Export PDF: Tab Bulanan otomatis menggunakan layout landscape (@page{size:landscape})
- Tombol "Reset Semua" disembunyikan untuk role Wali Kelas, hanya muncul untuk Administrator
- Import baru: getKopSuratSettings, generateKopSuratHTML, PJInfoCard

Status: ACTIVE

## Fix Filter Sekretaris Absensi (Update)
- Fix filter kelas Sekretaris hanya menampilkan tingkat (contoh: "XII") tanpa jurusan
- Akar masalah: userData.kelas dari localStorage hanya berisi tingkat, bukan gabungan kelas+jurusan
- Tambah server action getUserKelasInfo(userId): ambil kolom kelas dan jurusan terpisah dari tabel users
- Prioritas ambil data kelas dari database, fallback ke parse userData.kelas dari localStorage
- Tambah state sekretarisFullKelas untuk menyimpan string kelas lengkap dari DB
- Fix canEdit: bandingkan selectedKelas dengan sekretarisFullKelas (bukan userData.kelas)
- File diubah: app/actions/absensiActions.js, app/absensi/page.js

Status: ACTIVE

## Fix Filter Sekretaris & Wali Kelas (Update)
- Penyebab: Kolom kelas di tabel users hanya berisi tingkat (contoh: "XII"), bukan gabungan kelas+jurusan
- Akibat: Filter hanya memfilter tingkat tanpa jurusan, sehingga semua kelas XII muncul untuk WK XII RPL 2
- Tambah server action getUserKelasInfo(userId): ambil kolom kelas dan jurusan terpisah dari tabel users
- Prioritas ambil data dari database, fallback ke parse userData.kelas dari localStorage
- Absensi: state sekretarisFullKelas menyimpan string kelas lengkap dari DB, canEdit membandingkan dengan nilai ini
- Rekap Kehadiran PKL (Wali Kelas): Auto-filter dari userData.kelas + userData.jurusan saat halaman dibuka
- Rekap Kehadiran PKL (Wali Kelas): Dropdown Tingkat & Jurusan di-disabled, muncul badge "Kelas Binaan: XII RPL 2"
- Rekap Kehadiran PKL (Wali Kelas): Tombol Reset filter disembunyikan, tab tidak reset saat auto-filter
- File diubah: app/actions/absensiActions.js, app/absensi/page.js, app/wali-kelas/rekap-pkl/page.js

Status: ACTIVE

## Modul Absensi PKL (Update)
- Fix kamera tidak bisa dibuka: Elemen
- Fix tombol Cari terpotong di HP: Tambah min-w-0 pada input, shrink-0 pada button, sembunyi teks "Cari" di layar kecil
- Tambah info jadwal absensi di step GPS Hadir: Jam Masuk (buka/tutup), Jam Pulang (buka/tutup), Toleransi Terlambat 15 menit
- Tambah helper formatMinToTime() untuk menghindari ekspresi inline kompleks di JSX yang menyebabkan VS Code error
- Tambah kolom Guru Pembimbing di profil PKL (input, pre-fill edit, simpan ke database)
- Tambah kolom Pembimbing Industri & Guru Pembimbing di Rekap PKL (Harian, Bulanan sticky, Semester)
- Koordinat GPS di detail modal Rekap PKL menjadi link Google Maps (klik langsung buka lokasi)
- Export CSV & PDF: Tambah kolom Pembimbing Industri dan Guru Pembimbing di ketiga tab
- Fix console error "uncontrolled to controlled input": Tambah guru_pembimbing di deklarasi state awal

Status: ACTIVE

---

## Optimasi Performa Server
- Singleton Supabase Client: `lib/supabase-admin.js` dan `lib/supabase.js` menggunakan 1 instance per serverless warm instance — mengurangi 50-70% koneksi DB baru
- In-Memory Cache (`lib/cacheHelpers.js`): Menyimpan data semi-static agar tidak query ulang setiap request, dengan deduplikasi request paralel yang identik
- Database Helper (`lib/dbOptimize.js`): fastCount (hitung row tanpa fetch data), fetchPaginated, parallelQueries, safeParallel
- Cache data semi-static: Kelas filters (5 menit), Effective days per bulan (10 menit), Penanggung Jawab (5 menit), Academic calendar aktif (10 menit), PKL filters (5 menit)
- Query paralel di semua Dashboard: Admin (2 batch → 1 batch), Wali Kelas (6 sequential → 1 Promise.all), Sekretaris (2 query digabung menjadi 1), OSIS (2 blok digabung menjadi 1)
- Query paralel di Absensi: Upload foto + cari siswa berjalan bersamaan (submitSakitIzin)
- Query paralel di PKL: Upload selfie + cek existing record berjalan bersamaan (checkIn, checkOut, sakitIzin)
- Hapus query duplikat di Portal Orang Tua: effectiveRes dan calendarRes yang identical dijadikan 1 query

Status: ACTIVE

---

## Cache & Performance Optimization
- In-Memory Cache (`lib/cacheHelpers.js`): Menyimpan data semi-static di memory serverless instance dengan TTL per key, deduplikasi request paralel identik, invalidate by key/prefix
- Database Helper (`lib/dbOptimize.js`): fastCount (hitung row tanpa fetch data), fetchPaginated (count+data 1 query), parallelQueries, safeParallel (toleransi error parsial)
- Cache Penanggung Jawab: PJ stats (5 menit), PJ by class per kelas+jurusan combo (5 menit), derived full list (5 menit)
- Cache Hari Efektif: Stats (10 menit), holidays per bulan (10 menit), invalidate otomatis saat ada penambahan/penghapusan/edit kalender
- Cache QR Absensi: Pengaturan GPS & Waktu (5 menit), invalidate saat ada perubahan
- Cache KOP Surat: Logo dinas & sekolah (30 menit) — digunakan bersama oleh Rekap Kehadiran, Rekap Reward, Rekap Pelanggaran, Rekap Pindah & Keluar, Rekap Formulir
- Cache Notifikasi: Admin user IDs (10 menit), Wali Kelas ID per kelas (5 menit), Sekretaris ID per kelas (5 menit)
- Throttle deleteOldNotifications: Dari setiap 15 detik menjadi max 1x per 5 menit
- Invalidate otomatis: Setiap operasi write (save, delete, reset) secara otomatis meng-invalidate cache terkait agar data selalu konsisten
- Singleton Supabase Client: lib/supabase-admin.js dan lib/supabase.js menggunakan 1 instance per warm instance — mengurangi 50-70% koneksi DB baru

Status: ACTIVE

--- 

## Rekap Kehadiran PKL (Update)
- Fix filter Wali Kelas: Siswa kelas lain tidak lagi muncul — filter menggunakan exact match (===) bukan substring match (.includes()), sehingga kelas "XI" tidak lagi mencocokkan "XII"
- Tab Bulanan: Tampilan disamakan dengan Rekap Kehadiran reguler — header 2 baris (Nama Bulan + Tanggal/Hari), kolom No, kolom Hari Efektif (dihitung dari work_days per siswa), kolom Total H/S/I/A/T, kolom % Hadir
- Tab Bulanan: Sticky kolom No/Nama/L/P hanya aktif di desktop (md:sticky), di HP bebas digeser
- Tab Bulanan: Border konsisten menggunakan border-r border-b pada setiap sel
- Tab Bulanan: Hari libur background merah pekat dengan teks putih
- Realtime Alpha: Status Alpha hanya dihitung sampai hari ini (isPastOrToday), tanggal masa depan yang belum terjadi tidak langsung di-mark Alpha
- Realtime Alpha: Hari Efektif hanya menghitung hari kerja sampai hari ini, sehingga Total Alpha tidak pernah melebihi Hari Efektif
- Fix double-counting: Angka status di kolom Total tab bulanan akurat (sebelumnya terhitung 2x karena increment di loop pre-calculation DAN di JSX render)
- Export CSV/PDF tab bulanan: Kolom Hari Efektif dan % Hadir sudah termasuk
- Tab Semester: Alpha juga menggunakan batasan realtime (hanya sampai hari ini)
- Tab Harian: Modal detail absensi sekarang menampilkan Profil PKL siswa — card gradient biru muda berisi: perusahaan, alamat PKL, pembimbing industri, guru pembimbing, periode PKL, jam kerja, hari kerja, koordinat lokasi (klik untuk buka Google Maps), radius, status PKL
- getPklAttendanceDetail: Tambah query ke tabel pkl_profiles berdasarkan student_id, return sebagai pklProfile di dalam detail

Status: ACTIVE

## Absensi PKL (Update — 2026-07-19)
- Tombol Hadir dipecah menjadi 2 tombol terpisah: "Absen Masuk" (gradient emerald-teal, ikon LogIn) dan "Absen Pulang" (gradient blue-indigo, ikon LogOut)
- Masing-masing tombol punya flow terpisah: GPS Validasi → Camera Selfie → Submit → Result
- Tombol otomatis berubah jadi "✅ Sudah Absen Masuk/Pulang (jam)" berwarna solid setelah berhasil
- Badge "Terlambat" muncul otomatis di tombol masuk jika melebihi toleransi 15 menit
- Pesan disabled menjelaskan alasan spesifik di bawah setiap tombol (belum masuk, di luar jadwal, sudah absen, dll)
- Tabel "Jadwal Absensi Hari Ini" ditampilkan sebelum tombol aksi, berisi: jam masuk, jendela buka absen masuk, jam pulang, jendela buka absen pulang, toleransi terlambat, hari kerja
- Dot indikator hijau/abu di samping jendela absen menunjukkan apakah sedang aktif
- Jam saat ini realtime WIB ditampilkan di bawah tabel jadwal
- Banner kuning peringatan jika hari ini bukan hari kerja
- NISN yang belum terdaftar otomatis membuat data siswa minimal (hanya NISN) dan mengarahkan ke halaman setup profil PKL
- Form Data Siswa (Nama, Tingkat dropdown, Jurusan, L/P) tampil hanya untuk siswa yang baru terdaftar
- Setup profil disarankan dilakukan di tempat PKL agar koordinat lokasi akurat, dengan banner informasi dan label "Radius: 50 meter (otomatis)"
- Setelah simpan profil, data siswa otomatis terupdate dan halaman langsung menampilkan absensi
- Profil PKL ditampilkan prominent di depan halaman absensi (card gradient biru muda) berisi: perusahaan, alamat, pembimbing industri, guru pembimbing, periode PKL, jam kerja, hari kerja, koordinat GPS + radius
- Popup panduan tata cara absensi PKL muncul sebelum input NISN (5 langkah + info penting)
- Popup memiliki tombol "Ya, Mengerti" dan checkbox "Jangan Tampilkan Lagi" (disimpan di localStorage)
- Auto-hapus foto selfie PKL yang sudah > 1 hari: loop sampai semua record terproses, hapus file dari Storage bucket pkl-selfies, set kolom URL jadi null
- pklActions.js: Tambah fungsi getPklStudentData (gabungkan siswa + profil + attendance hari ini dalam 1 panggilan)
- pklActions.js: Perbaiki cleanupOldPklSelfies menggunakan loop while(hasMore) bukan sekali limit 200
- pklActions.js: Fix bug ReferenceError s is not defined di getPklRekapSemester — seharusnya a.student_id bukan s.student_id
- pklActions.js: savePklProfile otomatis update data siswa jika field student_nama/student_kelas/student_jurusan/student_jenis_kelamin dikirim

Status: ACTIVE

## Absen Sakit & Izin (Update — 2026-07-26)
- Lokasi GPS untuk Sakit/Izin sekarang **wajib** diambil — sebelumnya bertanda "Opsional", sekarang jika gagal siswa harus coba lagi

Status: ACTIVE

---

## Absensi PKL (Update — 2026-07-26)
- Tombol Absen Masuk, Pulang, Sakit, Izin sekarang bisa membuka kamera — fix bug `<video>` element belum ter-render saat `startCamera()` dipanggil, diganti `useEffect` yang menunggu render sebelum memulai stream
- Halaman lokasi Izin menggunakan warna **biru** (sebelumnya kuning, sama dengan Sakit) agar konsisten dengan warna teks Izin
- Tombol **Simpan Profil PKL dikunci** sebelum siswa klik "Ambil Lokasi GPS" — mencegah siswa menyimpan profil tanpa koordinat, sehingga absensi masuk/pulang di luar radius akan ditolak sistem
- Popup Panduan: Poin 2 ditambahkan keterangan **Mode Fleksibel** pada kotak kuning Hari Kerja — "Pilih hari rutin, atau aktifkan 'Fleksibel' jika jadwal PKL tidak menentu (kadang 2x, 4x, atau libur seminggu)"

Status: ACTIVE

---

## Rekap Kehadiran PKL (Update — 2026-07-26)
- Checkbox "Sembunyikan Selesai" sekarang berfungsi — fix bug `getCompletedPklStudentIds` memfilter kelas/jurusan di tabel `pkl_profiles` yang tidak memiliki kolom tersebut, diganti join ke tabel `siswa`
- Badge ceklis (✓) untuk siswa status Selesai sekarang muncul di kolom Status tab Harian
- Tombol "Hapus Data Selesai" sekarang muncul saat checkbox centang + ada data Selesai
- Modal Hapus Data Selesai menggunakan z-index z-[60] agar tidak tertutup modal detail (z-50)
- Dependency useEffect selesai dihapus early return yang mencegah fetch saat filter belum lengkap

Status: ACTIVE

## PWA & Social Preview
- PWA Manifest: Logo SIPANDU muncul di Home Screen HP saat "Add to Home Screen" (standalone mode, theme_color biru)
- Open Graph Meta Tags: Logo SIPANDU muncul sebagai preview gambar saat link dibagikan ke WhatsApp, Telegram, Facebook
- Twitter Card Meta Tags: Logo SIPANDU muncul saat link dibagikan ke platform X/Twitter
- metadataBase: URL dasar dinamis dari NEXT_PUBLIC_BASE_URL agar OG image selalu URL lengkap
- Viewport: theme_color biru (#2563eb), max-scale 1 untuk mencegah zoom tidak disengaja di HP

Status: ACTIVE

## PWA & Social Preview (Update)
- OG Image menggunakan file landscape khusus (og-image.png, 1200x630px) — rasio standar universal yang dijamin tampil di WhatsApp, Telegram, Facebook, Twitter, LINE
- Logo SIPANDU (logo-sipandu.png) tetap digunakan untuk icon browser dan PWA home screen
- Twitter Card juga menggunakan og-image.png

Status: ACTIVE

## Rekap Kehadiran PKL (Update)
- Modal Detail Absensi: Tampil foto selfie absen masuk dan absen pulang (klik untuk zoom fullscreen)
- Modal Detail Absensi: Placeholder informatif jika foto sudah otomatis dihapus (> 1 hari)
- Modal Detail Absensi: Semua text menggunakan warna eksplisit (text-gray-800/600/500) — tidak ada lagi text putih yang tidak terbaca di HP
- Modal Detail Absensi: Info siswa menggunakan path Supabase join yang benar (detailData.siswa?.nama, bukan detailData.student_nama)
- Fix halaman 404 blank: File terpotong di tengah JSX — tab Bulanan dan Semester ditulis ulang lengkap

Status: ACTIVE
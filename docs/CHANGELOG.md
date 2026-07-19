# Changelog SIPANDU

## 2026-07-28 (Perbaikan Auto-Alpha Hanya Hari Efektif)
- rekapActions.js: Auto-Alpha sistem otomatis sekarang mengecek hari efektif sebelum menyisipkan Alpha — hari libur dan weekend tidak diberi Alpha
- rekapActions.js: Auto-cleanup Alpha di hari libur — setiap halaman Rekap Kehadiran dibuka setelah jam 14:00, sistem menghapus record Alpha (input_by='Sistem Otomatis') yang salah sisipkan di hari libur
- rekapActions.js: Tambah import getHolidays dari effectiveDaysActions dan fungsi helper isEffectiveDay untuk cek weekend + hari libur
- File diubah: app/actions/rekapActions.js

## 2026-07-28 (Perbaikan Import Data Siswa & Statistik)
- Import CSV diganti Import Excel: Menggunakan library xlsx untuk parse file .xlsx/.xls/.csv — tidak lagi terpotong oleh masalah delimiter koma
- Import Excel: Modal popup modern dengan info format kolom, area klik pilih file, loading state
- Import Excel: Tombol Download Template Excel — generate file .xlsx otomatis dengan contoh 3 baris data dan lebar kolom sesuai
- Hapus tombol Export CSV — fungsi handleExportCSV dan import CSV dihapus, cukup gunakan Cetak Data
- Kartu statistik dinamis: Menggunakan useMemo agar Total Siswa, Total Kelas, Total Rombel, Aktif, Non Aktif otomatis berubah saat filter kelas/jurusan/status/search diterapkan
- Total Jurusan diganti Total Rombel: Menghitung gabungan unik kelas + jurusan (contoh filter X → "X TKR 1", "X TKR 2", dst) bukan jurusan saja
- Total Kelas: Menghitung jumlah tingkat unik (X, XI, XII) dari data terfilter
- File diubah: app/admin/siswa/page.js

## 2026-07-27 (Fix OG Image WhatsApp — Final)
- Ganti OG image dari PNG (1.35MB, rasio 1:1) ke JPEG (<300KB, rasio 1.91:1 landscape 1200x630) — WhatsApp menolak gambar OG yang terlalu besar dan berupa persegi
- Rename file dari og.image.png menjadi og-image.jpg (nama file sebelumnya salah, menggunakan titik bukan strip)
- layout.tsx: openGraph images dan twitter images merujuk ke /og-image.jpg
- layout.tsx: Twitter card diganti dari "summary" menjadi "summary_large_image" agar gambar tampil besar
- next.config.ts: Fix headers() yang sebelumnya berada di luar objek config sehingga tidak dieksekusi — sekarang berada di dalam objek nextConfig
- next.config.ts: Tambah headers Cache-Control dan CORS untuk /og-image.jpg
- File baru: public/og-image.jpg
- File dihapus: public/og.image.png
- File diubah: app/layout.tsx, next.config.ts

## 2026-07-27 (Fix OG Image WhatsApp & Rekap PKL)
- OG Image: Ganti dari logo-sipandu.png (rasio 1:1, 627x632) ke og-image.png (rasio landscape 1.91:1, 1200x630) — WhatsApp sering menolak menampilkan gambar persegi di link preview
- layout.tsx: openGraph images dan twitter images sekarang merujuk ke /og-image.png
- File baru: public/og-image.png
- File diubah: app/layout.tsx

## 2026-07-27 (Perbaikan Rekap Kehadiran PKL)
- Fix 404 blank page: File page.js terpotong di tengah JSX (tab Bulanan tidak lengkap, closing tag hilang) — ditulis ulang lengkap
- Modal Detail: Tambah foto selfie absen masuk (selfie_url) dan absen pulang (check_out_selfie_url) — klik untuk zoom fullscreen
- Modal Detail: Placeholder informatif jika foto sudah dihapus otomatis (> 1 hari) atau belum absen pulang
- Modal Detail: Fix text putih tidak terbaca di HP — semua text sekarang menggunakan warna eksplisit (text-gray-800/600/500)
- Modal Detail: Fix info siswa null — gunakan path Supabase join yang benar (detailData.siswa?.nama) bukan flat field (detailData.student_nama)
- File diubah: app/wali-kelas/rekap-pkl/page.js

## 2026-07-27 (PWA Manifest & Social Preview)
- Tambah file public/manifest.json — konfigurasi PWA (nama, icon, theme_color, standalone display) agar logo muncul di Home Screen HP
- layout.tsx: Tambah metadataBase dari NEXT_PUBLIC_BASE_URL — mengubah path relatif OG image menjadi URL lengkap
- layout.tsx: Tambah openGraph meta tags (og:title, og:description, og:image, og:url, og:siteName, og:locale, og:type) — logo muncul saat link dibagikan ke WhatsApp
- layout.tsx: Tambah twitter card meta tags (twitter:card, twitter:title, twitter:description, twitter:images) — logo muncul saat link dibagikan ke X/Twitter
- layout.tsx: Tambah manifest link dan apple-touch-icon — mendukung Add to Home Screen di iOS dan Android
- layout.tsx: Tambah viewport export (themeColor, width, initialScale, maximumScale) — warna status bar HP dan cegah zoom tidak disengaja
- .env.local: Tambah NEXT_PUBLIC_BASE_URL — URL dasar untuk metadataBase (wajib agar OG image berfungsi di WhatsApp)
- File baru: public/manifest.json
- File diubah: app/layout.tsx, .env.local

## 2026-07-26 (Perbaikan Absensi PKL & Rekap PKL)
- Absensi PKL: Fix tombol Buka Kamera tidak berfungsi — `startCamera()` mengakses `videoRef.current` sebelum `<video>` element ter-render di DOM, diganti `useEffect` yang menunggu render lalu memulai stream via `cameraRequestedRef`
- Absensi PKL: Halaman lokasi Izin menggunakan warna biru (bg-blue-50, border-blue-200, from-blue-500) konsisten dengan warna teks "Izin"
- Absensi PKL: Lokasi GPS untuk Sakit/Izin sekarang wajib diambil — sebelumnya bertanda "Opsional", jika gagal siswa harus coba lagi
- Absensi PKL: Tombol "Simpan Profil PKL" dikunci (disabled) sebelum siswa klik "Ambil Lokasi GPS" — mencegah profil tanpa koordinat
- Absensi PKL: Popup Panduan poin 2 ditambahkan keterangan Mode Fleksibel pada kotak kuning Hari Kerja
- Absensi PKL: Tampilan Jadwal Absensi dikembalikan persis asli — info box biru dengan icon Clock/Calendar/Timer, grid 2 kolom, jendela waktu dengan dot indikator (hijau/biru berdenyut saat aktif), peringatan terlambat kuning
- Rekap Kehadiran PKL: Fix badge ✓ hilang untuk siswa Selesai — akar masalah `getCompletedPklStudentIds` memfilter kelas/jurusan di tabel `pkl_profiles` yang tidak punya kolom tersebut, diganti join ke tabel `siswa`
- Rekap Kehadiran PKL: Checkbox "Sembunyikan Selesai" sekarang berfungsi — hapus early return `if (!filters.kelas)` yang mencegah fetch
- Rekap Kehadiran PKL: Tombol "Hapus Data Selesai" sekarang muncul saat checkbox centang + ada data Selesai
- Rekap Kehadiran PKL: Modal Hapus Data Selesai menggunakan z-index z-[60] agar tidak tertutup modal detail
- File diubah: app/absensi-pkl/page.js, app/actions/pklActions.js, app/wali-kelas/rekap-pkl/page.js

## 2026-07-25 (Perbaikan Konfirmasi Hapus Daftar Siswa)
- Daftar Siswa: Ganti confirm() browser bawaan dengan modal popup modern untuk Hapus Siswa per-baris — tampil nama & NISN siswa di card merah, ketik "HAPUS", tombol disabled sampai teks cocok persis
- Daftar Siswa: Ganti confirm() 2x bertumpuk dengan modal popup modern untuk Hapus Semua Data — daftar 5 dampak penghapusan (data siswa, absensi, pelanggaran, reward, formulir), ketik "HAPUS SEMUA", tombol disabled sampai teks cocok persis
- Daftar Siswa: Loading spinner "Menghapus..." pada tombol eksekusi hapus
Daftar Siswa: Modal hapus menggunakan z-index z-[60] agar tidak tertutup modal tambah/edit (z-50)
- File diubah: app/admin/siswa/page.js

## 2026-07-24 (Perbaikan UI Header HP)
- AppShell: Perbaiki logo di header terlalu besar di layar HP — ukuran logo disamakan dengan logo di sidebar (h-10 w-10 rounded-xl)
- AppShell: Header HP lebih ramping (py-3, ikon hamburger size-22) tanpa terlalu tipis
- File diubah: app/components/AppShell.js

## 2026-07-23 (Perbaikan Konfirmasi Reset)
- Rekap Kehadiran: Ganti confirm() browser bawaan dengan modal popup modern untuk Reset Semester — Step 1 peringatan detail (kelas, semester, tahun ajaran) → Step 2 ketik "RESET SEMESTER", tombol disabled sampai teks cocok persis
- Rekap Kehadiran: Ganti confirm() browser bawaan dengan modal popup modern untuk Reset Semua (Tahunan) — Step 1 peringatan detail (kelas, semester 1 & 2) → Step 2 ketik "RESET TAHUNAN", tombol disabled sampai teks cocok persis
- Rekap Kehadiran: Modal reset menggunakan z-index z-[60] agar tidak tertutup modal detail siswa (z-50)
- Rekap Kehadiran: Loading spinner "Menghapus..." pada tombol eksekusi reset
- Rekap Formulir: Ganti confirm() browser bawaan dengan modal popup modern untuk Reset Semua Data Formulir — peringatan detail 3 jenis formulir (Tracer Studi, Pemetaan Karir, SNBP/SNBT) → ketik "HAPUS SEMUA", tombol disabled sampai teks cocok persis
- Rekap Formulir: Loading spinner "Menghapus..." pada tombol eksekusi reset
- File diubah: app/rekap-kehadiran/page.js, app/admin/rekap-formulir/page.js

## 2026-07-22 (Perbaikan Multi-Halaman)
- Entri Pelanggaran: Fix key prop duplikat pada dropdown Jenis Pelanggaran — 4 item di kategoriPelanggaran menggunakan properti "name" bukan "nama" menyebabkan key="undefined" dan item tidak tampil
- Entri Pelanggaran: Fix dropdown Jenis Pelanggaran kosong untuk kategori Sedang (3 item: Bolos Sekolah, Bolos Pelajaran, Mencoret Seragam)
- Entri Pelanggaran: Fix item "Tawuran" hilang dari dropdown kategori Berat
- Rekap Sakit & Izin: Fix filter tanggal tidak menampilkan format dd/mm/yyyy di layar HP — tambahkan label tanggal terformat (sm:hidden) di samping input date
- Konfigurasi WhatsApp: Fix tabs navigasi (Konfigurasi API / Pengaturan Pengiriman / Riwayat Pengiriman) melebihi garis layar HP — tambahkan overflow-x-auto wrapper + whitespace-nowrap per tombol
- Konfigurasi WhatsApp: Fix filter bar Riwayat Pengiriman melebihi garis layar HP — ubah layout menjadi flex-col di HP, flex-row di SM ke atas, search bar full width di baris pertama
- Konfigurasi WhatsApp: Fix tombol "Hapus Semua Riwayat" terlalu panjang di HP — teks dipendekkan menjadi "Hapus" di layar kecil (sm:hidden)
- Absen Sakit & Izin: Siswa PKL ditolak — cek pkl_profiles status Berjalan setelah NISN ditemukan, tampil kartu peringatan kuning dengan tombol langsung ke /absensi-pkl
- Absen Sakit & Izin: Kartu peringatan PKL menampilkan ikon Briefcase, nama siswa, penjelasan, tombol "Menuju Absensi PKL" gradient oranye, dan link "Cari NISN lain"
- absensiActions.js: Tambah fungsi checkStudentPKLStatus — query pkl_profiles berdasarkan student_id dengan status Berjalan
- QR Absensi: Tombol "Cetak PDF" gradient ungu di header Daftar QR Code Kelas, di samping tombol "Generate Semua"
- QR Absensi: Format PDF — 2 kartu per baris kertas A4, border hitam tebal, header "ABSEN ONLINE SIPANDU", subtitle "> Tata Cara Absen Hadir <", 7 langkah tata cara (kamera, lokasi GPS, validasi, 1x/hari, hadir, terlambat, ditolak), QR Code 130px, nama kelas dinamis, nama sekolah dari app_settings
- QR Absensi: Otomatis generate QR yang belum ada sebelum cetak (tunggu 600ms untuk render canvas)
- QR Absensi: Nama sekolah di PDF dinamis dari database — jika admin ganti nama sekolah di Profil SIPANDU, cetak PDF berikutnya otomatis mengikuti
- qrAbsensiActions.js: Tambah fungsi getSchoolName — ambil nama_sekolah dari tabel app_settings
- File diubah: app/actions/pelanggaranActions.js, app/components/EntriPelanggaran.js, app/wali-kelas/rekap-sakit-izin/page.js, app/setting/konfigurasi-whatsapp/page.js, app/actions/absensiActions.js, app/absen-sakit-izin/page.js, app/actions/qrAbsensiActions.js, app/setting/qr-absensi/page.js

## 2026-07-21 (Perbaikan Rekap Kehadiran PKL)
| Elemen | Keterangan |
|--------|-------------|
| Input pencarian | Di filter bar, cari berdasarkan nama atau NISN, real-time |
| Checkbox "Sembunyikan Selesai" | Di tab harian, centang untuk menyembunyikan siswa PKL Selesai dari daftar |
| Tombol "Hapus Data Selesai" | Muncul saat checkbox centang + ada data Selesai, Admin only, konfirmasi → hapus profil + absensi PKL permanen |
| Server action `getCompletedPklStudentIds` | Ambil student_id dari pkl_profiles yang status = 'Selesai', mendukung filter |
| Server action `deleteCompletedPklInvalid` | Hapus attendance (batch 100) + hapus profiles, invalidate cache |
| Filter bekerja di semua tab | Search filter di semua tab, checkbox hanya di tab harian |
| Sebelum | Sesudah |
|--------|---------|
| `confirm()` browser bawaan | Modal popup 2 langkah dengan desain modern |
| 1 klik langsung hapus | Step 1: Peringatan detail (jumlah siswa) → Step 2: Ketik "HAPUS SELESAI" |
| Tidak ada visual feedback | Loading spinner "Menghapus data..." saat proses |
| Tombol disabled saat loading | Tombol "Hapus Permanen" disabled sampai teks cocok persis |
| Z-index tidak diatur | `z-[60]` agar tidak tertutup modal detail (`z-50`) |
| Bagian | Sebelum | Sesudah |
|--------|---------|---------|
| Status Harian | Siswa Selesai tampil badge normal (H/S/I/A/T/L) | Badge biru "✓" dengan teks tersembunyi |
| Pencarian nama | Hanya Administrator | Administrator + Wali Kelas |
| Tombol Hapus Selesai | Hanya Administrator | Administrator + Wali Kelas |
| Modal Step 1 | 1 peringatan merah | 2 panel: peringatan merah + saran kuning download arsip dulu |
| Tombol X hapus pencarian | Tidak ada | Muncul saat ada teks di input |

## 2026-07-20 (Fitur Info PKL di Portal Orang Tua & Cari Data Siswa)
- Portal Orang Tua: Siswa PKL otomatis menampilkan PklInfoSection — profil PKL (perusahaan, pembimbing, periode, jam kerja, link Google Maps), status hari ini, statistik bulanan, riwayat absensi
- Portal Orang Tua: Badge status di Hero Header otomatis switch ke data PKL (Hadir/Terlambat/Sakit/Izin/Belum Absen PKL)
- Portal Orang Tua: Kartu Kehadiran & Hari Ini di Summary Cards otomatis menampilkan data PKL (persentase dari total hari kerja, status PKL hari ini)
- Portal Orang Tua: Section "Status Hari Ini" kehadiran sekolah disembunyikan saat siswa PKL
- Cari Data Siswa: Siswa PKL otomatis menampilkan PklInfoSection menggantikan section kehadiran sekolah
- Cari Data Siswa: 4 kartu stat kehadiran sekolah diganti 6 kartu stat PKL (Hadir/Terlambat/Sakit/Izin/Alpha/Libur) saat siswa PKL
- Cari Data Siswa: Section Status Kehadiran, Statistik Kehadiran (donut), Riwayat Absensi sekolah disembunyikan saat siswa PKL
- Komponen PklInfoSection: Reusable — menerima studentId + onPklDetected callback, return null jika bukan siswa PKL
- Server action getPklStudentProfile: Fetch profil PKL + 60 record absensi terakhir berdasarkan studentId
- Portal Orang Tua & Cari Data Siswa: Fix top bar sticky menutupi header aplikasi saat scroll
- File baru: app/components/PklInfoSection.js
- File diubah: app/actions/pklActions.js, app/portal-ortu/page.js, app/cari-data-siswa/[id]/page.js

## 2026-07-20 (Fitur Pengguna Aktif di Dashboard Admin)
- Tabel baru "Pengguna Aktif" di Dashboard Administrator — menampilkan daftar user yang sedang login secara real-time
- Tabel Pengguna Aktif: Avatar inisial dengan gradient warna unik per user, nama, badge peran dengan ikon (Administrator=🛡️, Wali Kelas=👨‍🏫, Sekretaris=📋, OSIS=⭐), waktu login, durasi aktif
- Tabel Pengguna Aktif: Indikator online hijau berdenyut, auto-refresh setiap 15 detik, tombol refresh manual
- Tabel Pengguna Aktif: Empty state saat tidak ada user aktif, loading state, error state dengan retry
- Tabel baru user_sessions di database — menyimpan user_id, user_name, user_role, logged_in_at, last_active, user_agent
- AppShell: Heartbeat session setiap 45 detik via createUserSession + updateSessionHeartbeat
- AppShell: Auto-cleanup session saat unmount (logout/navigasi keluar) via endUserSession
- Server action getActiveSessions: Otomatis hapus session stale (last_active > 2 menit) sebelum return data
- File baru: app/components/ActiveUsersTable.js
- File diubah: app/actions/userActions.js, app/components/AppShell.js, app/dashboard/AdminDashboard.js

## 2026-07-20 (Perbaikan Warna Hari Libur Rekap Kehadiran)
- Tab Bulanan: Blok warna hari libur mengikuti kategori dari Halaman Hari Efektif — Nasional (rose), Sekolah (amber), Semester (violet), Ujian (blue), Kegiatan Sekolah (teal), Khusus (gray). Sabtu & Minggu tetap merah pekat
- Tab Bulanan: Header tanggal libur menggunakan warna gelap per kategori, sel data menggunakan warna terang per kategori (sebelumnya semua merah)
- Tab Bulanan: Legenda hari libur di bawah tabel — kotak warna sesuai kategori + tanggal + nama libur dari database + baris Sabtu & Minggu
- Tab Bulanan: Fix data hari libur tidak sinkron setelah admin edit di Halaman Hari Efektif — tambah usePathname listener untuk re-fetch saat navigasi balik + polling 15 detik untuk menangani cache server yang stale di lingkungan serverless Vercel
- Export PDF Tab Bulanan: Warna blok hari libur di header dan sel data mengikuti kategori (sebelumnya semua #dc2626 merah)
- Export PDF Tab Bulanan: Legenda hari libur ditambahkan di bawah tabel PDF — kotak warna + tanggal + nama libur dari database
- File diubah: app/rekap-kehadiran/page.js

## 2026-07-19 (Perbaikan Rekap Kehadiran PKL)
- pklActions.js: Fix bug ReferenceError s is not defined di getPklRekapSemester baris 438 — seharusnya a.student_id bukan s.student_id dalam forEach loop
- Rekap PKL Tab Harian: Modal detail absensi (ikon mata) sekarang menampilkan Profil PKL siswa — card gradient biru muda berisi perusahaan, alamat PKL, pembimbing industri, guru pembimbing, periode PKL, jam kerja, hari kerja, koordinat lokasi dengan link Google Maps, radius absensi, dan status PKL
- pklActions.js: getPklAttendanceDetail tambah query ke tabel pkl_profiles berdasarkan student_id, return sebagai pklProfile di dalam objek detail
- File diubah: app/actions/pklActions.js, app/wali-kelas/rekap-pkl/page.js

## 2026-07-19 (Perbaikan Absensi PKL — Pecah Tombol, Jadwal, Auto-Daftar, Popup Panduan)
- Absensi PKL: Pecah tombol Hadir menjadi 2 tombol terpisah — "Absen Masuk" (hijau/teal, ikon LogIn) dan "Absen Pulang" (biru/indigo, ikon LogOut), masing-masing punya flow GPS→Camera→Submit terpisah
- Absensi PKL: Tombol otomatis berubah jadi "✅ Sudah Absen Masuk/Pulang (jam)" setelah berhasil, dengan pesan disabled menjelaskan alasan spesifik
- Absensi PKL: Pindahkan tabel "Jadwal Absensi Hari Ini" ke atas tombol aksi — siswa tahu jadwal sebelum klik, berisi jam masuk/pulang, jendela waktu dengan dot indikator aktif, toleransi terlambat, hari kerja, jam saat ini realtime WIB
- Absensi PKL: NISN belum terdaftar → auto-insert data siswa minimal (hanya NISN, field lain null) → langsung arahkan ke halaman setup profil PKL
- Absensi PKL: Form Data Siswa (Nama, Tingkat, Jurusan, L/P) tampil hanya untuk siswa baru, savePklProfile otomatis update tabel siswa
- Absensi PKL: Setup profil ditambahkan banner "Disarankan isi di tempat PKL" dan label "Radius: 50 meter (otomatis)"
- Absensi PKL: Profil PKL ditampilkan prominent di depan halaman absensi — card gradient biru muda berisi semua detail (perusahaan, alamat, pembimbing, periode, jam, hari kerja, koordinat)
- Absensi PKL: Tambah popup panduan tata cara absensi (5 langkah + info penting) sebelum input NISN, dengan tombol "Ya, Mengerti" dan checkbox "Jangan Tampilkan Lagi" (localStorage)
- Absensi PKL: Perbaiki auto-hapus selfie — cleanupOldPklSelfies sekarang loop while(hasMore) sampai semua record > 1 hari terproses (sebelumnya sekali limit 200)
- pklActions.js: Tambah fungsi getPklStudentData — gabungkan siswa + auto-update status profil + attendance hari ini dalam 1 panggilan, return sinyal NO_PROFILE jika belum punya profil
- pklActions.js: Fix bug ReferenceError s is not defined di getPklRekapSemester baris 438 — seharusnya a.student_id bukan s.student_id
- pklActions.js: savePklProfile otomatis update data siswa jika field student_nama/student_kelas/student_jurusan/student_jenis_kelamin dikirim
- File diubah: app/absensi-pkl/page.js, app/actions/pklActions.js

## 2026-07-19 (Perbaikan Portal Orang Tua & Rekap Pindah Keluar)
- Portal Orang Tahun Pelajaran & Semester kosong: Akar masalah cache `academic_calendar_active` menyimpan nilai null dari sebelum kalender diaktifkan — hapus cache, query langsung ke academic_calendar agar selalu sinkron dengan DB
- Portal Orang Tua: Tambahkan banner peringatan status non-aktif jika status siswa "Pindah" atau "Keluar" — muncul tepat di bawah Hero Header, sebelum 6 Summary Cards, dengan ikon AlertTriangle, label status merah, dan penjelasan singkat
- Rekap Pindah & Keluar: Hapus kolom Dokumen dari tabel utama (dokumen pendukung masih bisa diakses melalui modal detail siswa)
- File diubah: app/actions/parentPortalActions.js, app/portal-ortu/page.js, app/admin/siswa/pindah-keluar/page.js

## 2026-07-19 (Perbaikan Multi-Halaman)
- pelanggaranActions.js — Fix syntax error: kurung siku `]` hilang di akhir baris 197 menyebabkan build error "Expected ',', got 'if'"
- pelanggaranActions.js — deleteAllPelanggaran: Fix `.neq('id', 0).delete()` yang error "neq is not a function" — di Supabase JS v2 filter wajib dipanggil SETELAH `.delete()`, bukan sebelumnya
- pelanggaranActions.js — deleteAllPelanggaran: Simplifikasi reset total_pelanggaran — hapus logika kumpulkan NISN + batch `.in()`, ganti langsung `.update({ total_pelanggaran: 0 }).gte('total_pelanggaran', 1)` agar tidak gagal silent
- Rekap Pelanggaran: Ganti konfirmasi `prompt()` dengan modal popup 2 langkah — Step 1 peringatan (jumlah siswa & poin), Step 2 ketik "HAPUS SEMUA", loading spinner, result sukses/gagal
- Rekap Pelanggaran: Import baru ShieldAlert, Loader2 dari lucide-react; state baru showDeleteModal, deleteStep, deleteConfirmText, deleteResult, deleteInputRef
- Penanganan Siswa: Ganti konfirmasi `confirm()` dengan modal popup 2 langkah — Step 1 peringatan detail (riwayat BK, SP, catatan, status Pindah/Keluar) + ringkasan jumlah per kategori, Step 2 ketik "HAPUS SEMUA", loading spinner, result sukses/gagal
- Penanganan Siswa: Import baru X, ShieldAlert, Loader2 dari lucide-react; state baru showResetModal, resetStep, resetConfirmText, resetting, resetResult, resetInputRef
- Penanganan Siswa: Modal reset menggunakan z-index z-[60] agar tidak tertutup modal detail (z-50)
- Absensi Kehadiran: Sekretaris setelah klik "Kirim & Kunci Absensi" — jika ada siswa Alpha, modal konfirmasi WhatsApp otomatis terbuka (cukup 1x klik untuk kirim absen + WA)
- Absensi Kehadiran: Tombol "Minta Persetujuan Edit" baru muncul setelah alur kirim absensi + modal WA selesai
- Absensi Kehadiran: Modal WhatsApp — tombol "Batal" diganti "Lewati" agar sekretaris bisa skip pengiriman WA tanpa membatalkan absensi
- Absensi Kehadiran: Modal WhatsApp — tambah empty state saat tidak ada siswa Alpha dengan nomor WA valid
- Rekap Sakit & Izin: Fix filter Wali Kelas menampilkan semua jurusan — akar masalah u.kelas hanya berisi tingkat ("XII"), jurusan selalu kosong sehingga filter tidak efektif. Diganti prioritas ambil kelas+jurusan dari database via getUserKelasInfo(userId), fallback parse u.kelas
- Rekap Sakit & Izin: Hapus duplikat useEffect fetchFilters yang menjalankan query 2x
- Rekap Sakit & Izin: Tambah filter tanggal (date picker) untuk memfilter pengajuan per tanggal tertentu
- Rekap Sakit & Izin: Tambah tombol "Semua Tanggal" untuk reset filter tanggal
- Rekap Sakit & Izin: Tambah label info filter tanggal di bawah baris filter (nama hari lengkap + jumlah data ditemukan)
- Rekap Sakit & Izin: Tambah kartu statistik "Pengajuan Hari Ini" (gradient biru, selalu hitung dari ALL data bukan filtered agar konsisten)
- Rekap Sakit & Izin: Tambah icon mata (Eye) di kolom Aksi setiap baris data untuk melihat detail siswa
- Rekap Sakit & Izin: Modal detail lengkap berisi header gradient + avatar inisial, info grid 4 kolom (jenis, status, tanggal lengkap, jam), alasan pengajuan, foto bukti (klik untuk zoom), lokasi GPS (latitude, longitude, akurasi, tombol Google Maps), catatan Wali Kelas jika ditolak, timestamp verifikasi
- Rekap Sakit & Izin: Optimalisasi filteredData, stats, todayCount menggunakan useMemo agar tidak dihitung ulang setiap render
- absensiActions.js — cleanupOldBuktiSakitIzin: Tambah hapus otomatis record yang sudah > 30 hari (hapus foto sisa di Storage + batch delete record dari tb_absensi_sakit_izin per 100 ID)
- absensiActions.js — cleanupOldBuktiSakitIzin: Logika cleanup sekarang 2 tahap — >1 hari hapus foto saja, >30 hari hapus foto + record
- Mobile Wali Kelas: Fix link "Rekap Kehadiran" dari /wali-kelas/rekap-kehadiran menjadi /rekap-kehadiran (sesuai lokasi file app/rekap-kehadiran/page.js)
- Rekap Pindah & Keluar: Hapus kolom Dokumen dari tabel utama (dokumen pendukung masih bisa diakses melalui modal detail siswa)
- File diubah: app/actions/pelanggaranActions.js, app/actions/absensiActions.js, app/wali-kelas/rekap-pelanggaran/page.js, app/admin/siswa/penanganan/page.js, app/absensi/page.js, app/wali-kelas/rekap-sakit-izin/page.js, app/mobile/wali-kelas/page.js, app/admin/siswa/pindah-keluar/page.js

## 2026-07-19 (Perbaikan Rekap Sakit & Izin)
- Rekap Sakit & Izin: Fix filter Wali Kelas menampilkan semua jurusan — akar masalah u.kelas hanya berisi tingkat ("XII"), jurusan selalu kosong sehingga filter tidak efektif. Diganti prioritas ambil kelas+jurusan dari database via getUserKelasInfo(userId), fallback parse u.kelas
- Rekap Sakit & Izin: Hapus duplikat useEffect fetchFilters yang menjalankan query 2x
- Rekap Sakit & Izin: Tambah filter tanggal (date picker) untuk memfilter pengajuan per tanggal tertentu
- Rekap Sakit & Izin: Tambah tombol "Semua Tanggal" untuk reset filter tanggal
- Rekap Sakit & Izin: Tambah label info filter tanggal di bawah baris filter (nama hari lengkap + jumlah data ditemukan)
- Rekap Sakit & Izin: Tambah kartu statistik "Pengajuan Hari Ini" (gradient biru, selalu hitung dari ALL data bukan filtered agar konsisten)
- Rekap Sakit & Izin: Tambah icon mata (Eye) di kolom Aksi setiap baris data untuk melihat detail siswa
- Rekap Sakit & Izin: Modal detail lengkap berisi header gradient + avatar inisial, info grid 4 kolom (jenis, status, tanggal lengkap, jam), alasan pengajuan, foto bukti (klik untuk zoom), lokasi GPS (latitude, longitude, akurasi, tombol Google Maps), catatan Wali Kelas jika ditolak, timestamp verifikasi
- Rekap Sakit & Izin: Optimalisasi filteredData, stats, todayCount menggunakan useMemo agar tidak dihitung ulang setiap render
- absensiActions.js — cleanupOldBuktiSakitIzin: Tambah hapus otomatis record yang sudah > 30 hari (hapus foto sisa di Storage + batch delete record dari tb_absensi_sakit_izin per 100 ID)
- absensiActions.js — cleanupOldBuktiSakitIzin: Logika cleanup sekarang 2 tahap — >1 hari hapus foto saja, >30 hari hapus foto + record
- File diubah: app/wali-kelas/rekap-sakit-izin/page.js, app/actions/absensiActions.js

## 2026-07-19 (Perbaikan UX Konfirmasi & Alur WA Sekretaris)
- pelanggaranActions.js — Fix syntax error: kurung siku `]` hilang di akhir baris 197 menyebabkan build error "Expected ',', got 'if'"
- pelanggaranActions.js — deleteAllPelanggaran: Fix `.neq('id', 0).delete()` yang error "neq is not a function" — di Supabase JS v2 filter wajib dipanggil SETELAH `.delete()`, bukan sebelumnya
- pelanggaranActions.js — deleteAllPelanggaran: Simplifikasi reset total_pelanggaran — hapus logika kumpulkan NISN + batch `.in()`, ganti langsung `.update({ total_pelanggaran: 0 }).gte('total_pelanggaran', 1)` agar tidak gagal silent
- Rekap Pelanggaran: Ganti konfirmasi `prompt()` dengan modal popup 2 langkah — Step 1 peringatan (jumlah siswa & poin), Step 2 ketik "HAPUS SEMUA", loading spinner, result sukses/gagal
- Rekap Pelanggaran: Import baru ShieldAlert, Loader2 dari lucide-react; state baru showDeleteModal, deleteStep, deleteConfirmText, deleteResult, deleteInputRef
- Penanganan Siswa: Ganti konfirmasi `confirm()` dengan modal popup 2 langkah — Step 1 peringatan detail (riwayat BK, SP, catatan, status Pindah/Keluar) + ringkasan jumlah per kategori, Step 2 ketik "HAPUS SEMUA", loading spinner, result sukses/gagal
- Penanganan Siswa: Import baru X, ShieldAlert, Loader2 dari lucide-react; state baru showResetModal, resetStep, resetConfirmText, resetting, resetResult, resetInputRef
- Penanganan Siswa: Modal reset menggunakan z-index z-[60] agar tidak tertutup modal detail (z-50)
- Absensi Kehadiran: Sekretaris setelah klik "Kirim & Kunci Absensi" — jika ada siswa Alpha, modal konfirmasi WhatsApp otomatis terbuka (cukup 1x klik untuk kirim absen + WA)
- Absensi Kehadiran: Tombol "Minta Persetujuan Edit" baru muncul setelah alur kirim absensi + modal WA selesai
- Absensi Kehadiran: Modal WhatsApp — tombol "Batal" diganti "Lewati" agar sekretaris bisa skip pengiriman WA tanpa membatalkan absensi
- Absensi Kehadiran: Modal WhatsApp — tambah empty state saat tidak ada siswa Alpha dengan nomor WA valid
- File diubah: app/actions/pelanggaranActions.js, app/wali-kelas/rekap-pelanggaran/page.js, app/admin/siswa/penanganan/page.js, app/absensi/page.js

## 2026-07-18 (Perbaikan Rekap Pelangaran)
- pelanggaranActions.js — deleteAllPelanggaran	Tambah: ambil semua NISN dari tb_pelanggaran_siswa, lalu batch update siswa.total_pelanggaran = 0 (100 NISN per batch) agar tidak melebihi batas URL	
-	rekap-pelanggaran/page.js — Filter WK	Ubah logika: prioritas u.jurusan (dari DB via AppShell), fallback parse u.kelas — WK hanya melihat siswa jurusannya sendiri	
-	rekap-pelanggaran/page.js — Tabel Status	Tambah panel collapsible "Keterangan Status Disiplin" di atas Stat Cards, berisi tabel 4 baris: Sangat Baik (0-5), Perlu Pembinaan (6-10), Pengawasan Khusus (11-20), Prioritas Pembinaan (>20) dengan warna badge yang sama dengan tabel	
-	rekap-pelanggaran/page.js — Import	Tambah import ChevronDown dari lucide-react
- pelanggaranActions.js — deleteAllPelanggaran	Ganti .delete() dengan .neq('id', 0).delete() agar PostgREST menerima WHERE clause yang valid
-	pelanggaranActions.js — deleteAllPelanggaran	Tetap mempertahankan logika: ambil semua NISN terlebih dahulu, lalu batch reset total_pelanggaran = 0 agar benar-benar total nol dari awal

## 2026-07-18 (Perbaikan Penanganan Siswa & Navigasi Mobile)
- Fix error syncTahap is not defined di halaman Penanganan Siswa: Fungsi syncTahap hilang saat refactor sebelumnya — ditambahkan kembali dengan logika sinkronisasi checkbox SP1/SP2/SP3 otomatis saat tahap dipilih
- Fix handler dropdown layanan_bk menyetel tahap: 'Pindah/Keluar' (nilai tidak ada di opsi) diganti ke 'Mutasi' yang konsisten dengan logika Status Akhir
- Tambah konstanta BK_TO_TAHAP_MAP: mapping otomatis Pendampingan BK → Tahap (Belum→Belum Pembinaan, 1→Dalam Pembinaan, 2→SP1, 3→SP2, 4→SP3, Terakhir→Mutasi)
- Hapus opsi "Mutasi" dari dropdown Status Akhir — tersisa hanya Aktif, Pindah, Keluar
- Fix badge STATUS SAAT INI: Pindah/Keluar selalu tampil "Mutasi" karena TahapBadge mengecek tahap === 'Mutasi' sebelum statusAkhir === 'Pindah' — ubah prioritas: cek statusAkhir Pindah/Keluar pertama, baru tahap Mutasi
- Filter Status Penanganan SP1/SP2 kosong tanpa filter Tingkat: Akar masalah .in('nisn', nisns) dengan ratusan NISN melebihi batas panjang URL PostgREST → data pelanggaran tidak lengkap → totalPoin turun di bawah threshold SP1/SP2
- Tambah helper fetchInBatches() di penangananActions.js: memecah query .in() menjadi chunk 100 NISN per batch agar tidak melebihi batas URL PostgREST
- Terapkan fetchInBatches() di getPenangananData dan getPenangananStats untuk konsistensi
- Fix filter WK menampilkan semua jurusan: user.kelas dari tabel users hanya berisi tingkat ("X"), jurusan ada di user.jurusan ("KL") — sekarang prioritas ambil jurusan dari user.jurusan, fallback parse user.kelas
- Kirim parameter userJurusan dari halaman ke server action untuk filter WK yang akurat
- Tambah .trim() pada nilai tahap dan status_akhir dari database di seluruh fungsi penanganan (getPenangananData, getPenangananStats, savePenangananAction, autoUpdateTahapByPelanggaran) untuk menghindari mismatch akibat whitespace
- Wali Kelas sekarang bisa mengisi form penanganan siswa binaannya (sebelumnya read-only) — hapus semua disabled={isWaliKelas} dari field Pendampingan BK, Tahap, SP, tanggal SP, Catatan, Penggalian, Tindakan, Hasil
- Section Status Akhir + Tanggal Keputusan + Alasan Pindah/Keluar dibungkus {isAdmin && (...)} — hanya Administrator yang bisa mengakses
- Tombol Simpan Penanganan selalu tampil untuk Admin dan Wali Kelas
- Tombol Reset Semua dibungkus {isAdmin && (...)} — hanya Administrator
- File baru app/wali-kelas/penanganan/page.js: Import komponen PenangananSiswa dari admin
- Tambah SubLink "Penanganan Siswa" di sidebar Wali Kelas (AppShell.js)
- Tambah deteksi pathname /wali-kelas/penanganan untuk auto-open dropdown Wali Kelas (AppShell.js)
- Fix typo AppShell.js: komponen NavLink memiliki '}}}> (satu } kelebihan) menyebabkan 6 error berantai — diperbaiki menjadi ')}>
- Revamp semua 5 halaman mobile (Siswa, Sekretaris, OSIS, Wali Kelas, Admin) dengan desain konsisten: header gradient 3 warna + dekorasi lingkaran + tombol kembali
- Tambah animasi hover di semua kartu menu mobile: hover:-translate-y-2, hover:shadow-2xl, dekorasi lingkaran pojok group-hover:scale-[1.8]
- Halaman Mobile Siswa: tambah menu "Absensi PKL" (7 menu total)
- Halaman Mobile Wali Kelas: tambah menu "Rekap Kehadiran PKL" dan "Penanganan Siswa" (7 menu total)
- Halaman Mobile Admin: tambah menu "Konfigurasi WhatsApp" (12 menu total)
- File diubah: app/admin/siswa/penanganan/page.js, app/actions/penangananActions.js, app/components/AppShell.js, app/mobile/siswa/page.js, app/mobile/sekretaris/page.js, app/mobile/osis/page.js, app/mobile/wali-kelas/page.js, app/mobile/admin/page.js
- File baru: app/wali-kelas/penanganan/page.js

## 2026-07-17 (Fix Konsistensi Hari Efektif)
- Fix perhitungan Hari Efektif di halaman Hari Efektif: Sebelumnya menghitung semua hari kalender minus libur (termasuk Sabtu/Minggu) menghasilkan 168 hari — sekarang hanya menghitung weekday Senin-Jumat yang bukan hari libur, konsisten dengan Rekap Kehadiran (116 hari)
- Fix kalender Portal Orang Tua tidak menampilkan libur bulan lain: Query effective_days difilter per bulan ini saja — diganti fetch SEMUA hari libur tanpa filter tanggal, komputasi tipe hari di client saat navigasi bulan
- Fix cache Portal Orang Tua tidak update saat Admin edit libur: Cache key `effective_all_holidays_portal` tidak dimulai dengan `holidays_` sehingga tidak ter-clear oleh invalidateCacheByPrefix('holidays_') — diganti ke `holidays_all_portal`
- File diubah: app/actions/effectiveDaysActions.js, app/actions/parentPortalActions.js

## 2026-07-16 (Perbaikan Hari Efektif)
- Fix import CSV massal tidak memperbarui data: Cache invalidation hanya ada di blok edit (if id), tidak di blok tambah baru (else) — pindahkan ke luar if/else
- Fix import CSV massal tidak memperbarui data: Cache key holidays_${monthKey} hanya merepresentasikan bulan ini, data CSV bulan lain tidak ter-clear — ganti ke fixed key holidays_all_list
- Fix error invalidateCache is not defined: Semua fungsi write menggunakan invalidateCache yang tidak ada di cacheHelpers.js — ganti ke invalidateCacheByPrefix, import langsung di atas file
- Optimasi import CSV: Dari N+1 query (panggil saveHoliday per baris) menjadi 1x batch insert dengan fallback per-row, 1x cache invalidation, 1x log aktivitas
- Tambah loading state di tombol Import CSV Massal (spinner + teks "Memuat..." + tombol disabled)
- Hapus semua data libur sekarang juga menghapus riwayat aktivitas (effective_day_logs)
- Fix tanggal off-by-1 di Preview Kalender: toISOString().split('T')[0] mengkonversi ke UTC sehingga tanggal Indonesia bergeser -1 hari — ganti ke toLocaleDateString('sv-SE')
- Tambah navigasi bulan di Preview Kalender (tombol ChevronLeft/Right + nama bulan + tahun)
- Highlight tanggal hari ini di Preview Kalender (ring biru)
- Preview Kalender sekarang menggunakan perhitungan daysInMonth yang akurat (bukan hardcoded 35 cells)
- Tambah 2 opsi filter di tab Hari Libur Manual: "Kegiatan Sekolah" dan "Khusus" (sebelumnya hanya 4 opsi)
- Kartu statistik diubah dari 4 kartu generik menjadi 7 kartu per kategori (Hari Efektif, Nasional, Sekolah, Semester, Ujian, Kegiatan, Khusus) dengan warna berbeda
- Badge kategori di tabel Hari Libur Manual sekarang 6 warna sesuai jenis (sebelumnya hanya 2 warna)
- Warna blok di Preview Kalender disesuaikan 6 kategori + legenda lengkap
- File diubah: app/actions/effectiveDaysActions.js, app/setting/hari-efektif/page.js

## 2026-07-15 (Perbaikan Notifikasi & Portal Orang Tua)
- Fix notif WK tidak muncul saat orang tua kirim pesan: Akar masalah getWaliKelasUserId & getSekretarisUserId melakukan ILIKE jurusanPart ke kolom users.kelas (yang hanya berisi "XII"), bukan ke kolom users.jurusan (yang berisi "RPL 2") — diganti ke .eq('kelas', tingkat).ilike('jurusan', '%jurusanPart%')
- Fix dropdown notif mobile tertutup saat scroll: Scroll event listener sekarang mengecek e.target apakah berada di dalam panel — scroll dalam panel tidak menutup dropdown, sehingga tombol "Lihat Semua Notifikasi" bisa dicapai
- Hapus tombol filter "30 Hari" di halaman Pusat Notifikasi
- Ubah auto-hapus notifikasi dari 30 hari menjadi 7 hari (deleteOldNotifications default parameter + pemanggilan di getUnreadCount)
- Ubah auto-hapus pesan chat orang tua dari 10 hari menjadi 7 hari (deleteOldParentMessages default parameter + pemanggilan di getParentMessages)
- Aktifkan lonceng notifikasi di Portal Orang Tua: Menggunakan tabel parent_notifications dengan Supabase Realtime subscription
- Lonceng Portal Orang Tua: Notifikasi otomatis muncul saat Wali Kelas membalas pesan (createParentNotification dipanggil dari sendWKReplyMessage)
- Lonceng Portal Orang Tua: Polling fallback setiap 15 detik jika WebSocket gagal
- Lonceng Portal Orang Tua: Animasi shake berulang setiap 5 detik saat ada notif unread
- Lonceng Portal Orang Tua: Click outside dropdown (mouse + touch) untuk menutup
- Lonceng Portal Orang Tua: Notifikasi otomatis dihapus setelah 7 hari (di getParentNotifications)
- File diubah: app/components/NotificationCenter.js, app/notifikasi/page.js, app/actions/notificationActions.js, app/actions/parentPortalActions.js, app/portal-ortu/page.js

## 2026-07-14 (Perbaikan Bug)
- Fix filter Wali Kelas di Rekap Kehadiran PKL: Siswa kelas lain muncul karena filter menggunakan .includes("XI") yang salah mencocokkan "XII" — diganti ke exact match (===)
- Rekap Kehadiran PKL tab bulanan: Tampilan disamakan dengan Rekap Kehadiran reguler (header 2 baris, kolom No, Hari Efektif, Total H/S/I/A/T, % Hadir, sticky hanya desktop, border konsisten)
- Fix double-counting tab bulanan PKL: counts[d.status] di-increment 2x (loop pre-calc + JSX render) — hapus duplikat di JSX render
- Fix Alpha melebihi Hari Efektif di PKL: Backend menghitung Alpha untuk tanggal masa depan yang belum terjadi — tambah batasan ds <= todayStr sehingga Alpha hanya dihitung sampai hari ini
- Fix Hari Efektif PKL realtime: Hanya menghitung hari kerja sampai hari ini (isPastOrToday), bukan seluruh bulan
- Fix tab semester PKL: Alpha dan total kerja juga menggunakan batasan realtime sampai hari ini
- Fix Absensi Kelas "Finalisasi & Kirim WA": Modal menampilkan 0 siswa Alpha karena getAlphaStudentsForWA memfilter .eq('locked', true) sementara Admin menyimpan dengan locked: false
- Fix getAlphaStudentsForWA: Hapus filter locked yang menyebabkan siswa Alpha tidak ditemukan
- Fix getAlphaStudentsForWA: Ganti join syntax siswa!inner() dengan 2 query terpisah untuk menghindari error "Could not find a relationship between 'absensi' and 'siswa' in the schema cache" dari PostgREST
- Fix handleOpenWAModal di absensi/page.js: Gunakan state lokal siswaList sebagai sumber utama daftar siswa Alpha, getAlphaStudentsForWA hanya untuk lookup nomor WA
- File diubah: app/actions/pklActions.js, app/wali-kelas/rekap-pkl/page.js, app/actions/whatsappActions.js, app/absensi/page.js

## 2026-07-13 (Optimasi Round 4)
- Cache getUnreadCount: getCached per userId dengan TTL.SHORT (10 detik) — dipanggil setiap navigasi header, sebelumnya 1 DB hit per halaman
- Cache getDashboardNotifications: getCached per userId dengan TTL.SHORT (10 detik) — sebelumnya 1 DB hit per buka dashboard
- Invalidate notifikasi: Semua write (create, markRead, delete) memanggil invalidateCacheByPrefix('notif_') agar cache selalu sinkron
- Keamanan notifikasi: Escape wildcard ILIKE (%) dan (_) pada search di getUserNotificationsAdvanced untuk mencegah pattern injection
- Cache getPublishedNews: getCached per kombinasi limit+category dengan TTL.MINUTE (1 menit) — dipanggil di beranda semua role, sebelumnya 1 DB hit per buka
- Cache getAllNews: getCached dengan TTL.MINUTE — dipanggil di halaman Pos Berita admin
- Cache getNewsBySlug: getCached per slug dengan TTL.MINUTE — dipanggil di halaman detail berita
- Cache getNewsStats: getCached dengan TTL.MINUTE
- Invalidate berita: saveNews, deleteNews, resetAllNews memanggil invalidateCacheByPrefix('news_')
- Cache getAdminDashboardData: getCached dengan TTL.DASHBOARD_STATS (30 detik) — 12 query paralel jadi 0 saat cache hit, sebelumnya 12 DB hits per refresh
- Cache getWaliKelasDashboardFull: getCached per kelas+userId dengan TTL.DASHBOARD_STATS — 8 query jadi 0
- Cache getSekretarisDashboardFull: getCached per kelas+userId dengan TTL.DASHBOARD_STATS — 2 query jadi 0
- Cache getOsisDashboardFull: getCached dengan TTL.DASHBOARD_STATS — 10 query jadi 0
- Cache getRekapRewardStats: getCached dengan TTL.MINUTE (1 menit)
- Cache getChartData: getCached dengan TTL.MINUTE
- Cache getRekapRewardTable: getCached per filter combo dengan TTL.MINUTE
- Cache getTopRewardStudents: getCached dengan TTL.MINUTE
- Cache getHomeRewardChart: getCached dengan TTL.MINUTE — dipanggil di beranda semua role
- Invalidate reward: saveRewardAction, deleteRewardAction, deleteAllRewardAction memanggil invalidateCacheByPrefix('reward_')
- Cache getRekapPelanggaranStats: getCached dengan TTL.MINUTE
- Cache getHomePelanggaranChart: getCached dengan TTL.MINUTE — dipanggil di beranda semua role
- Invalidate pelanggaran: savePelanggaranAction, deleteAllPelanggaran memanggil invalidateCacheByPrefix('pelanggaran_')
- Cache getPublishedAlumni: getCached dengan TTL.MINUTE — dipanggil di beranda (Kisah Alumni)
- Cache getAlumniStats: getCached dengan TTL.MINUTE — dipanggil dari getFormulirStats
- Cache alumni dropdowns: getCached dengan TTL.KELAS_FILTERS (5 menit) — tahun lulus, jurusan, status, kota options tidak perlu query ulang tiap ganti halaman
- Invalidate alumni: toggleAlumniPublish, toggleAlumniFeatured, toggleAlumniPin memanggil invalidateCacheByPrefix('alumni_')
- Cache getFormulirStats: getCached dengan TTL.MINUTE — dipanggil di dashboard admin
- Invalidate formulir: saveTracerStudi, savePemetaanKarir, saveSnbpSnbt, resetAllFormulirAction memanggil invalidateCacheByPrefix('formulir_')
- Cache getPenangananFilters: getCached dengan TTL.KELAS_FILTERS (5 menit) — dropdown tingkat/jurusan jarang berubah
- Invalidate penanganan: savePenangananAction, resetAllPenangananAction memanggil invalidateCacheByPrefix('penanganan_')
- Cache academic_calendar_active: getCached dengan TTL.HARI_EFEKTIF di cariSiswaActions — kalender akademik jarang berubah
- CRITIS getRekapPelanggaranTable: Dari N×4 query per siswa (200 query untuk 50 siswa) menjadi 1 batch query mengambil SEMUA pelanggaran + group by NISN di JavaScript
- searchStudentsForReward: Dari N+1 query WK lookup menjadi 1 batch query IN kelas unik
- searchStudentsForPelanggaran: Dari N+1 query WK lookup menjadi 1 batch query IN kelas unik
- getSiswaDetail (cariSiswaActions): 7 query sequential digabung menjadi 1 sequential + 6 paralel via Promise.all
- searchSiswa: 2 query sequential (siswa + absensi) digabung paralel via Promise.all
- getPenangananData: 3 query sequential digabung menjadi 1 + 2 paralel via Promise.all
- getPenangananStats: 3 query sequential digabung menjadi 1 + 2 paralel via Promise.all
- getSiswaPenangananDetail: 5 query sequential digabung menjadi 1 + 4 paralel via Promise.all
- resetAllPenangananAction: 4 delete sequential digabung paralel via Promise.all
- resetAllFormulirAction: 3 delete sequential digabung paralel via Promise.all
- Keamanan ILIKE: Escape wildcard (%) dan (_) di searchStudentsForReward, searchStudentsForPelanggaran, searchSiswa, getAllAlumni, getRekapFormulir, getPenangananData, getPindahKeluarData
- Fix getRekapRewardTable: Format return value tetap { data: [...] } saat dibungkus getCached — sebelumnya return array langsung menyebabkan data tabel kosong
- Fix getTopRewardStudents: Format return value tetap { data: [...] } — sebelumnya return array langsung menyebabkan Tiga Besar kosong di beranda
- Fix getPublishedAlumni: Format return value tetap { data: [...] } — sebelumnya return array langsung menyebabkan Kisah Alumni kosong di beranda
-File diubah: app/actions/notificationActions.js, app/actions/newsActions.js, app/actions/dashboardActions.js, app/actions/rewardActions.js, app/actions/pelanggaranActions.js, app/actions/cariSiswaActions.js, app/actions/alumniActions.js, app/actions/formulirActions.js, app/actions/penangananActions.js, app/actions/parentPortalActions.js

## 2026-07-13 (Optimasi Round 3)
- Cache WhatsApp Config: getWhatsAppConfig menggunakan getCached dengan TTL.WHATSAPP_CONFIG (10 menit) — sebelumnya query setiap buka halaman Konfigurasi WhatsApp
- Cache School Settings: Helper getSchoolSettings menggunakan getCached dengan TTL.SETTINGS (10 menit) — sebelumnya query app_settings setiap kali kirim WA
- getAlphaStudentsForWA: Dari 2 query sequential (absensi → siswa IN clause) + filter JS, menjadi 1 query INNER JOIN via siswa!inner() dengan filter tingkat/jurusan di level DB — hemat 1 DB round-trip
- executeSendWA: Log entries dikumpulkan di array lalu batch insert sekali di akhir — sebelumnya N insert terpisah (untuk 20 siswa Alpha: dari 20 DB writes turun jadi 1)
- retryWhatsAppLog: Query log + config dijalankan paralel via safeParallel — sebelumnya 2 query sequential
- getWhatsAppTodayStats: 3 count query dijalankan paralel via Promise.all dengan head:true — sebelumnya 3 query sequential
- Keamanan getWhatsAppLogs: Escape karakter % dan _ pada search string untuk mencegah ILIKE wildcard injection
- Invalidate otomatis: saveWhatsAppConfig dan testWhatsAppConnection memanggil invalidateCache(CACHE_WA_CONFIG) agar cache selalu sinkron
- Helper getRawWhatsAppConfig diekstrak untuk keperluan internal (test connection, save, execute send) yang butuh token asli tanpa mask
- Fix bug dbOptimize.js: Import default diganti named import — import supabaseAdmin from menjadi import { supabaseAdmin } from
- Fix bug rekap-kehadiran/page.js: Variabel loadedTabs tidak dideklarasikan sebagai state — tambah const [loadedTabs, setLoadedTabs] = useState(new Set(['harian']))
- File diubah: app/actions/whatsappActions.js, lib/dbOptimize.js, app/rekap-kehadiran/page.js

## 2026-07-13 (Optimasi Round 2)
- Cache Penanggung Jawab: getPJStats (5 menit), getPJByClass per kelas+jurusan combo (5 menit), getDerivedPJ full list (5 menit) — mengurangi ratusan query DB per hari karena fungsi ini dipanggil di setiap pengajuan sakit/izin, pesan orang tua, dan revisi absensi
- Cache Hari Efektif: getEffectiveDaysStats (10 menit), getHolidays per bulan (10 menit) — data libur jarang berubah, tidak perlu query setiap kali halaman dibuka
- Cache QR Absensi: getQRSettings (5 menit) — invalidate otomatis saat admin simpan pengaturan baru
- Cache KOP Surat: getKopSuratSettings menggunakan shared key `kop_surat` (30 menit) — sinkron antar semua halaman yang memakai kop surat
- Cache Notifikasi: getAdminUserIds (10 menit), getWaliKelasUserId per kelas (5 menit), getSekretarisUserId per kelas (5 menit) — sebelumnya masing-masing menjalankan hingga 5 query sequential per panggilan
- Throttle deleteOldNotifications: Dari setiap 15 detik menjadi max 1x per 5 menit — mengurangi query DELETE yang tidak perlu
- Invalidate otomatis: Setiap operasi write (save, delete, reset) memanggil invalidateCache/invalidateCacheByPrefix agar cache selalu konsisten dengan data terbaru
- Bug fix: getSekretarisUserId Strategi 2 mengembalikan `data[0]._id` (underscore bug) — diperbaiki menjadi `data[0].id`
- File diubah: app/actions/penanggungJawabActions.js, app/actions/effectiveDaysActions.js, app/actions/qrAbsensiActions.js, app/actions/siswaActions.js

## 2026-07-13
- Optimasi Performa Server: Singleton Supabase Client di lib/supabase-admin.js dan lib/supabase.js — 1 instance per warm instance, kurangi 50-70% koneksi DB baru
- File baru lib/cacheHelpers.js: In-memory cache dengan TTL (10 detik s.d. 30 menit), deduplikasi request paralel identik, invalidate by key/prefix
- File baru lib/dbOptimize.js: Helper fastCount (head:true tanpa fetch row), fetchPaginated (count+data 1 query), parallelQueries (Promise.all wrapper), safeParallel (toleransi error parsial)
- Dashboard Admin: 2 batch query sequential (namaLookup + 30 hari) digabung menjadi 1 Promise.all
- Dashboard Wali Kelas: 6 query sequential (absensi, izin, reward, pelanggaran, penanganan, pesan) digabung menjadi 1 Promise.all — hemat ~1000ms
- Dashboard Sekretaris: 2 query absensi terpisah (hari ini + 7 hari) digabung menjadi 1 query 7 hari, data hari ini di-derive dari hasilnya — hemat 1 DB round-trip
- Dashboard OSIS: 2 blok Promise.all terpisah (8 query + 2 query chart) digabung menjadi 1 blok 10 query — hemat ~200ms
- Absensi: getKelasFilters() di-cache 5 menit — dropdown kelas/jurusan tidak query DB setiap kali halaman dibuka
- Absensi: submitSakitIzin() upload foto + cari siswa berjalan paralel — hemat ~20ms per pengajuan
- Portal Orang Tua: Hapus query duplikat effectiveRes dan calendarRes (query identik ke tabel effective_days) — hemat 1 DB round-trip
- Portal Orang Tua: effective_days di-cache per bulan (10 menit), PJ lookup di-cache (5 menit)
- PKL: getPklFilters() di-cache 5 menit, academic_calendar aktif di-cache 10 menit
- PKL: submitPklCheckIn/CheckOut/SakitIzin upload selfie + cek existing record berjalan paralel — hemat ~60ms per absensi
- File diubah: lib/supabase-admin.js, lib/supabase.js, app/actions/dashboardActions.js, app/actions/absensiActions.js, app/actions/parentPortalActions.js, app/actions/pklActions.js
- File baru: lib/cacheHelpers.js, lib/dbOptimize.js

## 2026-07-12
- Rekap Kehadiran PKL: Tampilan nama Wali Kelas dan Sekretaris via komponen PJInfoCard (sama dengan Rekap Kehadiran reguler)
- Rekap Kehadiran PKL: PJInfoCard hanya muncul saat filter tingkat dan jurusan sudah dipilih
- Rekap Kehadiran PKL: Export PDF sekarang menyertakan kop surat dinamis dengan logo dinas dan logo sekolah
- Rekap Kehadiran PKL: PDF tab Bulanan otomatis landscape (@page{size:landscape})
- Rekap Kehadiran PKL: Tombol "Reset Semua" disembunyikan untuk role Wali Kelas, hanya Administrator yang bisa melihat dan mengakses
- Navigasi Mobile: Desain kartu menu diubah dari putih border-kiri menjadi full gradient warna dengan ikon putih transparan
- Navigasi Mobile: Ikon kartu memiliki animasi bounce naik-turun (2 detik, delay berbeda per kartu)
- Navigasi Mobile: Dekorasi lingkaran transparan di pojok kanan bawah setiap kartu
- Navigasi Mobile: Gradient dan shadow menggunakan inline style untuk menghindari masalah Tailwind JIT purge pada class dinamis
- Mobile Admin: Tambah kartu menu "QR Absensi" (ikon QrCode, warna amber, link /setting/qr-absensi)
- File diubah: app/wali-kelas/rekap-pkl/page.js, app/mobile/admin/page.js, app/mobile/siswa/page.js, app/mobile/sekretaris/page.js, app/mobile/osis/page.js, app/mobile/wali-kelas/page.js

## 2026-07-10

- Tab Bulanan Rekap Kehadiran: Header "BULAN" diganti nama bulan aktual sesuai dateFilter (contoh: "Juli", "Agustus")
- Tab Bulanan Rekap Kehadiran: Kolom "E" diganti "Hari Efektif" (tampil 2 baris vertikal)
- Tab Bulanan Rekap Kehadiran: Perbaiki garis kiri kolom L/P yang hilang — semua kolom kini konsisten menggunakan border-b border-r
- Tab Harian Rekap Kehadiran: Kolom L/P, Kelas, Jurusan, Status, Waktu, Sumber dirata tengah (text-center)
- Header tabel Rekap Kehadiran: Warna header diubah dari putih (bg-gray-50) menjadi abu-abu (bg-gray-100) di semua tab untuk kontras yang lebih jelas
- Tab Bulanan, Semester, Tahunan: Kolom No, Nama Siswa, L/P hanya sticky di desktop (md:sticky), di HP bebas digeser left-right
- Section Siswa Kritis Tab Bulanan: Dipulihkan dan diperbaiki — sebelumnya tidak muncul karena fungsi eksternal dalam dependency useMemo tidak ter-recompute saat holidays berubah
- Siswa Kritis: Perhitungan alpha sekarang sepenuhnya inline di dalam useMemo tanpa memanggil isHoliday/getEffectiveDaysInMonth dari luar
- Siswa Kritis: Jika tidak ada siswa alpha > 3, tampilkan pesan hijau "Tidak Ada Siswa Kritis Bulan Ini" sebagai indikator visual
- Siswa Kritis: Banner merah gradient dengan ikon pulse, 5 kartu statistik, legend 3 tingkat, bar chart top 10, tabel detail dengan badge severity

File diubah: app/rekap-kehadiran/page.js

## 2026-07-09 (Update 2)
- Fix filter Wali Kelas di Rekap Kehadiran PKL: Auto-set filter kelas+jurusan dari userData saat halaman dibuka
- Rekap PKL (Wali Kelas): Dropdown Tingkat & Jurusan di-disabled, muncul badge "Kelas Binaan: XII RPL 2"
- Rekap PKL (Wali Kelas): Tombol Reset filter disembunyikan, tab tidak reset saat auto-filter
- Fix stats card Rekap PKL: Case sensitivity bug — stats["Sakit"] (key baru) bukan stats.sakit → normalisasi ke lowercase
- Tambah kolom Guru Pembimbing di profil PKL (form setup, pre-fill edit, simpan ke DB)
- Tambah kolom Pembimbing Industri & Guru Pembimbing di Rekap PKL semua tab (Harian, Bulanan sticky, Semester)
- Koordinat GPS di detail modal Rekap PKL menjadi link Google Maps (buka langsung lokasi siswa)
- Export CSV & PDF Rekap PKL: Tambah kolom Pembimbing Industri dan Guru Pembimbing
- Fix kamera Absensi PKL: Elemen
- Fix tombol Cari terpotong di HP: Tambah min-w-0, shrink-0, sembunyi teks di layar kecil
- Tambah info jadwal absensi di step GPS Hadir: Jam Masuk (buka -60 menit s.d. +180 menit), Jam Pulang (buka -60 menit s.d. +120 menit), Toleransi Terlambat 15 menit
- Tambah helper formatMinToTime() untuk menghindari VS Code error pada ekspresi inline kompleks
- Fix console error "uncontrolled to controlled input": Tambah guru_pembimbing di state awal form
- Dokumentasi kolom kelas vs jurusan di tabel users di DATABASE_SCHEMA.md
- dashboardActions.js WK :	Parse "XI" → jurusan kosong → query tanpa filter jurusan |	Cek DB users.jurusan via userId → filter jurusan='RPL 2'
- dashboardActions.js Sekretaris : 	Sama |	Sama
- WaliKelasDashboard.js :	Header tampil "Kelas Binaan: XI" |	Tampil "Kelas Binaan: XI RPL 2"
- SekretarisDashboard.js :	Header tampil "Kelas: XI" |	Tampil "Kelas: XI RPL 2"

# Ringkasan perubahan pada tab Bulanan:
- Header Row 1 |	No, Nama, L/P, tanggal 1-31, E, H, S, I, A |	No, Nama, L/P, "Bulan" (span 31), E, "Total" (span 4), "% Hadir"
- Header Row 2 |	(tidak ada) |	(kosong), (kosong), 1(SEN) 2(SEL) 3(RAB)...31(MIN)
- Kolom hari libur |	Background merah pekat |	Background merah pekat + teks hari di bawah angka
- Kolom Total |	(tidak ada) |	Total H, S, I, A — sum per siswa sepanjang bulan
- Kolom % Hadir |	(tidak ada) |	% Hadir — Total H / Hari Efektif × 100
- Section Siswa Kritis |	Threshold >5 |	Threshold >3, severity ≥10/5-9/4-3
- Stats cards |	≥15 |	≥10
- Legend |	≥15/10-14/6-9 |	≥10/5-9/4-3

## 2026-07-09
- Fitur baru: Modul Absensi PKL (/absensi-pkl) untuk siswa yang sedang melaksanakan Praktik Kerja Lapangan
- Fitur baru: Modul Rekap Kehadiran PKL (/wali-kelas/rekap-pkl) untuk Wali Kelas & Administrator
- Modul PKL terpisah dari Absensi Kehadiran reguler (tidak mencampur data)
- Profil PKL: Informasi perusahaan, pembimbing industri, tanggal mulai/selesai
- Profil PKL: Pengaturan jam kerja (jam masuk, jam pulang)
- Profil PKL: Pengaturan hari kerja (pilih hari rutin)
- Profil PKL: Lokasi PKL via GPS dengan radius absensi dikunci permanen 50 meter
- Profil PKL: Auto-update status (Belum Mulai → Berjalan → Selesai) berdasarkan tanggal
- Tombol Atur Ulang Profil PKL — hanya muncul jika profil sudah tersimpan, pre-fill form dengan data lama
- Absensi Hadir: Validasi GPS (Haversine, radius 50m) → Foto selfie → Kirim
- Absensi Sakit/Izin: Ambil koordinat (tanpa validasi radius) → Foto selfie → Alasan → Kirim
- Absensi Pulang: Validasi GPS → Foto selfie → Kirim
- Validasi waktu: Toleransi 60 menit sebelum / 180 menit setelah jam masuk; 60 menit sebelum / 120 menit setelah jam pulang
- Toleransi keterlambatan: 15 menit dari jam masuk → status otomatis "Terlambat"
- Status absensi: Hadir, Sakit, Izin, Alpha, Terlambat, Libur
- Status Alpha: Otomatis dihitung untuk hari kerja tanpa record absensi (di rekap)
- Status Libur: Otomatis dihitung berdasarkan work_days per siswa (di rekap), bukan effective_days global
- Foto selfie wajib dari kamera langsung, kompresi otomatis, upload ke Supabase Storage (bucket: pkl-selfies)
- Auto cleanup foto selfie > 1 hari (dihapus dari storage, kolom URL di-set null)
- Rekap PKL Tab Harian: Kolom No, NISN, Nama, L/P, Kelas, Jurusan, Perusahaan, Jam Masuk, Jam Pulang, Status, Terlambat, Aksi
- Rekap PKL Tab Bulanan: Kalender kehadiran per tanggal (H/S/I/A/T/L), sticky kolom Nama+L/P+Kelas+Jurusan+Perusahaan, hari libur background merah
- Rekap PKL Tab Semester: Rekap H/S/I/A/T/L, Total Kerja, Persentase Kehadiran
- Rekap PKL: Tidak ada kolom Hari Efektif (setiap siswa memiliki jadwal kerja berbeda)
- Rekap PKL: Dashboard 7 stat card + Donut Chart distribusi kehadiran
- Rekap PKL: Filter Perusahaan, Tingkat, Jurusan, Status PKL
- Rekap PKL: Modal detail absensi (foto selfie, koordinat GPS, alamat, jam, alasan)
- Rekap PKL: Export CSV dan Export PDF untuk ketiga tab
- Rekap PKL: Tombol Reset Semua Data (2x konfirmasi ketik "HAPUS SEMUA", hapus profil + absensi + foto storage)
- Tabel baru di database: pkl_profiles, pkl_attendance
- Storage bucket baru: pkl-selfies (public)
- File baru: app/actions/pklActions.js, app/absensi-pkl/page.js, app/wali-kelas/rekap-pkl/page.js
- File diubah: app/components/AppShell.js, app/mobile/siswa/page.js, app/mobile/wali-kelas/page.js
- Fix kritis getPklStudents: Pisah query PostgREST join menjadi 2 query terpisah (profiles + siswa) lalu merge di JavaScript — sebelumnya data selalu kosong
- Fix tab bulanan Rekap PKL: Safety (s.days || []).map() mencegah error saat pindah tab
- Fix filter Sekretaris Absensi: Tambah getUserKelasInfo() ambil kelas+jurusan dari DB, prioritas DB bukan localStorage
- Fix canEdit Sekretaris: Bandingkan selectedKelas dengan sekretarisFullKelas bukan userData.kelas

## 2026-07-08
- Fitur baru: Konfigurasi WhatsApp (Fonnte API) di menu Setting/Pengaturan
- Halaman Konfigurasi WhatsApp dengan 3 tab: Konfigurasi API, Pengaturan Pengaturan Pengiriman, Riwayat Pengiriman
- Integrasi Fonnte API: simpan token, uji koneksi dengan error detail, status integrasi real-time
- Keamanan: API Token disimpan di server via supabaseAdmin, ditampilkan dengan masking (●●●●●) di frontend
- Tambah kolom parent_whatsapp di tabel siswa (nomor WhatsApp orang tua, format internasional Indonesia)
- Tambah kolom No WA Ortu di tabel Daftar Siswa dengan badge hijau 📱
- Validasi nomor WA saat simpan (format internasional: 08xxx → 628xxx, 10-15 digit)
- Update template Import CSV Siswa: tambah kolom "No WA Ortu" di index 6
- Update Export CSV Siswa: tambah kolom "No WA Ortu" di export
- Update Cetak Siswa: tambah kolom "No WA Ortu" di cetak browser
- Fix saveSiswaAction: mapping key frontend (nis) ke kolom database (nisn) via helper mapSiswaToDB — error "Could not find the 'nis' column" sudah diperbaiki
- Fix openEditModal: mapping s.nisn → formData.nis agar field NISN tidak undefined saat modal edit dibuka
- Fix importSiswaAction: mapping nis → nisn di setiap baris CSV sebelum insert
- Absensi Kehadiran: tombol "✅ Finalisasi & Kirim WA" untuk Administrator (muncul jika ada siswa Alpha)
- Alur Finalisasi: Simpan → Finalisasi & Kirim WA → Konfirmasi (ringkasan) → Sending (spinner) → Result (summary per siswa)
- Sistem otomatis mencari siswa Alpha yang punya parent_whatsapp valid dari tabel siswa
- Template pesan WhatsApp profesional (Assalamu'alaikum, nama siswa, kelas, tanggal, status, nama sekolah, SIPANDU)
- Log pengiriman dicatat di tabel whatsapp_logs (status, response, retry_count)
- Riwayat Pengiriman: tabel dengan filter status, pencarian, pagination, tombol Kirim Ulang untuk log gagal
- Riwayat Pengiriman: tombol "Hapus Semua Riwayat" dengan konfirmasi ketik "HAPUS SEMUA" (2x konfirmasi)
- Dashboard Admin: widget "WhatsApp Hari Ini" (3 kartu: Terkirim/Gagal/Menunggu) menggunakan getWhatsAppTodayStats
- Sidebar: tambah SubLink "Konfigurasi WhatsApp" di menu Pengaturan
- Mobile Admin: tambah menu "Konfigurasi WhatsApp" dengan warna emerald
- Tabel baru di database: whatsapp_config (single row), whatsapp_logs
- Kolom baru di tabel siswa: parent_whatsapp
- File baru: app/actions/whatsappActions.js, app/setting/konfigurasi-whatsapp/page.js
- File diubah: app/components/AppShell.js, app/admin/siswa/page.js, app/absensi/page.js, app/dashboard/AdminDashboard.js, app/mobile/admin/page.js

## 2026-07-07
- Fix halaman Penanggung Jawab: Total Kelas Aktif hanya menampilkan 3 (X, XI, XII) karena grouping menggunakan kolom kelas saja — sekarang grouping menggunakan gabungan kelas + jurusan sesuai format data terbaru
- Fix getDerivedPJ(): pengelompokan sekarang berdasarkan kelas + jurusan ternormalisasi, bukan kelas saja
- Fix getPJByClass(): query menggunakan kolom kelas dan jurusan secara terpisah (bukan gabungan string "X TKRO 1" di satu kolom), sesuai perubahan format data
- Tambah normalisasi whitespace (trim + collapse multiple spaces) di penanggungJawabActions.js — mencegah grouping ganda akibat inkonsistensi spasi di database
- Fix dropdown jurusan ganda di Manajemen User: "TKRO 1" dan "TKRO 1" (double space) sekarang di-deduplikasi menjadi 1 item di dropdown
- Fix filter kelas & jurusan di Manajemen User: perbandingan menggunakan string ternormalisasi agar data dengan whitespace berbeda tetap terfilter dengan benar
- Halaman Penanggung Jawab: status badge 3 tingkat (Aktif/hijau, Tidak Aktif/abu, Belum Ada PJ/kuning)
- Halaman Penanggung Jawab: handle null updated_at (tampil "-" bukan "1/1/1970")
- Halaman Penanggung Jawab: pencarian juga mencakup nama sekretaris
- Halaman Penanggung Jawab: sorting otomatis X → XII lalu jurusan alfabet
- Notifikasi lonceng: fix shake interval dari 4000ms menjadi 5000ms
- Notifikasi lonceng: tambah error callback pada WebSocket subscribe — error "Failed to fetch" ditangani dengan warn instead of uncaught
- File diubah: app/actions/penanggungJawabActions.js, app/admin/users/page.js, app/components/NotificationCenter.js, app/setting/penanggung-jawab/page.js

## 2026-07-06
- Fix kritis notif Admin: Login hardcoded admin/admin123 menggunakan client supabase yang diblokir RLS → adminData.id selalu null → notif tidak pernah muncul di lonceng Admin
- Fix: Ganti query client ke server action getAdminLoginData() menggunakan supabaseAdmin (bypass RLS)
- Fix: Safety net di AppShell otomatis memperbaiki admin ID null di localStorage dari session lama via resolveAdminUserId()
- Tambah server action getAdminLoginData() dan resolveAdminUserId() di userActions.js
- Notifikasi lonceng Admin: popup konfirmasi revisi absensi (bukan redirect ke halaman Absensi) — tampil detail kelas, tanggal, alasan + tombol Setujui/Tolak
- Notifikasi Pusat Notifikasi: popup konfirmasi revisi absensi sama seperti lonceng — konsisten untuk Admin
- Tambah server action getEditRequestDetails() di absensiActions.js
- Tambah polling fallback 15 detik di NotificationCenter — notif tetap muncul meski WebSocket gagal connect
- Absensi Kehadiran: Data Sakit/Izin Online & QR Mandiri disimpan dengan locked: false (tidak langsung dikunci sebelum Sekretaris klik "Kirim & Kunci")
- Absensi Kehadiran: Sekretaris hanya bisa edit status Hadir & Alpha — Sakit/Izin terkunci (harus via halaman terpisah)
- Absensi Kehadiran: Record dari QR Mandiri, Sakit/Izin Online, Sistem Otomatis, Administrator dikunci total untuk Sekretaris
- Absensi Kehadiran: Badge "SCAN QR" / "ONLINE" di kolom Keterangan tetap dipertahankan setelah Sekretaris kirim absensi (input_by tidak ditimpa)
- Absensi Kehadiran: Setelah Admin setujui revisi, Sekretaris klik "Simpan Perubahan" → data langsung terkunci otomatis (hanya 1x edit)
- Fix isAbsensiSubmitted(): tambah pengecekan absensiList.length < siswaIds.length → return false (cegah false "submitted" saat hanya sebagian siswa ada datanya)
- Rekap Kehadiran Tab Semester & Tahunan: tambah fungsi getCountsWithAlpha() — siswa belum absen di hari efektif lewat otomatis tercatat Alpha (sinkron dengan Bulanan & Harian)
- Rekap Kehadiran Tab Bulanan, Semester, Tahunan: tambah garis horizontal dan vertikal pada tabel agar pembatas antar kolom terlihat jelas
- File diubah: app/actions/absensiActions.js, app/actions/userActions.js, app/actions/notificationActions.js, app/components/NotificationCenter.js, app/components/AppShell.js, app/login/page.js, app/absensi/page.js, app/rekap-kehadiran/page.js, app/notifikasi/page.js
- Tambah filterJurusan state :	Dropdown filter baru
- Tambah jurusanOptions :	Diambil dari data user yang ada (dinamis)
- Grid filter 4 → 5 kolom :	Tambah dropdown "Semua Jurusan"
- matchJurusan di filter :	Filter data berdasarkan kolom jurusan
- Export CSV: parseKelas(u.kelas).tingkat	: Kolom KELAS hanya tampil X/XI/XII
- Cetak: parseKelas(u.kelas).tingkat	: Kolom KELAS hanya tampil X/XI/XII
- Contoh Excel template :	Kolom kelas dari "X TKRO 1" → "X", role dari "Siswa" → "OSIS" (sesuai daftar role)
- Tombol Hapus Semua :	Dipindah dari bawah pagination ke baris action buttons, dengan style merah yang jelas terlihat, hanya muncul untuk role Administrator
- app/setting/qr-absensi/page.js :	File baru — semua kode QR Absensi dipindahkan ke sini
- app/admin/siswa/page.js :	Hapus kode QR: import, state, useEffect, fungsi, JSX tab, tombol, konstanta
- app/components/AppShell.js :	Tambah SubLink "QR Absensi" di menu Pengaturan
- Sekarang halaman QR Absensi ada di MENU SETTING → QR Absensi, terpisah dari Daftar Siswa. Semua fungsional QR tetap bekerja sama persis seperti sebelumnya.

## 2026-07-05

- Rekap Pelanggaran Wali Kelas: tambah tombol "Hapus Semua" khusus role Administrator (2x konfirmasi ketik "HAPUS SEMUA")
- Optimalisasi Rekap Pelanggaran: hapus query getRekapPelanggaranStats() yang terpisah — stats kini dihitung langsung dari data tabel (hemat 1 DB round-trip, loading lebih cepat)
- Absensi Kehadiran: tambah kolom filter tanggal (date picker) khusus role Administrator
- Absensi Kehadiran: Admin bisa mengisi/edit absensi di hari lampau yang terlewat sekretaris
- Absensi Kehadiran: banner kuning peringatan "Mode Edit Absensi Hari Lampau" saat Admin memilih tanggal bukan hari ini
- Absensi Kehadiran: tombol "Hari Ini" untuk reset ke tanggal sekarang
- Absensi Kehadiran: status isSubmitted otomatis reset saat Admin ganti tanggal
- File diubah: app/wali-kelas/rekap-pelanggaran/page.js, app/absensi/page.js
- notificationActions.js =	FIX BUG: parentMessageEmoji (tidak didefinisikan) → '💬'. Ini adalah akar masalah notif pesan tidak masuk lonceng WK
- parentPortalActions.js =	Tambah 2 fungsi baru: getParentMessages(studentId) untuk ambil riwayat chat, sendWKReplyMessage(studentId, message, senderId) untuk WK kirim balasan
- NotificationCenter.js =	① Import 2 fungsi baru dari parentPortalActions ② Tambah state popup chat (chatPopup, chatMessages, dll) ③ Baris notif klik → cek type parent_message → buka popup chat ④ Tombol "Balas" untuk parent_message → buka popup (bukan redirect ke /portal-ortu) ⑤ Popup chat: header gradient biru, pesan Orang Tua di kiri, balasan WK di kanan, auto-refresh 3 detik, Enter untuk kirim ⑥ Pesan dikelompok per tanggal, scroll otomatis ke bawah
- notificationActions.js =	① deleteOldNotifications default diubah dari 90 hari → 30 hari ② Dipanggil otomatis di getUnreadCount() — setiap kali WK buka lonceng atau refresh notif, data lama terhapus otomatis di background
- parentPortalActions.js	① Tambah deleteOldParentMessages(days = 10) — hapus pesan > 10 hari ② Dipanggil otomatis di getParentMessages() — setiap kali chat dibuka (di lonceng popup atau halaman pusat notif), data lama terhapus otomatis
- notifikasi/page.js =	① Tambah import useMemo, useRef, chat helper functions, getParentMessages, sendWKReplyMessage ② Tambah state popup chat (sama persis dengan NotificationCenter) ③ handleNotifClick: notif parent_message → buka popup chat; selain itu → gunakan action_url normal ④ Tombol notif pesan diubah dari "Balas → /portal-ortu" menjadi "💬 Buka Chat" ⑤ Tambah popup chat lengkap (header, pesan bubble, input, auto-refresh 3 detik, scroll otomatis)

## 2026-07-04

- Fix error "motion is not defined" pada modal detail alumni di halaman Semua Kisah Alumni (app/alumni/page.js) dan Kisah Inspiratif Alumni di HOME (app/components/KisahAlumni.js) — ganti motion.div dengan div + CSS @keyframes
- Fix avatar lingkaran putih tanpa huruf inisial — akar masalah: class gradient Tailwind dinamis (from-blue-400 to-cyan-500) di-purge oleh JIT compiler karena tidak terdeteksi saat build. Solusi: ganti ke inline style background: linear-gradient() dengan warna hex langsung
- Tambahkan avatar lingkaran inisial di samping kiri nama alumni pada carousel Kisah Inspiratif Alumni di halaman HOME
- Avatar di halaman Semua Kisah Alumni tetap di posisi tengah atas kartu
- Ubah grid halaman Semua Kisah Alumni menjadi 2 kolom di HP (grid-cols-2 lg:grid-cols-3)
- Fix filter dropdown Tahun Lulus, Jurusan, Status tidak berfungsi di halaman Semua Kisah Alumni — akar masalah: query dropdown di alumniActions.js menggunakan head: true sehingga hanya mengembalikan count tanpa data rows. Solusi: hapus head: true, ambil data rows, gunakan new Set() untuk nilai unik
- Tambahkan statusConfig dan statusOrder lengkap 9 opsi di KisahAlumni.js dan alumni/page.js: Kuliah, Bekerja, Wirausaha, Kuliah dan Bekerja, Kursus/Pelatihan, Mencari Kerja, TNI/Polri, Gap Year, Lainnya
- Stats mini cards di HOME sekarang menampilkan semua status alumni yang ada datanya (sebelumnya hanya 5 status)
- Hapus fitur "Upload Foto Aktivitas (Opsional)" di halaman Formulir Tracer Studi Lulusan untuk menghemat storage — hapus useRef, fileInputRef, dan section upload. handleSubmit kirim null sebagai file
- Tambahkan opsi TNI/Polri dan Gap Year di pilihan Status Saat Ini pada Formulir Tracer Studi Lulusan (total 9 opsi, sinkron dengan statusConfig di halaman publik)
- File diubah: app/alumni/page.js, app/components/KisahAlumni.js, app/actions/alumniActions.js, app/formulir/tracer-studi/page.js

## 2026-07-03
- Di Supabase SQL	Tambah kolom is_published, is_featured, pin_order + index
- Tab Tracer: tambah 3 tombol per baris — ✅ Publikasikan/Sembunyikan, ⭐ Jadikan Pilihan/Lepas, 📌 Sematkan di Atas
- File baru — Halaman daftar semua kisah alumni dengan search, filter (tahun/jurusan/status/kota), pagination, modal detail

## 2026-07-03 (Pembaruan Dashboard & Beranda)
- Fix pencarian siswa di Entri Reward & Entri Pelanggaran untuk role Wali Kelas: siswa yang muncul hanya dari kelas binaannya
- Akar masalah: kolom jurusan di tabel siswa berformat "TKRO 1" (ikut nomor), sedangkan parsing sebelumnya hanya mengambil parts[1]="TKRO" sehingga tidak cocok
- Perbaikan: gunakan parts.slice(1).join(' ') agar menghasilkan "TKRO 1" yang sesuai dengan data di tabel siswa
- Tambah prioritas ambil kelas langsung dari database (tabel users berdasarkan userId) sebagai sumber utama, fallback ke userData.kelas dari localStorage
- Rekap Pelanggaran Wali Kelas: auto-filter data hanya siswa kelas binaan, dropdown Tingkat & Jurusan disabled untuk WK
- Rekap Pelanggaran Wali Kelas: hapus tombol "Hapus Semua" (hanya Admin yang boleh)
- Rekap Kehadiran: sembunyikan tombol "Reset Semester" dan "Reset Semua (Tahunan)" untuk non-Administrator
- File diubah: app/actions/rewardActions.js, app/actions/pelanggaranActions.js, app/components/EntriReward.js, app/components/EntriPelanggaran.js, app/wali-kelas/rekap-pelanggaran/page.js, app/rekap-kehadiran/page.js
- Dashboard Admin: Stat card Total Reward & Total Pelanggaran diubah dari COUNT (jumlah entri) menjadi SUM (jumlah poin) agar mencerminkan perolehan aktual
- Dashboard Admin: Tabel Top 10 Reward & Pelanggaran ditambahkan kolom kelas+jurusan agar Admin tahu asal kelas siswa
- Dashboard Admin: Query dioptimasi — hapus 2 query count terpisah, hitung total langsung dari data entri
- Dashboard Admin: Label stat card diubah jadi "Total Poin Reward" dan "Total Poin Pelanggaran"
- Beranda Home: Grafik Rekap Reward Terbaik diganti dari data mockup ke data real dari tb_reward_siswa (group by kelas+jurusan, sum poin)
- Beranda Home: Grafik Rekap Pelanggaran Tertinggi diganti dari data mockup ke data real dari tb_pelanggaran_siswa (group by kelas+jurusan, sum poin)
- Tambah server action getHomeRewardChart() di app/actions/rewardActions.js
- Tambah server action getHomePelanggaranChart() di app/actions/pelanggaranActions.js
- File diubah: app/actions/dashboardActions.js, app/actions/rewardActions.js, app/actions/pelanggaranActions.js, app/dashboard/AdminDashboard.js, app/page.js

## 2026-07-02
- Perbaikan sistem notifikasi lonceng: createEditRequest() sekarang benar-benar mengirim - notifikasi ke Admin saat Sekretaris minta revisi absensi
- Perbaikan approveEditRequest() dan rejectEditRequest() sekarang mengirim notifikasi ke pemohon (Sekretaris/WK) dengan pesan yang jelas
- Tambah Strategi 0 di getWaliKelasUserId() dan getSekretarisUserId(): gabungan kelas+jurusan ("X TKRO") untuk mencocokkan format tabel users ("X TKRO 1")
- Icon notifikasi Pengajuan Izin diganti dari 🤒 menjadi 📋 agar mudah dibedakan dengan Sakit
- Ubah jeda getaran lonceng dari 4 detik menjadi 5 detik
- Dokumentasi tabel notifications di DATABASE_SCHEMA.md (type, priority, action_url)
- app/actions/absensiActions.js :
  -- Ganti import baris atas
  -- Ganti seluruh fungsi createEditRequest
  -- Ganti seluruh fungsi approveEditRequest
  -- Ganti seluruh fungsi rejectEditRequest
  -- Pastikan getRoleByUserId hanya ada 1 kali
  -- Hapus duplikat getRoleByUserId

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

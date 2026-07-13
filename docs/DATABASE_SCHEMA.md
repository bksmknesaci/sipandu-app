# Database Schema SIPANDU

## app_settings

* id (int8)
* nama_sekolah (text)
* alamat (text)
* tentang (text)
* visi (text)
* misi (text)
* tim (text)
* facebook (text)
* instagram (text)
* youtube (text)
* tiktok (text)
* logo_url (text)
* hero_images (jsonb)
* major_logos (jsonb)
* kop_logo_dinas (text) -- URL logo dinas untuk KOP Surat PDF
* kop_logo_sekolah (text) -- URL logo sekolah untuk KOP Surat PDF

## siswa

* id (int8)
* nisn (text)
* nama (varchar)
* kelas (varchar)
* jurusan (varchar)
* status (varchar)
* jenis_kelamin (varchar)
* parent_whatsapp (text) -- Nomor WhatsApp orang tua siswa, format internasional Indonesia (628xxxxxxxxxx)

## users

* id (int8)
* nama (varchar)
* username (varchar)
* email (varchar)
* password (varchar)
* role (varchar)
* kelas (varchar)
* whatsapp (varchar)
* status (varchar)
* foto_url (text)
* created_at (timestamptz)

## absensi

* id (int8)
* siswa_id (int8)
* tanggal (date)
* status (varchar)
* input_by (varchar)
* locked (boolean)
* created_at (timestamptz)
* updated_at (timestamptz)
* UNIQUE(siswa_id, tanggal)

## absensi_edit_requests

* id (int8)
* user_id (int8)
* kelas (varchar)
* jurusan (varchar)
* tanggal (date)
* reason (text)
* status (varchar)
* approved_by (int8)
* created_at (timestamptz)
* updated_at (timestamptz)

## Catatan Penggunaan Nilai (Value Constraints)

absensi
* input_by: Menerima nilai 'Sekretaris Kelas', 'Administrator', 'Sistem Otomatis', 'QR Mandiri', 'Sakit/Izin Online'
* status: Menerima nilai 'Hadir', 'Sakit', 'Izin', 'Alpha'

## tb_absensi_sakit_izin

* id (int8)
* tanggal (date)
* jam (time)
* nisn (text)
* nama_siswa (text)
* kelas (varchar)
* jurusan (varchar)
* jenis_absensi (varchar) -- Nilai: 'Sakit', 'Izin'
* alasan (text)
* foto_bukti (text)
* latitude (numeric)
* longitude (numeric)
* akurasi_gps (numeric)
* status_verifikasi (varchar) -- Nilai: 'MENUNGGU VERIFIKASI', 'DISETUJUI', 'DITOLAK'
* verifikator (int8)
* waktu_verifikasi (timestamptz)
* catatan_wali_kelas (text)
* created_at (timestamptz)
* updated_at (timestamptz)

## Catatan Penggunaan Nilai (Value Constraints)
* absensi

* input_by: Ditambahkan nilai 'Sakit/Izin Online', 'QR Mandiri'

## tb_reward_siswa

* id (int8)
* tanggal (date)
* nisn (text)
* nama_siswa (text)
* kelas (varchar)
* jurusan (varchar)
* reward_kode (varchar)
* reward_nama (text)
* reward_poin (int4)
* catatan (text)
* bukti_file (text)
* diberikan_oleh (varchar)
* role_pemberi (varchar)
* created_at (timestamptz)
* updated_at (timestamptz)

## tb_pelanggaran_siswa

* id (int8)
* tanggal (date)
* waktu (time)
* nisn (text)
* nama_siswa (text)
* kelas (varchar)
* jurusan (varchar)
* kategori (varchar)
* jenis_pelanggaran (text)
* poin (int4)
* lokasi (varchar)
* kronologi (text)
* bukti_file (text)
* dicatat_oleh (varchar)
* role_pencatat (varchar)
* catatan_pembinaan (text)
* created_at (timestamptz)
* updated_at (timestamptz)

## tb_penanganan_siswa

* id (BIGSERIAL PRIMARY KEY)
* siswa_id (BIGINT REFERENCES siswa(id) ON DELETE CASCADE)
* nisn (TEXT)
* total_poin (INT DEFAULT 0)
* tahap (VARCHAR(50) DEFAULT 'Pembinaan BK')
* layanan_bk (VARCHAR(50) DEFAULT 'Belum')
* sp1 (BOOLEAN DEFAULT FALSE)
* tgl_sp1 (DATE)
* sp2 (BOOLEAN DEFAULT FALSE)
* tgl_sp2 (DATE)
* sp3 (BOOLEAN DEFAULT FALSE)
* tgl_sp3 (DATE)
* catatan_bk (TEXT)
* status_akhir (VARCHAR(50) DEFAULT 'Aktif')
* updated_at (TIMESTAMPTZ DEFAULT NOW())
* UNIQUE(siswa_id)

## tb_penanganan_history

* id (BIGSERIAL PRIMARY KEY)
* penanganan_id (BIGINT REFERENCES tb_penanganan_siswa(id) ON DELETE CASCADE)
* updated_by (BIGINT)
* action (TEXT)
* note (TEXT)
* created_at (TIMESTAMPTZ DEFAULT NOW())

## tb_pindah_keluar

* id (BIGSERIAL PRIMARY KEY)
* siswa_id (BIGINT REFERENCES siswa(id) ON DELETE SET NULL)
* nisn (TEXT)
* nama (TEXT)
* kelas (VARCHAR)
* jurusan (VARCHAR)
* jenis_kelamin (VARCHAR)
* status (VARCHAR(50)) -- Nilai: 'Pindah', 'Keluar'
* tanggal_keputusan (DATE)
* alasan (TEXT)
* ditetapkan_oleh (BIGINT)
* created_at (TIMESTAMPTZ DEFAULT NOW())

## tb_pindah_keluar_dokumen

* id (BIGSERIAL PRIMARY KEY)
* pindah_keluar_id (BIGINT REFERENCES tb_pindah_keluar(id) ON DELETE CASCADE)
* file_url (TEXT)
* file_name (TEXT)
* created_at (TIMESTAMPTZ DEFAULT NOW())

## form_tracer_studi (Update - Tambahkan kolom kontrol publikasi alumni)

* id (BIGSERIAL PRIMARY KEY)
* nisn (TEXT)
* nama (TEXT)
* tahun_lulus (VARCHAR)
* jurusan (VARCHAR)
* whatsapp (VARCHAR)
* email (VARCHAR)
* status_saat_ini (VARCHAR) -- Nilai: 'Kuliah', 'Bekerja', 'Wirausaha', dll
* kuliah_nama_pt (TEXT), kuliah_prodi (VARCHAR), kuliah_jenjang (VARCHAR), kuliah_kota (VARCHAR), kuliah_provinsi (VARCHAR)
* bekerja_nama_perusahaan (TEXT), bekerja_jabatan (VARCHAR), bekerja_bidang (VARCHAR), bekerja_kota (VARCHAR), bekerja_provinsi (VARCHAR)
* wirausaha_nama (TEXT), wirausaha_bidang (VARCHAR), wirausaha_lama (VARCHAR)
testimoni (TEXT)
* foto_aktivitas_url (TEXT)
* created_at (TIMESTAMPTZ DEFAULT NOW())
* is_published (bool)
* is_featured (bool)
* pin_order (int4) 

## form_pemetaan_karir

* id (BIGSERIAL PRIMARY KEY)
* nisn (TEXT)
* nama (TEXT)
* kelas (VARCHAR)
* jurusan (VARCHAR)
* minat_karir (JSONB) -- Array string minat karir
* cita_cita (TEXT)
* rencana_setelah_lulus (VARCHAR)
* pt_impian (TEXT)
* prodi_impian (TEXT)
* perusahaan_impian (TEXT)
* keterangan_tambahan (TEXT)
* created_at (TIMESTAMPTZ DEFAULT NOW())

## form_snbp_snbt

* id (BIGSERIAL PRIMARY KEY)
* nisn (TEXT)
* nama (TEXT)
* kelas (VARCHAR)
* jurusan (VARCHAR)
* whatsapp (VARCHAR)
* jalur_pendaftaran (VARCHAR) -- Nilai: 'SNBP', 'SNBT', 'SNBP & SNBT'
* pt_tujuan (TEXT)
* prodi_1 (TEXT), prodi_2 (TEXT), prodi_3 (TEXT)
* status_hasil (VARCHAR DEFAULT 'Belum Pengumuman') -- Nilai: 'Belum Pengumuman', 'Lulus', 'Tidak Lulus', 'Cadangan'
* bukti_file_url (TEXT)
* catatan (TEXT)
* created_at (TIMESTAMPTZ DEFAULT NOW())

## Supabase Storage Buckets (Update)
* logos (public) -- Untuk logo jurusan
* bukti-sakit-izin (public) -- Untuk foto bukti sakit/izin siswa
* dokumen-penanganan (public) -- Untuk dokumen pendukung SP/Pindah/Keluar
* bukti-formulir (public) -- Untuk upload bukti formulir (foto aktivitas, bukti SNBP/SNBT)
* news-media (public) -- Untuk upload cover/foto berita (prestasi & sekolah)

## effective_days

* id (int8)
* date (date)
* holiday_name (text)
* category (varchar) -- Nilai: 'Nasional', 'Sekolah', 'Semester', 'Ujian', 'Kegiatan Sekolah', 'Khusus'
* description (text)
* created_by (int8)
* created_at (timestamptz)
* updated_at (timestamptz)

## academic_calendar

* id (int8)
* school_year (varchar)
* semester (varchar) -- Nilai: 'Ganjil', 'Genap'
* start_date (date)
* end_date (date)
* pas_date (date)
* pat_date (date)
* pkl_date (date)
* mpls_date (date)
* semester_break_date (date)
* is_active (boolean)
* created_at (timestamptz)

## effective_day_logs

* id (int8)
* admin_id (int8)
* activity (text)
* detail (jsonb)
* created_at (timestamptz)

## news_posts

* id (int8)
* title (text)
* slug (text) -- Unique
* excerpt (text)
* content (text)
* cover_url (text)
* category (varchar) -- Nilai: 'Siswa Berprestasi', 'Berita Sekolah'
* status (varchar) -- Nilai: 'Draft', 'Publish'
* featured (boolean)
* views (int4)
* author_id (int8)
* published_at (timestamptz)
* created_at (timestamptz)
* updated_at (timestamptz)

## Format URL cover_url di news_posts

* Nilai bisa berupa: URL lengkap (https://xxx.supabase.co/...), path relatif (/storage/v1/object/public/...), atau null (belum ada cover)
* Komponen frontend menggunakan fungsi getImageUrl() untuk menangani semua format URL tersebut secara otomatis

## parent_messages

* id (uuid, primary key, default: gen_random_uuid())
* student_id (bigint, references siswa(id) on delete cascade)
* sender_type (varchar(20)) -- Nilai: 'Orang Tua', 'Wali Kelas'
* sender_id (bigint)
* message (text)
* is_read (boolean, default: false)
* created_at (timestamptz, default: now())

## parent_notifications

* id (uuid, primary key, default: gen_random_uuid())
* student_id (bigint, references siswa(id) on delete cascade)
* title (text)
* message (text)
* type (varchar(50))
* is_read (boolean, default: false)
* created_at (timestamptz, default: now())
* Catatan Tambahan

## Format URL cover_url di news_posts

* Nilai bisa berupa: URL lengkap (https://xxx.supabase.co/...), path relatif (/storage/v1/object/public/...), atau null (belum ada cover)
* Komponen frontend menggunakan fungsi getImageUrl() untuk menangani semua format URL tersebut secara otomatis

## RLS Policy Tambahan

* parent_messages: "Admin full access messages" — FOR ALL USING (true)
* parent_notifications: "Admin full access notifications" — FOR ALL USING (true)
Index Tambahan
* idx_parent_messages_student ON parent_messages(student_id)
* idx_parent_notifications_student ON parent_notifications(student_id)

## Notifications

* id (uuid)
* user_id (int8)
* title (text)
* message (text)
* type (text)
* priority (text)
* reference_type (text)
* reference_id (text)
* action_url (text)
* is_read (bool)
* created_at (timestamptz)

## qr_settings

* id (int8)
* setting_key (varchar) -- Nilai: 'gps_latitude', 'gps_longitude', 'gps_radius', 'jam_masuk', 'jam_terlambat', 'jam_tutup'
* setting_value (text)
* created_at (timestamptz)
* updated_at (timestamptz)
* UNIQUE(setting_key)

Catatan Penggunaan Nilai (Value Constraints)
* notifications
* type: Menerima nilai 'sick_permission', 'parent_message', 'attendance_revision', 'reward', 'violation', 'student_handling', 'system'
* priority: Menerima nilai 'INFO', 'SUCCESS', 'WARNING', 'DANGER'
* action_url: Bisa berupa URL lengkap (https://...) atau null

## Catatan Penggunaan Nilai (Value Constraints)

* qr_settings
* setting_key: Menerima nilai 'gps_latitude', 'gps_longitude', 'gps_radius', 'jam_masuk', 'jam_terlambat', 'jam_tutup'
* setting_value: Bisa berupa angka (koordinat, radius) atau format waktu (HH:MM), atau null (belum diatur)

## whatsapp_config

* id (int8, primary key, default: 1)
* api_token (text) -- Token API Fonnte (disimpan terenkripsi, tidak ditampilkan lengkap di frontend)
* device_id (text) -- Device ID Fonnte (opsional, jika memiliki lebih dari 1 device)
* sender_name (varchar) -- Nama pengirim yang muncul di WhatsApp penerima
* mode (varchar) -- Nilai: 'testing', 'production'
* is_connected (boolean, default: false)
* gateway_phone (text) -- Nomor WhatsApp gateway yang terhubung
* device_name (text) -- Nama device yang terdeteksi oleh Fonnte
* last_sync_at (timestamptz)
* send_alpha (boolean, default: true) -- Kirim WA otomatis ke ortu siswa Alpha saat finalisasi absensi
* send_terlambat (boolean, default: false) -- Segera hadir (disiapkan untuk pengembangan selanjutnya)
* send_pulang_awal (boolean, default: false) -- Pulang awal (disiapkan untuk pengembangan selanjutnya)
* updated_at (timestamptz, default: now())
* CONSTRAINT whatsapp_config_single_row CHECK (id = 1)

## whatsapp_logs

* id (bigserial, primary key)
* student_id (bigint, references siswa(id) on delete set null)
* phone (text) -- Nomor WhatsApp tujuan (sudah dinormalisasi ke format internasional)
* message (text) -- Isi pesan WhatsApp yang dikirim
* status (varchar, default: 'pending') -- Nilai: 'pending', 'success', 'failed'
* response (text) -- Response mentah dari Fonnte API (JSON string)
* sent_by (bigint) -- ID user yang memicu pengiriman
* sent_at (timestamptz) -- Waktu pengiriman
* retry_count (int, default: 0) -- Jumlah percobaan ulang
* created_at (timestamptz, default: now())

## pkl_profiles
* id (BIGSERIAL PRIMARY KEY)
* student_id (BIGINT, references siswa(id) ON DELETE CASCADE)
* company_name (TEXT)
* company_address (TEXT)
* industry_supervisor (TEXT)
* start_date (DATE)
* end_date (DATE)
* work_start_time (TIME)
* work_end_time (TIME)
* work_days (JSONB, default: '["Senin","Selasa","Rabu","Kamis","Jumat"]'::jsonb)
* latitude (NUMERIC(10,7))
* longitude (NUMERIC(10,7))
* radius_meter (INT, default: 50)
* status (VARCHAR(50), default: 'Belum Mulai') -- Nilai: 'Belum Mulai', 'Berjalan', 'Selesai'
* created_at (TIMESTAMPTZ, default: NOW())
* updated_at (TIMESTAMPTZ, default: NOW())
* CONSTRAINT pkl_profiles_student_unique UNIQUE(student_id)
* Catatan Penggunaan Nilai (Value Constraints)

## pkl_profiles
* status: Menerima nilai 'Belum Mulai', 'Berjalan', 'Selesai'
* work_days: Array string nama hari dalam bahasa Indonesia, contoh: ["Senin","Selasa","Rabu","Kamis","Jumat"]
* radius_meter: Dikunci permanen 50 meter, tidak dapat diubah oleh siswa

## pkl_attendance
* id (BIGSERIAL PRIMARY KEY)
* student_id (BIGINT, references siswa(id) ON DELETE CASCADE)
* attendance_date (DATE, not null)
* attendance_type (VARCHAR(20)) -- Nilai: 'Hadir', 'Sakit', 'Izin'
* check_in_time (TIME)
* check_out_time (TIME)
* check_in_latitude (NUMERIC(10,7))
* check_in_longitude (NUMERIC(10,7))
* check_in_address (TEXT)
* check_out_latitude (NUMERIC(10,7))
* check_out_longitude (NUMERIC(10,7))
* check_out_address (TEXT)
* selfie_url (TEXT) -- Foto selfie absen masuk, otomatis dihapus > 1 hari
* check_out_selfie_url (TEXT) -- Foto selfie absen pulang, otomatis dihapus > 1 hari
* note (TEXT) -- Alasan sakit/izin
* is_late (BOOLEAN, default: false)
* status (VARCHAR(20), default: 'Hadir') -- Nilai: 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat', 'Libur'
* created_at (TIMESTAMPTZ, default: NOW())
* updated_at (TIMESTAMPTZ, default: NOW())
* CONSTRAINT pkl_attendance_unique UNIQUE(student_id, attendance_date)
* Catatan Penggunaan Nilai (Value Constraints)

## pkl_attendance
* attendance_type: Menerima nilai 'Hadir', 'Sakit', 'Izin'
* status: Menerima nilai 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat', 'Libur'
* Status 'Terlambat' dihitung otomatis saat check_in_time melebihi work_start_time + 15 menit toleransi
* Status 'Libur' dihitung otomatis di Rekap Bulanan/Semester berdasarkan work_days di pkl_profiles
* Status 'Alpha' dihitung otomatis di Rekap Bulanan/Semester untuk hari kerja tanpa record absensi
* Foto selfie (selfie_url, check_out_selfie_url) dihapus otomatis oleh cleanupOldPklSelfies setelah > 1 hari

## Supabase Storage Buckets (Update)
* pkl-selfies (public) -- Untuk foto selfie absensi PKL (masuk & pulang), otomatis dihapus > 1 hari

## Index Tambahan
* idx_pkl_profiles_student ON pkl_profiles(student_id)
* idx_pkl_profiles_status ON pkl_profiles(status)
* idx_pkl_attendance_student ON pkl_attendance(student_id)
* idx_pkl_attendance_date ON pkl_attendance(attendance_date)
* idx_pkl_attendance_status ON pkl_attendance(status)

## RLS Policy Tambahan
* pkl_profiles: "srv_pkl_profiles" — FOR ALL USING (true) WITH CHECK (true)
* pkl_attendance: "srv_pkl_attendance" — FOR ALL USING (true) WITH CHECK (true)
* pkl-selfies (storage): "srv_pkl_selfies" — FOR ALL USING (bucket_id = 'pkl-selfies') WITH CHECK (bucket_id = 'pkl-selfies')

## Catatan Penggunaan Nilai (Value Constraints)
* pkl_profiles
* radius_meter: Dikunci permanen 50 meter, tidak dapat diubah oleh siswa

## Perbaikan Login & Filter
* Kolom kelas di tabel users hanya berisi tingkat (contoh: "XII"), bukan gabungan kelas+jurusan
* Kolom jurusan di tabel users berisi nama jurusan (contoh: "KL 2"), terpisah dari kolom kelas
* Server action getUserKelasInfo(userId) mengambil kedua kolom secara terpisah dari tabel users untuk keperluan filter
* Filter Sekretaris/Wali Kelas di halaman Absensi dan Rekap Kehadiran wajib menggunakan data dari database (bukan localStorage) agar mendapat kelas+jurusan yang lengkap

## Catatan Penggunaan Nilai (Update — 2026-07-19)
* siswa
* Kolom nama, kelas, jurusan, jenis_kelamin memperbolehkan nilai NULL — digunakan saat siswa mendaftar sendiri via halaman Absensi PKL dengan NISN saja, data lengkap diisi kemudian melalui form setup profil
* Kolom status default 'Aktif' saat auto-insert dari halaman Absensi PKL

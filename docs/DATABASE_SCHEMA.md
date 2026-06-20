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

## siswa

* id (int8)
* nisn (text)
* nama (varchar)
* kelas (varchar)
* jurusan (varchar)
* status (varchar)
* jenis_kelamin (varchar)

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

## form_tracer_studi

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
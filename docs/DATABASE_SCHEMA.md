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
* nis (text)
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

## Supabase Storage Buckets

* logos (public) -- Untuk logo jurusan
* bukti-sakit-izin (public) -- Untuk foto bukti sakit/izin siswa

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
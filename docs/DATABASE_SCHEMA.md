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
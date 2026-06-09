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
# Folder Structure SIPANDU

SIPANDU-APP/
├── .next/
│   └── dev/
│
├── app/
│   ├── absen-mandiri/
│   │   └── page.js
│   │
│   ├── absen-sakit-izin/
│   │   └── page.js
│   │
│   ├── absensi/
│   │   └── page.js
│   │
│   ├── actions/
│   │   ├── absensiActions.js
│   │   ├── alumniActions.js
│   │   ├── cariSiswaActions.js
│   │   ├── dashboardActions.js
│   │   ├── effectiveDaysActions.js
│   │   ├── formulirActions.js
│   │   ├── majorLogoActions.js
│   │   ├── newsActions.js
│   │   ├── notificationActions.js
│   │   ├── parentPortalActions.js
│   │   ├── pelanggaranActions.js
│   │   ├── penangananActions.js
│   │   ├── penanggungJawabActions.js
│   │   ├── qrAbsensiActions.js
│   │   ├── rekapActions.js
│   │   ├── rewardActions.js
│   │   ├── siswaActions.js
│   |   ├── userActions.js
│   │   └── whatsappActions.js
│   │
│   ├── admin/
│   │   ├── rekap-formulir/
│   │   │   └── page.js
│   │   ├── rekap-reward/
│   │   │   └── page.js
│   │   ├── siswa/
│   │   │   ├── penanganan/
│   │   │   │   └── page.js
│   │   │   ├── pindah-keluar/
│   │   │   │   └── page.js
│   |   │   └── page.js
│   │   └── users/
│   │       └── page.js
│   │
│   ├── alumni/
│   │   └── page.js
│   │
│   ├── berita/
│   │   └── [slug]/
│   │       └── page.js
│   │
│   ├── berita-sekolah/
│   │   └── page.js
│   │
│   ├── cari-data-siswa/
│   │   ├── [id]/
│   │   │   └── page.js
│   │   └── page.js
│   │
│   ├── components/
│   │   ├── AksesCepatInformasi.js
│   │   ├── AppShell.js
│   │   ├── CariDataSiswaWidget.js
│   │   ├── DaftarTidakHadir.js
│   │   ├── DashboardNotifications.js
│   |   ├── EntriPelanggaran.js
│   │   ├── EntriReward.js
│   │   ├── KisahAlumni.js
│   │   ├── MajorLogoManager.js
│   │   ├── NotificationCenter.js
│   │   ├── PJInfoCard.js
│   │   ├── RekapPelanggaran.js
│   │   ├── RekapReward.js
│   │   ├── RekapSiswa.js
│   │   ├── SiswaBerprestasiBerita.js
│   │   └── TopReward.js
│   │
│   ├── dashboard/
│   │   ├── AdminDashboard.js
│   │   ├── OsisDashboard.js
│   │   ├── page.js
│   │   ├── SekretarisDashboard.js
│   │   └── WaliKelasDashboard.js
│   │
│   ├── formulir/
│   │   ├── pemetaan-karir/
│   │   │   └── page.js
│   │   ├── snbp-snbt/
│   │   │   └── page.js
│   │   ├── tracer-studi/
│   │   │   └── page.js
│   │   └── page.js
│   │
│   ├── login/
│   │   └── page.js
│   │
│   ├── mobile/
│   │   ├── admin/
│   │   │   └── page.js
│   │   ├── osis/
│   │   │   └── page.js
│   │   ├── sekretaris/
│   │   │   └── page.js
│   │   ├── siswa/
│   │   │   └── page.js
│   │   └── wali-kelas/
│   │       └── page.js
│   │
│   ├── notifikasi/
│   │   └── page.js
│   │
│   ├── osis/
│   │   ├── entri-pelanggaran/
│   │   │   └── page.js
│   │   └── entri-reward/
│   │       └── page.js
│   │
│   ├── portal-ortu/
│   │   └── page.js
│   │
│   ├── rekap-kehadiran/
│   │   └── page.js
│   │
│   ├── semua-berita/
│   │   └── page.js
│   │
│   ├── setting/
│   │   ├── hari-efektif/
│   │   │   └── page.js
│   │   |── konfigurasi-whatsapp/
│   │   |   └── page.js
│   │   ├── penanggung-jawab/
│   │   │   └── page.js
│   │   ├── pos-berita/
│   │   │   └── page.js
│   │   ├── profil/
│   │   │   └── page.js
│   │   └── qr-absensi/
│   │       └── page.js
│   │
│   ├── siswa-berprestasi/
│   │   └── page.js
│   │
│   ├── tentang/
│   │   └── page.js
│   │
│   ├── wali-kelas/
│   │   ├── entri-pelanggaran/
│   │   │   └── page.js
│   │   ├── entri-reward/
│   │   │   └── page.js
│   │   ├── rekap-pelanggaran/
│   │   │   └── page.js
│   │   └── rekap-sakit-izin/
│   │       └── page.js
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.js
│
├── docs/
│   ├── CHANGELOG.md
│   ├── DATABASE_SCHEMA.md
│   ├── FEATURE_LIST.md
│   ├── FOLDER_STRUCTURE.md
│   └── PROJECT_CONTEXT.md
│
├── lib/
│   ├── getCurrentUser.js
│   ├── kopSuratHelper.js
│   ├── supabase-admin.js
│   └── supabase.js
│
├── node_modules/
│
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── logo-dinas.png
│   ├── logo-sekolah.png
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .env.local
├── .gitignore
├── AGENTS.md
├── CALUDE.md
├── eslint.config.mjs
├── next_env.d.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── README.md
└── tsconfig.json
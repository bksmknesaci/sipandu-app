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
│   │   ├── majorLogoActions.js
│   │   ├── pelanggaranActions.js   
│   │   ├── rekapActions.js
│   │   ├── rewardActions.js       
│   │   ├── siswaActions.js
│   │   └── userActions.js
│   │
│   ├── admin/
│   │   ├── rekap-reward/          
│   │   │   └── page.js
│   │   ├── siswa/
│   │   │   ├── penanganan/
│   │   │   │   └── page.js
│   │   │   └── page.js
│   │   └── users/
│   │       └── page.js
│   │
│   ├── components/
│   │   ├── AksesCepatInformasi.js
│   │   ├── AppShell.js
│   │   ├── DaftarTidakHadir.js
│   │   ├── EntriPelanggaran.js     
│   │   ├── EntriReward.js          
│   │   ├── MajorLogoManager.js
│   │   ├── RekapPelanggaran.js
│   │   ├── RekapReward.js
│   │   ├── RekapSiswa.js
│   │   ├── SiswaBerprestasiBerita.js
│   │   └── TopReward.js
│   │
│   ├── login/
│   │   └── page.js
│   │
│   ├── osis/
│   │   ├── entri-pelanggaran/           
│   │   │   └── page.js
│   │   └── entri-reward/                
│   │       └── page.js
│   │
│   ├── rekap-kehadiran/   
│   │   └── page.js
│   │
│   ├── setting/
│   │   └── profil/
│   │       └── page.js
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
│   ├── favicon.ico
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

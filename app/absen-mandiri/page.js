"use client";

import React from 'react';
import { UserCheck } from 'lucide-react';

export default function AbsenMandiriPage() {
  return (
    <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-10 rounded-2xl shadow-md border text-center max-w-md">
        <div className="bg-blue-50 p-4 rounded-full inline-block mb-5">
          <UserCheck size={40} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Absen Hadir Mandiri</h1>
        <p className="text-gray-500 text-sm">
          Halaman ini sedang dalam pengembangan. Fitur absensi mandiri siswa akan segera tersedia.
        </p>
      </div>
    </div>
  );
}
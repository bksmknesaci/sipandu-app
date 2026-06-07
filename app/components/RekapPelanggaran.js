"use client";

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ============================================
// DATA KATEGORI PELANGGARAN
// ============================================
const pelanggaranRingan = [
  { jenis: 'Terlambat', poin: 1 },
  { jenis: 'Kelengkapan Atribut', poin: 1 },
  { jenis: 'Rambut Panjang', poin: 1 },
];

const pelanggaranSedang = [
  { jenis: 'Bolos Sekolah', poin: 2 },
  { jenis: 'Bolos Pelajaran', poin: 2 },
  { jenis: 'Mencoret Seragam', poin: 2 },
];

const pelanggaranBerat = [
  { jenis: 'Mencuri', poin: 3 },
  { jenis: 'Bullying', poin: 3 },
  { jenis: 'Berjudi', poin: 3 },
  { jenis: 'Merokok', poin: 3 },
  { jenis: 'Berkelahi', poin: 3 },
  { jenis: 'Membawa Sajam', poin: 3 },
  { jenis: 'Tawuran', poin: 3 },
  { jenis: 'Narkoba', poin: 3 },
];

// ============================================
// DATA AMBANG BATAS
// ============================================
const ambangRingan = [
  { frekuensi: '10x', rentang: '1 s/d 10', tindakLanjut: 'Pembinaan Wali Kelas', bg: '#FEF9C3', border: '#EAB308' },
  { frekuensi: '15x', rentang: '11 s/d 15', tindakLanjut: 'Pembinaan Wali Kelas & Layanan BK + SP1', bg: '#FFF7ED', border: '#F97316' },
  { frekuensi: '20x', rentang: '16 s/d 20', tindakLanjut: 'Pemanggilan Orang Tua Siswa + SP2', bg: '#FFE4E6', border: '#F43F5E' },
  { frekuensi: '25x', rentang: '21 s/d 25', tindakLanjut: 'Pemanggilan Orang Tua Siswa + SP3', bg: '#FEE2E2', border: '#DC2626' },
];

const ambangSedang = [
  { frekuensi: '1x', rentang: '1 s/d 1', tindakLanjut: 'Pembinaan Wali Kelas', bg: '#FEF9C3', border: '#EAB308' },
  { frekuensi: '2x', rentang: '2 s/d 2', tindakLanjut: 'Pembinaan Wali Kelas & Layanan BK + SP1', bg: '#FFF7ED', border: '#F97316' },
  { frekuensi: '3x', rentang: '3 s/d 3', tindakLanjut: 'Pemanggilan Orang Tua Siswa + SP2', bg: '#FFE4E6', border: '#F43F5E' },
  { frekuensi: '4x', rentang: '4 s/d 4', tindakLanjut: 'Pemanggilan Orang Tua Siswa + SP3', bg: '#FEE2E2', border: '#DC2626' },
];

const ambangBerat = [
  { frekuensi: '1x', rentang: '1 s/d 1', tindakLanjut: 'Pembinaan Wali Kelas', bg: '#FEF9C3', border: '#EAB308' },
  { frekuensi: '2x', rentang: '2 s/d 2', tindakLanjut: 'Pembinaan Wali Kelas & Layanan BK + SP1', bg: '#FFF7ED', border: '#F97316' },
  { frekuensi: '3x', rentang: '3 s/d 3', tindakLanjut: 'Pemanggilan Orang Tua Siswa + SP2', bg: '#FFE4E6', border: '#F43F5E' },
  { frekuensi: '4x', rentang: '4 s/d 4', tindakLanjut: 'Pemanggilan Orang Tua Siswa + SP3', bg: '#FEE2E2', border: '#DC2626' },
];

// ============================================
// KOMPONEN TABEL KATEGORI
// ============================================
function KategoriTable({ label, color, data }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>
          {label}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#F3F4F6]">
              <th className="py-3 px-4 text-black font-bold">Jenis Pelanggaran</th>
              <th className="py-3 px-4 text-black font-bold text-center">Poin</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                <td className="py-3 px-4 text-gray-700">{item.jenis}</td>
                <td className="py-3 px-4 text-center font-semibold" style={{ color: color }}>{item.poin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// KOMPONEN TABEL AMBANG BATAS
// ============================================
function AmbangBatasTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-[#F3F4F6]">
            <th className="py-3 px-4 text-black font-bold text-center">Frekuensi Maks</th>
            <th className="py-3 px-4 text-black font-bold text-center">Rentang (Kali)</th>
            <th className="py-3 px-4 text-black font-bold">Tindak Lanjut / Layanan BK</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b border-[#E5E7EB] transition-colors" style={{ backgroundColor: item.bg }}>
              <td className="py-3 px-4 text-center font-bold" style={{ color: item.border }}>{item.frekuensi}</td>
              <td className="py-3 px-4 text-center text-gray-700">{item.rentang}</td>
              <td className="py-3 px-4 text-gray-800 font-medium">{item.tindakLanjut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// KOMPONEN UTAMA
// ============================================
export default function RekapPelanggaran({ data }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
      
      {/* Header Grafik */}
      <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <AlertTriangle className="text-red-500" size={20} /> Rekap Pelanggaran Tertinggi
      </h3>

      {/* Grafik Batang */}
      <div className="h-52 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="pelanggaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tombol Toggle Accordion */}
      <div className="flex justify-center mt-5">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold py-2.5 px-5 rounded-[10px] transition-all duration-300 active:scale-95 shadow-sm"
        >
          {isOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          {isOpen ? 'Sembunyikan Kategori Pelanggaran' : 'Lihat Kategori Pelanggaran'}
        </button>
      </div>

      {/* ============================================
          ACCORDION CONTENT
      ============================================ */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="bg-white rounded-xl shadow-md p-5 md:p-6 border border-gray-100 space-y-8">
          
          {/* ==============================
              BAGIAN 1: KATEGORI PELANGGARAN
          ============================== */}
          <div>
            <h4 className="text-lg font-bold text-[#1E40AF] mb-5">Informasi Kategori Pelanggaran</h4>
            <KategoriTable label="RINGAN" color="#EAB308" data={pelanggaranRingan} />
            <KategoriTable label="SEDANG" color="#F97316" data={pelanggaranSedang} />
            <KategoriTable label="BERAT" color="#DC2626" data={pelanggaranBerat} />
          </div>

          {/* ==============================
              BAGIAN 2: AMBANG BATAS
          ============================== */}
          <div>
            <h4 className="text-xl md:text-2xl font-bold text-[#0F2F6D] mb-6" style={{ fontWeight: 700, fontSize: '23px' }}>
              Ambang Batas dan Tindak Lanjut
            </h4>

            {/* --- PELANGGARAN RINGAN --- */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#EAB308]">
                  RINGAN
                </span>
                <span className="text-sm font-semibold text-gray-700">POIN 1</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Berlaku untuk:</span> Terlambat, Kelengkapan Atribut, Rambut Panjang
                </p>
              </div>
              <AmbangBatasTable data={ambangRingan} />
            </div>

            {/* --- PELANGGARAN SEDANG --- */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#F97316]">
                  SEDANG
                </span>
                <span className="text-sm font-semibold text-gray-700">POIN 2</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Berlaku untuk:</span> Bolos Sekolah, Bolos Pelajaran, Mencoret Seragam
                </p>
              </div>
              <AmbangBatasTable data={ambangSedang} />
            </div>

            {/* --- PELANGGARAN BERAT --- */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#DC2626]">
                  BERAT
                </span>
                <span className="text-sm font-semibold text-gray-700">POIN 3</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Berlaku untuk:</span> Mencuri, Bullying, Berjudi, Merokok, Berkelahi, Membawa Sajam, Tawuran, Narkoba
                </p>
              </div>
              <AmbangBatasTable data={ambangBerat} />
            </div>

            {/* --- CATATAN KHUSUS --- */}
            <div className="bg-[#FFF7ED] border-l-[5px] border-[#F97316] p-4 rounded-[10px]">
              <h5 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#F97316]" />
                Ketentuan Khusus
              </h5>
              <ul className="space-y-1 text-xs md:text-sm text-gray-700">
                <li>• Merokok → langsung diberikan <span className="font-bold text-[#F97316]">SP1</span></li>
                <li>• Berkelahi → langsung diberikan <span className="font-bold text-[#F97316]">SP1</span></li>
                <li>• Membawa Sajam → langsung diberikan <span className="font-bold text-[#F97316]">SP1</span></li>
                <li>• Tawuran → langsung diberikan <span className="font-bold text-[#DC2626]">SP2</span></li>
                <li>• Narkoba → langsung diberikan <span className="font-bold text-[#DC2626]">SP3</span></li>
              </ul>
            </div>
          </div>

          {/* ==============================
              BAGIAN 3: FORCE MAJEURE
          ============================== */}
          <div className="bg-[#FEF2F2] border-l-[6px] border-[#DC2626] p-5 rounded-[12px]">
            <h5 className="font-bold text-gray-800 mb-3 text-base flex items-center gap-2">
              <AlertTriangle size={20} className="text-[#DC2626]" />
              FORCE MAJEURE
            </h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              Tindakan atau pelanggaran yang bersifat hukum dan asusila <span className="font-bold">(terbukti menikah atau hamil di luar nikah)</span>, peserta didik dikembalikan kepada orang tua tanpa didahului Surat Peringatan <span className="font-bold">(SP1, SP2 maupun SP3)</span>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
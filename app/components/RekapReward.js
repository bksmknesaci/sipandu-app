"use client";

import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ============================================
// DATA MOCKUP KATEGORI REWARD (UPDATED)
// ============================================
const rewardCategories = [
  { no: 1, kode: 'R1', jenis: 'Melaksanakan praktik-praktik keagamaan', poin: 20 },
  { no: 2, kode: 'R2', jenis: 'Melaporkan tindakan pelanggaran', poin: 20 },
  { no: 3, kode: 'R3', jenis: 'Peringkat pertama di kelas', poin: 20 },
  { no: 4, kode: '', jenis: 'Peringkat 5 besar di kelas', poin: 15 },
  { no: 5, kode: '', jenis: 'Aktif dalam kegiatan belajar', poin: 10 },
  { no: 6, kode: '', jenis: 'Berprestasi tingkat sekolah', poin: 10 },
  { no: 7, kode: 'R4', jenis: 'Tidak pernah melanggar tatib satu semester', poin: 30 },
  { no: 8, kode: 'R5', jenis: 'Terlibat dalam aksi/bakti sosial', poin: 15 },
  { no: 9, kode: 'R6', jenis: 'Menjadi ketua OSIS', poin: 20 },
  { no: 10, kode: '', jenis: 'Menjadi pengurus OSIS', poin: 10 },
  { no: 11, kode: '', jenis: 'Menjadi ketua ekstrakurikuler', poin: 15 },
  { no: 12, kode: 'R7', jenis: 'Menjadi petugas upacara', poin: 10 },
  { no: 13, kode: '', jenis: 'Menjadi duta/pertukaran pelajar', poin: 30 },
  { no: 14, kode: 'R8', jenis: 'Aktif ekstrakurikuler wajib', poin: 10 },
  { no: 15, kode: '', jenis: 'Aktif ekstrakurikuler lain', poin: 10 },
  { no: 16, kode: '', jenis: 'Juara tingkat sekolah', poin: 5 },
  { no: 17, kode: '', jenis: 'Juara tingkat kab/kota', poin: 20 },
  { no: 18, kode: '', jenis: 'Juara tingkat provinsi', poin: 30 },
  { no: 19, kode: '', jenis: 'Juara tingkat nasional', poin: 40 },
  { no: 20, kode: 'R9', jenis: 'Karya inovatif lingkungan', poin: 20 },
  { no: 21, kode: 'R10', jenis: 'Aktif kewirausahaan di sekolah', poin: 10 },
];

export default function RekapReward({ data }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
      
      {/* Header Grafik */}
      <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Award className="text-blue-500" size={20} /> Rekap Reward Terbaik
      </h3>

      {/* Grafik Batang */}
      <div className="h-52 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="reward" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tombol Toggle Accordion */}
      <div className="flex justify-center mt-5">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-2.5 px-5 rounded-[10px] transition-all duration-300 active:scale-95 shadow-sm"
        >
          {isOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          {isOpen ? 'Sembunyikan Kategori Reward' : 'Lihat Kategori Reward'}
        </button>
      </div>

      {/* Accordion Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          
          {/* Judul Tabel */}
          <h4 className="text-lg font-bold text-[#1E40AF] mb-4">Informasi Kategori dan Poin Reward</h4>

          {/* Tabel dengan Scroll Horizontal untuk Mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F3F4F6]">
                  <th className="py-3 px-4 text-black font-bold rounded-tl-lg">No</th>
                  <th className="py-3 px-4 text-black font-bold">Kode</th>
                  <th className="py-3 px-4 text-black font-bold">Jenis Penghargaan</th>
                  <th className="py-3 px-4 text-black font-bold rounded-tr-lg text-center">Poin</th>
                </tr>
              </thead>
              <tbody>
                {rewardCategories.map((item) => (
                  <tr key={item.no} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-4 text-gray-600">{item.no}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{item.kode || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">{item.jenis}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">{item.poin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Keterangan Peringkat */}
          <div className="bg-[#F9FAFB] border-l-4 border-[#F59E0B] p-4 mt-4 rounded-lg">
            <h5 className="font-bold text-gray-800 mb-2 text-sm">Keterangan Peringkat:</h5>
            <ul className="space-y-1 text-xs md:text-sm text-gray-600">
              <li>• Skor 100 – 125 Poin : <span className="font-semibold">Anugerah Waluya Muda</span></li>
              <li>• Skor 126 – 150 Poin : <span className="font-semibold">Anugerah Waluya Madya</span></li>
              <li>• Skor &gt; 150 Poin : <span className="font-semibold">Anugerah Waluya Utama</span></li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
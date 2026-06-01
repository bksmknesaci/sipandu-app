"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Mengambil koneksi Supabase yang kita buat di awal
import Link from 'next/link';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';

export default function DaftarSiswa() {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);

    // Fungsi untuk mengambil data dari Supabase
  const fetchSiswa = async () => {
    // Cek apakah koneksi Supabase kebaca oleh aplikasi
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log("Supabase URL di aplikasi:", supabaseUrl);

    // Meminta data dari tabel 'siswa'
    const { data, error } = await supabase.from('siswa').select('*');

    // Cek apa yang dikembalikan Supabase
    console.log("Data yang didapat:", data);
    console.log("Error yang didapat:", error);

    if (error) {
      console.error("Detail Error Supabase:", error.message);
    } else {
      setSiswa(data);
    }
    setLoading(false);
  };

  // Jalankan fetchSiswa saat halaman pertama kali dibuka
  useEffect(() => {
    fetchSiswa();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Tombol Kembali */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={20} /> Kembali ke Dashboard
        </Link>

        {/* Header Halaman */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Daftar Siswa</h1>
            <p className="text-gray-500 text-sm">Data diambil langsung dari Database Supabase</p>
          </div>
        </div>

        {/* Kartu Tabel Data */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          
          {loading ? (
            // Tampilan saat loading
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="animate-spin mr-3" size={24} /> Mengambil data dari Supabase...
            </div>
          ) : siswa.length === 0 ? (
            // Tampilan jika data kosong
            <div className="text-center py-20 text-gray-500">Belum ada data siswa di database.</div>
          ) : (
            // Tabel Data Siswa
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-4 font-semibold text-gray-600">No</th>
                    <th className="p-4 font-semibold text-gray-600">NIS</th>
                    <th className="p-4 font-semibold text-gray-600">Nama Lengkap</th>
                    <th className="p-4 font-semibold text-gray-600">Kelas</th>
                    <th className="p-4 font-semibold text-gray-600">Jurusan</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {siswa.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-700">{index + 1}</td>
                      <td className="p-4 text-gray-700 font-medium">{item.nis}</td>
                      <td className="p-4 text-gray-700">{item.nama}</td>
                      <td className="p-4 text-gray-700">{item.kelas}</td>
                      <td className="p-4 text-gray-700">{item.jurusan}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
}
"use client";

import React, { useState, useRef } from 'react';
import { ArrowLeft, Save, CheckCircle, University } from 'lucide-react';
import { saveSnbpSnbt } from '@/app/actions/formulirActions';
import { useRouter } from 'next/navigation';

export default function SnbpSnbtPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nisn: '', nama: '', kelas: '', jurusan: '', whatsapp: '',
    jalur_pendaftaran: '', pt_tujuan: '', prodi_1: '', prodi_2: '', prodi_3: '',
    status_hasil: 'Belum Pengumuman', catatan: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const file = fileInputRef.current?.files?.[0] || null;
    const res = await saveSnbpSnbt(form, file);
    if (res.error) alert('Gagal menyimpan: ' + res.error);
    else setSuccess(true);
    setSaving(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md animate-scaleIn">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle size={48} className="text-green-600"/></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Berhasil Disimpan!</h2>
          <p className="text-gray-500 mb-6 text-sm">Terima kasih telah mengisi formulir Pendataan SNBP/SNBT.</p>
          <button onClick={() => router.push('/formulir')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Kembali ke Menu Formulir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 font-semibold text-sm"><ArrowLeft size={18}/> Kembali</button>
      
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8 border-b pb-6">
          <div className="bg-orange-50 p-3 rounded-xl"><University size={32} className="text-orange-600"/></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pendataan SNBP & SNBT</h1>
            <p className="text-sm text-gray-500">Formulir pendataan jalur masuk Perguruan Tinggi Negeri</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-gray-800">Identitas Siswa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="nisn" value={form.nisn} onChange={handleChange} placeholder="NISN" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input type="text" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama Lengkap" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input type="text" name="kelas" value={form.kelas} onChange={handleChange} placeholder="Kelas" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input type="text" name="jurusan" value={form.jurusan} onChange={handleChange} placeholder="Jurusan" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="Nomor WhatsApp" required className="md:col-span-2 p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Jalur Pendaftaran</h3>
            <div className="grid grid-cols-3 gap-3">
              {['SNBP', 'SNBT', 'SNBP & SNBT'].map(jalur => (
                <label key={jalur} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition ${form.jalur_pendaftaran === jalur ? 'bg-orange-50 border-orange-500 text-orange-700' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="jalur_pendaftaran" value={jalur} checked={form.jalur_pendaftaran === jalur} onChange={handleChange} className="w-4 h-4 text-orange-600" required/>
                  <span className="text-sm font-medium">{jalur}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Pilihan Perguruan Tinggi & Prodi</h3>
            <input type="text" name="pt_tujuan" value={form.pt_tujuan} onChange={handleChange} placeholder="Perguruan Tinggi Tujuan" required className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" name="prodi_1" value={form.prodi_1} onChange={handleChange} placeholder="Program Studi Pilihan 1" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input type="text" name="prodi_2" value={form.prodi_2} onChange={handleChange} placeholder="Program Studi Pilihan 2" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
              <input type="text" name="prodi_3" value={form.prodi_3} onChange={handleChange} placeholder="Program Studi Pilihan 3" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Status Hasil</label>
              <select name="status_hasil" value={form.status_hasil} onChange={handleChange} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none">
                <option value="Belum Pengumuman">Belum Pengumuman</option>
                <option value="Lulus">Lulus</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
                <option value="Cadangan">Cadangan</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Upload Bukti (Opsional)</label>
              <input type="file" ref={fileInputRef} accept=".pdf,.jpg,.png" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Catatan</label>
            <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={3} placeholder="Catatan tambahan..." className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"></textarea>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18}/> {saving ? 'Menyimpan Data...' : 'Simpan Data SNBP/SNBT'}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
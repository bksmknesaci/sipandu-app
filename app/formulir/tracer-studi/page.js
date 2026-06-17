"use client";

import React, { useState, useRef } from 'react';
import { ArrowLeft, Save, CheckCircle, GraduationCap } from 'lucide-react';
import { saveTracerStudi } from '@/app/actions/formulirActions';
import { useRouter } from 'next/navigation';

export default function TracerStudiPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    nisn: '', nama: '', tahun_lulus: new Date().getFullYear().toString(), jurusan: '', whatsapp: '', email: '',
    status_saat_ini: '',
    kuliah_nama_pt: '', kuliah_prodi: '', kuliah_jenjang: '', kuliah_kota: '', kuliah_provinsi: '',
    bekerja_nama_perusahaan: '', bekerja_jabatan: '', bekerja_bidang: '', bekerja_kota: '', bekerja_provinsi: '',
    wirausaha_nama: '', wirausaha_bidang: '', wirausaha_lama: '',
    testimoni: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const file = fileInputRef.current?.files?.[0] || null;
    const res = await saveTracerStudi(form, file);
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
          <p className="text-gray-500 mb-6 text-sm">Terima kasih telah mengisi formulir Tracer Studi Lulusan.</p>
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
          <div className="bg-blue-50 p-3 rounded-xl"><GraduationCap size={32} className="text-blue-600"/></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tracer Studi Lulusan</h1>
            <p className="text-sm text-gray-500">Pendataan aktivitas alumni setelah lulus</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-gray-800">Data Identitas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="nisn" value={form.nisn} onChange={handleChange} placeholder="NISN" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              <input type="text" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama Lengkap" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              <input type="text" name="tahun_lulus" value={form.tahun_lulus} onChange={handleChange} placeholder="Tahun Lulus" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              <input type="text" name="jurusan" value={form.jurusan} onChange={handleChange} placeholder="Jurusan" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="Nomor WhatsApp" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Status Saat Ini</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Kuliah', 'Bekerja', 'Wirausaha', 'Kuliah dan Bekerja', 'Kursus/Pelatihan', 'Mencari Kerja', 'Lainnya'].map(status => (
                <label key={status} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition ${form.status_saat_ini === status ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="status_saat_ini" value={status} checked={form.status_saat_ini === status} onChange={handleChange} className="w-4 h-4 text-blue-600" required/>
                  <span className="text-sm font-medium">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Fields */}
          {form.status_saat_ini === 'Kuliah' && (
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 space-y-4 animate-fadeIn">
              <h3 className="font-bold text-blue-800">Data Kuliah</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="kuliah_nama_pt" value={form.kuliah_nama_pt} onChange={handleChange} placeholder="Nama PTN/PTS" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="kuliah_prodi" value={form.kuliah_prodi} onChange={handleChange} placeholder="Program Studi" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="kuliah_jenjang" value={form.kuliah_jenjang} onChange={handleChange} placeholder="Jenjang (D3/S1/S2)" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="kuliah_kota" value={form.kuliah_kota} onChange={handleChange} placeholder="Kota" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="kuliah_provinsi" value={form.kuliah_provinsi} onChange={handleChange} placeholder="Provinsi" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
              </div>
            </div>
          )}

          {form.status_saat_ini === 'Bekerja' && (
            <div className="bg-green-50 p-5 rounded-xl border border-green-200 space-y-4 animate-fadeIn">
              <h3 className="font-bold text-green-800">Data Pekerjaan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="bekerja_nama_perusahaan" value={form.bekerja_nama_perusahaan} onChange={handleChange} placeholder="Nama Perusahaan" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="bekerja_jabatan" value={form.bekerja_jabatan} onChange={handleChange} placeholder="Jabatan" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="bekerja_bidang" value={form.bekerja_bidang} onChange={handleChange} placeholder="Bidang Pekerjaan" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="bekerja_kota" value={form.bekerja_kota} onChange={handleChange} placeholder="Kota" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="bekerja_provinsi" value={form.bekerja_provinsi} onChange={handleChange} placeholder="Provinsi" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
              </div>
            </div>
          )}

          {form.status_saat_ini === 'Wirausaha' && (
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 space-y-4 animate-fadeIn">
              <h3 className="font-bold text-amber-800">Data Wirausaha</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" name="wirausaha_nama" value={form.wirausaha_nama} onChange={handleChange} placeholder="Nama Usaha" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="wirausaha_bidang" value={form.wirausaha_bidang} onChange={handleChange} placeholder="Bidang Usaha" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
                <input type="text" name="wirausaha_lama" value={form.wirausaha_lama} onChange={handleChange} placeholder="Lama Usaha" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"/>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Testimoni Alumni</label>
            <textarea name="testimoni" value={form.testimoni} onChange={handleChange} rows={3} placeholder="Tulis testimoni atau pesan Anda..." className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Upload Foto Aktivitas (Opsional)</label>
            <input type="file" ref={fileInputRef} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18}/> {saving ? 'Menyimpan Data...' : 'Simpan Data Tracer'}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import { ArrowLeft, Save, CheckCircle, Briefcase } from 'lucide-react';
import { savePemetaanKarir } from '@/app/actions/formulirActions';
import { useRouter } from 'next/navigation';

const karirOptions = ['Teknologi', 'Desain', 'Bisnis', 'Pendidikan', 'Kesehatan', 'Pemerintahan', 'TNI/POLRI', 'Wirausaha', 'Industri', 'Lainnya'];

export default function PemetaanKarirPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nisn: '', nama: '', kelas: '', jurusan: '',
    minat_karir: [],
    cita_cita: '',
    rencana_setelah_lulus: '',
    pt_impian: '', prodi_impian: '', perusahaan_impian: '',
    keterangan_tambahan: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMinatChange = (minat) => {
    const updated = form.minat_karir.includes(minat) 
      ? form.minat_karir.filter(m => m !== minat) 
      : [...form.minat_karir, minat];
    setForm({ ...form, minat_karir: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.minat_karir.length === 0) { alert('Pilih minimal 1 Minat Karir!'); return; }
    setSaving(true);
    const payload = { ...form, minat_karir: JSON.stringify(form.minat_karir) };
    const res = await savePemetaanKarir(payload);
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
          <p className="text-gray-500 mb-6 text-sm">Terima kasih telah mengisi formulir Pemetaan Karir.</p>
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
          <div className="bg-green-50 p-3 rounded-xl"><Briefcase size={32} className="text-green-600"/></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pemetaan Karir</h1>
            <p className="text-sm text-gray-500">Pendataan minat dan rencana masa depan siswa</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-gray-800">Identitas Siswa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="nisn" value={form.nisn} onChange={handleChange} placeholder="NISN" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
              <input type="text" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama Lengkap" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
              <input type="text" name="kelas" value={form.kelas} onChange={handleChange} placeholder="Kelas (contoh: XII)" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
              <input type="text" name="jurusan" value={form.jurusan} onChange={handleChange} placeholder="Jurusan" required className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Minat Karir <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {karirOptions.map(minat => (
                <label key={minat} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition ${form.minat_karir.includes(minat) ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={form.minat_karir.includes(minat)} onChange={() => handleMinatChange(minat)} className="w-4 h-4 text-green-600 rounded"/>
                  <span className="text-sm font-medium">{minat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Cita-cita Pekerjaan</label>
              <input type="text" name="cita_cita" value={form.cita_cita} onChange={handleChange} placeholder="Contoh: Data Scientist" required className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Rencana Setelah Lulus</label>
              <select name="rencana_setelah_lulus" value={form.rencana_setelah_lulus} onChange={handleChange} required className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="">Pilih Rencana</option>
                <option value="Kuliah">Kuliah</option>
                <option value="Bekerja">Bekerja</option>
                <option value="Wirausaha">Wirausaha</option>
                <option value="Kuliah dan Bekerja">Kuliah dan Bekerja</option>
                <option value="Belum Menentukan">Belum Menentukan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="pt_impian" value={form.pt_impian} onChange={handleChange} placeholder="Perguruan Tinggi Impian" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
            <input type="text" name="prodi_impian" value={form.prodi_impian} onChange={handleChange} placeholder="Program Studi Impian" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
            <input type="text" name="perusahaan_impian" value={form.perusahaan_impian} onChange={handleChange} placeholder="Perusahaan Impian" className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"/>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Keterangan Tambahan</label>
            <textarea name="keterangan_tambahan" value={form.keterangan_tambahan} onChange={handleChange} rows={3} placeholder="Tuliskan keterangan tambahan..." className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"></textarea>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={18}/> {saving ? 'Menyimpan Data...' : 'Simpan Pemetaan Karir'}
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
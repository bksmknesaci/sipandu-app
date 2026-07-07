'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  getMajorLogosAction,
  uploadMajorLogoAction,
  saveMajorLogosAction,
} from '@/app/actions/majorLogoActions';

const JURUSAN_SLOTS = [
  { code: 'TKRO', name: 'Teknik Kendaraan Ringan Otomotif' },
  { code: 'PH', name: 'Perhotelan' },
  { code: 'DKV', name: 'Desain Komunikasi Visual' },
  { code: 'KL', name: 'Kuliner' },
  { code: 'RPL', name: 'Rekayasa Perangkat Lunak' },
  { code: 'LPKKK', name: 'Layanan Penunjang Kefarmasian Klinis & Komunitas' },
];

export default function MajorLogoManager() {
  const [majorLogos, setMajorLogos] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [message, setMessage] = useState(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRefs = useRef({});

  useEffect(() => {
    fetchMajorLogos();
  }, []);

  const fetchMajorLogos = async () => {
    setLoading(true);
    try {
      const logos = await getMajorLogosAction();
      setMajorLogos(logos || {});
    } catch (error) {
      console.error('Error fetching major logos:', error);
      setMajorLogos({});
    } finally {
      setLoading(false);
    }
  };

  // Trigger file input secara programatis (fix bug PH)
  const triggerFileInput = (code) => {
    const input = fileInputRefs.current[code];
    if (input) {
      input.value = '';
      input.click();
    }
  };

  // Handler ketika file dipilih
  const handleFileChange = async (code, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar bisa pilih file yang sama lagi
    e.target.value = '';

    await handleLogoUpload(code, file);
  };

  const handleLogoUpload = async (code, file) => {
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar' });
      return;
    }

    try {
      setUploadingIndex(code);
      setMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('code', code);

      const result = await uploadMajorLogoAction(formData);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      setMajorLogos((prev) => ({ ...prev, [code]: result.url }));
      setMessage({ type: 'success', text: `Logo ${code} berhasil diupload` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Gagal mengupload logo' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveLogo = (code) => {
    setMajorLogos((prev) => {
      const updated = { ...prev };
      delete updated[code];
      return updated;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await saveMajorLogosAction(majorLogos);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Logo jurusan berhasil disimpan!' });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-2 border-dashed border-gray-100 rounded-xl p-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-100 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Logo Jurusan</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Upload logo untuk setiap jurusan. Logo akan ditampilkan di dashboard pada bagian Rekapitulasi Jumlah Siswa.
      </p>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Hidden File Inputs — terpisah dari card */}
      {JURUSAN_SLOTS.map((slot) => (
        <input
          key={`input-${slot.code}`}
          ref={(el) => { fileInputRefs.current[slot.code] = el; }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(slot.code, e)}
        />
      ))}

      {/* Grid 3 Kolom — kartu sejajar rapi */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {JURUSAN_SLOTS.map((slot) => {
          const hasLogo = majorLogos[slot.code];
          const isUploading = uploadingIndex === slot.code;

          return (
            <div
              key={slot.code}
              className="border border-gray-200 rounded-xl p-4 md:p-5 text-center hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
            >
              {/* Kode Jurusan Badge */}
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                {slot.code}
              </span>

              {/* Preview Logo */}
              <div className="w-16 h-16 md:w-20 mx-auto rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center mb-2 md:mb-3 relative group">
                {hasLogo ? (
                  <>
                    <img
                      src={hasLogo}
                      alt={slot.code}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveLogo(slot.code)}
                      className="absolute inset-0 bg-red-500/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                      title="Hapus logo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <span className="text-gray-300 text-lg font-bold">
                    {slot.code.substring(0, 2)}
                  </span>
                )}
              </div>

              {/* Nama Jurusan */}
              <p className="text-xs md:text-sm text-gray-600 mb-3 leading-tight min-h-[2rem] md:min-h-[2.5rem] flex items-center justify-center">
                {slot.name}
              </p>

              {/* Tombol Upload — gunakan button + ref */}
              <button
                type="button"
                onClick={() => triggerFileInput(slot.code)}
                disabled={isUploading}
                className="inline-flex items-center gap-1 md:gap-1.5 bg-indigo-500 text-white text-[11px] md:text-xs px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-600 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Upload...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {hasLogo ? 'Ganti' : 'Upload'}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Tombol Simpan */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simpan Logo Jurusan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
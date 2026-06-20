'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchSiswa } from '@/app/actions/cariSiswaActions';
import { Suspense } from 'react';

function CariContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (initialQuery.length >= 3) {
      doSearch(initialQuery);
    }
  }, []);

  const doSearch = useCallback(async (term) => {
    if (term.length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchSiswa(term);
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query);
    }
  };

  const getInitials = (nama) => {
    return nama
      .split(' ')
      .filter((w) => w)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (nama) => {
    const colors = [
      '#1E40AF', '#7C3AED', '#059669', '#D97706',
      '#DC2626', '#0891B2', '#4F46E5', '#BE185D',
    ];
    let hash = 0;
    for (let i = 0; i < nama.length; i++)
      hash = nama.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const statusBadge = (status) => {
    if (!status)
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
          Belum Absen
        </span>
      );
    const map = {
      Hadir: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
      Sakit: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      Izin: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
      Alpha: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    };
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${s.bg} ${s.text} font-medium`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Cari Data Siswa</h1>
              <p className="text-blue-200 text-sm sm:text-base">
                Pusat informasi siswa terintegrasi SIPANDU
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="max-w-5xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 overflow-hidden">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ketik nama, NISN, atau kelas siswa (minimal 3 huruf)..."
                className="w-full pl-12 pr-4 py-4 bg-transparent text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                autoFocus
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              onClick={() => doSearch(query)}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-full m-1.5 flex items-center justify-center shrink-0 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-400">Pencarian berdasarkan:</span>
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Nama</span>
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">NISN</span>
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Kelas</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Siswa Tidak Ditemukan</h3>
            <p className="text-gray-400 text-sm">Coba gunakan kata kunci yang berbeda</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Ditemukan <span className="font-semibold text-gray-700">{results.length}</span> siswa
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: getAvatarColor(s.nama) }}
                      >
                        {getInitials(s.nama)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{s.nama}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">NISN: {s.nisn || '—'}</p>
                        <p className="text-xs text-gray-400">{s.kelas} • {s.jurusan}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>{statusBadge(s.statusHariIni)}</div>
                      <button
                        onClick={() => router.push(`/cari-data-siswa/${s.id}`)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        Lihat Detail
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !searched && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Mulai Pencarian</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Ketik minimal 3 huruf nama, NISN, atau kelas siswa untuk menampilkan hasil pencarian
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CariDataSiswaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CariContent />
    </Suspense>
  );
}
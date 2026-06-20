'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { searchSiswa } from '@/app/actions/cariSiswaActions';

export default function CariDataSiswaWidget() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update posisi dropdown saat scroll & resize (realtime)
  useEffect(() => {
    if (!showDropdown || !mounted) return;

    function updatePosition() {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const vw = window.innerWidth;

      let left = rect.left;
      let width = rect.width;

      // Di HP: pastikan dropdown tidak keluar layar kiri/kanan
      if (vw < 640) {
        left = 8;
        width = vw - 16;
      } else {
        if (left + width > vw - 12) {
          left = vw - width - 12;
        }
        if (left < 12) {
          left = 12;
          width = vw - 24;
        }
      }

      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 9999,
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown, mounted]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (term) => {
    if (term.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchSiswa(term);
      setResults(data);
      if (data.length > 0) {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
      setShowDropdown(false);
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
    if (e.key === 'Enter' && query.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setShowDropdown(false);
      router.push(`/cari-data-siswa?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelect = (siswa) => {
    setShowDropdown(false);
    setQuery('');
    router.push(`/cari-data-siswa/${siswa.id}`);
  };

  const handleButtonClick = () => {
    if (query.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setShowDropdown(false);
      router.push(`/cari-data-siswa?q=${encodeURIComponent(query.trim())}`);
    } else {
      inputRef.current?.focus();
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
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
          Belum Absen
        </span>
      );
    const map = {
      Hadir: 'bg-green-100 text-green-700',
      Sakit: 'bg-yellow-100 text-yellow-700',
      Izin: 'bg-blue-100 text-blue-700',
      Alpha: 'bg-red-100 text-red-700',
    };
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
          map[status] || 'bg-gray-100 text-gray-500'
        }`}
      >
        {status}
      </span>
    );
  };

  // Dropdown content
  const dropdownContent = showDropdown && results.length > 0 && mounted ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-[11px] text-gray-500 font-medium">
          Ditemukan {results.length} siswa
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {results.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/60 active:bg-blue-100/60 transition-colors text-left border-b border-gray-50 last:border-0"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: getAvatarColor(s.nama) }}
            >
              {getInitials(s.nama)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {s.nama}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {s.kelas} • {s.jurusan} • NISN: {s.nisn || '—'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {statusBadge(s.statusHariIni)}
              <svg
                className="w-3.5 h-3.5 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => {
            setShowDropdown(false);
            router.push(
              `/cari-data-siswa?q=${encodeURIComponent(query.trim())}`
            );
          }}
          className="w-full text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 py-1 transition-colors"
        >
          Lihat Semua Hasil →
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg mx-auto">
      {/* Search Bar */}
      <div className="flex items-center bg-white rounded-full shadow-md border border-gray-200/80">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            placeholder="Cari Data Siswa... Nama/NISN"
            className="w-full pl-10 pr-3 py-2.5 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button
          onClick={handleButtonClick}
          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-full m-1 flex items-center justify-center shrink-0 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown via Portal — posisi diupdate realtime saat scroll */}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
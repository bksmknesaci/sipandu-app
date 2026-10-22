"use client";

import React, { useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

const VARIANTS = {
  danger: {
    strip: 'bg-gradient-to-r from-red-500 to-rose-600',
    iconWrap: 'bg-red-50 text-red-600 ring-red-100',
    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-200',
  },
  warning: {
    strip: 'bg-gradient-to-r from-amber-500 to-orange-500',
    iconWrap: 'bg-amber-50 text-amber-600 ring-amber-100',
    btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-200',
  },
  info: {
    strip: 'bg-gradient-to-r from-indigo-500 to-blue-600',
    iconWrap: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    btn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200',
  },
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  details = [],            // [{ label, value }]
  warning = null,          // teks peringatan kuning (opsional)
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  loading = false,
  error = null,
  variant = 'danger',
  icon: Icon = AlertTriangle,
}) {
  const v = VARIANTS[variant] || VARIANTS.danger;

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape' && !loading) onClose?.();
  }, [loading, onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => { if (!loading) onClose?.(); }} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn" role="dialog" aria-modal="true">
        <div className={`h-1.5 w-full ${v.strip}`} />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ring-4 ${v.iconWrap}`}>
              <Icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">{message}</p>
            </div>
            {!loading && (
              <button onClick={() => onClose?.()} className="shrink-0 text-gray-300 hover:text-gray-500 transition" aria-label="Tutup">
                <X size={20} />
              </button>
            )}
          </div>

          {details.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 divide-y divide-gray-100">
              {details.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-gray-500 shrink-0">{d.label}</span>
                  <span className="font-semibold text-gray-800 text-right truncate">{d.value ?? '-'}</span>
                </div>
              ))}
            </div>
          )}

          {warning && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">{warning}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onClose?.()}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 focus:outline-none focus:ring-4 ${v.btn}`}
            >
              {loading ? (<><Loader2 size={16} className="animate-spin" /> Memproses...</>) : confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
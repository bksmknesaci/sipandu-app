'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUnreadCount, getUserNotifications, markAsRead, markAllAsRead, deleteAllNotifications } from '@/app/actions/notificationActions';

// ─── Konstanta ─────────────────────────────────────────────────
const TYPE_ICONS = {
  sick_permission: '🤒',
  parent_message: '💬',
  attendance_revision: '📝',
  reward: '🏆',
  violation: '⚠️',
  student_handling: '📋',
  system: '⚙️',
};

const ACTION_LABELS = {
  sick_permission: 'Verifikasi',
  parent_message: 'Balas',
  attendance_revision: 'Lihat Detail',
  reward: 'Lihat',
  violation: 'Lihat',
  student_handling: 'Lihat',
  system: null,
};

const PRIORITY_STYLES = {
  INFO: { bg: 'bg-blue-50', border: 'border-l-blue-500', dot: 'bg-blue-500' },
  SUCCESS: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  WARNING: { bg: 'bg-amber-50', border: 'border-l-amber-500', dot: 'bg-amber-500' },
  DANGER: { bg: 'bg-red-50', border: 'border-l-red-500', dot: 'bg-red-500' },
};

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'important', label: 'Penting' },
  { key: 'system', label: 'Sistem' },
];

// ─── Helper ─────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Komponen Utama ────────────────────────────────────────────
export default function NotificationCenter({ userId }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const channelRef = useRef(null);
  const [shaking, setShaking] = useState(false);
  const isOpenRef = useRef(false);

  // ── Sinkron ref ──
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // ── Fetch awal ──
  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const [countRes, notifRes] = await Promise.all([
        getUnreadCount(userId),
        getUserNotifications(userId, { limit: 15 }),
      ]);
      if (countRes.error) throw countRes.error;
      if (notifRes.error) throw notifRes.error;
      setUnreadCount(countRes.count);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Supabase Realtime ──
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchData();
        setShaking(true);
        setTimeout(() => setShaking(false), 700);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchData]);

  // ── Shake berulang jika ada unread ──
  useEffect(() => {
    if (unreadCount <= 0) return;
    const iv = setInterval(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 700);
    }, 8000);
    return () => clearInterval(iv);
  }, [unreadCount]);

  // ── Toggle: hitung posisi dropdown ──
  const handleToggle = useCallback(() => {
    if (!isOpenRef.current) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (vw < 768) {
        // ══ MOBILE: posisi hardcoded di atas layar ══
        // Tidak pakai getBoundingClientRect() karena bisa salah
        // pada header dengan transform/stacking context
        setDropdownStyle({
          position: 'fixed',
          top: '8px',
          left: '8px',
          right: '8px',
          bottom: 'auto',
          width: 'auto',
          maxHeight: `${vh - 16}px`,
        });
      } else {
        // ══ DESKTOP: posisi di bawah tombol lonceng ══
        if (bellRef.current) {
          const rect = bellRef.current.getBoundingClientRect();
          const availableHeight = vh - rect.bottom - 16;
          setDropdownStyle({
            position: 'fixed',
            top: `${rect.bottom + 8}px`,
            left: 'auto',
            right: `${Math.max(8, vw - rect.right)}px`,
            bottom: 'auto',
            width: `${Math.min(400, vw - 16)}px`,
            maxHeight: `${Math.max(220, Math.min(availableHeight, 520))}px`,
          });
        } else {
          // Fallback jika bellRef belum ready
          setDropdownStyle({
            position: 'fixed',
            top: '56px',
            right: '8px',
            bottom: 'auto',
            width: '400px',
            maxHeight: '520px',
          });
        }
      }
    }
    setIsOpen(prev => !prev);
  }, []);

  // ── Click outside (mouse + touch) ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      // Delay sedikit agar click toggle tidak langsung tertutup
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  // ── Tutup saat scroll (mobile) ──
  useEffect(() => {
    if (!isOpen) return;
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsOpen(false), 150);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // ── Tutup saat resize ──
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      setIsOpen(false);
      setDropdownStyle(null);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // ── Actions ──
  const handleMarkAllRead = async () => {
    if (!userId || markingAll) return;
    setMarkingAll(true);
    await markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  const handleMarkOneRead = async (notif) => {
    if (notif.is_read) return;
    await markAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleAction = async (notif) => {
    await handleMarkOneRead(notif);
    setIsOpen(false);
    if (notif.action_url) router.push(notif.action_url);
  };

  const handleDeleteAll = async () => {
    if (!userId) return;
    if (!confirm('Hapus semua notifikasi?')) return;
    await deleteAllNotifications(userId);
    setNotifications([]);
    setUnreadCount(0);
  };

  // ── Filter lokal ──
  const filtered = activeTab === 'all' ? notifications
    : activeTab === 'unread' ? notifications.filter(n => !n.is_read)
    : activeTab === 'important' ? notifications.filter(n => ['WARNING', 'DANGER'].includes(n.priority))
    : activeTab === 'system' ? notifications.filter(n => n.type === 'system')
    : notifications;

  return (
    <>
      {/* ── BELL BUTTON ── */}
      <button
        ref={bellRef}
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors text-gray-300 hover:text-white"
        title="Notifikasi"
      >
        <Bell size={20} className={`transition-transform ${shaking ? 'bell-shake' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1 leading-none shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── BACKDROP (mobile only) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[9997]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── DROPDOWN PANEL ── */}
      {isOpen && dropdownStyle && (
        <div
          ref={panelRef}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9998] overflow-hidden notif-scaleIn flex flex-col"
          style={dropdownStyle}
        >
          <NotificationPanelContent
            notifications={filtered}
            unreadCount={unreadCount}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onMarkAllRead={handleMarkAllRead}
            onMarkOneRead={handleMarkOneRead}
            onAction={handleAction}
            onDeleteAll={handleDeleteAll}
            markingAll={markingAll}
            loading={loading}
            userId={userId}
          />
        </div>
      )}

      <style>{`
        @keyframes notifBellShake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(4deg); }
        }
        .bell-shake { animation: notifBellShake 0.7s ease-in-out; }
        @keyframes notifScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .notif-scaleIn { animation: notifScaleIn 0.2s ease-out; }
      `}</style>
    </>
  );
}

// ─── Panel Content ─────────────────────────────────────────────
function NotificationPanelContent({
  notifications,
  unreadCount,
  activeTab,
  setActiveTab,
  onMarkAllRead,
  onMarkOneRead,
  onAction,
  onDeleteAll,
  markingAll,
  loading,
  userId,
}) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-full" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ maxHeight: 'inherit' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} baru</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} disabled={markingAll}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition disabled:opacity-50">
                <CheckCheck size={13} /> {markingAll ? '...' : 'Tandai Dibaca'}
              </button>
            )}
            <button onClick={onDeleteAll} title="Hapus Semua"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${activeTab === tab.key ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map(notif => {
              const pStyle = PRIORITY_STYLES[notif.priority] || PRIORITY_STYLES.INFO;
              const icon = TYPE_ICONS[notif.type] || '🔔';
              const actionLabel = ACTION_LABELS[notif.type];

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkOneRead(notif)}
                  className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-[3px] ${pStyle.border} ${!notif.is_read ? pStyle.bg : 'bg-white'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${!notif.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                      {!notif.is_read && <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${pStyle.dot}`} />}
                    </div>
                    {notif.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">{timeAgo(notif.created_at)}</span>
                      {actionLabel && notif.action_url && (
                        <button onClick={(e) => { e.stopPropagation(); onAction(notif); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition">
                          {actionLabel} <ExternalLink size={9} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Tidak ada notifikasi</p>
            <p className="text-xs mt-1">Notifikasi terbaru akan muncul di sini</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5 shrink-0">
        <button onClick={() => { window.location.href = '/notifikasi'; }}
          className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1.5 rounded-lg hover:bg-blue-50 transition">
          Lihat Semua Notifikasi →
        </button>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, CheckCheck, Trash2, ExternalLink, Filter, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { getUserNotificationsAdvanced, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '@/app/actions/notificationActions';

const TYPE_ICONS = { sick_permission: '🤒', parent_message: '💬', attendance_revision: '📝', reward: '🏆', violation: '⚠️', student_handling: '📋', system: '⚙️' };
const ACTION_LABELS = { sick_permission: 'Verifikasi', parent_message: 'Balas', attendance_revision: 'Lihat Detail', reward: 'Lihat', violation: 'Lihat', student_handling: 'Lihat', system: null };
const PRIORITY_STYLES = {
  INFO: { bg: 'bg-blue-50', border: 'border-l-blue-500', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  SUCCESS: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  WARNING: { bg: 'bg-amber-50', border: 'border-l-amber-500', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  DANGER: { bg: 'bg-red-50', border: 'border-l-red-500', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
};

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'read', label: 'Sudah Dibaca' },
  { key: 'important', label: 'Penting' },
  { key: 'system', label: 'Sistem' },
];

const DATE_TABS = [
  { key: 'all', label: 'Semua Waktu' },
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari' },
  { key: '30days', label: '30 Hari' },
];

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

const PER_PAGE = 15;

export default function NotifikasiPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');
  const [dateTab, setDateTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedIn === 'true');
      const stored = localStorage.getItem('userData');
      if (stored) setUserData(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const userId = userData?.id;

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [countRes, notifRes] = await Promise.all([
        getUnreadCount(userId),
        getUserNotificationsAdvanced(userId, { limit: PER_PAGE, offset: page * PER_PAGE, filter: statusTab, dateFilter: dateTab, search }),
      ]);
      if (notifRes.error) throw notifRes.error;
      setNotifications(notifRes.data);
      setTotal(notifRes.total);
      setUnreadCount(countRes.count);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, page, statusTab, dateTab, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setPage(0); }, [statusTab, dateTab, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const handleMarkAllRead = async () => {
    if (!userId || markingAll) return;
    setMarkingAll(true);
    await markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  const handleMarkOne = async (notif) => {
    if (notif.is_read) return;
    await markAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (notif) => {
    if (!confirm('Hapus notifikasi ini?')) return;
    setDeletingId(notif.id);
    await deleteNotification(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    if (!notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    setTotal(prev => Math.max(0, prev - 1));
    setDeletingId(null);
  };

  const handleDeleteAll = async () => {
    if (!userId || !confirm('Hapus SEMUA notifikasi? Tindakan ini tidak dapat dibatalkan.')) return;
    await deleteAllNotifications(userId);
    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);
  };

  const handleAction = async (notif) => {
    await handleMarkOne(notif);
    if (notif.action_url) router.push(notif.action_url);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  if (!isLoggedIn || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Anda Belum Login</h2>
          <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">← Kembali ke Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-5 max-w-[900px] mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 md:p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center text-xl">🔔</div>
          <div>
            <h1 className="text-xl font-bold">Pusat Notifikasi</h1>
            <p className="text-slate-300 text-sm">{unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari notifikasi..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </form>

      {/* Date Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {DATE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setDateTab(tab.key)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${dateTab === tab.key ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Filter Tabs + Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${statusTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} disabled={markingAll || !userId}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
              <CheckCheck size={13} /> {markingAll ? '...' : 'Tandai Semua Dibaca'}
            </button>
          )}
          <button onClick={handleDeleteAll} disabled={!userId} title="Hapus Semua"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-40">
            <Trash2 size={13} /> Hapus Semua
          </button>
        </div>
      </div>

      {/* Total info */}
      <p className="text-xs text-gray-400">
        Menampilkan {notifications.length} dari {total} notifikasi
        {search && <span> — pencarian: &quot;{search}&quot;</span>}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="w-11 h-11 bg-gray-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(notif => {
            const pStyle = PRIORITY_STYLES[notif.priority] || PRIORITY_STYLES.INFO;
            const icon = TYPE_ICONS[notif.type] || '🔔';
            const actionLabel = ACTION_LABELS[notif.type];

            return (
              <div
                key={notif.id}
                onClick={() => handleMarkOne(notif)}
                className={`flex gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer border-l-[3px] ${pStyle.border} ${!notif.is_read ? pStyle.bg : ''}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${!notif.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${pStyle.badge}`}>{notif.priority}</span>
                      {!notif.is_read && <span className={`w-2 h-2 rounded-full ${pStyle.dot}`} />}
                    </div>
                  </div>
                  {notif.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{timeAgo(notif.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      {actionLabel && notif.action_url && (
                        <button onClick={(e) => { e.stopPropagation(); handleAction(notif); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition">
                          {actionLabel} <ExternalLink size={9} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(notif); }} disabled={deletingId === notif.id}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition disabled:opacity-50" title="Hapus">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <Inbox size={56} className="text-gray-200 mb-4" />
          <p className="text-sm font-semibold text-gray-500">Tidak ada notifikasi</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? 'Coba ubah kata kunci pencarian' : 'Notifikasi terbaru akan muncul di sini'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 text-xs font-bold rounded-lg transition ${page === i ? 'bg-blue-600 text-white shadow' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
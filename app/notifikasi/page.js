'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, CheckCheck, Trash2, ExternalLink, Filter, ChevronLeft, ChevronRight, Inbox, X, Send, MessageCircle, AlertTriangle } from 'lucide-react';
import { getUserNotificationsAdvanced, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '@/app/actions/notificationActions';
import { getParentMessages, sendWKReplyMessage } from '@/app/actions/parentPortalActions';
import { getEditRequestDetails, approveEditRequest, rejectEditRequest } from '@/app/actions/absensiActions';

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

function chatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function chatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hari ini';
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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

  // ── Chat Popup State ──
  const [chatPopup, setChatPopup] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // ── Revision Popup State ──
  const [revisionPopup, setRevisionPopup] = useState(null);
  const [revisionDetails, setRevisionDetails] = useState(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisionAction, setRevisionAction] = useState(null);

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

  // ── Revision: Fetch detail saat popup buka ──
  useEffect(() => {
    if (!revisionPopup?.requestId) return;
    setRevisionLoading(true);
    setRevisionDetails(null);
    getEditRequestDetails(revisionPopup.requestId)
      .then(res => {
        if (res.data) setRevisionDetails(res.data);
        else setRevisionDetails(null);
      })
      .catch(err => console.error('[RevisionPopup] Fetch error:', err))
      .finally(() => setRevisionLoading(false));
  }, [revisionPopup?.requestId]);

  // ── Chat: Fetch messages saat popup buka ──
  const fetchChatMessages = useCallback(async () => {
    if (!chatPopup?.studentId) return;
    try {
      const res = await getParentMessages(chatPopup.studentId);
      if (!res.error) setChatMessages(res.data);
    } catch (err) {
      console.error('[ChatPopup] Fetch error:', err);
    }
  }, [chatPopup?.studentId]);

  useEffect(() => {
    if (!chatPopup) return;
    setChatLoading(true);
    fetchChatMessages().finally(() => setChatLoading(false));
  }, [chatPopup, fetchChatMessages]);

  // ── Chat: Auto-refresh tiap 3 detik ──
  useEffect(() => {
    if (!chatPopup) return;
    const iv = setInterval(() => {
      fetchChatMessages();
    }, 3000);
    return () => clearInterval(iv);
  }, [chatPopup?.studentId, fetchChatMessages]);

  // ── Chat: Scroll ke bawah saat pesan baru ──
  useEffect(() => {
    if (chatEndRef.current && chatMessages.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  // ── Chat: Kirim balasan ──
  const handleSendReply = async () => {
    if (!chatMessage.trim() || !chatPopup) return;
    setSendingMessage(true);
    try {
      const result = await sendWKReplyMessage(chatPopup.studentId, chatMessage, userId);
      if (result.error) {
        alert('Gagal mengirim: ' + result.error);
      } else {
        setChatMessage('');
        fetchChatMessages();
      }
    } catch (err) {
      alert('Gagal mengirim: ' + err.message);
    }
    setSendingMessage(false);
  };

    // ── Revision: Setujui ──
  const handleApproveRevision = async () => {
    if (!revisionDetails || !userId) return;
    setRevisionAction('approving');
    try {
      const result = await approveEditRequest(
        revisionDetails.id, userId, revisionDetails.kelas, revisionDetails.jurusan, revisionDetails.tanggal
      );
      if (result.error) {
        alert('Gagal menyetujui: ' + result.error);
      } else {
        setNotifications(prev => prev.filter(n => n.reference_id !== String(revisionDetails.id)));
        if (unreadCount > 0) setUnreadCount(prev => Math.max(0, prev - 1));
        setTotal(prev => Math.max(0, prev - 1));
        setRevisionPopup(null);
        setRevisionDetails(null);
        fetchData();
      }
    } catch (err) {
      alert('Gagal menyetujui: ' + err.message);
    }
    setRevisionAction(null);
  };

  // ── Revision: Tolak ──
  const handleRejectRevision = async () => {
    if (!revisionDetails || !userId) return;
    if (!confirm('Tolak permintaan revisi absensi ini?')) return;
    setRevisionAction('rejecting');
    try {
      const result = await rejectEditRequest(revisionDetails.id, userId);
      if (result.error) {
        alert('Gagal menolak: ' + result.error);
      } else {
        setNotifications(prev => prev.filter(n => n.reference_id !== String(revisionDetails.id)));
        if (unreadCount > 0) setUnreadCount(prev => Math.max(0, prev - 1));
        setTotal(prev => Math.max(0, prev - 1));
        setRevisionPopup(null);
        setRevisionDetails(null);
        fetchData();
      }
    } catch (err) {
      alert('Gagal menolak: ' + err.message);
    }
    setRevisionAction(null);
  };

  // ── Chat: Buka popup dari notif ──
  const handleNotifClick = useCallback(async (notif) => {
    await handleMarkOne(notif);

    // Chat popup untuk pesan orang tua
    if (notif.type === 'parent_message' && notif.reference_id) {
      const match = notif.message?.match(/Orang tua (.+?) \((.+?)\)/);
      setChatPopup({
        studentId: parseInt(notif.reference_id),
        studentName: match ? match[1] : 'Siswa',
        kelasJurusan: match ? match[2] : '',
      });
      return;
    }

    // Popup konfirmasi revisi absensi untuk Admin
    if (userData?.role === 'Administrator' && notif.type === 'attendance_revision' && notif.reference_id) {
      setRevisionPopup({ requestId: notif.reference_id });
      return;
    }

    // Selain itu → gunakan action_url normal
    if (notif.action_url) router.push(notif.action_url);
  }, [userData?.role]);

  // ── Group chat messages by date ──
  const groupedMessages = useMemo(() => {
    const groups = {};
    (chatMessages || []).forEach(msg => {
      const dateKey = new Date(msg.created_at).toLocaleDateString('id-ID');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return Object.entries(groups);
  }, [chatMessages]);

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
            const isParentMsg = notif.type === 'parent_message';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`flex gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer border-l-[3px] ${pStyle.border} ${!notif.is_read ? pStyle.bg : ''} ${isParentMsg ? '' : ''}`}
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
                      {actionLabel && !isParentMsg && notif.action_url && (
                        <button onClick={(e) => { e.stopPropagation(); handleNotifClick(notif); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition">
                          {actionLabel} <ExternalLink size={9} />
                        </button>
                      )}
                      {isParentMsg && (
                        <button onClick={(e) => { e.stopPropagation(); handleNotifClick(notif); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition">
                            💬 Buka Chat
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

      {/* ── CHAT POPUP ── */}
      {chatPopup && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]" onClick={() => setChatPopup(null)} />
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setChatPopup(null); }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh', animation: 'chatPopupIn 0.25s ease-out' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                      <MessageCircle size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{chatPopup.studentName}</h3>
                      <p className="text-xs text-blue-100 truncate">{chatPopup.kelasJurusan}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatPopup(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-[300px]">
                {chatLoading && chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <MessageCircle size={32} className="mb-2 opacity-40" />
                    <p className="text-sm font-medium">Belum ada pesan</p>
                  </div>
                ) : (
                  groupedMessages.map(([dateKey, msgs]) => (
                    <div key={dateKey}>
                      <div className="text-center">
                        <span className="inline-block px-3 py-0.5 bg-white rounded-full text-[10px] font-bold text-gray-500 shadow-sm border border-gray-200">
                          {chatDateLabel(msgs[0].created_at)}
                        </span>
                      </div>
                      <div className="space-y-2 mt-2">
                        {msgs.map(msg => {
                          const isWK = msg.sender_type === 'Wali Kelas';
                          return (
                            <div key={msg.id} className={`flex ${isWK ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm ${isWK ? 'bg-blue-600 text-white rounded-br-2xl' : 'bg-white text-gray-800 rounded-bl-2xl border border-gray-200'}`}>
                                {!isWK && (
                                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Orang Tua</p>
                                )}
                                <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                                <p className={`text-[9px] mt-1 ${isWK ? 'text-blue-200 text-right' : 'text-gray-400'}`}>{chatTime(msg.created_at)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder="Ketik balasan..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingMessage || !chatMessage.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── REVISION POPUP ── */}
      {revisionPopup && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]" onClick={() => { setRevisionPopup(null); setRevisionDetails(null); }} />
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setRevisionPopup(null); setRevisionDetails(null); } }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh', animation: 'chatPopupIn 0.25s ease-out' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 text-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">📝</div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">Permintaan Revisi Absensi</h3>
                      <p className="text-xs text-amber-100 truncate">Menunggu konfirmasi Anda</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setRevisionPopup(null); setRevisionDetails(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50 min-h-[200px]">
                {revisionLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : revisionDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        ⏳ {revisionDetails.status === 'pending' ? 'Menunggu Persetujuan' : revisionDetails.status}
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                      {[
                        { label: 'Kelas', value: `${revisionDetails.kelas || '-'} ${revisionDetails.jurusan || ''}`.trim() },
                        { label: 'Tanggal', value: revisionDetails.tanggal ? new Date(revisionDetails.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
                        { label: 'Waktu Pengajuan', value: revisionDetails.created_at ? new Date(revisionDetails.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-' },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-3 px-4 py-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-28 shrink-0 pt-0.5">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                        </div>
                      ))}
                      <div className="px-4 py-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alasan Permintaan</span>
                        <p className="text-sm text-gray-700 mt-1.5 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg p-3">
                          "{revisionDetails.reason || '-'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <span className="text-blue-500 text-sm mt-0.5">ℹ️</span>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Menyetujui akan membuka kembali absensi kelas tersebut untuk direvisi. Sekretaris akan menerima notifikasi dan bisa langsung mengedit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <AlertTriangle size={32} className="mb-2 opacity-40" />
                    <p className="text-sm font-medium">Detail tidak ditemukan</p>
                    <p className="text-xs mt-1">Permintaan mungkin sudah diproses</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                {!revisionLoading && revisionDetails?.status === 'pending' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleRejectRevision}
                      disabled={revisionAction === 'rejecting'}
                      className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {revisionAction === 'rejecting' ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                      Tolak
                    </button>
                    <button
                      onClick={handleApproveRevision}
                      disabled={revisionAction === 'approving'}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {revisionAction === 'approving' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCheck size={16} />
                      )}
                      Setujui
                    </button>
                  </div>
                ) : !revisionLoading && revisionDetails?.status !== 'pending' ? (
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold ${
                      revisionDetails?.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {revisionDetails?.status === 'approved' ? '✅ Sudah Disetujui' : '❌ Sudah Ditolak'}
                    </span>
                    <button
                      onClick={() => { setRevisionPopup(null); setRevisionDetails(null); }}
                      className="block w-full mt-3 py-2.5 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm">Memuat...</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes chatPopupIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
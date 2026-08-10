'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2, ExternalLink, X, Send, MessageCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUnreadCount, getUserNotifications, markAsRead, markAllAsRead, deleteAllNotifications } from '@/app/actions/notificationActions';
import { getParentMessages, sendWKReplyMessage } from '@/app/actions/parentPortalActions';
import { getEditRequestDetails, approveEditRequest, rejectEditRequest } from '@/app/actions/absensiActions';

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

// ─── Komponen Utama ────────────────────────────────────────────
export default function NotificationCenter({ userId, userRole }) {
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
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[NotificationCenter] WebSocket gagal, polling fallback aktif');
        }
      });
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchData]);

  // ── Shake berulang jika ada unread ──
  useEffect(() => {
    if (unreadCount <= 0) return;
    const iv = setInterval(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 700);
    }, 5000);
    return () => clearInterval(iv);
  }, [unreadCount]);

    // ── Polling fallback: fetch ulang setiap 15 detik ──
  // Digunakan saat Supabase Realtime WebSocket gagal connect
  // sehingga notif tetap muncul meski tanpa push real-time
  useEffect(() => {
    if (!userId) return;
    const iv = setInterval(() => {
      fetchData();
    }, 60000); // 60 detik
    return () => clearInterval(iv);
  }, [userId, fetchData]);

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
        setUnreadCount(prev => Math.max(0, prev - 1));
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
        setUnreadCount(prev => Math.max(0, prev - 1));
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
    await handleMarkOneRead(notif);

    // Chat popup untuk pesan orang tua
    if (notif.type === 'parent_message' && notif.reference_id) {
      const match = notif.message?.match(/Orang tua (.+?) \((.+?)\)/);
      setChatPopup({
        studentId: parseInt(notif.reference_id),
        studentName: match ? match[1] : 'Siswa',
        kelasJurusan: match ? match[2] : '',
      });
      setIsOpen(false);
      return;
    }

    // Popup konfirmasi revisi absensi untuk Admin
    if (userRole === 'Administrator' && notif.type === 'attendance_revision' && notif.reference_id) {
      console.log('[NotificationCenter] Buka revision popup, requestId:', notif.reference_id);
      setRevisionPopup({ requestId: notif.reference_id });
      setIsOpen(false);
      return;
    }
  }, [userRole]);

  // ── Toggle: hitung posisi dropdown ──
  const handleToggle = useCallback(() => {
    if (!isOpenRef.current) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (vw < 768) {
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

  // ── Tutup saat scroll di luar panel (mobile) ──
  useEffect(() => {
    if (!isOpen) return;
    let scrollTimeout;
    const handleScroll = (e) => {
      // Jangan tutup jika scroll terjadi di dalam panel notifikasi itu sendiri
      if (panelRef.current && panelRef.current.contains(e.target)) return;
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
    await handleNotifClick(notif);
    // Jangan navigasi jika popup dibuka (chat atau revision)
    if (notif.type === 'parent_message') return;
    if (userRole === 'Administrator' && notif.type === 'attendance_revision' && notif.reference_id) return;
    if (notif.action_url) {
      router.push(notif.action_url);
    }
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
            onNotifClick={handleNotifClick}
          />
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
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                      📝
                    </div>
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
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        ⏳ {revisionDetails.status === 'pending' ? 'Menunggu Persetujuan' : revisionDetails.status}
                      </span>
                    </div>

                    {/* Detail grid */}
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

                    {/* Info box */}
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

              {/* Footer buttons */}
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
        @keyframes chatPopupIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
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
  onNotifClick,
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
              const icon = notif.title?.includes('Izin') ? '📋' : (TYPE_ICONS[notif.type] || '🔔');
              const actionLabel = ACTION_LABELS[notif.type];
              const isParentMsg = notif.type === 'parent_message';

              return (
                <div
                  key={notif.id}
                  onClick={() => onNotifClick(notif)}
                  className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-[3px] ${pStyle.border} ${!notif.is_read ? pStyle.bg : 'bg-white'} ${isParentMsg ? 'cursor-pointer' : ''}`}
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
                      {actionLabel && !isParentMsg && notif.action_url && (
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
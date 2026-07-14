'use client';

import PklInfoSection from '@/app/components/PklInfoSection'
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, User, GraduationCap, BookOpen, Award, AlertTriangle, Calendar, Clock,
  MapPin, CheckCircle, XCircle, MessageCircle, Send, Bell, ChevronRight, ChevronLeft,
  Download, Phone, School, Shield, Star, TrendingUp, TrendingDown, LogOut, Eye, Trash2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { searchStudentByNIS, getDashboardData, sendParentMessage, deleteParentMessage, markNotificationRead, getParentNotifications } from '@/app/actions/parentPortalActions';
import { getPklStudentProfile } from '@/app/actions/pklActions';
import { supabase } from '@/lib/supabase';

const PIE_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const STATUS_MAP = {
  Hadir: { color: 'bg-green-100 text-green-700 border-green-300', icon: '🟢', label: 'Hadir' },
  Izin: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '🟡', label: 'Izin' },
  Sakit: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '🟠', label: 'Sakit' },
  Alpha: { color: 'bg-red-100 text-red-700 border-red-300', icon: '🔴', label: 'Alpha' },
};
const CAL_COLORS = {
  effective: 'bg-green-100 text-green-800', weekend: 'bg-gray-100 text-gray-400',
  holiday_nasional: 'bg-red-100 text-red-700', holiday_sekolah: 'bg-yellow-100 text-yellow-700',
  ujian: 'bg-blue-100 text-blue-700', kegiatan: 'bg-purple-100 text-purple-700'
};
const PKL_BADGE = {
  'Hadir': { color: 'bg-green-100 text-green-700 border-green-300', icon: '🟢', label: 'Hadir' },
  'Terlambat': { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: '🟡', label: 'Terlambat' },
  'Sakit': { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '🟠', label: 'Sakit' },
  'Izin': { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '🔵', label: 'Izin' },
  'Alpha': { color: 'bg-red-100 text-red-700 border-red-300', icon: '🔴', label: 'Alpha' },
};
const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

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

/* ============ DONUT CHART COMPONENT ============ */
function DonutChart({ data, centerValue, centerLabel, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={size/2 - 20} fill="none" stroke="#e5e7eb" strokeWidth="20" />
        </svg>
        <div className="absolute text-center">
          <p className="text-2xl font-extrabold text-gray-300">0%</p>
          <p className="text-[9px] text-gray-300">{centerLabel}</p>
        </div>
      </div>
    );
  }

  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="20" />
        {/* Data arcs */}
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const el = (
            <circle
              key={i}
              cx={size/2} cy={size/2} r={radius}
              fill="none"
              stroke={PIE_COLORS[i] || '#94a3b8'}
              strokeWidth="20"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      {/* Center text */}
      <div className="absolute text-center">
        <p className="text-2xl font-extrabold text-gray-800">{centerValue}</p>
        <p className="text-[9px] text-gray-500">{centerLabel}</p>
      </div>
    </div>
  );
}

/* ============ SKELETON ============ */
const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-40 bg-gray-200 rounded-2xl" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-gray-200 rounded-2xl" />
      <div className="h-80 bg-gray-200 rounded-2xl" />
    </div>
  </div>
);

/* ============ MAIN PAGE ============ */
export default function PortalOrtu() {
  const [nisInput, setNisInput] = useState('');
  const [student, setStudent] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  const msgEndRef = useRef(null);
    // ── Notifikasi Lonceng State ──
  const [ortuNotifs, setOrtuNotifs] = useState([]);
  const [ortuNotifUnread, setOrtuNotifUnread] = useState(0);
  const [notifShaking, setNotifShaking] = useState(false);
  const notifBellRef = useRef(null);
  const notifPanelRef = useRef(null);
  const [isPkl, setIsPkl] = useState(false);
  const [pklStats, setPklStats] = useState(null);

  useEffect(() => {
    if (!isPkl || !student) return
    let cancelled = false
    const fetch = async () => {
      try {
        const res = await getPklStudentProfile({ studentId: student.id })
        if (cancelled) return
        if (res.isPkl) {
          const today = new Date().toLocaleDateString('sv-SE')
          const monthStr = today.substring(0, 7)
          const mAtt = res.attendance || []
          const mMonth = mAtt.filter(a => a.attendance_date.startsWith(monthStr))
          const todayAtt = mAtt.find(a => a.attendance_date === today)
          const totalRec = mMonth.filter(a => !['Libur'].includes(a.status)).length
          const hadirCount = mMonth.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length
          setPklStats({
            todayStatus: todayAtt?.status || null,
            todayCheckIn: todayAtt?.check_in_time || null,
            todayLate: todayAtt?.is_late || false,
            persentase: totalRec > 0 ? Math.round((hadirCount / totalRec) * 100) : 0,
            hadir: mMonth.filter(a => a.status === 'Hadir').length,
            terlambat: mMonth.filter(a => a.status === 'Terlambat').length,
            sakit: mMonth.filter(a => a.status === 'Sakit').length,
            izin: mMonth.filter(a => a.status === 'Izin').length,
            alpha: mMonth.filter(a => a.status === 'Alpha').length,
          })
        }
      } catch (e) { console.error(e) }
    }
    fetch()
    return () => { cancelled = true }
  }, [isPkl, student])

  const refreshData = async () => {
    if (!student) return;
    const nisn = student.nisn || student.nis || ''
    const d = await getDashboardData(student.id, nisn, student.kelas || '', student.jurusan || '');
    setData(d);
  };

  const handleSearch = async () => {
    if (!nisInput.trim()) return;
    setLoading(true);
    try {
      const s = await searchStudentByNIS(nisInput.trim());
      if (!s) { alert('Siswa tidak ditemukan. Pastikan NISN benar.'); setLoading(false); return; }
      setStudent(s);
      const nisn = s.nisn || s.nis || ''
      const d = await getDashboardData(s.id, nisn, s.kelas || '', s.jurusan || '');
      setData(d);
    } catch (err) { console.error(err); alert('Terjadi kesalahan.'); }
    setLoading(false);
  };

  const handleSendMsg = async () => {
    if (!msgText.trim() || !student) return;
    setSendingMsg(true);
    await sendParentMessage(student.id, msgText.trim());
    setMsgText('');
    await refreshData();
    setSendingMsg(false);
  };

  const handleDeleteMsg = async (messageId) => {
    if (!confirm('Hapus pesan ini?')) return;
    setDeletingMsgId(messageId);
    const result = await deleteParentMessage(messageId);
    if (result.error) {
      alert(result.error);
    } else {
      await refreshData();
    }
    setDeletingMsgId(null);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setOrtuNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setOrtuNotifUnread(prev => Math.max(0, prev - 1));
    await refreshData();
  };

  const handleExport = () => {
    if (!student || !data) return;
    const nisn = data.nisValue || '-'
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Laporan ${student.nama}</title>
    <style>body{font-family:Arial;padding:30px;color:#333}h1{color:#1976D2}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1976D2;color:white}.green{color:#16a34a}.red{color:#991b1b}.yellow{color:#854d0e}.orange{color:#9a3412}.summary{display:flex;gap:20px;margin:20px 0;flex-wrap:wrap}.card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;min-width:150px}@media print{body{padding:10px}}</style></head><body>
    <h1>📋 Laporan Bulanan Siswa</h1>
    <p><strong>Nama:</strong> ${student.nama} | <strong>NISN:</strong> ${nisn} | <strong>Kelas:</strong> ${student.kelas} ${student.jurusan}</p>
    <p><strong>Periode:</strong> ${data.currentYear}-${String(data.currentMonth).padStart(2,'0')} | <strong>Tahun Pelajaran:</strong> ${data.academicYear?.school_year || '-'} ${data.academicYear?.semester || ''}</p>
    <div class="summary">
      <div class="card"><strong>Hari Efektif</strong><br/><span style="font-size:24px;font-weight:bold">${data.effectiveCount}</span></div>
      <div class="card"><strong>Hadir</strong><br/><span style="font-size:24px;font-weight:bold;color:#16a34a">${data.hadir}</span></div>
      <div class="card"><strong>Izin</strong><br/><span style="font-size:24px;font-weight:bold;color:#ca8a04">${data.izin}</span></div>
      <div class="card"><strong>Sakit</strong><br/><span style="font-size:24px;font-weight:bold;color:#ea580c">${data.sakit}</span></div>
      <div class="card"><strong>Alpha</strong><br/><span style="font-size:24px;font-weight:bold;color:#dc2626">${data.alpha}</span></div>
      <div class="card"><strong>Persentase</strong><br/><span style="font-size:24px;font-weight:bold;color:#1976D2">${data.persentase}%</span></div>
    </div>
    <h2>🏆 Reward (${data.totalReward} Poin)</h2>
    <table><tr><th>Tanggal</th><th>Jenis</th><th>Poin</th><th>Pemberi</th></tr>
    ${data.rewards.length ? data.rewards.map(r => `<tr><td>${r.tanggal}</td><td>${r.reward_nama}</td><td>${r.reward_poin}</td><td>${r.diberikan_oleh}</td></tr>`).join('') : '<tr><td colspan="4">Belum ada data</td></tr>'}</table>
    <h2>⚠️ Pelanggaran (${data.totalPelanggaran} Poin)</h2>
    <table><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Poin</th></tr>
    ${data.pelanggaran.length ? data.pelanggaran.map(p => `<tr><td>${p.tanggal}</td><td>${p.jenis_pelanggaran}</td><td>${p.kategori}</td><td>${p.poin}</td></tr>`).join('') : '<tr><td colspan="4">Belum ada data</td></tr>'}</table>
    <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  useEffect(() => {
    if (msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

    // ── Fetch notifikasi orang tua ──
  const fetchOrtuNotifs = useCallback(async () => {
    if (!student) return;
    try {
      const res = await getParentNotifications(student.id);
      if (!res.error) {
        setOrtuNotifs(res.data);
        setOrtuNotifUnread(res.data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('[fetchOrtuNotifs] Error:', err);
    }
  }, [student]);

  useEffect(() => { fetchOrtuNotifs(); }, [fetchOrtuNotifs]);

  // ── Supabase Realtime: parent_notifications ──
  useEffect(() => {
    if (!student) return;
    const channel = supabase
      .channel(`parent-notif-${student.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'parent_notifications',
        filter: `student_id=eq.${student.id}`,
      }, () => {
        fetchOrtuNotifs();
        setNotifShaking(true);
        setTimeout(() => setNotifShaking(false), 700);
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[PortalOrtu] WebSocket notif gagal, polling fallback aktif');
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [student, fetchOrtuNotifs]);

  // ── Polling fallback notifikasi: setiap 15 detik ──
  useEffect(() => {
    if (!student) return;
    const iv = setInterval(fetchOrtuNotifs, 15000);
    return () => clearInterval(iv);
  }, [student, fetchOrtuNotifs]);

  // ── Shake berulang jika ada unread notif ──
  useEffect(() => {
    if (ortuNotifUnread <= 0) return;
    const iv = setInterval(() => {
      setNotifShaking(true);
      setTimeout(() => setNotifShaking(false), 700);
    }, 5000);
    return () => clearInterval(iv);
  }, [ortuNotifUnread]);

  // ── Click outside notif dropdown (mouse + touch) ──
  useEffect(() => {
    if (!showNotif) return;
    function handleClickOutside(e) {
      if (
        notifPanelRef.current && !notifPanelRef.current.contains(e.target) &&
        notifBellRef.current && !notifBellRef.current.contains(e.target)
      ) {
        setShowNotif(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotif]);

  // ===== SEARCH SCREEN =====
  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={36} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Portal Orang Tua</h1>
          <p className="text-gray-500 text-sm mb-8">Masukkan NISN siswa untuk memantau perkembangan putra-putri Anda</p>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text" value={nisInput} onChange={(e) => setNisInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Masukkan NISN Siswa..." disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-800 outline-none text-sm transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSearch} disabled={loading || !nisInput.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
          >
            {loading ? '⏳ Mencari...' : 'Lihat Dashboard'}
          </button>
        </div>
      <style>{`
        @keyframes ortuBellShake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(4deg); }
        }
        .ortu-bell-shake { animation: ortuBellShake 0.7s ease-in-out; }
      `}</style>
    </div>
  );
}

  if (loading || !data) return <div className="min-h-screen bg-gray-50 p-4 md:p-8"><Skeleton /></div>;

  const ts = data.todayStatus ? STATUS_MAP[data.todayStatus.status] : null;
  const pieData = [
    { name: 'Hadir', value: data.hadir },
    { name: 'Izin', value: data.izin },
    { name: 'Sakit', value: data.sakit },
    { name: 'Alpha', value: data.alpha }
  ].filter(d => d.value > 0);
  const rewardChartData = Object.entries(data.rewardMonthly).map(([m, v]) => ({ month: m, poin: v }));
  const pelanggaranChartData = Object.entries(data.pelanggaranMonthly).map(([m, v]) => ({ month: m, poin: v }));
  const studentNisn = data.nisValue || student.nisn || student.nis || '-'

  const changeMonth = (dir) => {
    let m = calMonth + dir, y = calYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCalMonth(m); setCalYear(y);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== TOP NAV BAR ===== */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setStudent(null); setData(null); setNisInput(''); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="Ganti Siswa">
            <LogOut size={18} />
          </button>
          <div>
            <p className="text-sm font-bold text-gray-800">{student.nama}</p>
            <p className="text-[11px] text-gray-400">NISN: {studentNisn} • {student.kelas} {student.jurusan}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Download size={14} /> Export PDF
          </button>
          <div className="relative">
            <button ref={notifBellRef} onClick={() => setShowNotif(!showNotif)} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <Bell size={18} className={notifShaking ? 'ortu-bell-shake' : ''} />
              {ortuNotifUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {ortuNotifUnread > 99 ? '99+' : ortuNotifUnread}
                </span>
              )}
            </button>
            {showNotif && (
              <div
                ref={notifPanelRef}
                className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                style={{ maxHeight: `${typeof window !== 'undefined' ? Math.min(360, window.innerHeight - 80) : 360}px` }}
              >
                <div className="p-3 border-b border-gray-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-gray-600" />
                    <p className="text-sm font-bold text-gray-800">Notifikasi</p>
                    {ortuNotifUnread > 0 && (
                      <span className="bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{ortuNotifUnread} baru</span>
                    )}
                  </div>
                  <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600 text-xs p-1">✕</button>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: `${typeof window !== 'undefined' ? Math.min(300, window.innerHeight - 130) : 300}px` }}>
                  {ortuNotifs.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-xs text-gray-400">Belum ada notifikasi</p>
                    </div>
                  ) : ortuNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                      className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                      </div>
                      {n.message && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* ===== HERO HEADER ===== */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -bottom-8 w-28 h-28 bg-white/5 rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 rounded-2xl flex items-center justify-center text-4xl md:text-5xl backdrop-blur-sm border border-white/20">
              {student.jenis_kelamin === 'L' ? '👨‍🎓' : '👩‍🎓'}
            </div>
            <div className="flex-1">
              <p className="text-blue-200 text-sm mb-1">Selamat Datang Bapak/Ibu Wali</p>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-1">{student.nama}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-blue-200 mb-3">
                <span className="flex items-center gap-1"><GraduationCap size={14} /> NISN: {studentNisn}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><School size={14} /> {student.kelas} {student.jurusan}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {data.academicYear?.school_year || '-'} {data.academicYear?.semester || ''}</span>
              </div>
              {isPkl && pklStats ? (
                pklStats.todayStatus ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${PKL_BADGE[pklStats.todayStatus]?.color || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                    {PKL_BADGE[pklStats.todayStatus]?.icon || '⏳'} {PKL_BADGE[pklStats.todayStatus]?.label || pklStats.todayStatus} PKL
                    {pklStats.todayLate && <span className="ml-1 text-amber-600">⏰</span>}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-sky-100 text-sky-700 border-sky-300">
                    🔴 Belum Absen PKL
                  </span>
                )
              ) : ts ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${ts.color}`}>
                  {ts.icon} {ts.label} Hari Ini
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-300">
                  🔴 Belum Absen
                </span>
              )}
            </div>
          </div>
          <p className="relative z-10 mt-4 text-blue-100 text-xs md:text-sm leading-relaxed">
            Pantau perkembangan akademik, kedisiplinan, dan kehadiran putra-putri Anda secara real-time.
          </p>
      </div>

      {/* Banner Status Non-Aktif */}
      {(student.status || '').trim() === 'Pindah' || (student.status || '').trim() === 'Keluar' ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">
              Status Non-Aktif: {(student.status || '').trim()}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {(student.status || '').trim() === 'Pindah'
                ? 'Siswa ini sudah pindah ke sekolah lain.'
                : 'Siswa ini sudah keluar dari sekolah.'}
            </p>
          </div>
        </div>
      ) : null}

      {/* ===== 6 SUMMARY CARDS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {(() => {
            const pklTotalRec = pklStats ? (pklStats.hadir + pklStats.terlambat + pklStats.sakit + pklStats.izin + pklStats.alpha) : 0
            return [
              isPkl && pklStats
                ? { label: 'Kehadiran PKL', value: `${pklStats.persentase}%`, icon: <Calendar size={20} />, gradient: 'from-sky-500 to-blue-600', sub: `${pklStats.hadir + pklStats.terlambat}/${pklTotalRec} hari` }
                : { label: 'Kehadiran', value: `${data.persentase}%`, icon: <CheckCircle size={20} />, gradient: 'from-green-500 to-emerald-600', sub: `${data.hadir}/${data.effectiveCount} hari` },
              { label: 'Total Reward', value: `${data.totalReward}`, icon: <Award size={20} />, gradient: 'from-blue-500 to-blue-600', sub: 'poin' },
              { label: 'Pelanggaran', value: `${data.totalPelanggaran}`, icon: <AlertTriangle size={20} />, gradient: data.totalPelanggaran > 0 ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500', sub: 'poin' },
              isPkl && pklStats
                ? { label: 'PKL Hari Ini', value: pklStats.todayStatus ? (PKL_BADGE[pklStats.todayStatus]?.icon || '') + ' ' + (PKL_BADGE[pklStats.todayStatus]?.label || pklStats.todayStatus) : 'Belum Absen', icon: <Calendar size={20} />, gradient: pklStats.todayStatus ? 'from-sky-500 to-blue-600' : 'from-gray-400 to-gray-500', sub: pklStats.todayCheckIn ? `Masuk ${pklStats.todayCheckIn}` : '-' }
                : { label: 'Hari Ini', value: ts ? ts.label : 'Belum Absen', icon: <Eye size={20} />, gradient: ts ? (data.todayStatus?.status === 'Hadir' ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-amber-600') : 'from-gray-400 to-gray-500', sub: data.todayStatus?.input_by || '-' },
              { label: 'Ranking', value: data.rank > 0 ? `#${data.rank}` : '-', icon: <TrendingUp size={20} />, gradient: 'from-purple-500 to-purple-600', sub: 'reward' },
              { label: 'Pesan WK', value: data.unreadMessages, icon: <MessageCircle size={20} />, gradient: data.unreadMessages > 0 ? 'from-orange-500 to-amber-600' : 'from-gray-400 to-gray-500', sub: 'belum dibaca' },
            ]
          })().map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.gradient} rounded-xl p-4 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className="opacity-80">{c.icon}</span>
              </div>
              <p className="text-xl md:text-2xl font-extrabold">{c.value}</p>
              <p className="text-[10px] md:text-xs opacity-80 mt-0.5">{c.label}</p>
              <p className="text-[9px] md:text-[10px] opacity-60">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ===== MAIN 2-COLUMN LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* SECTION 3: Status Hari Ini — sembunyikan jika PKL (sudah ditampilkan PklInfoSection) */}
            {!isPkl && (
            <div className={`rounded-2xl p-6 border ${data.todayStatus?.status === 'Hadir' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : data.todayStatus?.status === 'Alpha' ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : data.todayStatus ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'}`}>
            {/* SECTION 3: Status Hari Ini */}
            <div className={`rounded-2xl p-6 border ${data.todayStatus?.status === 'Hadir' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : data.todayStatus?.status === 'Alpha' ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' : data.todayStatus ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'}`}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Eye size={20} className="text-blue-600" /> Status Hari Ini</h2>
              {data.todayStatus ? (
                <div className="text-center py-4">
                  <span className="text-5xl block mb-3">{STATUS_MAP[data.todayStatus.status]?.icon || '🔴'}</span>
                  <p className="text-2xl font-extrabold text-gray-800 mb-1">{STATUS_MAP[data.todayStatus.status]?.label || 'Alpha'}</p>
                  <div className="space-y-1.5 mt-4 text-xs text-gray-600">
                    <p className="flex items-center justify-center gap-2"><Clock size={14} /> {new Date(data.todayStatus.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="flex items-center justify-center gap-2"><User size={14} /> {data.todayStatus.input_by}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-5xl block mb-3">🔴</span>
                  <p className="text-xl font-extrabold text-gray-800">Belum Absen</p>
                  <p className="text-xs text-gray-500 mt-2">Siswa belum melakukan absensi hari ini</p>
                </div>
              )}
            </div>
            </div>
            )}

            {/* SECTION 1: Profil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={20} className="text-blue-600" /> Profil Akademik & Siswa</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Nama', student.nama],
                  ['NISN', studentNisn],
                  ['Kelas', `${student.kelas} ${student.jurusan}`],
                  ['Jurusan', student.jurusan],
                  ['Jenis Kelamin', student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
                  ['Status', student.status],
                  ['Wali Kelas', data.waliKelas?.nama || '-'],
                  ['Sekretaris', data.sekretaris?.nama || '-'],
                  ['Tahun Pelajaran', data.academicYear?.school_year || '-'],
                  ['Semester', data.academicYear?.semester || '-'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">{val || '-'}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {data.waliKelas?.whatsapp && (
                  <a href={`https://wa.me/${data.waliKelas.whatsapp.replace(/^0/, '62')}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700">
                    <Phone size={14} /> WA Wali Kelas
                  </a>
                )}
                {data.sekretaris?.whatsapp && (
                  <a href={`https://wa.me/${data.sekretaris.whatsapp.replace(/^0/, '62')}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700">
                    <Phone size={14} /> WA Sekretaris
                  </a>
                )}
              </div>
            </div>

            {/* ── Cek & Tampilkan Info PKL ── */}
            <PklInfoSection studentId={student.id} onPklDetected={setIsPkl} />

            {/* Kehadiran Sekolah — sembunyikan jika siswa PKL */}
            {!isPkl && (
            <>
            {/* SECTION 2: Kehadiran Bulan Ini */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2"><Calendar size={20} className="text-blue-600" /> Kehadiran Bulan Ini</h2>

              {/* Donut Chart */}
              <div className="flex justify-center mb-5">
                <DonutChart
                  data={pieData}
                  centerValue={`${data.persentase}%`}
                  centerLabel="Kehadiran"
                  size={180}
                />
              </div>

              {/* Legend dengan angka */}
              <div className="flex justify-center gap-4 md:gap-6 mb-5">
                {[
                  { label: 'Hadir', value: data.hadir, color: 'bg-green-500', textColor: 'text-green-700' },
                  { label: 'Izin', value: data.izin, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                  { label: 'Sakit', value: data.sakit, color: 'bg-orange-500', textColor: 'text-orange-700' },
                  { label: 'Alpha', value: data.alpha, color: 'bg-red-500', textColor: 'text-red-700' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-[11px] text-gray-500">{item.label}</span>
                    <span className={`text-xs font-bold ${item.textColor}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Statistik detail */}
              <div className="space-y-2 mb-4">
                {[
                  ['Hari Efektif', data.effectiveCount, 'text-gray-700'],
                  ['Hadir', data.hadir, 'text-green-600'],
                  ['Izin', data.izin, 'text-yellow-600'],
                  ['Sakit', data.sakit, 'text-orange-600'],
                  ['Alpha', data.alpha, 'text-red-600'],
                ].map(([l, v, c]) => (
                  <div key={l} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500">{l}</span>
                    <span className={`text-sm font-bold ${c}`}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Riwayat Terakhir</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.attendanceTimeline.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Belum ada data absensi bulan ini</p>
                  ) : data.attendanceTimeline.map((a) => {
                    const s = STATUS_MAP[a.status] || STATUS_MAP.Alpha;
                    return (
                      <div key={a.id} className="flex items-center gap-3 text-xs">
                        <span className="text-gray-400 w-20 flex-shrink-0">{new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span className={`${s.color} px-2 py-0.5 rounded-full text-[10px] font-bold border`}>{s.icon} {s.label}</span>
                        <span className="text-gray-400 text-[10px] truncate">{a.input_by}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </>
            )}

            {/* SECTION 6: Kedisiplinan & Prestasi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Shield size={20} className="text-blue-600" /> Kedisiplinan & Prestasi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reward Panel */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🏆</span>
                    <p className="text-sm font-bold text-gray-700">Reward ({data.totalReward} poin)</p>
                  </div>
                  {rewardChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={rewardChartData}>
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="poin" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-gray-400 text-center py-4">Belum ada data</p>}
                  <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                    {data.rewards.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">Belum ada reward</p>
                    ) : data.rewards.map((r) => (
                      <div key={r.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5 text-[11px]">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-700 truncate">{r.reward_nama}</p>
                          <p className="text-gray-400">{new Date(r.tanggal).toLocaleDateString('id-ID')} • {r.diberikan_oleh}</p>
                        </div>
                        <span className="text-blue-600 font-bold ml-2 flex-shrink-0">+{r.reward_poin}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Pelanggaran Panel */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚠️</span>
                    <p className="text-sm font-bold text-gray-700">Pelanggaran ({data.totalPelanggaran} poin)</p>
                  </div>
                  {pelanggaranChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={pelanggaranChartData}>
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="poin" fill="#ef4444" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-xs text-gray-400 text-center py-4">Belum ada data</p>}
                  <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                    {data.pelanggaran.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">Belum ada pelanggaran</p>
                    ) : data.pelanggaran.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-1.5 text-[11px]">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-700 truncate">{p.jenis_pelanggaran}</p>
                          <p className="text-gray-400">{new Date(p.tanggal).toLocaleDateString('id-ID')} • {p.kategori}</p>
                        </div>
                        <span className="text-red-600 font-bold ml-2 flex-shrink-0">-{p.poin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: Catatan SP */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Catatan Surat Pernyataan
              </h2>

              {data.penanganan && (data.penanganan.sp1 || data.penanganan.sp2 || data.penanganan.sp3) ? (
                <div className="space-y-3">
                  {/* Status Pembinaan BK */}
                  {data.penanganan.layanan_bk && data.penanganan.layanan_bk !== 'Belum' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-xl">👨‍⚕️</span>
                      <div>
                        <p className="text-xs font-bold text-amber-800">Pembinaan BK</p>
                        <p className="text-[11px] text-amber-600">{data.penanganan.layanan_bk}</p>
                      </div>
                    </div>
                  )}

                  {/* Catatan BK */}
                  {data.penanganan.catatan_bk && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Catatan BK</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{data.penanganan.catatan_bk}</p>
                    </div>
                  )}

                  {/* SP1 */}
                  {data.penanganan.sp1 && (
                    <div className={`border rounded-xl p-4 ${data.penanganan.sp2 || data.penanganan.sp3 ? 'bg-yellow-50 border-yellow-300' : 'bg-orange-50 border-orange-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-yellow-500 text-white rounded-lg flex items-center justify-center text-xs font-extrabold">1</span>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Surat Pernyataan 1</p>
                            <p className="text-[10px] text-gray-500">SP1 — Pernyataan Pertama</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-yellow-500 text-white text-[10px] font-bold rounded-full">Aktif</span>
                      </div>
                      {data.penanganan.tgl_sp1 && (
                        <p className="text-[11px] text-gray-600 mt-2 ml-10">📅 Diberikan: {new Date(data.penanganan.tgl_sp1).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      )}
                    </div>
                  )}

                  {/* SP2 */}
                  {data.penanganan.sp2 && (
                    <div className={`border rounded-xl p-4 ${data.penanganan.sp3 ? 'bg-orange-50 border-orange-300' : 'bg-red-50 border-red-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-extrabold">2</span>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Surat Pernyataan 2</p>
                            <p className="text-[10px] text-gray-500">SP2 — Pernyataan Kedua</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full">Aktif</span>
                      </div>
                      {data.penanganan.tgl_sp2 && (
                        <p className="text-[11px] text-gray-600 mt-2 ml-10">📅 Diberikan: {new Date(data.penanganan.tgl_sp2).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      )}
                    </div>
                  )}

                  {/* SP3 */}
                  {data.penanganan.sp3 && (
                    <div className="border border-red-300 bg-red-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center text-xs font-extrabold">3</span>
                          <div>
                            <p className="text-sm font-bold text-gray-800">Surat Pernyataan 3</p>
                            <p className="text-[10px] text-gray-500">SP3 — Pernyataan Terakhir</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full">Aktif</span>
                      </div>
                      {data.penanganan.tgl_sp3 && (
                        <p className="text-[11px] text-gray-600 mt-2 ml-10">📅 Diberikan: {new Date(data.penanganan.tgl_sp3).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      )}
                    </div>
                  )}

                  {/* Total Poin */}
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">Total Poin Pelanggaran</span>
                    <span className="text-lg font-extrabold text-red-600">{data.penanganan.total_poin || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-green-500" />
                  </div>
                  <p className="text-sm font-bold text-green-700">Tidak Ada Surat Pernyataan</p>
                  <p className="text-xs text-gray-400 mt-1">Siswa tidak memiliki catatan SP1, SP2, atau SP3</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* SECTION 7: Radar Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Star size={20} className="text-blue-600" /> Ringkasan Perkembangan</h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={data.radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Skor" dataKey="value" stroke="#1976D2" fill="rgba(25,118,210,0.2)" strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {data.radarData.map((r) => (
                  <span key={r.subject} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                    {r.subject}: <span className="text-blue-600">{r.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* SECTION 4: Kalender */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Calendar size={20} className="text-blue-600" /> Kalender</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-bold text-gray-700 min-w-[120px] text-center">{monthNames[calMonth - 1]} {calYear}</span>
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  ['Efektif', 'bg-green-100 text-green-700'], ['Libur Nasional', 'bg-red-100 text-red-700'],
                  ['Libur Sekolah', 'bg-yellow-100 text-yellow-700'], ['Ujian', 'bg-blue-100 text-blue-700'],
                  ['Kegiatan', 'bg-purple-100 text-purple-700'], ['Weekend', 'bg-gray-100 text-gray-400'],
                ].map(([l, c]) => (
                  <span key={l} className={`text-[8px] px-1.5 py-0.5 rounded font-semibold ${c}`}>{l}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
                  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
                  const todayStr = new Date().toLocaleDateString('sv-SE')
                  const holiData = data.allHolidays || []
                  const cells = []
                  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dt = new Date(calYear, calMonth - 1, d)
                    const dateStr = dt.toLocaleDateString('sv-SE')
                    const day = dt.getDay()
                    const holiday = holiData.find(h => h.date === dateStr)
                    let type = 'effective'
                    if (day === 0 || day === 6) {
                      type = 'weekend'
                    } else if (holiday) {
                      const cat = holiday.category
                      if (cat === 'Nasional') type = 'holiday_nasional'
                      else if (cat === 'Ujian') type = 'ujian'
                      else if (cat === 'Kegiatan Sekolah' || cat === 'Khusus') type = 'kegiatan'
                      else type = 'holiday_sekolah'
                    }
                    const isToday = dateStr === todayStr
                    cells.push(
                      <div key={d} title={holiday?.holiday_name || ''} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-semibold relative ${CAL_COLORS[type]} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
                        {d}
                        {holiday?.holiday_name && <span className="text-[6px] leading-tight text-center mt-0.5 line-clamp-2 px-0.5">{holiday.holiday_name}</span>}
                      </div>
                    )
                  }
                  return cells
                })()}
              </div>
            </div>

            {/* SECTION 5: Pesan Wali Kelas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" style={{ height: '420px' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><MessageCircle size={20} className="text-blue-600" /> Pesan Wali Kelas</h2>
                {data.waliKelas && <span className="text-[10px] text-gray-400">{data.waliKelas.nama}</span>}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 min-h-0">
                {data.messages.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">Belum ada pesan</p>
                ) : data.messages.map((m) => {
                  const isParent = m.sender_type === 'Orang Tua'
                  return (
                    <div key={m.id} className={`group flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[80%] rounded-2xl px-3 py-2 text-xs ${isParent ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                        <p>{m.message}</p>
                        <div className={`flex items-center justify-between mt-1 ${isParent ? 'text-blue-200' : 'text-gray-400'}`}>
                          <p className="text-[9px]">
                            {new Date(m.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isParent && (
                            <button
                              onClick={() => handleDeleteMsg(m.id)}
                              disabled={deletingMsgId === m.id}
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300 disabled:opacity-50"
                              title="Hapus pesan"
                            >
                              {deletingMsgId === m.id ? (
                                <span className="text-[9px]">Menghapus...</span>
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={msgEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
                  placeholder="Tulis pesan..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button onClick={handleSendMsg} disabled={sendingMsg || !msgText.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* SECTION 8: Aktivitas Terbaru */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-blue-600" /> Aktivitas Terbaru</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.activities.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Belum ada aktivitas</p>
                ) : data.activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                      a.type === 'reward' ? 'bg-blue-100' : a.type === 'pelanggaran' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {a.type === 'reward' ? '🏆' : a.type === 'pelanggaran' ? '⚠️' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-700 truncate">{a.title}</p>
                      <p className="text-gray-400 text-[10px]">{new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {a.poin != null && (
                      <span className={`font-bold flex-shrink-0 ${a.type === 'reward' ? 'text-blue-600' : 'text-red-600'}`}>
                        {a.type === 'reward' ? '+' : '-'}{a.poin}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
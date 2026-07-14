'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSiswaDetail } from '@/app/actions/cariSiswaActions';
import { getPklStudentProfile } from '@/app/actions/pklActions';
import PklInfoSection from '@/app/components/PklInfoSection';

// ─── Helper Functions ────────────────────────────────────────────

function getInitials(nama) {
  return nama
    .split(' ')
    .filter((w) => w)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(nama) {
  const colors = ['#1E40AF', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#BE185D'];
  let hash = 0;
  for (let i = 0; i < nama.length; i++) hash = nama.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTanggal(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatWaktu(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function statusAbsenBadge(status) {
  const map = {
    Hadir: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', icon: '✅' },
    Sakit: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', icon: '🤒' },
    Izin: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', icon: '📝' },
    Alpha: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', icon: '❌' },
  };
  return map[status] || { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', icon: '⏳' };
}

// ─── Donut Chart SVG ─────────────────────────────────────────────

function DonutChart({ stats, total }) {
  if (!total || total === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Belum ada data kehadiran</div>;
  }

  const data = [
    { label: 'Hadir', value: stats.hadir, color: '#16A34A' },
    { label: 'Sakit', value: stats.sakit, color: '#F59E0B' },
    { label: 'Izin', value: stats.izin, color: '#1E40AF' },
    { label: 'Alpha', value: stats.alpha, color: '#DC2626' },
  ];

  const size = 180, strokeWidth = 28, radius = (size - strokeWidth) / 2, center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const segments = data.filter((d) => d.value > 0).map((d) => {
    const pct = d.value / total;
    const dashLength = pct * circumference;
    const offset = -currentOffset;
    currentOffset += dashLength;
    return { ...d, pct, dashLength, dashGap: circumference - dashLength, offset };
  });

  const persen = ((stats.hadir / total) * 100).toFixed(1);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <circle key={i} cx={center} cy={center} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${seg.dashLength} ${seg.dashGap}`} strokeDashoffset={seg.offset} strokeLinecap="round" className="transition-all duration-700" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-800">{persen}%</span>
          <span className="text-xs text-gray-400">Kehadiran</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
            {d.label}: <span className="font-semibold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 h-40 animate-pulse"></div>
      <div className="max-w-6xl mx-auto px-4 -mt-20">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
            <div className="flex-1"><div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div><div className="h-3 bg-gray-100 rounded w-1/3"></div></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">{[1,2,3,4].map(i=><div key={i} className="bg-gray-200 rounded-xl h-20 animate-pulse"></div>)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1,2,3,4].map(i=><div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div><div className="space-y-3"><div className="h-3 bg-gray-100 rounded"></div><div className="h-3 bg-gray-100 rounded w-3/4"></div></div></div>)}</div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function SiswaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [absenFilter, setAbsenFilter] = useState('bulan');
  const printRef = useRef(null);
  const [isPkl, setIsPkl] = useState(false);
  const [pklStats, setPklStats] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoading(true);
        const data = await getSiswaDetail(id);
        if (!data) setError('Data siswa tidak ditemukan');
        else setDetail(data);
      } catch (err) { setError('Gagal memuat data: ' + err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

    useEffect(() => {
    if (!isPkl || !id) return
    let cancelled = false
    const fetchPklStats = async () => {
      try {
        const res = await getPklStudentProfile({ studentId: id })
        if (cancelled) return
        if (res.isPkl && res.attendance) {
          const today = new Date().toLocaleDateString('sv-SE')
          const monthStr = today.substring(0, 7)
          const mAtt = res.attendance.filter(a => a.attendance_date.startsWith(monthStr))
          setPklStats({
            hadir: mAtt.filter(a => a.status === 'Hadir').length,
            terlambat: mAtt.filter(a => a.status === 'Terlambat').length,
            sakit: mAtt.filter(a => a.status === 'Sakit').length,
            izin: mAtt.filter(a => a.status === 'Izin').length,
            alpha: mAtt.filter(a => a.status === 'Alpha').length,
            libur: mAtt.filter(a => a.status === 'Libur').length,
          })
        }
      } catch (e) { console.error(e) }
    }
    fetchPklStats()
    return () => { cancelled = true }
  }, [isPkl, id])

  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(`${window.location.origin}/cari-data-siswa/${id}`, { width: 200, margin: 2, color: { dark: '#1E40AF', light: '#FFFFFF' } });
        setQrCode(dataUrl);
      } catch (e) { console.error(e); }
    })();
  }, [id]);

  const getFilteredAbsensi = () => {
    if (!detail?.allAbsensi) return [];
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    if (absenFilter === 'minggu') {
      const w = new Date(); w.setDate(w.getDate() - 7);
      const ws = w.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
      return detail.allAbsensi.filter((a) => a.tanggal >= ws && a.tanggal <= todayStr);
    }
    if (absenFilter === 'bulan') {
      const ms = todayStr.slice(0, 7);
      return detail.allAbsensi.filter((a) => a.tanggal.startsWith(ms));
    }
    if (absenFilter === 'semester' && detail.semesterAbsensi) return detail.semesterAbsensi;
    return detail.allAbsensi.slice(0, 20);
  };

  const getScores = () => {
    if (!detail) return null;
    const kehadiran = parseFloat(detail.persentaseKehadiran) || 0;
    const disiplin = Math.max(0, 100 - detail.totalPelanggaranPoin * 3);
    const prestasi = Math.min(100, detail.totalRewardPoin * 2);
    const overall = (kehadiran + disiplin + prestasi) / 3;
    let statusLabel = 'Sangat Baik', statusColor = 'text-green-700 bg-green-100';
    if (detail.penanganan) {
      const t = detail.penanganan.tahap || '';
      if (t.includes('SP3') || detail.penanganan.sp3) { statusLabel = 'Dalam Penanganan'; statusColor = 'text-red-700 bg-red-100'; }
      else if (t.includes('SP2') || detail.penanganan.sp2) { statusLabel = 'Dalam Penanganan'; statusColor = 'text-red-700 bg-red-100'; }
      else if (t.includes('SP1') || detail.penanganan.sp1) { statusLabel = 'Perlu Pembinaan'; statusColor = 'text-yellow-700 bg-yellow-100'; }
      else if (t.includes('BK')) { statusLabel = 'Perlu Pembinaan'; statusColor = 'text-yellow-700 bg-yellow-100'; }
    } else if (overall >= 60) { statusLabel = 'Baik'; statusColor = 'text-blue-700 bg-blue-100'; }
    else if (overall >= 40) { statusLabel = 'Perlu Pembinaan'; statusColor = 'text-yellow-700 bg-yellow-100'; }
    else { statusLabel = 'Dalam Penanganan'; statusColor = 'text-red-700 bg-red-100'; }
    return { kehadiran, disiplin, prestasi, overall, statusLabel, statusColor };
  };

  const handleExportPDF = () => {
    if (!detail || !detail.siswa) return;
    const s = detail.siswa, sc = getScores();
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Profil - ${s.nama}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;color:#1e293b;font-size:13px}.header{text-align:center;border-bottom:3px double #1E40AF;padding-bottom:15px;margin-bottom:20px}.header h1{font-size:18px;color:#1E40AF}.header p{font-size:12px;color:#64748b;margin-top:4px}.section{margin-bottom:20px;page-break-inside:avoid}.section-title{font-size:14px;font-weight:bold;color:#1E40AF;border-left:4px solid #1E40AF;padding-left:10px;margin-bottom:10px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px}.info-item{display:flex;gap:8px}.info-label{color:#64748b;min-width:120px}.info-value{font-weight:600}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}th{background:#f1f5f9;font-weight:600}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stat-card{text-align:center;padding:10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}.stat-value{font-size:20px;font-weight:bold}.stat-label{font-size:11px;color:#64748b}.footer{text-align:center;margin-top:30px;font-size:11px;color:#94a3b8}</style></head><body><div class="header"><h1>PROFIL DATA SISWA</h1><p>SIPANDU</p></div><div class="section"><div class="section-title">PROFIL SISWA</div><div class="info-grid"><div class="info-item"><span class="info-label">Nama</span><span class="info-value">${s.nama}</span></div><div class="info-item"><span class="info-label">NISN</span><span class="info-value">${s.nisn||'—'}</span></div><div class="info-item"><span class="info-label">Kelas</span><span class="info-value">${s.kelas} - ${s.jurusan}</span></div><div class="info-item"><span class="info-label">Jenis Kelamin</span><span class="info-value">${s.jenis_kelamin||'—'}</span></div><div class="info-item"><span class="info-label">Status</span><span class="info-value">${s.status||'—'}</span></div></div></div><div class="section"><div class="section-title">STATISTIK KEHADIRAN SEMESTER</div><div class="stats-grid"><div class="stat-card"><div class="stat-value" style="color:#16A34A">${detail.stats.hadir}</div><div class="stat-label">Hadir</div></div><div class="stat-card"><div class="stat-value" style="color:#F59E0B">${detail.stats.sakit}</div><div class="stat-label">Sakit</div></div><div class="stat-card"><div class="stat-value" style="color:#1E40AF">${detail.stats.izin}</div><div class="stat-label">Izin</div></div><div class="stat-card"><div class="stat-value" style="color:#DC2626">${detail.stats.alpha}</div><div class="stat-label">Alpha</div></div></div><p style="margin-top:8px;font-size:12px;color:#64748b">Persentase Kehadiran: <strong>${detail.persentaseKehadiran}%</strong> dari ${detail.totalSemester} hari</p></div><div class="section"><div class="section-title">REWARD & PRESTASI</div><p>Total: <strong>${detail.rewards.length} reward</strong> dengan <strong>${detail.totalRewardPoin} poin</strong></p>${detail.rewards.length>0?`<table><tr><th>Tanggal</th><th>Reward</th><th>Poin</th></tr>${detail.rewards.slice(0,10).map(r=>`<tr><td>${formatTanggal(r.tanggal)}</td><td>${r.reward_nama||'—'}</td><td>${r.reward_poin||0}</td></tr>`).join('')}</table>`:'<p style="color:#94a3b8">Belum ada data reward</p>'}</div><div class="section"><div class="section-title">PELANGGARAN</div><p>Total: <strong>${detail.pelanggaran.length} pelanggaran</strong> dengan <strong>${detail.totalPelanggaranPoin} poin</strong></p>${detail.pelanggaran.length>0?`<table><tr><th>Tanggal</th><th>Pelanggaran</th><th>Poin</th><th>Kategori</th></tr>${detail.pelanggaran.slice(0,10).map(p=>`<tr><td>${formatTanggal(p.tanggal)}</td><td>${p.jenis_pelanggaran||'—'}</td><td>${p.poin||0}</td><td>${p.kategori||'—'}</td></tr>`).join('')}</table>`:'<p style="color:#94a3b8">Belum ada data pelanggaran</p>'}</div><div class="section"><div class="section-title">RINGKASAN SISWA</div><div class="stats-grid"><div class="stat-card"><div class="stat-value">${sc.kehadiran.toFixed(0)}</div><div class="stat-label">Kehadiran</div></div><div class="stat-card"><div class="stat-value">${sc.disiplin.toFixed(0)}</div><div class="stat-label">Disiplin</div></div><div class="stat-card"><div class="stat-value">${sc.prestasi.toFixed(0)}</div><div class="stat-label">Prestasi</div></div><div class="stat-card"><div class="stat-value">${sc.overall.toFixed(0)}</div><div class="stat-label">Keseluruhan</div></div></div><p style="margin-top:8px">Status: <strong>${sc.statusLabel}</strong></p></div><div class="footer">Dicetak dari SIPANDU pada ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})} WIB</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (loading) return <Skeleton />;
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{error}</h2>
          <button onClick={() => router.push('/cari-data-siswa')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">← Kembali ke Pencarian</button>
        </div>
      </div>
    );
  }
  if (!detail || !detail.siswa) return null;

  const s = detail.siswa;
  const scores = getScores();
  const filteredAbsensi = getFilteredAbsensi();
  const todayStatus = detail.absenHariIni?.status || null;
  const todayInfo = statusAbsenBadge(todayStatus);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/cari-data-siswa')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali
          </button>
          <h1 className="text-sm font-semibold text-gray-800 hidden sm:block">Detail Siswa</h1>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
            Cetak Profil
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6" ref={printRef}>

        {/* ═══ SECTION 1: PROFIL SISWA ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-20 sm:h-24"></div>
          <div className="px-4 sm:px-6 pb-6 pt-8 sm:pt-10 -mt-10 sm:-mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-white shadow-lg shrink-0" style={{ backgroundColor: getAvatarColor(s.nama) }}>
                {getInitials(s.nama)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{s.nama}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-sm text-gray-500">NISN: {s.nisn || '—'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{s.kelas} — {s.jurusan}</span>
                  <span className="text-gray-300">•</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status || '—'}</span>
                </div>
              </div>
              <div className="shrink-0 hidden sm:block">
                {qrCode && <div className="text-center"><img src={qrCode} alt="QR" className="w-20 h-20 rounded-lg border border-gray-200 mx-auto" /><p className="text-[10px] text-gray-400 mt-1">Scan untuk lihat profil</p></div>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100">
              {[['Jenis Kelamin', s.jenis_kelamin], ['Kelas', s.kelas], ['Jurusan', s.jurusan], ['Status', s.status]].map(([label, val]) => (
                <div key={label}><p className="text-xs text-gray-400 mb-0.5">{label}</p><p className="text-sm font-semibold text-gray-700">{val || '—'}</p></div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ STAT CARDS KEHADIRAN ═══ */}
        {isPkl && pklStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Hadir PKL', value: pklStats.hadir, icon: '✅', bg: 'bg-gradient-to-br from-emerald-500 to-green-600', shadow: 'shadow-green-200' },
              { label: 'Terlambat', value: pklStats.terlambat, icon: '⏰', bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', shadow: 'shadow-yellow-200' },
              { label: 'Sakit PKL', value: pklStats.sakit, icon: '🤒', bg: 'bg-gradient-to-br from-orange-400 to-amber-500', shadow: 'shadow-orange-200' },
              { label: 'Izin PKL', value: pklStats.izin, icon: '📝', bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
              { label: 'Alpha PKL', value: pklStats.alpha, icon: '❌', bg: 'bg-gradient-to-br from-red-500 to-rose-600', shadow: 'shadow-red-200' },
              { label: 'Libur PKL', value: pklStats.libur, icon: '📅', bg: 'bg-gradient-to-br from-gray-400 to-gray-500', shadow: 'shadow-gray-200' },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} ${card.shadow} rounded-2xl p-4 flex items-center gap-3 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default`}>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 text-2xl">
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-white leading-tight">{card.value}</p>
                  <p className="text-white/70 text-xs font-medium">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hadir', value: detail.stats.hadir, icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ), bg: 'bg-gradient-to-br from-green-500 to-emerald-600', shadow: 'shadow-green-200', text: 'text-white' },
              { label: 'Sakit', value: detail.stats.sakit, icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              ), bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', shadow: 'shadow-yellow-200', text: 'text-white' },
              { label: 'Izin', value: detail.stats.izin, icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              ), bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', shadow: 'shadow-blue-200', text: 'text-white' },
              { label: 'Alpha', value: detail.stats.alpha, icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ), bg: 'bg-gradient-to-br from-red-500 to-rose-600', shadow: 'shadow-red-200', text: 'text-white' },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} ${card.shadow} rounded-2xl p-4 flex items-center gap-3 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default`}>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                  <span className={card.text}>{card.icon}</span>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${card.text} leading-tight`}>{card.value}</p>
                  <p className="text-white/70 text-xs font-medium">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Cek & Tampilkan Info PKL ── */}
          <PklInfoSection studentId={id} onPklDetected={setIsPkl} />

          {/* Kehadiran Sekolah — sembunyikan jika siswa PKL */}
          {!isPkl && (
          <>

          {/* ═══ SECTION 2: STATUS KEHADIRAN HARI INI ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Status Kehadiran Hari Ini</h2>
            </div>
            {todayStatus ? (
              <div className={`${todayInfo.bg} rounded-xl p-5 text-center`}>
                <div className="text-3xl mb-2">{todayInfo.icon}</div>
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${todayInfo.bg} ${todayInfo.text} font-semibold`}>
                  <span className={`w-2 h-2 rounded-full ${todayInfo.dot}`}></span>{todayStatus}
                </span>
                {detail.absenHariIni.input_by && <p className="text-xs text-gray-500 mt-3">Metode: {detail.absenHariIni.input_by}</p>}
                {detail.absenHariIni.created_at && <p className="text-xs text-gray-500">Jam: {formatWaktu(detail.absenHariIni.created_at)} WIB</p>}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">⏳</div>
                <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-medium"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Belum Melakukan Absensi</span>
              </div>
            )}
          </div>

          {/* ═══ SECTION 3: STATISTIK KEHADIRAN ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Statistik Kehadiran</h2>
              <span className="text-xs text-gray-400 ml-auto">Semester Aktif</span>
            </div>
            <div className="flex justify-center"><DonutChart stats={detail.stats} total={detail.totalSemester} /></div>
            <div className="mt-4 text-center text-xs text-gray-400">Total {detail.totalSemester} hari tercatat</div>
          </div>

          {/* ═══ SECTION 4: RIWAYAT ABSENSI ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Riwayat Absensi Terakhir</h2>
              <div className="ml-auto flex gap-1">
                {['minggu', 'bulan', 'semester'].map((f) => (
                  <button key={f} onClick={() => setAbsenFilter(f)} className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${absenFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>
            {filteredAbsensi.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100"><th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Jam</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Sumber</th></tr></thead>
                  <tbody>{filteredAbsensi.map((a, i) => { const si = statusAbsenBadge(a.status); return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-gray-700">{formatTanggal(a.tanggal)}</td>
                      <td className="py-2.5 px-3"><span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${si.bg} ${si.text} font-medium`}><span className={`w-1.5 h-1.5 rounded-full ${si.dot}`}></span>{a.status}</span></td>
                      <td className="py-2.5 px-3 text-gray-500 hidden sm:table-cell">{formatWaktu(a.created_at)}</td>
                      <td className="py-2.5 px-3 text-gray-400 text-xs hidden md:table-cell">{a.input_by || '—'}</td>
                    </tr>
                  ); })}</tbody>
                </table>
              </div>
            ) : <div className="text-center py-8 text-gray-400 text-sm">Tidak ada data absensi pada periode ini</div>}
          </div>
          </>
          )}

          {/* ═══ SECTION 5: REWARD ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><span className="text-base">🏆</span></div>
              <h2 className="font-bold text-gray-800 text-sm">Reward & Prestasi</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-700">{detail.rewards.length}</p><p className="text-xs text-green-600">Total Reward</p></div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-emerald-700">{detail.totalRewardPoin}</p><p className="text-xs text-emerald-600">Total Poin</p></div>
            </div>
            {detail.rewards.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">{detail.rewards.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg"><div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs">🏆</span></div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{r.reward_nama || '—'}</p><p className="text-xs text-gray-400">{formatTanggal(r.tanggal)} • +{r.reward_poin || 0} poin</p></div></div>
              ))}</div>
            ) : <p className="text-center text-gray-400 text-sm py-4">Belum ada data reward</p>}
          </div>

          {/* ═══ SECTION 6: PELANGGARAN ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Pelanggaran</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-red-700">{detail.pelanggaran.length}</p><p className="text-xs text-red-600">Total Pelanggaran</p></div>
              <div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-orange-700">{detail.totalPelanggaranPoin}</p><p className="text-xs text-orange-600">Total Poin</p></div>
            </div>
            <div className="flex gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">Ringan: {detail.kategoriPelanggaran.ringan}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">Sedang: {detail.kategoriPelanggaran.sedang}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">Berat: {detail.kategoriPelanggaran.berat}</span>
            </div>
            {detail.pelanggaran.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">{detail.pelanggaran.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg"><div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs">⚠️</span></div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{p.jenis_pelanggaran || '—'}</p><p className="text-xs text-gray-400">{formatTanggal(p.tanggal)} • -{p.poin || 0} poin • {p.kategori || '—'}</p></div></div>
              ))}</div>
            ) : <p className="text-center text-gray-400 text-sm py-4">Belum ada data pelanggaran</p>}
          </div>

          {/* ═══ SECTION 7: PENANGANAN ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Status Penanganan Siswa</h2>
            </div>
            {detail.penanganan ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${detail.penanganan.status_akhir === 'Aktif' ? 'bg-green-100 text-green-700' : detail.penanganan.status_akhir === 'Pindah' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{detail.penanganan.status_akhir}</span>
                  <span className="text-sm text-gray-500">Total Poin Pelanggaran: <strong>{detail.penanganan.total_poin || 0}</strong></span>
                </div>
                <div className="flex items-start gap-0 overflow-x-auto pb-2">
                  {[
                    { label: 'Pembinaan BK', active: detail.penanganan.layanan_bk === 'Sudah' || detail.penanganan.tahap?.includes('BK'), color: 'blue', date: null },
                    { label: 'SP1', active: detail.penanganan.sp1, color: 'yellow', date: detail.penanganan.tgl_sp1 },
                    { label: 'SP2', active: detail.penanganan.sp2, color: 'orange', date: detail.penanganan.tgl_sp2 },
                    { label: 'SP3', active: detail.penanganan.sp3, color: 'red', date: detail.penanganan.tgl_sp3 },
                  ].map((step, i, arr) => {
                    const cm = { blue: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', line: 'bg-blue-400' }, yellow: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', line: 'bg-yellow-400' }, orange: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', line: 'bg-orange-400' }, red: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', line: 'bg-red-400' } };
                    const c = cm[step.color];
                    return (
                      <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step.active ? `${c.bg} ${c.border} ${c.text}` : 'bg-gray-50 border-gray-200 text-gray-400'}`}>{step.active ? '✓' : i + 1}</div>
                          <p className={`text-xs font-semibold mt-1.5 whitespace-nowrap ${step.active ? c.text : 'text-gray-400'}`}>{step.label}</p>
                          {step.date && <p className="text-[10px] text-gray-400">{formatTanggal(step.date)}</p>}
                        </div>
                        {i < arr.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-1 mt-[-16px] ${step.active ? c.line : 'bg-gray-200'}`}></div>}
                      </div>
                    );
                  })}
                </div>
                {detail.penanganan.catatan_bk && <div className="mt-4 p-3 bg-amber-50 rounded-lg"><p className="text-xs font-semibold text-amber-700 mb-1">Catatan BK:</p><p className="text-sm text-gray-700">{detail.penanganan.catatan_bk}</p></div>}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3"><svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <p className="text-sm font-medium text-gray-600">Tidak Dalam Penanganan</p>
                <p className="text-xs text-gray-400 mt-1">Siswa tidak memiliki catatan penanganan</p>
              </div>
            )}
          </div>

          {/* ═══ SECTION 8: RINGKASAN — 2 kolom HP ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Ringkasan Siswa</h2>
              <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${scores.statusColor}`}>{scores.statusLabel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Skor Kehadiran', value: scores.kehadiran, color: '#16A34A', bg: 'bg-green-50' },
                { label: 'Skor Disiplin', value: scores.disiplin, color: '#1E40AF', bg: 'bg-blue-50' },
                { label: 'Skor Prestasi', value: scores.prestasi, color: '#D97706', bg: 'bg-yellow-50' },
                { label: 'Skor Keseluruhan', value: scores.overall, color: '#7C3AED', bg: 'bg-purple-50' },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke={item.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(item.value / 100) * 163.36} 163.36`} className="transition-all duration-1000" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">{item.value.toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
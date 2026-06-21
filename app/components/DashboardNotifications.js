'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, ExternalLink, ChevronRight } from 'lucide-react';
import { getDashboardNotifications } from '@/app/actions/notificationActions';

const TYPE_ICONS = { sick_permission: '🤒', parent_message: '💬', attendance_revision: '📝', reward: '🏆', violation: '⚠️', student_handling: '📋', system: '⚙️' };
const PRIORITY_DOT = { INFO: 'bg-blue-500', SUCCESS: 'bg-emerald-500', WARNING: 'bg-amber-500', DANGER: 'bg-red-500' };

function timeAgo(dateStr) {
  const diffMs = new Date() - new Date(dateStr);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.floor(diffHours / 24)} hari lalu`;
}

export default function DashboardNotifications({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const { data } = await getDashboardNotifications(userId);
    setNotifications(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!userId) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Bell size={15} className="text-blue-600" />
          Notifikasi Terbaru
        </h3>
        <a href="/notifikasi" className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition">
          Lihat Semua <ChevronRight size={12} />
        </a>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map(notif => {
            const icon = TYPE_ICONS[notif.type] || '🔔';
            const dotColor = PRIORITY_DOT[notif.priority] || PRIORITY_DOT.INFO;
            return (
              <div key={notif.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="relative w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-sm shrink-0">
                  {icon}
                  {!notif.is_read && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dotColor}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${!notif.is_read ? 'font-semibold text-gray-800' : 'text-gray-500'} line-clamp-1`}>{notif.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                </div>
                {notif.action_url && (
                  <a href={notif.action_url}
                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-50 rounded-md transition shrink-0" title="Buka">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <Bell size={32} className="mb-2 opacity-30" />
          <p className="text-xs font-medium">Belum ada notifikasi</p>
        </div>
      )}
    </div>
  );
}
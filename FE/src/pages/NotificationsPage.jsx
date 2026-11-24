import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { getSocket } from '../services/socket';
import {
  Bell,
  CheckCheck,
  Clock,
  Info,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const syncNavbarBadge = (nextUnreadCount) => {
    window.dispatchEvent(
      new CustomEvent('notifications_updated', { detail: { unread_count: nextUnreadCount } })
    );
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await notificationService.getMyNotifications();
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unread_count || 0);
          syncNavbarBadge(res.data.unread_count || 0);
        }
      } catch (err) {
        console.error('Lỗi tải thông báo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Lắng nghe thông báo realtime qua Socket.io
    const socket = getSocket();
    socket.emit('join_user', user.id);

    const handleRealtimeNoti = (newNoti) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNoti.id)) return prev;
        return [newNoti, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification_received', handleRealtimeNoti);
    return () => {
      socket.off('notification_received', handleRealtimeNoti);
    };
  }, [user, navigate]);

  const handleMarkAsRead = async (noti) => {
    if (noti.da_doc) return;
    try {
      const res = await notificationService.markAsRead(noti.id);
      if (res.success && res.data) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === noti.id ? res.data.notification : item))
        );
        const nextUnread = res.data.unread_count ?? Math.max(0, unreadCount - 1);
        setUnreadCount(nextUnread);
        syncNavbarBadge(nextUnread);
      }
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, da_doc: true, read_at: n.read_at || new Date().toISOString() }))
        );
        setUnreadCount(0);
        syncNavbarBadge(0);
      }
    } catch (err) {
      alert(err.message || 'Không thể đánh dấu tất cả là đã đọc.');
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'canh_bao' || type === 'khoa_tai_khoan') {
      return <ShieldAlert className="w-5 h-5 text-red-500" />;
    }
    if (type === 'xoa_noi_dung') {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    return <Info className="w-5 h-5 text-teal-600" />;
  };

  const filteredList =
    filter === 'unread' ? notifications.filter((n) => !n.da_doc) : notifications;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1.5">
              <Bell className="w-4 h-4" />
              <span>Thông báo của bạn</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Thông báo <span className="text-teal-600">của tôi</span>
            </h1>
            <p className="mt-1 text-slate-600 text-sm">
              Cập nhật mới nhất về lịch trình, cẩm nang và tài khoản của bạn.
            </p>
          </div>

          <button
            type="button"
            disabled={markingAll || unreadCount === 0}
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold shadow-sm transition self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{markingAll ? 'Đang xử lý...' : 'Đánh dấu đã đọc tất cả'}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              filter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              filter === 'unread' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {/* Notifications Timeline */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Đang tải thông báo...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              {filter === 'unread'
                ? 'Bạn đã đọc hết tất cả thông báo!'
                : 'Chưa có thông báo nào'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mọi thông báo quan trọng từ TripMate sẽ hiển thị tại đây theo thời gian thực.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((noti) => (
              <div
                key={noti.id}
                onClick={() => handleMarkAsRead(noti)}
                className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-start gap-4 ${
                  noti.da_doc
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-teal-50/70 border-teal-300 shadow-xs hover:bg-teal-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {getTypeIcon(noti.loai_thong_bao)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className={`text-sm sm:text-base ${
                        noti.da_doc ? 'font-semibold text-slate-800' : 'font-extrabold text-slate-900'
                      }`}
                    >
                      {noti.tieu_de}
                    </h3>
                    {!noti.da_doc && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {noti.noi_dung}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {noti.thoi_gian_vn ||
                        new Date(noti.created_at).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                        })}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

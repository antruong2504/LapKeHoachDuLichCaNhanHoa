import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Sparkles, Bell, User, LogOut, Heart, Calendar, Shield, Menu, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { getSocket } from '../services/socket';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res = await notificationService.getMyNotifications();
        if (res.success && res.data) {
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (_) {}
    };

    fetchUnread();

    const socket = getSocket();
    socket.emit('join_user', user.id);

    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    const handleSyncUpdated = (e) => {
      if (typeof e.detail?.unread_count === 'number') {
        setUnreadCount(e.detail.unread_count);
      }
    };

    socket.on('notification_received', handleNewNotification);
    window.addEventListener('notifications_updated', handleSyncUpdated);

    return () => {
      socket.off('notification_received', handleNewNotification);
      window.removeEventListener('notifications_updated', handleSyncUpdated);
    };
  }, [user]);

  const navLinks = [
    { name: 'Khám phá', path: '/destinations' },
    { name: 'Bản đồ', path: '/map' },
    { name: 'Thời tiết', path: '/weather' },
    { name: 'Lịch trình', path: '/trips/ai-create' },
    { name: 'Cẩm nang', path: '/guides' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-800 to-teal-600 bg-clip-text text-transparent">
              TripMate
            </span>
          </Link>

          {/* 5 Menu Links ở giữa */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'text-teal-700 bg-teal-50 font-semibold'
                      : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Góc phải: Nút Tạo AI + User / Auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/trips/ai-create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo lịch trình AI</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Chuông thông báo (PB13 - Badge đỏ đếm tin chưa đọc) */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                  title="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <img
                      src={user.anh_dai_dien || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={user.ho_ten}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-sm font-medium text-slate-800 max-w-[120px] truncate">
                      {user.ho_ten}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.ho_ten}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-teal-700 hover:bg-teal-50 font-semibold"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Khu vực Quản trị Admin</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        to="/my-trips"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Lịch trình của tôi</span>
                      </Link>

                      <Link
                        to="/trips/manual-create"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Compass className="w-4 h-4 text-slate-400" />
                        <span>Tự tạo lịch trình</span>
                      </Link>

                      <Link
                        to="/favorites"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>Địa điểm yêu thích</span>
                      </Link>

                      <Link
                        to="/chat"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>Nhóm chat du lịch</span>
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Nút Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link
                to="/notifications"
                aria-label="Thông báo"
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-1.5">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-teal-700 bg-teal-50"
                  >
                    Khu vực Quản trị Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hồ sơ ({user.ho_ten})
                </Link>
                <Link
                  to="/my-trips"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Lịch trình của tôi
                </Link>
                <Link
                  to="/trips/manual-create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tự tạo lịch trình
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Địa điểm yêu thích
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Nhóm chat du lịch
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-medium border border-slate-200 rounded-xl"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-medium bg-teal-600 text-white rounded-xl"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

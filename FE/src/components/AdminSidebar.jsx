import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  FolderTree,
  Users,
  BookOpen,
  Star,
  Compass,
  ArrowLeft,
} from 'lucide-react';

const AdminSidebar = () => {
  const adminNav = [
    { name: 'Tổng quan & Báo cáo', path: '/admin', icon: LayoutDashboard },
    { name: 'Quản lý Địa điểm', path: '/admin/destinations', icon: MapPin },
    { name: 'Quản lý Danh mục', path: '/admin/categories', icon: FolderTree },
    { name: 'Quản lý Tài khoản', path: '/admin/users', icon: Users },
    { name: 'Quản lý Cẩm nang', path: '/admin/guides', icon: BookOpen },
    { name: 'Quản lý Đánh giá', path: '/admin/reviews', icon: Star },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-wide">TripMate</span>
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-400 rounded">
            ADMIN
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu Quản trị
        </p>

        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Return to Client portal */}
      <div className="p-4 border-t border-slate-800">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ TripMate</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;

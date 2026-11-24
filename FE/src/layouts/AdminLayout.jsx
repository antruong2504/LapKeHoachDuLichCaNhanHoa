import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert } from 'lucide-react';

const AdminLayout = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Đang tải bảng điều khiển Quản trị...</p>
        </div>
      </div>
    );
  }

  // Chặn nếu không phải Admin
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans antialiased">
      {/* Sidebar Admin bên trái */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Admin */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 className="text-base font-bold text-slate-800">Hệ Thống Quản Trị TripMate</h1>
            <p className="text-xs text-slate-400">Thời gian hệ thống: UTC+7 (Asia/Ho_Chi_Minh)</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Supabase Cloud Connected</span>
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <img
                src={user.anh_dai_dien || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user.ho_ten}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.ho_ten}</p>
                <p className="text-[10px] text-teal-600 font-medium uppercase">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

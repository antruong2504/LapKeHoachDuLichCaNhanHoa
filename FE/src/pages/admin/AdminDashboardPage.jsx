import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Star,
  TrendingUp,
  Filter,
  Loader2,
  BarChart3
} from 'lucide-react';

const STAR_COLORS = ['#0D9488', '#10B981', '#F59E0B', '#F97316', '#EF4444'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async (start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const params = {};
      if (start) params.start_date = start;
      if (end) params.end_date = end;

      const res = await adminService.getDashboardStats(params);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats('', '');
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchStats(startDate, endDate);
  };

  const handleQuickPreset = (days) => {
    if (!days) {
      setStartDate('');
      setEndDate('');
      fetchStats('', '');
      return;
    }

    const now = new Date();
    const endStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
    const startObj = new Date(now);
    startObj.setDate(now.getDate() - days);
    const startStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(startObj);

    setStartDate(startStr);
    setEndDate(endStr);
    fetchStats(startStr, endStr);
  };

  const overview = stats?.overview || {};
  const charts = stats?.charts || {};

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Bar (UTC+7) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Bảng điều khiển & Báo cáo UTC+7 • PB18 (UI_26)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Tổng quan hệ thống TripMate</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Số liệu thời gian thực từ Supabase PostgreSQL theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
          </p>
        </div>

        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickPreset(7)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition"
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(30)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition"
          >
            30 ngày
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(null)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition"
          >
            Tất cả
          </button>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
          />
          <span className="text-xs text-slate-400">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
          />

          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-9 h-9 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tổng hợp dữ liệu báo cáo...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-teal-600 mb-2">
                <span className="text-xs font-bold uppercase">Người dùng</span>
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{overview.tong_nguoi_dung || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Trong kỳ lọc: +{overview.nguoi_dung_trong_ky || 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold uppercase">Địa điểm</span>
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{overview.tong_dia_diem || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Đang hiển thị công khai</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs font-bold uppercase">Lịch trình</span>
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{overview.tong_lich_trinh || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                AI: {overview.lich_trinh_ai || 0} • Thủ công: {overview.lich_trinh_thu_cong || 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-amber-600 mb-2">
                <span className="text-xs font-bold uppercase">Cẩm nang</span>
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{overview.tong_cam_nang || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Bài viết cộng đồng</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-orange-500 mb-2">
                <span className="text-xs font-bold uppercase">Đánh giá TB</span>
                <Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {overview.diem_danh_gia_tb_he_thong || 0} / 5
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tổng {overview.tong_danh_gia || 0} lượt đánh giá
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Biểu đồ Tăng trưởng người dùng & lịch trình */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Biểu đồ tăng trưởng người dùng & lịch trình (UTC+7)
                </h2>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.tang_truong_nguoi_dung || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ngay" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="nguoi_dung_moi"
                      name="Người dùng mới"
                      stroke="#0D9488"
                      fill="#99F6E4"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="lich_trinh_moi"
                      name="Lịch trình mới"
                      stroke="#6366F1"
                      fill="#C7D2FE"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Biểu đồ Lịch trình theo tỉnh thành */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Lịch trình du lịch theo tỉnh / thành phố
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.lich_trinh_theo_tinh_thanh || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tinh_thanh" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="so_lich_trinh"
                      name="Số lịch trình"
                      fill="#0D9488"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Biểu đồ Phân bố đánh giá 1-5 sao */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Phân bố đánh giá cộng đồng (1–5 sao)
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.phan_bo_danh_gia || []}
                      dataKey="so_luong"
                      nameKey="nhan"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      label
                    >
                      {(charts.phan_bo_danh_gia || []).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={STAR_COLORS[idx % STAR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

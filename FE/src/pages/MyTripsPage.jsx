import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Sparkles,
  Compass,
  Search,
  ExternalLink,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function MyTripsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'ai', 'thu_cong'
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Xóa màu đỏ (UI_22)
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tải danh sách lịch trình cá nhân (PB09 - UI_20)
  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tripService.getMyTrips();
      const list = res.data || [];
      setTrips(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách chuyến đi của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTrips();
  }, [user]);

  // Xử lý xác nhận xóa lịch trình (UI_22)
  const handleConfirmDelete = async () => {
    if (!deletingTrip) return;
    setIsDeleting(true);
    try {
      const res = await tripService.deleteTrip(deletingTrip.id);
      if (res.success) {
        setTrips((prev) => prev.filter((t) => t.id !== deletingTrip.id));
        setDeletingTrip(null);
      } else {
        throw new Error(res.message || 'Xóa lịch trình thất bại');
      }
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi xóa lịch trình.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Lọc chuyến đi theo tab và từ khóa
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Lọc theo nguồn tạo
      if (activeTab === 'ai' && trip.nguon_tao !== 'ai') return false;
      if (activeTab === 'thu_cong' && trip.nguon_tao !== 'thu_cong') return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (trip.ten_lich_trinh || '').toLowerCase().includes(term);
        const provMatch = (trip.tinh_thanh?.ten_tinh_thanh || '').toLowerCase().includes(term);
        if (!titleMatch && !provMatch) return false;
      }

      return true;
    });
  }, [trips, activeTab, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Title & CTA Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1.5">
              <Calendar className="w-4 h-4" />
              <span>Lịch trình cá nhân</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Chuyến đi của <span className="text-teal-600">tôi</span>
            </h1>
            <p className="mt-1 text-slate-600 text-sm sm:text-base">
              Theo dõi, chỉnh sửa và chuẩn bị hành trang cho tất cả các kế hoạch du lịch của bạn.
            </p>
          </div>

          {/* Action CTAs: Tạo bằng AI hoặc Tạo thủ công */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/trips/ai-create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lập lịch bằng AI</span>
            </Link>

            <Link
              to="/trips/manual-create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tự tạo thủ công</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả ({trips.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Do AI tạo ({trips.filter((t) => t.nguon_tao === 'ai').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('thu_cong')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'thu_cong'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tự tạo thủ công ({trips.filter((t) => t.nguon_tao === 'thu_cong').length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm chuyến đi, điểm đến..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Loading & Error */}
        {loading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Đang tải danh sách lịch trình...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between mb-8">
            <p>{error}</p>
            <button
              onClick={fetchTrips}
              className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTrips.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto mb-4">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {trips.length === 0
                ? 'Bạn chưa có lịch trình du lịch nào'
                : 'Không tìm thấy chuyến đi phù hợp'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              {trips.length === 0
                ? 'Hãy để Gemini AI gợi ý chuyến đi hoặc tự mình thiết kế cung đường theo phong cách riêng!'
                : 'Thử tìm kiếm với từ khóa khác hoặc chuyển sang tab bộ lọc khác.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/trips/ai-create"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tạo ngay với Gemini AI</span>
              </Link>
              <Link
                to="/trips/manual-create"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Tự tạo thủ công
              </Link>
            </div>
          </div>
        )}

        {/* Grid Lịch trình */}
        {!loading && !error && filteredTrips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const totalStops = (trip.ngays || []).reduce(
                (sum, d) => sum + (d.chi_tiets?.length || 0),
                0
              );
              const isAi = trip.nguon_tao === 'ai';

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Card Cover Banner */}
                  <div className="relative h-44 bg-slate-200 overflow-hidden">
                    <img
                      src={
                        trip.tinh_thanh?.anh_dai_dien ||
                        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
                      }
                      alt={trip.ten_lich_trinh}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                    {/* Badges on Banner */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
                          isAi
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-teal-600/90 text-white'
                        }`}
                      >
                        {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                        <span>{isAi ? 'Gemini AI' : 'Thủ công'}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-black/40 text-white/90 text-[11px] font-bold backdrop-blur-md">
                        v{trip.phien_ban || 1}
                      </span>
                    </div>

                    {/* Bottom of Banner: Location */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
                      <span className="font-semibold flex items-center gap-1 drop-shadow">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        {trip.tinh_thanh?.ten_tinh_thanh || 'Việt Nam'}
                      </span>
                      <span className="font-semibold drop-shadow">
                        {trip.ngays?.length || 1} ngày • {totalStops} chặng
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-1 mb-2">
                        {trip.ten_lich_trinh || 'Lịch trình du lịch'}
                      </h3>

                      {/* Dates */}
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(trip.ngay_bat_dau).toLocaleDateString('vi-VN')} →{' '}
                          {new Date(trip.ngay_ket_thuc).toLocaleDateString('vi-VN')}
                        </span>
                      </p>

                      {/* Stats Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 mb-4">
                        <div>
                          <span className="text-slate-400 text-[11px]">Người đi:</span>
                          <p className="font-bold text-slate-700 mt-0.5">{trip.so_nguoi || 1} người</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Dự toán:</span>
                          <p className="font-black text-teal-700 mt-0.5">
                            {Number(trip.tong_chi_phi_uoc_tinh || 0).toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={`/trips/${trip.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold text-center transition"
                      >
                        Xem chi tiết & Sửa
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeletingTrip(trip)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Xóa lịch trình này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL XÁC NHẬN XÓA MÀU ĐỎ (UI_22) */}
        {/* ======================================================== */}
        {deletingTrip && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
                  Xác nhận xóa lịch trình?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Bạn có chắc chắn muốn xóa vĩnh viễn lịch trình:
                </p>
                <p className="text-sm font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 mt-2 truncate">
                  "{deletingTrip.ten_lich_trinh}"
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Toàn bộ các ngày tham quan và chặng dừng liên kết sẽ bị xóa khỏi tài khoản của bạn. Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingTrip(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Navigation,
  Sun,
  Sunset,
  Moon,
  Info
} from 'lucide-react';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab ngày đang xem
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Chế độ chỉnh sửa thông tin (In-place edit với Optimistic Locking)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    ten_lich_trinh: '',
    ngan_sach_du_kien: 0,
    so_nguoi: 1,
    so_thich: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [conflictError, setConflictError] = useState('');

  // Modal Xóa màu đỏ (UI_22)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tải chi tiết lịch trình (PB09 - UI_21)
  const fetchTripDetail = async () => {
    setLoading(true);
    setError('');
    setConflictError('');
    try {
      const res = await tripService.getTripById(id);
      if (res.success && res.data) {
        setTrip(res.data);
        setEditForm({
          ten_lich_trinh: res.data.ten_lich_trinh || '',
          ngan_sach_du_kien: res.data.ngan_sach_du_kien || 0,
          so_nguoi: res.data.so_nguoi || 1,
          so_thich: res.data.so_thich || '',
        });
      } else {
        throw new Error(res.message || 'Không tìm thấy lịch trình');
      }
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết lịch trình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTripDetail();
  }, [id, user]);

  // Xử lý lưu chỉnh sửa với Khóa lạc quan (Optimistic Locking)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setConflictError('');
    setIsSaving(true);

    try {
      const payload = {
        ten_lich_trinh: editForm.ten_lich_trinh.trim(),
        ngan_sach_du_kien: Number(editForm.ngan_sach_du_kien) || 0,
        so_nguoi: Number(editForm.so_nguoi) || 1,
        so_thich: editForm.so_thich || '',
        phien_ban: trip.phien_ban, // Gửi phiên bản hiện tại để kiểm tra khóa lạc quan
      };

      const res = await tripService.updateTrip(id, payload);
      if (res.success && res.data) {
        setTrip(res.data);
        setIsEditing(false);
      } else {
        throw new Error(res.message || 'Cập nhật lịch trình thất bại');
      }
    } catch (err) {
      if (err.response?.status === 409 || err.message?.includes('phiên khác') || err.message?.includes('xung đột')) {
        setConflictError(
          '⚠️ Xung đột phiên làm việc: Lịch trình này vừa được cập nhật bởi một phiên khác. Vui lòng tải lại trang để lấy dữ liệu mới nhất.'
        );
      } else {
        alert(err.message || 'Có lỗi xảy ra khi lưu thay đổi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý xóa lịch trình (UI_22)
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await tripService.deleteTrip(id);
      if (res.success) {
        navigate('/my-trips');
      } else {
        throw new Error(res.message || 'Xóa lịch trình thất bại');
      }
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi xóa lịch trình.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Đang tải chi tiết chuyến đi...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Không thể mở lịch trình</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Lịch trình không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            to="/my-trips"
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isAi = trip.nguon_tao === 'ai';
  const currentDay = trip.ngays?.[activeDayIndex];
  const budget = Number(trip.ngan_sach_du_kien) || 0;
  const estimatedCost = Number(trip.tong_chi_phi_uoc_tinh) || 0;
  const isOverBudget = budget > 0 && estimatedCost > budget;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/my-trips"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về danh sách chuyến đi của tôi</span>
          </Link>

          {/* Quick Route Link */}
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Mở trên bản đồ & Lộ trình</span>
          </Link>
        </div>

        {/* Xung đột Optimistic Locking Alert */}
        {conflictError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="font-medium text-xs sm:text-sm">{conflictError}</p>
            </div>
            <button
              onClick={fetchTripDetail}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0"
            >
              Tải lại trang
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* BANNER TỔNG QUAN LỊCH TRÌNH (UI_21) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isAi
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {isAi ? <Sparkles className="w-3.5 h-3.5 text-amber-600" /> : <Compass className="w-3.5 h-3.5 text-teal-600" />}
                  <span>{isAi ? 'Được tạo bởi Gemini AI' : 'Tự tạo thủ công'}</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  Phiên bản: v{trip.phien_ban || 1}
                </span>

                <span className="text-xs text-slate-400">
                  Mã chuyến đi: #{trip.id}
                </span>
              </div>

              {!isEditing ? (
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {trip.ten_lich_trinh || 'Lịch trình du lịch'}
                </h1>
              ) : (
                <div className="mt-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tên lịch trình</label>
                  <input
                    type="text"
                    value={editForm.ten_lich_trinh}
                    onChange={(e) => setEditForm({ ...editForm, ten_lich_trinh: e.target.value })}
                    className="w-full text-lg sm:text-xl font-bold px-3 py-2 bg-slate-50 border border-teal-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold text-slate-700">{trip.tinh_thanh?.ten_tinh_thanh || 'Việt Nam'}</span>
                <span>•</span>
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {new Date(trip.ngay_bat_dau).toLocaleDateString('vi-VN')} →{' '}
                  {new Date(trip.ngay_ket_thuc).toLocaleDateString('vi-VN')}
                </span>
              </p>
            </div>

            {/* Top Action Buttons: Chỉnh sửa & Xóa */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Sửa thông tin</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        ten_lich_trinh: trip.ten_lich_trinh || '',
                        ngan_sach_du_kien: trip.ngan_sach_du_kien || 0,
                        so_nguoi: trip.so_nguoi || 1,
                        so_thich: trip.so_thich || '',
                      });
                    }}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    title="Hủy bỏ"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveEdit}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                title="Xóa lịch trình này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form chỉnh sửa inline nếu bật Edit mode */}
          {isEditing && (
            <div className="py-5 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngân sách dự kiến (VNĐ)</label>
                <input
                  type="number"
                  step="500000"
                  value={editForm.ngan_sach_du_kien}
                  onChange={(e) => setEditForm({ ...editForm, ngan_sach_du_kien: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số lượng người</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editForm.so_nguoi}
                  onChange={(e) => setEditForm({ ...editForm, so_nguoi: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú sở thích</label>
                <input
                  type="text"
                  value={editForm.so_thich}
                  onChange={(e) => setEditForm({ ...editForm, so_thich: e.target.value })}
                  placeholder="VD: Nghỉ dưỡng, tắm biển..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Thời lượng</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{trip.ngays?.length || 1} ngày</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Số người</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{trip.so_nguoi || 1} người</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Ngân sách</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {budget > 0 ? `${budget.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Tổng chi phí ước tính</span>
              <p className="text-sm font-black text-teal-700 mt-0.5">
                {estimatedCost.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          {/* Cảnh báo vượt ngân sách */}
          {isOverBudget && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Cảnh báo vượt ngân sách: </span>
                Chi phí ước tính ({estimatedCost.toLocaleString('vi-VN')} đ) đang cao hơn ngân sách dự kiến ({budget.toLocaleString('vi-VN')} đ).
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DAY SELECTOR TABS & CHẶNG THAM QUAN */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(trip.ngays || []).map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setActiveDayIndex(idx)}
                className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shrink-0 transition flex items-center gap-2 ${
                  activeDayIndex === idx
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Ngày {day.thu_tu_ngay}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeDayIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {day.chi_tiets?.length || 0} chặng
                </span>
              </button>
            ))}
          </div>

          {/* Chi tiết các chặng trong ngày được chọn */}
          {currentDay && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="pb-6 border-b border-slate-100">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                  Kế hoạch Ngày {currentDay.thu_tu_ngay} • {new Date(currentDay.ngay_tham_quan).toLocaleDateString('vi-VN')}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {currentDay.ghi_chu || `Hành trình khám phá ${trip.tinh_thanh?.ten_tinh_thanh || ''}`}
                </h3>
              </div>

              {/* Danh sách các chặng dừng */}
              <div className="mt-6 space-y-5">
                {(currentDay.chi_tiets || []).length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Ngày này chưa có điểm dừng nào.
                  </div>
                ) : (
                  currentDay.chi_tiets.map((stop, sIdx) => {
                    const getBuoiBadge = (buoi) => {
                      if (buoi === 'sang') return { label: 'Buổi Sáng', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> };
                      if (buoi === 'chieu') return { label: 'Buổi Chiều', icon: <Sunset className="w-3.5 h-3.5 text-orange-500" /> };
                      return { label: 'Buổi Tối', icon: <Moon className="w-3.5 h-3.5 text-indigo-500" /> };
                    };
                    const buoiInfo = getBuoiBadge(stop.buoi);

                    return (
                      <div
                        key={stop.id}
                        className={`p-5 rounded-2xl border transition duration-200 ${
                          stop.dia_diem_da_xoa
                            ? 'bg-amber-50/40 border-amber-300'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-teal-200 hover:shadow-sm'
                        }`}
                      >
                        {/* ======================================================== */}
                        {/* CẢNH BÁO BẢO TOÀN SNAPSHOT KHI ĐỊA ĐIỂM GỐC BỊ XÓA MỀM */}
                        {/* ======================================================== */}
                        {stop.dia_diem_da_xoa && (
                          <div className="mb-4 p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">Lưu ý địa điểm: </strong>
                              Điểm tham quan này hiện đã tạm ngưng hoạt động hoặc được gỡ bỏ khỏi hệ thống. Thông tin trên lịch trình của bạn được bảo toàn nguyên vẹn từ bản sao lưu (Snapshot).
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          {/* Ảnh đại diện chặng (lấy từ địa điểm hoặc ảnh fallback) */}
                          <div className="w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                            <img
                              src={
                                stop.dia_diem?.anh_dai_dien ||
                                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500'
                              }
                              alt={stop.ten_dia_diem_luu}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Chi tiết chặng */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                                {sIdx + 1}
                              </span>

                              <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1">
                                {buoiInfo.icon}
                                <span>{buoiInfo.label}</span>
                              </span>

                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{stop.thoi_gian_du_kien || 'Thời gian linh hoạt'}</span>
                              </span>

                              {stop.chi_phi_uoc_tinh > 0 && (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  ~{Number(stop.chi_phi_uoc_tinh).toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                              {stop.ten_dia_diem_luu}
                            </h4>

                            {stop.dia_chi_luu && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{stop.dia_chi_luu}</span>
                              </p>
                            )}

                            {stop.ghi_chu && (
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 mt-2">
                                {stop.ghi_chu}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MODAL XÁC NHẬN XÓA MÀU ĐỎ (UI_22) */}
        {/* ======================================================== */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
                  Xác nhận xóa vĩnh viễn?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Bạn có chắc chắn muốn xóa lịch trình:
                </p>
                <p className="text-sm font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 mt-2 truncate">
                  "{trip.ten_lich_trinh}"
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Dữ liệu lịch trình và tất cả chặng dừng sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
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
                  <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Star,
  Search,
  Eye,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

const QUICK_REVIEW_DELETE_REASONS = [
  'Ngôn từ thiếu chuẩn mực, xúc phạm',
  'Đánh giá spam hoặc quảng cáo trá hình',
  'Nội dung không liên quan tới địa điểm du lịch',
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [toastMsg, setToastMsg] = useState('');

  // Modal Xem chi tiết (UI_38)
  const [viewingReview, setViewingReview] = useState(null);

  // Modal Xóa bắt buộc lý do (UI_39)
  const [deletingReview, setDeletingReview] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchReviews = async (targetPage = page, stars = starFilter, keyword = searchTerm) => {
    setLoading(true);
    try {
      const res = await adminService.getReviews({
        page: targetPage,
        limit: 10,
        ...(stars ? { so_sao: stars } : {}),
        ...(keyword.trim() ? { search: keyword.trim() } : {}),
      });
      if (res.success) {
        setReviews(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, starFilter, searchTerm);
  }, [page, starFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews(1, starFilter, searchTerm);
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deleteReason.trim()) {
      setDeleteError('Bắt buộc phải nhập lý do xóa đánh giá.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await adminService.deleteReview(deletingReview.id, deleteReason.trim());
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
        setDeletingReview(null);
        showToast('Đã xóa đánh giá và cập nhật lại điểm trung bình.');
      } else {
        throw new Error(res.message || 'Xóa đánh giá thất bại');
      }
    } catch (err) {
      setDeleteError(err.message || 'Có lỗi xảy ra khi xóa đánh giá.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Kiểm duyệt cộng đồng</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý đánh giá địa điểm</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Xem, lọc theo số sao và xử lý các đánh giá vi phạm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={starFilter}
            onChange={(e) => {
              setPage(1);
              setStarFilter(e.target.value);
            }}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-medium"
          >
            <option value="">Tất cả số sao</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {s} sao
              </option>
            ))}
          </select>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm địa điểm, tác giả, nội dung..."
                className="pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Đang tải danh sách đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Không có đánh giá nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Địa điểm</th>
                  <th className="py-3.5 px-4">Người đánh giá</th>
                  <th className="py-3.5 px-4">Số sao</th>
                  <th className="py-3.5 px-4">Nội dung nhận xét</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[200px] truncate">
                      {r.dia_diem?.ten_dia_diem || 'Địa điểm du lịch'}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {r.tai_khoan?.ho_ten || 'Người dùng'}
                      </p>
                      <p className="text-[11px] text-slate-400">{r.tai_khoan?.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < r.so_sao ? 'fill-current' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {r.noi_dung}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {r.created_at_vn}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingReview(r)}
                          className="p-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingReview(r);
                            setDeleteReason('');
                            setDeleteError('');
                          }}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {page} / {pagination.totalPages} (Tổng {pagination.total} đánh giá)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT ĐÁNH GIÁ (UI_38) */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết đánh giá</h3>
              <button
                type="button"
                onClick={() => setViewingReview(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Địa điểm:</span>{' '}
                <strong>{viewingReview.dia_diem?.ten_dia_diem}</strong>
              </p>
              <p>
                <span className="text-slate-500">Người gửi:</span>{' '}
                <strong>{viewingReview.tai_khoan?.ho_ten}</strong> ({viewingReview.tai_khoan?.email})
              </p>
              <p className="flex items-center gap-2">
                <span className="text-slate-500">Đánh giá:</span>
                <span className="font-bold text-amber-600">{viewingReview.so_sao} / 5 sao</span>
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700">
                {viewingReview.noi_dung}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÓA ĐÁNH GIÁ BẮT BUỘC NHẬP LÝ DO (UI_39) */}
      {deletingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-100">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900">Xóa đánh giá vi phạm</h3>
                <p className="text-xs text-slate-500 truncate">
                  {deletingReview.dia_diem?.ten_dia_diem} — Tác giả: {deletingReview.tai_khoan?.ho_ten}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmDelete} className="mt-4 space-y-4">
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Lý do xóa đánh giá (Bắt buộc) <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {QUICK_REVIEW_DELETE_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDeleteReason(r)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 transition"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  rows="3"
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa đánh giá..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingReview(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/25 disabled:opacity-50"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa & Tính lại TB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

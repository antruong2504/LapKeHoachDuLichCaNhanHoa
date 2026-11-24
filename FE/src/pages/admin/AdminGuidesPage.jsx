import React, { useState, useEffect } from 'react';
import guideService from '../../services/guideService';
import {
  BookOpen,
  Search,
  Eye,
  Trash2,
  X,
  ShieldAlert,
  Loader2,
  MessageCircle,
  Share2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const QUICK_DELETE_REASONS = [
  'Nội dung vi phạm quy chuẩn cộng đồng',
  'Thông tin quảng cáo spam hoặc sai sự thật',
  'Hình ảnh không phù hợp hoặc vi phạm bản quyền',
  'Ngôn từ thiếu chuẩn mực, xúc phạm người khác',
];

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [toastMsg, setToastMsg] = useState('');

  // Modal Xem chi tiết (UI_35)
  const [viewingGuide, setViewingGuide] = useState(null);

  // Modal Xóa bắt buộc nhập lý do (UI_36)
  const [deletingGuide, setDeletingGuide] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchGuides = async (targetPage = page, keyword = searchTerm) => {
    setLoading(true);
    try {
      const res = await guideService.getAdminGuides({
        page: targetPage,
        limit: 10,
        ...(keyword.trim() ? { search: keyword.trim() } : {}),
      });
      if (res.success) {
        setGuides(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Lỗi tải cẩm nang Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides(page, searchTerm);
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGuides(1, searchTerm);
  };

  const handleOpenDeleteModal = (guide) => {
    setDeletingGuide(guide);
    setDeleteReason('');
    setDeleteError('');
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deleteReason.trim()) {
      setDeleteError('Bắt buộc phải nhập lý do xóa cẩm nang trước khi xác nhận.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await guideService.adminDeleteGuide(deletingGuide.id, deleteReason.trim());
      if (res.success) {
        setGuides((prev) => prev.filter((g) => g.id !== deletingGuide.id));
        setDeletingGuide(null);
        showToast('Đã xóa cẩm nang, bảo toàn ảnh dùng chung & gửi thông báo UTC+7 cho tác giả.');
      } else {
        throw new Error(res.message || 'Xóa cẩm nang thất bại');
      }
    } catch (err) {
      setDeleteError(err.message || 'Có lỗi xảy ra khi xóa cẩm nang.');
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Quản trị nội dung • PB14 (UI_34–36)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý cẩm nang du lịch</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kiểm duyệt bài viết cộng đồng, xóa bài vi phạm kèm lý do và gửi thông báo UTC+7 tới tác giả.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tiêu đề, tác giả..."
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Đang tải danh sách cẩm nang...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Không có bài viết cẩm nang nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Bài viết cẩm nang</th>
                  <th className="py-3.5 px-4">Tác giả</th>
                  <th className="py-3.5 px-4">Ngày đăng (UTC+7)</th>
                  <th className="py-3.5 px-4 text-center">Tương tác</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {guides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 max-w-md">
                        <img
                          src={
                            guide.anh_dai_dien ||
                            'https://images.unsplash.com/photo-1528127269322-539801943592?w=200'
                          }
                          alt={guide.tieu_de}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{guide.tieu_de}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {guide.mo_ta_ngan || guide.noi_dung}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {guide.tac_gia?.ho_ten || 'Người dùng'}
                      </p>
                      <p className="text-[11px] text-slate-400">{guide.tac_gia?.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {guide.ngay_dang_vn ||
                        new Date(guide.ngay_dang).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                        })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
                          {guide.so_binh_luan || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3.5 h-3.5 text-amber-500" />
                          {guide.so_chia_se || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingGuide(guide)}
                          className="p-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition"
                          title="Xem chi tiết bài viết (UI_35)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(guide)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Xóa cẩm nang kèm lý do (UI_36)"
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
              Trang {page} / {pagination.totalPages} (Tổng {pagination.total} bài viết)
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

      {/* ======================================================== */}
      {/* MODAL XEM CHI TIẾT CẨM NANG (UI_35) */}
      {/* ======================================================== */}
      {viewingGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 truncate pr-4">
                {viewingGuide.tieu_de}
              </h3>
              <button
                type="button"
                onClick={() => setViewingGuide(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {viewingGuide.anh_dai_dien && (
                <img
                  src={viewingGuide.anh_dai_dien}
                  alt={viewingGuide.tieu_de}
                  className="w-full max-h-64 object-cover rounded-2xl"
                />
              )}
              <p className="text-xs text-slate-500">
                Tác giả: <strong>{viewingGuide.tac_gia?.ho_ten}</strong> • Đăng lúc:{' '}
                {viewingGuide.ngay_dang_vn}
              </p>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {viewingGuide.noi_dung}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL XÓA CẨM NANG BẮT BUỘC NHẬP LÝ DO (UI_36) */}
      {/* ======================================================== */}
      {deletingGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-100">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900">Xóa cẩm nang vi phạm</h3>
                <p className="text-xs text-slate-500 truncate">
                  "{deletingGuide.tieu_de}" — Tác giả: {deletingGuide.tac_gia?.ho_ten}
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
                  Lý do xóa bài viết (Bắt buộc gửi cho tác giả) <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {QUICK_DELETE_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDeleteReason(reason)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 transition"
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <textarea
                  rows="3"
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết để gửi thông báo UTC+7 tới tác giả..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingGuide(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/25 disabled:opacity-50"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa & Gửi TB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

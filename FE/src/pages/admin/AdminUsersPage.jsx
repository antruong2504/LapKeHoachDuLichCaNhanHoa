import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Users,
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

const QUICK_LOCK_REASONS = [
  'Spam bình luận quảng cáo trái phép',
  'Đăng tải nội dung vi phạm thuần phong mỹ tục',
  'Phát hiện hành vi gian lận hoặc giả mạo tài khoản',
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [toastMsg, setToastMsg] = useState('');

  // Modal Khóa / Mở khóa (UI_32, UI_33)
  const [targetUser, setTargetUser] = useState(null);
  const [modalReason, setModalReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchUsers = async (targetPage = page, keyword = searchTerm, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page: targetPage,
        limit: 10,
        ...(keyword.trim() ? { search: keyword.trim() } : {}),
        ...(status ? { trang_thai: status } : {}),
      });
      if (res.success) {
        setUsers(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tài khoản:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, searchTerm, statusFilter);
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, searchTerm, statusFilter);
  };

  const handleOpenModal = (userItem) => {
    setTargetUser(userItem);
    setModalReason('');
    setModalError('');
  };

  const handleConfirmToggle = async (e) => {
    e.preventDefault();
    setModalError('');

    const nextStatus = targetUser.trang_thai === 'hoat_dong' ? 'bi_khoa' : 'hoat_dong';
    if (nextStatus === 'bi_khoa' && !modalReason.trim()) {
      setModalError('Vui lòng nhập lý do khóa tài khoản.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminService.toggleUserStatus(targetUser.id, {
        trang_thai: nextStatus,
        ly_do_khoa: modalReason.trim(),
      });

      if (res.success && res.data?.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? res.data.user : u))
        );
        setTargetUser(null);
        showToast(res.message || 'Cập nhật trạng thái tài khoản thành công.');
      } else {
        throw new Error(res.message || 'Thao tác thất bại');
      }
    } catch (err) {
      setModalError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái tài khoản.');
    } finally {
      setSubmitting(false);
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
            <Users className="w-4 h-4" />
            <span>Quản trị hệ thống</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý tài khoản người dùng</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi và quản lý trạng thái tài khoản thành viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="hoat_dong">Đang hoạt động</option>
            <option value="bi_khoa">Đang bị khóa</option>
          </select>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên, username, email, SĐT..."
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

      {/* Table 10 dòng/trang */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Đang tải danh sách tài khoản...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Không tìm thấy tài khoản nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Người dùng</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Thời gian khóa</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isLocked = u.trang_thai === 'bi_khoa';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.anh_dai_dien ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                            }
                            alt={u.ho_ten}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{u.ho_ten}</p>
                            <p className="text-xs text-slate-500">@{u.ten_dang_nhap}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <p>{u.email}</p>
                        <p className="text-slate-400 mt-0.5">{u.so_dien_thoai}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.vai_tro === 'admin'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.vai_tro === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isLocked
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isLocked ? 'Bị khóa' : 'Hoạt động'}
                        </span>
                        {isLocked && u.ly_do_khoa && (
                          <p className="text-[11px] text-red-600 mt-1 max-w-[200px] truncate" title={u.ly_do_khoa}>
                            Lý do: {u.ly_do_khoa}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {u.thoi_gian_khoa_vn ? (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {u.thoi_gian_khoa_vn}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {u.vai_tro !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(u)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              isLocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Mở khóa</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Khóa tài khoản</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trang {page} / {pagination.totalPages} (Tổng {pagination.total} tài khoản)
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
      {/* MODAL KHÓA / MỞ KHÓA TÀI KHOẢN (UI_32, UI_33) */}
      {/* ======================================================== */}
      {targetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    targetUser.trang_thai === 'hoat_dong'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {targetUser.trang_thai === 'hoat_dong' ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <Unlock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {targetUser.trang_thai === 'hoat_dong'
                      ? 'Khóa tài khoản người dùng'
                      : 'Mở khóa tài khoản người dùng'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {targetUser.ho_ten} (@{targetUser.ten_dang_nhap})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmToggle} className="mt-4 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  {targetUser.trang_thai === 'hoat_dong'
                    ? 'Lý do khóa tài khoản (Bắt buộc) *'
                    : 'Ghi chú mở khóa (Tùy chọn)'}
                </label>

                {targetUser.trang_thai === 'hoat_dong' && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {QUICK_LOCK_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setModalReason(r)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 transition"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows="3"
                  required={targetUser.trang_thai === 'hoat_dong'}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder={
                    targetUser.trang_thai === 'hoat_dong'
                      ? 'Nhập lý do khóa tài khoản...'
                      : 'Nhập ghi chú xác nhận mở khóa (nếu có)...'
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setTargetUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md disabled:opacity-50 ${
                    targetUser.trang_thai === 'hoat_dong'
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  }`}
                >
                  {submitting
                    ? 'Đang xử lý...'
                    : targetUser.trang_thai === 'hoat_dong'
                    ? 'Xác nhận khóa'
                    : 'Xác nhận mở khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

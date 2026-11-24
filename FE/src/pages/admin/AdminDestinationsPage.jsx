import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  Star,
  Eye,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { destinationService } from '../../services/destinationService';
import { categoryService } from '../../services/categoryService';

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal State (UI_28)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    ten_dia_diem: '',
    tinh_thanh_id: '',
    mo_ta_ngan: '',
    mo_ta_chi_tiet: '',
    dia_chi: '',
    vi_do: '',
    kinh_do: '',
    gia_tham_quan: 0,
    anh_dai_dien: '',
    noi_bat: false,
    danh_muc_ids: [],
    phien_ban: 1,
  });

  // Delete & Conflict Modals
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  // Load Initial Metadata
  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch destinations when filter or page changes
  useEffect(() => {
    fetchDestinations();
  }, [page, selectedProvince, selectedCategory, selectedStatus]);

  const fetchMetadata = async () => {
    try {
      const [provRes, treeRes] = await Promise.all([
        destinationService.getProvinces(),
        categoryService.getTree(),
      ]);
      if (provRes.data?.data) setProvinces(provRes.data.data);
      if (treeRes.data?.data) setCategoryTree(treeRes.data.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu danh mục & tỉnh thành:', err);
    }
  };

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        trang_thai: selectedStatus,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedProvince) params.tinh_thanh_id = selectedProvince;
      if (selectedCategory) params.danh_muc_id = selectedCategory;

      const res = await destinationService.getDestinations(params);
      if (res.data?.success) {
        setDestinations(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError('Không thể tải danh sách địa điểm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDestinations();
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setFormData({
      id: null,
      ten_dia_diem: '',
      tinh_thanh_id: provinces[0]?.id || '',
      mo_ta_ngan: '',
      mo_ta_chi_tiet: '',
      dia_chi: '',
      vi_do: '',
      kinh_do: '',
      gia_tham_quan: 0,
      anh_dai_dien: '',
      noi_bat: false,
      danh_muc_ids: [],
      phien_ban: 1,
    });
    setIsEditing(false);
    setConflictError(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit (UI_28)
  const handleOpenEdit = (dest) => {
    setFormData({
      id: dest.id,
      ten_dia_diem: dest.ten_dia_diem || '',
      tinh_thanh_id: dest.tinh_thanh_id || '',
      mo_ta_ngan: dest.mo_ta_ngan || '',
      mo_ta_chi_tiet: dest.mo_ta_chi_tiet || '',
      dia_chi: dest.dia_chi || '',
      vi_do: dest.vi_do !== null ? dest.vi_do : '',
      kinh_do: dest.kinh_do !== null ? dest.kinh_do : '',
      gia_tham_quan: dest.gia_tham_quan || 0,
      anh_dai_dien: dest.anh_dai_dien || '',
      noi_bat: Boolean(dest.noi_bat),
      danh_muc_ids: dest.danh_mucs ? dest.danh_mucs.map((dm) => dm.id) : [],
      phien_ban: dest.phien_ban || 1,
    });
    setIsEditing(true);
    setConflictError(null);
    setIsFormOpen(true);
  };

  // Save (Create or Update with Optimistic Locking)
  const handleSaveDestination = async (e) => {
    e.preventDefault();
    if (!formData.ten_dia_diem.trim()) {
      alert('Vui lòng nhập tên địa điểm');
      return;
    }
    if (!formData.tinh_thanh_id) {
      alert('Vui lòng chọn Tỉnh / Thành phố');
      return;
    }

    try {
      setActionLoading(true);
      if (isEditing) {
        await destinationService.updateDestination(formData.id, formData);
        setSuccess(`Cập nhật địa điểm "${formData.ten_dia_diem}" thành công!`);
      } else {
        await destinationService.createDestination(formData);
        setSuccess(`Tạo mới địa điểm "${formData.ten_dia_diem}" thành công!`);
      }
      setIsFormOpen(false);
      fetchDestinations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      if (err.response?.status === 409) {
        // Xung đột Optimistic Locking
        setConflictError(err.response.data.message || 'Xung đột phiên bản dữ liệu!');
      } else {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa điểm');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (dest) => {
    try {
      await destinationService.toggleFeatured(dest.id);
      setDestinations((prev) =>
        prev.map((d) => (d.id === dest.id ? { ...d, noi_bat: !d.noi_bat, phien_ban: d.phien_ban + 1 } : d))
      );
    } catch (err) {
      alert('Không thể đổi trạng thái nổi bật');
    }
  };

  // Soft Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await destinationService.deleteDestination(deleteTarget.id);
      setSuccess(`Đã xóa mềm địa điểm "${deleteTarget.ten_dia_diem}" vào thùng rác.`);
      setDeleteTarget(null);
      fetchDestinations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert('Lỗi khi xóa địa điểm');
    } finally {
      setActionLoading(false);
    }
  };

  // Restore Soft-deleted Destination
  const handleRestore = async (dest) => {
    try {
      setActionLoading(true);
      await destinationService.restoreDestination(dest.id);
      setSuccess(`Đã khôi phục địa điểm "${dest.ten_dia_diem}"!`);
      fetchDestinations();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert('Lỗi khi khôi phục địa điểm');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Image Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      setActionLoading(true);
      const res = await destinationService.uploadImage(uploadData);
      if (res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, anh_dai_dien: res.data.data.url }));
      }
    } catch (err) {
      alert('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm">
            <MapPin className="w-4 h-4" />
            <span>Quản trị Hệ thống (PB19 - UI_27)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý Địa điểm Du lịch</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Phân trang 10 mục/trang, cờ nổi bật, xóa mềm và kiểm soát xung đột ghi đè Optimistic Locking.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm địa điểm mới</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên địa điểm, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Filter Province */}
          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">Tất cả Tỉnh / Thành</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ten_tinh_thanh}
              </option>
            ))}
          </select>

          {/* Filter Category */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">Tất cả Danh mục con</option>
            {categoryTree.flatMap((g) =>
              g.danh_mucs.map((dm) => (
                <option key={dm.id} value={dm.id}>
                  {g.ten_nhom} &gt; {dm.ten_danh_muc}
                </option>
              ))
            )}
          </select>

          {/* Filter Status (Soft Delete) */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="hien_thi">Đang hiển thị</option>
            <option value="da_xoa">Thùng rác (Đã xóa mềm)</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-all"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Destinations Table (UI_27) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Đang tải danh sách địa điểm du lịch...</p>
          </div>
        ) : destinations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Chưa tìm thấy địa điểm nào</p>
            <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc thêm địa điểm mới vào hệ thống.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Địa điểm</th>
                  <th className="py-3.5 px-4">Tỉnh / Thành</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Giá vé (VND)</th>
                  <th className="py-3.5 px-4 text-center">Nổi bật</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Phiên bản</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {destinations.map((dest) => {
                  const isDeleted = dest.trang_thai === 'da_xoa';
                  return (
                    <tr
                      key={dest.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDeleted ? 'bg-rose-50/30 text-slate-400' : ''
                      }`}
                    >
                      {/* Name & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 max-w-[300px]">
                          <img
                            src={
                              dest.anh_dai_dien ||
                              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150'
                            }
                            alt={dest.ten_dia_diem}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150';
                            }}
                          />
                          <div className="truncate">
                            <p
                              className={`font-semibold truncate ${
                                isDeleted ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                              title={dest.ten_dia_diem}
                            >
                              {dest.ten_dia_diem}
                            </p>
                            <p className="text-xs text-slate-500 truncate" title={dest.dia_chi}>
                              {dest.dia_chi || 'Chưa cập nhật địa chỉ'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Province */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">
                          {dest.tinh_thanh?.ten_tinh_thanh || '---'}
                        </span>
                      </td>

                      {/* Categories */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {dest.danh_mucs && dest.danh_mucs.length > 0 ? (
                            dest.danh_mucs.map((dm) => (
                              <span
                                key={dm.id}
                                className="px-2 py-0.5 text-xs rounded-md bg-teal-50 text-teal-700 font-medium border border-teal-100"
                              >
                                {dm.ten_danh_muc}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa gắn danh mục</span>
                          )}
                        </div>
                      </td>

                      {/* Ticket Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                        {dest.gia_tham_quan > 0
                          ? `${Number(dest.gia_tham_quan).toLocaleString('vi-VN')} đ`
                          : 'Miễn phí'}
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(dest)}
                          disabled={isDeleted}
                          title={dest.noi_bat ? 'Bỏ cờ nổi bật' : 'Đặt làm nổi bật'}
                          className={`p-1.5 rounded-lg transition-all ${
                            dest.noi_bat
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                          }`}
                        >
                          <Star className={`w-5 h-5 ${dest.noi_bat ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isDeleted ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                            Đã xóa mềm
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Hiển thị
                          </span>
                        )}
                      </td>

                      {/* Optimistic Version */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-600">
                          v{dest.phien_ban}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestore(dest)}
                              title="Khôi phục địa điểm"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEdit(dest)}
                                title="Chỉnh sửa địa điểm (UI_28)"
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(dest)}
                                title="Xóa mềm vào thùng rác"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm">
            <span className="text-slate-500">
              Hiển thị {(pagination.page - 1) * 10 + 1} -{' '}
              {Math.min(pagination.page * 10, pagination.total)} trong tổng số{' '}
              <strong className="text-slate-800">{pagination.total}</strong> địa điểm
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Trang trước
              </button>
              <span className="px-3 py-1.5 font-semibold text-teal-700 bg-teal-50 rounded-lg border border-teal-100">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Thêm / Sửa Địa Điểm (PB19 - UI_28) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fadeIn">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {isEditing ? 'Chỉnh sửa Địa điểm Du lịch' : 'Thêm Địa điểm Du lịch mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Màn hình biểu mẫu chuẩn UI_28</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optimistic Conflict Warning */}
            {conflictError && (
              <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold">Cảnh báo Xung đột Phiên bản (Optimistic Locking):</p>
                  <p className="mt-1">{conflictError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      fetchDestinations();
                    }}
                    className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                  >
                    Tải lại danh sách mới nhất
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveDestination} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Tên địa điểm */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Tên địa điểm du lịch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bà Nà Hills, Phố cổ Hội An..."
                  value={formData.ten_dia_diem}
                  onChange={(e) => setFormData({ ...formData, ten_dia_diem: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Row 2: Tỉnh / Thành phố & Giá vé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.tinh_thanh_id}
                    onChange={(e) => setFormData({ ...formData, tinh_thanh_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ten_tinh_thanh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Giá vé tham quan (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0 = Miễn phí"
                    value={formData.gia_tham_quan}
                    onChange={(e) => setFormData({ ...formData, gia_tham_quan: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Row 3: Địa chỉ & Tọa độ */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Địa chỉ chi tiết
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hòa Ninh, Hòa Vang, Đà Nẵng"
                  value={formData.dia_chi}
                  onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Vĩ độ (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ví dụ: 15.998242"
                    value={formData.vi_do}
                    onChange={(e) => setFormData({ ...formData, vi_do: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Kinh độ (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ví dụ: 107.996112"
                    value={formData.kinh_do}
                    onChange={(e) => setFormData({ ...formData, kinh_do: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Row 4: Danh mục con (Multi-select) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Danh mục gắn kèm
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto space-y-2">
                  {categoryTree.map((g) => (
                    <div key={g.id} className="space-y-1">
                      <p className="text-xs font-bold text-teal-800">{g.ten_nhom}:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2">
                        {g.danh_mucs.map((dm) => {
                          const checked = formData.danh_muc_ids.includes(dm.id);
                          return (
                            <label
                              key={dm.id}
                              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      danh_muc_ids: [...formData.danh_muc_ids, dm.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      danh_muc_ids: formData.danh_muc_ids.filter((id) => id !== dm.id),
                                    });
                                  }
                                }}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span className="truncate">{dm.ten_danh_muc}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 5: Ảnh đại diện */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Ảnh đại diện (URL hoặc tải file lên)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.anh_dai_dien}
                    onChange={(e) => setFormData({ ...formData, anh_dai_dien: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <label className="flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 transition-colors">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              {/* Row 6: Mô tả ngắn */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Mô tả ngắn gọn
                </label>
                <textarea
                  rows="2"
                  placeholder="Tóm tắt điểm đặc sắc nhất của địa điểm..."
                  value={formData.mo_ta_ngan}
                  onChange={(e) => setFormData({ ...formData, mo_ta_ngan: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Row 7: Mô tả chi tiết */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows="4"
                  placeholder="Lịch sử, kinh nghiệm tham quan, các hoạt động hấp dẫn..."
                  value={formData.mo_ta_chi_tiet}
                  onChange={(e) => setFormData({ ...formData, mo_ta_chi_tiet: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Row 8: Cờ nổi bật */}
              <div className="flex items-center gap-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                <input
                  type="checkbox"
                  id="noi_bat_toggle"
                  checked={formData.noi_bat}
                  onChange={(e) => setFormData({ ...formData, noi_bat: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="noi_bat_toggle" className="text-sm font-semibold text-amber-900 cursor-pointer">
                  Đánh dấu địa điểm nổi bật (Hiển thị ưu tiên tại Hero Banner và gợi ý AI)
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isEditing ? 'Lưu thay đổi' : 'Tạo địa điểm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa Mềm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-fadeIn space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Xác nhận Xóa mềm Địa điểm</h3>
              <p className="text-sm text-slate-500 mt-1">
                Bạn có chắc chắn muốn chuyển địa điểm{' '}
                <strong className="text-slate-800">"{deleteTarget.ten_dia_diem}"</strong> vào thùng rác?
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Địa điểm sẽ được ẩn khỏi người dùng nhưng dữ liệu lịch trình cũ vẫn được bảo toàn nguyên vẹn.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Đang xóa...' : 'Đồng ý xóa mềm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

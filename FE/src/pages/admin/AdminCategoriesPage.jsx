import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  FolderPlus, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Layers,
  FolderOpen,
  Info
} from 'lucide-react';
import { categoryService } from '../../services/categoryService';

export default function AdminCategoriesPage() {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });

  // Modal State
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, name: '' });

  // Form states
  const [groupForm, setGroupForm] = useState({ id: null, ten_nhom: '', mo_ta: '' });
  const [categoryForm, setCategoryForm] = useState({ id: null, nhom_danh_muc_id: '', ten_danh_muc: '', mo_ta: '' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getTree();
      if (res.success) {
        setTreeData(res.data);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // --- XỬ LÝ NHÓM DANH MỤC (CẤP 1) ---
  const handleOpenCreateGroup = () => {
    setGroupForm({ id: null, ten_nhom: '', mo_ta: '' });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group) => {
    setGroupForm({ id: group.id, ten_nhom: group.ten_nhom, mo_ta: group.mo_ta || '' });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.ten_nhom.trim()) {
      showToast('error', 'Vui lòng nhập tên nhóm danh mục');
      return;
    }

    setSubmitting(true);
    try {
      if (groupForm.id) {
        await categoryService.updateGroup(groupForm.id, {
          ten_nhom: groupForm.ten_nhom.trim(),
          mo_ta: groupForm.mo_ta.trim(),
        });
        showToast('success', 'Cập nhật nhóm danh mục thành công!');
      } else {
        await categoryService.createGroup({
          ten_nhom: groupForm.ten_nhom.trim(),
          mo_ta: groupForm.mo_ta.trim(),
        });
        showToast('success', 'Tạo nhóm danh mục mới thành công!');
      }
      setGroupModalOpen(false);
      fetchTree();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // --- XỬ LÝ DANH MỤC CON (CẤP 2) ---
  const handleOpenCreateCategory = (defaultGroupId = '') => {
    setCategoryForm({
      id: null,
      nhom_danh_muc_id: defaultGroupId || (treeData[0]?.id || ''),
      ten_danh_muc: '',
      mo_ta: '',
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setCategoryForm({
      id: cat.id,
      nhom_danh_muc_id: cat.nhom_danh_muc_id,
      ten_danh_muc: cat.ten_danh_muc,
      mo_ta: cat.mo_ta || '',
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.nhom_danh_muc_id || !categoryForm.ten_danh_muc.trim()) {
      showToast('error', 'Vui lòng chọn nhóm cha và nhập tên danh mục con');
      return;
    }

    setSubmitting(true);
    try {
      if (categoryForm.id) {
        await categoryService.updateCategory(categoryForm.id, {
          nhom_danh_muc_id: categoryForm.nhom_danh_muc_id,
          ten_danh_muc: categoryForm.ten_danh_muc.trim(),
          mo_ta: categoryForm.mo_ta.trim(),
        });
        showToast('success', 'Cập nhật danh mục con thành công!');
      } else {
        await categoryService.createCategory({
          nhom_danh_muc_id: categoryForm.nhom_danh_muc_id,
          ten_danh_muc: categoryForm.ten_danh_muc.trim(),
          mo_ta: categoryForm.mo_ta.trim(),
        });
        showToast('success', 'Thêm danh mục con thành công!');
      }
      setCategoryModalOpen(false);
      fetchTree();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // --- XÓA ---
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === 'group') {
        await categoryService.deleteGroup(deleteConfirm.id);
        showToast('success', `Đã xóa nhóm danh mục "${deleteConfirm.name}"`);
      } else {
        await categoryService.deleteCategory(deleteConfirm.id);
        showToast('success', `Đã xóa danh mục con "${deleteConfirm.name}"`);
      }
      setDeleteConfirm({ open: false, type: '', id: null, name: '' });
      fetchTree();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all transform animate-in slide-in-from-top-4 ${
            toast.type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider mb-1">
            <FolderTree className="w-4 h-4" />
            <span>PB15 • Cây Danh Mục Địa Điểm 2 Cấp</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý Danh mục</h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân loại địa điểm du lịch theo cấu trúc 2 cấp (Mỗi nhóm có tối đa 10 mục con, chống trùng tên không dấu)
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenCreateGroup}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-teal-400" />
            <span>Thêm nhóm danh mục</span>
          </button>
          <button
            onClick={() => handleOpenCreateCategory()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mục con</span>
          </button>
        </div>
      </div>

      {/* Category Tree View (UI_29) */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : treeData.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Chưa có danh mục nào</h3>
          <p className="text-sm text-slate-500 mt-1">Bấm nút "Thêm nhóm danh mục" để bắt đầu tạo cây danh mục 2 cấp.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {treeData.map((group) => {
            const isFull = group.so_luong_muc_con >= 10;
            const pct = (group.so_luong_muc_con / 10) * 100;

            return (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-slate-300"
              >
                {/* Group Header (Cấp 1) */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50/80 via-white to-teal-50/20 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/50">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{group.ten_nhom}</h2>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          ID #{group.id}
                        </span>
                      </div>
                      {group.mo_ta && (
                        <p className="text-xs text-slate-500 mt-0.5">{group.mo_ta}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center gap-4 sm:gap-6 self-end md:self-auto">
                    {/* Capacity Indicator (PB15 constraint: max 10 subcategories) */}
                    <div className="w-36 text-right">
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span className="text-slate-500 text-[11px]">Sức chứa mục con</span>
                        <span className={isFull ? 'text-amber-600 font-bold' : 'text-teal-700'}>
                          {group.so_luong_muc_con}/10
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                      <button
                        onClick={() => handleOpenCreateCategory(group.id)}
                        disabled={isFull}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                        title={isFull ? 'Đã đạt tối đa 10 mục con' : 'Thêm mục con vào nhóm này'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Thêm mục con</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditGroup(group)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Chỉnh sửa nhóm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            open: true,
                            type: 'group',
                            id: group.id,
                            name: group.ten_nhom,
                          })
                        }
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa nhóm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subcategories Grid (Cấp 2) */}
                <div className="p-5 sm:p-6 bg-white">
                  {group.danh_mucs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                      Nhóm này chưa có danh mục con nào. Bấm nút "+ Thêm mục con" để thêm.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.danh_mucs.map((cat) => (
                        <div
                          key={cat.id}
                          className="group relative p-3.5 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/20 bg-slate-50/40 transition flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                              <span className="text-sm font-bold text-slate-800 truncate">
                                {cat.ten_danh_muc}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 pl-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-0.5 text-slate-600 font-medium">
                                <MapPin className="w-3 h-3 text-teal-600" />
                                {cat.so_dia_diem} địa điểm
                              </span>
                              {cat.mo_ta && (
                                <span className="truncate max-w-[140px] text-slate-400">
                                  • {cat.mo_ta}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Item actions */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleOpenEditCategory(cat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-white transition cursor-pointer"
                              title="Sửa mục con"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  type: 'category',
                                  id: cat.id,
                                  name: cat.ten_danh_muc,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition cursor-pointer"
                              title="Xóa mục con"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Thêm/Sửa Nhóm danh mục Cấp 1 (UI_30) */}
      {/* ========================================================= */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {groupForm.id ? 'Chỉnh sửa nhóm danh mục' : 'Thêm nhóm danh mục mới'}
              </h3>
              <button
                onClick={() => setGroupModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên nhóm danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.ten_nhom}
                  onChange={(e) => setGroupForm({ ...groupForm, ten_nhom: e.target.value })}
                  placeholder="Ví dụ: Du lịch Văn hóa & Di sản"
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Hệ thống tự động kiểm tra chống trùng tên không dấu
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mô tả nhóm (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={groupForm.mo_ta}
                  onChange={(e) => setGroupForm({ ...groupForm, mo_ta: e.target.value })}
                  placeholder="Mô tả ý nghĩa và đối tượng của nhóm danh mục này..."
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : groupForm.id ? 'Cập nhật nhóm' : 'Tạo nhóm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Thêm/Sửa Danh mục con Cấp 2 (UI_30) */}
      {/* ========================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {categoryForm.id ? 'Chỉnh sửa danh mục con' : 'Thêm danh mục con mới'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nhóm danh mục cha <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={categoryForm.nhom_danh_muc_id}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, nhom_danh_muc_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="">-- Chọn nhóm danh mục --</option>
                  {treeData.map((g) => (
                    <option
                      key={g.id}
                      value={g.id}
                      disabled={g.so_luong_muc_con >= 10 && g.id !== categoryForm.nhom_danh_muc_id}
                    >
                      {g.ten_nhom} ({g.so_luong_muc_con}/10 mục)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên danh mục con <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.ten_danh_muc}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, ten_danh_muc: e.target.value })
                  }
                  placeholder="Ví dụ: Chùa chiền, Đền thờ, Bảo tàng"
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mô tả danh mục con (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={categoryForm.mo_ta}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, mo_ta: e.target.value })
                  }
                  placeholder="Mô tả tiêu chuẩn của danh mục này..."
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : categoryForm.id ? 'Cập nhật mục con' : 'Thêm mục con'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: Xác nhận xóa an toàn */}
      {/* ========================================================= */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận xóa danh mục</h3>
            <p className="text-xs text-slate-500 mt-2">
              Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'group' ? 'nhóm' : 'danh mục con'}{' '}
              <strong className="text-slate-800">"{deleteConfirm.name}"</strong> không? Thao tác này không thể hoàn tác nếu danh mục chưa có địa điểm nào sử dụng.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, type: '', id: null, name: '' })}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

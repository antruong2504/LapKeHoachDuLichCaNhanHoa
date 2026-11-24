import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import guideService from '../services/guideService';
import {
  BookOpen,
  PenSquare,
  Search,
  MessageCircle,
  Share2,
  Calendar,
  X,
  ImagePlus,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User
} from 'lucide-react';

export default function GuidesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Modal Viết cẩm nang mới (E2E UI_23)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    tieu_de: '',
    mo_ta_ngan: '',
    noi_dung: '',
    anh_dai_dien: '',
  });
  const [uploadedImages, setUploadedImages] = useState([]); // [{ id, url }]
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingGuide, setSubmittingGuide] = useState(false);
  const [createError, setCreateError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Modal Chi tiết & Bình luận cẩm nang
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Tải danh sách cẩm nang
  const fetchGuides = async (keyword = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await guideService.getGuides(keyword ? { search: keyword } : {});
      if (res.success && Array.isArray(res.data)) {
        setGuides(res.data);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách cẩm nang du lịch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGuides(searchTerm);
  };

  // Mở modal Viết cẩm nang mới
  const handleOpenCreateModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setCreateForm({ tieu_de: '', mo_ta_ngan: '', noi_dung: '', anh_dai_dien: '' });
    setUploadedImages([]);
    setCreateError('');
    setShowCreateModal(true);
  };

  // Upload ảnh cẩm nang (lưu cam_nang_hinh_anhs)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setCreateError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await guideService.uploadImage(formData);
      if (res.success && res.data?.id && res.data?.url) {
        const newImg = { id: res.data.id, url: res.data.url };
        setUploadedImages((prev) => [...prev, newImg]);
        if (!createForm.anh_dai_dien) {
          setCreateForm((prev) => ({ ...prev, anh_dai_dien: res.data.url }));
        }
      } else {
        throw new Error(res.message || 'Tải ảnh thất bại');
      }
    } catch (err) {
      setCreateError(err.message || 'Lỗi khi tải lên hình ảnh.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Đăng cẩm nang mới
  const handleCreateGuide = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.tieu_de.trim() || !createForm.noi_dung.trim()) {
      setCreateError('Vui lòng nhập đầy đủ tiêu đề và nội dung cẩm nang.');
      return;
    }

    setSubmittingGuide(true);
    try {
      const payload = {
        tieu_de: createForm.tieu_de.trim(),
        mo_ta_ngan: createForm.mo_ta_ngan.trim(),
        noi_dung: createForm.noi_dung.trim(),
        anh_dai_dien: createForm.anh_dai_dien.trim() || uploadedImages[0]?.url || '',
        hinh_anh_ids: uploadedImages.map((img) => img.id),
      };

      const res = await guideService.createGuide(payload);
      if (res.success && res.data) {
        setGuides((prev) => [res.data, ...prev]);
        setShowCreateModal(false);
        showToast('Đăng bài viết cẩm nang mới thành công!');
      } else {
        throw new Error(res.message || 'Không thể đăng cẩm nang');
      }
    } catch (err) {
      setCreateError(err.message || 'Có lỗi xảy ra khi đăng cẩm nang.');
    } finally {
      setSubmittingGuide(false);
    }
  };

  // Mở chi tiết cẩm nang
  const handleOpenDetail = async (guideId) => {
    setLoadingDetail(true);
    setSelectedGuide({ id: guideId });
    setCommentText('');
    try {
      const res = await guideService.getGuideById(guideId);
      if (res.success && res.data) {
        setSelectedGuide(res.data);
      }
    } catch (err) {
      alert(err.message || 'Không thể tải chi tiết cẩm nang.');
      setSelectedGuide(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Gửi bình luận cẩm nang
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim() || !selectedGuide) return;

    setSubmittingComment(true);
    try {
      const res = await guideService.addComment(selectedGuide.id, commentText.trim());
      if (res.success && res.data) {
        const newComment = res.data;
        setSelectedGuide((prev) => ({
          ...prev,
          so_binh_luan: (prev.so_binh_luan || 0) + 1,
          binh_luans: [newComment, ...(prev.binh_luans || [])],
        }));
        setGuides((prev) =>
          prev.map((g) =>
            g.id === selectedGuide.id ? { ...g, so_binh_luan: (g.so_binh_luan || 0) + 1 } : g
          )
        );
        setCommentText('');
      }
    } catch (err) {
      alert(err.message || 'Không thể gửi bình luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Chia sẻ cẩm nang
  const handleShareGuide = async (guideId) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/guides`);
    } catch (_) {}

    if (user) {
      try {
        const res = await guideService.shareGuide(guideId);
        if (res.success && res.data) {
          setSelectedGuide((prev) =>
            prev && prev.id === guideId ? { ...prev, so_chia_se: res.data.so_chia_se } : prev
          );
          setGuides((prev) =>
            prev.map((g) => (g.id === guideId ? { ...g, so_chia_se: res.data.so_chia_se } : g))
          );
        }
      } catch (_) {}
    }
    showToast('Đã sao chép liên kết chia sẻ cẩm nang!');
  };

  // Xóa cẩm nang
  const handleDeleteGuide = async (guideId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết cẩm nang này?')) return;
    try {
      const res = await guideService.deleteGuide(guideId);
      if (res.success) {
        setGuides((prev) => prev.filter((g) => g.id !== guideId));
        setSelectedGuide(null);
        showToast('Đã xóa bài viết cẩm nang.');
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa bài viết.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Toast notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header & Nút Viết cẩm nang mới */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Cộng đồng du lịch • PB11 (UI_23)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Cẩm nang <span className="text-teal-600">du lịch</span>
            </h1>
            <p className="mt-1 text-slate-600 text-sm sm:text-base">
              Khám phá kinh nghiệm thực tế, mẹo di chuyển và chia sẻ hành trình của chính bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-600/25 transition self-start md:self-auto"
          >
            <PenSquare className="w-4 h-4" />
            <span>Viết cẩm nang mới</span>
          </button>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 mb-8 flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm cẩm nang theo địa điểm, kinh nghiệm, ẩm thực..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Loading / Error */}
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="w-9 h-9 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Đang tải cẩm nang cộng đồng...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Guides Grid */}
        {!loading && !error && guides.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Chưa có cẩm nang nào</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
              Hãy là người đầu tiên chia sẻ kinh nghiệm du lịch hữu ích tới cộng đồng TripMate!
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
            >
              Viết cẩm nang mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <article
                key={guide.id}
                onClick={() => handleOpenDetail(guide.id)}
                className="bg-white rounded-3xl border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group"
              >
                <div className="relative h-48 bg-slate-200 overflow-hidden">
                  <img
                    src={
                      guide.anh_dai_dien ||
                      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800'
                    }
                    alt={guide.tieu_de}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3.5 px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-teal-300" />
                    {new Date(guide.ngay_dang).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-2 mb-2">
                      {guide.tieu_de}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4">
                      {guide.mo_ta_ngan || guide.noi_dung}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={
                          guide.tac_gia?.anh_dai_dien ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                        }
                        alt={guide.tac_gia?.ho_ten || 'Tác giả'}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <span className="font-semibold text-slate-700 truncate">
                        {guide.tac_gia?.ho_ten || 'Thành viên TripMate'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
                        {guide.so_binh_luan || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5 text-amber-500" />
                        {guide.so_chia_se || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL VIẾT CẨM NANG MỚI (UI_23) */}
        {/* ======================================================== */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Viết cẩm nang du lịch mới</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chia sẻ kinh nghiệm và hình ảnh chuyến đi của bạn với cộng đồng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGuide} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.tieu_de}
                    onChange={(e) => setCreateForm({ ...createForm, tieu_de: e.target.value })}
                    placeholder="VD: Kinh nghiệm du lịch Đà Nẵng - Hội An 4 ngày 3 đêm tự túc"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    value={createForm.mo_ta_ngan}
                    onChange={(e) => setCreateForm({ ...createForm, mo_ta_ngan: e.target.value })}
                    placeholder="Tóm tắt ngắn gọn điểm nổi bật của bài chia sẻ..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Upload ảnh cẩm nang */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Hình ảnh đính kèm & Ảnh bìa
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold cursor-pointer transition">
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4" />
                      )}
                      <span>{uploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh từ máy'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={createForm.anh_dai_dien}
                      onChange={(e) => setCreateForm({ ...createForm, anh_dai_dien: e.target.value })}
                      placeholder="Hoặc dán URL ảnh bìa (tùy chọn)..."
                      className="flex-1 min-w-[200px] px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3">
                      {uploadedImages.map((img) => (
                        <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                          <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedImages((prev) => prev.filter((item) => item.id !== img.id))
                            }
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nội dung chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="6"
                    required
                    value={createForm.noi_dung}
                    onChange={(e) => setCreateForm({ ...createForm, noi_dung: e.target.value })}
                    placeholder="Viết chi tiết lịch trình, phương tiện di chuyển, quán ăn ngon và những lưu ý quan trọng..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={submittingGuide}
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGuide || uploadingImage}
                    className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/25 disabled:opacity-50 transition"
                  >
                    {submittingGuide ? 'Đang đăng bài...' : 'Đăng cẩm nang'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL CHI TIẾT CẨM NANG & BÌNH LUẬN (UI_23) */}
        {/* ======================================================== */}
        {selectedGuide && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {loadingDetail ? (
                <div className="p-16 text-center">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Đang tải nội dung cẩm nang...</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {selectedGuide.tieu_de}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          {selectedGuide.tac_gia?.ho_ten || 'Thành viên TripMate'}
                        </span>
                        <span>•</span>
                        <span>{new Date(selectedGuide.ngay_dang).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user &&
                        (user.id?.toString() === selectedGuide.tac_gia_id?.toString() ||
                          user.vai_tro === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGuide(selectedGuide.id)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() => setSelectedGuide(null)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
                    {selectedGuide.anh_dai_dien && (
                      <div className="rounded-2xl overflow-hidden max-h-80 bg-slate-100">
                        <img
                          src={selectedGuide.anh_dai_dien}
                          alt={selectedGuide.tieu_de}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Bộ ảnh liên kết từ cam_nang_anh_lien_kets */}
                    {selectedGuide.hinh_anhs && selectedGuide.hinh_anhs.length > 1 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {selectedGuide.hinh_anhs.map((img) => (
                          <div key={img.id} className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100">
                            <img src={img.duong_dan} alt="Gallery" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedGuide.noi_dung}
                    </div>

                    {/* Action Share */}
                    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-semibold text-slate-600">
                        Thấy bài viết hữu ích? Chia sẻ ngay cho bạn đồng hành!
                      </span>
                      <button
                        type="button"
                        onClick={() => handleShareGuide(selectedGuide.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Chia sẻ ({selectedGuide.so_chia_se || 0})</span>
                      </button>
                    </div>

                    {/* Bình luận cẩm nang */}
                    <div className="pt-4 border-t border-slate-200 space-y-4">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-teal-600" />
                        <span>Bình luận ({selectedGuide.binh_luans?.length || 0})</span>
                      </h3>

                      <form onSubmit={handleSubmitComment} className="flex items-center gap-2.5">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={
                            user
                              ? 'Viết bình luận của bạn về bài viết này...'
                              : 'Đăng nhập để tham gia bình luận...'
                          }
                          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !commentText.trim()}
                          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi</span>
                        </button>
                      </form>

                      <div className="space-y-3">
                        {(selectedGuide.binh_luans || []).length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">
                            Chưa có bình luận nào. Hãy là người đầu tiên nhận xét!
                          </p>
                        ) : (
                          selectedGuide.binh_luans.map((c) => (
                            <div
                              key={c.id}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
                            >
                              <img
                                src={
                                  c.tai_khoan?.anh_dai_dien ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                                }
                                alt={c.tai_khoan?.ho_ten || 'User'}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    {c.tai_khoan?.ho_ten || 'Du khách TripMate'}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(c.created_at).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-700 mt-1">{c.noi_dung}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

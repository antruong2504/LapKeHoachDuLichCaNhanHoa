import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { destinationService } from '../services/destinationService';
import { aiService } from '../services/aiService';
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  Clock,
  ArrowRight,
  RotateCcw,
  BookmarkCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Info,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  ExternalLink,
  Layers
} from 'lucide-react';

const POPULAR_INTERESTS = [
  'Văn hóa & Di tích lịch sử',
  'Ẩm thực & Streetfood đặc sản',
  'Biển đảo & Nghỉ dưỡng',
  'Thiên nhiên & Trekking',
  'Chụp ảnh check-in sống ảo',
  'Chợ đêm & Giải trí',
  'Du lịch tiết kiệm, trải nghiệm',
];

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Danh sách tỉnh thành
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  // Form 6 thông tin bắt buộc (UI_17)
  const [formData, setFormData] = useState({
    tinh_thanh_id: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
    ngan_sach_du_kien: 5000000,
    so_luong_nguoi: 2,
    so_thich_tags: ['Văn hóa & Di tích lịch sử', 'Ẩm thực & Streetfood đặc sản'],
    ghi_chu_so_thich: '',
  });

  // State trạng thái AI
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // State kết quả AI (UI_18)
  const [draftId, setDraftId] = useState(null);
  const [itineraryResult, setItineraryResult] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // State khi tạo lại 1 ngày & lưu
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessTripId, setSaveSuccessTripId] = useState(null);

  // Load danh sách tỉnh thành khi vào trang
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await destinationService.getProvinces();
        const data = res.data || res;
        setProvinces(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          // Mặc định chọn Đà Nẵng hoặc tỉnh đầu tiên
          const daNang = data.find((p) => p.ten_tinh_thanh.includes('Đà Nẵng'));
          setFormData((prev) => ({
            ...prev,
            tinh_thanh_id: daNang ? daNang.id.toString() : data[0].id.toString(),
          }));
        }
      } catch (err) {
        console.error('Lỗi tải danh mục tỉnh thành:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();

    // Thiết lập ngày mặc định (từ ngày mai, kéo dài 3 ngày 2 đêm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysLater = new Date(tomorrow);
    threeDaysLater.setDate(tomorrow.getDate() + 2);

    setFormData((prev) => ({
      ...prev,
      ngay_bat_dau: tomorrow.toISOString().split('T')[0],
      ngay_ket_thuc: threeDaysLater.toISOString().split('T')[0],
    }));
  }, []);

  // Tính số ngày
  const calculateDays = () => {
    if (!formData.ngay_bat_dau || !formData.ngay_ket_thuc) return 0;
    const start = new Date(formData.ngay_bat_dau);
    const end = new Date(formData.ngay_ket_thuc);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const totalDays = calculateDays();

  // Đổi tag sở thích
  const toggleInterestTag = (tag) => {
    setFormData((prev) => {
      const exists = prev.so_thich_tags.includes(tag);
      return {
        ...prev,
        so_thich_tags: exists
          ? prev.so_thich_tags.filter((t) => t !== tag)
          : [...prev.so_thich_tags, tag],
      };
    });
  };

  // Bước mô phỏng sinh động khi chờ AI
  const aiSteps = [
    'Đang phân tích sở thích du lịch và giới hạn ngân sách...',
    'Đang tra cứu cơ sở dữ liệu các điểm đến du lịch đã kiểm duyệt...',
    'Đang kích hoạt mô hình Gemini AI để sắp xếp các cung đường...',
    'Đang tối ưu thời gian di chuyển và dự toán chi phí chi tiết...',
  ];

  // Xử lý gửi yêu cầu tạo lịch trình (UI_17 -> UI_18)
  const handleGenerate = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (totalDays <= 0) {
      setErrorMessage('Ngày kết thúc phải diễn ra sau hoặc cùng ngày bắt đầu');
      return;
    }

    if (totalDays > 14) {
      setErrorMessage('Hệ thống hỗ trợ lịch trình tối đa 14 ngày. Vui lòng chọn khoảng thời gian ngắn hơn.');
      return;
    }

    if (!formData.ngan_sach_du_kien || formData.ngan_sach_du_kien < 100000) {
      setErrorMessage('Vui lòng nhập ngân sách dự kiến hợp lệ (tối thiểu 100,000 VNĐ)');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < aiSteps.length - 1 ? prev + 1 : prev));
    }, 4500);

    try {
      const so_thich = [
        ...formData.so_thich_tags,
        formData.ghi_chu_so_thich.trim(),
      ].filter(Boolean).join(', ');

      const payload = {
        tinh_thanh_id: formData.tinh_thanh_id,
        ngay_bat_dau: formData.ngay_bat_dau,
        ngay_ket_thuc: formData.ngay_ket_thuc,
        ngan_sach_du_kien: Number(formData.ngan_sach_du_kien),
        so_luong_nguoi: Number(formData.so_luong_nguoi),
        so_thich: so_thich || 'Khám phá văn hóa ẩm thực và chụp ảnh kỷ niệm',
      };

      const res = await aiService.generateItinerary(payload);
      clearInterval(stepInterval);

      if (res.success && res.data) {
        setDraftId(res.data.ban_nhap_id);
        setItineraryResult(res.data.noi_dung_lich_trinh);
        setActiveDayIndex(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(res.message || 'Không thể tạo lịch trình bằng AI');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || 'Hệ thống AI tạm thời bận hoặc có lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Tạo lại 1 ngày cụ thể
  const handleRegenerateDay = async (thu_tu_ngay) => {
    if (!draftId) return;
    setIsRegeneratingDay(true);
    try {
      const res = await aiService.regenerateDay(draftId, thu_tu_ngay);
      if (res.success && res.data?.ngay_moi) {
        setItineraryResult((prev) => {
          if (!prev) return prev;
          const updatedDays = prev.cac_ngay.map((d) =>
            d.thu_tu_ngay === thu_tu_ngay ? res.data.ngay_moi : d
          );
          return { ...prev, cac_ngay: updatedDays };
        });
      }
    } catch (err) {
      alert(err.message || 'Không thể tạo lại ngày này');
    } finally {
      setIsRegeneratingDay(false);
    }
  };

  // Lưu bản nháp AI vào lịch trình chính thức
  const handleSaveDraft = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu lịch trình chuyến đi vào tài khoản của bạn.');
      navigate('/login');
      return;
    }

    if (!draftId) return;

    setIsSaving(true);
    try {
      const res = await aiService.saveDraft(
        draftId,
        itineraryResult.ten_lich_trinh || `Kỳ nghỉ ${selectedProvince?.ten_tinh_thanh || ''}`
      );
      if (res.success && res.data?.trip_id) {
        setSaveSuccessTripId(res.data.trip_id);
      } else {
        throw new Error(res.message || 'Lưu lịch trình thất bại');
      }
    } catch (err) {
      alert(err.message || 'Không thể lưu lịch trình');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProvince = provinces.find((p) => p.id.toString() === formData.tinh_thanh_id?.toString());

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Trợ lý Lịch trình AI</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Lập kế hoạch bằng <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base">
              Nhập thông tin chuyến đi để nhận gợi ý lịch trình từng ngày, tối ưu ngân sách và phù hợp với sở thích của bạn.
            </p>
          </div>

          <Link
            to="/trips/manual-create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs sm:text-sm font-bold shadow-sm transition self-start md:self-auto"
          >
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Tự tạo thủ công</span>
          </Link>
        </div>

        {/* ======================================================== */}
        {/* PHASE 1: FORM NHẬP 6 THÔNG TIN BẮT BUỘC (UI_17) */}
        {/* ======================================================== */}
        {!itineraryResult && !isGenerating && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-10">
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Thông tin chưa hợp lệ</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-8">
              {/* 1. Điểm đến & Tỉnh thành */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  1. Tỉnh / Thành phố bạn muốn đến du lịch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tinh_thanh_id}
                  onChange={(e) => setFormData({ ...formData, tinh_thanh_id: e.target.value })}
                  disabled={loadingProvinces}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id.toString()}>
                      {prov.ten_tinh_thanh} ({prov.vung_mien || 'Việt Nam'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2 & 3. Ngày bắt đầu & Ngày kết thúc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    2. Ngày bắt đầu khởi hành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngay_bat_dau}
                    onChange={(e) => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    3. Ngày kết thúc chuyến đi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.ngay_ket_thuc}
                    onChange={(e) => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  {totalDays > 0 && (
                    <p className="mt-1.5 text-xs font-semibold text-teal-700">
                      Thời lượng: {totalDays} ngày {totalDays > 1 ? `${totalDays - 1} đêm` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* 4 & 5. Ngân sách & Số lượng người */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                    4. Ngân sách dự kiến (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="Nhập ngân sách dự kiến"
                      value={
                        formData.ngan_sach_du_kien !== '' && formData.ngan_sach_du_kien !== null
                          ? Number(formData.ngan_sach_du_kien).toLocaleString('vi-VN')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, ngan_sach_du_kien: raw ? Number(raw) : '' });
                      }}
                      className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      VNĐ
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[3000000, 5000000, 8000000, 12000000].map((quickAmount) => (
                      <button
                        type="button"
                        key={quickAmount}
                        onClick={() => setFormData({ ...formData, ngan_sach_du_kien: quickAmount })}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          Number(formData.ngan_sach_du_kien) === quickAmount
                            ? 'bg-teal-50 border-teal-300 text-teal-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {(quickAmount / 1000000).toFixed(0)} triệu
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    5. Số lượng người đi <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          so_luong_nguoi: Math.max(1, Number(prev.so_luong_nguoi) - 1),
                        }))
                      }
                      className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-900">
                      {formData.so_luong_nguoi} người
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          so_luong_nguoi: Math.min(20, Number(prev.so_luong_nguoi) + 1),
                        }))
                      }
                      className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Sở thích du lịch */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  6. Sở thích du lịch & Phong cách trải nghiệm <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {POPULAR_INTERESTS.map((interest) => {
                    const isSelected = formData.so_thich_tags.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterestTag(interest)}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-600/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  rows="2"
                  value={formData.ghi_chu_so_thich}
                  onChange={(e) => setFormData({ ...formData, ghi_chu_so_thich: e.target.value })}
                  placeholder="Ví dụ: thích quán cà phê yên tĩnh, đồ ăn địa phương, đi cùng trẻ nhỏ..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2.5"
                >
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                  <span>Tạo lịch trình bằng Gemini AI</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 2: ANIMATION CHỜ GEMINI AI XỬ LÝ */}
        {/* ======================================================== */}
        {isGenerating && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12 text-center max-w-xl mx-auto my-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-teal-500/20 animate-ping" />
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/30">
                <Sparkles className="w-12 h-12 animate-pulse text-amber-300" />
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Gemini AI đang kiến tạo chuyến đi của bạn
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Vui lòng đợi giây lát, quá trình phân tích và tối ưu hóa đang diễn ra.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-teal-800 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span>{aiSteps[generationStep]}</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: MÀN HÌNH KẾT QUẢ AI THEO TỪNG NGÀY (UI_18) */}
        {/* ======================================================== */}
        {itineraryResult && !isGenerating && (
          <div className="space-y-6">
            {/* Modal Thông báo lưu thành công */}
            {saveSuccessTripId && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold">Đã lưu lịch trình thành công!</h4>
                    <p className="text-xs text-emerald-700">Chuyến đi đã được đồng bộ vào danh sách lịch trình cá nhân của bạn.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/trips/${saveSuccessTripId}`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Xem chi tiết lịch trình
                  </Link>
                  <Link
                    to="/my-trips"
                    className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition"
                  >
                    Về danh sách
                  </Link>
                </div>
              </div>
            )}

            {/* Banner tóm tắt chuyến đi & cảnh báo ngân sách */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <span>Lịch trình tối ưu hóa bởi Gemini AI</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {itineraryResult.ten_lich_trinh || `Lịch trình khám phá ${selectedProvince?.ten_tinh_thanh || ''}`}
                  </h2>
                </div>

                {/* Actions: Lưu lịch trình & Tạo lại */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setItineraryResult(null);
                      setDraftId(null);
                      setSaveSuccessTripId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Lập lại từ đầu</span>
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving || saveSuccessTripId !== null}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{isSaving ? 'Đang lưu...' : saveSuccessTripId ? 'Đã lưu' : 'Lưu vào tài khoản'}</span>
                  </button>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Điểm đến</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedProvince?.ten_tinh_thanh || 'Việt Nam'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Thời gian</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{itineraryResult.cac_ngay?.length || totalDays} ngày</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Số người</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formData.so_luong_nguoi} người</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Dự toán chi phí</p>
                  <p className="text-sm font-black text-teal-700 mt-0.5">
                    {Number(itineraryResult.tong_chi_phi_uoc_tinh || 0).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              {/* Cảnh báo vượt ngân sách nếu có (PB08 requirement) */}
              {itineraryResult.vuot_ngan_sach && (
                <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cảnh báo vượt ngân sách: </span>
                    {itineraryResult.canh_bao ||
                      `Chi phí dự kiến (${Number(itineraryResult.tong_chi_phi_uoc_tinh || 0).toLocaleString('vi-VN')} đ) đang cao hơn ngân sách dự kiến ban đầu.`}
                  </div>
                </div>
              )}
            </div>

            {/* Day Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {(itineraryResult.cac_ngay || []).map((day, idx) => (
                <button
                  key={day.thu_tu_ngay}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shrink-0 transition flex items-center gap-2 ${
                    activeDayIndex === idx
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ngày {day.thu_tu_ngay}</span>
                </button>
              ))}
            </div>

            {/* Chi tiết các chặng trong ngày đang chọn */}
            {itineraryResult.cac_ngay?.[activeDayIndex] && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                {/* Header ngày */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      Hành trình Ngày {itineraryResult.cac_ngay[activeDayIndex].thu_tu_ngay}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {itineraryResult.cac_ngay[activeDayIndex].tieu_de_ngay || `Khám phá các điểm đến hấp dẫn`}
                    </h3>
                  </div>

                  {/* Nút Tạo lại ngày này (PB08 requirement) */}
                  <button
                    onClick={() => handleRegenerateDay(itineraryResult.cac_ngay[activeDayIndex].thu_tu_ngay)}
                    disabled={isRegeneratingDay}
                    className="px-4 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRegeneratingDay ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingDay ? 'Đang tạo lại...' : 'Tạo lại ngày này'}</span>
                  </button>
                </div>

                {/* Danh sách các chặng: Sáng, Chiều, Tối */}
                <div className="mt-6 space-y-6">
                  {(itineraryResult.cac_ngay[activeDayIndex].cac_chang || []).map((chang, cIdx) => {
                    const getBuoiIcon = (buoi) => {
                      if (buoi === 'sang') return <Sun className="w-4 h-4 text-amber-500" />;
                      if (buoi === 'chieu') return <Sunset className="w-4 h-4 text-orange-500" />;
                      return <Moon className="w-4 h-4 text-indigo-500" />;
                    };

                    const getBuoiLabel = (buoi) => {
                      if (buoi === 'sang') return 'Buổi Sáng';
                      if (buoi === 'chieu') return 'Buổi Chiều';
                      return 'Buổi Tối';
                    };

                    return (
                      <div
                        key={cIdx}
                        className="relative p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-teal-200 hover:shadow-md transition duration-200"
                      >
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          {/* Ảnh đại diện chặng */}
                          <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                            <img
                              src={
                                chang.anh_dai_dien ||
                                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'
                              }
                              alt={chang.ten_dia_diem}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          </div>

                          {/* Thông tin chặng */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1">
                                {getBuoiIcon(chang.buoi)}
                                <span>{getBuoiLabel(chang.buoi)}</span>
                              </span>
                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{chang.thoi_gian || 'Thời gian linh hoạt'}</span>
                              </span>
                              {chang.chi_phi_uoc_tinh > 0 && (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  ~{Number(chang.chi_phi_uoc_tinh).toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                              {chang.ten_dia_diem}
                            </h4>

                            {chang.dia_chi && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{chang.dia_chi}</span>
                              </p>
                            )}

                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                              {chang.hoat_dong || 'Tham quan, chụp ảnh và tận hưởng trải nghiệm địa phương.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

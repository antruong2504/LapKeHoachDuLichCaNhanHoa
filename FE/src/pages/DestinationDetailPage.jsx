import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Clock, 
  Ticket, 
  Sparkles, 
  Heart, 
  Compass, 
  CloudSun, 
  Map as MapIcon, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  Share2,
  CheckCircle2,
  MessageSquarePlus,
  X,
  Trash2,
  Send
} from 'lucide-react';
import destinationService from '../services/destinationService';
import DestinationCard from '../components/DestinationCard';
import favoriteService from '../services/favoriteService';
import reviewService from '../services/reviewService';
import { useAuth } from '../context/AuthContext';

export default function DestinationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [destination, setDestination] = useState(null);
  const [nearbyDestinations, setNearbyDestinations] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // State Modal Đánh giá 1-5 sao (PB10 - UI_16)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await destinationService.getDestinationById(id);
        if (res.success && res.data) {
          setDestination(res.data);
          setActiveImageIndex(0);

          // Tải các địa điểm lân cận cùng tỉnh thành
          if (res.data.tinh_thanh_id) {
            const nearbyRes = await destinationService.getDestinations({
              tinh_thanh_id: res.data.tinh_thanh_id,
              limit: 4,
            });
            if (nearbyRes.success && nearbyRes.data) {
              setNearbyDestinations(
                nearbyRes.data.filter((d) => d.id.toString() !== id.toString())
              );
            }
          }

          // Kiểm tra xem user hiện tại đã yêu thích địa điểm này chưa
          if (user) {
            try {
              const favRes = await favoriteService.getMyFavoriteIds();
              if (favRes.success && favRes.data) {
                setIsFavorite(favRes.data.includes(id.toString()));
              }
            } catch (favErr) {
              console.error('Lỗi kiểm tra yêu thích:', favErr);
            }
          }
        } else {
          setError('Không tìm thấy thông tin địa điểm.');
        }
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin địa điểm.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    try {
      await favoriteService.toggleFavorite(id);
    } catch (err) {
      setIsFavorite(!nextState);
    }
  };

  // Mở modal đánh giá (UI_16)
  const handleOpenReviewModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReviewStars(5);
    setHoverStars(0);
    setReviewContent('');
    setReviewError('');
    setShowReviewModal(true);
  };

  // Gửi đánh giá 1-5 sao (PB10)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!reviewContent.trim()) {
      setReviewError('Vui lòng nhập nội dung nhận xét trải nghiệm của bạn.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await reviewService.createReview({
        dia_diem_id: id,
        so_sao: reviewStars,
        noi_dung: reviewContent.trim(),
      });

      if (res.success && res.data?.review) {
        setDestination((prev) => ({
          ...prev,
          diem_danh_gia_tb: res.data.diem_danh_gia_tb,
          so_danh_gia: res.data.so_danh_gia,
          danh_gia_danh_sach: [res.data.review, ...(prev.danh_gia_danh_sach || [])],
        }));
        setShowReviewModal(false);
        setReviewSuccessMsg('Cảm ơn bạn đã gửi đánh giá! Điểm trung bình địa điểm đã được cập nhật.');
        setTimeout(() => setReviewSuccessMsg(''), 5000);
      } else {
        throw new Error(res.message || 'Gửi đánh giá thất bại');
      }
    } catch (err) {
      setReviewError(err.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      const res = await reviewService.deleteReview(reviewId);
      if (res.success) {
        setDestination((prev) => ({
          ...prev,
          diem_danh_gia_tb: res.data?.diem_danh_gia_tb ?? prev.diem_danh_gia_tb,
          so_danh_gia: res.data?.so_danh_gia ?? Math.max(0, (prev.so_danh_gia || 1) - 1),
          danh_gia_danh_sach: (prev.danh_gia_danh_sach || []).filter((r) => r.id !== reviewId),
        }));
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa đánh giá.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Đang tải thông tin chi tiết địa điểm...</p>
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Không tìm thấy địa điểm</h2>
          <p className="text-sm text-slate-600">{error || 'Địa điểm không tồn tại hoặc đã bị gỡ bỏ.'}</p>
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Khám phá</span>
          </Link>
        </div>
      </div>
    );
  }

  // Gallery images
  const allImages = [
    destination.anh_dai_dien,
    ...(destination.hinh_anhs || []).map((img) => img.url_hinh_anh),
  ].filter(Boolean);

  const formattedPrice = destination.gia_tham_quan > 0
    ? `${Number(destination.gia_tham_quan).toLocaleString('vi-VN')} đ`
    : 'Miễn phí';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-500 overflow-x-auto">
          <Link to="/" className="hover:text-teal-600 transition shrink-0">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <Link to="/destinations" className="hover:text-teal-600 transition shrink-0">
            Khám phá địa điểm
          </Link>
          {destination.tinh_thanh?.ten_tinh_thanh && (
            <>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <Link 
                to={`/destinations?tinh_thanh_id=${destination.tinh_thanh_id}`} 
                className="hover:text-teal-600 transition shrink-0"
              >
                {destination.tinh_thanh.ten_tinh_thanh}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="font-semibold text-slate-900 truncate">
            {destination.ten_dia_diem}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {destination.noi_bat && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                  <Sparkles className="w-3 h-3" />
                  Nổi bật
                </span>
              )}
              {destination.danh_mucs?.map((cat) => (
                <span
                  key={cat.id}
                  className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100"
                >
                  {cat.ten_danh_muc}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {destination.ten_dia_diem}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>{destination.dia_chi || destination.tinh_thanh?.ten_tinh_thanh}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{destination.diem_danh_gia_tb || 4.8}</span>
                <span className="text-slate-400 font-normal">
                  ({destination.so_danh_gia || 0} đánh giá)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Share / Favorite) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isFavorite ? 'Đã lưu' : 'Lưu yêu thích'}</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: destination.ten_dia_diem, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã sao chép liên kết vào bộ nhớ tạm!');
                }
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition text-xs font-semibold flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Large Image */}
          <div className="lg:col-span-2 relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 shadow-md">
            <img
              src={allImages[activeImageIndex] || destination.anh_dai_dien}
              alt={destination.ten_dia_diem}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-sm font-bold shadow-xs">
                Vé tham quan: {formattedPrice}
              </span>
            </div>
          </div>

          {/* Thumbnail Strip / Sidebar info */}
          <div className="flex flex-col gap-4">
            {/* Action Card: Lên lịch trình AI */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-lg space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/30 text-teal-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Trợ lý lập lịch AI TripMate</span>
              </div>
              <h3 className="text-lg font-bold">Thêm địa điểm này vào chuyến đi của bạn</h3>
              <p className="text-xs text-teal-100 leading-relaxed">
                Tự động tối ưu hóa thứ tự ghé thăm, ước tính thời gian và gợi ý phương tiện di chuyển phù hợp nhất.
              </p>
              <Link
                to={`/trips/ai-create?destination_id=${destination.id}&destination_name=${encodeURIComponent(destination.ten_dia_diem)}`}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-sm text-center shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Lên lịch trình với AI</span>
              </Link>
            </div>

            {/* Thumbnails preview list */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {allImages.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-4/3 rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                      activeImageIndex === idx ? 'border-teal-500 shadow-md scale-95' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview / Description */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Giới thiệu & Tổng quan</h2>
              {destination.mo_ta_ngan && (
                <p className="text-sm font-semibold text-teal-900 bg-teal-50/60 p-4 rounded-xl border border-teal-100/60 leading-relaxed">
                  {destination.mo_ta_ngan}
                </p>
              )}
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3">
                {destination.mo_ta_chi_tiet || 'Hiện tại chưa có mô tả chi tiết mở rộng cho địa điểm này.'}
              </div>
            </div>

            {/* Community Reviews Section (PB05 & PB10 - UI_16) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Đánh giá từ cộng đồng</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Trải nghiệm thực tế từ các du khách đã ghé thăm ({destination.so_danh_gia || 0} lượt đánh giá)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-lg font-bold text-amber-900">
                      {destination.diem_danh_gia_tb || 4.8}
                    </span>
                    <span className="text-xs text-amber-700">/ 5.0</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenReviewModal}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-teal-600/20 transition flex items-center gap-1.5"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Viết đánh giá</span>
                  </button>
                </div>
              </div>

              {reviewSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reviewSuccessMsg}</span>
                </div>
              )}

              {/* Reviews List */}
              {destination.danh_gia_danh_sach && destination.danh_gia_danh_sach.length > 0 ? (
                <div className="space-y-4 divide-y divide-slate-100">
                  {destination.danh_gia_danh_sach.map((review) => {
                    const reviewer = review.nguoi_danh_gia || review.tai_khoan;
                    const canDelete = user && (user.id?.toString() === reviewer?.id?.toString() || user.vai_tro === 'admin');

                    return (
                      <div key={review.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={reviewer?.anh_dai_dien || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt={reviewer?.ho_ten || 'User'}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {reviewer?.ho_ten || 'Du khách TripMate'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(review.created_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.so_sao ? 'fill-current' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(review.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                title="Xóa đánh giá"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-12">
                          {review.noi_dung}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Chưa có nhận xét nào cho địa điểm này. Hãy là người đầu tiên chia sẻ trải nghiệm!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Specifications */}
          <div className="space-y-6">
            
            {/* Quick Specs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Thông tin tham quan</h3>
              
              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Giờ hoạt động:</p>
                    <p className="text-slate-600">
                      {destination.gio_mo_cua && destination.gio_dong_cua
                        ? `${destination.gio_mo_cua} - ${destination.gio_dong_cua}`
                        : 'Mở cửa cả ngày'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ticket className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Giá vé tham khảo:</p>
                    <p className="text-teal-700 font-bold">{formattedPrice}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Địa chỉ cụ thể:</p>
                    <p className="text-slate-600">{destination.dia_chi || 'Đang cập nhật'}</p>
                  </div>
                </div>

                {destination.vi_do && destination.kinh_do && (
                  <div className="flex items-start gap-3">
                    <Compass className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Tọa độ GPS:</p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        {destination.vi_do}, {destination.kinh_do}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${destination.ten_dia_diem} ${destination.dia_chi || ''}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <MapIcon className="w-4 h-4 text-teal-600" />
                  <span>Xem trên Google Maps</span>
                </a>
              </div>
            </div>

            {/* Nearby Destinations */}
            {nearbyDestinations.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Địa điểm lân cận cùng tỉnh</h3>
                <div className="space-y-3">
                  {nearbyDestinations.map((near) => (
                    <Link
                      key={near.id}
                      to={`/destinations/${near.id}`}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition group"
                    >
                      <img
                        src={near.anh_dai_dien}
                        alt={near.ten_dia_diem}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-teal-600 transition">
                          {near.ten_dia_diem}
                        </p>
                        <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{near.diem_danh_gia_tb || 4.8}</span>
                          <span className="text-slate-400">· {near.gia_tham_quan > 0 ? `${Number(near.gia_tham_quan).toLocaleString('vi-VN')} đ` : 'Miễn phí'}</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL ĐÁNH GIÁ ĐỊA ĐIỂM 1–5 SAO (PB10 - UI_16) */}
      {/* ======================================================== */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đánh giá địa điểm</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-sm">
                  {destination.ten_dia_diem}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-5">
              {reviewError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {reviewError}
                </div>
              )}

              {/* Chọn 1-5 sao */}
              <div className="text-center py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Mức độ hài lòng của bạn
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverStars || reviewStars);
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverStars(star)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => setReviewStars(star)}
                        className="p-1.5 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors ${
                            active
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-amber-600 mt-2">
                  {
                    {
                      1: '1 sao — Rất không hài lòng',
                      2: '2 sao — Chưa như mong đợi',
                      3: '3 sao — Bình thường',
                      4: '4 sao — Khá hài lòng',
                      5: '5 sao — Trải nghiệm tuyệt vời!',
                    }[hoverStars || reviewStars]
                  }
                </p>
              </div>

              {/* Nội dung nhận xét */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nhận xét trải nghiệm <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Chia sẻ cảm nhận về cảnh quan, dịch vụ, thời điểm thích hợp để ghé thăm..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

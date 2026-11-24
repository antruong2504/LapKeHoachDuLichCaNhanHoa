import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  Compass, 
  Calendar, 
  CloudSun, 
  ArrowRight, 
  Star,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import destinationService from '../services/destinationService';
import categoryService from '../services/categoryService';
import DestinationCard from '../components/DestinationCard';
import DestinationSkeleton from '../components/DestinationSkeleton';
import SearchSuggestions from '../components/SearchSuggestions';
import { normalizeVietnamese } from '../utils/vietnamese';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [destRes, catRes, provRes] = await Promise.all([
          destinationService.getDestinations({ noi_bat: true, limit: 4 }),
          categoryService.getTree(),
          destinationService.getProvinces(),
        ]);
        if (destRes.success && destRes.data && destRes.data.length > 0) {
          setFeaturedDestinations(destRes.data);
        }
        if (catRes.success && catRes.data) {
          setCategoryTree(catRes.data);
        }
        if (provRes.success && provRes.data) {
          setProvinces(provRes.data);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ:', err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    loadHomeData();
  }, []);

  const searchSuggestions = searchTerm.trim()
    ? [
        ...featuredDestinations
          .filter((d) =>
            normalizeVietnamese(d.ten_dia_diem).includes(normalizeVietnamese(searchTerm))
          )
          .slice(0, 3)
          .map((d) => ({ id: d.id, label: d.ten_dia_diem, type: 'destination' })),
        ...categoryTree
          .flatMap((g) => g.danh_mucs || [])
          .filter((c) =>
            normalizeVietnamese(c.ten_danh_muc).includes(normalizeVietnamese(searchTerm))
          )
          .slice(0, 3)
          .map((c) => ({ id: c.id, label: c.ten_danh_muc, type: 'category' })),
        ...provinces
          .filter((p) =>
            normalizeVietnamese(p.ten_tinh_thanh).includes(normalizeVietnamese(searchTerm))
          )
          .slice(0, 3)
          .map((p) => ({ id: p.id, label: p.ten_tinh_thanh, type: 'province' })),
      ].slice(0, 7)
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/destinations');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section với phong cách TripMate Teal */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700 text-white pt-20 pb-28 px-4 text-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trợ lý lập kế hoạch du lịch thông minh cùng AI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Lập Kế Hoạch Du Lịch <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-teal-200 to-white">
              Cá Nhân Hóa Bằng AI
            </span>
          </h1>

          <p className="text-lg text-teal-100/90 max-w-2xl mx-auto leading-relaxed">
            Khám phá trọn vẹn vẻ đẹp Việt Nam. TripMate tự động tối ưu hóa lộ trình di chuyển, dự báo thời tiết 5 ngày và gợi ý lịch trình thông minh bám sát sở thích & ngân sách của bạn.
          </p>

          {/* Thanh tìm kiếm nhanh */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-4 relative">
            <div className="flex items-center bg-white rounded-2xl shadow-xl p-2 border border-slate-200 text-slate-800">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                aria-label="Tìm kiếm địa điểm du lịch"
                placeholder="Tìm kiếm địa điểm..."
                value={searchTerm}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full px-3 py-2 text-sm focus:outline-none placeholder-slate-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
              >
                Tìm kiếm
              </button>
            </div>
            <SearchSuggestions
              items={searchSuggestions}
              visible={showSuggestions}
              onSelect={(item) => {
                setShowSuggestions(false);
                if (item.type === 'destination') {
                  navigate(`/destinations/${item.id}`);
                } else if (item.type === 'category') {
                  navigate(`/destinations?danh_muc_ids=${item.id}`);
                } else {
                  navigate(`/destinations?tinh_thanh_id=${item.id}`);
                }
              }}
            />
          </form>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-wrap gap-4 justify-center">
            <Link
              to="/trips/ai-create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span>Tạo lịch trình AI ngay</span>
            </Link>

            <Link
              to="/destinations"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-sm transition-all"
            >
              <Compass className="w-5 h-5 text-teal-300" />
              <span>Khám phá địa điểm</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Tính năng cốt lõi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Tính năng vượt trội của TripMate</h2>
          <p className="text-sm text-slate-500 mt-2">Được thiết kế tỉ mỉ để bạn không còn phải đau đầu lên kế hoạch trước mỗi chuyến đi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Lập lịch trình bằng Gemini AI</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nhập 6 thông tin (ngày, ngân sách, số người, sở thích), AI tự động tạo lịch trình từng ngày với các địa điểm có thật và cảnh báo vượt ngân sách.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Tối ưu lộ trình di chuyển</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tự động sắp xếp thứ tự tham quan hợp lý, hỗ trợ kéo thả đổi chặng linh hoạt và ước tính chính xác quãng đường, thời gian di chuyển.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CloudSun className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Dự báo thời tiết 5 ngày</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cập nhật nhiệt độ, độ ẩm và tình trạng mưa/nắng theo từng khung giờ để bạn chủ động chuẩn bị trang phục phù hợp.
            </p>
          </div>
        </div>
      </section>

      {/* Điểm đến nổi bật (PB05, UI_03, UI_08) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Điểm đến nổi bật</h2>
            <p className="text-sm text-slate-500 mt-1">Được đề xuất nhiều nhất từ cộng đồng du lịch TripMate</p>
          </div>
          <Link
            to="/destinations"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            <span>Xem tất cả địa điểm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingFeatured ? (
          <DestinationSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((item, idx) => (
              <DestinationCard key={item.id} destination={item} priority={idx < 2} />
            ))}
          </div>
        )}
      </section>

      {/* Duyệt theo Danh mục Du lịch (PB05, UI_03) */}
      {categoryTree.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Khám phá theo danh mục</h2>
            <p className="text-sm text-slate-500 mt-1">Lựa chọn trải nghiệm du lịch theo sở thích của riêng bạn</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categoryTree.map((group) => (
              <Link
                key={group.id}
                to={`/destinations?nhom_danh_muc_id=${group.id}`}
                className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-400 transition-all flex flex-col items-center text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 group-hover:bg-teal-600 group-hover:text-white text-teal-700 flex items-center justify-center transition-colors">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                  {group.ten_nhom}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {group.danh_mucs?.length || 0} danh mục con
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

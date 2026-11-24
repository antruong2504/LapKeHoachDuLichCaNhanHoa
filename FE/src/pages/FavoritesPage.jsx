import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Search, 
  MapPin, 
  Compass, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Trash2
} from 'lucide-react';
import favoriteService from '../services/favoriteService';
import DestinationCard from '../components/DestinationCard';
import DestinationSkeleton from '../components/DestinationSkeleton';
import { useAuth } from '../context/AuthContext';

export default function FavoritesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await favoriteService.getMyFavorites({
        page: currentPage,
        limit: 10,
      });
      if (res.success && res.data) {
        setFavorites(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách yêu thích:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, navigate, fetchFavorites]);

  const handleToggleFavorite = async (destinationId) => {
    try {
      await favoriteService.removeFavorite(destinationId);
      // Cập nhật state trực tiếp
      setFavorites((prev) => prev.filter((item) => item.destination.id !== destinationId.toString()));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      console.error('Lỗi khi bỏ thích địa điểm:', err);
    }
  };

  // Filter client-side by search keyword
  const filteredFavorites = favorites.filter((item) => {
    if (!searchTerm.trim()) return true;
    const kw = searchTerm.toLowerCase();
    const dest = item.destination;
    return (
      dest?.ten_dia_diem?.toLowerCase().includes(kw) ||
      dest?.tinh_thanh?.ten_tinh_thanh?.toLowerCase().includes(kw) ||
      dest?.dia_chi?.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-teal-200 text-xs font-medium">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5 text-teal-300" />
            <span className="text-white font-semibold">Địa điểm yêu thích</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <Heart className="w-5 h-5 fill-rose-400 text-rose-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Danh Sách Địa Điểm Yêu Thích
                </h1>
              </div>
              <p className="mt-2 text-sm text-teal-100">
                Lưu giữ những điểm đến bạn muốn khám phá và dễ dàng thêm vào lịch trình AI.
              </p>
            </div>

            {pagination.total > 0 && (
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white shrink-0">
                Đã lưu <span className="font-bold text-amber-300 text-base">{pagination.total}</span> địa điểm
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Search & Action Bar */}
        {pagination.total > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Lọc trong danh sách yêu thích..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
            >
              <span>Khám phá thêm địa điểm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Content Grid / Loading / Empty */}
        {loading ? (
          <DestinationSkeleton count={6} />
        ) : filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-5 max-w-lg mx-auto my-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <Heart className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900">
                {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có địa điểm yêu thích nào'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'Thử thay đổi từ khóa lọc hoặc xóa bộ lọc tìm kiếm.'
                  : 'Hãy bấm biểu tượng trái tim trên các thẻ địa điểm để lưu lại vào danh sách yêu thích của bạn!'}
              </p>
            </div>
            <div>
              <Link
                to="/destinations"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Khám phá địa điểm ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFavorites.map((item) => (
              <DestinationCard
                key={item.destination.id}
                destination={item.destination}
                isFavorite={true}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="pt-6 flex items-center justify-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                window.scrollTo({ top: 150, behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>

            {Array.from({ length: pagination.totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  onClick={() => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 150, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                    p === currentPage
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={currentPage >= pagination.totalPages}
              onClick={() => {
                setCurrentPage((p) => p + 1);
                window.scrollTo({ top: 150, behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

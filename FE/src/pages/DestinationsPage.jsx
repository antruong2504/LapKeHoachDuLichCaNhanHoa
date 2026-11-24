import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Sparkles,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import DestinationCard from '../components/DestinationCard';
import DestinationSkeleton from '../components/DestinationSkeleton';
import SearchSuggestions from '../components/SearchSuggestions';
import { normalizeVietnamese } from '../utils/vietnamese';
import destinationService from '../services/destinationService';
import categoryService from '../services/categoryService';
import favoriteService from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';

export default function DestinationsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Filter State from URL
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || searchParams.get('search') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('tinh_thanh_id') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('danh_muc_ids') ? searchParams.get('danh_muc_ids').split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Data state
  const [destinations, setDestinations] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Load provinces and categories on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, catRes] = await Promise.all([
          destinationService.getProvinces(),
          categoryService.getTree(),
        ]);
        if (provRes.success) setProvinces(provRes.data || []);
        if (catRes.success) setCategoryTree(catRes.data || []);

        // Tải danh sách yêu thích nếu đã đăng nhập
        if (user) {
          const favRes = await favoriteService.getMyFavoriteIds();
          if (favRes.success && favRes.data) {
            setFavoriteIds(favRes.data);
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh mục/tỉnh thành/yêu thích:', err);
      }
    };
    fetchMetadata();
  }, [user]);

  const latestRequestIdRef = useRef(0);

  // Fetch Destinations (with stale-response protection)
  const fetchDestinations = useCallback(async () => {
    const reqId = ++latestRequestIdRef.current;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (keyword.trim()) params.search = keyword.trim();
      if (selectedProvince) params.tinh_thanh_id = selectedProvince;
      if (selectedCategories.length > 0) params.danh_muc_ids = selectedCategories.join(',');
      if (sortBy) params.sort = sortBy;

      const res = await destinationService.getDestinations(params);
      if (reqId !== latestRequestIdRef.current) return;
      if (res.success) {
        setDestinations(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      if (reqId === latestRequestIdRef.current) {
        console.error('Lỗi tải danh sách địa điểm:', err);
      }
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [keyword, selectedProvince, selectedCategories, sortBy, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDestinations();
    }, 450);
    return () => clearTimeout(timer);
  }, [fetchDestinations]);

  // Sync state to URL params
  const updateURLParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        updated.set(k, v);
      } else {
        updated.delete(k);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURLParams({
      search: keyword.trim(),
      keyword: keyword.trim(),
      page: '1',
    });
  };

  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setCurrentPage(1);
    updateURLParams({ tinh_thanh_id: provinceId, page: '1' });
  };

  const handleCategoryToggle = (categoryId) => {
    const strId = categoryId.toString();
    let updated;
    if (selectedCategories.includes(strId)) {
      updated = selectedCategories.filter((id) => id !== strId);
    } else {
      updated = [...selectedCategories, strId];
    }
    setSelectedCategories(updated);
    setCurrentPage(1);
    updateURLParams({ danh_muc_ids: updated.join(','), page: '1' });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortBy(val);
    setCurrentPage(1);
    updateURLParams({ sort: val, page: '1' });
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedProvince('');
    setSelectedCategories([]);
    setSortBy('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    keyword || selectedProvince || selectedCategories.length > 0 || sortBy
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-teal-200 text-xs font-medium mb-3">
            <span 
              onClick={() => navigate('/')} 
              className="hover:underline cursor-pointer"
            >
              Trang chủ
            </span>
            <span>/</span>
            <span className="text-white font-semibold">Khám phá địa điểm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Khám Phá Địa Điểm Du Lịch Việt Nam
          </h1>
          <p className="mt-2 text-teal-100 text-sm max-w-2xl">
            Khám phá điểm đến theo tỉnh thành, văn hóa, ẩm thực, giải trí và danh lam thắng cảnh.
          </p>

          {/* Quick Search Bar inside Banner */}
          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-2xl flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Tìm kiếm địa điểm du lịch"
                placeholder="Tìm điểm đến, tỉnh thành, danh mục..."
                value={keyword}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                  setShowSuggestions(true);
                }}
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-slate-400"
              />
              <SearchSuggestions
                items={
                  keyword.trim()
                    ? [
                        ...destinations
                          .filter((d) =>
                            normalizeVietnamese(d.ten_dia_diem).includes(normalizeVietnamese(keyword))
                          )
                          .slice(0, 3)
                          .map((d) => ({ id: d.id, label: d.ten_dia_diem, type: 'destination' })),
                        ...categoryTree
                          .flatMap((g) => g.danh_mucs || [])
                          .filter((c) =>
                            normalizeVietnamese(c.ten_danh_muc).includes(normalizeVietnamese(keyword))
                          )
                          .slice(0, 3)
                          .map((c) => ({ id: c.id, label: c.ten_danh_muc, type: 'category' })),
                        ...provinces
                          .filter((p) =>
                            normalizeVietnamese(p.ten_tinh_thanh).includes(normalizeVietnamese(keyword))
                          )
                          .slice(0, 3)
                          .map((p) => ({ id: p.id, label: p.ten_tinh_thanh, type: 'province' })),
                      ].slice(0, 7)
                    : []
                }
                visible={showSuggestions}
                onSelect={(item) => {
                  setShowSuggestions(false);
                  if (item.type === 'destination') {
                    navigate(`/destinations/${item.id}`);
                  } else if (item.type === 'category') {
                    const catIdStr = item.id.toString();
                    const nextCats = selectedCategories.includes(catIdStr)
                      ? selectedCategories
                      : [...selectedCategories, catIdStr];
                    setSelectedCategories(nextCats);
                    setKeyword('');
                    setCurrentPage(1);
                    updateURLParams({
                      danh_muc_ids: nextCats.join(','),
                      search: '',
                      keyword: '',
                      page: '1',
                    });
                  } else {
                    setSelectedProvince(item.id.toString());
                    setKeyword('');
                    setCurrentPage(1);
                    updateURLParams({
                      tinh_thanh_id: item.id.toString(),
                      search: '',
                      keyword: '',
                      page: '1',
                    });
                  }
                }}
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('');
                    updateURLParams({ search: '', keyword: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Tìm kiếm</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filter Sidebar (Desktop) */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                  <span>Bộ lọc tìm kiếm</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>

              {/* Tỉnh thành */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                >
                  <option value="">Tất cả tỉnh thành</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ten_tinh_thanh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Danh mục du lịch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Danh mục địa điểm
                </label>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {categoryTree.map((group) => (
                    <div key={group.id} className="space-y-1.5">
                      <p className="text-xs font-semibold text-teal-800 bg-teal-50/70 px-2 py-1 rounded-md">
                        {group.ten_nhom}
                      </p>
                      <div className="space-y-1 pl-1">
                        {group.danh_mucs?.map((cat) => {
                          const isChecked = selectedCategories.includes(cat.id.toString());
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer py-1"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCategoryToggle(cat.id)}
                                className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                              />
                              <span className={isChecked ? 'font-semibold text-teal-700' : ''}>
                                {cat.ten_danh_muc}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <main className="flex-1 space-y-6">
            {/* Control Bar: Result count & Sort dropdown */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Hiển thị <span className="font-bold text-slate-900">{destinations.length}</span> trên tổng số <span className="font-bold text-slate-900">{pagination.total}</span> địa điểm
                {keyword && (
                  <span className="ml-1 text-teal-700 font-medium">
                    cho từ khóa &quot;{keyword}&quot;
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="sort-select" className="text-xs font-semibold text-slate-500">
                  Sắp xếp:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Mặc định (Mới nhất)</option>
                  <option value="name_asc">Tên (A → Z)</option>
                  <option value="name_desc">Tên (Z → A)</option>
                  <option value="price_asc">Giá (Thấp → Cao)</option>
                  <option value="price_desc">Giá (Cao → Thấp)</option>
                </select>
              </div>
            </div>

            {/* Destination Grid / Skeleton / Empty state */}
            {loading ? (
              <DestinationSkeleton count={8} />
            ) : destinations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Không tìm thấy địa điểm nào phù hợp
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc đang chọn.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Xóa bộ lọc & Tải lại</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {destinations.map((dest, idx) => (
                  <DestinationCard
                    key={dest.id}
                    destination={dest}
                    isFavorite={favoriteIds.includes(dest.id.toString())}
                    priority={idx < 3}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls (PB05: 10 items/page) */}
            {!loading && pagination.totalPages > 1 && (
              <div className="pt-6 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const p = currentPage - 1;
                    setCurrentPage(p);
                    updateURLParams({ page: p.toString() });
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trước</span>
                </button>

                {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPage(p);
                        updateURLParams({ page: p.toString() });
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
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
                    const p = currentPage + 1;
                    setCurrentPage(p);
                    updateURLParams({ page: p.toString() });
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

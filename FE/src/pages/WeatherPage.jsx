import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  Cloud, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Thermometer, 
  Compass, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Search
} from 'lucide-react';
import weatherService from '../services/weatherService';
import SearchSuggestions from '../components/SearchSuggestions';
import { normalizeVietnamese, VIETNAM_WEATHER_LOCATIONS } from '../utils/vietnamese';

export default function WeatherPage() {
  const [selectedCity, setSelectedCity] = useState('Đà Nẵng');
  const [cityInput, setCityInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Danh sách các điểm đến du lịch phổ biến của Việt Nam
  const popularProvinces = [
    { name: 'Hà Nội' },
    { name: 'Sa Pa' },
    { name: 'Đà Nẵng' },
    { name: 'Quảng Nam' },
    { name: 'Thừa Thiên Huế' },
    { name: 'Khánh Hòa' },
    { name: 'Lâm Đồng' },
    { name: 'Hồ Chí Minh' },
    { name: 'Phú Quốc' },
  ];

  const handleCitySearch = (e) => {
    e.preventDefault();
    const trimmed = cityInput.trim();
    if (trimmed) {
      setSelectedCity(trimmed);
      setShowSuggestions(false);
    }
  };

  const citySuggestions = cityInput.trim()
    ? VIETNAM_WEATHER_LOCATIONS.filter((name) =>
        normalizeVietnamese(name).includes(normalizeVietnamese(cityInput))
      ).slice(0, 6)
    : [];

  const fetchWeather = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const res = await weatherService.getWeather({ city });
      if (res.success && res.data) {
        setWeatherData(res.data);
        setSelectedDayIndex(0);
      } else {
        setError('Không thể lấy thông tin dự báo thời tiết.');
      }
    } catch (err) {
      setError(err.message || 'Mất kết nối máy chủ dữ liệu khí tượng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  // Gợi ý trang phục & hoạt động dựa trên thời tiết thực tế (nhiệt độ, mô tả, gió, độ ẩm)
  const getTravelAdvice = (current = {}) => {
    const temp = Number(current.nhiet_do ?? 28);
    const wind = Number(current.gio_kmh ?? 10);
    const humidity = Number(current.do_am ?? 70);
    const text = (current.mo_ta || '').toLowerCase();

    if (text.includes('dông') || text.includes('bão')) {
      return {
        badge: 'Cảnh báo dông',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        advice: 'Có khả năng kèm sấm sét và gió giật. Hạn chế đi biển, leo núi và ưu tiên các điểm tham quan trong nhà.',
        tags: ['Áo khoác chống nước', 'Giày chống trượt', 'Tham quan trong nhà'],
      };
    }

    if (text.includes('mưa phùn') || text.includes('mưa nhẹ')) {
      return {
        badge: temp <= 18 ? 'Mưa phùn & Lạnh' : 'Mưa phùn nhẹ',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        advice: temp <= 18
          ? 'Trời se lạnh kèm mưa phùn nhẹ, nên mặc áo khoác cản gió giữ ấm và mang theo ô gấp gọn.'
          : 'Mưa lất phất nhẹ, mang ô gấp gọn hoặc áo khoác mỏng chống thấm để thoải mái dạo phố, thưởng thức ẩm thực.',
        tags: [temp <= 18 ? 'Áo khoác giữ ấm' : 'Áo khoác mỏng', 'Ô gấp gọn', 'Dạo phố & Ẩm thực'],
      };
    }

    if (text.includes('mưa')) {
      return {
        badge: 'Trời có mưa',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        advice: 'Nên chuẩn bị áo mưa tiện lợi, ô (dù) và giày dép nhanh khô. Ưu tiên bảo tàng, quán cà phê hoặc trung tâm thương mại.',
        tags: ['Áo mưa / Ô', 'Giày chống trượt', 'Bảo tàng & Cà phê'],
      };
    }

    if (text.includes('sương mù')) {
      return {
        badge: 'Có sương mù',
        badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
        advice: 'Sương mù làm giảm tầm nhìn vào sáng sớm và chiều tối, nên mặc áo khoác nhẹ và cẩn trọng nếu di chuyển đường đèo.',
        tags: ['Áo khoác dài tay', 'Giày thể thao', 'Săn mây / Ngắm cảnh'],
      };
    }

    if (temp < 16) {
      return {
        badge: 'Trời rét',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        advice: 'Nhiệt độ xuống thấp, hãy mặc nhiều lớp áo giữ nhiệt, mang khăn choàng và găng tay khi ra ngoài buổi tối.',
        tags: ['Áo ấm nhiều lớp', 'Khăn choàng', 'Thưởng thức đồ nóng'],
      };
    }

    if (temp <= 22) {
      return {
        badge: 'Se lạnh dễ chịu',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        advice: 'Không khí mát mẻ, se lạnh về đêm — rất hợp diện áo len mỏng, cardigan hoặc hoodie nhẹ khi dạo phố.',
        tags: ['Áo len mỏng / Cardigan', 'Giày đi bộ', 'Dạo phố & Check-in'],
      };
    }

    if (temp >= 33) {
      return {
        badge: 'Nắng nóng',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        advice: 'Nắng gắt vào giữa trưa, ưu tiên quần áo cotton thoáng mát, thoa kem chống nắng, đội mũ rộng vành và uống đủ nước.',
        tags: ['Trang phục thoáng mát', 'Kem chống nắng & Mũ', 'Bổ sung nước'],
      };
    }

    if (wind >= 25) {
      return {
        badge: 'Gió mạnh',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        advice: 'Gió thổi khá mạnh, nên mang áo khoác chắn gió và cân nhắc kỹ nếu tham gia các tour tàu thuyền hoặc cano.',
        tags: ['Áo khoác chắn gió', 'Kính bảo vệ mắt', 'Hạn chế tour biển'],
      };
    }

    if (text.includes('nhiều mây') || humidity >= 85) {
      return {
        badge: 'Nhiều mây, mát mẻ',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        advice: 'Trời râm mát, ít nắng gắt — thuận lợi cho các hoạt động đi bộ tham quan di tích và khám phá ngoài trời cả ngày.',
        tags: ['Trang phục thoải mái', 'Nước uống', 'Tham quan ngoài trời'],
      };
    }

    return {
      badge: 'Thời tiết lý tưởng',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      advice: 'Thời tiết nắng nhẹ và khô ráo, cực kỳ thuận lợi cho việc chụp ảnh, tắm biển và tham gia các hoạt động ngoài trời.',
      tags: ['Trang phục năng động', 'Kính râm', 'Chụp ảnh & Tắm biển'],
    };
  };

  const activeDay =
    selectedDayIndex === 0
      ? weatherData?.hien_tai
      : weatherData?.du_bao_5_ngay?.[selectedDayIndex] || weatherData?.hien_tai;

  const advice = activeDay ? getTravelAdvice(activeDay) : null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-semibold">
            <CloudSun className="w-4 h-4 text-amber-300" />
            <span>Dự báo thời tiết du lịch</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Dự Báo Thời Tiết Du Lịch
          </h1>
          <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
            Chủ động theo dõi nhiệt độ, độ ẩm, sức gió và khả năng mưa tại các địa danh nổi tiếng trước khi khởi hành chuyến đi.
          </p>

          {/* Thanh tìm kiếm tỉnh thành / khu vực bất kỳ */}
          <form onSubmit={handleCitySearch} className="pt-2 max-w-xl flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Tìm kiếm thời tiết theo tỉnh thành hoặc địa danh"
                placeholder="Nhập tên tỉnh thành hoặc địa danh..."
                value={cityInput}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-white/20 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <SearchSuggestions
                items={citySuggestions}
                visible={showSuggestions}
                onSelect={(cityName) => {
                  setSelectedCity(cityName);
                  setCityInput(cityName);
                  setShowSuggestions(false);
                }}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm shrink-0 cursor-pointer"
            >
              Xem thời tiết
            </button>
          </form>

          {/* Thanh chọn nhanh tỉnh thành du lịch */}
          <div className="pt-1 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-teal-200">Điểm đến phổ biến:</span>
            {popularProvinces.map((p) => {
              const active = selectedCity === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setSelectedCity(p.name);
                    setCityInput('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-amber-300" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Loading State Skeleton */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-3xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-44 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4 max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không thể tải dữ liệu thời tiết</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => fetchWeather(selectedCity)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại ngay</span>
            </button>
          </div>
        ) : weatherData ? (
          <>
            {/* THẺ THỜI TIẾT HIỆN TẠI (UI_06) */}
            <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Cột trái: Nhiệt độ & Trạng thái */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>{weatherData.tinh_thanh}</span>
                    </span>
                    <span className="text-xs text-teal-200">
                      {selectedDayIndex === 0
                        ? 'Hôm nay'
                        : selectedDayIndex === 1
                        ? 'Ngày mai'
                        : `Ngày ${selectedDayIndex + 1}`}
                      {activeDay?.ngay ? ` · ${activeDay.ngay}` : ''}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-4">
                    <span className="text-6xl sm:text-7xl font-black tracking-tight text-white">
                      {activeDay?.nhiet_do ?? 28}°
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-amber-300 capitalize">
                      {activeDay?.mo_ta || 'Trời nắng'}
                    </span>
                  </div>

                  <p className="text-xs text-teal-100 flex items-center gap-3">
                    <span>Thấp nhất: {activeDay?.nhiet_do_min ?? activeDay?.nhiet_do ?? 25}°C</span>
                    <span>·</span>
                    <span>Cao nhất: {activeDay?.nhiet_do_max ?? activeDay?.nhiet_do ?? 32}°C</span>
                  </p>
                </div>

                {/* Cột phải: 4 thông số khí tượng */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-200 text-xs">
                      <Droplets className="w-4 h-4 text-cyan-300" />
                      <span>Độ ẩm</span>
                    </div>
                    <p className="text-lg font-bold text-white">{activeDay?.do_am ?? 70}%</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-200 text-xs">
                      <Wind className="w-4 h-4 text-emerald-300" />
                      <span>Tốc độ gió</span>
                    </div>
                    <p className="text-lg font-bold text-white">{activeDay?.gio_kmh ?? 12} km/h</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-200 text-xs">
                      <Thermometer className="w-4 h-4 text-rose-300" />
                      <span>Cảm giác như</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {activeDay?.cam_giac_nhu ?? activeDay?.nhiet_do ?? 28}°C
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-200 text-xs">
                      <Compass className="w-4 h-4 text-amber-300" />
                      <span>Tầm nhìn</span>
                    </div>
                    <p className="text-lg font-bold text-white">&gt; 10 km</p>
                  </div>
                </div>
              </div>

              {/* Gợi ý trang phục du lịch AI */}
              {advice && (
                <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <span>Gợi ý trang phục du lịch:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${advice.badgeColor}`}>
                          {advice.badge}
                        </span>
                      </p>
                      <p className="text-xs text-teal-100 mt-0.5 leading-relaxed">
                        {advice.advice}
                      </p>
                      {advice.tags && advice.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {advice.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-medium text-white"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchWeather(selectedCity)}
                    className="self-end sm:self-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1.5 shrink-0"
                    title="Cập nhật lại thời tiết"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                </div>
              )}
            </div>

            {/* DỰ BÁO THỜI TIẾT THEO SỐ NGÀY API TRẢ VỀ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Dự báo {weatherData.du_bao_5_ngay?.length || 0} ngày tại {weatherData.tinh_thanh}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bấm vào từng ngày để xem chi tiết thời tiết & gợi ý trang phục
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fit,minmax(145px,1fr))] gap-3.5">
                {weatherData.du_bao_5_ngay?.map((day, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`p-4 rounded-2xl border transition text-center space-y-2.5 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/50 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                        : 'bg-white border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isSelected ? 'bg-teal-600 text-white' : 'text-teal-700 bg-teal-50'
                        }`}
                      >
                        {idx === 0 ? 'Hôm nay' : idx === 1 ? 'Ngày mai' : `Ngày ${idx + 1}`}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-2 font-mono">
                        {day.ngay}
                      </p>
                    </div>

                    <div className="my-1">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center">
                        {day.icon?.startsWith('09') || day.icon?.startsWith('10') ? (
                          <CloudRain className="w-7 h-7 text-blue-500" />
                        ) : day.icon?.startsWith('11') ? (
                          <CloudRain className="w-7 h-7 text-indigo-600" />
                        ) : day.icon?.startsWith('03') || day.icon?.startsWith('04') || day.icon?.startsWith('50') ? (
                          <Cloud className="w-7 h-7 text-slate-500" />
                        ) : day.icon?.startsWith('02') ? (
                          <CloudSun className="w-7 h-7 text-amber-500" />
                        ) : (
                          <Sun className="w-7 h-7 text-amber-500" />
                        )}
                      </div>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        {day.nhiet_do}°<span className="text-xs font-normal text-slate-500">C</span>
                      </p>
                      <p className="text-xs font-medium text-slate-600 capitalize line-clamp-1">
                        {day.mo_ta}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-600" />
                        <span>{day.do_am}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-slate-400" />
                        <span>{day.gio_kmh || 10} km/h</span>
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

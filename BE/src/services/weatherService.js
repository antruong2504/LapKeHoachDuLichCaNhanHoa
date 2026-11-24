import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Bộ đệm cache 30 phút để tối ưu hiệu năng
const weatherCache = new Map();
const geoCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

export const geocodeCityName = async (cityName) => {
  if (!cityName) return null;
  const key = cityName.trim().toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key);

  try {
    const res = await axios.get(OPEN_METEO_GEO_URL, {
      params: { name: cityName.trim(), count: 1, language: 'vi', format: 'json' },
      timeout: 5000,
    });
    const first = res.data?.results?.[0];
    if (first) {
      const coords = {
        lat: first.latitude,
        lon: first.longitude,
        resolvedName: first.name,
      };
      geoCache.set(key, coords);
      return coords;
    }
  } catch (err) {
    console.warn('Geocoding fallback:', err.message);
  }
  return null;
};

const mapWmoCode = (code) => {
  if (code === 0) return { mo_ta: 'Trời quang đãng', icon: '01d' };
  if (code === 1 || code === 2) return { mo_ta: 'Nắng nhẹ, ít mây', icon: '02d' };
  if (code === 3) return { mo_ta: 'Nhiều mây', icon: '04d' };
  if (code === 45 || code === 48) return { mo_ta: 'Có sương mù', icon: '50d' };
  if (code >= 51 && code <= 57) return { mo_ta: 'Mưa phùn nhẹ', icon: '09d' };
  if (code >= 61 && code <= 67) return { mo_ta: 'Có mưa', icon: '10d' };
  if (code >= 80 && code <= 82) return { mo_ta: 'Mưa rào rải rác', icon: '09d' };
  if (code >= 95) return { mo_ta: 'Có dông', icon: '11d' };
  return { mo_ta: 'Có mây rải rác', icon: '03d' };
};

const fetchFromOpenMeteo = async (lat, lon, cityName) => {
  const response = await axios.get(OPEN_METEO_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,relative_humidity_2m_mean',
      timezone: 'Asia/Ho_Chi_Minh',
      forecast_days: 5,
    },
    timeout: 8000,
  });

  const { current, daily } = response.data;
  const dailyForecasts = (daily?.time || []).map((dateStr, idx) => {
    const mapped = mapWmoCode(daily.weather_code?.[idx]);
    const tMin = Math.round(daily.temperature_2m_min?.[idx] ?? 24);
    const tMax = Math.round(daily.temperature_2m_max?.[idx] ?? 30);
    return {
      ngay: dateStr,
      nhiet_do: idx === 0 && current?.temperature_2m != null
        ? Math.round(current.temperature_2m)
        : Math.round((tMin + tMax) / 2),
      nhiet_do_min: tMin,
      nhiet_do_max: tMax,
      do_am: Math.round(
        idx === 0 && current?.relative_humidity_2m != null
          ? current.relative_humidity_2m
          : (daily.relative_humidity_2m_mean?.[idx] ?? 75)
      ),
      mo_ta: idx === 0 && current?.weather_code != null
        ? mapWmoCode(current.weather_code).mo_ta
        : mapped.mo_ta,
      icon: idx === 0 && current?.weather_code != null
        ? mapWmoCode(current.weather_code).icon
        : mapped.icon,
      gio_kmh: Math.round(
        idx === 0 && current?.wind_speed_10m != null
          ? current.wind_speed_10m
          : (daily.wind_speed_10m_max?.[idx] ?? 12)
      ),
    };
  });

  const currentMapped = mapWmoCode(current?.weather_code);
  return {
    tinh_thanh: cityName,
    nguon: 'open-meteo',
    hien_tai: {
      ngay: dailyForecasts[0]?.ngay,
      nhiet_do: Math.round(current?.temperature_2m ?? dailyForecasts[0]?.nhiet_do ?? 28),
      nhiet_do_min: dailyForecasts[0]?.nhiet_do_min ?? 24,
      nhiet_do_max: dailyForecasts[0]?.nhiet_do_max ?? 31,
      cam_giac_nhu: Math.round(current?.apparent_temperature ?? current?.temperature_2m ?? 28),
      do_am: Math.round(current?.relative_humidity_2m ?? 75),
      mo_ta: currentMapped.mo_ta,
      icon: currentMapped.icon,
      gio_kmh: Math.round(current?.wind_speed_10m ?? 12),
    },
    du_bao_5_ngay: dailyForecasts,
  };
};

/**
 * Lấy dự báo thời tiết theo tọa độ (vi_do, kinh_do) hoặc tên tỉnh thành (PB07)
 */
export const getWeatherForecast = async (lat, lon, cityName = 'Đà Nẵng') => {
  const cacheKey = `${lat}_${lon}_${cityName}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Thử OpenWeatherMap nếu có API key hợp lệ
  if (OPENWEATHER_API_KEY) {
    try {
      let url = `${OWM_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
      if (!lat || !lon) {
        url = `${OWM_BASE_URL}/forecast?q=${encodeURIComponent(cityName)},VN&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
      }

      const response = await axios.get(url, { timeout: 6000 });
      const list = response.data.list || [];

      const dailyForecasts = [];
      const seenDays = new Set();

      for (const item of list) {
        const dateStr = item.dt_txt.split(' ')[0];
        if (!seenDays.has(dateStr)) {
          seenDays.add(dateStr);
          dailyForecasts.push({
            ngay: dateStr,
            nhiet_do: Math.round(item.main.temp),
            nhiet_do_min: Math.round(item.main.temp_min),
            nhiet_do_max: Math.round(item.main.temp_max),
            do_am: item.main.humidity,
            mo_ta: item.weather[0]?.description || 'Trời nắng',
            icon: item.weather[0]?.icon || '01d',
            gio_kmh: Math.round(item.wind.speed * 3.6),
          });
        }
        if (dailyForecasts.length >= 5) break;
      }

      const result = {
        tinh_thanh: response.data.city?.name || cityName,
        nguon: 'openweathermap',
        hien_tai: dailyForecasts[0] || {
          nhiet_do: 28,
          mo_ta: 'Trời quang đãng',
          icon: '01d',
          do_am: 70,
          gio_kmh: 15,
        },
        du_bao_5_ngay: dailyForecasts,
      };

      weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (owmErr) {
      console.warn('OpenWeatherMap không khả dụng, chuyển sang Open-Meteo thời gian thực:', owmErr.message);
    }
  }

  // 2. Chuyển sang Open-Meteo thời gian thực (miễn phí, không cần API key, chuẩn theo tọa độ)
  try {
    const realResult = await fetchFromOpenMeteo(lat || 16.0544, lon || 108.2022, cityName);
    weatherCache.set(cacheKey, { data: realResult, timestamp: Date.now() });
    return realResult;
  } catch (meteoErr) {
    console.warn('Lỗi gọi Open-Meteo API (dùng dữ liệu dự phòng):', meteoErr.message);
  }

  // 3. Fallback cuối cùng khi mất kết nối mạng hoàn toàn
  const fallbackResult = {
    tinh_thanh: cityName,
    nguon: 'fallback',
    hien_tai: {
      nhiet_do: 29,
      nhiet_do_min: 25,
      nhiet_do_max: 32,
      do_am: 72,
      mo_ta: 'Nắng nhẹ, gió mát',
      icon: '02d',
      gio_kmh: 12,
    },
    du_bao_5_ngay: [
      { ngay: 'Hôm nay', nhiet_do: 29, mo_ta: 'Nắng nhẹ', icon: '02d', do_am: 72, gio_kmh: 12 },
      { ngay: 'Ngày mai', nhiet_do: 30, mo_ta: 'Trời trong xanh', icon: '01d', do_am: 68, gio_kmh: 10 },
      { ngay: 'Ngày 3', nhiet_do: 28, mo_ta: 'Có mây rải rác', icon: '03d', do_am: 75, gio_kmh: 14 },
      { ngay: 'Ngày 4', nhiet_do: 27, mo_ta: 'Khả năng mưa rào nhẹ', icon: '10d', do_am: 82, gio_kmh: 18 },
      { ngay: 'Ngày 5', nhiet_do: 28, mo_ta: 'Mát mẻ', icon: '02d', do_am: 74, gio_kmh: 11 },
    ],
  };
  weatherCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
};

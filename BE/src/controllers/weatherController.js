import { getWeatherForecast, geocodeCityName } from '../services/weatherService.js';
import prisma from '../config/db.js';

// @desc  Lấy dự báo thời tiết 5 ngày (PB07, UI_06, UI_11)
// @route GET /api/weather
export const getWeather = async (req, res) => {
  try {
    const { tinh_thanh_id, vi_do, kinh_do, city } = req.query;

    let cityName = city || 'Đà Nẵng';
    let lat = vi_do ? Number(vi_do) : null;
    let lon = kinh_do ? Number(kinh_do) : null;

    // Nếu truyền tinh_thanh_id, tra cứu tên tỉnh thành từ CSDL
    if (tinh_thanh_id) {
      const province = await prisma.tinh_thanh_phos.findUnique({
        where: { id: BigInt(tinh_thanh_id) },
      });
      if (province) {
        cityName = province.ten_tinh_thanh;
      }
    }

    // Tọa độ mặc định cho các tỉnh thành trọng điểm nếu chưa có lat/lon
    if (!lat || !lon) {
      const cityCoords = {
        'Đà Nẵng': { lat: 16.0544, lon: 108.2022 },
        'Hà Nội': { lat: 21.0285, lon: 105.8542 },
        'Hồ Chí Minh': { lat: 10.8231, lon: 106.6297 },
        'TP. Hồ Chí Minh': { lat: 10.8231, lon: 106.6297 },
        'Thừa Thiên Huế': { lat: 16.4637, lon: 107.5909 },
        'Quảng Nam': { lat: 15.5684, lon: 108.2862 },
        'Khánh Hòa': { lat: 12.2388, lon: 109.1967 },
        'Lâm Đồng': { lat: 11.9404, lon: 108.4583 },
      };

      const match = Object.keys(cityCoords).find((k) =>
        cityName.toLowerCase().includes(k.toLowerCase())
      );
      if (match) {
        lat = cityCoords[match].lat;
        lon = cityCoords[match].lon;
      } else {
        const geo = await geocodeCityName(cityName);
        if (geo) {
          lat = geo.lat;
          lon = geo.lon;
          cityName = geo.resolvedName || cityName;
        } else {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy vị trí "${cityName}". Vui lòng thử tên tỉnh thành hoặc địa danh khác.`,
          });
        }
      }
    }

    const weatherData = await getWeatherForecast(lat, lon, cityName);

    res.json({
      success: true,
      message: 'Lấy thông tin dự báo thời tiết thành công',
      data: weatherData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

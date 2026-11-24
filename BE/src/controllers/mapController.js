import {
  optimizeRouteOrder,
  fetchOsrmRoute,
  calculateHaversineDistance,
} from '../services/mapService.js';
import prisma from '../config/db.js';

// @desc  Tối ưu hóa thứ tự tham quan các địa điểm (TSP Nearest Neighbor - tối đa 10 điểm)
// @route POST /api/maps/optimize-route (PB06, UI_07, UI_12)
export const optimizeRoute = async (req, res) => {
  try {
    const { diem_xuat_phat, danh_sach_dia_diem, quay_ve_diem_xuat_phat = false } = req.body;

    if (!danh_sach_dia_diem || !Array.isArray(danh_sach_dia_diem) || danh_sach_dia_diem.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách địa điểm cần lập lộ trình',
      });
    }

    if (danh_sach_dia_diem.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Lộ trình tối ưu chỉ hỗ trợ tối đa 10 địa điểm tham quan mỗi ngày theo quy định PB06',
      });
    }

    // Điểm xuất phát mặc định nếu không truyền
    const start = diem_xuat_phat && diem_xuat_phat.vi_do && diem_xuat_phat.kinh_do
      ? {
          id: 'start_point',
          ten_dia_diem: diem_xuat_phat.ten || 'Điểm xuất phát',
          vi_do: Number(diem_xuat_phat.vi_do),
          kinh_do: Number(diem_xuat_phat.kinh_do),
          dia_chi: diem_xuat_phat.dia_chi || '',
          is_start: true,
        }
      : {
          id: 'start_point',
          ten_dia_diem: danh_sach_dia_diem[0].ten_dia_diem || danh_sach_dia_diem[0].ten || 'Điểm xuất phát',
          vi_do: Number(danh_sach_dia_diem[0].vi_do),
          kinh_do: Number(danh_sach_dia_diem[0].kinh_do),
          dia_chi: danh_sach_dia_diem[0].dia_chi || '',
          is_start: true,
        };

    // Chuẩn hóa danh sách địa điểm cần ghé
    const normalizedPlaces = danh_sach_dia_diem.map((item, idx) => ({
      id: (item.id || `place_${idx + 1}`).toString(),
      ten_dia_diem: item.ten_dia_diem || item.ten || `Địa điểm ${idx + 1}`,
      dia_chi: item.dia_chi || '',
      vi_do: Number(item.vi_do),
      kinh_do: Number(item.kinh_do),
      anh_dai_dien: item.anh_dai_dien || null,
      gia_tham_quan: item.gia_tham_quan || 0,
    }));

    // Áp dụng thuật toán TSP Nearest Neighbor
    const optimizedPlaces = optimizeRouteOrder(start, normalizedPlaces, quay_ve_diem_xuat_phat);

    // Xây dựng chuỗi toàn bộ các điểm dừng bao gồm điểm bắt đầu
    const fullRouteSequence = [start, ...optimizedPlaces];
    if (quay_ve_diem_xuat_phat) {
      fullRouteSequence.push({
        ...start,
        id: 'return_point',
        ten_dia_diem: `Quay lại: ${start.ten_dia_diem}`,
      });
    }

    // Gọi OSRM Routing API để lấy lộ trình thực tế
    const osrmResult = await fetchOsrmRoute(fullRouteSequence);

    // Tính từng chặng cụ thể
    const legs = [];
    for (let i = 0; i < fullRouteSequence.length - 1; i++) {
      const from = fullRouteSequence[i];
      const to = fullRouteSequence[i + 1];
      const dist = calculateHaversineDistance(from.vi_do, from.kinh_do, to.vi_do, to.kinh_do);
      legs.push({
        from: from.ten_dia_diem,
        to: to.ten_dia_diem,
        distance_km: dist,
        estimated_duration_min: Math.round(dist * 2), // ~30km/h trong đô thị
      });
    }

    res.json({
      success: true,
      message: 'Tối ưu lộ trình du lịch thành công',
      data: {
        diem_xuat_phat: start,
        lo_trinh: fullRouteSequence,
        cac_chang: legs,
        tong_quang_duong_km: osrmResult.totalDistanceKm,
        tong_thoi_gian_phut: osrmResult.totalDurationMin,
        geometry: osrmResult.geometry, // GeoJSON coordinates cho Leaflet Polyline
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tính toán lộ trình theo thứ tự người dùng chỉ định (khi kéo thả đổi chặng)
// @route POST /api/maps/calculate-route (PB06)
export const calculateRoute = async (req, res) => {
  try {
    const { danh_sach_dia_diem } = req.body;

    if (!danh_sach_dia_diem || !Array.isArray(danh_sach_dia_diem) || danh_sach_dia_diem.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Lộ trình cần ít nhất 2 điểm dừng để tính toán',
      });
    }

    if (danh_sach_dia_diem.length > 12) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng điểm dừng tối đa cho một hành trình là 12 điểm',
      });
    }

    const normalizedPlaces = danh_sach_dia_diem.map((item, idx) => ({
      id: (item.id || `stop_${idx}`).toString(),
      ten_dia_diem: item.ten_dia_diem || item.ten || `Điểm ${idx + 1}`,
      dia_chi: item.dia_chi || '',
      vi_do: Number(item.vi_do),
      kinh_do: Number(item.kinh_do),
      anh_dai_dien: item.anh_dai_dien || null,
    }));

    const osrmResult = await fetchOsrmRoute(normalizedPlaces);

    const legs = [];
    for (let i = 0; i < normalizedPlaces.length - 1; i++) {
      const from = normalizedPlaces[i];
      const to = normalizedPlaces[i + 1];
      const dist = calculateHaversineDistance(from.vi_do, from.kinh_do, to.vi_do, to.kinh_do);
      legs.push({
        from: from.ten_dia_diem,
        to: to.ten_dia_diem,
        distance_km: dist,
        estimated_duration_min: Math.round(dist * 2),
      });
    }

    res.json({
      success: true,
      message: 'Tính toán lộ trình thành công',
      data: {
        lo_trinh: normalizedPlaces,
        cac_chang: legs,
        tong_quang_duong_km: osrmResult.totalDistanceKm,
        tong_thoi_gian_phut: osrmResult.totalDurationMin,
        geometry: osrmResult.geometry,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

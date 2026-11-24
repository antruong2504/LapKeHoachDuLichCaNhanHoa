import prisma from '../config/db.js';

// Helper format ngày YYYY-MM-DD theo múi giờ UTC+7 (Asia/Ho_Chi_Minh)
const toVnDateKey = (date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

const toVnShortLabel = (yyyyMmDd) => {
  const [, m, d] = yyyyMmDd.split('-');
  return `${d}/${m}`;
};

// @desc  Admin tổng hợp số liệu thống kê & báo cáo theo khoảng thời gian (UTC+7) (PB18 - UI_26)
// @route GET /api/admin/stats
export const getDashboardStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Xây dựng khoảng thời gian lọc theo UTC+7
    let startUtc = null;
    let endUtc = null;

    if (start_date) {
      startUtc = new Date(`${start_date}T00:00:00+07:00`);
    }
    if (end_date) {
      endUtc = new Date(`${end_date}T23:59:59.999+07:00`);
    }

    const createdAtFilter =
      startUtc || endUtc
        ? {
            created_at: {
              ...(startUtc && !isNaN(startUtc.getTime()) ? { gte: startUtc } : {}),
              ...(endUtc && !isNaN(endUtc.getTime()) ? { lte: endUtc } : {}),
            },
          }
        : {};

    const guideDateFilter =
      startUtc || endUtc
        ? {
            ngay_dang: {
              ...(startUtc && !isNaN(startUtc.getTime()) ? { gte: startUtc } : {}),
              ...(endUtc && !isNaN(endUtc.getTime()) ? { lte: endUtc } : {}),
            },
          }
        : {};

    // 1. Tổng hợp KPI toàn hệ thống & trong khoảng lọc
    const [
      totalUsers,
      filteredUsers,
      totalDestinations,
      totalTrips,
      filteredTrips,
      totalGuides,
      totalReviews,
      reviewAvgAgg,
      provinces,
      ratingGroups,
    ] = await Promise.all([
      prisma.tai_khoans.count(),
      prisma.tai_khoans.findMany({
        where: createdAtFilter,
        select: { created_at: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.dia_diems.count({ where: { trang_thai: 'hien_thi' } }),
      prisma.lich_trinhs.count(),
      prisma.lich_trinhs.findMany({
        where: createdAtFilter,
        select: { created_at: true, nguon_tao: true, tinh_thanh_id: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.cam_nangs.count({ where: guideDateFilter }),
      prisma.danh_gias.count({ where: createdAtFilter }),
      prisma.danh_gias.aggregate({
        where: createdAtFilter,
        _avg: { so_sao: true },
      }),
      prisma.tinh_thanh_phos.findMany({
        select: { id: true, ten_tinh_thanh: true },
      }),
      prisma.danh_gias.groupBy({
        by: ['so_sao'],
        where: createdAtFilter,
        _count: { id: true },
      }),
    ]);

    // 2. Biểu đồ tăng trưởng người dùng & lịch trình theo ngày (UTC+7)
    const growthMap = new Map();
    filteredUsers.forEach((u) => {
      const key = toVnDateKey(u.created_at);
      if (!growthMap.has(key)) growthMap.set(key, { dateKey: key, nguoi_dung_moi: 0, lich_trinh_moi: 0 });
      growthMap.get(key).nguoi_dung_moi += 1;
    });
    filteredTrips.forEach((t) => {
      const key = toVnDateKey(t.created_at);
      if (!growthMap.has(key)) growthMap.set(key, { dateKey: key, nguoi_dung_moi: 0, lich_trinh_moi: 0 });
      growthMap.get(key).lich_trinh_moi += 1;
    });

    const userGrowthChart = Array.from(growthMap.values())
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((item) => ({
        ngay: toVnShortLabel(item.dateKey),
        date_iso: item.dateKey,
        nguoi_dung_moi: item.nguoi_dung_moi,
        lich_trinh_moi: item.lich_trinh_moi,
      }));

    // 3. Biểu đồ lịch trình theo tỉnh thành
    const provinceNameMap = new Map(provinces.map((p) => [p.id.toString(), p.ten_tinh_thanh]));
    const tripProvinceMap = new Map();
    filteredTrips.forEach((t) => {
      const pName = provinceNameMap.get(t.tinh_thanh_id.toString()) || 'Khác';
      tripProvinceMap.set(pName, (tripProvinceMap.get(pName) || 0) + 1);
    });

    const tripsByProvinceChart = Array.from(tripProvinceMap.entries())
      .map(([tinh_thanh, so_lich_trinh]) => ({ tinh_thanh, so_lich_trinh }))
      .sort((a, b) => b.so_lich_trinh - a.so_lich_trinh);

    // 4. Biểu đồ phân bố đánh giá 1-5 sao
    const starCountMap = new Map([1, 2, 3, 4, 5].map((s) => [s, 0]));
    ratingGroups.forEach((g) => {
      starCountMap.set(g.so_sao, g._count.id);
    });

    const ratingDistributionChart = [5, 4, 3, 2, 1].map((star) => ({
      so_sao: star,
      nhan: `${star} sao`,
      so_luong: starCountMap.get(star) || 0,
    }));

    const aiTripsCount = filteredTrips.filter((t) => t.nguon_tao === 'ai').length;
    const manualTripsCount = filteredTrips.filter((t) => t.nguon_tao === 'thu_cong').length;

    res.json({
      success: true,
      message: 'Tổng hợp số liệu thống kê Admin thành công (UTC+7)',
      data: {
        filter: {
          timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
          start_date: start_date || null,
          end_date: end_date || null,
        },
        overview: {
          tong_nguoi_dung: totalUsers,
          nguoi_dung_trong_ky: filteredUsers.length,
          tong_dia_diem: totalDestinations,
          tong_lich_trinh: totalTrips,
          lich_trinh_trong_ky: filteredTrips.length,
          lich_trinh_ai: aiTripsCount,
          lich_trinh_thu_cong: manualTripsCount,
          tong_cam_nang: totalGuides,
          tong_danh_gia: totalReviews,
          diem_danh_gia_tb_he_thong: reviewAvgAgg._avg.so_sao
            ? Number(reviewAvgAgg._avg.so_sao.toFixed(1))
            : 0,
        },
        charts: {
          tang_truong_nguoi_dung: userGrowthChart,
          lich_trinh_theo_tinh_thanh: tripsByProvinceChart,
          phan_bo_danh_gia: ratingDistributionChart,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi getDashboardStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

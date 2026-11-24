import prisma from '../config/db.js';

// Helper serialize BigInt & Decimal cho JSON response
const serializeTrip = (trip) => {
  if (!trip) return null;
  return {
    ...trip,
    id: trip.id.toString(),
    tai_khoan_id: trip.tai_khoan_id?.toString(),
    tinh_thanh_id: trip.tinh_thanh_id?.toString(),
    ngan_sach_du_kien: trip.ngan_sach_du_kien ? Number(trip.ngan_sach_du_kien) : null,
    tong_chi_phi_uoc_tinh: trip.tong_chi_phi_uoc_tinh ? Number(trip.tong_chi_phi_uoc_tinh) : null,
    tinh_thanh: trip.tinh_thanh ? {
      ...trip.tinh_thanh,
      id: trip.tinh_thanh.id.toString(),
    } : null,
    ngays: (trip.ngays || []).map((day) => ({
      ...day,
      id: day.id.toString(),
      lich_trinh_id: day.lich_trinh_id.toString(),
      chi_tiets: (day.chi_tiets || []).map((stop) => ({
        ...stop,
        id: stop.id.toString(),
        lich_trinh_ngay_id: stop.lich_trinh_ngay_id.toString(),
        dia_diem_id: stop.dia_diem_id ? stop.dia_diem_id.toString() : null,
        vi_do_luu: stop.vi_do_luu ? Number(stop.vi_do_luu) : null,
        kinh_do_luu: stop.kinh_do_luu ? Number(stop.kinh_do_luu) : null,
        chi_phi_uoc_tinh: stop.chi_phi_uoc_tinh ? Number(stop.chi_phi_uoc_tinh) : 0,
        dia_diem_da_xoa: stop.dia_diem?.trang_thai === 'da_xoa',
      })),
    })),
  };
};

// @desc  Tạo lịch trình thủ công (PB20 - UI_19)
// @route POST /api/trips/manual
export const createManualTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      ten_lich_trinh,
      tinh_thanh_id,
      ngay_bat_dau,
      ngay_ket_thuc,
      ngan_sach_du_kien,
      so_nguoi,
      so_thich,
      danh_sach_ngay,
    } = req.body;

    // 1. Validation thông tin bắt buộc
    if (!ten_lich_trinh || !ten_lich_trinh.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên lịch trình',
        errors: [{ field: 'ten_lich_trinh', message: 'Tên lịch trình không được để trống' }],
      });
    }

    if (!tinh_thanh_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tỉnh / thành phố cho chuyến đi',
        errors: [{ field: 'tinh_thanh_id', message: 'Tỉnh thành là bắt buộc' }],
      });
    }

    if (!ngay_bat_dau || !ngay_ket_thuc) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày bắt đầu và ngày kết thúc',
        errors: [{ field: 'ngay_bat_dau', message: 'Ngày bắt đầu và kết thúc là bắt buộc' }],
      });
    }

    const startDate = new Date(ngay_bat_dau);
    const endDate = new Date(ngay_ket_thuc);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ (chuẩn YYYY-MM-DD)',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải diễn ra sau hoặc cùng ngày bắt đầu',
        errors: [{ field: 'ngay_ket_thuc', message: 'Ngày kết thúc không hợp lệ' }],
      });
    }

    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 14) {
      return res.status(400).json({
        success: false,
        message: 'Hệ thống hỗ trợ lịch trình tối đa 14 ngày',
        errors: [{ field: 'ngay_ket_thuc', message: 'Số ngày vượt quá giới hạn 14 ngày' }],
      });
    }

    if (!Array.isArray(danh_sach_ngay) || danh_sach_ngay.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lịch trình phải có ít nhất 1 ngày tham quan',
        errors: [{ field: 'danh_sach_ngay', message: 'Danh sách ngày không được rỗng' }],
      });
    }

    // 2. Kiểm tra tỉnh thành hợp lệ
    const province = await prisma.tinh_thanh_phos.findUnique({
      where: { id: BigInt(tinh_thanh_id) },
    });
    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Tỉnh / thành phố được chọn không tồn tại trong hệ thống',
      });
    }

    // 3. Tính toán tổng chi phí ước tính và kiểm tra vượt ngân sách
    let totalEstimatedCost = 0;
    danh_sach_ngay.forEach((day) => {
      (day.cac_chang || []).forEach((chang) => {
        const cost = Number(chang.chi_phi_uoc_tinh) || 0;
        totalEstimatedCost += cost;
      });
    });

    const budget = Number(ngan_sach_du_kien) || 0;
    const isOverBudget = budget > 0 && totalEstimatedCost > budget;

    // 4. Lấy map thông tin địa điểm trong DB để bổ sung snapshot nếu client chưa có
    const placeIds = [];
    danh_sach_ngay.forEach((day) => {
      (day.cac_chang || []).forEach((chang) => {
        if (chang.dia_diem_id && !isNaN(chang.dia_diem_id)) {
          placeIds.push(BigInt(chang.dia_diem_id));
        }
      });
    });

    const dbPlaces = placeIds.length > 0
      ? await prisma.dia_diems.findMany({
          where: { id: { in: placeIds } },
        })
      : [];
    const placeMap = new Map(dbPlaces.map((p) => [p.id.toString(), p]));

    // 5. Sử dụng Prisma Transaction để lưu dữ liệu an toàn vào Cloud Database
    const newTrip = await prisma.$transaction(
      async (tx) => {
        // Tạo lịch trình chính
        const trip = await tx.lich_trinhs.create({
          data: {
            tai_khoan_id: BigInt(userId),
            tinh_thanh_id: BigInt(tinh_thanh_id),
            ten_lich_trinh: ten_lich_trinh.trim(),
            nguon_tao: 'thu_cong',
            ngay_bat_dau: startDate,
            ngay_ket_thuc: endDate,
            ngan_sach_du_kien: budget > 0 ? budget : null,
            so_nguoi: Number(so_nguoi) || 1,
            so_thich: so_thich || '',
            tong_chi_phi_uoc_tinh: totalEstimatedCost,
            da_xac_nhan_vuot_ngan_sach: isOverBudget,
            phien_ban: 1,
          },
        });

        // Tạo từng ngày và từng chặng tham quan
        for (let i = 0; i < danh_sach_ngay.length; i++) {
          const day = danh_sach_ngay[i];
          const thuTuNgay = Number(day.thu_tu_ngay) || (i + 1);

          let dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + (thuTuNgay - 1));
          if (day.ngay_tham_quan) {
            const parsed = new Date(day.ngay_tham_quan);
            if (!isNaN(parsed.getTime())) dayDate = parsed;
          }

          const tripDay = await tx.lich_trinh_ngays.create({
            data: {
              lich_trinh_id: trip.id,
              ngay_tham_quan: dayDate,
              thu_tu_ngay: thuTuNgay,
              ghi_chu: day.ghi_chu || `Ngày ${thuTuNgay}: Khám phá ${province.ten_tinh_thanh}`,
            },
          });

          // Tạo các chặng tham quan kèm Snapshot
          const changs = day.cac_chang || [];
          for (let j = 0; j < changs.length; j++) {
            const chang = changs[j];
            const thuTuChang = Number(chang.thu_tu) || (j + 1);

            let diaDiemId = null;
            let refPlace = null;
            if (chang.dia_diem_id && !isNaN(chang.dia_diem_id)) {
              diaDiemId = BigInt(chang.dia_diem_id);
              refPlace = placeMap.get(chang.dia_diem_id.toString());
            }

            const tenLuu = chang.ten_dia_diem_luu || refPlace?.ten_dia_diem || chang.ten_dia_diem || 'Điểm tham quan';
            const diaChiLuu = chang.dia_chi_luu || refPlace?.dia_chi || province.ten_tinh_thanh;
            const viDoLuu = chang.vi_do_luu !== undefined ? Number(chang.vi_do_luu) : (refPlace?.vi_do ? Number(refPlace.vi_do) : null);
            const kinhDoLuu = chang.kinh_do_luu !== undefined ? Number(chang.kinh_do_luu) : (refPlace?.kinh_do ? Number(refPlace.kinh_do) : null);
            const chiPhi = Number(chang.chi_phi_uoc_tinh) || 0;

            await tx.lich_trinh_chi_tiets.create({
              data: {
                lich_trinh_ngay_id: tripDay.id,
                dia_diem_id: diaDiemId,
                thu_tu: thuTuChang,
                buoi: chang.buoi || 'sang',
                thoi_gian_du_kien: chang.thoi_gian_du_kien || '08:00 - 11:30',
                ten_dia_diem_luu: tenLuu,
                dia_chi_luu: diaChiLuu,
                vi_do_luu: viDoLuu,
                kinh_do_luu: kinhDoLuu,
                chi_phi_uoc_tinh: chiPhi,
                ghi_chu: chang.ghi_chu || null,
              },
            });
          }
        }

        return trip;
      },
      {
        maxWait: 15000,
        timeout: 45000,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Tạo lịch trình thủ công thành công',
      data: {
        trip_id: newTrip.id.toString(),
        ten_lich_trinh: newTrip.ten_lich_trinh,
        tong_chi_phi_uoc_tinh: totalEstimatedCost,
        vuot_ngan_sach: isOverBudget,
        canh_bao: isOverBudget
          ? `Chi phí ước tính (${totalEstimatedCost.toLocaleString('vi-VN')} đ) đang vượt quá ngân sách dự kiến (${budget.toLocaleString('vi-VN')} đ)`
          : null,
      },
    });
  } catch (error) {
    console.error('Lỗi createManualTrip:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy danh sách lịch trình của người dùng (PB09 - UI_20)
// @route GET /api/trips
export const getTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const trips = await prisma.lich_trinhs.findMany({
      where: { tai_khoan_id: BigInt(userId) },
      include: {
        tinh_thanh: true,
        ngays: {
          orderBy: { thu_tu_ngay: 'asc' },
          include: {
            chi_tiets: {
              orderBy: { thu_tu: 'asc' },
              include: { dia_diem: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      message: 'Lấy danh sách lịch trình thành công',
      data: trips.map(serializeTrip),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy chi tiết 1 lịch trình (PB09 - UI_21)
// @route GET /api/trips/:id
export const getTripById = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = BigInt(req.params.id);

    const trip = await prisma.lich_trinhs.findFirst({
      where: {
        id: tripId,
        tai_khoan_id: BigInt(userId),
      },
      include: {
        tinh_thanh: true,
        ngays: {
          orderBy: { thu_tu_ngay: 'asc' },
          include: {
            chi_tiets: {
              orderBy: { thu_tu: 'asc' },
              include: { dia_diem: true },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch trình hoặc bạn không có quyền truy cập',
      });
    }

    res.json({
      success: true,
      message: 'Lấy chi tiết lịch trình thành công',
      data: serializeTrip(trip),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Cập nhật lịch trình (PB09 - UI_21 - Optimistic Locking)
// @route PUT /api/trips/:id
export const updateTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = BigInt(req.params.id);
    const { ten_lich_trinh, ngan_sach_du_kien, so_nguoi, so_thich, phien_ban } = req.body;

    const existing = await prisma.lich_trinhs.findFirst({
      where: { id: tripId, tai_khoan_id: BigInt(userId) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình' });
    }

    // Optimistic locking
    if (phien_ban !== undefined && existing.phien_ban !== Number(phien_ban)) {
      return res.status(409).json({
        success: false,
        message: 'Lịch trình đã được chỉnh sửa bởi phiên khác. Vui lòng tải lại trang.',
      });
    }

    const updated = await prisma.lich_trinhs.update({
      where: { id: tripId },
      data: {
        ...(ten_lich_trinh && { ten_lich_trinh: ten_lich_trinh.trim() }),
        ...(ngan_sach_du_kien !== undefined && { ngan_sach_du_kien: Number(ngan_sach_du_kien) }),
        ...(so_nguoi !== undefined && { so_nguoi: Number(so_nguoi) }),
        ...(so_thich !== undefined && { so_thich }),
        phien_ban: { increment: 1 },
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật lịch trình thành công',
      data: serializeTrip(updated),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Xóa lịch trình (PB09 - UI_22)
// @route DELETE /api/trips/:id
export const deleteTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = BigInt(req.params.id);

    const existing = await prisma.lich_trinhs.findFirst({
      where: { id: tripId, tai_khoan_id: BigInt(userId) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình cần xóa' });
    }

    await prisma.lich_trinhs.delete({
      where: { id: tripId },
    });

    res.json({
      success: true,
      message: 'Đã xóa lịch trình thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

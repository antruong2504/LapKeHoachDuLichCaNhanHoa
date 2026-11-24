import prisma from '../config/db.js';
import { generateItineraryWithGemini } from '../services/aiService.js';

// Fallback generator khi mất mạng hoặc Gemini API gặp sự cố
const generateFallbackItinerary = (provinceName, validPlaces, totalDays, budget, groupSize, interests) => {
  const cac_ngay = [];
  const placesCount = validPlaces.length;

  for (let d = 1; d <= totalDays; d++) {
    const dayPlaces = [];
    const buois = ['sang', 'chieu', 'toi'];
    const times = ['08:00 - 11:30', '14:00 - 17:30', '19:00 - 21:30'];

    for (let b = 0; b < 3; b++) {
      const pIndex = ((d - 1) * 3 + b) % Math.max(1, placesCount);
      const place = validPlaces[pIndex] || {
        id: '1',
        ten_dia_diem: `Điểm tham quan ${b + 1} tại ${provinceName}`,
        dia_chi: provinceName,
        gia_tham_quan: 50000,
        vi_do: 16.0544,
        kinh_do: 108.2022,
      };

      dayPlaces.push({
        thu_tu: b + 1,
        buoi: buois[b],
        thoi_gian: times[b],
        dia_diem_id: place.id ? place.id.toString() : '1',
        ten_dia_diem: place.ten_dia_diem || place.ten,
        hoat_dong: b === 0 
          ? `Tham quan, chụp ảnh và tìm hiểu văn hóa tại ${place.ten_dia_diem || place.ten}`
          : b === 1
          ? `Trải nghiệm các hoạt động giải trí và thưởng thức ẩm thực đặc sản`
          : `Dạo phố đêm, ngắm cảnh và thư giãn`,
        chi_phi_uoc_tinh: Number(place.gia_tham_quan || 50000) + 100000,
      });
    }

    cac_ngay.push({
      thu_tu_ngay: d,
      tieu_de_ngay: `Ngày ${d}: Khám phá các điểm đến đặc sắc tại ${provinceName}`,
      cac_chang: dayPlaces,
    });
  }

  const tongChiPhi = cac_ngay.reduce((acc, n) => {
    return acc + n.cac_chang.reduce((cAcc, c) => cAcc + (c.chi_phi_uoc_tinh || 0), 0);
  }, 0) * Number(groupSize || 1);

  const isOver = tongChiPhi > Number(budget);

  return {
    ten_lich_trinh: `Hành trình khám phá ${provinceName} ${totalDays}N${totalDays - 1 > 0 ? totalDays - 1 : 1}Đ`,
    tong_so_ngay: totalDays,
    tong_chi_phi_uoc_tinh: tongChiPhi,
    vuot_ngan_sach: isOver,
    canh_bao: isOver 
      ? `Chi phí ước tính (${tongChiPhi.toLocaleString('vi-VN')} VNĐ) vượt ngân sách dự kiến (${Number(budget).toLocaleString('vi-VN')} VNĐ).` 
      : null,
    cac_ngay,
  };
};

// @desc  Sinh lịch trình du lịch bằng Gemini AI (PB08, UI_17, UI_18)
// @route POST /api/ai/generate-itinerary
export const generateItinerary = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tinh_thanh_id,
      ngay_bat_dau,
      ngay_ket_thuc,
      ngan_sach_du_kien,
      so_luong_nguoi,
      so_thich,
    } = req.body;

    // 1. Kiểm tra 6 thông tin bắt buộc
    if (!tinh_thanh_id || !ngay_bat_dau || !ngay_ket_thuc || !ngan_sach_du_kien || !so_luong_nguoi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ 6 thông tin bắt buộc: Điểm đến, Ngày bắt đầu, Ngày kết thúc, Ngân sách, Số người và Sở thích.',
      });
    }

    const start = new Date(ngay_bat_dau);
    const end = new Date(ngay_ket_thuc);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải diễn ra sau hoặc trùng với ngày bắt đầu',
      });
    }

    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 14) {
      return res.status(400).json({
        success: false,
        message: 'Hệ thống hỗ trợ lập lịch trình tối đa 14 ngày cho một chuyến đi',
      });
    }

    // 2. Tra cứu tỉnh thành
    const province = await prisma.tinh_thanh_phos.findUnique({
      where: { id: BigInt(tinh_thanh_id) },
    });
    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin tỉnh/thành phố được chọn',
      });
    }

    // 3. Lấy danh sách địa điểm có thật trong database thuộc tỉnh thành này
    const validDestinations = await prisma.dia_diems.findMany({
      where: {
        tinh_thanh_id: BigInt(tinh_thanh_id),
        trang_thai: 'hien_thi',
      },
      select: {
        id: true,
        ten_dia_diem: true,
        dia_chi: true,
        gia_tham_quan: true,
        vi_do: true,
        kinh_do: true,
        anh_dai_dien: true,
      },
    });

    if (validDestinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Chưa có địa điểm tham quan nào khả dụng tại ${province.ten_tinh_thanh}`,
      });
    }

    // 4. Gọi Gemini AI để sinh lịch trình
    let aiResult;
    try {
      aiResult = await generateItineraryWithGemini({
        destinationName: province.ten_tinh_thanh,
        startDate: ngay_bat_dau,
        endDate: ngay_ket_thuc,
        budget: Number(ngan_sach_du_kien),
        groupSize: Number(so_luong_nguoi),
        interests: so_thich || '',
        validDestinations,
      });
    } catch (aiErr) {
      console.warn('Gemini AI generation fallback:', aiErr.message);
      aiResult = generateFallbackItinerary(
        province.ten_tinh_thanh,
        validDestinations,
        diffDays,
        ngan_sach_du_kien,
        so_luong_nguoi,
        so_thich
      );
    }

    // Gắn thêm ảnh đại diện từ validDestinations nếu có
    const placeMap = new Map(validDestinations.map(p => [p.id.toString(), p]));
    if (aiResult.cac_ngay) {
      aiResult.cac_ngay.forEach(day => {
        if (day.cac_chang) {
          day.cac_chang.forEach(chang => {
            const p = placeMap.get(chang.dia_diem_id?.toString());
            if (p) {
              chang.anh_dai_dien = p.anh_dai_dien;
              chang.dia_chi = p.dia_chi;
              chang.vi_do = p.vi_do ? Number(p.vi_do) : null;
              chang.kinh_do = p.kinh_do ? Number(p.kinh_do) : null;
            }
          });
        }
      });
    }

    // 5. Lưu bản nháp vào bảng `ban_nhap_ais`
    const draft = await prisma.ban_nhap_ais.create({
      data: {
        tai_khoan_id: BigInt(userId),
        du_lieu_dau_vao: {
          tinh_thanh_id: Number(tinh_thanh_id),
          ten_tinh_thanh: province.ten_tinh_thanh,
          ngay_bat_dau,
          ngay_ket_thuc,
          ngan_sach_du_kien: Number(ngan_sach_du_kien),
          so_luong_nguoi: Number(so_luong_nguoi),
          so_thich: so_thich || '',
        },
        noi_dung_ket_qua: aiResult,
        trang_thai: 'hop_le',
        vuot_ngan_sach: Boolean(aiResult.vuot_ngan_sach),
      },
    });

    res.json({
      success: true,
      message: 'Tạo lịch trình du lịch bằng Gemini AI thành công',
      data: {
        ban_nhap_id: draft.id.toString(),
        vuot_ngan_sach: draft.vuot_ngan_sach,
        canh_bao: aiResult.canh_bao,
        noi_dung_lich_trinh: aiResult,
      },
    });
  } catch (error) {
    console.error('LỖI saveDraftToItinerary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tạo lại lịch trình cho 1 ngày cụ thể (PB08)
// @route POST /api/ai/regenerate-day
export const regenerateDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ban_nhap_id, thu_tu_ngay } = req.body;

    if (!ban_nhap_id || !thu_tu_ngay) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ban_nhap_id và thu_tu_ngay cần tạo lại',
      });
    }

    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(ban_nhap_id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp lịch trình',
      });
    }

    const inputData = draft.du_lieu_dau_vao;
    const currentResult = draft.noi_dung_ket_qua;

    // Lấy danh sách địa điểm hợp lệ
    const validDestinations = await prisma.dia_diems.findMany({
      where: {
        tinh_thanh_id: BigInt(inputData.tinh_thanh_id),
        trang_thai: 'hien_thi',
      },
    });

    // Trộn ngẫu nhiên địa điểm để sinh ngày mới
    const shuffled = [...validDestinations].sort(() => 0.5 - Math.random());
    const newDayChangs = [
      {
        thu_tu: 1,
        buoi: 'sang',
        thoi_gian: '08:00 - 11:30',
        dia_diem_id: shuffled[0]?.id.toString() || '1',
        ten_dia_diem: shuffled[0]?.ten_dia_diem || 'Điểm tham quan buổi sáng',
        hoat_dong: 'Khám phá văn hóa và trải nghiệm phong cảnh buổi sáng',
        chi_phi_uoc_tinh: Number(shuffled[0]?.gia_tham_quan || 50000) + 80000,
        anh_dai_dien: shuffled[0]?.anh_dai_dien,
        dia_chi: shuffled[0]?.dia_chi,
        vi_do: shuffled[0]?.vi_do ? Number(shuffled[0].vi_do) : null,
        kinh_do: shuffled[0]?.kinh_do ? Number(shuffled[0].kinh_do) : null,
      },
      {
        thu_tu: 2,
        buoi: 'chieu',
        thoi_gian: '14:00 - 17:30',
        dia_diem_id: shuffled[1]?.id.toString() || '2',
        ten_dia_diem: shuffled[1]?.ten_dia_diem || 'Điểm tham quan buổi chiều',
        hoat_dong: 'Trải nghiệm vui chơi giải trí và ngắm hoàng hôn',
        chi_phi_uoc_tinh: Number(shuffled[1]?.gia_tham_quan || 100000) + 120000,
        anh_dai_dien: shuffled[1]?.anh_dai_dien,
        dia_chi: shuffled[1]?.dia_chi,
        vi_do: shuffled[1]?.vi_do ? Number(shuffled[1].vi_do) : null,
        kinh_do: shuffled[1]?.kinh_do ? Number(shuffled[1].kinh_do) : null,
      },
      {
        thu_tu: 3,
        buoi: 'toi',
        thoi_gian: '18:30 - 21:30',
        dia_diem_id: shuffled[2]?.id.toString() || '3',
        ten_dia_diem: shuffled[2]?.ten_dia_diem || 'Điểm giải trí buổi tối',
        hoat_dong: 'Thưởng thức ẩm thực đường phố và ngắm cảnh đêm',
        chi_phi_uoc_tinh: 150000,
        anh_dai_dien: shuffled[2]?.anh_dai_dien,
        dia_chi: shuffled[2]?.dia_chi,
        vi_do: shuffled[2]?.vi_do ? Number(shuffled[2].vi_do) : null,
        kinh_do: shuffled[2]?.kinh_do ? Number(shuffled[2].kinh_do) : null,
      },
    ];

    // Thay thế ngày tương ứng trong bản nháp
    const updatedDays = currentResult.cac_ngay.map((d) => {
      if (d.thu_tu_ngay === Number(thu_tu_ngay)) {
        return {
          ...d,
          tieu_de_ngay: `Ngày ${thu_tu_ngay}: Khám phá điểm đến mới tại ${inputData.ten_tinh_thanh}`,
          cac_chang: newDayChangs,
        };
      }
      return d;
    });

    const updatedResult = {
      ...currentResult,
      cac_ngay: updatedDays,
    };

    await prisma.ban_nhap_ais.update({
      where: { id: draft.id },
      data: { noi_dung_ket_qua: updatedResult },
    });

    res.json({
      success: true,
      message: `Đã tạo lại lịch trình Ngày ${thu_tu_ngay} thành công`,
      data: {
        thu_tu_ngay: Number(thu_tu_ngay),
        ngay_moi: updatedDays.find((d) => d.thu_tu_ngay === Number(thu_tu_ngay)),
      },
    });
  } catch (error) {
    console.error('LỖI saveDraftToItinerary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lưu bản nháp AI thành Lịch trình chính thức (PB08, UI_18 -> UI_20)
// @route POST /api/ai/save-draft
export const saveDraftToItinerary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ban_nhap_id, ten_lich_trinh } = req.body;

    if (!ban_nhap_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ban_nhap_id cần lưu',
      });
    }

    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(ban_nhap_id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp AI để lưu',
      });
    }

    const inputData = draft.du_lieu_dau_vao;
    const aiResult = draft.noi_dung_ket_qua;

    // Sử dụng Prisma Transaction với timeout 30s để đảm bảo kết nối mạng Cloud Supabase không bị ngắt
    const newTrip = await prisma.$transaction(async (tx) => {
      // 1. Tạo lịch trình chính (lich_trinhs)
      const trip = await tx.lich_trinhs.create({
        data: {
          tai_khoan_id: BigInt(userId),
          tinh_thanh_id: BigInt(inputData.tinh_thanh_id),
          ten_lich_trinh: ten_lich_trinh || aiResult.ten_lich_trinh || `Lịch trình du lịch ${inputData.ten_tinh_thanh}`,
          nguon_tao: 'ai',
          ngay_bat_dau: new Date(inputData.ngay_bat_dau),
          ngay_ket_thuc: new Date(inputData.ngay_ket_thuc),
          ngan_sach_du_kien: Number(inputData.ngan_sach_du_kien),
          so_nguoi: Number(inputData.so_luong_nguoi),
          so_thich: inputData.so_thich || '',
          tong_chi_phi_uoc_tinh: Number(aiResult.tong_chi_phi_uoc_tinh || 0),
          da_xac_nhan_vuot_ngan_sach: Boolean(draft.vuot_ngan_sach),
          phien_ban: 1,
        },
      });

      // 2. Tạo các ngày (lich_trinh_ngays) và chặng tham quan (lich_trinh_chi_tiets)
      const startDate = new Date(inputData.ngay_bat_dau);
      for (const day of (aiResult.cac_ngay || [])) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + (day.thu_tu_ngay - 1));

        const tripDay = await tx.lich_trinh_ngays.create({
          data: {
            lich_trinh_id: trip.id,
            ngay_tham_quan: dayDate,
            thu_tu_ngay: day.thu_tu_ngay,
            ghi_chu: day.tieu_de_ngay || null,
          },
        });

        // Tạo từng chặng tham quan kèm snapshot bảo vệ toàn vẹn dữ liệu
        for (const chang of (day.cac_chang || [])) {
          let diaDiemId = null;
          if (chang.dia_diem_id && !isNaN(chang.dia_diem_id)) {
            diaDiemId = BigInt(chang.dia_diem_id);
          }

          await tx.lich_trinh_chi_tiets.create({
            data: {
              lich_trinh_ngay_id: tripDay.id,
              dia_diem_id: diaDiemId,
              thu_tu: chang.thu_tu,
              buoi: chang.buoi || 'sang',
              thoi_gian_du_kien: chang.thoi_gian || '08:00 - 11:30',
              ten_dia_diem_luu: chang.ten_dia_diem || 'Điểm tham quan',
              dia_chi_luu: chang.dia_chi || inputData.ten_tinh_thanh,
              vi_do_luu: chang.vi_do ? Number(chang.vi_do) : null,
              kinh_do_luu: chang.kinh_do ? Number(chang.kinh_do) : null,
              chi_phi_uoc_tinh: chang.chi_phi_uoc_tinh ? Number(chang.chi_phi_uoc_tinh) : 0,
              ghi_chu: chang.hoat_dong || null,
            },
          });
        }
      }

      // 3. Cập nhật bản nháp AI liên kết với lịch trình chính
      await tx.ban_nhap_ais.update({
        where: { id: draft.id },
        data: {
          lich_trinh_goc_id: trip.id,
          trang_thai: 'da_luu',
        },
      });

      return trip;
    }, {
      maxWait: 15000,
      timeout: 45000,
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu lịch trình AI thành công vào danh sách của bạn',
      data: {
        trip_id: newTrip.id.toString(),
        ten_lich_trinh: newTrip.ten_lich_trinh,
      },
    });
  } catch (error) {
    console.error('LỖI saveDraftToItinerary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy chi tiết một bản nháp AI
// @route GET /api/ai/draft/:id
export const getDraftById = async (req, res) => {
  try {
    const userId = req.user.id;
    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(req.params.id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp AI',
      });
    }

    res.json({
      success: true,
      data: {
        id: draft.id.toString(),
        du_lieu_dau_vao: draft.du_lieu_dau_vao,
        noi_dung_ket_qua: draft.noi_dung_ket_qua,
        vuot_ngan_sach: draft.vuot_ngan_sach,
        trang_thai: draft.trang_thai,
      },
    });
  } catch (error) {
    console.error('LỖI saveDraftToItinerary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

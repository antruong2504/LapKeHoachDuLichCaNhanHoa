import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { removeDiacritics } from './categoryController.js';
import { uploadImageToSupabase } from '../config/supabase.js';
import { scoreDestinationSearch } from '../utils/vietnameseSearch.js';

// Helper format địa điểm
const formatDestination = (d) => {
  const totalStars = d.danh_gias?.reduce((sum, g) => sum + g.so_sao, 0) || 0;
  const countRatings = d.danh_gias?.length || d._count?.danh_gias || 0;
  const diem_danh_gia_tb = countRatings > 0 ? Number((totalStars / countRatings).toFixed(1)) : 4.8;

  return {
    id: d.id.toString(),
    tinh_thanh_id: d.tinh_thanh_id ? d.tinh_thanh_id.toString() : null,
    tinh_thanh: d.tinh_thanh ? {
      id: d.tinh_thanh.id.toString(),
      ten_tinh_thanh: d.tinh_thanh.ten_tinh_thanh,
      ma_tinh_thanh: d.tinh_thanh.ma_tinh_thanh,
    } : null,
    ten_dia_diem: d.ten_dia_diem,
    mo_ta_ngan: d.mo_ta_ngan,
    mo_ta_chi_tiet: d.mo_ta_chi_tiet,
    dia_chi: d.dia_chi,
    vi_do: d.vi_do !== null ? Number(d.vi_do) : null,
    kinh_do: d.kinh_do !== null ? Number(d.kinh_do) : null,
    gia_tham_quan: d.gia_tham_quan !== null ? Number(d.gia_tham_quan) : 0,
    anh_dai_dien: d.anh_dai_dien,
    noi_bat: Boolean(d.noi_bat),
    trang_thai: d.trang_thai,
    phien_ban: d.phien_ban,
    created_at: d.created_at,
    updated_at: d.updated_at,
    danh_mucs: d.dia_diem_danh_mucs ? d.dia_diem_danh_mucs.map((dm) => ({
      id: dm.danh_muc.id.toString(),
      ten_danh_muc: dm.danh_muc.ten_danh_muc,
      nhom_danh_muc_id: dm.danh_muc.nhom_danh_muc_id.toString(),
    })) : [],
    hinh_anhs: d.dia_diem_hinh_anhs ? d.dia_diem_hinh_anhs.map((img) => ({
      id: img.id.toString(),
      duong_dan: img.duong_dan,
      thu_tu: img.thu_tu,
    })) : [],
    diem_danh_gia_tb,
    so_danh_gia: countRatings,
    so_yeu_thich: d._count?.yeu_thichs || 0,
    danh_gia_danh_sach: d.danh_gias?.map((g) => ({
      id: g.id.toString(),
      so_sao: g.so_sao,
      noi_dung: g.noi_dung,
      created_at: g.created_at,
      nguoi_danh_gia: g.tai_khoan ? {
        id: g.tai_khoan.id.toString(),
        ho_ten: g.tai_khoan.ho_ten,
        anh_dai_dien: g.tai_khoan.anh_dai_dien,
      } : null,
    })) || [],
  };
};

// @desc  Lấy danh sách tỉnh / thành phố
// @route GET /api/destinations/provinces hoặc GET /api/provinces
export const getProvinces = async (req, res) => {
  try {
    const provinces = await prisma.tinh_thanh_phos.findMany({
      orderBy: { ten_tinh_thanh: 'asc' },
    });
    res.json({
      success: true,
      data: provinces.map((p) => ({
        id: p.id.toString(),
        ten_tinh_thanh: p.ten_tinh_thanh,
        ma_tinh_thanh: p.ma_tinh_thanh,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy danh sách địa điểm du lịch (PB05, PB19, UI_27)
// @route GET /api/destinations
export const getDestinations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const {
      search,
      tinh_thanh_id,
      danh_muc_id,
      trang_thai,
      noi_bat,
      sort,
    } = req.query;

    const where = {};

    // Lọc theo trạng thái xóa mềm
    if (trang_thai && trang_thai !== 'all') {
      where.trang_thai = trang_thai;
    } else if (!req.user || req.user.vai_tro !== 'admin') {
      // Người dùng bình thường chỉ xem địa điểm hiển thị
      where.trang_thai = 'hien_thi';
    }

    // Lọc theo tỉnh thành
    if (tinh_thanh_id) {
      where.tinh_thanh_id = BigInt(tinh_thanh_id);
    }

    // Lọc theo cờ nổi bật
    if (noi_bat !== undefined && noi_bat !== '') {
      where.noi_bat = noi_bat === 'true' || noi_bat === true || noi_bat === '1';
    }

    // Tìm kiếm thông minh tiếng Việt (có dấu/không dấu, hoa/thường, đa trường, chịu lỗi gõ nhầm)
    const hasSearch = Boolean(search && search.trim());

    // Lọc theo nhiều danh mục con cùng lúc (PB05)
    let catIds = [];
    const dmParam = req.query.danh_muc_ids || req.query.danh_muc_id;
    if (dmParam) {
      if (Array.isArray(dmParam)) {
        catIds = dmParam.map((id) => BigInt(id));
      } else if (typeof dmParam === 'string' && dmParam.includes(',')) {
        catIds = dmParam.split(',').map((id) => BigInt(id.trim())).filter(Boolean);
      } else {
        catIds = [BigInt(dmParam)];
      }
    }

    if (catIds.length > 0) {
      where.dia_diem_danh_mucs = {
        some: {
          danh_muc_id: { in: catIds },
        },
      };
    } else if (req.query.nhom_danh_muc_id) {
      where.dia_diem_danh_mucs = {
        some: {
          danh_muc: {
            nhom_danh_muc_id: BigInt(req.query.nhom_danh_muc_id),
          },
        },
      };
    }

    // Sắp xếp
    let orderBy = { created_at: 'desc' };
    if (sort === 'oldest') orderBy = { created_at: 'asc' };
    if (sort === 'name_asc') orderBy = { ten_dia_diem: 'asc' };
    if (sort === 'name_desc') orderBy = { ten_dia_diem: 'desc' };
    if (sort === 'price_asc') orderBy = { gia_tham_quan: 'asc' };
    if (sort === 'price_desc') orderBy = { gia_tham_quan: 'desc' };

    const includeObj = {
      tinh_thanh: true,
      dia_diem_danh_mucs: {
        include: {
          danh_muc: {
            include: { nhom_danh_muc: true },
          },
        },
      },
      dia_diem_hinh_anhs: true,
      danh_gias: {
        select: { so_sao: true },
      },
      _count: {
        select: { danh_gias: true, yeu_thichs: true },
      },
    };

    let total = 0;
    let destinations = [];

    if (hasSearch) {
      // Lấy các ứng viên khớp bộ lọc tỉnh/danh mục, chấm điểm liên quan và phân trang chuẩn xác
      const candidates = await prisma.dia_diems.findMany({
        where,
        orderBy,
        include: includeObj,
      });

      const scored = candidates
        .map((d) => ({ dest: d, score: scoreDestinationSearch(d, search.trim()) }))
        .filter((item) => item.score > 0);

      // Nếu người dùng không chọn sort cụ thể, ưu tiên xếp theo độ liên quan cao nhất
      if (!sort) {
        scored.sort((a, b) => b.score - a.score);
      }

      total = scored.length;
      destinations = scored.slice(skip, skip + limit).map((item) => item.dest);
    } else {
      [total, destinations] = await Promise.all([
        prisma.dia_diems.count({ where }),
        prisma.dia_diems.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: includeObj,
        }),
      ]);
    }

    const formatted = destinations.map(formatDestination);

    res.json({
      success: true,
      message: 'Lấy danh sách địa điểm thành công',
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy chi tiết một địa điểm du lịch (PB05, PB19)
// @route GET /api/destinations/:id
export const getDestinationById = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const destination = await prisma.dia_diems.findUnique({
      where: { id },
      include: {
        tinh_thanh: true,
        dia_diem_danh_mucs: {
          include: { danh_muc: true },
        },
        dia_diem_hinh_anhs: {
          orderBy: { thu_tu: 'asc' },
        },
        danh_gias: {
          orderBy: { created_at: 'desc' },
          include: {
            tai_khoan: {
              select: { id: true, ho_ten: true, anh_dai_dien: true },
            },
          },
        },
        _count: {
          select: { danh_gias: true, yeu_thichs: true },
        },
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm du lịch',
      });
    }

    res.json({
      success: true,
      data: formatDestination(destination),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin tạo mới địa điểm du lịch (PB19, UI_28)
// @route POST /api/destinations
export const createDestination = async (req, res) => {
  try {
    const {
      ten_dia_diem,
      tinh_thanh_id,
      mo_ta_ngan,
      mo_ta_chi_tiet,
      dia_chi,
      vi_do,
      kinh_do,
      gia_tham_quan,
      anh_dai_dien,
      noi_bat,
      danh_muc_ids,
      hinh_anh_phu,
    } = req.body;

    if (!ten_dia_diem || !ten_dia_diem.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên địa điểm du lịch không được để trống',
      });
    }

    if (!tinh_thanh_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn Tỉnh / Thành phố cho địa điểm',
      });
    }

    // Thực hiện trong Transaction để đảm bảo tính toàn vẹn
    const result = await prisma.$transaction(async (tx) => {
      // 1. Tạo địa điểm
      const newDest = await tx.dia_diems.create({
        data: {
          ten_dia_diem: ten_dia_diem.trim(),
          tinh_thanh_id: BigInt(tinh_thanh_id),
          mo_ta_ngan: mo_ta_ngan ? mo_ta_ngan.trim() : null,
          mo_ta_chi_tiet: mo_ta_chi_tiet ? mo_ta_chi_tiet.trim() : null,
          dia_chi: dia_chi ? dia_chi.trim() : null,
          vi_do: vi_do !== undefined && vi_do !== '' && vi_do !== null ? Number(vi_do) : null,
          kinh_do: kinh_do !== undefined && kinh_do !== '' && kinh_do !== null ? Number(kinh_do) : null,
          gia_tham_quan: gia_tham_quan !== undefined && gia_tham_quan !== '' && gia_tham_quan !== null ? Number(gia_tham_quan) : 0,
          anh_dai_dien: anh_dai_dien || null,
          noi_bat: Boolean(noi_bat),
          trang_thai: 'hien_thi',
          phien_ban: 1,
        },
      });

      // 2. Gắn các danh mục liên kết nếu có
      if (Array.isArray(danh_muc_ids) && danh_muc_ids.length > 0) {
        const relations = danh_muc_ids.map((dmId) => ({
          dia_diem_id: newDest.id,
          danh_muc_id: BigInt(dmId),
        }));
        await tx.dia_diem_danh_mucs.createMany({
          data: relations,
          skipDuplicates: true,
        });
      }

      // 3. Thêm danh sách ảnh phụ nếu có
      if (Array.isArray(hinh_anh_phu) && hinh_anh_phu.length > 0) {
        const images = hinh_anh_phu.map((url, idx) => ({
          dia_diem_id: newDest.id,
          duong_dan: url,
          thu_tu: idx + 1,
        }));
        await tx.dia_diem_hinh_anhs.createMany({
          data: images,
        });
      }

      return newDest;
    });

    // Lấy bản ghi đầy đủ vừa tạo
    const created = await prisma.dia_diems.findUnique({
      where: { id: result.id },
      include: {
        tinh_thanh: true,
        dia_diem_danh_mucs: { include: { danh_muc: true } },
        dia_diem_hinh_anhs: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tạo địa điểm du lịch thành công',
      data: formatDestination(created),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin cập nhật địa điểm du lịch (PB19, UI_28) - Có Optimistic Locking (phien_ban)
// @route PUT /api/destinations/:id
export const updateDestination = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const {
      ten_dia_diem,
      tinh_thanh_id,
      mo_ta_ngan,
      mo_ta_chi_tiet,
      dia_chi,
      vi_do,
      kinh_do,
      gia_tham_quan,
      anh_dai_dien,
      noi_bat,
      trang_thai,
      phien_ban,
      danh_muc_ids,
      hinh_anh_phu,
    } = req.body;

    const existing = await prisma.dia_diems.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Địa điểm du lịch không tồn tại',
      });
    }

    // 🔴 RÀNG BUỘC OPTIMISTIC LOCKING: Kiểm tra phiên bản dữ liệu
    if (phien_ban !== undefined && existing.phien_ban !== Number(phien_ban)) {
      return res.status(409).json({
        success: false,
        conflict: true,
        current_version: existing.phien_ban,
        message: 'Dữ liệu địa điểm đã được cập nhật bởi một người quản trị khác. Vui lòng tải lại trang để xem thông tin mới nhất.',
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin chính & tăng phien_ban + 1
      const updateData = {
        phien_ban: existing.phien_ban + 1,
      };

      if (ten_dia_diem !== undefined) updateData.ten_dia_diem = ten_dia_diem.trim();
      if (tinh_thanh_id !== undefined) updateData.tinh_thanh_id = BigInt(tinh_thanh_id);
      if (mo_ta_ngan !== undefined) updateData.mo_ta_ngan = mo_ta_ngan ? mo_ta_ngan.trim() : null;
      if (mo_ta_chi_tiet !== undefined) updateData.mo_ta_chi_tiet = mo_ta_chi_tiet ? mo_ta_chi_tiet.trim() : null;
      if (dia_chi !== undefined) updateData.dia_chi = dia_chi ? dia_chi.trim() : null;
      if (vi_do !== undefined) updateData.vi_do = vi_do !== '' && vi_do !== null ? Number(vi_do) : null;
      if (kinh_do !== undefined) updateData.kinh_do = kinh_do !== '' && kinh_do !== null ? Number(kinh_do) : null;
      if (gia_tham_quan !== undefined) updateData.gia_tham_quan = gia_tham_quan !== '' && gia_tham_quan !== null ? Number(gia_tham_quan) : 0;
      if (anh_dai_dien !== undefined) updateData.anh_dai_dien = anh_dai_dien || null;
      if (noi_bat !== undefined) updateData.noi_bat = Boolean(noi_bat);
      if (trang_thai !== undefined) updateData.trang_thai = trang_thai;

      const dest = await tx.dia_diems.update({
        where: { id },
        data: updateData,
      });

      // 2. Cập nhật danh mục con nếu danh sách được gửi lên
      if (Array.isArray(danh_muc_ids)) {
        await tx.dia_diem_danh_mucs.deleteMany({
          where: { dia_diem_id: id },
        });

        if (danh_muc_ids.length > 0) {
          const relations = danh_muc_ids.map((dmId) => ({
            dia_diem_id: id,
            danh_muc_id: BigInt(dmId),
          }));
          await tx.dia_diem_danh_mucs.createMany({
            data: relations,
            skipDuplicates: true,
          });
        }
      }

      // 3. Cập nhật ảnh phụ nếu có
      if (Array.isArray(hinh_anh_phu)) {
        await tx.dia_diem_hinh_anhs.deleteMany({
          where: { dia_diem_id: id },
        });

        if (hinh_anh_phu.length > 0) {
          const images = hinh_anh_phu.map((url, idx) => ({
            dia_diem_id: id,
            duong_dan: url,
            thu_tu: idx + 1,
          }));
          await tx.dia_diem_hinh_anhs.createMany({
            data: images,
          });
        }
      }

      return dest;
    });

    const fullResult = await prisma.dia_diems.findUnique({
      where: { id },
      include: {
        tinh_thanh: true,
        dia_diem_danh_mucs: { include: { danh_muc: true } },
        dia_diem_hinh_anhs: true,
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật địa điểm du lịch thành công',
      data: formatDestination(fullResult),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin bật/tắt cờ nổi bật nhanh chóng (PB19, UI_27)
// @route PATCH /api/destinations/:id/toggle-featured
export const toggleFeatured = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.dia_diems.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Địa điểm du lịch không tồn tại',
      });
    }

    const updated = await prisma.dia_diems.update({
      where: { id },
      data: {
        noi_bat: !existing.noi_bat,
        phien_ban: existing.phien_ban + 1,
      },
    });

    res.json({
      success: true,
      message: `Đã ${updated.noi_bat ? 'bật' : 'tắt'} trạng thái nổi bật cho "${updated.ten_dia_diem}"`,
      data: {
        id: updated.id.toString(),
        noi_bat: updated.noi_bat,
        phien_ban: updated.phien_ban,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin XÓA MỀM địa điểm du lịch (PB19, UI_27)
// @route DELETE /api/destinations/:id
export const deleteDestination = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.dia_diems.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Địa điểm không tồn tại',
      });
    }

    // Xóa mềm: đánh dấu trang_thai = 'da_xoa'
    const softDeleted = await prisma.dia_diems.update({
      where: { id },
      data: {
        trang_thai: 'da_xoa',
        phien_ban: existing.phien_ban + 1,
      },
    });

    res.json({
      success: true,
      message: `Đã xóa mềm địa điểm "${softDeleted.ten_dia_diem}" vào thùng rác`,
      data: {
        id: softDeleted.id.toString(),
        trang_thai: softDeleted.trang_thai,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin KHÔI PHỤC địa điểm bị xóa mềm (PB19, UI_27)
// @route PATCH /api/destinations/:id/restore
export const restoreDestination = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.dia_diems.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Địa điểm không tồn tại',
      });
    }

    const restored = await prisma.dia_diems.update({
      where: { id },
      data: {
        trang_thai: 'hien_thi',
        phien_ban: existing.phien_ban + 1,
      },
    });

    res.json({
      success: true,
      message: `Đã khôi phục địa điểm "${restored.ten_dia_diem}" thành công`,
      data: {
        id: restored.id.toString(),
        trang_thai: restored.trang_thai,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Upload ảnh địa điểm du lịch lên Supabase Storage / local
// @route POST /api/destinations/upload
export const uploadDestinationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file hình ảnh',
      });
    }

    let finalUrl = null;
    try {
      finalUrl = await uploadImageToSupabase(
        req.file.buffer,
        `dest_${Date.now()}_${req.file.originalname}`,
        req.file.mimetype
      );
    } catch (e) {
      console.warn('Lỗi upload Supabase Storage, fallback local:', e.message);
    }

    if (!finalUrl) {
      const uploadDir = path.join(process.cwd(), 'uploads/destinations');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `dest_${Date.now()}${ext}`;
      const localFilePath = path.join(uploadDir, fileName);
      fs.writeFileSync(localFilePath, req.file.buffer);
      finalUrl = `/uploads/destinations/${fileName}`;
    }

    res.json({
      success: true,
      message: 'Tải lên hình ảnh địa điểm thành công',
      data: {
        url: finalUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

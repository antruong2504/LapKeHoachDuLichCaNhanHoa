import prisma from '../config/db.js';

// Format địa điểm chuẩn TripMate
const formatDestination = (d) => {
  if (!d) return null;

  let diemTb = 4.8;
  const reviews = d.danh_gias || [];
  if (reviews.length > 0) {
    const totalScore = reviews.reduce((acc, curr) => acc + curr.so_sao, 0);
    diemTb = Number((totalScore / reviews.length).toFixed(1));
  }

  return {
    id: d.id.toString(),
    ten_dia_diem: d.ten_dia_diem,
    dia_chi: d.dia_chi,
    mo_ta_ngan: d.mo_ta_ngan,
    mo_ta_chi_tiet: d.mo_ta_chi_tiet,
    gio_mo_cua: d.gio_mo_cua,
    gio_dong_cua: d.gio_dong_cua,
    vi_do: d.vi_do ? Number(d.vi_do) : null,
    kinh_do: d.kinh_do ? Number(d.kinh_do) : null,
    gia_tham_quan: d.gia_tham_quan ? Number(d.gia_tham_quan) : 0,
    anh_dai_dien: d.anh_dai_dien,
    noi_bat: d.noi_bat,
    trang_thai: d.trang_thai,
    phien_ban: d.phien_ban,
    tinh_thanh_id: d.tinh_thanh_id ? d.tinh_thanh_id.toString() : null,
    tinh_thanh: d.tinh_thanh ? {
      id: d.tinh_thanh.id.toString(),
      ten_tinh_thanh: d.tinh_thanh.ten_tinh_thanh,
    } : null,
    danh_mucs: d.dia_diem_danh_mucs?.map((rel) => ({
      id: rel.danh_muc.id.toString(),
      ten_danh_muc: rel.danh_muc.ten_danh_muc,
    })) || [],
    diem_danh_gia_tb: diemTb,
    so_danh_gia: d._count?.danh_gias || reviews.length,
    so_yeu_thich: d._count?.yeu_thichs || 0,
  };
};

// @desc  Lấy danh sách địa điểm yêu thích của tài khoản (PB04, UI_15)
// @route GET /api/favorites
export const getMyFavorites = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const where = {
      tai_khoan_id: userId,
      dia_diem: {
        trang_thai: 'hien_thi', // Chỉ lấy địa điểm đang hoạt động
      },
    };

    const [total, favorites] = await Promise.all([
      prisma.dia_diem_yeu_thichs.count({ where }),
      prisma.dia_diem_yeu_thichs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          dia_diem: {
            include: {
              tinh_thanh: true,
              dia_diem_danh_mucs: { include: { danh_muc: true } },
              danh_gias: { select: { so_sao: true } },
              _count: { select: { danh_gias: true, yeu_thichs: true } },
            },
          },
        },
      }),
    ]);

    const formattedData = favorites.map((fav) => ({
      favorite_id: fav.id.toString(),
      ngay_luu: fav.created_at,
      destination: formatDestination(fav.dia_diem),
    }));

    res.json({
      success: true,
      message: 'Lấy danh sách yêu thích thành công',
      data: formattedData,
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

// @desc  Lấy danh sách tất cả ID địa điểm đã yêu thích của user (phục vụ highlight icon tim)
// @route GET /api/favorites/my-ids
export const getMyFavoriteIds = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const favorites = await prisma.dia_diem_yeu_thichs.findMany({
      where: { tai_khoan_id: userId },
      select: { dia_diem_id: true },
    });

    const ids = favorites.map((f) => f.dia_diem_id.toString());
    res.json({
      success: true,
      data: ids,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Thêm địa điểm vào danh sách yêu thích (PB04)
// @route POST /api/favorites/:dia_diem_id
export const addFavorite = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const destinationId = BigInt(req.params.dia_diem_id);

    // Kiểm tra địa điểm tồn tại và đang hiển thị
    const destination = await prisma.dia_diems.findUnique({
      where: { id: destinationId },
    });

    if (!destination || destination.trang_thai === 'da_xoa') {
      return res.status(404).json({
        success: false,
        message: 'Địa điểm không tồn tại hoặc đã bị xóa',
      });
    }

    // Kiểm tra đã yêu thích chưa
    const existing = await prisma.dia_diem_yeu_thichs.findUnique({
      where: {
        tai_khoan_id_dia_diem_id: {
          tai_khoan_id: userId,
          dia_diem_id: destinationId,
        },
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Địa điểm đã có trong danh sách yêu thích',
        data: { isFavorite: true },
      });
    }

    await prisma.dia_diem_yeu_thichs.create({
      data: {
        tai_khoan_id: userId,
        dia_diem_id: destinationId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu địa điểm vào danh sách yêu thích',
      data: { isFavorite: true },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Xóa địa điểm khỏi danh sách yêu thích (PB04)
// @route DELETE /api/favorites/:dia_diem_id
export const removeFavorite = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const destinationId = BigInt(req.params.dia_diem_id);

    await prisma.dia_diem_yeu_thichs.deleteMany({
      where: {
        tai_khoan_id: userId,
        dia_diem_id: destinationId,
      },
    });

    res.json({
      success: true,
      message: 'Đã xóa địa điểm khỏi danh sách yêu thích',
      data: { isFavorite: false },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Chuyển đổi trạng thái yêu thích (Toggle Thả tim / Bỏ tim)
// @route POST /api/favorites/toggle/:dia_diem_id
export const toggleFavorite = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const destinationId = BigInt(req.params.dia_diem_id);

    const destination = await prisma.dia_diems.findUnique({
      where: { id: destinationId },
    });

    if (!destination || destination.trang_thai === 'da_xoa') {
      return res.status(404).json({
        success: false,
        message: 'Địa điểm không tồn tại hoặc đã bị xóa',
      });
    }

    const existing = await prisma.dia_diem_yeu_thichs.findUnique({
      where: {
        tai_khoan_id_dia_diem_id: {
          tai_khoan_id: userId,
          dia_diem_id: destinationId,
        },
      },
    });

    if (existing) {
      await prisma.dia_diem_yeu_thichs.delete({
        where: { id: existing.id },
      });
      return res.json({
        success: true,
        message: 'Đã bỏ yêu thích địa điểm',
        data: { isFavorite: false },
      });
    } else {
      await prisma.dia_diem_yeu_thichs.create({
        data: {
          tai_khoan_id: userId,
          dia_diem_id: destinationId,
        },
      });
      return res.status(201).json({
        success: true,
        message: 'Đã thêm địa điểm vào danh sách yêu thích',
        data: { isFavorite: true },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import prisma from '../config/db.js';
import { createAndEmitNotification } from './notificationController.js';

// Helper tính lại và cập nhật điểm đánh giá trung bình vào bảng dia_diems
export const recalculateDestinationRating = async (diaDiemId) => {
  const agg = await prisma.danh_gias.aggregate({
    where: { dia_diem_id: BigInt(diaDiemId) },
    _avg: { so_sao: true },
    _count: { id: true },
  });

  const avgRating = agg._avg.so_sao ? Number(agg._avg.so_sao.toFixed(2)) : 0;
  const totalCount = agg._count.id || 0;

  await prisma.dia_diems.update({
    where: { id: BigInt(diaDiemId) },
    data: { diem_danh_gia_tb: avgRating },
  });

  return {
    diem_danh_gia_tb: Number(avgRating.toFixed(1)),
    so_danh_gia: totalCount,
  };
};

// Format review object cho JSON response
const formatReview = (r) => ({
  id: r.id.toString(),
  tai_khoan_id: r.tai_khoan_id.toString(),
  dia_diem_id: r.dia_diem_id ? r.dia_diem_id.toString() : null,
  so_sao: r.so_sao,
  noi_dung: r.noi_dung,
  created_at: r.created_at,
  nguoi_danh_gia: r.tai_khoan
    ? {
        id: r.tai_khoan.id.toString(),
        ho_ten: r.tai_khoan.ho_ten,
        anh_dai_dien: r.tai_khoan.anh_dai_dien,
      }
    : null,
});

// @desc  Gửi đánh giá 1-5 sao cho địa điểm (PB10 - UI_16)
// @route POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dia_diem_id, so_sao, noi_dung } = req.body;

    // 1. Validation dữ liệu đầu vào
    if (!dia_diem_id || isNaN(dia_diem_id)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID địa điểm hợp lệ',
        errors: [{ field: 'dia_diem_id', message: 'ID địa điểm không hợp lệ' }],
      });
    }

    const stars = Number(so_sao);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        message: 'Số sao đánh giá phải là số nguyên từ 1 đến 5',
        errors: [{ field: 'so_sao', message: 'Số sao phải từ 1 đến 5' }],
      });
    }

    const cleanContent = noi_dung ? noi_dung.trim() : '';
    if (!cleanContent) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung nhận xét cho địa điểm',
        errors: [{ field: 'noi_dung', message: 'Nội dung nhận xét không được để trống' }],
      });
    }

    // 2. Kiểm tra địa điểm tồn tại và đang hiển thị
    const destination = await prisma.dia_diems.findFirst({
      where: {
        id: BigInt(dia_diem_id),
        trang_thai: 'hien_thi',
      },
    });

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa điểm du lịch hoặc địa điểm đã ngừng hoạt động',
      });
    }

    // 3. Tạo đánh giá mới trong bảng danh_gias
    const createdReview = await prisma.danh_gias.create({
      data: {
        tai_khoan_id: BigInt(userId),
        dia_diem_id: BigInt(dia_diem_id),
        so_sao: stars,
        noi_dung: cleanContent,
      },
      include: {
        tai_khoan: {
          select: { id: true, ho_ten: true, anh_dai_dien: true },
        },
      },
    });

    // 4. Cập nhật điểm đánh giá trung bình vào bảng dia_diems
    const ratingSummary = await recalculateDestinationRating(dia_diem_id);

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá địa điểm thành công',
      data: {
        review: formatReview(createdReview),
        diem_danh_gia_tb: ratingSummary.diem_danh_gia_tb,
        so_danh_gia: ratingSummary.so_danh_gia,
      },
    });
  } catch (error) {
    console.error('Lỗi createReview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy danh sách đánh giá của 1 địa điểm
// @route GET /api/reviews/destination/:dia_diem_id
export const getReviewsByDestination = async (req, res) => {
  try {
    const { dia_diem_id } = req.params;
    if (!dia_diem_id || isNaN(dia_diem_id)) {
      return res.status(400).json({
        success: false,
        message: 'ID địa điểm không hợp lệ',
      });
    }

    const reviews = await prisma.danh_gias.findMany({
      where: { dia_diem_id: BigInt(dia_diem_id) },
      orderBy: { created_at: 'desc' },
      include: {
        tai_khoan: {
          select: { id: true, ho_ten: true, anh_dai_dien: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data: reviews.map(formatReview),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Xóa đánh giá (Chủ sở hữu hoặc Admin)
// @route DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const reviewId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    const isAdmin = req.user.vai_tro === 'admin';

    const existing = await prisma.danh_gias.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
    }

    if (existing.tai_khoan_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa đánh giá này',
      });
    }

    await prisma.danh_gias.delete({
      where: { id: reviewId },
    });

    let ratingSummary = null;
    if (existing.dia_diem_id) {
      ratingSummary = await recalculateDestinationRating(existing.dia_diem_id);
    }

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công',
      data: ratingSummary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin lấy danh sách đánh giá (hỗ trợ lọc số sao & tìm kiếm) (PB17 - UI_37)
// @route GET /api/admin/reviews
export const getAdminReviews = async (req, res) => {
  try {
    const { so_sao, search, page = 1, limit = 10 } = req.query;
    const take = Math.max(1, Number(limit) || 10);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const whereClause = {
      ...(so_sao && Number(so_sao) >= 1 && Number(so_sao) <= 5 ? { so_sao: Number(so_sao) } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { noi_dung: { contains: search.trim(), mode: 'insensitive' } },
              { tai_khoan: { ho_ten: { contains: search.trim(), mode: 'insensitive' } } },
              { dia_diem: { ten_dia_diem: { contains: search.trim(), mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, reviews] = await Promise.all([
      prisma.danh_gias.count({ where: whereClause }),
      prisma.danh_gias.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: {
          tai_khoan: {
            select: { id: true, ho_ten: true, email: true, anh_dai_dien: true },
          },
          dia_diem: {
            select: { id: true, ten_dia_diem: true, anh_dai_dien: true, diem_danh_gia_tb: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Lấy danh sách quản lý đánh giá thành công',
      data: reviews.map((r) => ({
        ...formatReview(r),
        tai_khoan: r.tai_khoan
          ? {
              id: r.tai_khoan.id.toString(),
              ho_ten: r.tai_khoan.ho_ten,
              email: r.tai_khoan.email,
              anh_dai_dien: r.tai_khoan.anh_dai_dien,
            }
          : null,
        dia_diem: r.dia_diem
          ? {
              id: r.dia_diem.id.toString(),
              ten_dia_diem: r.dia_diem.ten_dia_diem,
              anh_dai_dien: r.dia_diem.anh_dai_dien,
              diem_danh_gia_tb: r.dia_diem.diem_danh_gia_tb ? Number(r.dia_diem.diem_danh_gia_tb) : 0,
            }
          : null,
        created_at_vn: new Date(r.created_at).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        }),
      })),
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin xóa đánh giá kèm lý do bắt buộc, tính lại điểm TB địa điểm & gửi thông báo UTC+7 (PB17 - UI_39)
// @route DELETE /api/admin/reviews/:id
export const adminDeleteReview = async (req, res) => {
  try {
    const reviewId = BigInt(req.params.id);
    const { ly_do } = req.body || {};

    if (!ly_do || !ly_do.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do xóa đánh giá',
        errors: [{ field: 'ly_do', message: 'Lý do xóa là bắt buộc' }],
      });
    }

    const existing = await prisma.danh_gias.findUnique({
      where: { id: reviewId },
      include: {
        dia_diem: { select: { id: true, ten_dia_diem: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá cần xóa',
      });
    }

    await prisma.danh_gias.delete({
      where: { id: reviewId },
    });

    let updatedRating = null;
    if (existing.dia_diem_id) {
      updatedRating = await recalculateDestinationRating(existing.dia_diem_id);
    }

    const io = req.app.get('io');
    const targetName = existing.dia_diem?.ten_dia_diem || 'địa điểm du lịch';
    const notification = await createAndEmitNotification(io, {
      tai_khoan_id: existing.tai_khoan_id,
      tieu_de: 'Đánh giá của bạn đã bị gỡ bỏ',
      noi_dung: `Đánh giá (${existing.so_sao} sao) của bạn tại "${targetName}" đã bị Quản trị viên xóa. Lý do: ${ly_do.trim()}`,
      loai_thong_bao: 'xoa_noi_dung',
    });

    res.json({
      success: true,
      message: 'Đã xóa đánh giá, cập nhật lại điểm trung bình & gửi thông báo tới tác giả',
      data: {
        deleted_review_id: reviewId.toString(),
        updated_rating: updatedRating,
        notification,
      },
    });
  } catch (error) {
    console.error('Lỗi adminDeleteReview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

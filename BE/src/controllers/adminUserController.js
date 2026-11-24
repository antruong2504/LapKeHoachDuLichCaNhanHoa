import prisma from '../config/db.js';
import { createAndEmitNotification } from './notificationController.js';

const formatAdminUser = (u) => ({
  id: u.id.toString(),
  ten_dang_nhap: u.ten_dang_nhap,
  ho_ten: u.ho_ten,
  email: u.email,
  so_dien_thoai: u.so_dien_thoai,
  anh_dai_dien: u.anh_dai_dien,
  vai_tro: u.vai_tro,
  trang_thai: u.trang_thai,
  ly_do_khoa: u.ly_do_khoa,
  thoi_gian_khoa: u.thoi_gian_khoa,
  thoi_gian_khoa_vn: u.thoi_gian_khoa
    ? new Date(u.thoi_gian_khoa).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : null,
  created_at: u.created_at,
  created_at_vn: new Date(u.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
  so_lich_trinh: u._count?.lich_trinhs ?? 0,
  so_cam_nang: u._count?.cam_nangs ?? 0,
  so_danh_gia: u._count?.danh_gias ?? 0,
});

// @desc  Admin lấy danh sách tài khoản người dùng phân trang 10 dòng (PB16 - UI_31)
// @route GET /api/admin/users
export const getAdminUsers = async (req, res) => {
  try {
    const { search, trang_thai, vai_tro, page = 1, limit = 10 } = req.query;
    const take = Math.max(1, Number(limit) || 10);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const whereClause = {
      ...(trang_thai && ['hoat_dong', 'bi_khoa'].includes(trang_thai) ? { trang_thai } : {}),
      ...(vai_tro && ['khach_hang', 'admin'].includes(vai_tro) ? { vai_tro } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { ho_ten: { contains: search.trim(), mode: 'insensitive' } },
              { ten_dang_nhap: { contains: search.trim(), mode: 'insensitive' } },
              { email: { contains: search.trim(), mode: 'insensitive' } },
              { so_dien_thoai: { contains: search.trim() } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.tai_khoans.count({ where: whereClause }),
      prisma.tai_khoans.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: {
          _count: {
            select: {
              lich_trinhs: true,
              cam_nangs: true,
              danh_gias: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Lấy danh sách tài khoản người dùng thành công',
      data: users.map(formatAdminUser),
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

// @desc  Admin khóa / mở khóa tài khoản kèm lý do bắt buộc, lưu thời gian khóa UTC+7 & gửi thông báo (PB16 - UI_32, UI_33)
// @route PATCH /api/admin/users/:id/status
export const toggleUserStatus = async (req, res) => {
  try {
    const targetUserId = BigInt(req.params.id);
    const currentAdminId = BigInt(req.user.id);
    const { trang_thai, ly_do_khoa, ly_do } = req.body || {};
    const reasonText = (ly_do_khoa ?? ly_do ?? '').trim();

    if (!['hoat_dong', 'bi_khoa'].includes(trang_thai)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái tài khoản phải là "hoat_dong" hoặc "bi_khoa"',
      });
    }

    if (targetUserId === currentAdminId && trang_thai === 'bi_khoa') {
      return res.status(400).json({
        success: false,
        message: 'Không thể tự khóa tài khoản quản trị viên đang đăng nhập',
      });
    }

    if (trang_thai === 'bi_khoa' && !reasonText) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do khóa tài khoản',
        errors: [{ field: 'ly_do_khoa', message: 'Lý do khóa là bắt buộc' }],
      });
    }

    const targetUser = await prisma.tai_khoans.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng',
      });
    }

    const isLocking = trang_thai === 'bi_khoa';
    const lockTimestamp = isLocking ? new Date() : null;

    const updated = await prisma.tai_khoans.update({
      where: { id: targetUserId },
      data: {
        trang_thai,
        ly_do_khoa: isLocking ? reasonText : null,
        thoi_gian_khoa: lockTimestamp,
      },
      include: {
        _count: {
          select: {
            lich_trinhs: true,
            cam_nangs: true,
            danh_gias: true,
          },
        },
      },
    });

    // Gửi thông báo UTC+7 tới người dùng
    const io = req.app.get('io');
    const timeVn = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const notification = await createAndEmitNotification(io, {
      tai_khoan_id: targetUserId,
      tieu_de: isLocking ? 'Tài khoản của bạn đã bị tạm khóa' : 'Tài khoản của bạn đã được mở khóa',
      noi_dung: isLocking
        ? `Tài khoản bị khóa lúc ${timeVn} (UTC+7). Lý do: ${reasonText}`
        : `Tài khoản đã được Quản trị viên mở khóa lúc ${timeVn} (UTC+7).${reasonText ? ` Ghi chú: ${reasonText}` : ''}`,
      loai_thong_bao: isLocking ? 'khoa_tai_khoan' : 'he_thong',
    });

    res.json({
      success: true,
      message: isLocking
        ? 'Đã khóa tài khoản và gửi thông báo thành công'
        : 'Đã mở khóa tài khoản và gửi thông báo thành công',
      data: {
        user: formatAdminUser(updated),
        notification,
      },
    });
  } catch (error) {
    console.error('Lỗi toggleUserStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

/**
 * Middleware xác thực Access Token JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thực hiện chức năng này',
        data: null,
        errors: [{ field: 'token', message: 'Không tìm thấy Bearer token' }],
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Kiểm tra tài khoản trong database
    const user = await prisma.tai_khoans.findUnique({
      where: { id: BigInt(decoded.id) },
      select: {
        id: true,
        ten_dang_nhap: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        vai_tro: true,
        trang_thai: true,
        anh_dai_dien: true,
        ly_do_khoa: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống',
        data: null,
      });
    }

    // Kiểm tra tài khoản có bị khóa không (PB02, PB16)
    if (user.trang_thai === 'bi_khoa') {
      return res.status(403).json({
        success: false,
        message: `Tài khoản của bạn đã bị khóa. Lý do: ${user.ly_do_khoa || 'Vi phạm điều khoản cộng đồng'}`,
        data: { trang_thai: 'bi_khoa', ly_do_khoa: user.ly_do_khoa },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ',
      data: null,
      errors: error.message,
    });
  }
};

/**
 * Middleware phân quyền Admin (RBAC)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.vai_tro !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập khu vực Quản trị viên',
      data: null,
    });
  }
  next();
};

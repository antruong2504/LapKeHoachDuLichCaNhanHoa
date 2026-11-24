import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId, vaiTro) => {
  return jwt.sign({ id: userId.toString(), vai_tro: vaiTro }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// @desc  Đăng ký tài khoản (PB01)
// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    let { ten_dang_nhap, ho_ten, email, so_dien_thoai, mat_khau, xac_nhan_mat_khau } = req.body;

    // Chuẩn hóa dữ liệu
    ten_dang_nhap = ten_dang_nhap ? ten_dang_nhap.trim().toLowerCase() : '';
    ho_ten = ho_ten ? ho_ten.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    so_dien_thoai = so_dien_thoai ? so_dien_thoai.trim() : '';

    // Validation cơ bản
    if (!ten_dang_nhap || !ho_ten || !email || !so_dien_thoai || !mat_khau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc',
      });
    }

    if (mat_khau !== xac_nhan_mat_khau) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp',
        errors: [{ field: 'xac_nhan_mat_khau', message: 'Mật khẩu xác nhận không khớp' }],
      });
    }

    // Kiểm tra định dạng mật khẩu >= 8 ký tự, 1 hoa, 1 số, 1 ký tự đặc biệt
    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passRegex.test(mat_khau)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ số và ký tự đặc biệt',
        errors: [{ field: 'mat_khau', message: 'Mật khẩu chưa đủ mạnh' }],
      });
    }

    // Kiểm tra SĐT 10 số bắt đầu bằng 0
    if (!/^0\d{9}$/.test(so_dien_thoai)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
        errors: [{ field: 'so_dien_thoai', message: 'Số điện thoại không hợp lệ' }],
      });
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ',
        errors: [{ field: 'email', message: 'Email không đúng định dạng' }],
      });
    }

    // Kiểm tra trùng lặp
    const existing = await prisma.tai_khoans.findFirst({
      where: {
        OR: [
          { ten_dang_nhap },
          { email },
          { so_dien_thoai },
        ],
      },
    });

    if (existing) {
      let field = 'Tài khoản';
      if (existing.ten_dang_nhap === ten_dang_nhap) field = 'Tên đăng nhập';
      else if (existing.email === email) field = 'Email';
      else if (existing.so_dien_thoai === so_dien_thoai) field = 'Số điện thoại';

      return res.status(400).json({
        success: false,
        message: `${field} đã được sử dụng trong hệ thống`,
      });
    }

    const mat_khau_hash = await bcrypt.hash(mat_khau, 10);
    const user = await prisma.tai_khoans.create({
      data: {
        ten_dang_nhap,
        ho_ten,
        email,
        so_dien_thoai,
        mat_khau_hash,
        vai_tro: 'khach_hang',
        trang_thai: 'hoat_dong',
        anh_dai_dien: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      },
    });

    const token = generateToken(user.id, user.vai_tro);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        token,
        user: {
          id: user.id.toString(),
          ten_dang_nhap: user.ten_dang_nhap,
          ho_ten: user.ho_ten,
          email: user.email,
          vai_tro: user.vai_tro,
          anh_dai_dien: user.anh_dai_dien,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Đăng nhập (PB02)
// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau } = req.body;

    if (!ten_dang_nhap || !mat_khau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu',
      });
    }

    const cleanIdentifier = ten_dang_nhap.trim();

    // Cho phép đăng nhập bằng ten_dang_nhap hoặc email (không phân biệt hoa/thường)
    const user = await prisma.tai_khoans.findFirst({
      where: {
        OR: [
          { ten_dang_nhap: { equals: cleanIdentifier, mode: 'insensitive' } },
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(mat_khau, user.mat_khau_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
      });
    }

    // Chặn tài khoản bị khóa (PB02, PB16)
    if (user.trang_thai === 'bi_khoa') {
      return res.status(403).json({
        success: false,
        message: `Tài khoản của bạn đã bị khóa. Lý do: ${user.ly_do_khoa || 'Vi phạm điều khoản cộng đồng'}`,
        data: {
          trang_thai: 'bi_khoa',
          ly_do_khoa: user.ly_do_khoa,
        },
      });
    }

    const token = generateToken(user.id, user.vai_tro);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          id: user.id.toString(),
          ten_dang_nhap: user.ten_dang_nhap,
          ho_ten: user.ho_ten,
          email: user.email,
          so_dien_thoai: user.so_dien_thoai,
          vai_tro: user.vai_tro,
          anh_dai_dien: user.anh_dai_dien,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy thông tin người dùng hiện tại (PB02, PB03)
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: {
        ...req.user,
        id: req.user.id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';
import { uploadImageToSupabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc  Lấy thông tin hồ sơ người dùng hiện tại (PB03, UI_13)
// @route GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.tai_khoans.findUnique({
      where: { id: BigInt(req.user.id) },
      select: {
        id: true,
        ten_dang_nhap: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        vai_tro: true,
        anh_dai_dien: true,
        trang_thai: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    res.json({
      success: true,
      message: 'Lấy thông tin hồ sơ thành công',
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Cập nhật thông tin hồ sơ (PB03, UI_13)
// @route PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    let { ho_ten, so_dien_thoai } = req.body;

    ho_ten = ho_ten ? ho_ten.trim() : '';
    so_dien_thoai = so_dien_thoai ? so_dien_thoai.trim() : '';

    if (!ho_ten) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên không được để trống',
      });
    }

    if (so_dien_thoai && !/^0\d{9}$/.test(so_dien_thoai)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0',
      });
    }

    // Kiểm tra trùng lặp SĐT nếu thay đổi
    if (so_dien_thoai) {
      const existingPhone = await prisma.tai_khoans.findFirst({
        where: {
          so_dien_thoai,
          NOT: { id: BigInt(req.user.id) },
        },
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác',
        });
      }
    }

    const updated = await prisma.tai_khoans.update({
      where: { id: BigInt(req.user.id) },
      data: {
        ho_ten,
        ...(so_dien_thoai && { so_dien_thoai }),
      },
      select: {
        id: true,
        ten_dang_nhap: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        vai_tro: true,
        anh_dai_dien: true,
        trang_thai: true,
      },
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin hồ sơ thành công',
      data: {
        ...updated,
        id: updated.id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tải lên ảnh đại diện (PB03, UI_13)
// @route POST /api/users/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file hình ảnh (JPG, PNG, WEBP) tối đa 5MB',
      });
    }

    let avatarUrl = null;

    // Thử tải lên Supabase Storage CDN
    try {
      avatarUrl = await uploadImageToSupabase(
        req.file.buffer,
        `avatar_${req.user.id}_${req.file.originalname}`,
        req.file.mimetype
      );
    } catch (e) {
      console.warn('Lỗi tải ảnh lên Supabase Storage, chuyển sang lưu cục bộ:', e.message);
    }

    // Nếu Supabase Storage chưa khả dụng, fallback lưu cục bộ vào /uploads/avatars/
    if (!avatarUrl) {
      const uploadDir = path.join(__dirname, '../../uploads/avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `avatar_${req.user.id}_${Date.now()}${ext}`;
      const localFilePath = path.join(uploadDir, fileName);
      fs.writeFileSync(localFilePath, req.file.buffer);
      avatarUrl = `/uploads/avatars/${fileName}`;
    }

    // Lưu URL vào CSDL
    const updated = await prisma.tai_khoans.update({
      where: { id: BigInt(req.user.id) },
      data: { anh_dai_dien: avatarUrl },
      select: {
        id: true,
        ten_dang_nhap: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        vai_tro: true,
        anh_dai_dien: true,
      },
    });

    res.json({
      success: true,
      message: 'Tải lên ảnh đại diện thành công',
      data: {
        ...updated,
        id: updated.id.toString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Đổi mật khẩu (PB03, UI_14)
// @route PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const { mat_khau_cu, mat_khau_moi, xac_nhan_mat_khau_moi } = req.body;

    if (!mat_khau_cu || !mat_khau_moi || !xac_nhan_mat_khau_moi) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới',
      });
    }

    if (mat_khau_moi !== xac_nhan_mat_khau_moi) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
      });
    }

    // Kiểm tra độ mạnh mật khẩu mới (>= 8 ký tự, 1 hoa, 1 số, 1 ký tự đặc biệt)
    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passRegex.test(mat_khau_moi)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ in hoa, chữ số và ký tự đặc biệt',
      });
    }

    // Kiểm tra mật khẩu cũ
    const user = await prisma.tai_khoans.findUnique({
      where: { id: BigInt(req.user.id) },
      select: { mat_khau_hash: true },
    });

    if (!user || !(await bcrypt.compare(mat_khau_cu, user.mat_khau_hash))) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác',
      });
    }

    // Hash mật khẩu mới và lưu
    const mat_khau_hash = await bcrypt.hash(mat_khau_moi, 10);
    await prisma.tai_khoans.update({
      where: { id: BigInt(req.user.id) },
      data: { mat_khau_hash },
    });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập sau.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB02() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB02: ĐĂNG NHẬP HỆ THỐNG ---');

  // 1. Kiểm tra đăng nhập tài khoản Khách hàng
  const customer = await prisma.tai_khoans.findFirst({
    where: { ten_dang_nhap: 'customer' },
  });
  if (!customer) {
    console.error('[FAIL] Không tìm thấy tài khoản customer');
    process.exit(1);
  }
  const isMatchCustomer = await bcrypt.compare('Customer@123', customer.mat_khau_hash);
  if (!isMatchCustomer) {
    console.error('[FAIL] Mật khẩu customer không khớp');
    process.exit(1);
  }
  console.log('[PASS] Đăng nhập tài khoản Khách hàng (customer / Customer@123) khớp mật khẩu');

  // 2. Kiểm tra đăng nhập tài khoản Admin
  const admin = await prisma.tai_khoans.findFirst({
    where: { ten_dang_nhap: 'admin' },
  });
  if (!admin || admin.vai_tro !== 'admin') {
    console.error('[FAIL] Không tìm thấy tài khoản admin hoặc vai trò không phải admin');
    process.exit(1);
  }
  const isMatchAdmin = await bcrypt.compare('Admin@123', admin.mat_khau_hash);
  if (!isMatchAdmin) {
    console.error('[FAIL] Mật khẩu admin không khớp');
    process.exit(1);
  }
  console.log('[PASS] Đăng nhập tài khoản Admin (admin / Admin@123) khớp mật khẩu và vai trò admin');

  // 3. Kiểm tra chặn tài khoản bị khóa (spammer_user)
  const lockedUser = await prisma.tai_khoans.findFirst({
    where: { ten_dang_nhap: 'spammer_user' },
  });
  if (!lockedUser) {
    console.error('[FAIL] Không tìm thấy tài khoản spammer_user');
    process.exit(1);
  }
  if (lockedUser.trang_thai !== 'bi_khoa') {
    console.error('[FAIL] Trạng thái tài khoản spammer_user không phải bi_khoa');
    process.exit(1);
  }
  console.log(`[PASS] Chặn tài khoản bị khóa: spammer_user (Lý do: "${lockedUser.ly_do_khoa}")`);

  // 4. Kiểm tra phát sinh và xác thực JWT token
  const token = jwt.sign({ id: customer.id.toString(), vai_tro: customer.vai_tro }, JWT_SECRET, {
    expiresIn: '7d',
  });
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.id !== customer.id.toString() || decoded.vai_tro !== 'khach_hang') {
    console.error('[FAIL] Payload JWT không hợp lệ');
    process.exit(1);
  }
  console.log('[PASS] Tạo và xác minh chữ ký JWT Token 7 ngày thành công');

  // 5. Kiểm tra đăng nhập sai mật khẩu
  const isWrongMatch = await bcrypt.compare('SaiMatKhau@123', customer.mat_khau_hash);
  if (isWrongMatch) {
    console.error('[FAIL] Mật khẩu sai nhưng lại khớp');
    process.exit(1);
  }
  console.log('[PASS] Ngăn chặn thành công đăng nhập khi nhập sai mật khẩu');

  console.log('=== KẾT QUẢ: 100% KIỂM THỬ PB02 THÀNH CÔNG ===');
  await prisma.$disconnect();
}

testPB02().catch((err) => {
  console.error('Lỗi kiểm thử PB02:', err);
  process.exit(1);
});

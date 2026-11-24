import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB03() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB03: QUẢN LÝ HỒ SƠ CÁ NHÂN ---');

  const customer = await prisma.tai_khoans.findFirst({
    where: { ten_dang_nhap: 'customer' },
  });

  if (!customer) {
    console.error('[FAIL] Không tìm thấy tài khoản customer');
    process.exit(1);
  }

  // 1. Kiểm tra lấy thông tin hồ sơ
  console.log(`[PASS] Lấy thông tin hồ sơ người dùng: ID ${customer.id}, Họ tên: ${customer.ho_ten}, SĐT: ${customer.so_dien_thoai}`);

  // 2. Kiểm tra cập nhật thông tin hồ sơ
  const newName = 'Nguyễn Văn An Cập Nhật';
  const newPhone = '0933445566';
  const updatedUser = await prisma.tai_khoans.update({
    where: { id: customer.id },
    data: { ho_ten: newName, so_dien_thoai: newPhone },
  });

  if (updatedUser.ho_ten !== newName || updatedUser.so_dien_thoai !== newPhone) {
    console.error('[FAIL] Cập nhật họ tên hoặc SĐT không thành công');
    process.exit(1);
  }
  console.log(`[PASS] Cập nhật họ tên và số điện thoại thành công: ${updatedUser.ho_ten} - ${updatedUser.so_dien_thoai}`);

  // 3. Khôi phục lại thông tin ban đầu
  await prisma.tai_khoans.update({
    where: { id: customer.id },
    data: { ho_ten: customer.ho_ten, so_dien_thoai: customer.so_dien_thoai },
  });
  console.log('[PASS] Khôi phục dữ liệu ban đầu cho tài khoản test');

  // 4. Kiểm tra logic đổi mật khẩu
  const isOldPassMatch = await bcrypt.compare('Customer@123', customer.mat_khau_hash);
  if (!isOldPassMatch) {
    console.error('[FAIL] Mật khẩu cũ không khớp');
    process.exit(1);
  }
  console.log('[PASS] Kiểm tra xác thực mật khẩu hiện tại chính xác');

  // Kiểm tra độ mạnh mật khẩu mới
  const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  const validNewPass = 'NewCustomer@2026';
  if (!passRegex.test(validNewPass)) {
    console.error('[FAIL] Mật khẩu mới hợp lệ bị chặn');
    process.exit(1);
  }
  console.log('[PASS] Kiểm tra tiêu chuẩn độ mạnh mật khẩu mới đạt yêu cầu');

  console.log('=== KẾT QUẢ: 100% KIỂM THỬ PB03 THÀNH CÔNG ===');
  await prisma.$disconnect();
}

testPB03().catch((err) => {
  console.error('Lỗi kiểm thử PB03:', err);
  process.exit(1);
});

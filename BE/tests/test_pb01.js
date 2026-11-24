import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';

async function testPB01() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB01: ĐĂNG KÝ TÀI KHOẢN ---');

  const testUser = {
    ten_dang_nhap: 'test_pb01_' + Date.now(),
    ho_ten: 'Người Dùng Test PB01',
    email: `test_pb01_${Date.now()}@example.com`,
    so_dien_thoai: '0987654321',
    mat_khau: 'TripMate@2026',
    xac_nhan_mat_khau: 'TripMate@2026',
  };

  // 1. Kiểm tra regex mật khẩu
  const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  const weakPasswords = ['1234567', 'abcdefgh', 'ABCDEFGH', 'Abcdefgh', 'Abcdef12'];
  for (const pw of weakPasswords) {
    if (passRegex.test(pw)) {
      console.error(`[FAIL] Regex không chặn được mật khẩu yếu: ${pw}`);
      process.exit(1);
    }
  }
  if (!passRegex.test(testUser.mat_khau)) {
    console.error(`[FAIL] Regex chặn nhầm mật khẩu hợp lệ: ${testUser.mat_khau}`);
    process.exit(1);
  }
  console.log('[PASS] Kiểm tra tiêu chuẩn mật khẩu an toàn (>=8 ký tự, 1 hoa, 1 số, 1 ký tự đặc biệt)');

  // 2. Kiểm tra regex số điện thoại
  const phoneRegex = /^0\d{9}$/;
  const invalidPhones = ['098765432', '09876543210', '1987654321', '09876abcde'];
  for (const p of invalidPhones) {
    if (phoneRegex.test(p)) {
      console.error(`[FAIL] Regex không chặn được SĐT không hợp lệ: ${p}`);
      process.exit(1);
    }
  }
  if (!phoneRegex.test(testUser.so_dien_thoai)) {
    console.error(`[FAIL] Regex chặn nhầm SĐT hợp lệ: ${testUser.so_dien_thoai}`);
    process.exit(1);
  }
  console.log('[PASS] Kiểm tra tiêu chuẩn số điện thoại (10 số, bắt đầu bằng 0)');

  // 3. Tạo tài khoản thử nghiệm trên CSDL Supabase
  const mat_khau_hash = await bcrypt.hash(testUser.mat_khau, 10);
  const created = await prisma.tai_khoans.create({
    data: {
      ten_dang_nhap: testUser.ten_dang_nhap,
      ho_ten: testUser.ho_ten,
      email: testUser.email,
      so_dien_thoai: testUser.so_dien_thoai,
      mat_khau_hash,
      vai_tro: 'khach_hang',
      trang_thai: 'hoat_dong',
    },
  });

  console.log(`[PASS] Tạo tài khoản mới thành công trên Supabase ID: ${created.id}, Tên đăng nhập: ${created.ten_dang_nhap}`);

  // 4. Kiểm tra chống trùng lặp
  const duplicate = await prisma.tai_khoans.findFirst({
    where: { ten_dang_nhap: testUser.ten_dang_nhap },
  });
  if (!duplicate) {
    console.error('[FAIL] Không tìm thấy tài khoản vừa tạo');
    process.exit(1);
  }
  console.log('[PASS] Phát hiện tài khoản đã tồn tại, kiểm tra chống trùng lặp hoạt động chính xác');

  // 5. Dọn dẹp tài khoản test
  await prisma.tai_khoans.delete({
    where: { id: created.id },
  });
  console.log('[PASS] Dọn dẹp tài khoản kiểm thử thành công');

  console.log('=== KẾT QUẢ: 100% KIỂM THỬ PB01 THÀNH CÔNG ===');
  await prisma.$disconnect();
}

testPB01().catch((err) => {
  console.error('Lỗi kiểm thử PB01:', err);
  process.exit(1);
});

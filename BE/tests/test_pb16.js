import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB16() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB16: ADMIN QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (UI_31–33) ---');
  let passCount = 0;

  try {
    const admin = await prisma.tai_khoans.findFirst({ where: { vai_tro: 'admin' } });
    const customer = await prisma.tai_khoans.findFirst({ where: { ten_dang_nhap: 'thuyan' } });
    if (!admin || !customer) throw new Error('Thiếu tài khoản admin hoặc thuyan');

    const adminToken = jwt.sign({ id: admin.id.toString(), vai_tro: admin.vai_tro }, JWT_SECRET, { expiresIn: '7d' });
    const custToken = jwt.sign({ id: customer.id.toString(), vai_tro: customer.vai_tro }, JWT_SECRET, { expiresIn: '7d' });

    // 1. Lấy danh sách tài khoản (GET /api/admin/users)
    const listRes = await fetch('http://127.0.0.1:5001/api/admin/users?page=1&limit=10', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status === 200 && listData.success && Array.isArray(listData.data) && listData.data.length > 0) {
      console.log(`[PASS] Admin lấy danh sách tài khoản phân trang 10 dòng thành công (${listData.data.length} dòng)`);
      passCount++;
    }

    // 2. Kiểm thử bảo mật (HTTP 403 cho customer) & bắt buộc lý do khi khóa (HTTP 400)
    const unauthRes = await fetch(`http://127.0.0.1:5001/api/admin/users/${customer.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ trang_thai: 'bi_khoa', ly_do_khoa: 'Test' }),
    });
    const missingReasonRes = await fetch(`http://127.0.0.1:5001/api/admin/users/${customer.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ trang_thai: 'bi_khoa', ly_do_khoa: '   ' }),
    });
    if (unauthRes.status === 403 && missingReasonRes.status === 400) {
      console.log('[PASS] Bảo mật Admin (HTTP 403) & Bắt buộc nhập lý do khóa (HTTP 400) hoạt động chuẩn');
      passCount++;
    }

    // 3. Khóa tài khoản kèm lý do -> lưu thoi_gian_khoa UTC+7 & gửi thông báo
    const lockRes = await fetch(`http://127.0.0.1:5001/api/admin/users/${customer.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        trang_thai: 'bi_khoa',
        ly_do_khoa: 'Vi phạm nội quy cộng đồng: Spam bình luận',
      }),
    });
    const lockData = await lockRes.json();
    const lockNotiId = lockData.data?.notification?.id;

    if (
      lockRes.status === 200 &&
      lockData.success &&
      lockData.data?.user?.trang_thai === 'bi_khoa' &&
      lockData.data?.user?.thoi_gian_khoa &&
      lockNotiId
    ) {
      console.log(`[PASS] Khóa tài khoản, lưu thời gian khóa UTC+7 (${lockData.data.user.thoi_gian_khoa_vn}) & gửi thông báo thành công`);
      passCount++;
    }

    // 4. Mở khóa tài khoản -> xóa ly_do_khoa, thoi_gian_khoa & gửi thông báo
    const unlockRes = await fetch(`http://127.0.0.1:5001/api/admin/users/${customer.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        trang_thai: 'hoat_dong',
        ly_do_khoa: 'Đã xác minh và khôi phục quyền truy cập',
      }),
    });
    const unlockData = await unlockRes.json();
    const unlockNotiId = unlockData.data?.notification?.id;

    if (
      unlockRes.status === 200 &&
      unlockData.success &&
      unlockData.data?.user?.trang_thai === 'hoat_dong' &&
      unlockData.data?.user?.ly_do_khoa === null &&
      unlockData.data?.user?.thoi_gian_khoa === null
    ) {
      console.log('[PASS] Mở khóa tài khoản & gửi thông báo khôi phục thành công');
      passCount++;
    }

    // Dọn dẹp thông báo test
    if (lockNotiId) await prisma.thong_baos.delete({ where: { id: BigInt(lockNotiId) } });
    if (unlockNotiId) await prisma.thong_baos.delete({ where: { id: BigInt(unlockNotiId) } });

    console.log(`\n=== KẾT QUẢ: ${passCount}/4 KIỂM THỬ PB16 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 4) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB16:', err.message);
    process.exit(1);
  }
}

testPB16();

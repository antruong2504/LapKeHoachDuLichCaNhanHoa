import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB18() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB18: ADMIN TỔNG QUAN, THỐNG KÊ & BÁO CÁO (UI_26) ---');
  let passCount = 0;

  try {
    const admin = await prisma.tai_khoans.findFirst({ where: { vai_tro: 'admin' } });
    const customer = await prisma.tai_khoans.findFirst({ where: { vai_tro: 'khach_hang' } });
    if (!admin || !customer) throw new Error('Thiếu tài khoản admin hoặc customer');

    const adminToken = jwt.sign({ id: admin.id.toString(), vai_tro: admin.vai_tro }, JWT_SECRET, { expiresIn: '7d' });
    const custToken = jwt.sign({ id: customer.id.toString(), vai_tro: customer.vai_tro }, JWT_SECRET, { expiresIn: '7d' });

    // 1. Bảo mật Admin: Customer không được truy cập /api/admin/stats -> HTTP 403
    const unauthRes = await fetch('http://127.0.0.1:5001/api/admin/stats', {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    if (unauthRes.status === 403) {
      console.log('[PASS] Bảo mật Admin: Chặn thành công khách hàng truy cập thống kê (HTTP 403)');
      passCount++;
    }

    // 2. Lấy thống kê tổng hợp toàn hệ thống (GET /api/admin/stats)
    const statsRes = await fetch('http://127.0.0.1:5001/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();

    if (
      statsRes.status === 200 &&
      statsData.success &&
      statsData.data?.overview &&
      Array.isArray(statsData.data?.charts?.tang_truong_nguoi_dung) &&
      Array.isArray(statsData.data?.charts?.lich_trinh_theo_tinh_thanh) &&
      statsData.data?.charts?.phan_bo_danh_gia?.length === 5
    ) {
      console.log(`[PASS] Tổng hợp số liệu & 3 biểu đồ thành công (Users: ${statsData.data.overview.tong_nguoi_dung}, Trips: ${statsData.data.overview.tong_lich_trinh})`);
      passCount++;
    } else {
      throw new Error(`Dữ liệu thống kê không hợp lệ: ${JSON.stringify(statsData)}`);
    }

    // 3. Kiểm thử lọc theo khoảng thời gian chuẩn UTC+7 (start_date & end_date)
    const todayVn = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const rangeRes = await fetch(
      `http://127.0.0.1:5001/api/admin/stats?start_date=2026-01-01&end_date=${todayVn}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const rangeData = await rangeRes.json();

    if (
      rangeRes.status === 200 &&
      rangeData.success &&
      rangeData.data?.filter?.timezone === 'Asia/Ho_Chi_Minh (UTC+7)'
    ) {
      console.log(`[PASS] Lọc thống kê theo khoảng thời gian UTC+7 thành công (2026-01-01 -> ${todayVn})`);
      passCount++;
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/3 KIỂM THỬ PB18 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 3) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB18:', err.message);
    process.exit(1);
  }
}

testPB18();

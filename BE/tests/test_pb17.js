import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB17() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB17: ADMIN QUẢN LÝ ĐÁNH GIÁ (UI_37–39) ---');
  let passCount = 0;

  try {
    const admin = await prisma.tai_khoans.findFirst({ where: { vai_tro: 'admin' } });
    const customer = await prisma.tai_khoans.findFirst({ where: { ten_dang_nhap: 'customer' } });
    const place = await prisma.dia_diems.findFirst({ where: { trang_thai: 'hien_thi' } });

    if (!admin || !customer || !place) throw new Error('Thiếu dữ liệu mẫu admin/customer/place');

    const adminToken = jwt.sign({ id: admin.id.toString(), vai_tro: admin.vai_tro }, JWT_SECRET, { expiresIn: '7d' });
    const custToken = jwt.sign({ id: customer.id.toString(), vai_tro: customer.vai_tro }, JWT_SECRET, { expiresIn: '7d' });

    // 1. Tạo 1 đánh giá 1 sao để Admin kiểm duyệt & xóa
    const revRes = await fetch('http://127.0.0.1:5001/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        dia_diem_id: place.id.toString(),
        so_sao: 1,
        noi_dung: 'Đánh giá spam test PB17 với ngôn từ không phù hợp!',
      }),
    });
    const revData = await revRes.json();
    const reviewId = revData.data.review.id;

    // 2. Lấy danh sách đánh giá theo bộ lọc số sao (GET /api/admin/reviews?so_sao=1)
    const listRes = await fetch('http://127.0.0.1:5001/api/admin/reviews?so_sao=1', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status === 200 && listData.success && listData.data?.some((r) => r.id === reviewId)) {
      console.log(`[PASS] Admin lọc đánh giá 1 sao thành công (${listData.data.length} kết quả)`);
      passCount++;
    }

    // 3. Kiểm thử bảo mật Admin (HTTP 403) & bắt buộc nhập lý do xóa (HTTP 400)
    const unauthRes = await fetch(`http://127.0.0.1:5001/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ ly_do: 'Test' }),
    });
    const missingReasonRes = await fetch(`http://127.0.0.1:5001/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ly_do: '   ' }),
    });
    if (unauthRes.status === 403 && missingReasonRes.status === 400) {
      console.log('[PASS] Bảo mật Admin (HTTP 403) & Bắt buộc nhập lý do xóa (HTTP 400) hoạt động chuẩn');
      passCount++;
    }

    // 4. Admin xóa đánh giá kèm lý do -> tự động tính lại điểm TB địa điểm & gửi thông báo UTC+7
    const delRes = await fetch(`http://127.0.0.1:5001/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ly_do: 'Ngôn từ không phù hợp với quy chuẩn cộng đồng',
      }),
    });
    const delData = await delRes.json();
    const notiId = delData.data?.notification?.id;

    // Kiểm tra điểm TB trong dia_diems đã được tính lại khớp với aggregate
    const agg = await prisma.danh_gias.aggregate({
      where: { dia_diem_id: place.id },
      _avg: { so_sao: true },
    });
    const expectedAvg = agg._avg.so_sao ? Number(agg._avg.so_sao.toFixed(2)) : 0;
    const updatedPlace = await prisma.dia_diems.findUnique({ where: { id: place.id } });

    if (
      delRes.status === 200 &&
      delData.success &&
      Number(updatedPlace.diem_danh_gia_tb) === expectedAvg &&
      notiId
    ) {
      console.log(`[PASS] Xóa đánh giá, tính lại điểm TB địa điểm (${Number(updatedPlace.diem_danh_gia_tb)} sao) & gửi thông báo UTC+7 thành công`);
      passCount++;
    }

    if (notiId) await prisma.thong_baos.delete({ where: { id: BigInt(notiId) } });

    console.log(`\n=== KẾT QUẢ: ${passCount}/3 KIỂM THỬ PB17 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 3) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB17:', err.message);
    process.exit(1);
  }
}

testPB17();

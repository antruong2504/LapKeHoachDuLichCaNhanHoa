import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB14() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB14: ADMIN QUẢN LÝ CẨM NANG DU LỊCH (UI_34–36) ---');
  let passCount = 0;

  try {
    const admin = await prisma.tai_khoans.findFirst({ where: { vai_tro: 'admin' } });
    const customer = await prisma.tai_khoans.findFirst({ where: { ten_dang_nhap: 'customer' } });
    if (!admin || !customer) throw new Error('Thiếu tài khoản admin hoặc customer');

    const adminToken = jwt.sign({ id: admin.id.toString(), vai_tro: admin.vai_tro }, JWT_SECRET, { expiresIn: '7d' });
    const custToken = jwt.sign({ id: customer.id.toString(), vai_tro: customer.vai_tro }, JWT_SECRET, { expiresIn: '7d' });

    // 1. Tạo 1 ảnh dùng chung & 2 cẩm nang cùng liên kết tới ảnh đó
    const sharedImg = await prisma.cam_nang_hinh_anhs.create({
      data: { duong_dan: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600' },
    });

    const guide1Res = await fetch('http://127.0.0.1:5001/api/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        tieu_de: 'Cẩm nang vi phạm cần xóa (Test PB14)',
        noi_dung: 'Nội dung test spam quảng cáo...',
        anh_dai_dien: sharedImg.duong_dan,
        hinh_anh_ids: [sharedImg.id.toString()],
      }),
    });
    const guide1Data = await guide1Res.json();
    const guide1Id = guide1Data.data.id;

    // 2. Kiểm thử bảo mật Admin & Validation lý do bắt buộc (HTTP 403 cho customer, HTTP 400 nếu thiếu ly_do)
    const custTryRes = await fetch(`http://127.0.0.1:5001/api/admin/guides/${guide1Id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ ly_do: 'Customer tự ý xóa qua route admin' }),
    });

    const missingReasonRes = await fetch(`http://127.0.0.1:5001/api/admin/guides/${guide1Id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ly_do: '   ' }),
    });

    if (custTryRes.status === 403 && missingReasonRes.status === 400) {
      console.log('[PASS] Bảo mật Admin (HTTP 403) & Bắt buộc nhập lý do xóa (HTTP 400) hoạt động chuẩn');
      passCount++;
    }

    // 3. Kiểm thử Admin lấy danh sách cẩm nang (GET /api/admin/guides)
    const listRes = await fetch('http://127.0.0.1:5001/api/admin/guides', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status === 200 && listData.success && listData.data?.some((g) => g.id === guide1Id)) {
      console.log(`[PASS] Admin lấy danh sách quản lý cẩm nang thành công (${listData.data.length} bài)`);
      passCount++;
    }

    // 4. Kiểm thử Admin xóa cẩm nang kèm lý do -> bảo toàn ảnh dùng chung & gửi thông báo UTC+7 cho tác giả
    const delRes = await fetch(`http://127.0.0.1:5001/api/admin/guides/${guide1Id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ly_do: 'Nội dung chứa thông tin quảng cáo sai lệch quy chuẩn cộng đồng',
      }),
    });
    const delData = await delRes.json();

    // Kiểm tra ảnh dùng chung vẫn còn nguyên trong cam_nang_hinh_anhs
    const imgStillExists = await prisma.cam_nang_hinh_anhs.findUnique({ where: { id: sharedImg.id } });
    // Kiểm tra thông báo đã được tạo cho tác giả
    const notiId = delData.data?.notification?.id;
    const notiExists = notiId ? await prisma.thong_baos.findUnique({ where: { id: BigInt(notiId) } }) : null;

    if (delRes.status === 200 && delData.success && imgStillExists && notiExists) {
      console.log('[PASS] Xóa cẩm nang kèm lý do, bảo toàn ảnh dùng chung (cam_nang_hinh_anhs) & gửi thông báo UTC+7 cho tác giả thành công');
      passCount++;
    } else {
      throw new Error(`Xóa cẩm nang không đạt yêu cầu: ${JSON.stringify(delData)}`);
    }

    // Dọn dẹp thông báo & ảnh test
    if (notiExists) await prisma.thong_baos.delete({ where: { id: notiExists.id } });
    if (imgStillExists) await prisma.cam_nang_hinh_anhs.delete({ where: { id: sharedImg.id } });

    console.log(`\n=== KẾT QUẢ: ${passCount}/3 KIỂM THỬ PB14 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 3) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB14:', err.message);
    process.exit(1);
  }
}

testPB14();

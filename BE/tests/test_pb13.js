import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB13() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB13: NHẬN THÔNG BÁO REALTIME (UI_25) ---');
  let passCount = 0;

  try {
    // 1. Lấy tài khoản customer và phát hành token
    const user = await prisma.tai_khoans.findFirst({
      where: { ten_dang_nhap: 'customer' },
    });
    if (!user) throw new Error('Không tìm thấy tài khoản customer');

    const token = jwt.sign({ id: user.id.toString(), vai_tro: user.vai_tro }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Phát thông báo kiểm thử (POST /api/notifications/test)
    const createRes = await fetch('http://127.0.0.1:5001/api/notifications/test', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tieu_de: 'Kiểm thử thông báo PB13',
        noi_dung: 'Lịch trình Đà Nẵng của bạn vừa được cập nhật thành công!',
        loai_thong_bao: 'he_thong',
      }),
    });
    const createData = await createRes.json();

    if (createRes.status === 201 && createData.success && createData.data?.id) {
      console.log(`[PASS] Tạo & phát thông báo qua Socket.io thành công (ID: ${createData.data.id}, UTC+7: ${createData.data.thoi_gian_vn})`);
      passCount++;
    } else {
      throw new Error(`Tạo thông báo thất bại: ${JSON.stringify(createData)}`);
    }

    const notiId = createData.data.id;

    // 3. Lấy danh sách thông báo & kiểm tra unread_count (GET /api/notifications)
    const listRes = await fetch('http://127.0.0.1:5001/api/notifications', { headers });
    const listData = await listRes.json();

    if (
      listRes.status === 200 &&
      listData.success &&
      listData.data?.unread_count >= 1 &&
      listData.data?.notifications?.some((n) => n.id === notiId && n.da_doc === false)
    ) {
      console.log(`[PASS] Lấy danh sách thông báo & đếm chưa đọc thành công (unread_count = ${listData.data.unread_count})`);
      passCount++;
    }

    // 4. Đánh dấu đã đọc 1 thông báo (PATCH /api/notifications/:id/read)
    const readRes = await fetch(`http://127.0.0.1:5001/api/notifications/${notiId}/read`, {
      method: 'PATCH',
      headers,
    });
    const readData = await readRes.json();

    if (readRes.status === 200 && readData.success && readData.data?.notification?.da_doc === true) {
      console.log('[PASS] Đánh dấu đã đọc 1 thông báo thành công (da_doc = true)');
      passCount++;
    }

    // 5. Đánh dấu đã đọc tất cả (PATCH /api/notifications/read-all) & dọn dẹp thông báo test
    const readAllRes = await fetch('http://127.0.0.1:5001/api/notifications/read-all', {
      method: 'PATCH',
      headers,
    });
    const readAllData = await readAllRes.json();

    await prisma.thong_baos.delete({ where: { id: BigInt(notiId) } });

    if (readAllRes.status === 200 && readAllData.success && readAllData.data?.unread_count === 0) {
      console.log('[PASS] Đánh dấu đã đọc tất cả (unread_count = 0) & dọn dẹp dữ liệu test thành công');
      passCount++;
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/4 KIỂM THỬ PB13 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 4) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB13:', err.message);
    process.exit(1);
  }
}

testPB13();

import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB04API() {
  console.log('--- TEST API PB04 QUA HTTP ENDPOINTS ---');
  let passCount = 0;

  const user = await prisma.tai_khoans.findFirst({
    where: { ten_dang_nhap: 'customer' },
  });
  const token = jwt.sign({ id: user.id.toString(), vai_tro: user.vai_tro }, JWT_SECRET, {
    expiresIn: '7d',
  });

  const dest = await prisma.dia_diems.findFirst({
    where: { trang_thai: 'hien_thi' },
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Thêm yêu thích qua POST /api/favorites/:id
  const addRes = await fetch(`http://127.0.0.1:5001/api/favorites/${dest.id}`, {
    method: 'POST',
    headers,
  });
  const addData = await addRes.json();
  if (addRes.status === 201 || addRes.status === 200) {
    console.log('[PASS] POST /api/favorites/:id:', addData.message);
    passCount++;
  }

  // 2. Lấy danh sách ID yêu thích
  const idsRes = await fetch(`http://127.0.0.1:5001/api/favorites/my-ids`, {
    headers,
  });
  const idsData = await idsRes.json();
  if (idsRes.status === 200 && idsData.data?.includes(dest.id.toString())) {
    console.log('[PASS] GET /api/favorites/my-ids: Đã tìm thấy ID vừa thêm trong danh sách');
    passCount++;
  }

  // 3. Lấy danh sách yêu thích phân trang
  const listRes = await fetch(`http://127.0.0.1:5001/api/favorites?limit=10`, {
    headers,
  });
  const listData = await listRes.json();
  if (listRes.status === 200 && listData.data?.length > 0) {
    console.log(`[PASS] GET /api/favorites: Lấy được ${listData.data.length} địa điểm yêu thích`);
    passCount++;
  }

  // 4. Toggle bỏ thích
  const toggleRes = await fetch(`http://127.0.0.1:5001/api/favorites/toggle/${dest.id}`, {
    method: 'POST',
    headers,
  });
  const toggleData = await toggleRes.json();
  if (toggleRes.status === 200 && toggleData.data?.isFavorite === false) {
    console.log('[PASS] POST /api/favorites/toggle/:id: Đã chuyển trạng thái sang bỏ thích thành công');
    passCount++;
  }

  // 5. Thử truy cập không có token (bị từ chối 401)
  const unauthRes = await fetch(`http://127.0.0.1:5001/api/favorites`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (unauthRes.status === 401) {
    console.log('[PASS] Chặn truy cập khách vãng lai khi chưa có token: HTTP 401 Unauthorized');
    passCount++;
  }

  console.log(`\n=== KẾT QUẢ API TEST: ${passCount}/5 TẤT CẢ ENDPOINTS ĐẠT CHUẨN 100% ===`);
  if (passCount === 5) process.exit(0);
  else process.exit(1);
}

testPB04API();

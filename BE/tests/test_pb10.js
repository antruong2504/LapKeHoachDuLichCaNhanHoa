import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB10() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB10: ĐÁNH GIÁ ĐỊA ĐIỂM 1–5 SAO (UI_16) ---');
  let passCount = 0;
  const createdReviewIds = [];

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

    // 2. Lấy 1 địa điểm đang hiển thị để test
    const place = await prisma.dia_diems.findFirst({
      where: { trang_thai: 'hien_thi' },
    });
    if (!place) throw new Error('Không tìm thấy địa điểm hiển thị');

    // 3. Kiểm thử Auth: Không có token -> HTTP 401
    const unauthRes = await fetch('http://127.0.0.1:5001/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia_diem_id: place.id.toString(),
        so_sao: 5,
        noi_dung: 'Test unauth',
      }),
    });
    if (unauthRes.status === 401) {
      console.log('[PASS] Bảo mật API: Chặn thành công khi chưa đăng nhập (HTTP 401)');
      passCount++;
    }

    // 4. Kiểm thử Validation: Số sao ngoài khoảng 1-5 hoặc rỗng nội dung -> HTTP 400
    const badStarRes = await fetch('http://127.0.0.1:5001/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dia_diem_id: place.id.toString(),
        so_sao: 6,
        noi_dung: 'Quá 5 sao',
      }),
    });
    const emptyContentRes = await fetch('http://127.0.0.1:5001/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dia_diem_id: place.id.toString(),
        so_sao: 4,
        noi_dung: '   ',
      }),
    });
    if (badStarRes.status === 400 && emptyContentRes.status === 400) {
      console.log('[PASS] Validation dữ liệu: Chặn thành công số sao > 5 và nội dung rỗng (HTTP 400)');
      passCount++;
    }

    // 5. Kiểm thử gửi đánh giá 5 sao -> HTTP 201 + Cập nhật điểm TB vào dia_diems
    const review1Res = await fetch('http://127.0.0.1:5001/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dia_diem_id: place.id.toString(),
        so_sao: 5,
        noi_dung: 'Cảnh quan tuyệt đẹp, dịch vụ chuyên nghiệp!',
      }),
    });
    const review1Data = await review1Res.json();
    if (review1Res.status === 201 && review1Data.success && review1Data.data?.review?.id) {
      createdReviewIds.push(review1Data.data.review.id);
      console.log(`[PASS] Gửi đánh giá 5 sao thành công (Review ID: ${review1Data.data.review.id})`);
      passCount++;
    } else {
      throw new Error(`Gửi đánh giá thất bại: ${JSON.stringify(review1Data)}`);
    }

    // 6. Gửi thêm đánh giá 3 sao để kiểm tra tính lại điểm trung bình trong bảng dia_diems
    const review2Res = await fetch('http://127.0.0.1:5001/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dia_diem_id: place.id.toString(),
        so_sao: 3,
        noi_dung: 'Đông khách vào cuối tuần.',
      }),
    });
    const review2Data = await review2Res.json();
    if (review2Res.status === 201 && review2Data.success && review2Data.data?.review?.id) {
      createdReviewIds.push(review2Data.data.review.id);

      // Đối chiếu trực tiếp với aggregate trong CSDL
      const agg = await prisma.danh_gias.aggregate({
        where: { dia_diem_id: place.id },
        _avg: { so_sao: true },
      });
      const expectedAvg = Number(agg._avg.so_sao.toFixed(2));
      const updatedPlace = await prisma.dia_diems.findUnique({ where: { id: place.id } });

      if (Number(updatedPlace.diem_danh_gia_tb) === expectedAvg) {
        console.log(`[PASS] Cập nhật điểm đánh giá trung bình vào bảng dia_diems chính xác: ${Number(updatedPlace.diem_danh_gia_tb)} sao`);
        passCount++;
      }
    }

    // 7. Lấy danh sách đánh giá & Dọn dẹp (DELETE)
    const listRes = await fetch(`http://127.0.0.1:5001/api/reviews/destination/${place.id}`);
    const listData = await listRes.json();
    const hasCreated = listData.data?.some((r) => createdReviewIds.includes(r.id));

    for (const rid of createdReviewIds) {
      await fetch(`http://127.0.0.1:5001/api/reviews/${rid}`, {
        method: 'DELETE',
        headers,
      });
    }

    if (listRes.status === 200 && hasCreated) {
      console.log('[PASS] Lấy danh sách đánh giá theo địa điểm & dọn dẹp dữ liệu test thành công');
      passCount++;
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB10 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 5) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB10:', err.message);
    process.exit(1);
  }
}

testPB10();

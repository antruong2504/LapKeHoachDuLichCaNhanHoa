import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB11() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB11: CHIA SẺ CẨM NANG DU LỊCH (UI_23) ---');
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

    const authHeaders = {
      Authorization: `Bearer ${token}`,
    };

    // 2. Lấy danh sách cẩm nang công khai (GET /api/guides)
    const listRes = await fetch('http://127.0.0.1:5001/api/guides');
    const listData = await listRes.json();
    if (listRes.status === 200 && listData.success && Array.isArray(listData.data)) {
      console.log(`[PASS] Lấy danh sách cẩm nang thành công: Có ${listData.data.length} bài viết`);
      passCount++;
    }

    // 3. Kiểm thử Upload ảnh cẩm nang (POST /api/guides/upload)
    // Tạo 1x1 PNG buffer hợp lệ
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const formData = new FormData();
    formData.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'test_guide.png');

    const uploadRes = await fetch('http://127.0.0.1:5001/api/guides/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (uploadRes.status === 201 && uploadData.success && uploadData.data?.id && uploadData.data?.url) {
      console.log(`[PASS] Upload ảnh cẩm nang thành công (Image ID: ${uploadData.data.id}, URL: ${uploadData.data.url})`);
      passCount++;
    } else {
      throw new Error(`Upload ảnh thất bại: ${JSON.stringify(uploadData)}`);
    }

    const uploadedImageId = uploadData.data.id;
    const uploadedImageUrl = uploadData.data.url;

    // 4. Kiểm thử Đăng cẩm nang mới & lưu liên kết cam_nang_anh_lien_kets (POST /api/guides)
    const createRes = await fetch('http://127.0.0.1:5001/api/guides', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tieu_de: 'Kinh nghiệm phượt Đèo Hải Vân siêu chi tiết 2026',
        mo_ta_ngan: 'Chia sẻ lịch trình, điểm check-in đẹp và lưu ý an toàn khi qua đèo.',
        noi_dung: 'Đèo Hải Vân là một trong những cung đường ven biển đẹp nhất Việt Nam...',
        anh_dai_dien: uploadedImageUrl,
        hinh_anh_ids: [uploadedImageId],
      }),
    });
    const createData = await createRes.json();

    if (createRes.status === 201 && createData.success && createData.data?.id) {
      const guideId = BigInt(createData.data.id);

      // Đối chiếu bảng cam_nang_anh_lien_kets trong CSDL
      const linkedRows = await prisma.cam_nang_anh_lien_kets.findMany({
        where: { cam_nang_id: guideId },
      });

      if (linkedRows.some((r) => r.hinh_anh_id.toString() === uploadedImageId)) {
        console.log(`[PASS] Đăng cẩm nang & lưu liên kết cam_nang_anh_lien_kets thành công (Guide ID: ${guideId})`);
        passCount++;
      } else {
        throw new Error('Không tìm thấy bản ghi trong cam_nang_anh_lien_kets');
      }

      // 5. Kiểm thử Bình luận cẩm nang (POST /api/guides/:id/comments)
      const commentRes = await fetch(`http://127.0.0.1:5001/api/guides/${guideId}/comments`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noi_dung: 'Bài viết rất hữu ích, cảm ơn tác giả đã chia sẻ!',
        }),
      });
      const commentData = await commentRes.json();

      if (commentRes.status === 201 && commentData.success && commentData.data?.id) {
        console.log(`[PASS] Bình luận cẩm nang thành công (Comment ID: ${commentData.data.id})`);
        passCount++;
      }

      // 6. Kiểm thử Chia sẻ & Dọn dẹp dữ liệu test
      const shareRes = await fetch(`http://127.0.0.1:5001/api/guides/${guideId}/share`, {
        method: 'POST',
        headers: authHeaders,
      });
      const delRes = await fetch(`http://127.0.0.1:5001/api/guides/${guideId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      // Dọn ảnh test trong cam_nang_hinh_anhs
      await prisma.cam_nang_hinh_anhs.delete({
        where: { id: BigInt(uploadedImageId) },
      });

      if (shareRes.status === 200 && delRes.status === 200) {
        console.log('[PASS] Ghi nhận chia sẻ & dọn dẹp dữ liệu test thành công');
        passCount++;
      }
    } else {
      throw new Error(`Đăng cẩm nang thất bại: ${JSON.stringify(createData)}`);
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB11 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 5) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB11:', err.message);
    process.exit(1);
  }
}

testPB11();

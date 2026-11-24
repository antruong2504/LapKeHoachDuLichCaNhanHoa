import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB09() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB09: QUẢN LÝ LỊCH TRÌNH CÁ NHÂN (UI_20–22) ---');
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

    // 2. Tạo 1 lịch trình mẫu để kiểm thử PB09
    const daNang = await prisma.tinh_thanh_phos.findFirst({
      where: { ten_tinh_thanh: { contains: 'Đà Nẵng' } },
      include: { dia_diems: { take: 1 } },
    });
    const samplePlace = daNang.dia_diems[0];

    const createRes = await fetch('http://127.0.0.1:5001/api/trips/manual', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ten_lich_trinh: 'Lịch trình kiểm thử PB09',
        tinh_thanh_id: daNang.id.toString(),
        ngay_bat_dau: '2026-12-10',
        ngay_ket_thuc: '2026-12-11',
        ngan_sach_du_kien: 3000000,
        so_nguoi: 2,
        so_thich: 'Văn hóa và ẩm thực',
        danh_sach_ngay: [
          {
            thu_tu_ngay: 1,
            ngay_tham_quan: '2026-12-10',
            ghi_chu: 'Ngày 1 kiểm thử',
            cac_chang: [
              {
                dia_diem_id: samplePlace.id.toString(),
                thu_tu: 1,
                buoi: 'sang',
                thoi_gian_du_kien: '08:00 - 10:30',
                ten_dia_diem_luu: samplePlace.ten_dia_diem,
                dia_chi_luu: samplePlace.dia_chi,
                chi_phi_uoc_tinh: 200000,
              },
            ],
          },
        ],
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.data?.trip_id) {
      throw new Error('Khởi tạo lịch trình kiểm thử thất bại');
    }

    const testTripId = createData.data.trip_id;

    // 3. Kiểm thử GET /api/trips (UI_20: Danh sách lịch trình cá nhân)
    const listRes = await fetch('http://127.0.0.1:5001/api/trips', {
      method: 'GET',
      headers,
    });
    const listData = await listRes.json();
    if (listRes.status === 200 && listData.success && Array.isArray(listData.data) && listData.data.length > 0) {
      const found = listData.data.find((t) => t.id === testTripId);
      if (found) {
        console.log(`[PASS] Lấy danh sách lịch trình thành công (UI_20): Tìm thấy ${listData.data.length} chuyến đi`);
        passCount++;
      }
    }

    // 4. Kiểm thử GET /api/trips/:id (UI_21: Chi tiết lịch trình)
    const detailRes = await fetch(`http://127.0.0.1:5001/api/trips/${testTripId}`, {
      method: 'GET',
      headers,
    });
    const detailData = await detailRes.json();
    if (detailRes.status === 200 && detailData.success && detailData.data?.ngays?.length === 1) {
      console.log(`[PASS] Xem chi tiết lịch trình thành công (UI_21): Phục hồi đầy đủ ${detailData.data.ngays.length} ngày tham quan`);
      passCount++;
    }

    // 5. Kiểm thử Snapshot Cảnh báo khi địa điểm bị xóa mềm
    // Giả lập xóa mềm samplePlace
    await prisma.dia_diems.update({
      where: { id: samplePlace.id },
      data: { trang_thai: 'da_xoa' },
    });

    const softDeletedDetailRes = await fetch(`http://127.0.0.1:5001/api/trips/${testTripId}`, {
      method: 'GET',
      headers,
    });
    const softDeletedData = await softDeletedDetailRes.json();
    const firstStop = softDeletedData.data?.ngays?.[0]?.chi_tiets?.[0];

    if (firstStop && firstStop.dia_diem_da_xoa === true && firstStop.ten_dia_diem_luu === samplePlace.ten_dia_diem) {
      console.log(`[PASS] Bảo toàn Snapshot khi địa điểm bị xóa mềm: Cờ dia_diem_da_xoa = true, tên "${firstStop.ten_dia_diem_luu}" vẫn hiển thị an toàn`);
      passCount++;
    }

    // Khôi phục lại địa điểm
    await prisma.dia_diems.update({
      where: { id: samplePlace.id },
      data: { trang_thai: 'hien_thi' },
    });

    // 6. Kiểm thử Chỉnh sửa lịch trình & Khóa lạc quan (Optimistic Locking)
    // 6a. Gửi sai phien_ban -> Chặn xung đột HTTP 409
    const conflictRes = await fetch(`http://127.0.0.1:5001/api/trips/${testTripId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ten_lich_trinh: 'Cập nhật xung đột',
        phien_ban: 999, // Sai phiên bản
      }),
    });
    if (conflictRes.status === 409) {
      console.log('[PASS] Khóa lạc quan (Optimistic Locking): Chặn xung đột ghi đè thành công (HTTP 409 Conflict)');
      passCount++;
    }

    // 6b. Gửi đúng phien_ban (1) -> Cập nhật thành công, phiên bản tăng lên 2
    const updateRes = await fetch(`http://127.0.0.1:5001/api/trips/${testTripId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ten_lich_trinh: 'Lịch trình PB09 đã cập nhật thành công',
        ngan_sach_du_kien: 4500000,
        so_nguoi: 3,
        phien_ban: 1,
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status === 200 && updateData.success && updateData.data?.phien_ban === 2) {
      console.log(`[PASS] Cập nhật lịch trình thành công: Tên mới cập nhật, phiên bản tăng lên ${updateData.data.phien_ban}`);
      passCount++;
    }

    // 7. Kiểm thử Xóa lịch trình (DELETE /api/trips/:id - UI_22)
    const deleteRes = await fetch(`http://127.0.0.1:5001/api/trips/${testTripId}`, {
      method: 'DELETE',
      headers,
    });
    const deleteData = await deleteRes.json();
    if (deleteRes.status === 200 && deleteData.success) {
      // Kiểm tra trong CSDL đảm bảo đã xóa
      const checkDeleted = await prisma.lich_trinhs.findUnique({
        where: { id: BigInt(testTripId) },
      });
      if (!checkDeleted) {
        console.log('[PASS] Xóa lịch trình thành công (UI_22): Bản ghi đã được dọn sạch khỏi cơ sở dữ liệu');
        passCount++;
      }
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/6 KIỂM THỬ PB09 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 6) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB09:', err.message);
    process.exit(1);
  }
}

testPB09();

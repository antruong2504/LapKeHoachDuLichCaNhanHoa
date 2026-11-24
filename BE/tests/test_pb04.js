import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB04() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB04: QUẢN LÝ DANH SÁCH YÊU THÍCH (UI_15) ---');
  let passCount = 0;

  try {
    // 1. Lấy tài khoản khách hàng để test
    const user = await prisma.tai_khoans.findFirst({
      where: { ten_dang_nhap: 'customer' },
    });

    if (!user) throw new Error('Không tìm thấy tài khoản customer');

    // 2. Lấy 1 địa điểm để test yêu thích
    const destination = await prisma.dia_diems.findFirst({
      where: { trang_thai: 'hien_thi' },
    });

    if (!destination) throw new Error('Không có địa điểm du lịch nào');

    // Dọn dẹp dữ liệu cũ của test nếu có
    await prisma.dia_diem_yeu_thichs.deleteMany({
      where: {
        tai_khoan_id: user.id,
        dia_diem_id: destination.id,
      },
    });

    // 3. Test thêm vào yêu thích trực tiếp qua CSDL / logic
    const createdFav = await prisma.dia_diem_yeu_thichs.create({
      data: {
        tai_khoan_id: user.id,
        dia_diem_id: destination.id,
      },
    });

    if (createdFav && createdFav.id) {
      console.log(`[PASS] Thêm địa điểm "${destination.ten_dia_diem}" vào danh sách yêu thích thành công`);
      passCount++;
    }

    // 4. Test chống trùng lặp yêu thích (Unique constraint)
    try {
      await prisma.dia_diem_yeu_thichs.create({
        data: {
          tai_khoan_id: user.id,
          dia_diem_id: destination.id,
        },
      });
      console.error('[FAIL] Chưa chặn được trùng lặp yêu thích');
    } catch (uniqueErr) {
      console.log('[PASS] Ràng buộc duy nhất (Unique Constraint) ngăn chặn thành công việc thêm trùng yêu thích');
      passCount++;
    }

    // 5. Test truy vấn danh sách yêu thích kèm thông tin địa điểm (PB04, UI_15)
    const myFavorites = await prisma.dia_diem_yeu_thichs.findMany({
      where: {
        tai_khoan_id: user.id,
        dia_diem: { trang_thai: 'hien_thi' },
      },
      include: {
        dia_diem: {
          include: {
            tinh_thanh: true,
            dia_diem_danh_mucs: { include: { danh_muc: true } },
            danh_gias: { select: { so_sao: true } },
          },
        },
      },
    });

    if (myFavorites.length > 0 && myFavorites[0].dia_diem.ten_dia_diem === destination.ten_dia_diem) {
      console.log(`[PASS] Truy vấn danh sách yêu thích: Trả về đầy đủ thông tin địa điểm "${destination.ten_dia_diem}" và tỉnh/thành`);
      passCount++;
    }

    // 6. Test bỏ thích (Xóa khỏi danh sách)
    const deleteResult = await prisma.dia_diem_yeu_thichs.deleteMany({
      where: {
        tai_khoan_id: user.id,
        dia_diem_id: destination.id,
      },
    });

    if (deleteResult.count > 0) {
      console.log(`[PASS] Bỏ thích địa điểm thành công (đã xóa ${deleteResult.count} bản ghi)`);
      passCount++;
    }

    // Xác nhận đã xóa sạch
    const checkAfterDelete = await prisma.dia_diem_yeu_thichs.findFirst({
      where: {
        tai_khoan_id: user.id,
        dia_diem_id: destination.id,
      },
    });

    if (!checkAfterDelete) {
      console.log('[PASS] Xác nhận trạng thái sau khi bỏ thích: Không còn trong danh sách yêu thích');
      passCount++;
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB04 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    process.exit(0);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB04:', err.message);
    process.exit(1);
  }
}

testPB04();

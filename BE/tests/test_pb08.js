import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB08() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB08: TẠO LỊCH TRÌNH BẰNG GEMINI AI (UI_17, UI_18) ---');
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

    // 2. Lấy 1 tỉnh thành có địa điểm du lịch (Đà Nẵng)
    const daNang = await prisma.tinh_thanh_phos.findFirst({
      where: { ten_tinh_thanh: { contains: 'Đà Nẵng' } },
    });
    if (!daNang) throw new Error('Không tìm thấy tỉnh Đà Nẵng');

    // 3. Kiểm thử xác thực 6 thông tin bắt buộc (Validation)
    const missingRes = await fetch('http://127.0.0.1:5001/api/ai/generate-itinerary', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tinh_thanh_id: daNang.id.toString() }), // Thiếu các trường bắt buộc
    });
    const missingData = await missingRes.json();
    if (missingRes.status === 400 && missingData.success === false) {
      console.log('[PASS] Bắt buộc đủ 6 thông tin đầu vào: Chặn thành công khi thiếu trường (HTTP 400)');
      passCount++;
    }

    // 4. Kiểm thử sinh lịch trình AI 3 ngày 2 đêm
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 2); // 3 ngày

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const generateRes = await fetch('http://127.0.0.1:5001/api/ai/generate-itinerary', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tinh_thanh_id: daNang.id.toString(),
        ngay_bat_dau: startStr,
        ngay_ket_thuc: endStr,
        ngan_sach_du_kien: 5000000,
        so_luong_nguoi: 2,
        so_thich: 'Khám phá văn hóa, ẩm thực địa phương và chụp ảnh check-in',
      }),
    });

    const generateData = await generateRes.json();
    if (
      generateRes.status === 200 &&
      generateData.success &&
      generateData.data?.ban_nhap_id &&
      generateData.data?.noi_dung_lich_trinh?.cac_ngay?.length === 3
    ) {
      console.log(`[PASS] Sinh lịch trình AI thành công: Bản nháp ID = ${generateData.data.ban_nhap_id}, đủ 3 ngày theo đúng yêu cầu`);
      passCount++;
    } else {
      throw new Error(`Sinh lịch trình AI thất bại: ${JSON.stringify(generateData)}`);
    }

    const draftId = generateData.data.ban_nhap_id;

    // 5. Kiểm thử tạo lại 1 ngày cụ thể (POST /api/ai/regenerate-day)
    const regenRes = await fetch('http://127.0.0.1:5001/api/ai/regenerate-day', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ban_nhap_id: draftId,
        thu_tu_ngay: 2,
      }),
    });
    const regenData = await regenRes.json();
    if (regenRes.status === 200 && regenData.success && regenData.data?.ngay_moi?.cac_chang?.length > 0) {
      console.log(`[PASS] Tạo lại lịch trình cho Ngày 2 thành công (${regenData.data.ngay_moi.cac_chang.length} chặng mới)`);
      passCount++;
    }

    // 6. Kiểm thử lưu bản nháp AI thành Lịch trình chính thức (POST /api/ai/save-draft)
    const saveRes = await fetch('http://127.0.0.1:5001/api/ai/save-draft', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ban_nhap_id: draftId,
        ten_lich_trinh: 'Kỳ nghỉ Đà Nẵng 3N2Đ cùng bạn thân (AI Generated)',
      }),
    });

    const saveData = await saveRes.json();
    if (saveRes.status !== 201) {
      console.error('[DEBUG] save-draft error response:', saveRes.status, saveData);
    }
    if (saveRes.status === 201 && saveData.success && saveData.data?.trip_id) {
      console.log(`[PASS] Lưu bản nháp AI vào lịch trình chính thức thành công (Trip ID: ${saveData.data.trip_id})`);
      passCount++;

      // Kiểm tra trong CSDL có đủ ngày và chặng snapshot
      const savedTrip = await prisma.lich_trinhs.findUnique({
        where: { id: BigInt(saveData.data.trip_id) },
        include: {
          ngays: {
            include: { chi_tiets: true },
          },
        },
      });

      if (savedTrip && savedTrip.ngays.length === 3 && savedTrip.ngays[0].chi_tiets.length > 0) {
        const firstStop = savedTrip.ngays[0].chi_tiets[0];
        if (firstStop.ten_dia_diem_luu) {
          console.log(`[PASS] Bảo toàn toàn vẹn dữ liệu Snapshot: Lưu tên "${firstStop.ten_dia_diem_luu}" và địa chỉ thành công`);
          passCount++;
        }
      }
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB08 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 5) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB08:', err.message);
    process.exit(1);
  }
}

testPB08();

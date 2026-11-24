import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB20() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB20: TẠO LỊCH TRÌNH THỦ CÔNG (UI_19) ---');
  let passCount = 0;

  try {
    // 1. Lấy tài khoản customer và phát hành JWT token
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

    // 2. Lấy tỉnh thành Đà Nẵng và danh sách địa điểm có sẵn
    const daNang = await prisma.tinh_thanh_phos.findFirst({
      where: { ten_tinh_thanh: { contains: 'Đà Nẵng' } },
      include: {
        dia_diems: {
          where: { trang_thai: 'hien_thi' },
          take: 3,
        },
      },
    });
    if (!daNang || daNang.dia_diems.length < 2) {
      throw new Error('Cần ít nhất 2 địa điểm tại Đà Nẵng để kiểm thử');
    }

    const [place1, place2] = daNang.dia_diems;

    // 3. Kiểm thử Validation: Thiếu trường bắt buộc
    const missingRes = await fetch('http://127.0.0.1:5001/api/trips/manual', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ten_lich_trinh: '',
        tinh_thanh_id: daNang.id.toString(),
      }),
    });
    const missingData = await missingRes.json();
    if (missingRes.status === 400 && missingData.success === false) {
      console.log('[PASS] Bắt buộc tên và thông tin: Chặn thành công khi dữ liệu rỗng (HTTP 400)');
      passCount++;
    }

    // 4. Kiểm thử Validation: Số ngày > 14 ngày
    const over14Res = await fetch('http://127.0.0.1:5001/api/trips/manual', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ten_lich_trinh: 'Chuyến đi 20 ngày',
        tinh_thanh_id: daNang.id.toString(),
        ngay_bat_dau: '2026-12-01',
        ngay_ket_thuc: '2026-12-25',
        danh_sach_ngay: [{ thu_tu_ngay: 1 }],
      }),
    });
    const over14Data = await over14Res.json();
    if (over14Res.status === 400 && over14Data.success === false) {
      console.log('[PASS] Ràng buộc số ngày tối đa 14 ngày: Chặn thành công lịch trình quá dài (HTTP 400)');
      passCount++;
    }

    // 5. Kiểm thử Tạo lịch trình thủ công hợp lệ (2 ngày, 2 chặng)
    const manualPayload = {
      ten_lich_trinh: 'Lịch trình tự túc Đà Nẵng 2N1Đ cuối tuần',
      tinh_thanh_id: daNang.id.toString(),
      ngay_bat_dau: '2026-12-05',
      ngay_ket_thuc: '2026-12-06',
      ngan_sach_du_kien: 2000000,
      so_nguoi: 2,
      so_thich: 'Dạo biển, thưởng thức ẩm thực địa phương',
      danh_sach_ngay: [
        {
          thu_tu_ngay: 1,
          ngay_tham_quan: '2026-12-05',
          ghi_chu: 'Ngày 1: Check-in biển và tắm mát',
          cac_chang: [
            {
              dia_diem_id: place1.id.toString(),
              thu_tu: 1,
              buoi: 'sang',
              thoi_gian_du_kien: '08:00 - 11:30',
              ten_dia_diem_luu: place1.ten_dia_diem,
              dia_chi_luu: place1.dia_chi,
              vi_do_luu: Number(place1.vi_do),
              kinh_do_luu: Number(place1.kinh_do),
              chi_phi_uoc_tinh: 250000,
              ghi_chu: 'Check-in ngắm cảnh và chụp ảnh',
            },
          ],
        },
        {
          thu_tu_ngay: 2,
          ngay_tham_quan: '2026-12-06',
          ghi_chu: 'Ngày 2: Tham quan điểm văn hóa',
          cac_chang: [
            {
              dia_diem_id: place2.id.toString(),
              thu_tu: 1,
              buoi: 'sang',
              thoi_gian_du_kien: '09:00 - 12:00',
              ten_dia_diem_luu: place2.ten_dia_diem,
              dia_chi_luu: place2.dia_chi,
              vi_do_luu: Number(place2.vi_do),
              kinh_do_luu: Number(place2.kinh_do),
              chi_phi_uoc_tinh: 150000,
              ghi_chu: 'Khám phá văn hóa bản địa',
            },
          ],
        },
      ],
    };

    const createRes = await fetch('http://127.0.0.1:5001/api/trips/manual', {
      method: 'POST',
      headers,
      body: JSON.stringify(manualPayload),
    });
    const createData = await createRes.json();

    if (createRes.status === 201 && createData.success && createData.data?.trip_id) {
      console.log(`[PASS] API lưu lịch trình tự tạo thành công (Trip ID: ${createData.data.trip_id})`);
      passCount++;

      const tripId = BigInt(createData.data.trip_id);

      // 6. Kiểm tra CSDL bảo toàn toàn vẹn dữ liệu
      const dbTrip = await prisma.lich_trinhs.findUnique({
        where: { id: tripId },
        include: {
          ngays: {
            orderBy: { thu_tu_ngay: 'asc' },
            include: { chi_tiets: true },
          },
        },
      });

      if (
        dbTrip &&
        dbTrip.nguon_tao === 'thu_cong' &&
        dbTrip.ngays.length === 2 &&
        dbTrip.ngays[0].chi_tiets.length === 1 &&
        dbTrip.ngays[1].chi_tiets.length === 1
      ) {
        console.log(`[PASS] CSDL lưu đúng nguồn tạo "${dbTrip.nguon_tao}", đủ 2 ngày và các chặng tương ứng`);
        passCount++;
      }

      const stop1 = dbTrip.ngays[0].chi_tiets[0];
      if (stop1.ten_dia_diem_luu === place1.ten_dia_diem && stop1.dia_chi_luu) {
        console.log(`[PASS] Bảo toàn Snapshot địa điểm: "${stop1.ten_dia_diem_luu}" lưu chính xác`);
        passCount++;
      }
    } else {
      throw new Error(`Tạo lịch trình thất bại: ${JSON.stringify(createData)}`);
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB20 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 5) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB20:', err.message);
    process.exit(1);
  }
}

testPB20();

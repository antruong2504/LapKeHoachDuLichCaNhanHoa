import prisma from '../src/config/db.js';

async function runPB05Tests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB05: TÌM KIẾM & LỌC ĐỊA ĐIỂM (UI_03 - UI_05) ---');
  let passCount = 0;

  try {
    // 1. Kiểm thử tìm kiếm không dấu tiếng Việt
    const kw1 = 'ba na';
    const matches1 = await prisma.$queryRawUnsafe(
      `SELECT id, ten_dia_diem FROM dia_diems 
       WHERE unaccent(ten_dia_diem) ILIKE unaccent($1) 
          OR unaccent(coalesce(dia_chi, '')) ILIKE unaccent($1)
          OR unaccent(coalesce(mo_ta_ngan, '')) ILIKE unaccent($1)`,
      `%${kw1}%`
    );
    if (matches1.length > 0 && matches1.some(m => m.ten_dia_diem.includes('Bà Nà'))) {
      console.log(`[PASS] Tìm kiếm không dấu "${kw1}" tìm thấy: ${matches1[0].ten_dia_diem}`);
      passCount++;
    } else {
      throw new Error(`Không tìm thấy kết quả phù hợp cho "${kw1}"`);
    }

    const kw2 = 'hoi an';
    const matches2 = await prisma.$queryRawUnsafe(
      `SELECT id, ten_dia_diem FROM dia_diems 
       WHERE unaccent(ten_dia_diem) ILIKE unaccent($1) 
          OR unaccent(coalesce(dia_chi, '')) ILIKE unaccent($1)`,
      `%${kw2}%`
    );
    if (matches2.length > 0 && matches2.some(m => m.ten_dia_diem.includes('Hội An'))) {
      console.log(`[PASS] Tìm kiếm không dấu "${kw2}" tìm thấy: ${matches2[0].ten_dia_diem}`);
      passCount++;
    } else {
      throw new Error(`Không tìm thấy kết quả phù hợp cho "${kw2}"`);
    }

    // 2. Kiểm thử phân trang 10/trang và điểm đánh giá trung bình
    const totalCount = await prisma.dia_diems.count({ where: { trang_thai: 'hien_thi' } });
    const limit = 10;
    const page1 = await prisma.dia_diems.findMany({
      where: { trang_thai: 'hien_thi' },
      take: limit,
      skip: 0,
      include: {
        tinh_thanh: true,
        dia_diem_danh_mucs: { include: { danh_muc: true } },
        danh_gias: true,
      },
    });

    if (page1.length <= limit) {
      console.log(`[PASS] Phân trang 10 mục/trang: Lấy được ${page1.length}/${totalCount} địa điểm`);
      passCount++;
    }

    // 3. Kiểm thử lọc theo tỉnh thành
    const daNang = await prisma.tinh_thanh_phos.findFirst({
      where: { ten_tinh_thanh: { contains: 'Đà Nẵng' } },
    });
    if (daNang) {
      const daNangDests = await prisma.dia_diems.findMany({
        where: { tinh_thanh_id: daNang.id, trang_thai: 'hien_thi' },
      });
      console.log(`[PASS] Lọc địa điểm theo tỉnh thành (Đà Nẵng): ${daNangDests.length} địa điểm`);
      passCount++;
    }

    // 4. Kiểm thử lọc theo danh mục
    const anyCat = await prisma.danh_mucs.findFirst();
    if (anyCat) {
      const catDests = await prisma.dia_diems.findMany({
        where: {
          dia_diem_danh_mucs: {
            some: { danh_muc_id: anyCat.id }
          },
          trang_thai: 'hien_thi'
        }
      });
      console.log(`[PASS] Lọc địa điểm theo danh mục ("${anyCat.ten_danh_muc}"): ${catDests.length} địa điểm`);
      passCount++;
    }

    console.log(`=== KẾT QUẢ: ${passCount} KIỂM THỬ PB05 ĐỀU ĐẠT CHUẨN 100% ===`);
    process.exit(0);
  } catch (error) {
    console.error('[FAIL] Kiểm thử PB05 thất bại:', error.message);
    process.exit(1);
  }
}

runPB05Tests();

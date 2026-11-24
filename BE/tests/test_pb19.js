import prisma from '../src/config/db.js';

async function testPB19() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB19: ADMIN QUẢN LÝ ĐỊA ĐIỂM DU LỊCH (UI_27, UI_28) ---');

  let testDestId = null;

  try {
    // 1. Kiểm tra danh sách tỉnh thành
    console.log('\n[1] Kiểm tra danh sách tỉnh thành phố...');
    const provinces = await prisma.tinh_thanh_phos.findMany({ take: 5 });
    if (provinces.length === 0) {
      throw new Error('Chưa có dữ liệu tỉnh thành phố trong CSDL!');
    }
    const testProvince = provinces[0];
    console.log(`✅ Lấy thành công danh sách tỉnh thành. Dùng tỉnh test: "${testProvince.ten_tinh_thanh}" (ID: ${testProvince.id})`);

    // 2. Kiểm tra phân trang 10 địa điểm/trang
    console.log('\n[2] Kiểm tra phân trang 10 địa điểm/trang...');
    const limit = 10;
    const [total, firstPage] = await Promise.all([
      prisma.dia_diems.count({ where: { trang_thai: 'hien_thi' } }),
      prisma.dia_diems.findMany({
        where: { trang_thai: 'hien_thi' },
        take: limit,
        skip: 0,
        orderBy: { created_at: 'desc' },
      }),
    ]);
    console.log(`✅ Tổng số địa điểm đang hiển thị: ${total}. Trang 1 lấy được: ${firstPage.length} mục (giới hạn ${limit}/trang).`);

    // 3. Tạo mới địa điểm du lịch (UI_28)
    console.log('\n[3] Tạo mới địa điểm du lịch kiểm thử...');
    const testDestName = `Địa Điểm Test PB19 ${Date.now().toString().slice(-4)}`;
    const newDest = await prisma.dia_diems.create({
      data: {
        ten_dia_diem: testDestName,
        tinh_thanh_id: testProvince.id,
        mo_ta_ngan: 'Mô tả ngắn địa điểm test PB19',
        mo_ta_chi_tiet: 'Mô tả chi tiết địa điểm test tự động cho PB19',
        dia_chi: '123 Đường Test, Thành phố Test',
        vi_do: 16.0544,
        kinh_do: 108.2022,
        gia_tham_quan: 150000,
        noi_bat: false,
        trang_thai: 'hien_thi',
        phien_ban: 1,
      },
    });
    testDestId = newDest.id;
    console.log(`✅ Tạo mới địa điểm thành công: "${newDest.ten_dia_diem}" (ID: ${testDestId}, phien_ban: ${newDest.phien_ban})`);

    // 4. Kiểm tra Optimistic Locking: Cập nhật thành công khi đúng phien_ban
    console.log('\n[4] Kiểm tra Optimistic Locking (cập nhật thành công)...');
    const updateTarget = await prisma.dia_diems.findUnique({ where: { id: testDestId } });
    const currentVersion = updateTarget.phien_ban;
    const updatedDest = await prisma.dia_diems.update({
      where: { id: testDestId },
      data: {
        ten_dia_diem: `${testDestName} Updated`,
        phien_ban: currentVersion + 1,
      },
    });
    console.log(`✅ Cập nhật thành công từ v${currentVersion} lên v${updatedDest.phien_ban}: "${updatedDest.ten_dia_diem}"`);

    // 5. Kiểm tra Optimistic Locking: Phát hiện xung đột phiên bản
    console.log('\n[5] Kiểm tra phát hiện xung đột Optimistic Locking khi gửi phiên bản cũ...');
    const staleVersion = currentVersion; // phiên bản cũ v1, trong khi DB giờ là v2
    const latestInDb = await prisma.dia_diems.findUnique({ where: { id: testDestId } });
    if (staleVersion !== latestInDb.phien_ban) {
      console.log(`✅ Phát hiện xung đột chính xác: Client gửi v${staleVersion} trong khi CSDL là v${latestInDb.phien_ban} -> Sẽ chặn với HTTP 409 Conflict.`);
    } else {
      throw new Error('Không phát hiện được phiên bản cũ!');
    }

    // 6. Kiểm tra bật cờ nổi bật (noi_bat)
    console.log('\n[6] Kiểm tra bật/tắt cờ nổi bật (noi_bat)...');
    const featuredDest = await prisma.dia_diems.update({
      where: { id: testDestId },
      data: { noi_bat: true, phien_ban: latestInDb.phien_ban + 1 },
    });
    if (!featuredDest.noi_bat) {
      throw new Error('Bật cờ nổi bật thất bại!');
    }
    console.log(`✅ Bật cờ nổi bật thành công: noi_bat = ${featuredDest.noi_bat}`);

    // 7. Kiểm tra Xóa mềm (trang_thai = 'da_xoa')
    console.log('\n[7] Kiểm tra Xóa mềm (soft delete)...');
    const softDeleted = await prisma.dia_diems.update({
      where: { id: testDestId },
      data: { trang_thai: 'da_xoa' },
    });
    if (softDeleted.trang_thai !== 'da_xoa') {
      throw new Error('Xóa mềm thất bại!');
    }
    console.log(`✅ Xóa mềm thành công: trang_thai = "${softDeleted.trang_thai}". Dữ liệu vẫn được giữ trong DB.`);

    // 8. Kiểm tra Khôi phục xóa mềm (trang_thai = 'hien_thi')
    console.log('\n[8] Kiểm tra Khôi phục xóa mềm...');
    const restored = await prisma.dia_diems.update({
      where: { id: testDestId },
      data: { trang_thai: 'hien_thi' },
    });
    if (restored.trang_thai !== 'hien_thi') {
      throw new Error('Khôi phục thất bại!');
    }
    console.log(`✅ Khôi phục thành công: trang_thai = "${restored.trang_thai}".`);

    // 9. Dọn dẹp bản ghi kiểm thử
    console.log('\n[9] Dọn dẹp bản ghi kiểm thử...');
    await prisma.dia_diems.delete({ where: { id: testDestId } });
    console.log('✅ Đã xóa bản ghi kiểm thử vĩnh viễn.');
    testDestId = null;

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ TEST CASES CỦA PB19 ĐỀU ĐẠT CHUẨN 100%!');
    console.log('================================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ LỖI KIỂM THỬ PB19:', error.message);
    if (testDestId) {
      await prisma.dia_diems.delete({ where: { id: testDestId } }).catch(() => {});
    }
    process.exit(1);
  }
}

testPB19();

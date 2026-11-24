import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU TRIPMATE VÀO SUPABASE CLOUD ---');

  // 1. Tỉnh / Thành phố
  const provincesData = [
    { ten_tinh_thanh: 'Đà Nẵng', ma_tinh_thanh: 'DAD' },
    { ten_tinh_thanh: 'Quảng Nam', ma_tinh_thanh: 'QNA' },
    { ten_tinh_thanh: 'Thừa Thiên Huế', ma_tinh_thanh: 'HUE' },
    { ten_tinh_thanh: 'Hà Nội', ma_tinh_thanh: 'HAN' },
    { ten_tinh_thanh: 'Hồ Chí Minh', ma_tinh_thanh: 'SGN' },
    { ten_tinh_thanh: 'Lâm Đồng (Đà Lạt)', ma_tinh_thanh: 'LDG' },
    { ten_tinh_thanh: 'Khánh Hòa (Nha Trang)', ma_tinh_thanh: 'KHA' },
  ];

  const provinces = {};
  for (const p of provincesData) {
    const record = await prisma.tinh_thanh_phos.upsert({
      where: { ten_tinh_thanh: p.ten_tinh_thanh },
      update: {},
      create: p,
    });
    provinces[p.ten_tinh_thanh] = record.id;
  }
  console.log('✅ Đã tạo Tỉnh/Thành phố:', Object.keys(provinces).length);

  // 2. Nhóm danh mục (Cấp 1) & Danh mục con (Cấp 2)
  const categoryGroupsData = [
    {
      ten_nhom: 'Tham quan & Di tích',
      mo_ta: 'Các điểm đến mang tính lịch sử, danh lam thắng cảnh và văn hóa',
      children: [
        { ten_danh_muc: 'Di tích lịch sử', mo_ta: 'Di tích, bảo tàng, lăng tẩm' },
        { ten_danh_muc: 'Thắng cảnh thiên nhiên', mo_ta: 'Núi, thác, vịnh, hang động' },
        { ten_danh_muc: 'Kiến trúc & Cầu biểu tượng', mo_ta: 'Cầu, tượng đài, công trình độc đáo' },
      ],
    },
    {
      ten_nhom: 'Nghỉ dưỡng & Sinh thái',
      mo_ta: 'Du lịch biển đảo, sinh thái và nghỉ dưỡng',
      children: [
        { ten_danh_muc: 'Bãi biển & Vịnh', mo_ta: 'Bãi biển, tắm biển, thể thao nước' },
        { ten_danh_muc: 'Rừng & Vườn quốc gia', mo_ta: 'Khu bảo tồn thiên nhiên, bán đảo sinh thái' },
      ],
    },
    {
      ten_nhom: 'Văn hóa & Ẩm thực',
      mo_ta: 'Khám phá văn hóa bản địa, ẩm thực địa phương và chợ đêm',
      children: [
        { ten_danh_muc: 'Chợ truyền thống', mo_ta: 'Chợ địa phương, mua sắm đặc sản' },
        { ten_danh_muc: 'Phố cổ & Đi bộ', mo_ta: 'Phố cổ, phố đi bộ về đêm' },
        { ten_danh_muc: 'Trải nghiệm ẩm thực', mo_ta: 'Quán ăn ngon, đặc sản vùng miền' },
      ],
    },
    {
      ten_nhom: 'Vui chơi & Giải trí',
      mo_ta: 'Công viên chủ đề và địa điểm check-in',
      children: [
        { ten_danh_muc: 'Công viên giải trí', mo_ta: 'Theme park, khu vui chơi cảm giác mạnh' },
        { ten_danh_muc: 'Điểm check-in sống ảo', mo_ta: 'Các điểm chụp ảnh đẹp nổi tiếng' },
      ],
    },
  ];

  const categories = {};
  for (const group of categoryGroupsData) {
    const parent = await prisma.nhom_danh_mucs.upsert({
      where: { ten_nhom: group.ten_nhom },
      update: {},
      create: { ten_nhom: group.ten_nhom, mo_ta: group.mo_ta },
    });

    for (const child of group.children) {
      const cat = await prisma.danh_mucs.upsert({
        where: { ten_danh_muc: child.ten_danh_muc },
        update: { nhom_danh_muc_id: parent.id },
        create: {
          nhom_danh_muc_id: parent.id,
          ten_danh_muc: child.ten_danh_muc,
          mo_ta: child.mo_ta,
        },
      });
      categories[child.ten_danh_muc] = cat.id;
    }
  }
  console.log('✅ Đã tạo Nhóm & Danh mục con:', Object.keys(categories).length);

  // 3. Tài khoản mẫu
  const passwordAdminHash = await bcrypt.hash('Admin@123', 10);
  const passwordCustomerHash = await bcrypt.hash('Customer@123', 10);

  const admin = await prisma.tai_khoans.upsert({
    where: { ten_dang_nhap: 'admin' },
    update: {},
    create: {
      ten_dang_nhap: 'admin',
      mat_khau_hash: passwordAdminHash,
      ho_ten: 'Quản Trị Viên TripMate',
      email: 'admin@tripmate.vn',
      so_dien_thoai: '0901234567',
      vai_tro: 'admin',
      trang_thai: 'hoat_dong',
      anh_dai_dien: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
  });

  const user1 = await prisma.tai_khoans.upsert({
    where: { ten_dang_nhap: 'customer' },
    update: {},
    create: {
      ten_dang_nhap: 'customer',
      mat_khau_hash: passwordCustomerHash,
      ho_ten: 'Nguyễn Văn An',
      email: 'customer@tripmate.vn',
      so_dien_thoai: '0912345678',
      vai_tro: 'khach_hang',
      trang_thai: 'hoat_dong',
      anh_dai_dien: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    },
  });

  const user2 = await prisma.tai_khoans.upsert({
    where: { ten_dang_nhap: 'thuyan' },
    update: {},
    create: {
      ten_dang_nhap: 'thuyan',
      mat_khau_hash: passwordCustomerHash,
      ho_ten: 'Phan Hoàng Thúy An',
      email: 'thuyan@example.com',
      so_dien_thoai: '0705202440',
      vai_tro: 'khach_hang',
      trang_thai: 'hoat_dong',
      anh_dai_dien: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    },
  });

  const userSpam = await prisma.tai_khoans.upsert({
    where: { ten_dang_nhap: 'spammer_user' },
    update: {},
    create: {
      ten_dang_nhap: 'spammer_user',
      mat_khau_hash: passwordCustomerHash,
      ho_ten: 'Tài Khoản Spam',
      email: 'spam@example.com',
      so_dien_thoai: '0988776655',
      vai_tro: 'khach_hang',
      trang_thai: 'bi_khoa',
      ly_do_khoa: 'Vi phạm quy định: Spam bình luận quảng cáo trái phép',
    },
  });
  console.log('✅ Đã tạo Tài khoản mẫu (Admin, Customer, Locked user)');

  // 4. Địa điểm du lịch thực tế (>= 15 địa điểm)
  const destinationsData = [
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Cầu Rồng Đà Nẵng',
      mo_ta_ngan: 'Cây cầu thép hình rồng độc đáo phun lửa và phun nước vào tối cuối tuần.',
      mo_ta_chi_tiet: 'Cầu Rồng bắc qua sông Hàn, là biểu tượng kiến trúc hiện đại của Đà Nẵng. Vào lúc 21h thứ Bảy và Chủ nhật, cầu sẽ phun lửa và phun nước thu hút đông đảo du khách.',
      dia_chi: 'Đường Nguyễn Văn Linh, P. An Hải Tây, Q. Sơn Trà, TP. Đà Nẵng',
      vi_do: 16.0610,
      kinh_do: 108.2272,
      gia_tham_quan: 0,
      anh_dai_dien: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
      noi_bat: true,
      cats: ['Kiến trúc & Cầu biểu tượng'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Sun World Bà Nà Hills',
      mo_ta_ngan: 'Khu du lịch trên đỉnh núi Chúa với Cầu Vàng lừng danh thế giới.',
      mo_ta_chi_tiet: 'Nằm ở độ cao 1.487m so với mực nước biển, Bà Nà Hills sở hữu khí hậu 4 mùa trong 1 ngày, làng Pháp cổ kính và Cầu Vàng nâng đỡ bởi bàn tay khổng lồ.',
      dia_chi: 'Thôn An Sơn, Xã Hòa Ninh, H. Hòa Vang, TP. Đà Nẵng',
      vi_do: 15.9988,
      kinh_do: 107.9961,
      gia_tham_quan: 900000,
      anh_dai_dien: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      noi_bat: true,
      cats: ['Công viên giải trí', 'Điểm check-in sống ảo'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Bán đảo Sơn Trà & Chùa Linh Ứng',
      mo_ta_ngan: 'Lá phổi xanh của Đà Nẵng với tượng Phật Quan Âm cao 67m hướng ra biển.',
      mo_ta_chi_tiet: 'Bán đảo Sơn Trà là khu bảo tồn thiên nhiên đa dạng sinh học với loài Voọc chà và chân nâu quý hiếm. Chùa Linh Ứng Bãi Bụt là chốn tâm linh thanh tịnh.',
      dia_chi: 'Hoàng Sa, Bãi Bụt, P. Thọ Quang, Q. Sơn Trà, TP. Đà Nẵng',
      vi_do: 16.1042,
      kinh_do: 108.2778,
      gia_tham_quan: 0,
      anh_dai_dien: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
      noi_bat: true,
      cats: ['Rừng & Vườn quốc gia', 'Thắng cảnh thiên nhiên'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Danh thắng Ngũ Hành Sơn',
      mo_ta_ngan: 'Quần thể 5 ngọn núi đá vôi với hệ thống hang động và chùa chiền huyền bí.',
      mo_ta_chi_tiet: 'Ngũ Hành Sơn gồm Kim, Mộc, Thủy, Hỏa, Thổ. Nổi tiếng với động Huyền Không, động Âm Phủ và chùa Tam Thai cổ kính cùng làng đá mỹ nghệ Non Nước dưới chân núi.',
      dia_chi: '81 Huyền Trân Công Chúa, P. Hòa Hải, Q. Ngũ Hành Sơn, TP. Đà Nẵng',
      vi_do: 16.0044,
      kinh_do: 108.2632,
      gia_tham_quan: 40000,
      anh_dai_dien: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
      noi_bat: true,
      cats: ['Di tích lịch sử', 'Thắng cảnh thiên nhiên'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Bãi biển Mỹ Khê',
      mo_ta_ngan: 'Một trong những bãi biển quyến rũ nhất hành tinh với cát trắng mịn và biển xanh.',
      mo_ta_chi_tiet: 'Bãi biển Mỹ Khê trải dài thoai thoải, nước biển trong ấm quanh năm, sóng êm đềm và là nơi lý tưởng để tắm biển, lướt ván và ngắm bình minh.',
      dia_chi: 'Đường Võ Nguyên Giáp, P. Phước Mỹ, Q. Sơn Trà, TP. Đà Nẵng',
      vi_do: 16.0601,
      kinh_do: 108.2464,
      gia_tham_quan: 0,
      anh_dai_dien: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      noi_bat: true,
      cats: ['Bãi biển & Vịnh'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Chợ Cồn',
      mo_ta_ngan: 'Thiên đường ẩm thực đường phố và quà đặc sản Đà Nẵng nức tiếng.',
      mo_ta_chi_tiet: 'Chợ Cồn có khu ẩm thực sầm uất với đủ món ngon miền Trung: bánh xèo, bún mắm nêm, mì Quảng, chè sầu Liên, tré, chả bò và các món hải sản khô.',
      dia_chi: 'Góc Hùng Vương - Ông Ích Khiêm, P. Vĩnh Trung, Q. Thanh Khê, TP. Đà Nẵng',
      vi_do: 16.0694,
      kinh_do: 108.2163,
      gia_tham_quan: 0,
      anh_dai_dien: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      noi_bat: false,
      cats: ['Chợ truyền thống', 'Trải nghiệm ẩm thực'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Bảo tàng Điêu khắc Chăm',
      mo_ta_ngan: 'Nơi lưu giữ bộ sưu tập nghệ thuật điêu khắc Champa lớn nhất thế giới.',
      mo_ta_chi_tiet: 'Tọa lạc bên bờ sông Hàn, bảo tàng trưng bày hàng trăm hiện vật điêu khắc sa thạch tinh xảo từ thế kỷ 7 đến 15, phản ánh thời kỳ rực rỡ của nền văn hóa Chăm.',
      dia_chi: 'Số 02 đường 2 Tháng 9, P. Bình Hiên, Q. Hải Châu, TP. Đà Nẵng',
      vi_do: 16.0608,
      kinh_do: 108.2229,
      gia_tham_quan: 60000,
      anh_dai_dien: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800',
      noi_bat: false,
      cats: ['Di tích lịch sử'],
    },
    {
      tinh: 'Quảng Nam',
      ten_dia_diem: 'Phố cổ Hội An',
      mo_ta_ngan: 'Di sản Văn hóa Thế giới với những ngôi nhà cổ tường vàng và đèn lồng lung linh.',
      mo_ta_chi_tiet: 'Thương cảng quốc tế sầm uất từ thế kỷ 16, Hội An lưu giữ nguyên vẹn kiến trúc giao thoa Việt - Nhật - Hoa. Đêm rằm Hội An rực rỡ với hoa đăng trên sông Hoài.',
      dia_chi: 'Phường Minh An, TP. Hội An, Tỉnh Quảng Nam',
      vi_do: 15.8794,
      kinh_do: 108.3350,
      gia_tham_quan: 120000,
      anh_dai_dien: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
      noi_bat: true,
      cats: ['Phố cổ & Đi bộ', 'Di tích lịch sử'],
    },
    {
      tinh: 'Quảng Nam',
      ten_dia_diem: 'Rừng dừa Bảy Mẫu Cẩm Thanh',
      mo_ta_ngan: 'Trải nghiệm đi thuyền thúng múa thúng thú vị giữa rừng dừa nước bạt ngàn.',
      mo_ta_chi_tiet: 'Được mệnh danh là miền Tây thu nhỏ giữa lòng phố Hội, du khách sẽ được chèo thuyền thúng len lỏi qua rặng dừa và thưởng thức màn múa thúng xoay điêu luyện.',
      dia_chi: 'Xã Cẩm Thanh, TP. Hội An, Tỉnh Quảng Nam',
      vi_do: 15.8672,
      kinh_do: 108.3694,
      gia_tham_quan: 150000,
      anh_dai_dien: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      noi_bat: false,
      cats: ['Thắng cảnh thiên nhiên', 'Điểm check-in sống ảo'],
    },
    {
      tinh: 'Thừa Thiên Huế',
      ten_dia_diem: 'Quần thể Đại Nội Huế (Cố đô Huế)',
      mo_ta_ngan: 'Kinh thành triều Nguyễn - Di sản Văn hóa Thế giới uy nghiêm và tráng lệ.',
      mo_ta_chi_tiet: 'Đại Nội Huế gồm Hoàng Thành và Tử Cấm Thành, nơi ở và làm việc của 13 vị vua triều Nguyễn với Ngọ Môn, Điện Thái Hòa, Thế Miếu...',
      dia_chi: 'Đường 23 Tháng 8, P. Thuận Hòa, TP. Huế, Tỉnh Thừa Thiên Huế',
      vi_do: 16.4697,
      kinh_do: 107.5786,
      gia_tham_quan: 200000,
      anh_dai_dien: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
      noi_bat: true,
      cats: ['Di tích lịch sử'],
    },
    {
      tinh: 'Thừa Thiên Huế',
      ten_dia_diem: 'Chùa Thiên Mụ',
      mo_ta_ngan: 'Ngôi chùa cổ kính hơn 400 năm tuổi soi bóng bên dòng sông Hương thơ mộng.',
      mo_ta_chi_tiet: 'Tháp Phước Duyên 7 tầng hình bát giác cao 21m là biểu tượng của chùa Thiên Mụ. Ngôi chùa gắn liền với nhiều huyền tích lịch sử và cảnh sắc trầm mặc.',
      dia_chi: 'Đường Kim Long, P. Kim Long, TP. Huế, Tỉnh Thừa Thiên Huế',
      vi_do: 16.4528,
      kinh_do: 107.5450,
      gia_tham_quan: 0,
      anh_dai_dien: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      noi_bat: false,
      cats: ['Di tích lịch sử', 'Thắng cảnh thiên nhiên'],
    },
    {
      tinh: 'Đà Nẵng',
      ten_dia_diem: 'Đèo Hải Vân (Thiên hạ đệ nhất hùng quan)',
      mo_ta_ngan: 'Cung đèo hiểm trở và tuyệt đẹp nối liền Đà Nẵng và Thừa Thiên Huế.',
      mo_ta_chi_tiet: 'Một bên là núi cao hùng vĩ, một bên là vịnh Đà Nẵng xanh thẳm. Trên đỉnh đèo là di tích Hải Vân Quan được xây dựng từ thời nhà Trần và trùng tu thời Nguyễn.',
      dia_chi: 'Ranh giới TT Lăng Cô (Thừa Thiên Huế) và P. Hòa Hiệp Bắc (Đà Nẵng)',
      vi_do: 16.1950,
      kinh_do: 108.1322,
      gia_tham_quan: 0,
      anh_dai_dien: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      noi_bat: true,
      cats: ['Thắng cảnh thiên nhiên', 'Điểm check-in sống ảo'],
    },
  ];

  for (const item of destinationsData) {
    const pId = provinces[item.tinh];
    if (!pId) continue;

    const dest = await prisma.dia_diems.create({
      data: {
        tinh_thanh_id: pId,
        ten_dia_diem: item.ten_dia_diem,
        mo_ta_ngan: item.mo_ta_ngan,
        mo_ta_chi_tiet: item.mo_ta_chi_tiet,
        dia_chi: item.dia_chi,
        vi_do: item.vi_do,
        kinh_do: item.kinh_do,
        gia_tham_quan: item.gia_tham_quan,
        anh_dai_dien: item.anh_dai_dien,
        noi_bat: item.noi_bat,
        trang_thai: 'hien_thi',
      },
    });

    // Bảng nối danh mục
    for (const catName of item.cats) {
      const cId = categories[catName];
      if (cId) {
        await prisma.dia_diem_danh_mucs.create({
          data: {
            dia_diem_id: dest.id,
            danh_muc_id: cId,
          },
        }).catch(() => {});
      }
    }
  }
  console.log('✅ Đã tạo Địa điểm du lịch thực tế:', destinationsData.length);

  // 5. Cẩm nang mẫu
  const guide = await prisma.cam_nangs.create({
    data: {
      tac_gia_id: user1.id,
      tieu_de: 'Kinh nghiệm du lịch Đà Nẵng - Hội An 4 ngày 3 đêm tự túc',
      mo_ta_ngan: 'Lịch trình chi tiết khám phá trọn vẹn Cầu Rồng, Bà Nà Hills, Sơn Trà và Phố Cổ Hội An với chi phí cực kỳ hợp lý.',
      noi_dung: 'Đà Nẵng là điểm đến lý tưởng cho mọi tín đồ du lịch. Ngày 1: Nhận phòng khách sạn, tắm biển Mỹ Khê và thưởng thức hải sản. Ngày 2: Chinh phục đỉnh Bà Nà Hills và check-in Cầu Vàng. Ngày 3: Bán đảo Sơn Trà, sau đó ghé Hội An thả đèn hoa đăng. Ngày 4: Mua quà chợ Cồn và bay về!',
      anh_dai_dien: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    },
  });
  console.log('✅ Đã tạo Cẩm nang du lịch mẫu:', guide.tieu_de);

  // 6. Nhóm trò chuyện mẫu
  const group = await prisma.nhom_tro_chuyens.create({
    data: {
      ten_nhom: 'Hội Phượt Đà Nẵng 2026',
    },
  });

  await prisma.thanh_vien_nhoms.createMany({
    data: [
      { nhom_id: group.id, tai_khoan_id: user1.id },
      { nhom_id: group.id, tai_khoan_id: user2.id },
    ],
    skipDuplicates: true,
  });

  await prisma.tin_nhans.createMany({
    data: [
      { nhom_id: group.id, nguoi_gui_id: user1.id, noi_dung: 'Chào Thúy An, cuối tuần này mình đi Bà Nà Hills nhé!' },
      { nhom_id: group.id, nguoi_gui_id: user2.id, noi_dung: 'Ok bạn ơi, mình đặt vé cáp treo sớm cho đỡ đông nha.' },
    ],
  });
  console.log('✅ Đã tạo Nhóm chat & Tin nhắn mẫu');

  // 7. Thông báo mẫu
  await prisma.thong_baos.createMany({
    data: [
      {
        tai_khoan_id: user1.id,
        tieu_de: 'Chào mừng bạn đến với TripMate!',
        noi_dung: 'Hãy bắt đầu tạo lịch trình du lịch thông minh bằng AI đầu tiên của bạn ngay hôm nay.',
        loai_thong_bao: 'he_thong',
      },
      {
        tai_khoan_id: user2.id,
        tieu_de: 'Chào mừng bạn đến với TripMate!',
        noi_dung: 'Hãy bắt đầu tạo lịch trình du lịch thông minh bằng AI đầu tiên của bạn ngay hôm nay.',
        loai_thong_bao: 'he_thong',
      },
    ],
  });
  console.log('✅ Đã tạo Thông báo chào mừng');

  console.log('--- SEED TOÀN BỘ DỮ LIỆU THÀNH CÔNG VÀO SUPABASE! ---');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

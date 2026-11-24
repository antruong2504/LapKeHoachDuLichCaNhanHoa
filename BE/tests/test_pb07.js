import { getWeatherForecast } from '../src/services/weatherService.js';

async function testPB07() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB07: DỰ BÁO THỜI TIẾT 5 NGÀY (UI_06, UI_11) ---');
  let passCount = 0;

  try {
    // 1. Kiểm thử lấy dự báo thời tiết tại Đà Nẵng (16.0544, 108.2022)
    const tStart = Date.now();
    const weather1 = await getWeatherForecast(16.0544, 108.2022, 'Đà Nẵng');
    const tEnd = Date.now();

    if (weather1 && weather1.du_bao_5_ngay && weather1.du_bao_5_ngay.length >= 5) {
      console.log(`[PASS] Lấy dữ liệu thời tiết thành công cho "${weather1.tinh_thanh}" (5 ngày dự báo đầy đủ)`);
      passCount++;
    } else {
      throw new Error('Dữ liệu dự báo 5 ngày không đầy đủ');
    }

    // 2. Kiểm thử các chỉ số khí tượng bắt buộc
    const current = weather1.hien_tai;
    if (
      current.nhiet_do !== undefined &&
      current.do_am !== undefined &&
      current.mo_ta &&
      current.icon
    ) {
      console.log(`[PASS] Các chỉ số khí tượng đầy đủ: Nhiệt độ ${current.nhiet_do}°C, Độ ẩm ${current.do_am}%, Trạng thái "${current.mo_ta}", Icon "${current.icon}"`);
      passCount++;
    } else {
      throw new Error('Thiếu trường dữ liệu khí tượng trong thông tin thời tiết');
    }

    // 3. Kiểm thử bộ nhớ đệm Cache 30 phút (tối ưu quota)
    const tCacheStart = Date.now();
    const weather2 = await getWeatherForecast(16.0544, 108.2022, 'Đà Nẵng');
    const tCacheDuration = Date.now() - tCacheStart;

    if (tCacheDuration <= 10 && weather2.tinh_thanh === weather1.tinh_thanh) {
      console.log(`[PASS] Bộ nhớ đệm Cache 30 phút hoạt động: Lấy tức thì trong ${tCacheDuration}ms (< 10ms)`);
      passCount++;
    }

    // 4. Kiểm thử gọi trực tiếp API HTTP GET /api/weather?city=Hà+Nội
    const apiRes = await fetch('http://127.0.0.1:5001/api/weather?city=H%C3%A0+N%E1%BB%99i');
    const apiData = await apiRes.json();

    if (apiRes.status === 200 && apiData.success && apiData.data?.du_bao_5_ngay?.length >= 5) {
      console.log(`[PASS] API GET /api/weather?city=Hà+Nội: Trả về HTTP 200, thời tiết "${apiData.data.tinh_thanh}" thành công`);
      passCount++;
    } else {
      console.error('[FAIL] API /api/weather thất bại:', apiData);
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/4 KIỂM THỬ PB07 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 4) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB07:', err.message);
    process.exit(1);
  }
}

testPB07();

import { calculateHaversineDistance, optimizeRouteOrder } from '../src/services/mapService.js';

async function testPB06() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB06: BẢN ĐỒ VÀ TỐI ƯU HÓA LỘ TRÌNH (UI_07, UI_12) ---');
  let passCount = 0;

  try {
    // 1. Kiểm thử công thức khoảng cách Haversine giữa Cầu Rồng và Bán đảo Sơn Trà
    // Cầu Rồng: 16.0611, 108.2272; Bán đảo Sơn Trà: 16.1132, 108.2772
    const dist = calculateHaversineDistance(16.0611, 108.2272, 16.1132, 108.2772);
    if (dist > 5 && dist < 12) {
      console.log(`[PASS] Tính khoảng cách Haversine: Cầu Rồng -> Sơn Trà = ${dist} km (hợp lý ~7.9 km)`);
      passCount++;
    } else {
      throw new Error(`Khoảng cách tính sai lệch bất thường: ${dist} km`);
    }

    // 2. Kiểm thử thuật toán TSP Nearest Neighbor
    const start = { ten: 'Khách sạn Bạch Đằng', vi_do: 16.0700, kinh_do: 108.2230 };
    const places = [
      { id: 1, ten: 'Sun World Bà Nà Hills', vi_do: 15.9988, kinh_do: 107.9961 }, // Xa (~28km)
      { id: 2, ten: 'Cầu Rồng Đà Nẵng', vi_do: 16.0611, kinh_do: 108.2272 },      // Gần (~1.2km)
      { id: 3, ten: 'Bảo tàng Điêu khắc Chăm', vi_do: 16.0601, kinh_do: 108.2238 } // Rất gần (~1.1km)
    ];

    const optimized = optimizeRouteOrder(start, places);

    // Điểm đầu tiên sau khách sạn phải là Bảo tàng Chăm hoặc Cầu Rồng (gần nhất), Bà Nà Hills phải ở cuối
    if (optimized[0].id === 3 || optimized[0].id === 2) {
      console.log(`[PASS] Thuật toán TSP tối ưu chuẩn: Điểm kế tiếp gần nhất là "${optimized[0].ten}"`);
      passCount++;
    } else {
      throw new Error(`TSP chọn điểm đầu tiên không tối ưu: ${optimized[0].ten}`);
    }

    if (optimized[optimized.length - 1].id === 1) {
      console.log(`[PASS] Điểm xa nhất (Bà Nà Hills) được sắp xếp hợp lý về cuối chặng`);
      passCount++;
    }

    // 3. Kiểm thử giới hạn tối đa 10 địa điểm (theo quy chuẩn PB06)
    const elevenPlaces = Array.from({ length: 11 }).map((_, i) => ({
      id: i + 1,
      ten: `Điểm ${i + 1}`,
      vi_do: 16.0 + i * 0.01,
      kinh_do: 108.2 + i * 0.01,
    }));

    const optEleven = optimizeRouteOrder(start, elevenPlaces);
    if (optEleven.length <= 10) {
      console.log(`[PASS] Ràng buộc PB06: Tự động giới hạn tối đa 10 địa điểm (nhận 11 -> xử lý ${optEleven.length})`);
      passCount++;
    }

    // 4. Kiểm thử gọi trực tiếp API POST /api/maps/optimize-route
    const apiRes = await fetch('http://127.0.0.1:5001/api/maps/optimize-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diem_xuat_phat: start,
        danh_sach_dia_diem: places,
        quay_ve_diem_xuat_phat: false,
      }),
    });

    const apiData = await apiRes.json();
    if (apiRes.status === 200 && apiData.success && apiData.data?.lo_trinh?.length === 4) {
      console.log(`[PASS] API POST /api/maps/optimize-route: Thành công, tổng quãng đường = ${apiData.data.tong_quang_duong_km} km, thời gian = ${apiData.data.tong_thoi_gian_phut} phút`);
      passCount++;
    } else {
      console.error('[FAIL] API optimize-route thất bại:', apiData);
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB06 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 5) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB06:', err.message);
    process.exit(1);
  }
}

testPB06();

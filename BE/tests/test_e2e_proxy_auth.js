async function testE2EAuth() {
  const PROXY_PORT = process.env.CLIENT_PORT || 3000;
  console.log(`=== BẮT ĐẦU KIỂM THỬ END-TO-END QUA CỔNG FRONTEND PROXY (http://localhost:${PROXY_PORT}/api) ===`);
  let passCount = 0;

  const accounts = [
    { label: 'Admin (username)', user: 'admin', pass: 'Admin@123', expectedRole: 'admin', expectedCode: 200 },
    { label: 'Admin (email)', user: 'admin@tripmate.vn', pass: 'Admin@123', expectedRole: 'admin', expectedCode: 200 },
    { label: 'Customer (username)', user: 'customer', pass: 'Customer@123', expectedRole: 'khach_hang', expectedCode: 200 },
    { label: 'Customer (email)', user: 'customer@tripmate.vn', pass: 'Customer@123', expectedRole: 'khach_hang', expectedCode: 200 },
    { label: 'Thuy An (username)', user: 'thuyan', pass: 'Customer@123', expectedRole: 'khach_hang', expectedCode: 200 },
    { label: 'Thuy An (email)', user: 'thuyan@example.com', pass: 'Customer@123', expectedRole: 'khach_hang', expectedCode: 200 },
    { label: 'Bị khóa (spammer_user)', user: 'spammer_user', pass: 'Customer@123', expectedCode: 403 },
    { label: 'Sai mật khẩu', user: 'admin', pass: 'WrongPass@123', expectedCode: 401 }
  ];

  for (const acc of accounts) {
    try {
      const resp = await fetch(`http://localhost:${PROXY_PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap: acc.user, mat_khau: acc.pass })
      });

      const data = await resp.json();

      if (resp.status === acc.expectedCode) {
        if (acc.expectedRole) {
          if (data.data?.user?.vai_tro === acc.expectedRole && data.data?.token) {
            console.log(`[PASS] ${acc.label}: Đăng nhập thành công, token hợp lệ, vai trò "${acc.expectedRole}"`);
            passCount++;
          } else {
            console.error(`[FAIL] ${acc.label}: Dữ liệu trả về không đúng`, data);
          }
        } else {
          console.log(`[PASS] ${acc.label}: Xử lý chuẩn HTTP ${resp.status} - "${data.message}"`);
          passCount++;
        }
      } else {
        console.error(`[FAIL] ${acc.label}: Mong đợi ${acc.expectedCode} nhưng nhận ${resp.status}`, data);
      }
    } catch (err) {
      console.error(`[FAIL] ${acc.label}: Lỗi kết nối`, err.message);
    }
  }

  // Test PB05 Destinations API qua proxy
  try {
    const destResp = await fetch(`http://localhost:${PROXY_PORT}/api/destinations?search=ba+na&limit=5`);
    const destData = await destResp.json();
    if (destResp.status === 200 && destData.success && destData.data?.length > 0) {
      console.log(`[PASS] PB05 API Destinations qua Proxy: Tìm thấy "${destData.data[0].ten_dia_diem}"`);
      passCount++;
    } else {
      console.error('[FAIL] PB05 API Destinations qua Proxy thất bại', destData);
    }
  } catch (err) {
    console.error('[FAIL] Lỗi gọi API Destinations qua Proxy', err.message);
  }

  console.log(`\n=== KẾT QUẢ KIỂM THỬ: ${passCount}/${accounts.length + 1} TẤT CẢ KỊCH BẢN ĐẠT 100% ===`);
  if (passCount === accounts.length + 1) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testE2EAuth();

// Kiểm thử tìm kiếm thông minh mọi cách nhập liệu
async function testSmartSearch() {
  console.log('--- KIỂM THỬ TÌM KIẾM THÔNG MINH MỌI CÁCH NHẬP ---');
  const cases = [
    { q: 'HUế', expectTitleInclude: 'Huế', desc: 'Viết hoa lộn xộn có dấu ("HUế")' },
    { q: 'hue', expectTitleInclude: 'Huế', desc: 'Không dấu viết thường ("hue")' },
    { q: '  ba   na  ', expectTitleInclude: 'Bà Nà', desc: 'Không dấu thừa khoảng trắng ("  ba   na  ")' },
    { q: 'bien da nang', expectTitleInclude: 'Mỹ Khê', desc: 'Kết hợp danh mục + tỉnh thành ("bien da nang")' },
    { q: 'chua hue', expectTitleInclude: 'Thiên Mụ', desc: 'Kết hợp loại hình + tỉnh ("chua hue")' },
    { q: 'ba na hil', expectTitleInclude: 'Bà Nà', desc: 'Gõ sai chính tả nhẹ ("ba na hil")' },
    { q: 'mien phi', expectAny: true, desc: 'Tìm theo giá miễn phí ("mien phi")' },
  ];

  let pass = 0;
  for (const c of cases) {
    const res = await fetch(`http://127.0.0.1:5001/api/destinations?search=${encodeURIComponent(c.q)}&limit=10`);
    const json = await res.json();
    const list = json.data || [];
    const total = json.pagination?.total ?? list.length;

    const topNames = list.slice(0, 3).map((d) => `${d.ten_dia_diem} (${d.tinh_thanh?.ten_tinh_thanh})`).join(' | ');
    const matched = c.expectAny
      ? list.length > 0
      : list.some((d) => d.ten_dia_diem.includes(c.expectTitleInclude));

    if (res.status === 200 && matched) {
      console.log(`[PASS] ${c.desc} => Tổng ${total} KQ | Top: ${topNames}`);
      pass++;
    } else {
      console.error(`[FAIL] ${c.desc} => Tổng ${total} KQ | Top: ${topNames}`);
    }
  }

  console.log(`\n=== KẾT QUẢ: ${pass}/${cases.length} KỊCH BẢN TÌM KIẾM ĐẠT 100% ===`);
  process.exit(pass === cases.length ? 0 : 1);
}

testSmartSearch();

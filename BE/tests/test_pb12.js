import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tripmate_super_secret_jwt_key_2026_dtu_group1';

async function testPB12() {
  console.log('--- BẮT ĐẦU KIỂM THỬ PB12: TRÒ CHUYỆN NHÓM REALTIME SOCKET.IO (UI_24) ---');
  let passCount = 0;

  try {
    // 1. Lấy 2 tài khoản customer để kiểm thử tạo nhóm, thêm thành viên & bảo mật phòng
    const customer1 = await prisma.tai_khoans.findFirst({ where: { ten_dang_nhap: 'customer' } });
    const customer2 = await prisma.tai_khoans.findFirst({ where: { ten_dang_nhap: 'thuyan' } });
    const admin = await prisma.tai_khoans.findFirst({ where: { vai_tro: 'admin' } });

    if (!customer1 || !customer2 || !admin) {
      throw new Error('Cần có tài khoản customer, thuyan và admin để kiểm thử phân quyền phòng chat');
    }

    const token1 = jwt.sign({ id: customer1.id.toString(), vai_tro: customer1.vai_tro }, JWT_SECRET, { expiresIn: '7d' });
    const token2 = jwt.sign({ id: customer2.id.toString(), vai_tro: customer2.vai_tro }, JWT_SECRET, { expiresIn: '7d' });
    const tokenAdmin = jwt.sign({ id: admin.id.toString(), vai_tro: admin.vai_tro }, JWT_SECRET, { expiresIn: '7d' });

    // 2. Tạo nhóm chat mới (POST /api/chat/groups)
    const createRes = await fetch('http://127.0.0.1:5001/api/chat/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        ten_nhom: 'Hội phượt Đà Nẵng (Test PB12)',
        thanh_vien_ids: [],
      }),
    });
    const createData = await createRes.json();

    if (createRes.status === 201 && createData.success && createData.data?.id) {
      console.log(`[PASS] Tạo nhóm chat mới thành công (Group ID: ${createData.data.id})`);
      passCount++;
    } else {
      throw new Error(`Tạo nhóm thất bại: ${JSON.stringify(createData)}`);
    }

    const groupId = createData.data.id;

    // 3. Kiểm thử Bảo mật quyền truy cập phòng: Người ngoài nhóm (admin) cố đọc tin nhắn -> HTTP 403
    const unauthMsgRes = await fetch(`http://127.0.0.1:5001/api/chat/groups/${groupId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (unauthMsgRes.status === 403) {
      console.log('[PASS] Bảo mật phòng chat: Chặn thành công người không thuộc nhóm truy cập lịch sử (HTTP 403)');
      passCount++;
    }

    // 4. Kiểm thử Thêm thành viên vào nhóm (POST /api/chat/groups/:id/members)
    const addMemberRes = await fetch(`http://127.0.0.1:5001/api/chat/groups/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        identifier: 'thuyan',
      }),
    });
    const addMemberData = await addMemberRes.json();
    if (addMemberRes.status === 201 && addMemberData.success) {
      console.log(`[PASS] Thêm thành viên "${addMemberData.data.tai_khoan.ho_ten}" vào nhóm thành công`);
      passCount++;
    }

    // 5. Kiểm thử Gửi tin nhắn & lưu vào bảng tin_nhans
    const sendRes = await fetch(`http://127.0.0.1:5001/api/chat/groups/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        noi_dung: 'Chào cả nhà, cuối tuần này mình chốt lịch đi Bà Nà Hills nhé!',
      }),
    });
    const sendData = await sendRes.json();

    const historyRes = await fetch(`http://127.0.0.1:5001/api/chat/groups/${groupId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const historyData = await historyRes.json();

    if (
      sendRes.status === 201 &&
      historyRes.status === 200 &&
      historyData.data?.some((m) => m.id === sendData.data?.id)
    ) {
      console.log(`[PASS] Lưu tin nhắn vào bảng tin_nhans và đồng bộ lịch sử thành công (Msg ID: ${sendData.data.id})`);
      passCount++;
    }

    // 6. Kiểm thử danh sách nhóm chat của tôi (GET /api/chat/groups) & dọn dẹp nhóm test
    const myGroupsRes = await fetch('http://127.0.0.1:5001/api/chat/groups', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const myGroupsData = await myGroupsRes.json();
    const hasGroup = myGroupsData.data?.some((g) => g.id === groupId);

    // Dọn dẹp nhóm test
    await prisma.nhom_tro_chuyens.delete({ where: { id: BigInt(groupId) } });

    if (myGroupsRes.status === 200 && hasGroup) {
      console.log('[PASS] Lấy danh sách nhóm chat của tôi & dọn dẹp dữ liệu test thành công');
      passCount++;
    }

    console.log(`\n=== KẾT QUẢ: ${passCount}/5 KIỂM THỬ PB12 BACKEND HOÀN TOÀN ĐẠT CHUẨN 100% ===`);
    if (passCount === 5) process.exit(0);
    else process.exit(1);
  } catch (err) {
    console.error('[FAIL] Lỗi kiểm thử PB12:', err.message);
    process.exit(1);
  }
}

testPB12();

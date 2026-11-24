import prisma from '../config/db.js';

// Helper kiểm tra quyền thành viên trong nhóm chat
const checkGroupMembership = async (groupId, userId) => {
  return await prisma.thanh_vien_nhoms.findUnique({
    where: {
      nhom_id_tai_khoan_id: {
        nhom_id: BigInt(groupId),
        tai_khoan_id: BigInt(userId),
      },
    },
  });
};

// Format nhóm chat cho response
const formatGroup = (g) => ({
  id: g.id.toString(),
  ten_nhom: g.ten_nhom,
  created_at: g.created_at,
  thanh_viens: (g.thanh_viens || []).map((tv) => ({
    tai_khoan_id: tv.tai_khoan_id.toString(),
    ngay_tham_gia: tv.ngay_tham_gia,
    tai_khoan: tv.tai_khoan
      ? {
          id: tv.tai_khoan.id.toString(),
          ten_dang_nhap: tv.tai_khoan.ten_dang_nhap,
          ho_ten: tv.tai_khoan.ho_ten,
          email: tv.tai_khoan.email,
          anh_dai_dien: tv.tai_khoan.anh_dai_dien,
        }
      : null,
  })),
  tin_nhan_cuoi:
    g.tin_nhans && g.tin_nhans.length > 0
      ? {
          id: g.tin_nhans[0].id.toString(),
          noi_dung: g.tin_nhans[0].noi_dung,
          created_at: g.tin_nhans[0].created_at,
          nguoi_gui: g.tin_nhans[0].nguoi_gui
            ? {
                id: g.tin_nhans[0].nguoi_gui.id.toString(),
                ho_ten: g.tin_nhans[0].nguoi_gui.ho_ten,
              }
            : null,
        }
      : null,
});

// @desc  Lấy danh sách nhóm chat mà người dùng tham gia (PB12 - UI_24)
// @route GET /api/chat/groups
export const getMyChatGroups = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);

    const groups = await prisma.nhom_tro_chuyens.findMany({
      where: {
        thanh_viens: {
          some: { tai_khoan_id: userId },
        },
      },
      orderBy: { created_at: 'desc' },
      include: {
        thanh_viens: {
          include: {
            tai_khoan: {
              select: {
                id: true,
                ten_dang_nhap: true,
                ho_ten: true,
                email: true,
                anh_dai_dien: true,
              },
            },
          },
        },
        tin_nhans: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            nguoi_gui: {
              select: { id: true, ho_ten: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Lấy danh sách nhóm chat thành công',
      data: groups.map(formatGroup),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tạo nhóm chat mới (PB12 - UI_24)
// @route POST /api/chat/groups
export const createChatGroup = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const { ten_nhom, thanh_vien_ids } = req.body;

    if (!ten_nhom || !ten_nhom.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên nhóm trò chuyện',
      });
    }

    const memberIdSet = new Set([userId]);
    if (Array.isArray(thanh_vien_ids)) {
      thanh_vien_ids.forEach((id) => {
        if (id && !isNaN(id)) memberIdSet.add(id.toString());
      });
    }

    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.nhom_tro_chuyens.create({
        data: {
          ten_nhom: ten_nhom.trim(),
        },
      });

      for (const mId of memberIdSet) {
        const userExists = await tx.tai_khoans.findUnique({
          where: { id: BigInt(mId) },
        });
        if (userExists) {
          await tx.thanh_vien_nhoms.create({
            data: {
              nhom_id: group.id,
              tai_khoan_id: BigInt(mId),
            },
          });
        }
      }

      return await tx.nhom_tro_chuyens.findUnique({
        where: { id: group.id },
        include: {
          thanh_viens: {
            include: {
              tai_khoan: {
                select: {
                  id: true,
                  ten_dang_nhap: true,
                  ho_ten: true,
                  email: true,
                  anh_dai_dien: true,
                },
              },
            },
          },
          tin_nhans: true,
        },
      });
    });

    res.status(201).json({
      success: true,
      message: 'Tạo nhóm trò chuyện mới thành công',
      data: formatGroup(newGroup),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Thêm thành viên vào nhóm chat (PB12 - UI_24)
// @route POST /api/chat/groups/:id/members
export const addGroupMember = async (req, res) => {
  try {
    const groupId = BigInt(req.params.id);
    const currentUserId = req.user.id;
    const { tai_khoan_id, identifier } = req.body;

    // Bảo mật: Chỉ thành viên hiện tại mới có quyền thêm thành viên khác
    const isMember = await checkGroupMembership(groupId, currentUserId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải thành viên của nhóm này nên không có quyền thêm người mới',
      });
    }

    let targetUser = null;
    if (tai_khoan_id && !isNaN(tai_khoan_id)) {
      targetUser = await prisma.tai_khoans.findUnique({
        where: { id: BigInt(tai_khoan_id) },
      });
    } else if (identifier && identifier.trim()) {
      const cleanId = identifier.trim();
      targetUser = await prisma.tai_khoans.findFirst({
        where: {
          OR: [
            { ten_dang_nhap: { equals: cleanId, mode: 'insensitive' } },
            { email: { equals: cleanId, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản thành viên cần thêm',
      });
    }

    const alreadyMember = await checkGroupMembership(groupId, targetUser.id);
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng này đã là thành viên trong nhóm',
      });
    }

    await prisma.thanh_vien_nhoms.create({
      data: {
        nhom_id: groupId,
        tai_khoan_id: targetUser.id,
      },
    });

    res.status(201).json({
      success: true,
      message: `Đã thêm ${targetUser.ho_ten} vào nhóm trò chuyện`,
      data: {
        tai_khoan_id: targetUser.id.toString(),
        tai_khoan: {
          id: targetUser.id.toString(),
          ten_dang_nhap: targetUser.ten_dang_nhap,
          ho_ten: targetUser.ho_ten,
          email: targetUser.email,
          anh_dai_dien: targetUser.anh_dai_dien,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy lịch sử tin nhắn của nhóm (Bảo mật thành viên)
// @route GET /api/chat/groups/:id/messages
export const getGroupMessages = async (req, res) => {
  try {
    const groupId = BigInt(req.params.id);
    const currentUserId = req.user.id;

    // Bảo mật quyền truy cập phòng: Chỉ thành viên mới được xem tin nhắn
    const isMember = await checkGroupMembership(groupId, currentUserId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Từ chối truy cập: Bạn không phải thành viên của phòng chat này',
      });
    }

    const messages = await prisma.tin_nhans.findMany({
      where: { nhom_id: groupId },
      orderBy: { created_at: 'asc' },
      include: {
        nguoi_gui: {
          select: {
            id: true,
            ho_ten: true,
            anh_dai_dien: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Lấy lịch sử tin nhắn thành công',
      data: messages.map((m) => ({
        id: m.id.toString(),
        nhom_id: m.nhom_id.toString(),
        noi_dung: m.noi_dung,
        created_at: m.created_at,
        nguoi_gui: m.nguoi_gui
          ? {
              id: m.nguoi_gui.id.toString(),
              ho_ten: m.nguoi_gui.ho_ten,
              anh_dai_dien: m.nguoi_gui.anh_dai_dien,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Gửi tin nhắn qua REST API (fallback hoặc tích hợp Socket.io)
// @route POST /api/chat/groups/:id/messages
export const sendMessageRest = async (req, res) => {
  try {
    const groupId = BigInt(req.params.id);
    const currentUserId = req.user.id;
    const { noi_dung } = req.body;

    const isMember = await checkGroupMembership(groupId, currentUserId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Từ chối truy cập: Bạn không phải thành viên của phòng chat này',
      });
    }

    if (!noi_dung || !noi_dung.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống',
      });
    }

    const newMsg = await prisma.tin_nhans.create({
      data: {
        nhom_id: groupId,
        nguoi_gui_id: BigInt(currentUserId),
        noi_dung: noi_dung.trim(),
      },
      include: {
        nguoi_gui: {
          select: { id: true, ho_ten: true, anh_dai_dien: true },
        },
      },
    });

    const formatted = {
      id: newMsg.id.toString(),
      nhom_id: newMsg.nhom_id.toString(),
      noi_dung: newMsg.noi_dung,
      created_at: newMsg.created_at,
      nguoi_gui: {
        id: newMsg.nguoi_gui.id.toString(),
        ho_ten: newMsg.nguoi_gui.ho_ten,
        anh_dai_dien: newMsg.nguoi_gui.anh_dai_dien,
      },
    };

    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId.toString()}`).emit('new_message', formatted);
    }

    res.status(201).json({
      success: true,
      message: 'Gửi tin nhắn thành công',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tìm kiếm người dùng khác để mời vào nhóm chat
// @route GET /api/chat/users?search=...
export const searchChatUsers = async (req, res) => {
  try {
    const currentUserId = BigInt(req.user.id);
    const { search } = req.query;

    const users = await prisma.tai_khoans.findMany({
      where: {
        id: { not: currentUserId },
        trang_thai: 'hoat_dong',
        ...(search?.trim()
          ? {
              OR: [
                { ho_ten: { contains: search.trim(), mode: 'insensitive' } },
                { ten_dang_nhap: { contains: search.trim(), mode: 'insensitive' } },
                { email: { contains: search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: 15,
      select: {
        id: true,
        ten_dang_nhap: true,
        ho_ten: true,
        email: true,
        anh_dai_dien: true,
      },
    });

    res.json({
      success: true,
      data: users.map((u) => ({ ...u, id: u.id.toString() })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

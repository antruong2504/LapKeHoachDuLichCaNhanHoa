import prisma from '../config/db.js';
import { emitNotification } from '../sockets/socketHandler.js';

const formatNotification = (n) => ({
  id: n.id.toString(),
  tai_khoan_id: n.tai_khoan_id.toString(),
  tieu_de: n.tieu_de,
  noi_dung: n.noi_dung,
  loai_thong_bao: n.loai_thong_bao || 'he_thong',
  da_doc: n.da_doc,
  created_at: n.created_at,
  read_at: n.read_at,
  thoi_gian_vn: new Date(n.created_at).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }),
});

/**
 * Helper tạo thông báo trong DB và phát realtime tới room user-{id}
 * Dùng chung cho PB13, PB14, PB16, PB17
 */
export const createAndEmitNotification = async (io, { tai_khoan_id, tieu_de, noi_dung, loai_thong_bao = 'he_thong' }) => {
  const created = await prisma.thong_baos.create({
    data: {
      tai_khoan_id: BigInt(tai_khoan_id),
      tieu_de,
      noi_dung,
      loai_thong_bao,
      da_doc: false,
    },
  });

  const formatted = formatNotification(created);
  emitNotification(io, tai_khoan_id.toString(), formatted);
  return formatted;
};

// @desc  Lấy danh sách thông báo cá nhân & số lượng chưa đọc (PB13 - UI_25)
// @route GET /api/notifications
export const getMyNotifications = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);

    const [notifications, unreadCount] = await Promise.all([
      prisma.thong_baos.findMany({
        where: { tai_khoan_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      prisma.thong_baos.count({
        where: { tai_khoan_id: userId, da_doc: false },
      }),
    ]);

    res.json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: {
        notifications: notifications.map(formatNotification),
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Đánh dấu 1 thông báo đã đọc (PB13 - UI_25)
// @route PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const notiId = BigInt(req.params.id);

    const existing = await prisma.thong_baos.findFirst({
      where: { id: notiId, tai_khoan_id: userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
    }

    const updated = await prisma.thong_baos.update({
      where: { id: notiId },
      data: {
        da_doc: true,
        read_at: existing.read_at || new Date(),
      },
    });

    const unreadCount = await prisma.thong_baos.count({
      where: { tai_khoan_id: userId, da_doc: false },
    });

    res.json({
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc',
      data: {
        notification: formatNotification(updated),
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Đánh dấu đã đọc tất cả thông báo (PB13 - UI_25)
// @route PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);

    await prisma.thong_baos.updateMany({
      where: { tai_khoan_id: userId, da_doc: false },
      data: {
        da_doc: true,
        read_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      data: { unread_count: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tạo & phát thông báo kiểm thử realtime (PB13)
// @route POST /api/notifications/test
export const createTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tieu_de, noi_dung, loai_thong_bao } = req.body;
    const io = req.app.get('io');

    const notification = await createAndEmitNotification(io, {
      tai_khoan_id: userId,
      tieu_de: tieu_de || 'Thông báo từ TripMate',
      noi_dung: noi_dung || 'Bạn có một cập nhật mới từ hệ thống TripMate!',
      loai_thong_bao: loai_thong_bao || 'he_thong',
    });

    res.status(201).json({
      success: true,
      message: 'Phát thông báo realtime thành công',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

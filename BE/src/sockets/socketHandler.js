import prisma from '../config/db.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Người dùng kết nối: ${socket.id}`);

    // Tham gia phòng thông báo cá nhân (PB13: user-{id})
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        socket.join(`user_${userId}`);
        console.log(`[Socket.io] Socket ${socket.id} gia nhập room user-${userId}`);
      }
    });

    // Tham gia phòng chat nhóm (PB12) - có kiểm tra quyền thành viên
    socket.on('join_group', async (payload) => {
      try {
        const groupId = typeof payload === 'object' ? payload.groupId : payload;
        const userId = typeof payload === 'object' ? payload.userId : null;

        if (!groupId) return;

        // Nếu client truyền userId, kiểm tra quyền thành viên trong thanh_vien_nhoms
        if (userId) {
          const isMember = await prisma.thanh_vien_nhoms.findUnique({
            where: {
              nhom_id_tai_khoan_id: {
                nhom_id: BigInt(groupId),
                tai_khoan_id: BigInt(userId),
              },
            },
          });
          if (!isMember) {
            socket.emit('chat_error', {
              message: 'Từ chối truy cập: Bạn không phải thành viên của phòng chat này',
            });
            return;
          }
        }

        socket.join(`group_${groupId}`);
        console.log(`[Socket.io] Socket ${socket.id} gia nhập phòng chat group_${groupId}`);
      } catch (err) {
        console.error('[Socket.io] Lỗi join_group:', err);
      }
    });

    // Rời phòng chat nhóm
    socket.on('leave_group', (groupId) => {
      if (groupId) {
        socket.leave(`group_${groupId}`);
      }
    });

    // Gửi tin nhắn trong nhóm (PB12) - bảo mật thành viên & lưu tin_nhans
    socket.on('send_message', async (data) => {
      try {
        const { nhom_id, nguoi_gui_id, noi_dung } = data || {};
        if (!nhom_id || !nguoi_gui_id || !noi_dung || !noi_dung.trim()) return;

        // Bảo mật: Kiểm tra người gửi có thuộc nhóm không
        const isMember = await prisma.thanh_vien_nhoms.findUnique({
          where: {
            nhom_id_tai_khoan_id: {
              nhom_id: BigInt(nhom_id),
              tai_khoan_id: BigInt(nguoi_gui_id),
            },
          },
        });

        if (!isMember) {
          socket.emit('chat_error', {
            message: 'Từ chối gửi tin: Bạn không phải thành viên của nhóm này',
          });
          return;
        }

        // Lưu tin nhắn vào database
        const newMsg = await prisma.tin_nhans.create({
          data: {
            nhom_id: BigInt(nhom_id),
            nguoi_gui_id: BigInt(nguoi_gui_id),
            noi_dung: noi_dung.trim(),
          },
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

        // Format BigInt sang string để phát qua Socket
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

        // Phát tới tất cả thành viên trong nhóm
        io.to(`group_${nhom_id}`).emit('new_message', formatted);
      } catch (err) {
        console.error('[Socket.io] Lỗi gửi tin nhắn:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Ngắt kết nối: ${socket.id}`);
    });
  });
};

/**
 * Helper phát thông báo realtime tới người dùng cụ thể (PB13)
 */
export const emitNotification = (io, userId, notificationData) => {
  if (io && userId) {
    io.to(`user-${userId}`).emit('notification_received', notificationData);
    io.to(`user_${userId}`).emit('notification_received', notificationData);
  }
};

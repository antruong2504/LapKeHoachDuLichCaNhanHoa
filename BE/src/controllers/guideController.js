import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { uploadImageToSupabase } from '../config/supabase.js';
import { createAndEmitNotification } from './notificationController.js';

// Helper format cẩm nang
const formatGuide = (g) => ({
  id: g.id.toString(),
  tac_gia_id: g.tac_gia_id.toString(),
  tieu_de: g.tieu_de,
  mo_ta_ngan: g.mo_ta_ngan,
  noi_dung: g.noi_dung,
  anh_dai_dien: g.anh_dai_dien,
  ngay_dang: g.ngay_dang,
  tac_gia: g.tac_gia
    ? {
        id: g.tac_gia.id.toString(),
        ho_ten: g.tac_gia.ho_ten,
        anh_dai_dien: g.tac_gia.anh_dai_dien,
      }
    : null,
  hinh_anhs: (g.cam_nang_anh_lien_kets || []).map((link) => ({
    id: link.hinh_anh.id.toString(),
    duong_dan: link.hinh_anh.duong_dan,
  })),
  so_binh_luan: g._count?.binh_luan_cam_nangs ?? g.binh_luan_cam_nangs?.length ?? 0,
  so_chia_se: g._count?.chia_se_cam_nangs ?? 0,
  binh_luans: (g.binh_luan_cam_nangs || []).map((c) => ({
    id: c.id.toString(),
    cam_nang_id: c.cam_nang_id.toString(),
    tai_khoan_id: c.tai_khoan_id.toString(),
    noi_dung: c.noi_dung,
    created_at: c.created_at,
    tai_khoan: c.tai_khoan
      ? {
          id: c.tai_khoan.id.toString(),
          ho_ten: c.tai_khoan.ho_ten,
          anh_dai_dien: c.tai_khoan.anh_dai_dien,
        }
      : null,
  })),
});

// @desc  Lấy danh sách cẩm nang du lịch cộng đồng (PB11 - UI_23)
// @route GET /api/guides
export const getGuides = async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = search?.trim()
      ? {
          OR: [
            { tieu_de: { contains: search.trim(), mode: 'insensitive' } },
            { mo_ta_ngan: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }
      : {};

    const guides = await prisma.cam_nangs.findMany({
      where: whereClause,
      orderBy: { ngay_dang: 'desc' },
      include: {
        tac_gia: {
          select: { id: true, ho_ten: true, anh_dai_dien: true },
        },
        cam_nang_anh_lien_kets: {
          include: { hinh_anh: true },
        },
        _count: {
          select: {
            binh_luan_cam_nangs: true,
            chia_se_cam_nangs: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Lấy danh sách cẩm nang du lịch thành công',
      data: guides.map(formatGuide),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lấy chi tiết 1 cẩm nang kèm bình luận & bộ ảnh liên kết
// @route GET /api/guides/:id
export const getGuideById = async (req, res) => {
  try {
    const guideId = BigInt(req.params.id);
    const guide = await prisma.cam_nangs.findUnique({
      where: { id: guideId },
      include: {
        tac_gia: {
          select: { id: true, ho_ten: true, anh_dai_dien: true },
        },
        cam_nang_anh_lien_kets: {
          include: { hinh_anh: true },
        },
        binh_luan_cam_nangs: {
          orderBy: { created_at: 'desc' },
          include: {
            tai_khoan: {
              select: { id: true, ho_ten: true, anh_dai_dien: true },
            },
          },
        },
        _count: {
          select: {
            binh_luan_cam_nangs: true,
            chia_se_cam_nangs: true,
          },
        },
      },
    });

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết cẩm nang',
      });
    }

    res.json({
      success: true,
      message: 'Lấy chi tiết cẩm nang thành công',
      data: formatGuide(guide),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Upload ảnh cẩm nang và lưu kho cam_nang_hinh_anhs
// @route POST /api/guides/upload
export const uploadGuideImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file hình ảnh để tải lên',
      });
    }

    let finalUrl = null;
    try {
      finalUrl = await uploadImageToSupabase(
        req.file.buffer,
        `guide_${Date.now()}_${req.file.originalname}`,
        req.file.mimetype
      );
    } catch (e) {
      console.warn('Lỗi upload Supabase Storage (guide), fallback local:', e.message);
    }

    if (!finalUrl) {
      const uploadDir = path.join(process.cwd(), 'uploads/guides');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `guide_${Date.now()}${ext}`;
      fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);
      finalUrl = `/uploads/guides/${fileName}`;
    }

    // Lưu vào kho cam_nang_hinh_anhs để dùng liên kết cam_nang_anh_lien_kets
    const savedImage = await prisma.cam_nang_hinh_anhs.create({
      data: { duong_dan: finalUrl },
    });

    res.status(201).json({
      success: true,
      message: 'Tải lên hình ảnh cẩm nang thành công',
      data: {
        id: savedImage.id.toString(),
        url: savedImage.duong_dan,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Đăng bài viết cẩm nang du lịch mới (PB11 - UI_23)
// @route POST /api/guides
export const createGuide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tieu_de, mo_ta_ngan, noi_dung, anh_dai_dien, hinh_anh_ids, hinh_anh_urls } = req.body;

    if (!tieu_de || !tieu_de.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tiêu đề cẩm nang',
        errors: [{ field: 'tieu_de', message: 'Tiêu đề là bắt buộc' }],
      });
    }

    if (!noi_dung || !noi_dung.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung chi tiết cẩm nang',
        errors: [{ field: 'noi_dung', message: 'Nội dung là bắt buộc' }],
      });
    }

    const defaultCover =
      anh_dai_dien?.trim() ||
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=900';

    const createdGuide = await prisma.$transaction(
      async (tx) => {
        const guide = await tx.cam_nangs.create({
          data: {
            tac_gia_id: BigInt(userId),
            tieu_de: tieu_de.trim(),
            mo_ta_ngan: mo_ta_ngan?.trim() || noi_dung.trim().slice(0, 160),
            noi_dung: noi_dung.trim(),
            anh_dai_dien: defaultCover,
          },
        });

        // Tập hợp ID ảnh cần liên kết trong cam_nang_anh_lien_kets
        const linkedImageIds = new Set();

        if (Array.isArray(hinh_anh_ids)) {
          hinh_anh_ids.forEach((id) => {
            if (id && !isNaN(id)) linkedImageIds.add(id.toString());
          });
        }

        // Nếu có truyền URL ảnh bổ sung (hoặc ảnh đại diện), lưu vào cam_nang_hinh_anhs nếu chưa có
        const urlsToEnsure = new Set();
        if (Array.isArray(hinh_anh_urls)) {
          hinh_anh_urls.forEach((u) => {
            if (u && typeof u === 'string' && u.trim()) urlsToEnsure.add(u.trim());
          });
        }
        if (anh_dai_dien && anh_dai_dien.trim()) {
          urlsToEnsure.add(anh_dai_dien.trim());
        }

        for (const url of urlsToEnsure) {
          let imgRecord = await tx.cam_nang_hinh_anhs.findFirst({
            where: { duong_dan: url },
          });
          if (!imgRecord) {
            imgRecord = await tx.cam_nang_hinh_anhs.create({
              data: { duong_dan: url },
            });
          }
          linkedImageIds.add(imgRecord.id.toString());
        }

        // Tạo liên kết cam_nang_anh_lien_kets
        for (const imgId of linkedImageIds) {
          await tx.cam_nang_anh_lien_kets.upsert({
            where: {
              cam_nang_id_hinh_anh_id: {
                cam_nang_id: guide.id,
                hinh_anh_id: BigInt(imgId),
              },
            },
            update: {},
            create: {
              cam_nang_id: guide.id,
              hinh_anh_id: BigInt(imgId),
            },
          });
        }

        return await tx.cam_nangs.findUnique({
          where: { id: guide.id },
          include: {
            tac_gia: {
              select: { id: true, ho_ten: true, anh_dai_dien: true },
            },
            cam_nang_anh_lien_kets: {
              include: { hinh_anh: true },
            },
            _count: {
              select: {
                binh_luan_cam_nangs: true,
                chia_se_cam_nangs: true,
              },
            },
          },
        });
      },
      { maxWait: 15000, timeout: 45000 }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng cẩm nang du lịch thành công',
      data: formatGuide(createdGuide),
    });
  } catch (error) {
    console.error('Lỗi createGuide:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Bình luận cẩm nang (PB11 - UI_23)
// @route POST /api/guides/:id/comments
export const addGuideComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const guideId = BigInt(req.params.id);
    const { noi_dung } = req.body;

    if (!noi_dung || !noi_dung.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung bình luận',
      });
    }

    const guide = await prisma.cam_nangs.findUnique({
      where: { id: guideId },
    });
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết cẩm nang',
      });
    }

    const comment = await prisma.binh_luan_cam_nangs.create({
      data: {
        cam_nang_id: guideId,
        tai_khoan_id: BigInt(userId),
        noi_dung: noi_dung.trim(),
      },
      include: {
        tai_khoan: {
          select: { id: true, ho_ten: true, anh_dai_dien: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Đã thêm bình luận thành công',
      data: {
        id: comment.id.toString(),
        cam_nang_id: comment.cam_nang_id.toString(),
        tai_khoan_id: comment.tai_khoan_id.toString(),
        noi_dung: comment.noi_dung,
        created_at: comment.created_at,
        tai_khoan: comment.tai_khoan
          ? {
              id: comment.tai_khoan.id.toString(),
              ho_ten: comment.tai_khoan.ho_ten,
              anh_dai_dien: comment.tai_khoan.anh_dai_dien,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Ghi nhận chia sẻ cẩm nang
// @route POST /api/guides/:id/share
export const shareGuide = async (req, res) => {
  try {
    const userId = req.user.id;
    const guideId = BigInt(req.params.id);

    const guide = await prisma.cam_nangs.findUnique({
      where: { id: guideId },
    });
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết cẩm nang',
      });
    }

    await prisma.chia_se_cam_nangs.create({
      data: {
        cam_nang_id: guideId,
        tai_khoan_id: BigInt(userId),
      },
    });

    const totalShares = await prisma.chia_se_cam_nangs.count({
      where: { cam_nang_id: guideId },
    });

    res.json({
      success: true,
      message: 'Đã ghi nhận chia sẻ cẩm nang',
      data: { so_chia_se: totalShares },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Xóa cẩm nang (Tác giả hoặc Admin)
// @route DELETE /api/guides/:id
export const deleteGuide = async (req, res) => {
  try {
    const guideId = BigInt(req.params.id);
    const userId = BigInt(req.user.id);
    const isAdmin = req.user.vai_tro === 'admin';

    const guide = await prisma.cam_nangs.findUnique({
      where: { id: guideId },
    });
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cẩm nang' });
    }

    if (guide.tac_gia_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa cẩm nang này' });
    }

    await prisma.cam_nangs.delete({
      where: { id: guideId },
    });

    res.json({
      success: true,
      message: 'Đã xóa cẩm nang thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin lấy danh sách cẩm nang quản lý (PB14 - UI_34)
// @route GET /api/admin/guides
export const getAdminGuides = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const take = Math.max(1, Number(limit) || 10);
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const whereClause = search?.trim()
      ? {
          OR: [
            { tieu_de: { contains: search.trim(), mode: 'insensitive' } },
            { mo_ta_ngan: { contains: search.trim(), mode: 'insensitive' } },
            { tac_gia: { ho_ten: { contains: search.trim(), mode: 'insensitive' } } },
          ],
        }
      : {};

    const [total, guides] = await Promise.all([
      prisma.cam_nangs.count({ where: whereClause }),
      prisma.cam_nangs.findMany({
        where: whereClause,
        orderBy: { ngay_dang: 'desc' },
        skip,
        take,
        include: {
          tac_gia: {
            select: { id: true, ho_ten: true, email: true, anh_dai_dien: true },
          },
          cam_nang_anh_lien_kets: {
            include: { hinh_anh: true },
          },
          _count: {
            select: {
              binh_luan_cam_nangs: true,
              chia_se_cam_nangs: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Lấy danh sách quản lý cẩm nang thành công',
      data: guides.map((g) => ({
        ...formatGuide(g),
        tac_gia: g.tac_gia
          ? {
              id: g.tac_gia.id.toString(),
              ho_ten: g.tac_gia.ho_ten,
              email: g.tac_gia.email,
              anh_dai_dien: g.tac_gia.anh_dai_dien,
            }
          : null,
        ngay_dang_vn: new Date(g.ngay_dang).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        }),
      })),
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin xóa cẩm nang kèm lý do bắt buộc, bảo toàn ảnh dùng chung & gửi thông báo UTC+7 (PB14 - UI_36)
// @route DELETE /api/admin/guides/:id
export const adminDeleteGuide = async (req, res) => {
  try {
    const guideId = BigInt(req.params.id);
    const { ly_do } = req.body || {};

    if (!ly_do || !ly_do.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do xóa cẩm nang',
        errors: [{ field: 'ly_do', message: 'Lý do xóa là bắt buộc' }],
      });
    }

    const guide = await prisma.cam_nangs.findUnique({
      where: { id: guideId },
      include: {
        cam_nang_anh_lien_kets: true,
      },
    });

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết cẩm nang cần xóa',
      });
    }

    // Xóa cẩm nang: Prisma cascade chỉ xóa các dòng liên kết trong cam_nang_anh_lien_kets,
    // hoàn toàn BẢO TOÀN các bản ghi ảnh dùng chung trong cam_nang_hinh_anhs!
    await prisma.cam_nangs.delete({
      where: { id: guideId },
    });

    // Gửi thông báo realtime (UTC+7) cho tác giả
    const io = req.app.get('io');
    const notification = await createAndEmitNotification(io, {
      tai_khoan_id: guide.tac_gia_id,
      tieu_de: 'Bài viết cẩm nang của bạn đã bị gỡ bỏ',
      noi_dung: `Cẩm nang "${guide.tieu_de}" đã bị Quản trị viên xóa. Lý do: ${ly_do.trim()}`,
      loai_thong_bao: 'xoa_noi_dung',
    });

    res.json({
      success: true,
      message: 'Đã xóa cẩm nang và gửi thông báo tới tác giả thành công',
      data: {
        deleted_guide_id: guideId.toString(),
        preserved_shared_image_ids: guide.cam_nang_anh_lien_kets.map((l) => l.hinh_anh_id.toString()),
        notification,
      },
    });
  } catch (error) {
    console.error('Lỗi adminDeleteGuide:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

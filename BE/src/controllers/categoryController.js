import prisma from '../config/db.js';

// Hàm chuẩn hóa tiếng Việt không dấu để chống trùng lặp theo quy chuẩn PB15
export const removeDiacritics = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

// @desc  Lấy cây danh mục 2 cấp (PB05, PB15, UI_29)
// @route GET /api/categories/tree
export const getCategoryTree = async (req, res) => {
  try {
    const groups = await prisma.nhom_danh_mucs.findMany({
      include: {
        danh_mucs: {
          include: {
            _count: {
              select: { dia_diem_danh_mucs: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const formatted = groups.map((g) => ({
      id: g.id.toString(),
      ten_nhom: g.ten_nhom,
      mo_ta: g.mo_ta,
      created_at: g.created_at,
      so_luong_muc_con: g.danh_mucs.length,
      gioi_han_muc_con: 10,
      danh_mucs: g.danh_mucs.map((c) => ({
        id: c.id.toString(),
        nhom_danh_muc_id: c.nhom_danh_muc_id.toString(),
        ten_danh_muc: c.ten_danh_muc,
        mo_ta: c.mo_ta,
        so_dia_diem: c._count.dia_diem_danh_mucs,
      })),
    }));

    res.json({
      success: true,
      message: 'Lấy cây danh mục 2 cấp thành công',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// QUẢN LÝ NHÓM DANH MỤC (CẤP 1)
// ==========================================

// @desc  Admin tạo nhóm danh mục mới (PB15, UI_30)
// @route POST /api/categories/groups
export const createGroup = async (req, res) => {
  try {
    let { ten_nhom, mo_ta } = req.body;
    ten_nhom = ten_nhom ? ten_nhom.trim() : '';
    mo_ta = mo_ta ? mo_ta.trim() : null;

    if (!ten_nhom) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhóm danh mục không được để trống',
      });
    }

    // Kiểm tra chống trùng tên không dấu
    const existingGroups = await prisma.nhom_danh_mucs.findMany();
    const cleanNewName = removeDiacritics(ten_nhom);
    const isDuplicate = existingGroups.some(
      (g) => removeDiacritics(g.ten_nhom) === cleanNewName
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Tên nhóm danh mục "${ten_nhom}" đã tồn tại (hoặc tương tự khi viết không dấu)`,
      });
    }

    const group = await prisma.nhom_danh_mucs.create({
      data: {
        ten_nhom,
        mo_ta,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tạo nhóm danh mục thành công',
      data: {
        id: group.id.toString(),
        ten_nhom: group.ten_nhom,
        mo_ta: group.mo_ta,
        danh_mucs: [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin cập nhật nhóm danh mục (PB15, UI_30)
// @route PUT /api/categories/groups/:id
export const updateGroup = async (req, res) => {
  try {
    const groupId = BigInt(req.params.id);
    let { ten_nhom, mo_ta } = req.body;
    ten_nhom = ten_nhom ? ten_nhom.trim() : '';
    mo_ta = mo_ta ? mo_ta.trim() : null;

    if (!ten_nhom) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhóm danh mục không được để trống',
      });
    }

    // Kiểm tra chống trùng tên với các nhóm khác
    const cleanNewName = removeDiacritics(ten_nhom);
    const otherGroups = await prisma.nhom_danh_mucs.findMany({
      where: { NOT: { id: groupId } },
    });

    const isDuplicate = otherGroups.some(
      (g) => removeDiacritics(g.ten_nhom) === cleanNewName
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Tên nhóm danh mục "${ten_nhom}" đã trùng với nhóm khác`,
      });
    }

    const updated = await prisma.nhom_danh_mucs.update({
      where: { id: groupId },
      data: { ten_nhom, mo_ta },
    });

    res.json({
      success: true,
      message: 'Cập nhật nhóm danh mục thành công',
      data: {
        id: updated.id.toString(),
        ten_nhom: updated.ten_nhom,
        mo_ta: updated.mo_ta,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin xóa nhóm danh mục (PB15)
// @route DELETE /api/categories/groups/:id
export const deleteGroup = async (req, res) => {
  try {
    const groupId = BigInt(req.params.id);

    // Kiểm tra xem có danh mục con nào đang có địa điểm du lịch không
    const childCategories = await prisma.danh_mucs.findMany({
      where: { nhom_danh_muc_id: groupId },
      include: {
        _count: {
          select: { dia_diem_danh_mucs: true },
        },
      },
    });

    const totalUsed = childCategories.reduce(
      (sum, c) => sum + c._count.dia_diem_danh_mucs,
      0
    );

    if (totalUsed > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa nhóm này vì đang có ${totalUsed} địa điểm du lịch liên kết trong các danh mục con`,
      });
    }

    await prisma.nhom_danh_mucs.delete({
      where: { id: groupId },
    });

    res.json({
      success: true,
      message: 'Xóa nhóm danh mục thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// QUẢN LÝ DANH MỤC CON (CẤP 2)
// ==========================================

// @desc  Admin tạo danh mục con (PB15, UI_30)
// @route POST /api/categories/items
export const createCategory = async (req, res) => {
  try {
    let { nhom_danh_muc_id, ten_danh_muc, mo_ta } = req.body;
    ten_danh_muc = ten_danh_muc ? ten_danh_muc.trim() : '';
    mo_ta = mo_ta ? mo_ta.trim() : null;

    if (!nhom_danh_muc_id || !ten_danh_muc) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn nhóm danh mục cha và nhập tên danh mục con',
      });
    }

    const groupId = BigInt(nhom_danh_muc_id);

    // 1. Kiểm tra nhóm cha tồn tại
    const group = await prisma.nhom_danh_mucs.findUnique({
      where: { id: groupId },
      include: { danh_mucs: true },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Nhóm danh mục cha không tồn tại',
      });
    }

    // 2. RÀNG BUỘC CHUẨN PB15: Tối đa 10 mục con cho một nhóm
    if (group.danh_mucs.length >= 10) {
      return res.status(400).json({
        success: false,
        message: `Nhóm danh mục "${group.ten_nhom}" đã đạt giới hạn tối đa 10 danh mục con`,
      });
    }

    // 3. RÀNG BUỘC CHUẨN PB15: Chống trùng tên danh mục không dấu
    const cleanNewName = removeDiacritics(ten_danh_muc);
    const allCategories = await prisma.danh_mucs.findMany();
    const isDuplicate = allCategories.some(
      (c) => removeDiacritics(c.ten_danh_muc) === cleanNewName
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Tên danh mục "${ten_danh_muc}" đã tồn tại (hoặc tương tự khi viết không dấu)`,
      });
    }

    const category = await prisma.danh_mucs.create({
      data: {
        nhom_danh_muc_id: groupId,
        ten_danh_muc,
        mo_ta,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục con thành công',
      data: {
        id: category.id.toString(),
        nhom_danh_muc_id: category.nhom_danh_muc_id.toString(),
        ten_danh_muc: category.ten_danh_muc,
        mo_ta: category.mo_ta,
        so_dia_diem: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin sửa danh mục con (PB15, UI_30)
// @route PUT /api/categories/items/:id
export const updateCategory = async (req, res) => {
  try {
    const categoryId = BigInt(req.params.id);
    let { nhom_danh_muc_id, ten_danh_muc, mo_ta } = req.body;
    ten_danh_muc = ten_danh_muc ? ten_danh_muc.trim() : '';
    mo_ta = mo_ta ? mo_ta.trim() : null;

    if (!ten_danh_muc) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục con không được để trống',
      });
    }

    // Kiểm tra trùng tên với danh mục khác
    const cleanNewName = removeDiacritics(ten_danh_muc);
    const otherCategories = await prisma.danh_mucs.findMany({
      where: { NOT: { id: categoryId } },
    });

    const isDuplicate = otherCategories.some(
      (c) => removeDiacritics(c.ten_danh_muc) === cleanNewName
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Tên danh mục "${ten_danh_muc}" đã trùng với danh mục khác`,
      });
    }

    const updateData = { ten_danh_muc, mo_ta };
    if (nhom_danh_muc_id) {
      updateData.nhom_danh_muc_id = BigInt(nhom_danh_muc_id);
    }

    const updated = await prisma.danh_mucs.update({
      where: { id: categoryId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Cập nhật danh mục con thành công',
      data: {
        id: updated.id.toString(),
        nhom_danh_muc_id: updated.nhom_danh_muc_id.toString(),
        ten_danh_muc: updated.ten_danh_muc,
        mo_ta: updated.mo_ta,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Admin xóa danh mục con (PB15)
// @route DELETE /api/categories/items/:id
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = BigInt(req.params.id);

    // Kiểm tra ràng buộc có địa điểm nào đang dùng không
    const count = await prisma.dia_diem_danh_mucs.count({
      where: { danh_muc_id: categoryId },
    });

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục đang có ${count} địa điểm du lịch sử dụng`,
      });
    }

    await prisma.danh_mucs.delete({
      where: { id: categoryId },
    });

    res.json({
      success: true,
      message: 'Xóa danh mục con thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

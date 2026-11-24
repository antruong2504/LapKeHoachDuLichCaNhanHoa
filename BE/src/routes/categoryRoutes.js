import express from 'express';
import {
  getCategoryTree,
  createGroup,
  updateGroup,
  deleteGroup,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Xem cây danh mục 2 cấp (PB05, PB15)
router.get('/tree', getCategoryTree);
router.get('/', getCategoryTree);

// Quản trị viên: Quản lý nhóm danh mục Cấp 1 (PB15)
router.post('/groups', authenticate, requireAdmin, createGroup);
router.put('/groups/:id', authenticate, requireAdmin, updateGroup);
router.delete('/groups/:id', authenticate, requireAdmin, deleteGroup);

// Quản trị viên: Quản lý danh mục con Cấp 2 (PB15)
router.post('/items', authenticate, requireAdmin, createCategory);
router.post('/', authenticate, requireAdmin, createCategory);
router.put('/items/:id', authenticate, requireAdmin, updateCategory);
router.put('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/items/:id', authenticate, requireAdmin, deleteCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;

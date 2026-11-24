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
import { cacheResponse, invalidateOnMutation } from '../utils/memoryCache.js';

const router = express.Router();
const clearCatCache = invalidateOnMutation(['categories:', 'destinations:']);

// Public: Xem cây danh mục 2 cấp (PB05, PB15 - cache 5 phút)
router.get('/tree', cacheResponse('categories:', 300_000), getCategoryTree);
router.get('/', cacheResponse('categories:', 300_000), getCategoryTree);

// Quản trị viên: Quản lý nhóm danh mục Cấp 1 (PB15)
router.post('/groups', authenticate, requireAdmin, clearCatCache, createGroup);
router.put('/groups/:id', authenticate, requireAdmin, clearCatCache, updateGroup);
router.delete('/groups/:id', authenticate, requireAdmin, clearCatCache, deleteGroup);

// Quản trị viên: Quản lý danh mục con Cấp 2 (PB15)
router.post('/items', authenticate, requireAdmin, clearCatCache, createCategory);
router.post('/', authenticate, requireAdmin, clearCatCache, createCategory);
router.put('/items/:id', authenticate, requireAdmin, clearCatCache, updateCategory);
router.put('/:id', authenticate, requireAdmin, clearCatCache, updateCategory);
router.delete('/items/:id', authenticate, requireAdmin, clearCatCache, deleteCategory);
router.delete('/:id', authenticate, requireAdmin, clearCatCache, deleteCategory);

export default router;

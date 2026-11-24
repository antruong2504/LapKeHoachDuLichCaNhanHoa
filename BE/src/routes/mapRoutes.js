import express from 'express';
import { optimizeRoute, calculateRoute } from '../controllers/mapController.js';

const router = express.Router();

// 1. Tối ưu lộ trình theo thuật toán TSP Nearest Neighbor (PB06, UI_07, UI_12)
router.post('/optimize-route', optimizeRoute);

// 2. Tính toán khoảng cách & lộ trình theo thứ tự tùy chỉnh
router.post('/calculate-route', calculateRoute);

export default router;

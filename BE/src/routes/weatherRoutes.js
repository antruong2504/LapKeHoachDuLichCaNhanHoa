import express from 'express';
import { getWeather } from '../controllers/weatherController.js';

const router = express.Router();

// Lấy dự báo thời tiết (Public) - PB07, UI_06, UI_11
router.get('/', getWeather);

export default router;

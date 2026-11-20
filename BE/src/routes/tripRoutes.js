import express from 'express'
import {
  getMyTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  generatePlan,
} from '../controllers/tripController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Tất cả trip routes đều yêu cầu đăng nhập
router.use(protect)

router.route('/').get(getMyTrips).post(createTrip)
router.post('/generate', generatePlan)
router.route('/:id').get(getTripById).put(updateTrip).delete(deleteTrip)

export default router

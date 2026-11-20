import Trip from '../models/Trip.js'

// @desc  Lấy tất cả chuyến đi của user
// @route GET /api/trips
export const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, count: trips.length, data: trips })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc  Lấy chi tiết 1 chuyến đi
// @route GET /api/trips/:id
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id })
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' })
    }
    res.json({ success: true, data: trip })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc  Tạo chuyến đi mới
// @route POST /api/trips
export const createTrip = async (req, res) => {
  try {
    const tripData = { ...req.body, user: req.user._id }
    const trip = await Trip.create(tripData)
    res.status(201).json({ success: true, data: trip })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// @desc  Cập nhật chuyến đi
// @route PUT /api/trips/:id
export const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' })
    }
    res.json({ success: true, data: trip })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// @desc  Xóa chuyến đi
// @route DELETE /api/trips/:id
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' })
    }
    res.json({ success: true, message: 'Đã xóa chuyến đi thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc  Gợi ý kế hoạch (placeholder - tích hợp AI sau)
// @route POST /api/trips/generate
export const generatePlan = async (req, res) => {
  try {
    const { destination, startDate, endDate, interests, budget } = req.body
    // TODO: Tích hợp AI để tạo gợi ý thực tế
    const mockItinerary = [
      {
        day: 1,
        date: startDate,
        activities: [
          { time: '08:00', name: 'Đến nơi & nhận phòng', category: 'di chuyển', estimatedCost: 0 },
          { time: '10:00', name: `Khám phá trung tâm ${destination}`, category: 'tham quan', estimatedCost: 50000 },
          { time: '12:00', name: 'Ăn trưa đặc sản địa phương', category: 'ăn uống', estimatedCost: 100000 },
          { time: '14:00', name: 'Tham quan địa điểm nổi tiếng', category: 'tham quan', estimatedCost: 30000 },
          { time: '19:00', name: 'Ăn tối', category: 'ăn uống', estimatedCost: 150000 },
        ],
      },
    ]
    res.json({ success: true, data: { itinerary: mockItinerary, destination, interests, budget } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

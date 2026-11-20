import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  time: String,
  name: { type: String, required: true },
  description: String,
  location: String,
  estimatedCost: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['ăn uống', 'tham quan', 'di chuyển', 'nghỉ ngơi', 'mua sắm', 'khác'],
    default: 'khác',
  },
})

const dayPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: Date,
  activities: [activitySchema],
})

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      type: String,
      required: [true, 'Vui lòng chọn điểm đến'],
    },
    startDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày bắt đầu'],
    },
    endDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày kết thúc'],
    },
    budget: {
      type: Number,
      default: 0,
    },
    groupSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    interests: [String],
    notes: String,
    itinerary: [dayPlanSchema],
    status: {
      type: String,
      enum: ['draft', 'planned', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
)

export default mongoose.model('Trip', tripSchema)

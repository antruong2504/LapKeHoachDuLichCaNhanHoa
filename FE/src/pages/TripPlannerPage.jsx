import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'
import { tripService } from '../services/tripService'
import { useNavigate } from 'react-router-dom'

const DESTINATIONS = ['Hà Nội', 'Hội An', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Sapa', 'Hạ Long', 'Đà Lạt', 'TP. Hồ Chí Minh']
const INTERESTS = ['Văn hóa - Lịch sử', 'Ẩm thực', 'Thiên nhiên - Leo núi', 'Bãi biển', 'Mua sắm', 'Nghỉ dưỡng', 'Phiêu lưu']

export default function TripPlannerPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    interests: [],
    groupSize: 1,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const trip = await tripService.createTrip(form)
      navigate(`/trip/${trip.data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lập kế hoạch chuyến đi mới</h1>
        <p className="text-gray-500 mb-8">Điền thông tin để hệ thống gợi ý hành trình phù hợp nhất với bạn.</p>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          {/* Điểm đến */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Điểm đến</label>
            <select
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn điểm đến --</option>
              {DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Ngày */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Ngày bắt đầu</label>
              <input type="date" required value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Ngày kết thúc</label>
              <input type="date" required value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Ngân sách & Nhóm */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Ngân sách (VNĐ)</label>
              <input type="number" min="0" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="VD: 5000000"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">👥 Số người</label>
              <input type="number" min="1" max="50" value={form.groupSize}
                onChange={(e) => setForm({ ...form, groupSize: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sở thích */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">❤️ Sở thích</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition ${
                    form.interests.includes(interest)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Ghi chú thêm</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Yêu cầu đặc biệt, địa điểm muốn ghé thăm..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? '⏳ Đang tạo kế hoạch...' : '🚀 Tạo kế hoạch'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'
import { tripService } from '../services/tripService'
import { useNavigate } from 'react-router-dom'

const DESTINATIONS = ['Hà Nội', 'Hội An', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Sapa', 'Hạ Long', 'Đà Lạt', 'TP. Hồ Chí Minh']
const INTERESTS = ['Văn hóa - Lịch sử', 'Ẩm thực', 'Thiên nhiên - Leo núi', 'Bãi biển', 'Mua sắm', 'Nghỉ dưỡng', 'Phiêu lưu']

export default function TripPlannerPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    destination: '', startDate: '', endDate: '', budget: '',
    interests: [], groupSize: 1, notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const trip = await tripService.createTrip(form)
      navigate(`/trip/${trip.data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lập kế hoạch chuyến đi mới</h1>
        <p className="text-gray-500 mb-8">Điền thông tin để hệ thống gợi ý hành trình phù hợp nhất với bạn.</p>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 rounded-lg px-4 py-3 mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Điểm đến</label>
            <select required value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn điểm đến --</option>
              {DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Ngày bắt đầu</label>
              <input type="date" required value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Ngày kết thúc</label>
              <input type="date" required value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Ngân sách (VNĐ)</label>
              <input type="number" min="0" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="VD: 5000000"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">👥 Số người</label>
              <input type="number" min="1" max="50" value={form.groupSize}
                onChange={(e) => setForm({ ...form, groupSize: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">❤️ Sở thích</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition ${
                    form.interests.includes(interest)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Ghi chú thêm</label>
            <textarea rows={3} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Yêu cầu đặc biệt, địa điểm muốn ghé thăm..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-60">
            {loading ? '⏳ Đang tạo kế hoạch...' : '🚀 Tạo kế hoạch'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}


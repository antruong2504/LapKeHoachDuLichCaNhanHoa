import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { tripService } from '../services/tripService'

export default function MyTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tripService.getMyTrips()
      .then((data) => setTrips(data.data))
      .catch(() => setError('Không thể tải danh sách chuyến đi.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa chuyến đi này?')) return
    await tripService.deleteTrip(id)
    setTrips((prev) => prev.filter((t) => t._id !== id))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Chuyến đi của tôi</h1>
          <Link
            to="/planner"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Tạo chuyến đi mới
          </Link>
        </div>

        {loading && <LoadingSpinner text="Đang tải chuyến đi..." />}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg">Bạn chưa có chuyến đi nào.</p>
            <Link to="/planner" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
              Lập kế hoạch ngay →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-24 flex items-center justify-center">
                <span className="text-4xl">📍</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{trip.destination}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  📅 {new Date(trip.startDate).toLocaleDateString('vi-VN')} → {new Date(trip.endDate).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-sm text-gray-500 mb-3">👥 {trip.groupSize} người</p>
                <div className="flex gap-2">
                  <Link
                    to={`/trip/${trip._id}`}
                    className="flex-1 text-center bg-blue-50 text-blue-600 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    Xem chi tiết
                  </Link>
                  <button
                    onClick={() => handleDelete(trip._id)}
                    className="text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { tripService } from '../services/tripService'

export default function MyTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tripService.getMyTrips()
      .then((data) => setTrips(data.data))
      .catch(() => setError('Không thể tải danh sách chuyến đi.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa chuyến đi này?')) return
    await tripService.deleteTrip(id)
    setTrips((prev) => prev.filter((t) => t._id !== id))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Chuyến đi của tôi</h1>
          <Link to="/planner"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
            + Tạo chuyến đi mới
          </Link>
        </div>

        {loading && <LoadingSpinner text="Đang tải chuyến đi..." />}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg">Bạn chưa có chuyến đi nào.</p>
            <Link to="/planner" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
              Lập kế hoạch ngay →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-24 flex items-center justify-center">
                <span className="text-4xl">📍</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{trip.destination}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  📅 {new Date(trip.startDate).toLocaleDateString('vi-VN')} → {new Date(trip.endDate).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-sm text-gray-500 mb-3">👥 {trip.groupSize} người</p>
                <div className="flex gap-2">
                  <Link to={`/trip/${trip._id}`}
                    className="flex-1 text-center bg-blue-50 text-blue-600 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition">
                    Xem chi tiết
                  </Link>
                  <button onClick={() => handleDelete(trip._id)}
                    className="text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}


import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { tripService } from '../services/tripService'

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tripService.getTripById(id)
      .then((data) => setTrip(data.data))
      .catch(() => navigate('/my-trips'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner text="Đang tải chi tiết chuyến đi..." />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <button onClick={() => navigate('/my-trips')} className="text-blue-600 mb-6 hover:underline">
          ← Quay lại danh sách
        </button>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📍 {trip?.destination}</h1>
          <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-6">
            <span>📅 {new Date(trip?.startDate).toLocaleDateString('vi-VN')} → {new Date(trip?.endDate).toLocaleDateString('vi-VN')}</span>
            <span>👥 {trip?.groupSize} người</span>
            {trip?.budget && <span>💰 {Number(trip.budget).toLocaleString('vi-VN')} VNĐ</span>}
          </div>

          {trip?.interests?.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-700 mb-2">Sở thích</h2>
              <div className="flex flex-wrap gap-2">
                {trip.interests.map((i) => (
                  <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{i}</span>
                ))}
              </div>
            </div>
          )}

          {trip?.notes && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-2">Ghi chú</h2>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{trip.notes}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { tripService } from '../services/tripService'

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tripService.getTripById(id)
      .then((data) => setTrip(data.data))
      .catch(() => navigate('/my-trips'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner text="Đang tải chi tiết chuyến đi..." />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <button onClick={() => navigate('/my-trips')} className="text-blue-600 mb-6 hover:underline">
          ← Quay lại danh sách
        </button>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📍 {trip?.destination}</h1>
          <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-6">
            <span>📅 {new Date(trip?.startDate).toLocaleDateString('vi-VN')} → {new Date(trip?.endDate).toLocaleDateString('vi-VN')}</span>
            <span>👥 {trip?.groupSize} người</span>
            {trip?.budget && <span>💰 {Number(trip.budget).toLocaleString('vi-VN')} VNĐ</span>}
          </div>

          {trip?.interests?.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-700 mb-2">Sở thích</h2>
              <div className="flex flex-wrap gap-2">
                {trip.interests.map((i) => (
                  <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{i}</span>
                ))}
              </div>
            </div>
          )}

          {trip?.notes && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-2">Ghi chú</h2>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{trip.notes}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}


import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-8xl mb-6">🗺️</div>
      <h1 className="text-5xl font-bold text-gray-800 mb-3">404</h1>
      <p className="text-xl text-gray-500 mb-8">Trang bạn tìm kiếm không tồn tại.</p>
      <Link
        to="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
      >
        ← Về trang chủ
      </Link>
    </div>
  )
}

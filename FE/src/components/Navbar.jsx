import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          🌏 Du Lịch Cá Nhân Hóa
        </Link>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link to="/planner" className="text-gray-700 hover:text-blue-600 font-medium">
                Lập kế hoạch
              </Link>
              <Link to="/my-trips" className="text-gray-700 hover:text-blue-600 font-medium">
                Chuyến đi của tôi
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                👤 {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          🌏 Du Lịch Cá Nhân Hóa
        </Link>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link to="/planner" className="text-gray-700 hover:text-blue-600 font-medium">
                Lập kế hoạch
              </Link>
              <Link to="/my-trips" className="text-gray-700 hover:text-blue-600 font-medium">
                Chuyến đi của tôi
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                👤 {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


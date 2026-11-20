import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '' })
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.updateProfile(form)
      setSuccess('Cập nhật thông tin thành công!')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Thông tin cá nhân</h1>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-600 rounded-lg px-4 py-3 mb-6 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>

          <hr className="my-6" />

          <button
            onClick={logout}
            className="w-full border border-red-300 text-red-500 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition"
          >
            Đăng xuất
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '' })
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.updateProfile(form)
      setSuccess('Cập nhật thông tin thành công!')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Thông tin cá nhân</h1>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-600 rounded-lg px-4 py-3 mb-6 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>

          <hr className="my-6" />

          <button onClick={logout}
            className="w-full border border-red-300 text-red-500 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition">
            Đăng xuất
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}


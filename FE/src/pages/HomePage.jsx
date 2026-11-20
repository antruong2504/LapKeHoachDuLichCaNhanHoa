import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-24 px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">🌏 Lập Kế Hoạch Du Lịch Cá Nhân Hóa</h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
          Khám phá thế giới theo cách của bạn. Hệ thống thông minh giúp lập kế hoạch
          chuyến đi phù hợp với sở thích, ngân sách và thời gian của bạn.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {user ? (
            <Link
              to="/planner"
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition text-lg"
            >
              Lập kế hoạch ngay →
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition text-lg"
              >
                Bắt đầu miễn phí
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-xl hover:bg-white hover:text-blue-600 transition text-lg"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Tính năng nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🗺️', title: 'Lập lịch thông minh', desc: 'Gợi ý hành trình dựa trên sở thích cá nhân và địa điểm mong muốn.' },
            { icon: '💰', title: 'Quản lý ngân sách', desc: 'Theo dõi chi tiêu, ước tính chi phí và tối ưu ngân sách cho chuyến đi.' },
            { icon: '📋', title: 'Lưu & chia sẻ', desc: 'Lưu nhiều kế hoạch, chỉnh sửa và chia sẻ với bạn bè dễ dàng.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  )
}
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-24 px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">🌏 Lập Kế Hoạch Du Lịch Cá Nhân Hóa</h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
          Khám phá thế giới theo cách của bạn. Hệ thống thông minh giúp lập kế hoạch
          chuyến đi phù hợp với sở thích, ngân sách và thời gian của bạn.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {user ? (
            <Link
              to="/planner"
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition text-lg"
            >
              Lập kế hoạch ngay →
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition text-lg"
              >
                Bắt đầu miễn phí
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-xl hover:bg-white hover:text-blue-600 transition text-lg"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Tính năng nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🗺️', title: 'Lập lịch thông minh', desc: 'Gợi ý hành trình dựa trên sở thích cá nhân và địa điểm mong muốn.' },
            { icon: '💰', title: 'Quản lý ngân sách', desc: 'Theo dõi chi tiêu, ước tính chi phí và tối ưu ngân sách cho chuyến đi.' },
            { icon: '📋', title: 'Lưu & chia sẻ', desc: 'Lưu nhiều kế hoạch, chỉnh sửa và chia sẻ với bạn bè dễ dàng.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  )
}


import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Cột 1: Giới thiệu TripMate */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white">TripMate</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Nền tảng nghiên cứu và phát triển lập kế hoạch du lịch cá nhân hóa ứng dụng AI thông minh. Đồng hành cùng bạn trên mọi nẻo đường Việt Nam.
            </p>
            <p className="text-xs text-slate-500">
              Đồ án Capstone Nhóm 1 • Khoa CNTT • Đại học Duy Tân
            </p>
          </div>

          {/* Cột 2: Khám phá */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Khám phá</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/destinations" className="hover:text-teal-400 transition-colors">
                  Điểm đến nổi bật
                </Link>
              </li>
              <li>
                <Link to="/destinations?tinh=Đà Nẵng" className="hover:text-teal-400 transition-colors">
                  Du lịch Đà Nẵng
                </Link>
              </li>
              <li>
                <Link to="/destinations?tinh=Quảng Nam" className="hover:text-teal-400 transition-colors">
                  Phố cổ Hội An
                </Link>
              </li>
              <li>
                <Link to="/destinations?tinh=Thừa Thiên Huế" className="hover:text-teal-400 transition-colors">
                  Cố đô Huế
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Công cụ du lịch */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Công cụ</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/trips/ai-create" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> Tạo lịch trình bằng AI
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-teal-400 transition-colors">
                  Bản đồ & Tối ưu lộ trình
                </Link>
              </li>
              <li>
                <Link to="/weather" className="hover:text-teal-400 transition-colors">
                  Dự báo thời tiết 5 ngày
                </Link>
              </li>
              <li>
                <Link to="/guides" className="hover:text-teal-400 transition-colors">
                  Cẩm nang du lịch cộng đồng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ & Trợ giúp */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Khoa CNTT - Đại học Duy Tân, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>support@tripmate.vn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>1900 6868</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 TripMate. Nền tảng lập kế hoạch du lịch thông minh.</p>
          <p className="flex items-center gap-1">
            Đồng hành cùng bạn trên mọi hành trình <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Compass, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ten_dang_nhap: '',
    mat_khau: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError('');
      setIsLocked(false);
    }
  };

  const handleQuickFill = (username, password) => {
    setForm({ ten_dang_nhap: username, mat_khau: password });
    setError('');
    setIsLocked(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLocked(false);

    if (!form.ten_dang_nhap.trim() || !form.mat_khau) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(form.ten_dang_nhap.trim(), form.mat_khau);

      // Điều hướng theo phân quyền (PB02, UI_02 -> UI_26 hoặc UI_08)
      if (userData.vai_tro === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      let msg = err.message || err.response?.data?.message || 'Đăng nhập thất bại';
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        msg = 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.';
      }
      setError(msg);
      if (msg.includes('bị khóa') || err.data?.trang_thai === 'bi_khoa') {
        setIsLocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 group-hover:scale-105 transition">
              <Compass className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Trip<span className="text-teal-600">Mate</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Đăng nhập hệ thống
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Chào mừng bạn trở lại với nền tảng du lịch TripMate
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-9">
          {error && (
            <div className={`mb-6 rounded-2xl border p-4 text-sm flex items-start gap-3 ${
              isLocked 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {isLocked ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{isLocked ? 'Cảnh báo tài khoản bị khóa' : 'Đăng nhập không thành công'}</p>
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tên đăng nhập / Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tên đăng nhập hoặc Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="ten_dang_nhap"
                  required
                  value={form.ten_dang_nhap}
                  onChange={handleChange}
                  placeholder="Tên đăng nhập hoặc email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="mat_khau"
                  required
                  value={form.mat_khau}
                  onChange={handleChange}
                  placeholder="Mật khẩu"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Bạn chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 underline underline-offset-4 transition">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

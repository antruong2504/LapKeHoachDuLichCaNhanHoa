import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ten_dang_nhap: '',
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '',
    xac_nhan_mat_khau: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password rules validation check
  const passwordCriteria = {
    hasMinLen: form.mat_khau.length >= 8,
    hasUpper: /[A-Z]/.test(form.mat_khau),
    hasNumber: /\d/.test(form.mat_khau),
    hasSpecial: /[^a-zA-Z0-9]/.test(form.mat_khau),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const isPhoneValid = /^0\d{9}$/.test(form.so_dien_thoai);
  const isConfirmMatch = form.mat_khau && form.mat_khau === form.xac_nhan_mat_khau;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!form.ten_dang_nhap.trim() || !form.ho_ten.trim() || !form.email.trim() || !form.so_dien_thoai.trim()) {
      setError('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (!isPhoneValid) {
      setError('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.');
      return;
    }

    if (!isPasswordValid) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ số và ký tự đặc biệt.');
      return;
    }

    if (!isConfirmMatch) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    try {
      await register({
        ten_dang_nhap: form.ten_dang_nhap.trim(),
        ho_ten: form.ho_ten.trim(),
        email: form.email.trim(),
        so_dien_thoai: form.so_dien_thoai.trim(),
        mat_khau: form.mat_khau,
        xac_nhan_mat_khau: form.xac_nhan_mat_khau,
      });

      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      let serverMsg = err.response?.data?.message || err.message || 'Đăng ký tài khoản thất bại';
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        serverMsg = 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.';
      }
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/20 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
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
            Tạo tài khoản mới
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Bắt đầu khám phá và lên lịch trình du lịch thông minh cùng trợ lý AI
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10">
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Đăng ký không thành công</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-2xl bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tên đăng nhập & Họ tên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="ten_dang_nhap"
                    required
                    value={form.ten_dang_nhap}
                    onChange={handleChange}
                    placeholder="Tên đăng nhập"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="ho_ten"
                    required
                    value={form.ho_ten}
                    onChange={handleChange}
                    placeholder="Họ và tên"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                  />
                </div>
              </div>
            </div>

            {/* Email & Số điện thoại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Địa chỉ email"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="so_dien_thoai"
                    required
                    maxLength={10}
                    value={form.so_dien_thoai}
                    onChange={handleChange}
                    placeholder="Số điện thoại"
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition duration-150 ${
                      form.so_dien_thoai && !isPhoneValid
                        ? 'border-amber-400 focus:ring-amber-400/20 focus:border-amber-500'
                        : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                </div>
                {form.so_dien_thoai && !isPhoneValid && (
                  <p className="mt-1 text-xs text-amber-600">
                    SĐT phải gồm 10 chữ số và bắt đầu bằng số 0
                  </p>
                )}
              </div>
            </div>

            {/* Mật khẩu & Xác nhận mật khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="mat_khau"
                    required
                    value={form.mat_khau}
                    onChange={handleChange}
                    placeholder="Mật khẩu (tối thiểu 8 ký tự)"
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="xac_nhan_mat_khau"
                    required
                    value={form.xac_nhan_mat_khau}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                    className={`w-full pl-11 pr-11 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition duration-150 ${
                      form.xac_nhan_mat_khau && !isConfirmMatch
                        ? 'border-red-300 focus:ring-red-400/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.xac_nhan_mat_khau && !isConfirmMatch && (
                  <p className="mt-1 text-xs text-red-500">
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
              </div>
            </div>

            {/* Checklist tiêu chí mật khẩu chuẩn PB01 */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Tiêu chuẩn mật khẩu an toàn:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-500">
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLen ? 'text-teal-700 font-medium' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordCriteria.hasMinLen ? 'text-teal-600' : 'text-slate-300'}`} />
                  <span>Ít nhất 8 ký tự</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-teal-700 font-medium' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordCriteria.hasUpper ? 'text-teal-600' : 'text-slate-300'}`} />
                  <span>Ít nhất 1 chữ in hoa</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-teal-700 font-medium' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordCriteria.hasNumber ? 'text-teal-600' : 'text-slate-300'}`} />
                  <span>Ít nhất 1 chữ số</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-teal-700 font-medium' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordCriteria.hasSpecial ? 'text-teal-600' : 'text-slate-300'}`} />
                  <span>Ít nhất 1 ký tự đặc biệt</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký tài khoản TripMate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Bạn đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 underline underline-offset-4 transition">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

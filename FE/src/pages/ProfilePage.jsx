import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  LogOut, 
  Compass, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  Calendar,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Form Profile State
  const [profileForm, setProfileForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    ten_dang_nhap: '',
    email: '',
    vai_tro: '',
    anh_dai_dien: '',
  });

  // Form Password State
  const [passwordForm, setPasswordForm] = useState({
    mat_khau_cu: '',
    mat_khau_moi: '',
    xac_nhan_mat_khau_moi: '',
  });

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [toast, setToast] = useState({ type: '', message: '' });

  // Tiêu chí mật khẩu mới
  const passwordCriteria = {
    hasMinLen: passwordForm.mat_khau_moi.length >= 8,
    hasUpper: /[A-Z]/.test(passwordForm.mat_khau_moi),
    hasNumber: /\d/.test(passwordForm.mat_khau_moi),
    hasSpecial: /[^a-zA-Z0-9]/.test(passwordForm.mat_khau_moi),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const isConfirmMatch = passwordForm.mat_khau_moi && passwordForm.mat_khau_moi === passwordForm.xac_nhan_mat_khau_moi;

  // Lấy dữ liệu hồ sơ cá nhân khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (res.success && res.data) {
          const d = res.data;
          setProfileForm({
            ho_ten: d.ho_ten || '',
            so_dien_thoai: d.so_dien_thoai || '',
            ten_dang_nhap: d.ten_dang_nhap || '',
            email: d.email || '',
            vai_tro: d.vai_tro || 'khach_hang',
            anh_dai_dien: d.anh_dai_dien || '',
          });
        }
      } catch (err) {
        // Fallback vào AuthContext nếu chưa gọi được API
        if (user) {
          setProfileForm({
            ho_ten: user.ho_ten || '',
            so_dien_thoai: user.so_dien_thoai || '',
            ten_dang_nhap: user.ten_dang_nhap || '',
            email: user.email || '',
            vai_tro: user.vai_tro || 'khach_hang',
            anh_dai_dien: user.anh_dai_dien || '',
          });
        }
      }
    };

    fetchProfile();
  }, [user]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  // Cập nhật thông tin hồ sơ (UI_13)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.ho_ten.trim()) {
      showToast('error', 'Họ và tên không được để trống');
      return;
    }

    if (profileForm.so_dien_thoai && !/^0\d{9}$/.test(profileForm.so_dien_thoai.trim())) {
      showToast('error', 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0');
      return;
    }

    setLoadingProfile(true);
    try {
      const res = await authService.updateProfile({
        ho_ten: profileForm.ho_ten.trim(),
        so_dien_thoai: profileForm.so_dien_thoai.trim(),
      });
      if (res.success) {
        showToast('success', 'Cập nhật thông tin hồ sơ thành công!');
        // Cập nhật localStorage
        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.ho_ten = profileForm.ho_ten.trim();
          parsed.so_dien_thoai = profileForm.so_dien_thoai.trim();
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Tải lên ảnh đại diện (Multer + Supabase Storage)
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Chỉ chấp nhận file định dạng hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Kích thước file ảnh tối đa là 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await authService.uploadAvatar(formData);
      if (res.success && res.data) {
        setProfileForm((prev) => ({ ...prev, anh_dai_dien: res.data.anh_dai_dien }));
        showToast('success', 'Đổi ảnh đại diện thành công!');
        // Cập nhật user trong localStorage
        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.anh_dai_dien = res.data.anh_dai_dien;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Tải ảnh đại diện thất bại');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Đổi mật khẩu (UI_14)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.mat_khau_cu || !passwordForm.mat_khau_moi || !passwordForm.xac_nhan_mat_khau_moi) {
      showToast('error', 'Vui lòng điền đầy đủ tất cả các trường mật khẩu');
      return;
    }

    if (!isPasswordValid) {
      showToast('error', 'Mật khẩu mới chưa đạt tiêu chuẩn bảo mật (ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt)');
      return;
    }

    if (!isConfirmMatch) {
      showToast('error', 'Xác nhận mật khẩu không khớp');
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await authService.changePassword({
        mat_khau_cu: passwordForm.mat_khau_cu,
        mat_khau_moi: passwordForm.mat_khau_moi,
        xac_nhan_mat_khau_moi: passwordForm.xac_nhan_mat_khau_moi,
      });

      if (res.success) {
        showToast('success', 'Đổi mật khẩu thành công!');
        setPasswordForm({
          mat_khau_cu: '',
          mat_khau_moi: '',
          xac_nhan_mat_khau_moi: '',
        });
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Toast Alert Notification */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium transition-all transform animate-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-teal-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý thông tin tài khoản, ảnh đại diện và tùy chọn bảo mật của bạn
        </p>
      </div>

      {/* 2-Column Grid Layout (UI_13, UI_14) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Summary & Navigation (4/12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-teal-50 shadow-md mx-auto bg-slate-100 flex items-center justify-center">
                {profileForm.anh_dai_dien ? (
                  <img
                    src={profileForm.anh_dai_dien}
                    alt={profileForm.ho_ten}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-teal-700">
                    {profileForm.ho_ten?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Upload Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-md transition disabled:opacity-50 cursor-pointer"
                title="Thay đổi ảnh đại diện (Tối đa 5MB)"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 truncate">
              {profileForm.ho_ten || 'Người dùng TripMate'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">@{profileForm.ten_dang_nhap}</p>

            {/* Role Badge */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  profileForm.vai_tro === 'admin'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                {profileForm.vai_tro === 'admin' ? '👑 Quản trị viên' : '👤 Khách hàng'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-1.5 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Thông tin cá nhân</span>
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition text-left cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <KeyRound className={`w-4 h-4 ${activeTab === 'password' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Đổi mật khẩu</span>
            </button>

            <Link
              to="/my-trips"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              <span>Chuyến đi của tôi</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 transition text-left cursor-pointer pt-2"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </nav>
        </div>

        {/* Right Column: Tab Content (8/12) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-9">
          {/* TAB 1: Thông tin cá nhân (UI_13) */}
          {activeTab === 'profile' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Chi tiết thông tin cá nhân</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Cập nhật họ tên và số điện thoại liên hệ cho tài khoản của bạn
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Tên đăng nhập & Email (Readonly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        disabled
                        value={profileForm.ten_dang_nhap}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Tên đăng nhập là cố định</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={profileForm.email}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-teal-600 font-medium">✓ Đã liên kết tài khoản</p>
                  </div>
                </div>

                {/* Họ tên & Số điện thoại (Editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={profileForm.ho_ten}
                        onChange={(e) => setProfileForm({ ...profileForm, ho_ten: e.target.value })}
                        placeholder="Họ và tên"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={profileForm.so_dien_thoai}
                        onChange={(e) => setProfileForm({ ...profileForm, so_dien_thoai: e.target.value })}
                        placeholder="Số điện thoại"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                      />
                    </div>
                    {profileForm.so_dien_thoai && !/^0\d{9}$/.test(profileForm.so_dien_thoai) && (
                      <p className="mt-1 text-xs text-amber-600">SĐT phải có 10 chữ số và bắt đầu bằng số 0</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingProfile}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loadingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Đổi mật khẩu (UI_14) */}
          {activeTab === 'password' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Thiết lập mật khẩu mới</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Mật khẩu cần tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Mật khẩu hiện tại */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      required
                      value={passwordForm.mat_khau_cu}
                      onChange={(e) => setPasswordForm({ ...passwordForm, mat_khau_cu: e.target.value })}
                      placeholder="Mật khẩu"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={passwordForm.mat_khau_moi}
                      onChange={(e) => setPasswordForm({ ...passwordForm, mat_khau_moi: e.target.value })}
                      placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={passwordForm.xac_nhan_mat_khau_moi}
                      onChange={(e) => setPasswordForm({ ...passwordForm, xac_nhan_mat_khau_moi: e.target.value })}
                      placeholder="Xác nhận mật khẩu"
                      className={`w-full pl-10 pr-11 py-3 bg-slate-50 hover:bg-white hover:border-slate-300 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition duration-150 ${
                        passwordForm.xac_nhan_mat_khau_moi && !isConfirmMatch
                          ? 'border-red-300 focus:ring-red-400/20 focus:border-red-500'
                          : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.xac_nhan_mat_khau_moi && !isConfirmMatch && (
                    <p className="mt-1 text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
                  )}
                </div>

                {/* Tiêu chí mật khẩu */}
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
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loadingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Cập nhật mật khẩu</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

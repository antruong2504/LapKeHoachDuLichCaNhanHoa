import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GuestLayout from './layouts/GuestLayout';
import AdminLayout from './layouts/AdminLayout';

// Public & Customer Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyTripsPage from './pages/MyTripsPage';
import TripDetailPage from './pages/TripDetailPage';
import DestinationsPage from './pages/DestinationsPage';
import DestinationDetailPage from './pages/DestinationDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import MapRoutePage from './pages/MapRoutePage';
import WeatherPage from './pages/WeatherPage';
import TripPlannerPage from './pages/TripPlannerPage';
import ManualTripCreatePage from './pages/ManualTripCreatePage';
import GuidesPage from './pages/GuidesPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminDestinationsPage from './pages/admin/AdminDestinationsPage';
import AdminGuidesPage from './pages/admin/AdminGuidesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Placeholder Admin Dashboard Page (PB18 / UI_26)
const AdminDashboard = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <h2 className="text-xl font-bold text-slate-900">Tổng Quan Hệ Thống TripMate (Admin)</h2>
    <p className="text-sm text-slate-500 mt-1">Dữ liệu thời gian thực được đồng bộ trực tiếp từ Supabase Cloud PostgreSQL (UTC+7)</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
        <p className="text-xs font-semibold uppercase text-teal-700">Tỉnh / Thành phố</p>
        <p className="text-2xl font-bold text-teal-900 mt-1">7</p>
      </div>
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
        <p className="text-xs font-semibold uppercase text-emerald-700">Địa điểm du lịch</p>
        <p className="text-2xl font-bold text-emerald-900 mt-1">12</p>
      </div>
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-xs font-semibold uppercase text-amber-700">Tài khoản người dùng</p>
        <p className="text-2xl font-bold text-amber-900 mt-1">4</p>
      </div>
      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <p className="text-xs font-semibold uppercase text-indigo-700">Cẩm nang & Nhóm chat</p>
        <p className="text-2xl font-bold text-indigo-900 mt-1">2</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main User & Guest Layout (UI_01 - UI_25) */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-trips" element={<MyTripsPage />} />
            <Route path="/my-trips/:id" element={<TripDetailPage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />

            {/* Sprint 2: PB05 Trang Khám phá & Chi tiết địa điểm (UI_04, UI_05, UI_09, UI_10) */}
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/destinations/:id" element={<DestinationDetailPage />} />
            {/* Sprint 2: PB06 Trang Bản đồ & Lộ trình OSRM/TSP (UI_07, UI_12) */}
            <Route path="/map" element={<MapRoutePage />} />
            {/* Sprint 2: PB07 Trang Dự báo thời tiết 5 ngày (UI_06, UI_11) */}
            <Route path="/weather" element={<WeatherPage />} />
            {/* Sprint 2: PB08 Tạo lịch trình du lịch bằng Gemini AI (UI_17, UI_18) */}
            <Route path="/trips/ai-create" element={<TripPlannerPage />} />
            <Route path="/trips/create" element={<TripPlannerPage />} />
            {/* Sprint 2: PB20 Tạo lịch trình thủ công (UI_19) */}
            <Route path="/trips/manual-create" element={<ManualTripCreatePage />} />
            {/* Sprint 3: PB11 Chia sẻ cẩm nang du lịch (UI_23) */}
            <Route path="/guides" element={<GuidesPage />} />
            {/* Sprint 3: PB12 Trò chuyện nhóm realtime Socket.io (UI_24) */}
            <Route path="/chat" element={<ChatPage />} />
            {/* Sprint 2: PB04 Trang Danh sách yêu thích (UI_15) */}
            <Route path="/favorites" element={<FavoritesPage />} />
            {/* Sprint 3: PB13 Nhận thông báo realtime (UI_25) */}
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Admin Layout (UI_26 - UI_39) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="destinations" element={<AdminDestinationsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="guides" element={<AdminGuidesPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

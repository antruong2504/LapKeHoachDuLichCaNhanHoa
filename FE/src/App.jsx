import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GuestLayout from './layouts/GuestLayout';
import AdminLayout from './layouts/AdminLayout';

// Core Public Pages (eager load for instant first paint)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Lazy-loaded Pages (bundle splitting for fast load)
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const DestinationDetailPage = lazy(() => import('./pages/DestinationDetailPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const MapRoutePage = lazy(() => import('./pages/MapRoutePage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const TripPlannerPage = lazy(() => import('./pages/TripPlannerPage'));
const ManualTripCreatePage = lazy(() => import('./pages/ManualTripCreatePage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminDestinationsPage = lazy(() => import('./pages/admin/AdminDestinationsPage'));
const AdminGuidesPage = lazy(() => import('./pages/admin/AdminGuidesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-9 h-9 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

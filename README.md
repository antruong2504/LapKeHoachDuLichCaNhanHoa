# 🌏 Lập Kế Hoạch Du Lịch Cá Nhân Hóa

Hệ thống web hỗ trợ người dùng lập kế hoạch du lịch cá nhân hóa thông minh dựa trên sở thích, ngân sách và thời gian.

## 📁 Cấu trúc dự án

```
LapKeHoachDuLichCaNhanHoa/
├── FE/          ← ReactJS (Vite) + TailwindCSS
└── BE/          ← Node.js + Express + MongoDB
```

## 🚀 Hướng dẫn chạy

### Backend (BE)
```bash
cd BE
cp .env.example .env     # Cấu hình biến môi trường
npm install
npm run dev              # Chạy tại http://localhost:5000
```

### Frontend (FE)
```bash
cd FE
cp .env.example .env     # Cấu hình biến môi trường
npm install
npm run dev              # Chạy tại http://localhost:3000
```

## 🛠️ Công nghệ sử dụng

| Layer     | Công nghệ                                |
|-----------|------------------------------------------|
| Frontend  | ReactJS 19, Vite 8, TailwindCSS 4        |
| Backend   | Node.js, Express 4, MongoDB, Mongoose    |
| Auth      | JWT (JSON Web Token)                     |
| State     | React Context API                        |
| HTTP      | Axios                                    |
| Routing   | React Router DOM v6                      |

## 👥 Thành viên nhóm

| Thành viên | Vai trò |
|------------|---------|
| Nhóm trưởng | Phân tích yêu cầu, thiết kế hệ thống, kiểm tra tích hợp |
| Thành viên 1 | Frontend - UI/UX, Trang chủ, Đăng nhập/Đăng ký |
| Thành viên 2 | Frontend - Lập kế hoạch, Danh sách chuyến đi |
| Thành viên 3 | Backend - API Auth, User Management |
| Thành viên 4 | Backend - API Trip, Database Schema |

## 📡 API Endpoints

### Auth
| Method | Endpoint          | Mô tả                    |
|--------|-------------------|--------------------------|
| POST   | /api/auth/register | Đăng ký tài khoản        |
| POST   | /api/auth/login    | Đăng nhập                |
| GET    | /api/auth/me       | Lấy thông tin user       |
| PUT    | /api/auth/me       | Cập nhật thông tin user  |

### Trips (cần xác thực)
| Method | Endpoint              | Mô tả                     |
|--------|-----------------------|---------------------------|
| GET    | /api/trips            | Lấy tất cả chuyến đi      |
| POST   | /api/trips            | Tạo chuyến đi mới         |
| GET    | /api/trips/:id        | Chi tiết chuyến đi        |
| PUT    | /api/trips/:id        | Cập nhật chuyến đi        |
| DELETE | /api/trips/:id        | Xóa chuyến đi             |
| POST   | /api/trips/generate   | Gợi ý kế hoạch AI         |

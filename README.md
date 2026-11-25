# TRIPMATE — Nền Tảng Lập Kế Hoạch Du Lịch Cá Nhân Hóa Ứng Dụng AI

> **Đồ án Capstone:** Nhóm phát triển TripMate — Khoa Công nghệ Thông tin  
> **Phiên bản:** TripMate v1.0.0 (Node.js/Express + React Vite + Supabase PostgreSQL)

TripMate là nền tảng hỗ trợ người dùng khám phá địa điểm du lịch Việt Nam, theo dõi dự báo thời tiết theo từng ngày, tối ưu hóa lộ trình di chuyển trên bản đồ OpenStreetMap/OSRM, lập lịch trình du lịch cá nhân hóa bằng Google Gemini AI, chia sẻ cẩm nang cộng đồng và trò chuyện nhóm theo thời gian thực.

---

## 1. Tính năng nổi bật

- **Lập lịch trình thông minh bằng Gemini AI (`@google/genai`):**
  - Hỗ trợ chọn **1 hoặc nhiều tỉnh/thành** trong danh sách **63 tỉnh/thành Việt Nam** (hoặc nhập thêm địa danh bất kỳ).
  - Ưu tiên sử dụng bộ dữ liệu địa điểm đã duyệt trong CSDL cho các tỉnh có dữ liệu; tự động gợi ý địa danh thực tế cho các tỉnh chưa có địa điểm mẫu.
  - **Thích ứng thời tiết thực tế:** Tự động lấy dự báo thời tiết từng tỉnh/ngày để ưu tiên điểm trong nhà khi mưa/dông và điểm ngoài trời khi nắng đẹp, kèm gợi ý chuẩn bị.
  - **Thời gian di chuyển thực tế (OSRM):** Tính khoảng cách & thời gian di chuyển thực tế giữa các chặng (và chặng chuyển tỉnh), giữ khung giờ linh hoạt (2–6 chặng/ngày, không gò bó cố định 08:00–20:00).
  - **Cá nhân hóa sâu:** Tùy chỉnh nhịp độ, phương tiện ưu tiên, đối tượng đồng hành, phong cách lưu trú, điểm xuất phát ngày 1, giờ đến ngày đầu và giờ về ngày cuối.
  - **Quản lý ngân sách & chỉnh sửa nhanh:** Phân tách chi phí 4 nhóm (*Tham quan, Ăn uống, Di chuyển, Lưu trú*), nút **Tối ưu lại cho vừa ngân sách** (`POST /api/ai/optimize-budget`), **Tạo lại ngày này** (`POST /api/ai/regenerate-day`), và đổi thứ tự / xóa chặng trực tiếp trên bản nháp (`PUT /api/ai/draft/:id`) trước khi lưu chính thức.
- **Bản đồ & Tối ưu lộ trình (Leaflet + OSRM):**
  - Tự chọn điểm tham quan từ danh sách, tùy chọn điểm xuất phát và tối ưu thứ tự di chuyển bằng thuật toán TSP Nearest Neighbor + OSRM Driving Route.
- **Dự báo thời tiết du lịch (Open-Meteo & OpenWeatherMap):**
  - Tìm kiếm 58+ tỉnh/thành & điểm du lịch không dấu, xem chi tiết từng ngày và gợi ý trang phục/hoạt động đa dạng theo điều kiện thời tiết.
- **Cẩm nang cộng đồng, Đánh giá, Chat nhóm Realtime & Trang Quản trị:**
  - Chia sẻ/bình luận cẩm nang, yêu thích địa điểm, chat nhóm thời gian thực qua Socket.io, quản lý danh mục/địa điểm/người dùng/đánh giá cho Admin.

---

## 2. Tech Stack

- **Backend (`BE/`):** Node.js (`>= 20.x`, ESM), Express.js, Prisma ORM (`5.22.0`), PostgreSQL (**Supabase Cloud**), Supabase Storage (`@supabase/supabase-js`), Socket.io, Swagger UI.
- **Frontend (`FE/`):** React 19, Vite 8, TailwindCSS v4, React Router v6, Leaflet / React-Leaflet, Recharts, `@dnd-kit`, Lucide Icons.
- **AI & Dịch vụ bên ngoài:** Google Gemini API (`@google/genai` Interactions API + Structured Output), Open-Meteo API, OpenWeatherMap API, OSRM Routing API.
- **Múi giờ & Tìm kiếm:** `Asia/Ho_Chi_Minh` (`UTC+7`), chuẩn hóa tìm kiếm tiếng Việt không dấu.

---

## 3. Yêu cầu môi trường

1. **Hệ điều hành:** Windows 10/11 (PowerShell hoặc Windows Terminal).
2. **Node.js:** `>= 20.x` (khuyến nghị v20.x LTS hoặc v22.x LTS). Kiểm tra bằng `node -v` và `npm -v`.
3. **Cơ sở dữ liệu:** Tài khoản & project **PostgreSQL trên Supabase Cloud** (đã cấu hình `DATABASE_URL` và `DIRECT_URL`).
4. **API Keys:** `GEMINI_API_KEY` (Google AI Studio) và tùy chọn `OPENWEATHER_API_KEY` (OpenWeatherMap; nếu không có sẽ tự dùng Open-Meteo miễn phí).

---

## 4. Hướng dẫn lấy API Key & cấu hình file `.env`

Mỗi thành viên sau khi clone repo cần tạo `BE/.env` và `FE/.env` từ file `.env.example` và điền các khóa sau (không commit file `.env` lên Git):

### 4.1. Lấy thông tin Supabase (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*`)
1. Đăng nhập **[Supabase Dashboard](https://supabase.com/dashboard)** → chọn hoặc tạo mới 1 Project PostgreSQL.
2. **Lấy chuỗi kết nối Database (`DATABASE_URL` & `DIRECT_URL`)**:
   - Bấm nút **Connect** trên thanh trên cùng (hoặc vào **Project Settings → Database**).
   - Tab **Connection String → URI**:
     - Chọn chế độ **Transaction pooler** (cổng `6543`, có `?pgbouncer=true`) → copy dán vào `DATABASE_URL` trong `BE/.env`.
     - Chọn chế độ **Direct connection** (cổng `5432`) → copy dán vào `DIRECT_URL` trong `BE/.env`.
   - Thay `[YOUR-PASSWORD]` bằng mật khẩu database của project.
3. **Lấy Supabase API & Storage Keys**:
   - Vào **Project Settings → API** (hoặc **API Keys / Data API**):
     - `SUPABASE_URL`: copy **Project URL** (`https://<project-ref>.supabase.co`).
     - `SUPABASE_ANON_KEY`: copy key **anon / public**.
     - `SUPABASE_SERVICE_ROLE_KEY`: copy key **service_role** (chỉ lưu ở `BE/.env`, tuyệt đối không đưa lên Frontend).
   - Vào mục **Storage → New bucket**: tạo bucket tên `tripmate-media` (bật **Public bucket** để hiển thị ảnh trực tiếp), điền `SUPABASE_STORAGE_BUCKET=tripmate-media`.

### 4.2. Lấy `GEMINI_API_KEY` (Google Gemini AI — bắt buộc cho lập lịch AI)
1. Truy cập **[Google AI Studio](https://aistudio.google.com/apikey)** và đăng nhập tài khoản Google.
2. Bấm **Create API Key** → chọn project (hoặc tạo project mới) → copy API key.
3. Dán vào `BE/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-4-hydrogen
   ```
   > Nếu `gemini-4-hydrogen` hết quota miễn phí trong ngày, hệ thống tự động chuyển sang model dự phòng (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`).

### 4.3. Lấy `OPENWEATHER_API_KEY` (Thời tiết — tùy chọn)
1. Đăng ký tài khoản miễn phí tại **[OpenWeatherMap](https://home.openweathermap.org/api_keys)**.
2. Vào mục **My API Keys** → tạo key mới và dán vào `OPENWEATHER_API_KEY` trong `BE/.env` (key mới tạo thường mất 10–30 phút để kích hoạt).
3. Nếu bỏ trống `OPENWEATHER_API_KEY`, hệ thống vẫn hoạt động bình thường nhờ tự động lấy dữ liệu thời tiết thời gian thực từ **Open-Meteo** (không cần API key).

### 4.4. Các biến môi trường còn lại (`BE/.env` & `FE/.env`)
- Trong `BE/.env`:
  - `PORT=5001`
  - `JWT_SECRET`: đặt một chuỗi bí mật bất kỳ (khuyến nghị >= 32 ký tự).
  - `CLIENT_URL=http://localhost:3000`
- Trong `FE/.env`:
  ```env
  VITE_API_URL=http://localhost:5001/api
  VITE_SOCKET_URL=http://localhost:5001
  VITE_OSRM_BASE_URL=https://router.project-osrm.org
  ```

---

## 5. Hướng dẫn cài đặt & khởi chạy (Windows PowerShell)

### Bước 1: Cài đặt & Cấu hình Backend (`BE/`)
```powershell
cd d:\AITranvel\LapKeHoachDuLichCaNhanHoa\BE

# 1. Sao chép file cấu hình môi trường và điền DATABASE_URL, DIRECT_URL, SUPABASE_*, GEMINI_API_KEY
Copy-Item .env.example .env

# 2. Cài đặt dependencies
npm install

# 3. Sinh Prisma Client và đồng bộ schema 22 bảng lên Supabase PostgreSQL
npm run prisma:generate
npm run prisma:push

# 4. Nạp dữ liệu mẫu (63 tỉnh/thành Việt Nam, danh mục, địa điểm, tài khoản mẫu, cẩm nang)
npm run seed

# 5. Khởi động Backend Server
npm run dev
```
> - Backend API chạy tại: **`http://localhost:5001`** (hoặc theo `PORT` trong `BE/.env`)  
> - Swagger API Docs: **`http://localhost:5001/api/docs`**  
> - Healthcheck: **`http://localhost:5001/api/health`**

### Bước 2: Cài đặt & Cấu hình Frontend (`FE/`)
Mở cửa sổ PowerShell thứ hai:
```powershell
cd d:\AITranvel\LapKeHoachDuLichCaNhanHoa\FE

# 1. Sao chép file cấu hình môi trường (chỉnh VITE_API_URL / VITE_SOCKET_URL khớp cổng BE, VD: http://localhost:5001)
Copy-Item .env.example .env

# 2. Cài đặt dependencies
npm install

# 3. Khởi động Frontend Dev Server (Vite)
npm run dev
```
> - Giao diện người dùng chạy tại: **`http://localhost:3000`**  
> - Build production kiểm tra lỗi: `npm run build`

---

## 6. Tài khoản mẫu dùng để kiểm thử

Sau khi chạy `npm run seed` trong `BE/`, hệ thống có sẵn các tài khoản sau:

| Loại tài khoản | Tên đăng nhập | Email | Mật khẩu | Mục đích kiểm thử |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `admin@tripmate.vn` | `Admin@123` | Quản trị địa điểm, danh mục, tài khoản, cẩm nang, đánh giá, thống kê. |
| **Khách hàng 1** | `customer` | `customer@tripmate.vn` | `Customer@123` | Lập lịch AI, tạo lịch trình thủ công, yêu thích, đánh giá, chat nhóm. |
| **Khách hàng 2** | `thuyan` | `thuyan@example.com` | `Customer@123` | Kiểm thử chat nhóm 2 người & tương tác cẩm nang. |
| **Tài khoản bị khóa** | `spammer_user` | `spam@example.com` | `Customer@123` | Kiểm thử chặn đăng nhập và hiển thị lý do khóa. |

---

## 7. Kiểm thử nhanh Backend

Trong thư mục `BE/` (khi server đang chạy tại cổng `5001`):
```powershell
cd d:\AITranvel\LapKeHoachDuLichCaNhanHoa\BE

# Kiểm thử luồng lập lịch AI (PB08: tạo nháp, tạo lại ngày, lưu lịch trình & snapshot)
node tests/test_pb08.js
```

---

## 8. Cấu trúc thư mục dự án

```text
LapKeHoachDuLichCaNhanHoa/
├── README.md                       # Tài liệu hướng dẫn cài đặt & tổng quan dự án
├── docs/                           # Tài liệu thiết kế, API contract & quy chuẩn UI
├── BE/                             # Backend Node.js / Express + Prisma + Socket.io
│   ├── .env.example                # Mẫu biến môi trường BE
│   ├── prisma/
│   │   ├── schema.prisma           # Schema 22 bảng PostgreSQL (Supabase)
│   │   └── seed.js                 # Seeder 63 tỉnh/thành, địa điểm, tài khoản & dữ liệu mẫu
│   ├── tests/                      # Bộ script kiểm thử API theo từng nghiệp vụ (PB01–PB20)
│   └── src/
│       ├── config/                 # Kết nối Prisma, Supabase Storage, Swagger
│       ├── controllers/            # Xử lý nghiệp vụ REST API (aiController, destinationController, ...)
│       ├── middleware/             # Xác thực JWT, phân quyền, upload, cache
│       ├── routes/                 # Định tuyến API (/api/ai, /api/destinations, /api/weather, ...)
│       ├── services/               # aiService (Gemini), mapService (OSRM), weatherService
│       └── sockets/                # Socket.io chat nhóm & thông báo realtime
└── FE/                             # Frontend React 19 + Vite + TailwindCSS v4
    ├── .env.example                # Mẫu biến môi trường FE
    └── src/
        ├── components/             # UI dùng chung (SearchSuggestions, Navbar, ...)
        ├── context/                # AuthContext, ToastContext
        ├── layouts/                # GuestLayout, AdminLayout
        ├── pages/                  # Các trang chức năng (TripPlannerPage, MapRoutePage, WeatherPage, ...)
        ├── services/               # Gọi REST API (aiService, destinationService, ...)
        └── utils/                  # Chuẩn hóa tiếng Việt, danh sách địa danh, helper
```

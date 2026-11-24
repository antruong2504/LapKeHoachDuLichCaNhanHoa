# TRIPMATE - NỀN TẢNG LẬP KẾ HOẠCH DU LỊCH CÁ NHÂN HÓA ỨNG DỤNG AI

> **Đồ án Capstone:** Nhóm phát triển TripMate — Khoa Công nghệ Thông tin  
> **Phiên bản:** TripMate v1.0.0 (Node.js/Express + React Vite + Supabase)  
> **Dự án mở:** Nền tảng chia sẻ và lập kế hoạch du lịch cho cộng đồng người dùng

TripMate là nền tảng hỗ trợ người dùng khám phá địa điểm, xem dự báo thời tiết, tối ưu hóa lộ trình bản đồ di chuyển bằng OpenStreetMap/OSRM, tự động lập lịch trình du lịch thông minh bằng Google Gemini AI, chia sẻ cẩm nang và trò chuyện nhóm du lịch theo thời gian thực.

---

## 1. TECH STACK CHÍNH THỨC
- **Backend:** Node.js (v20+ LTS) + Express.js + MySQL 8.x (XAMPP) + Prisma ORM + Socket.io.
- **Frontend:** React 19/18 + Vite + TailwindCSS + Leaflet + Recharts + @dnd-kit.
- **AI & Cloud Services:** Google Gemini AI API, OpenWeatherMap API, OSRM Public Routing Server.
- **Múi giờ & Mã hóa:** `Asia/Ho_Chi_Minh` (UTC+7), `utf8mb4_unicode_ci` (tìm kiếm tiếng Việt không dấu).

---

## 2. YÊU CẦU MÔI TRƯỜNG & PHẦN MỀM CẦN CÓ
1. **Hệ điều hành:** Windows 10/11 (chạy trên PowerShell hoặc Windows Terminal).
2. **Node.js:** Phiên bản `>= 20.x` (khuyến nghị v20.x LTS hoặc v22.x LTS). Kiểm tra: `node -v` và `npm -v`.
3. **Cơ sở dữ liệu:** **XAMPP Control Panel** (bật dịch vụ **MySQL** chạy cổng mặc định `3306`).
4. **Git:** Đã cài đặt Git for Windows.

---

## 3. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY (WINDOWS POWERSHELL)

### Bước 1: Khởi động Cơ sở dữ liệu MySQL
1. Mở phần mềm **XAMPP Control Panel**.
2. Tại dòng **MySQL**, nhấn nút **Start** (đèn báo chuyển sang màu xanh lá cây, cổng `3306`).
3. Mở trình duyệt truy cập `http://localhost/phpmyadmin/` và tạo sẵn một cơ sở dữ liệu mới có tên:
   - Tên CSDL: `tripmate_db`
   - Bảng mã (Collation): `utf8mb4_unicode_ci`

---

### Bước 2: Cài đặt và Cấu hình Backend (`BE/`)
Mở cửa sổ **PowerShell thứ nhất** và di chuyển vào thư mục Backend:
```powershell
cd d:\AITranvel\LapKeHoachDuLichCaNhanHoa\BE

# 1. Sao chép file cấu hình môi trường
Copy-Item .env.example .env

# 2. Cài đặt các gói phụ thuộc (Dependencies)
npm install

# 3. Tạo Schema và chạy Migration tạo 22 bảng MySQL
npx prisma migrate dev --name init_tripmate_db

# 4. Chạy nạp dữ liệu mẫu (Seeder: Tỉnh thành, danh mục, địa điểm, tài khoản test)
npm run seed

# 5. Khởi động Backend Server ở chế độ phát triển
npm run dev
```
> Server Backend sẽ chạy tại: **`http://localhost:5001`**  
> Trạng thái API Healthcheck: **`http://localhost:5001/api/health`**

---

### Bước 3: Cài đặt và Cấu hình Frontend (`FE/`)
Mở cửa sổ **PowerShell thứ hai** và di chuyển vào thư mục Frontend:
```powershell
cd d:\AITranvel\LapKeHoachDuLichCaNhanHoa\FE

# 1. Sao chép file cấu hình môi trường
Copy-Item .env.example .env

# 2. Cài đặt các gói phụ thuộc (Dependencies)
npm install

# 3. Khởi động Frontend Dev Server (Vite)
npm run dev
```
> Giao diện người dùng sẽ chạy tại: **`http://localhost:3000`** (Cổng riêng độc quyền của TripMate, hoàn toàn không bị xung đột với các dự án khác)

---

## 4. TÀI KHOẢN MẪU DÙNG ĐỂ KIỂM THỬ (TEST ACCOUNTS)

Sau khi chạy lệnh `npm run seed`, hệ thống đã chuẩn bị sẵn các tài khoản sau:

| Loại tài khoản | Tên đăng nhập | Email | Mật khẩu | Quyền hạn & Mục đích test |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `admin@tripmate.vn` | `Admin@123` | Toàn quyền Quản trị: Địa điểm, Danh mục, Tài khoản, Cẩm nang, Đánh giá, Thống kê (`UI_26–UI_39`). |
| **Khách hàng 1 (Customer)** | `customer` | `customer@tripmate.vn` | `Customer@123` | Khách hàng: Lập lịch AI, tạo lịch trình thủ công, thả tim, đánh giá, chat nhóm (`UI_08–UI_25`). |
| **Khách hàng 2 (Customer)** | `thuyan` | `thuyan@example.com` | `Customer@123` | Dùng để kiểm thử chat nhóm 2 người (`PB12`) và tương tác cẩm nang (`PB11`). |
| **Tài khoản bị khóa** | `spammer_user`| `spam@example.com` | `Customer@123` | Kiểm thử nghiệp vụ chặn đăng nhập có thông báo lý do (`PB02, PB16`). |

---

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
LapKeHoachDuLichCaNhanHoa/
├── .agent/rules/project-rules.md   # Bộ quy tắc dự án cho AI Agent
├── AGENTS.md                       # Nguyên tắc bất khả xâm phạm & Tech Stack
├── CHANGELOG.md                    # Lịch sử phiên bản theo Keep a Changelog
├── CONTRIBUTING.md                 # Quy trình làm việc nhóm & Commit chuẩn
├── README.md                       # Tài liệu hướng dẫn setup này
├── TIEN_DO_DU_AN.md                # Bảng theo dõi tiến độ chi tiết (đánh dấu [x] khi hoàn thành)
├── docs/                           # Tài liệu kỹ thuật chi tiết
│   ├── API_CONTRACT.md             # Đặc tả REST API & Socket.io cho 20 PB
│   ├── DECISION_LOG.md             # Bản ghi quyết định kiến trúc (ADR)
│   ├── MIGRATION_PLAN.md           # Kế hoạch tái sử dụng từ AI-TripPlanner
│   ├── PROJECT_PLAN.md             # Kế hoạch 3 Sprint & Phân công nhiệm vụ
│   ├── TASK_BOARD.md               # Bảng theo dõi tiến độ chức năng
│   └── UI_DESIGN_SYSTEM.md         # Quy chuẩn màu sắc & ánh xạ 39 màn hình UI
├── BE/                             # Backend Node.js / Express
│   ├── .env.example                # Mẫu biến môi trường BE
│   ├── prisma/                     # Schema 22 bảng & Prisma Migration
│   ├── uploads/                    # Thư mục chứa ảnh avatar, địa điểm
│   └── src/                        # Mã nguồn: config, controllers, models, routes, services, sockets
└── FE/                             # Frontend React Vite + TailwindCSS
    ├── .env.example                # Mẫu biến môi trường FE
    └── src/                        # Mã nguồn: components, context, pages, services, layouts
```

---

## 6. DANH MỤC TÀI LIỆU THAM KHẢO GỐC (TRONG THƯ MỤC `doc/`)
1. `Nhom1_4.Product-Backlog.docx`: Quy tắc nghiệp vụ và tiêu chí chấp nhận cho 20 mục `PB01–PB20`.
2. `Nhom1_5.ProjectUserInterface.docx`: Đặc tả chi tiết 39 màn hình giao diện người dùng `UI_01–UI_39`.
3. `Nhom1_6.ProjectDatabase.docx`: Thiết kế chi tiết cấu trúc 22 bảng cơ sở dữ liệu quan hệ.
4. `Nhom1_1.ProjectProposal.docx` & `Nhom1_2.ProjectPlan.docx`: Hồ sơ đề xuất dự án và kế hoạch thực hiện.

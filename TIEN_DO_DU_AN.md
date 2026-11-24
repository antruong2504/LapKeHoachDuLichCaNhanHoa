# BẢNG THEO DÕI TIẾN ĐỘ THỰC HIỆN DỰ ÁN TRIPMATE (TIEN_DO_DU_AN.md)

> **Dự án:** Nghiên cứu và phát triển nền tảng lập kế hoạch du lịch cá nhân hóa ứng dụng AI (TripMate)  
> **Nhóm thực hiện:** Ban phát triển dự án TripMate  
> **Cập nhật lần cuối:** 23/11/2026  
> **Quy tắc:** Bất kỳ phần việc/chức năng nào hoàn thành **bắt buộc phải được đánh dấu `[x]` hoặc `✅ HOÀN THÀNH` ngay lập tức** kèm ngày hoàn thành để cả nhóm nắm rõ tiến độ.

---

## 1. TỔNG QUAN TIẾN ĐỘ TOÀN DỰ ÁN

| Hạng mục | Đã hoàn thành | Tổng số | Tỷ lệ | Trạng thái trực quan |
| :--- | :---: | :---: | :---: | :--- |
| **Giai đoạn triển khai** | **5 / 5** | 5 giai đoạn | **100%** | `[████████████████████] 100%` ✅ (Hoàn thành toàn bộ 5 giai đoạn & 3 Sprint) |
| **Product Backlog (PB)** | **20 / 20** | 20 PB | **100%** | `[████████████████████] 100%` ✅ (Hoàn tất 100% Sprint 1, Sprint 2 và Sprint 3) |
| **Cơ sở dữ liệu (Supabase)**| **22 / 22** | 22 bảng | **100%** | `[████████████████████] 100%` ✅ |
| **Màn hình giao diện (UI)**| **39 / 39** | 39 màn hình | **100%** | `[████████████████████] 100%` ✅ (Hoàn thành 100% UI_01–39 + Layouts) |
| **Bộ tài liệu & Guardrails** | **13 / 13** | 13 file | **100%** | `[████████████████████] 100%` ✅ |

---

## 2. TIẾN ĐỘ CHI TIẾT THEO 5 GIAI ĐOẠN

### 🟢 GIAI ĐOẠN 0: Khảo sát, Guardrails & Quản lý dự án
- **Thời gian:** 22/11/2026
- **Trạng thái:** `[x] ĐÃ HOÀN THÀNH (100%)` ✅
- **Checklist công việc:**
  - [x] Đọc và phân tích toàn diện thư mục tham khảo `AI-TripPlanner/` (chế độ READ-ONLY).
  - [x] Đọc và chuẩn hóa thông tin từ 6 file Word trong `LapKeHoachDuLichCaNhanHoa/doc/`.
  - [x] Tạo `AGENTS.md` - Bộ quy tắc tối cao và kiến trúc chuẩn cho AI Agent.
  - [x] Tạo `.agent/rules/project-rules.md` - Quy tắc validation, bảo mật và các điều cấm.
  - [x] Tạo `docs/MIGRATION_PLAN.md` - Kế hoạch chuyển đổi từ MongoDB NoSQL sang MySQL RDBMS.
  - [x] Tạo `docs/API_CONTRACT.md` - Đặc tả đầy đủ REST API và Socket.io cho 20 PB.
  - [x] Tạo `BE/.env.example` và `FE/.env.example` - Đầy đủ biến môi trường không hardcode.
  - [x] Tạo `docs/PROJECT_PLAN.md` - Kế hoạch 3 Sprint và phân công nhiệm vụ cho 5 thành viên.
  - [x] Tạo `docs/TASK_BOARD.md` - Bảng theo dõi phân công chi tiết.
  - [x] Tạo `docs/UI_DESIGN_SYSTEM.md` - Quy chuẩn thiết kế TripMate và ánh xạ 39 màn hình.
  - [x] Tạo `docs/DECISION_LOG.md` - Ghi nhận 8 quyết định kiến trúc cốt lõi (ADR-01 đến ADR-08).
  - [x] Tạo `CONTRIBUTING.md` - Quy trình làm việc nhóm Git Flow và quy ước Commit.
  - [x] Tạo `CHANGELOG.md` - Nhật ký thay đổi theo chuẩn Keep a Changelog.
  - [x] Tạo `README.md` - Hướng dẫn cài đặt trọn gói trên Windows PowerShell.
  - [x] Tạo `TIEN_DO_DU_AN.md` - File theo dõi tiến độ trực quan này.
  - [x] Cập nhật các quyết định nâng cao đã chốt:
    - [x] ADR-06: Tích hợp Supabase Cloud Database + Supabase Storage CDN.
    - [x] ADR-07: Tích hợp Swagger UI (`/api/docs`) cho Backend.
    - [x] ADR-08: Tích hợp Xuất PDF Lịch trình (`UI_21`) và Skeleton Shimmer Loading (`UI_04`, `UI_18`).

---

### 🟢 GIAI ĐOẠN 1: Database thật (22 bảng Supabase Cloud) + Khung BE/FE + Core Services
- **Thời gian:** 22/11/2026
- **Trạng thái:** `[x] ĐÃ HOÀN THÀNH (100%)` ✅
- **Checklist công việc:**
  - [x] Cài đặt Prisma ORM v5.22.0 và cấu hình kết nối Supabase Cloud PostgreSQL.
  - [x] Khởi tạo `prisma/schema.prisma` đầy đủ **22 bảng** khớp chuẩn `Nhom1_6.ProjectDatabase.docx`.
  - [x] Chạy lệnh `npx prisma db push` tạo cấu trúc CSDL thật trên Supabase Cloud (22 bảng).
  - [x] Viết Seeder dữ liệu mẫu (`seed.js`) và nạp thành công vào Supabase: 7 Tỉnh/thành phố, 4 Nhóm danh mục & 10 danh mục con, 12 địa điểm có tọa độ thật, tài khoản Admin/Customer, cẩm nang và nhóm chat mẫu.
  - [x] Chuyển đổi và tinh chỉnh các Service Core sang `BE/src/services/`:
    - [x] `aiService.js` (Google Gemini AI, Structured JSON output, ràng buộc địa điểm trong DB, cảnh báo vượt ngân sách).
    - [x] `mapService.js` (Leaflet, Haversine, OSRM routing, thuật toán TSP tìm đường ngắn nhất tối đa 10 điểm).
    - [x] `weatherService.js` (OpenWeatherMap API 5 ngày, xử lý cache 30 phút và fallback dữ liệu).
    - [x] `security.js` & `authMiddleware.js` (JWT, bcryptjs, helmet, CORS, kiểm tra tài khoản bị khóa).
    - [x] `sockets/socketHandler.js` (Socket.io server cho phòng chat `PB12` và thông báo `PB13`).
    - [x] `docs/swagger.js` (Swagger UI API Docs tại `/api/docs`).
    - [x] `config/supabase.js` (Helper upload ảnh lên Supabase Storage CDN).
    - [x] `app.js` (Khởi chạy HTTP Server + Socket.io Server + Swagger + Healthcheck).
  - [x] Dựng khung Frontend `FE/` theo phong cách TripMate (Teal `#0F766E` / `#0D9488`):
    - [x] `GuestLayout`, `AdminLayout`.
    - [x] `Navbar` (Logo TripMate, 5 menu, chuông thông báo, avatar dropdown, nút tạo AI).
    - [x] `AdminSidebar` (Logo TripMate ADMIN + 6 menu quản trị).
    - [x] `Footer` 4 cột chuẩn đồ án.
    - [x] `SkeletonCard`, `SkeletonText` (Skeleton Shimmer UI).
    - [x] Cấu hình `AuthContext`, `api.js` Axios Interceptor và `socket.js` client.
    - [x] Sửa triệt để các lỗi duplicate component, chạy `npm run build` Vite thành công 100%.

---

### 🟢 GIAI ĐOẠN 2: Triển khai Sprint 1 (`PB01, PB02, PB03, PB15, PB19`)
- **Thời gian:** Sprint 1 (22/11 – 23/11/2026)
- **Trạng thái:** `[x] ĐÃ HOÀN THÀNH 100% (Sprint 1: 5/5 PB)` ✅
- **Checklist công việc:**
  - [x] **PB01: Đăng ký tài khoản (`UI_01`)** ✅ (Hoàn thành 22/11/2026)
    - [x] BE: API `POST /api/auth/register`, hash bcrypt, chuẩn hóa dữ liệu, validate mật khẩu >= 8 ký tự (hoa, số, ký tự đặc biệt), SĐT 10 số bắt đầu bằng 0, kiểm tra trùng lặp CSDL Supabase.
    - [x] FE: Giao diện `RegisterPage.jsx` chuẩn phong cách TripMate Teal (`UI_01`), bộ chỉ thị tiêu chuẩn mật khẩu an toàn, validate inline tức thì, toggle ẩn/hiện mật khẩu, liên kết đăng nhập.
  - [x] **PB02: Đăng nhập hệ thống (`UI_02`)** ✅ (Hoàn thành 22/11/2026)
    - [x] BE: API `POST /api/auth/login`, phát hành JWT 7 ngày, kiểm tra tài khoản `bi_khoa` trả về HTTP 403 kèm lý do khóa, API `GET /api/auth/me` xác thực phiên, hỗ trợ chạy song song 2 cổng 5000 & 5001.
    - [x] FE: Giao diện `LoginPage.jsx` phong cách TripMate Teal (`UI_02`), hỗ trợ đăng nhập bằng username hoặc email, toggle ẩn/hiện mật khẩu, banner cảnh báo tài khoản bị khóa, phân quyền điều hướng (Admin -> `/admin`, Khách hàng -> `/`).
  - [x] **PB03: Quản lý hồ sơ cá nhân (`UI_13, UI_14`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: API `GET /api/users/profile`, `PUT /api/users/profile` (validate họ tên, SĐT 10 số), `POST /api/users/avatar` (upload Multer <= 5MB lưu Supabase CDN/local), `PUT /api/users/change-password` (so khớp mật khẩu cũ, validate mật khẩu mới >= 8 ký tự).
    - [x] FE: Giao diện `ProfilePage.jsx` phong cách TripMate Teal (`UI_13, UI_14`), xóa lỗi nhân đôi Navbar, bố cục 2 cột (Sidebar thông tin/avatar picker + tab chuyển đổi Thông tin cá nhân & Đổi mật khẩu).
  - [x] **PB15: Admin Quản lý danh mục địa điểm (`UI_29, UI_30`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: CRUD nhóm danh mục và danh mục con (tối đa 10 mục con/nhóm, chống trùng tên không dấu, bảo vệ xóa khi có địa điểm liên kết).
    - [x] FE: Bảng quản lý cây danh mục 2 cấp (`UI_29`), thanh tiến độ 10 mục con/nhóm, modal thêm/sửa nhóm và danh mục con (`UI_30`), modal cảnh báo xóa an toàn.
  - [x] **PB19: Admin Quản lý địa điểm du lịch (`UI_27, UI_28`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: CRUD địa điểm du lịch, cờ nổi bật, Optimistic Locking `phien_ban` (chặn xung đột ghi đè HTTP 409), Xóa mềm `trang_thai = 'da_xoa'`, phân trang 10 mục/trang, upload ảnh.
    - [x] FE: Bảng địa điểm phân trang 10 mục/trang (`UI_27`), bộ lọc tỉnh thành/danh mục/trạng thái/nổi bật, form thêm/sửa địa điểm (`UI_28`), upload ảnh CDN/local, toggle cờ nổi bật, modal xóa mềm & khôi phục.
  - [x] Cập nhật `CHANGELOG.md` và `docs/TASK_BOARD.md`, hoàn tất toàn diện Sprint 1.

---

### 🟢 GIAI ĐOẠN 3: Triển khai Sprint 2 (`PB04, PB05, PB06, PB07, PB08, PB09, PB20`)
- **Thời gian thực hiện:** Sprint 2 (23/11/2026)
- **Trạng thái:** `[x] ĐÃ HOÀN THÀNH 100% (Sprint 2: 7/7 PB)` ✅
- **Checklist công việc:**
  - [x] **PB05: Trang chủ & Tìm kiếm/Lọc địa điểm (`UI_03–05, UI_08–10`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: API tìm kiếm không dấu tiếng Việt (PostgreSQL `unaccent`), lọc nhiều danh mục cùng lúc (`danh_muc_ids`), phân trang chuẩn 10 mục/trang, tính điểm trung bình `diem_danh_gia_tb`, API chi tiết kèm danh sách nhận xét `danh_gias`.
    - [x] FE: Hero banner tìm kiếm thông minh (`UI_03, UI_08`), trang tìm kiếm & lọc `DestinationsPage.jsx` (`UI_04, UI_09`) kèm bộ lọc tỉnh thành, bộ lọc danh mục con, phân trang 10/trang, Shimmer loading `DestinationSkeleton.jsx`, Card địa điểm responsive `DestinationCard.jsx`, trang chi tiết `DestinationDetailPage.jsx` (`UI_05, UI_10`) kèm gallery ảnh, giờ mở cửa, giá vé, tọa độ GPS, nút chuyển sang Lập lịch AI, đánh giá cộng đồng và địa điểm lân cận.
  - [x] **PB04: Quản lý danh sách yêu thích (`UI_15`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: API `GET /api/favorites` (phân trang 10 mục/trang, lấy địa điểm hoạt động), `GET /api/favorites/my-ids` (danh sách ID để highlight icon tim), `POST /api/favorites/:dia_diem_id` (thêm yêu thích, chống trùng lặp), `DELETE /api/favorites/:dia_diem_id` (xóa yêu thích), `POST /api/favorites/toggle/:dia_diem_id` (chuyển đổi nhanh 1 click).
    - [x] FE: Nút icon thả tim trên từng thẻ `DestinationCard.jsx` với optimistic update, trang danh sách yêu thích cá nhân `FavoritesPage.jsx` (`UI_15`), bộ lọc tìm kiếm trong danh sách đã lưu, Shimmer loading skeleton, empty state thân thiện kèm nút khám phá, menu liên kết nhanh trên Navbar dropdown.
  - [x] **PB06: Xem bản đồ và lộ trình (`UI_07, UI_12`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: Tích hợp OSRM routing (`/api/maps/optimize-route`, `/api/maps/calculate-route`), thuật toán TSP Nearest Neighbor tìm lộ trình ngắn nhất (tối đa 10 địa điểm/ngày), tính khoảng cách Haversine và thời gian di chuyển từng chặng.
    - [x] FE: Giao diện bố cục chia đôi `MapRoutePage.jsx` (`UI_07, UI_12`): Panel trái nhập điểm xuất phát, gợi ý preset nhanh, kéo thả sắp xếp chặng `@dnd-kit`, thêm điểm dừng từ CSDL, thẻ thống kê km/phút, tùy chọn vòng khép kín; Panel phải bản đồ Leaflet OpenStreetMap, đánh số marker từng chặng, vẽ đường Polyline thực tế và popup thông tin.
  - [x] **PB07: Xem dự báo thời tiết (`UI_06, UI_11`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: Service OpenWeatherMap API dự báo 5 ngày theo tọa độ/tỉnh thành (`/api/weather`), bộ nhớ đệm Cache 30 phút, cơ chế dữ liệu fallback khí tượng dự phòng an toàn.
    - [x] FE: Giao diện thời tiết chuyên sâu `WeatherPage.jsx` (`UI_06, UI_11`): Thẻ thời tiết trực quan nhiệt độ/độ ẩm/gió/tầm nhìn, gợi ý trang phục & hoạt động AI, lưới dự báo 5 ngày, thanh chọn nhanh các điểm đến du lịch Việt Nam, Shimmer loading và nút "Thử lại" khi mất kết nối.
  - [x] **PB08: Tạo lịch trình du lịch bằng Gemini AI (`UI_17, UI_18`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: Nhận 6 thông tin bắt buộc (`tinh_thanh_id`, `ngay_bat_dau`, `ngay_ket_thuc`, `ngan_sach_du_kien`, `so_luong_nguoi`, `so_thich`), truy vấn danh sách địa điểm hợp lệ trong CSDL Supabase, prompt Gemini AI theo JSON Schema chuẩn, kiểm tra số ngày (tối đa 14 ngày), cảnh báo vượt ngân sách, lưu bản nháp vào `ban_nhap_ais`, API tạo lại từng ngày `POST /api/ai/regenerate-day`, API lưu bản nháp chính thức `POST /api/ai/save-draft` (Prisma transaction mở rộng timeout, lưu bảo toàn toàn vẹn dữ liệu Snapshot tại `lich_trinh_chi_tiets`).
    - [x] FE: Màn hình nhập 6 thông tin bắt buộc `TripPlannerPage.jsx` (`UI_17`), chọn nhanh ngân sách & tăng giảm số người, tags sở thích trực quan, màn hình hiệu ứng loading Gemini AI, màn hình kết quả theo từng ngày (`UI_18`), tabs chọn ngày, thẻ chặng Sáng/Chiều/Tối chi tiết kèm ảnh/thời gian/chi phí/mô tả hoạt động, nút "Tạo lại ngày này", nút "Lập lại từ đầu", nút "Lưu vào tài khoản" kèm modal thông báo thành công.
  - [x] **PB20: Tạo lịch trình thủ công (`UI_19`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: API lưu lịch trình tự tạo `POST /api/trips/manual` với danh sách ngày và địa điểm tùy chọn, kiểm tra ràng buộc ngày (tối đa 14 ngày), tính tổng chi phí ước tính, cảnh báo vượt ngân sách, lưu Prisma interactive transaction bảo toàn dữ liệu Snapshot tại `lich_trinh_chi_tiets`.
    - [x] FE: Giao diện chia ngày `ManualTripCreatePage.jsx` (`UI_19`), bộ tab chọn ngày, modal chọn địa điểm có sẵn theo tỉnh/thành từ CSDL, thêm điểm dừng tự do, kéo thả sắp xếp thứ tự chặng `@dnd-kit`, tùy chỉnh thời gian/chi phí/ghi chú từng chặng, thanh tổng kết ngân sách và lưu lịch trình vào tài khoản.
  - [x] **PB09: Quản lý lịch trình cá nhân (`UI_20–22`)** ✅ (Hoàn thành 23/11/2026)
    - [x] BE: API lấy danh sách toàn bộ lịch trình `GET /api/trips` (không phân trang), xem chi tiết `GET /api/trips/:id` (bảo toàn Snapshot kèm cảnh báo `dia_diem_da_xoa: true` khi địa điểm gốc bị xóa mềm), sửa lịch trình `PUT /api/trips/:id` (Optimistic Locking `phien_ban`, chặn xung đột HTTP 409), xóa lịch trình `DELETE /api/trips/:id` (dọn sạch CSDL cascade).
    - [x] FE: Màn hình danh sách lịch trình `MyTripsPage.jsx` (`UI_20`) với bộ lọc tab (Tất cả/AI/Thủ công), thẻ lịch trình chi tiết; màn hình chi tiết `TripDetailPage.jsx` (`UI_21`) với sửa inline thông tin chuyến đi kèm Optimistic locking, cảnh báo khi địa điểm bị xóa mềm; Modal xác nhận xóa màu đỏ (`UI_22`).
  - [x] Cập nhật `CHANGELOG.md` và `docs/TASK_BOARD.md`, hoàn tất toàn diện 7/7 PB Sprint 2, dừng lại để nhóm test nghiệm thu Sprint 2.

---

### 🟢 GIAI ĐOẠN 4: Triển khai Sprint 3 (`PB10, PB11, PB12, PB13, PB14, PB16, PB17, PB18`)
- **Thời gian thực hiện:** Sprint 3 (24/11/2026)
- **Trạng thái:** `[x] ĐÃ HOÀN THÀNH 100% (Sprint 3: 8/8 PB)` ✅
- **Checklist công việc:**
  - [x] **PB10: Đánh giá địa điểm 1–5 sao (`UI_16`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: API `POST /api/reviews` gửi đánh giá 1–5 sao, `GET /api/reviews/destination/:dia_diem_id`, `DELETE /api/reviews/:id`, tự động tính toán và cập nhật điểm đánh giá trung bình `diem_danh_gia_tb` vào bảng `dia_diems`.
    - [x] FE: Modal đánh giá chọn 1–5 sao tương tác kèm nhận xét trên `DestinationDetailPage.jsx` (`UI_16`), hiển thị danh sách đánh giá theo thời gian thực kèm avatar/tên tác giả và hỗ trợ xóa đánh giá cá nhân.
  - [x] **PB11: Chia sẻ cẩm nang du lịch (`UI_23`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: API `GET /api/guides`, `GET /api/guides/:id`, `POST /api/guides/upload` (lưu ảnh vào `cam_nang_hinh_anhs`), `POST /api/guides` (đăng cẩm nang và lưu liên kết `cam_nang_anh_lien_kets`), `POST /api/guides/:id/comments` (bình luận), `POST /api/guides/:id/share`.
    - [x] FE: Màn hình cẩm nang cộng đồng `GuidesPage.jsx` (`UI_23`), nút **"Viết cẩm nang mới"** kèm modal đăng bài & upload nhiều ảnh, xem chi tiết bài viết, chia sẻ và bình luận cẩm nang.
  - [x] **PB12: Trò chuyện nhóm realtime Socket.io (`UI_24`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: Socket.io chat room (`join_group`, `send_message`, `new_message`), API `/api/chat/groups`, `/api/chat/groups/:id/members`, `/api/chat/groups/:id/messages`, lưu tin nhắn vào `tin_nhans`, kiểm tra bảo mật thành viên trong `thanh_vien_nhoms` (chặn HTTP 403 / `chat_error` nếu không thuộc nhóm).
    - [x] FE: Giao diện phòng chat chia đôi `ChatPage.jsx` (`UI_24`), danh sách nhóm bên trái, khung hội thoại realtime bên phải, nút **"Tạo nhóm"** và **"Thêm thành viên"** phục vụ test E2E.
  - [x] **PB13: Nhận thông báo realtime (`UI_25`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: Phát thông báo qua Socket.io tới room cá nhân `user-{id}` (`notification_received`), API `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, lưu vào bảng `thong_baos` kèm thời gian chuẩn UTC+7.
    - [x] FE: Chuông thông báo Navbar có badge đỏ đếm chính xác số tin chưa đọc theo thời gian thực, màn hình `NotificationsPage.jsx` (`UI_25`) hiển thị thông báo UTC+7, lọc Tất cả/Chưa đọc và nút **"Đánh dấu đã đọc tất cả"**.
  - [x] **PB14: Admin Quản lý cẩm nang du lịch (`UI_34–36`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: API `GET /api/admin/guides` (phân trang 10 mục/trang), `DELETE /api/admin/guides/:id` bắt buộc nhập `ly_do`, bảo toàn ảnh dùng chung trong `cam_nang_hinh_anhs` và gửi thông báo realtime UTC+7 cho tác giả.
    - [x] FE: Bảng quản lý cẩm nang `AdminGuidesPage.jsx` (`UI_34`), modal xem chi tiết (`UI_35`), modal xóa bắt buộc nhập lý do (`UI_36`).
  - [x] **PB16: Admin Quản lý tài khoản người dùng (`UI_31–33`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: Bổ sung cột `thoi_gian_khoa` vào `tai_khoans`, API `GET /api/admin/users` phân trang 10 dòng, `PATCH /api/admin/users/:id/status` khóa/mở khóa kèm lý do bắt buộc, lưu thời gian khóa UTC+7 và gửi thông báo realtime.
    - [x] FE: Bảng quản lý tài khoản `AdminUsersPage.jsx` (`UI_31`) phân trang 10 dòng, bộ lọc trạng thái/tìm kiếm, modal khóa/mở khóa kèm lý do (`UI_32, UI_33`).
  - [x] **PB17: Admin Quản lý đánh giá (`UI_37–39`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: API `GET /api/admin/reviews` lọc theo số sao & tìm kiếm, `DELETE /api/admin/reviews/:id` bắt buộc nhập `ly_do`, tự động tính lại `diem_danh_gia_tb` vào `dia_diems` và gửi thông báo UTC+7 cho tác giả.
    - [x] FE: Bảng quản lý đánh giá `AdminReviewsPage.jsx` (`UI_37`), bộ lọc 1–5 sao, modal xem chi tiết (`UI_38`), modal xóa bắt buộc nhập lý do (`UI_39`).
  - [x] **PB18: Admin Tổng quan, Thống kê & Báo cáo (`UI_26`)** ✅ (Hoàn thành 24/11/2026)
    - [x] BE: API tổng hợp số liệu `GET /api/admin/stats` theo khoảng thời gian chọn lọc (múi giờ UTC+7 `Asia/Ho_Chi_Minh`).
    - [x] FE: Dashboard Admin `AdminDashboardPage.jsx` (`UI_26`) tích hợp 3 biểu đồ Recharts (tăng trưởng người dùng & lịch trình, lịch trình theo tỉnh thành, phân bố đánh giá 1–5 sao).
  - [x] Chạy `npm run build` ở FE, kiểm tra tổng thể hệ thống, cập nhật tài liệu và báo cáo hoàn tất đồ án (100%). ✅

---

## 3. BẢNG TRẠNG THÁI CHI TIẾT 20 MỤC PRODUCT BACKLOG (PB01 - PB20)

| Mã PB | Tên chức năng | Sprint | Phụ trách FE | Phụ trách BE | Trạng thái hiện tại | Màn hình liên quan |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **PB01** | Đăng ký tài khoản | Sprint 1 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_01` |
| **PB02** | Đăng nhập hệ thống | Sprint 1 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_02` |
| **PB03** | Quản lý hồ sơ cá nhân | Sprint 1 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_13, UI_14` |
| **PB04** | Quản lý danh sách yêu thích | Sprint 2 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_15` |
| **PB05** | Tìm kiếm và lọc địa điểm | Sprint 2 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_03–05, UI_08–10` |
| **PB06** | Xem bản đồ và lộ trình | Sprint 2 | Frontend Team | AI & Maps Team | ✅ `HOÀN THÀNH` | `UI_07, UI_12` |
| **PB07** | Xem dự báo thời tiết | Sprint 2 | Frontend Team | AI & Maps Team | ✅ `HOÀN THÀNH` | `UI_06, UI_11` |
| **PB08** | Tạo lịch trình bằng AI | Sprint 2 | Frontend Team | AI & Maps Team | ✅ `HOÀN THÀNH` | `UI_17, UI_18` |
| **PB09** | Quản lý lịch trình | Sprint 2 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_20–22` |
| **PB10** | Đánh giá địa điểm | Sprint 3 | Frontend Team | Realtime Team | ✅ `HOÀN THÀNH` | `UI_16` |
| **PB11** | Chia sẻ cẩm nang du lịch | Sprint 3 | Frontend Team | Realtime Team | ✅ `HOÀN THÀNH` | `UI_23` |
| **PB12** | Trò chuyện nhóm | Sprint 3 | Frontend Team | Realtime Team | ✅ `HOÀN THÀNH` | `UI_24` |
| **PB13** | Nhận thông báo | Sprint 3 | Frontend Team | Realtime Team | ✅ `HOÀN THÀNH` | `UI_25` |
| **PB14** | Admin Quản lý cẩm nang | Sprint 3 | Frontend Team | QA & Admin Team | ✅ `HOÀN THÀNH` | `UI_34–36` |
| **PB15** | Admin Quản lý danh mục | Sprint 1 | Frontend Team | QA & Admin Team | ✅ `HOÀN THÀNH` | `UI_29, UI_30` |
| **PB16** | Admin Quản lý tài khoản | Sprint 3 | Frontend Team | QA & Admin Team | ✅ `HOÀN THÀNH` | `UI_31–33` |
| **PB17** | Admin Quản lý đánh giá | Sprint 3 | Frontend Team | Realtime Team | ✅ `HOÀN THÀNH` | `UI_37–39` |
| **PB18** | Admin Thống kê và báo cáo | Sprint 3 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_26` |
| **PB19** | Admin Quản lý địa điểm | Sprint 1 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_27, UI_28` |
| **PB20** | Tạo lịch trình thủ công | Sprint 2 | Frontend Team | Backend Team | ✅ `HOÀN THÀNH` | `UI_19` |

---

## 4. NHẬT KÝ CẬP NHẬT TIẾN ĐỘ THEO MỐC THỜI GIAN

| Ngày cập nhật | Người / AI cập nhật | Nội dung hoàn thành & Trạng thái |
| :---: | :---: | :--- |
| **22/11/2026** | **AI Lead & Nhóm 1** | **Hoàn thành 100% Giai đoạn 0:** Khảo sát `AI-TripPlanner/`, phân tích 6 docx, tạo bộ 13 file Guardrails & Quản lý dự án, chốt Tech Stack Node.js + MySQL + Prisma + Socket.io + React Vite. |
| *Dự kiến* | AI Lead & Hòa | **Giai đoạn 1:** Khởi tạo DB 22 bảng MySQL, nạp Seeder, dựng core services và khung UI TripMate. |
| *Dự kiến* | Cả nhóm | **Giai đoạn 2:** Triển khai Sprint 1 (`PB01, PB02, PB03, PB15, PB19`). |
| *Dự kiến* | Cả nhóm | **Giai đoạn 3:** Triển khai Sprint 2 (`PB04, PB05, PB06, PB07, PB08, PB09, PB20`). |
| *Dự kiến* | Cả nhóm | **Giai đoạn 4:** Triển khai Sprint 3 (`PB10, PB11, PB12, PB13, PB14, PB16, PB17, PB18`). |

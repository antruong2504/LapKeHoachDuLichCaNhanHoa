# KẾ HOẠCH DỰ ÁN 3 SPRINT & PHÂN CÔNG NHIỆM VỤ (PROJECT PLAN)

Dự án: **TripMate** — Nền tảng lập kế hoạch du lịch cá nhân hóa ứng dụng AI  
Thời gian thực hiện: **23/10/2026 – 11/12/2026** (7 tuần, chia làm 3 Sprint)  
Mô hình phát triển: **Scrum / Agile**

---

## 1. THÀNH VIÊN VÀ MA TRẬN TRÁCH NHIỆM (RACI MATRIX)

| Bộ phận / Vai trò | Trách nhiệm chuyên môn |
| :--- | :--- |
| **Backend & Architecture Team** | Thiết kế kiến trúc Database 22 bảng, dựng core REST API, bảo mật JWT/RBAC, cấu hình Prisma ORM, kiểm thử tích hợp BE. |
| **Frontend & UI/UX Team** | Dựng khung giao diện chuẩn TripMate (39 màn hình), thiết kế hệ thống component dùng chung (TailwindCSS, Modal, Pagination, Toast), quản lý state, phụ trách UI Customer & Admin. |
| **AI & Maps Routing Team** | Tích hợp Google Gemini AI (PB08), tích hợp bản đồ Leaflet + OSRM routing (PB06), tích hợp OpenWeatherMap (PB07), xử lý kéo thả lộ trình `@dnd-kit`. |
| **Realtime & Community Team** | Phát triển module Socket.io Trò chuyện nhóm (PB12), Thông báo realtime (PB13), Đánh giá địa điểm (PB10, PB17), Cẩm nang du lịch (PB11, PB14). |
| **Database & QA Testing Team** | Phát triển Quản lý danh mục (PB15), Quản lý tài khoản (PB16), Thống kê báo cáo (PB18), viết Database Seeder dữ liệu mẫu, viết kịch bản kiểm thử Acceptance Criteria. |

---

## 2. KẾ HOẠCH CHI TIẾT 3 SPRINT BÁM SÁT PRODUCT BACKLOG (BẢNG 5)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TIẾN ĐỘ 3 SPRINT                                │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│        SPRINT 1         │        SPRINT 2         │        SPRINT 3         │
│  23/10/2026 - 05/11/2026│  06/11/2026 - 19/11/2026│  20/11/2026 - 11/12/2026│
│  Nền tảng & Quản trị gốc│  Khám phá & Lập lịch    │  Tương tác & Quản trị AI│
│(PB01, PB02, PB03, 15, 19)│(PB04, 05, 06, 07, 08, 09,│(PB10, 11, 12, 13, 14,   │
│                         │          PB20)          │       16, 17, 18)       │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

### SPRINT 1: NỀN TẢNG TÀI KHOẢN, BẢO MẬT VÀ DỮ LIỆU ĐỊA ĐIỂM / DANH MỤC GỐC
- **Thời gian:** 23/10/2026 – 05/11/2026 (2 tuần)
- **Mục tiêu:** Xây dựng cơ sở dữ liệu 22 bảng MySQL, xác thực JWT, hồ sơ người dùng, quản lý danh mục địa điểm 2 cấp và quản trị địa điểm du lịch (CRUD + xóa mềm).
- **Phân rã công việc:**
  - **PB01 (Đăng ký tài khoản - `UI_01`):**
    - FE (Thúy An): Thiết kế màn hình đăng ký form chuẩn, validation hiển thị lỗi inline.
    - BE (Hòa): API `POST /api/auth/register`, hash bcryptjs, kiểm tra trùng lặp email/username.
    - Test (Tần): Kiểm thử mật khẩu yếu, trùng lặp tài khoản.
  - **PB02 (Đăng nhập hệ thống - `UI_02`):**
    - FE (Thúy An): Giao diện đăng nhập, lưu token localStorage, chuyển hướng đúng vai trò.
    - BE (Hòa): API `POST /api/auth/login`, phát sinh JWT, chặn tài khoản `bi_khoa`.
    - Test (Tần): Kiểm tra đăng nhập đúng/sai mật khẩu, tài khoản bị khóa.
  - **PB03 (Quản lý hồ sơ cá nhân - `UI_13, UI_14`):**
    - FE (Thúy An): Bố cục 2 cột (Sidebar tài khoản + form hồ sơ/đổi mật khẩu/upload avatar).
    - BE (Huy): API upload avatar multer <= 5MB, API đổi mật khẩu kiểm tra mật khẩu cũ.
    - Test (Tần): Upload file > 5MB, sai mật khẩu cũ.
  - **PB15 (Quản lý danh mục địa điểm 2 cấp - `UI_29, UI_30`):**
    - FE (Thúy An): Giao diện bảng danh mục, modal thêm nhóm và danh mục con.
    - BE (Tần): API CRUD nhóm danh mục & danh mục con, ràng buộc tối đa 10 mục con/nhóm, chống trùng tên không dấu.
    - Test (Hòa): Kiểm thử thêm mục thứ 11, kiểm thử trùng tên có dấu/không dấu.
  - **PB19 (Quản lý địa điểm du lịch - `UI_27, UI_28`):**
    - FE (Hoài An): Form thêm/sửa địa điểm, upload ảnh, chọn tọa độ và danh mục con.
    - BE (Hòa): API CRUD địa điểm, xử lý Xóa mềm (`trang_thai = 'da_xoa'`), Optimistic Locking `phien_ban`.
    - Test (Tần): Kiểm thử xóa mềm, chống ghi đè phiên bản cũ.

---

### SPRINT 2: KHÁM PHÁ ĐỊA ĐIỂM, BẢN ĐỒ LỘ TRÌNH, DỰ BÁO THỜI TIẾT VÀ LẬP LỊCH TRÌNH (AI & THỦ CÔNG)
- **Thời gian:** 06/11/2026 – 19/11/2026 (2 tuần)
- **Mục tiêu:** Hoàn thiện trải nghiệm cốt lõi của TripMate: tìm kiếm địa điểm, bản đồ OSRM tối ưu lộ trình, thời tiết OpenWeatherMap, tạo lịch trình tự động bằng Gemini AI và tạo lịch trình thủ công.
- **Phân rã công việc:**
  - **PB05 (Trang chủ & Tìm kiếm/Lọc địa điểm - `UI_03–05, UI_08–10`):**
    - FE (Thúy An): Hero banner, ô tìm kiếm không dấu, bộ lọc danh mục áp dụng nhiều tiêu chí, phân trang 10 mục.
    - BE (Hòa): Query tìm kiếm không dấu SQL (`utf8mb4_unicode_ci`), lọc quan hệ nhiều-nhiều `dia_diem_danh_mucs`.
    - Test (Tần): Kiểm thử tìm kiếm không dấu (ví dụ: "ba na" ra "Bà Nà"), phân trang.
  - **PB04 (Quản lý danh sách yêu thích - `UI_15`):**
    - FE (Thúy An): Nút thả tim tại thẻ địa điểm, màn hình danh sách yêu thích cá nhân.
    - BE (Huy): API yêu thích `GET, POST, DELETE /api/favorites`.
  - **PB06 (Bản đồ và lộ trình Leaflet + OSRM - `UI_07, UI_12`):**
    - FE (Hoài An): Bố cục chia đôi: Panel bên trái (chọn điểm, nhập xuất phát tay, kéo thả `@dnd-kit`) + Map Leaflet bên phải.
    - BE (Hoài An): API OSRM routing, thuật toán TSP Nearest Neighbor tìm quãng đường ngắn nhất (tối đa 10 điểm).
    - Test (Tần): Kiểm thử giới hạn 10 địa điểm, kiểm thử kéo thả đổi thứ tự không tối ưu lại.
  - **PB07 (Dự báo thời tiết OpenWeatherMap - `UI_06, UI_11`):**
    - FE (Thúy An): Card thời tiết hiển thị nhiệt độ, trạng thái thời tiết, icon, nút "Thử lại" khi lỗi.
    - BE (Hoài An): Service gọi OpenWeatherMap API, bộ đệm cache.
  - **PB08 (Tạo lịch trình du lịch bằng Gemini AI - `UI_17, UI_18`):**
    - FE (Thúy An & Hoài An): Form 6 thông tin bắt buộc, loading state, hiển thị lịch trình từng ngày, cảnh báo vượt ngân sách, nút tạo lại từng ngày / toàn bộ.
    - BE (Hoài An & Hòa): Gemini AI API structured prompt, lấy địa điểm hợp lệ trong DB, lưu nháp `ban_nhap_ais`, API lưu chính thức.
    - Test (Tần): Kiểm tra validation 6 trường, test vượt ngân sách.
  - **PB20 (Tạo lịch trình thủ công - `UI_19`):**
    - FE (Hoài An): Cho phép người dùng tự phân chia ngày, thêm địa điểm từ danh sách/yêu thích, sắp xếp thứ tự chặng.
    - BE (Hòa): API lưu lịch trình thủ công `POST /api/trips/manual`.
  - **PB09 (Quản lý lịch trình cá nhân - `UI_20–22`):**
    - FE (Thúy An): Danh sách lịch trình của tôi, màn hình xem chi tiết/sửa lịch trình, cảnh báo địa điểm đã xóa mềm, modal xác nhận xóa.
    - BE (Hòa): API `GET, PUT, DELETE /api/trips`, kiểm tra quyền sở hữu `tai_khoan_id`, Optimistic Locking.
    - Test (Tần): Kiểm tra hiển thị snapshot khi địa điểm gốc bị xóa mềm.

---

### SPRINT 3: TƯƠNG TÁC CỘNG ĐỒNG, CHAT REALTIME, THÔNG BÁO VÀ QUẢN TRỊ TOÀN DIỆN
- **Thời gian:** 20/11/2026 – 11/12/2026 (3 tuần)
- **Mục tiêu:** Hoàn thiện các tính năng tương tác mạng xã hội thu nhỏ (đánh giá, cẩm nang, chat realtime, thông báo) và bộ công cụ quản trị Admin (kiểm duyệt cẩm nang/đánh giá, khóa tài khoản, thống kê báo cáo Recharts).
- **Phân rã công việc:**
  - **PB10 (Đánh giá địa điểm 1-5 sao - `UI_16`):**
    - FE (Thúy An): Modal đánh giá chọn sao, nhập nhận xét tại chi tiết địa điểm.
    - BE (Huy): API lưu đánh giá, cập nhật điểm đánh giá trung bình vào bảng `dia_diems`.
  - **PB11 (Chia sẻ cẩm nang du lịch - `UI_23`):**
    - FE (Thúy An): Danh sách cẩm nang cộng đồng, nút "Viết cẩm nang mới" kèm form đăng bài.
    - BE (Huy): API cẩm nang, upload ảnh, lưu liên kết `cam_nang_anh_lien_kets`, bình luận cẩm nang.
  - **PB12 (Trò chuyện nhóm realtime Socket.io - `UI_24`):**
    - FE (Huy): Giao diện phòng chat (danh sách nhóm bên trái, khung hội thoại bên phải, nút tạo nhóm/thêm bạn).
    - BE (Huy): Socket.io server xử lý room chat, lưu tin nhắn vào `tin_nhans`, bảo đảm chỉ thành viên nhóm mới được vào room.
  - **PB13 (Nhận thông báo realtime - `UI_25`):**
    - FE (Thúy An): Chuông thông báo trên Navbar kèm badge đỏ đếm tin chưa đọc, dropdown thông báo và trang chi tiết.
    - BE (Huy & Hòa): Socket.io notification dispatcher, API đánh dấu đã đọc.
  - **PB14 (Admin Quản lý cẩm nang du lịch - `UI_34–36`):**
    - FE (Thúy An): Bảng cẩm nang, modal xóa cẩm nang bắt buộc nhập lý do.
    - BE (Tần): API xóa cẩm nang, kiểm tra không xóa nhầm ảnh dùng chung (`cam_nang_anh_lien_kets`), gửi thông báo UTC+7 cho tác giả.
  - **PB16 (Admin Quản lý tài khoản người dùng - `UI_31–33`):**
    - FE (Thúy An): Bảng danh sách tài khoản, modal khóa/mở khóa bắt buộc nhập lý do.
    - BE (Tần): API cập nhật `trang_thai = 'bi_khoa'`, lưu `ly_do_khoa`, gửi thông báo và hủy phiên đăng nhập.
  - **PB17 (Admin Quản lý đánh giá - `UI_37–39`):**
    - FE (Thúy An): Bảng đánh giá, modal xóa đánh giá bắt buộc nhập lý do.
    - BE (Huy & Tần): API xóa đánh giá, tự động tính lại điểm trung bình địa điểm, gửi thông báo UTC+7 cho người đánh giá.
  - **PB18 (Admin Thống kê và báo cáo - `UI_26`):**
    - FE (Hoài An): Dashboard Admin tích hợp biểu đồ Recharts (tăng trưởng người dùng, lịch trình theo tỉnh thành, phân bố đánh giá).
    - BE (Hòa): API tổng hợp số liệu theo khoảng thời gian chọn lọc múi giờ UTC+7.
  - **Tổng duyệt & Release (Cả nhóm):**
    - Build test FE Vite, kiểm tra hiệu năng, tối ưu bundling, rà soát toàn bộ Acceptance Criteria.

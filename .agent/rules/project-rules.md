# BỘ QUY TẮC PHÁT TRIỂN DỰ ÁN TRIPMATE (.agent/rules/project-rules.md)

Tài liệu quy tắc dành cho hệ thống AI Agent phát triển dự án TripMate:

## 1. THÔNG SỐ VÀ CẤU HÌNH BẮT BUỘC
- **Mã hóa chuỗi DB & Server:** `utf8mb4` / `utf8mb4_unicode_ci`.
- **Múi giờ:** `Asia/Ho_Chi_Minh` (UTC+7). Mọi thao tác tính toán ngày giờ, thống kê theo ngày/tuần/tháng, và thời gian hiển thị thông báo phải dùng UTC+7.
- **Môi trường:** Node.js v20+ LTS / v22 LTS, Windows 11 PowerShell.
- **Database:** MySQL / MariaDB (XAMPP mặc định cổng 3306).

## 2. CHUẨN VALIDATION & NGHIỆP VỤ
- **Mật khẩu (PB01, PB03):** Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt.
- **Số điện thoại (PB01, PB03):** 10 chữ số, bắt đầu bằng `0`.
- **Email:** Định dạng email hợp lệ, unique trong `tai_khoans`.
- **Tên đăng nhập (PB01):** 4-30 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới, unique.
- **Phân trang (PB05, PB15, PB16, PB17, PB18, PB19):** Mặc định 10 mục/trang (`limit=10`, `page=1`).
- **Upload file (Avatar PB03, Địa điểm PB19, Cẩm nang PB11/PB14):**
  - Định dạng: JPG, JPEG, PNG, WEBP.
  - Dung lượng tối đa: 5MB.
  - Lưu trữ: thư mục `BE/uploads/` được phục vụ tĩnh qua `/uploads`.
- **Xóa địa điểm (PB19):** Xóa mềm (`trang_thai = 'da_xoa'`). Không xóa cứng bản ghi để bảo toàn dữ liệu lịch trình cũ.
- **Optimistic Locking (PB09, PB19):** Sử dụng cột `phien_ban` kiểu INT. Khi update, tăng `phien_ban = phien_ban + 1` và kiểm tra phiên bản khớp trước khi ghi đè.
- **Lý do bắt buộc (PB14, PB16, PB17):** Các thao tác khóa tài khoản, xóa cẩm nang, xóa đánh giá của Quản trị viên bắt buộc phải có trường `ly_do` (không được để trống) và kích hoạt gửi thông báo UTC+7 tới người dùng.

## 3. QUY TẮC GIAO DIỆN TRIPMATE
- **Tone màu chủ đạo:**
  - Teal chính: `#0F766E` (dark teal), `#0D9488` (teal), `#115E59` (teal hover).
  - Background nhẹ: `#F0FDFA` / `#CCFBF1`.
  - Accent / AI: Amber `#F59E0B` cho nút tạo lịch trình AI và đánh giá sao.
  - Danger: Red `#DC2626` cho nút xóa/khóa và cảnh báo.
  - Neutral Background: `#F8FAFC`, Border: `#E2E8F0`, Card: White `#FFFFFF` bo góc lớn `rounded-2xl` shadow-sm.
- **Typography:** `Inter` hoặc `Plus Jakarta Sans`, hỗ trợ tiếng Việt trọn vẹn.
- **Bố cục:**
  - Khách vãng lai & Khách hàng: Top Navbar (Logo bên trái, 5 menu ở giữa, Auth/User ở phải) + Main Content + Footer 4 cột.
  - Quản trị viên: Sidebar cố định bên trái (Logo TripMate ADMIN + 6 menu có icon) + Topbar + Content Panel.

## 4. DANH SÁCH ĐIỀU CẤM (PROHIBITIONS)
- KHÔNG chỉnh sửa bất kỳ file nào trong thư mục `AI-TripPlanner/`.
- KHÔNG thêm tính năng ngoài 20 PB (no payment, no booking, no split expense).
- KHÔNG bỏ qua xác thực mật khẩu cũ khi đổi mật khẩu (`PB03`).
- KHÔNG cho phép khách vãng lai đánh giá địa điểm (chuyển hướng sang đăng nhập `UI_02`).
- KHÔNG hardcode API keys trong source code (bắt buộc dùng `.env`).

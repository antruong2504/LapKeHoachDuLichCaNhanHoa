# BẢN GHI CÁC QUYẾT ĐỊNH KIẾN TRÚC & NGHIỆP VỤ (DECISION LOG)

Dự án: **TripMate** — Nền tảng lập kế hoạch du lịch cá nhân hóa ứng dụng AI  
Nhóm: **Nhóm 1** (5 thành viên)

---

## ADR-01: Chuyển đổi Tech Stack Backend sang Node.js/Express + MySQL + Prisma + Socket.io
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Tài liệu đề cương cũ (`Nhom1_1_ProjectProposal_v2.docx`, `Nhom1_2_ProjectPlan_v2.docx`) có đề cập Backend dùng PHP/Laravel. Tuy nhiên, thư mục mã nguồn hiện có của dự án đã có sẵn khung `BE/` viết bằng Node.js/Express, và nhóm cần tích hợp sâu với Google Gemini AI SDK, Socket.io realtime, và tái sử dụng các service từ `AI-TripPlanner/`.
- **Quyết định:** 
  Chính thức chốt Backend dùng **Node.js + Express.js + MySQL (XAMPP) + Prisma ORM + Socket.io**.
  - ORM: Prisma ORM với MySQL (`utf8mb4_unicode_ci`) đảm bảo migrations sạch, type-safety và dễ bảo trì.
  - Socket.io tích hợp để xử lý Trò chuyện nhóm (PB12) và Thông báo realtime (PB13).
- **Hệ quả tích cực:** Đồng bộ toàn diện JavaScript/TypeScript trên cả FE và BE, dễ dàng port các logic từ `AI-TripPlanner/`, hiệu năng I/O bất đồng bộ cao khi gọi Gemini API và OpenWeatherMap.

---

## ADR-02: Cơ chế Xóa mềm (Soft Delete) đối với Địa điểm du lịch (PB19)
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Khi Quản trị viên xóa một địa điểm du lịch trong `PB19`, nếu xóa cứng (Hard Delete / `DELETE FROM dia_diems`), các bản ghi trong `lich_trinh_chi_tiets` thuộc lịch trình cá nhân của người dùng đã tạo trước đó sẽ bị hỏng khóa ngoại hoặc mất toàn bộ thông tin địa điểm.
- **Quyết định:** 
  - Thêm cột `trang_thai VARCHAR(20) DEFAULT 'hoat_dong'` vào bảng `dia_diems`. Khi xóa, cập nhật `trang_thai = 'da_xoa'`.
  - Giữ lại bản chụp snapshot (`ten_dia_diem_snapshot`, `dia_chi_snapshot`, `vi_do_snapshot`, `kinh_do_snapshot`) trong `lich_trinh_chi_tiets`.
  - Khi người dùng mở xem chi tiết lịch trình (`PB09`), nếu địa điểm có `trang_thai = 'da_xoa'`, hệ thống vẫn hiển thị dữ liệu snapshot kèm nhãn cảnh báo: *"Địa điểm này hiện không còn khả dụng trên hệ thống"*.
- **Hệ quả tích cực:** Bảo toàn 100% tính toàn vẹn của các lịch trình lịch sử, tuân thủ đúng yêu cầu trong `Nhom1_4.Product-Backlog.docx`.

---

## ADR-03: Bổ sung Nút cơ bản "Tạo cẩm nang" và "Tạo nhóm chat / Thêm thành viên" phục vụ kiểm thử End-to-End
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Trong `Nhom1_4.Product-Backlog.docx`, chức năng PB11 (Chia sẻ cẩm nang), PB12 (Trò chuyện nhóm) và PB14 (Quản lý cẩm nang) mô tả các hành động tương tác, nhưng chưa chỉ định rõ màn hình tạo mới cẩm nang cho khách hàng và luồng tạo nhóm chat.
- **Quyết định:** 
  - Tại giao diện Cẩm nang (`UI_23`), bổ sung nút **"Viết cẩm nang mới"** mở Modal nhập tiêu đề, ảnh đại diện, mô tả ngắn, nội dung.
  - Tại giao diện Trò chuyện nhóm (`UI_24`), bổ sung nút **"Tạo nhóm mới"** và **"Thêm thành viên"** (chọn danh sách bạn bè/người dùng) để hỗ trợ test trọn vẹn luồng gửi/nhận tin nhắn và quyền truy cập phòng chat.
- **Hệ quả tích cực:** Đảm bảo luồng test E2E hoàn chỉnh từ lúc tạo dữ liệu đến lúc chia sẻ, thảo luận và quản trị mà không làm vỡ kiến trúc.

---

## ADR-04: Chuẩn hóa tên bảng `ban_nhap_ais` trong Cơ sở dữ liệu
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Trong tài liệu `Nhom1_6.ProjectDatabase.docx`, bảng 12 được đặt tên số ít là `ban_nhap_ai`, trong khi toàn bộ 21 bảng còn lại đều dùng số nhiều có đuôi `s` (`tai_khoans`, `dia_diems`, `lich_trinhs`...).
- **Quyết định:** 
  Chuẩn hóa tên bảng trong MySQL là `ban_nhap_ais` (hoặc map `@map("ban_nhap_ais")` trong Prisma) để đảm bảo tính nhất quán 100% trong quy ước đặt tên cơ sở dữ liệu.
- **Hệ quả tích cực:** Giữ đúng quy ước số nhiều thống nhất trên toàn hệ thống ORM.

---

## ADR-05: Chính sách nghiêm ngặt Chống tự bịa tính năng (Anti-Scope-Creep)
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Các dự án AI thường dễ bị mở rộng phạm vi ngoài tầm kiểm soát khi tự bổ sung thanh toán, booking, chia tiền nhóm.
- **Quyết định:** 
  Khóa cứng phạm vi vào đúng 20 mục `PB01–PB20` và 39 màn hình `UI_01–UI_39`. Mọi đề xuất thêm tính năng ngoài tài liệu gốc đều bị từ chối.

---

## ADR-06: Tích hợp Supabase Cloud Database (PostgreSQL) & Supabase Storage (Cloud CDN)
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Nhóm có 5 thành viên làm việc phân tán. Nếu dùng MySQL local (XAMPP), việc đồng bộ dữ liệu giữa 5 máy rất phức tạp và ảnh upload local dễ bị thất lạc khi chuyển máy.
- **Quyết định:** 
  1. Sử dụng **Supabase Cloud Database (PostgreSQL)** làm CSDL chính thức trên mây kết nối qua **Prisma ORM**. Toàn bộ 22 bảng được đồng bộ trên Cloud để cả 5 thành viên cùng truy xuất dữ liệu chung thời gian thực.
  2. Sử dụng **Supabase Storage** (Bucket `tripmate-media`) để lưu trữ toàn bộ ảnh upload (Avatar người dùng, ảnh địa điểm du lịch, ảnh cẩm nang) với link HTTPS công khai.
  3. Duy trì script xuất CSDL sang MySQL để sẵn sàng nộp file `.sql` MySQL theo yêu cầu của Khoa/Trường khi bảo vệ đồ án.
- **Hệ quả tích cực:** Tối ưu hóa 100% khả năng làm việc nhóm từ xa, dữ liệu và hình ảnh không bao giờ bị mất, hiệu năng truy vấn cao.

---

## ADR-07: Tích hợp Swagger UI / OpenAPI cho Backend
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Dự án có 20 mục chức năng với hàng chục endpoint REST API. Giảng viên và các thành viên Frontend cần công cụ trực quan để kiểm thử nhanh.
- **Quyết định:** 
  Tích hợp `swagger-ui-express` và `swagger-jsdoc` tại endpoint `/api/docs`.
- **Hệ quả tích cực:** Chuẩn hóa tài liệu API công nghiệp, hỗ trợ "Try it out" trực tiếp trên trình duyệt mà không cần cài Postman.

---

## ADR-08: Tích hợp Xuất PDF Lịch trình (UI_21) và Skeleton Shimmer Loading (UI_04, UI_18)
- **Ngày quyết định:** 22/11/2026
- **Trạng thái:** Đã chốt (Accepted)
- **Bối cảnh:** 
  Tăng cường trải nghiệm người dùng thực tế cho ứng dụng du lịch và giúp giao diện hiện đại, chuyên nghiệp khi chấm đồ án.
- **Quyết định:** 
  1. Bổ sung tính năng **Xuất PDF / In ấn lịch trình** tại `UI_21` (Chi tiết lịch trình) sử dụng `jspdf` / `html2canvas` hoặc Print CSS, xuất ra bản in lịch trình du lịch chuyên nghiệp kèm logo TripMate.
  2. Bổ sung **Skeleton Shimmer Loading** tại `UI_04` (Tìm kiếm địa điểm) và `UI_18` (Chờ kết quả AI) thay thế cho spinner đơn điệu.
- **Hệ quả tích cực:** Nâng cao chất lượng UI/UX, điểm cộng thực tiễn rất lớn khi bảo vệ đồ án trước Hội đồng.

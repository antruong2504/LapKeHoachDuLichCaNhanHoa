# NHẬT KÝ THAY ĐỔI DỰ ÁN (CHANGELOG)

Tất cả các thay đổi quan trọng của dự án **TripMate** sẽ được ghi chép tại tài liệu này theo định dạng chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/) và tuân thủ [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added - Sprint 3 (PB18: Admin Tổng quan, Thống kê & Báo cáo - UI_26)
- **Backend API (`/api/admin/stats`):**
  - `GET /api/admin/stats`: Tổng hợp KPI hệ thống (Người dùng, Địa điểm, Lịch trình AI/Thủ công, Cẩm nang, Đánh giá TB) và dữ liệu cho 3 biểu đồ theo khoảng thời gian chọn lọc chuẩn múi giờ Việt Nam **UTC+7** (`start_date`, `end_date`).
- **Frontend Components & Pages:**
  - `adminService.js`: Bổ sung `getDashboardStats(params)`.
  - `AdminDashboardPage.jsx` (`UI_26`): Dashboard quản trị viên với 5 thẻ KPI, bộ lọc ngày UTC+7 (7 ngày, 30 ngày, Tất cả, tùy chọn ngày) và 3 biểu đồ Recharts tương tác (*AreaChart* tăng trưởng người dùng & lịch trình, *BarChart* lịch trình theo tỉnh thành, *PieChart* phân bố đánh giá 1–5 sao).
  - `App.jsx`: Thay thế Dashboard placeholder tại `/admin` bằng `AdminDashboardPage`.
- **Kiểm thử tự động & Build tổng thể:**
  - Script kiểm thử `BE/tests/test_pb18.js` đạt 100% (3/3 PASS): bảo mật Admin (HTTP 403), tổng hợp đủ 3 biểu đồ & KPI, lọc theo khoảng thời gian UTC+7.
  - Biên dịch toàn bộ Frontend (`npm run build`) đạt 100% thành công (0 lỗi). Hoàn tất toàn bộ 20/20 PB đồ án TripMate!

### Added - Sprint 3 (PB17: Admin Quản lý đánh giá - UI_37, UI_38, UI_39)
- **Backend API (`/api/admin/reviews`):**
  - `GET /api/admin/reviews`: Lấy danh sách đánh giá địa điểm phân trang 10 dòng/trang, hỗ trợ lọc theo số sao (`so_sao`) và tìm kiếm theo nội dung/địa điểm/tác giả.
  - `DELETE /api/admin/reviews/:id`: Xóa đánh giá vi phạm kèm `ly_do` bắt buộc (HTTP 400 nếu trống), tự động gọi `recalculateDestinationRating` cập nhật lại `diem_danh_gia_tb` trong bảng `dia_diems` và gửi thông báo UTC+7 tới tác giả.
- **Frontend Components & Pages:**
  - `adminService.js`: Bổ sung `getReviews` và `deleteReview`.
  - `AdminReviewsPage.jsx` (`UI_37–39`): Bảng quản lý đánh giá có bộ lọc số sao 1–5 sao, tìm kiếm, modal xem chi tiết (`UI_38`), modal xóa bắt buộc nhập lý do (`UI_39`).
  - `App.jsx`: Gắn route `/admin/reviews` dẫn đến `AdminReviewsPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb17.js` đạt 100% (3/3 PASS): lọc theo số sao, bảo mật Admin (HTTP 403) & thiếu lý do (HTTP 400), xóa đánh giá, đối chiếu điểm TB địa điểm tính lại chuẩn xác và gửi thông báo UTC+7.

### Added - Sprint 3 (PB16: Admin Quản lý tài khoản người dùng - UI_31, UI_32, UI_33)
- **Database Schema (`BE/prisma/schema.prisma`):**
  - Bổ sung cột `thoi_gian_khoa` (`DateTime?`) vào bảng `tai_khoans` và đồng bộ lên Supabase Cloud (`npx prisma db push`).
- **Backend API (`/api/admin/users`):**
  - `GET /api/admin/users`: Lấy danh sách tài khoản người dùng phân trang 10 dòng/trang, hỗ trợ tìm kiếm (tên, username, email, SĐT) và lọc theo trạng thái (`hoat_dong` / `bi_khoa`).
  - `PATCH /api/admin/users/:id/status`: Khóa hoặc mở khóa tài khoản; bắt buộc nhập `ly_do_khoa` khi khóa (HTTP 400 nếu trống), lưu `thoi_gian_khoa` và gửi thông báo realtime UTC+7 tới người dùng.
- **Frontend Components & Pages:**
  - `adminService.js`: API client quản trị (`getUsers`, `toggleUserStatus`).
  - `AdminUsersPage.jsx` (`UI_31–33`): Bảng quản lý tài khoản phân trang 10 dòng/trang, hiển thị trạng thái, lý do & thời gian khóa UTC+7, modal khóa/mở khóa kèm lý do bắt buộc & gợi ý nhanh.
  - `App.jsx`: Gắn route `/admin/users` dẫn đến `AdminUsersPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb16.js` đạt 100% (4/4 PASS): phân trang 10 dòng, bảo mật Admin (HTTP 403) & thiếu lý do (HTTP 400), khóa tài khoản lưu `thoi_gian_khoa` UTC+7 & gửi thông báo, mở khóa tài khoản thành công.

### Added - Sprint 3 (PB14: Admin Quản lý cẩm nang du lịch - UI_34, UI_35, UI_36)
- **Backend API (`/api/admin/guides`):**
  - `GET /api/admin/guides`: Lấy danh sách cẩm nang cho Quản trị viên (hỗ trợ tìm kiếm theo tiêu đề/tác giả, phân trang 10 mục/trang, hiển thị ngày đăng UTC+7).
  - `DELETE /api/admin/guides/:id`: Xóa bài viết cẩm nang vi phạm kèm trường `ly_do` bắt buộc (HTTP 400 nếu trống), tự động bảo toàn bản ghi ảnh dùng chung trong `cam_nang_hinh_anhs` và phát thông báo realtime (UTC+7) tới tác giả qua `createAndEmitNotification`.
- **Frontend Components & Pages:**
  - `guideService.js`: Bổ sung `getAdminGuides` và `adminDeleteGuide`.
  - `AdminGuidesPage.jsx` (`UI_34–36`): Bảng quản lý cẩm nang có tìm kiếm & phân trang, modal xem chi tiết nội dung (`UI_35`), modal xóa màu đỏ bắt buộc nhập lý do kèm gợi ý lý do nhanh (`UI_36`).
  - `App.jsx`: Gắn route `/admin/guides` dẫn đến `AdminGuidesPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb14.js` đạt 100% (3/3 PASS): chặn phân quyền Admin (HTTP 403) & thiếu lý do (HTTP 400), lấy danh sách Admin, xóa bài viết, kiểm tra ảnh `cam_nang_hinh_anhs` vẫn nguyên vẹn và thông báo UTC+7 đã được tạo cho tác giả.

### Added - Sprint 3 (PB13: Nhận thông báo realtime - UI_25)
- **Backend API (`/api/notifications`) & Socket.io (`socketHandler.js`):**
  - `socketHandler.js`: Cập nhật `join_user` và `emitNotification` hỗ trợ room cá nhân chuẩn `user-{id}` (song song `user_{id}`) phát sự kiện `notification_received`.
  - `notificationController.js`: Helper tái sử dụng `createAndEmitNotification` lưu bảng `thong_baos` và phát realtime; các API `GET /api/notifications` (trả về danh sách + `unread_count`), `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, `POST /api/notifications/test`.
- **Frontend Components & Pages:**
  - `notificationService.js`: API client cho thông báo.
  - `Navbar.jsx`: Chuông thông báo hiển thị badge đỏ đếm chính xác số tin chưa đọc (`unreadCount`), tự động cập nhật realtime qua Socket.io và sự kiện `notifications_updated`.
  - `NotificationsPage.jsx` (`UI_25`): Danh sách thông báo theo dòng thời gian chuẩn múi giờ Việt Nam **UTC+7**, bộ lọc Tất cả / Chưa đọc, click để đánh dấu đã đọc và nút **"Đánh dấu đã đọc tất cả"**.
  - `App.jsx`: Đăng ký route chính thức `/notifications`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb13.js` đạt 100% (4/4 PASS): tạo & phát thông báo UTC+7, lấy danh sách & đếm chưa đọc, đánh dấu đã đọc từng tin, đánh dấu đã đọc tất cả và dọn dẹp dữ liệu test.

### Added - Sprint 3 (PB12: Trò chuyện nhóm realtime Socket.io - UI_24)
- **Backend API (`/api/chat`) & Socket.io (`socketHandler.js`):**
  - `GET /api/chat/groups` & `POST /api/chat/groups`: Lấy danh sách nhóm chat người dùng tham gia và tạo nhóm chat mới (tự động thêm người tạo vào `thanh_vien_nhoms`).
  - `POST /api/chat/groups/:id/members` & `GET /api/chat/users`: Thêm thành viên mới vào nhóm (theo ID, tên đăng nhập hoặc email) và tìm kiếm thành viên gợi ý.
  - `GET /api/chat/groups/:id/messages` & `POST /api/chat/groups/:id/messages`: Lấy lịch sử tin nhắn và gửi tin nhắn. Kiểm tra bảo mật chặt chẽ qua `thanh_vien_nhoms` (trả về **HTTP 403** nếu người ngoài cố truy cập).
  - `socketHandler.js`: Nâng cấp `join_group` và `send_message` kiểm tra quyền thành viên trong `thanh_vien_nhoms` trước khi tham gia phòng hoặc lưu tin nhắn vào `tin_nhans` và phát sự kiện `new_message`.
- **Frontend Components & Pages:**
  - `chatService.js`: API client cho các thao tác phòng chat.
  - `ChatPage.jsx` (`UI_24`): Giao diện phòng chat chia đôi trực quan (danh sách nhóm bên trái, khung hội thoại realtime Socket.io bên phải), nút **"Tạo nhóm"** và nút **"Thêm thành viên"** phục vụ test E2E.
  - `App.jsx` & `Navbar.jsx`: Đăng ký route `/chat` và thêm liên kết nhanh trong menu người dùng.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb12.js` đạt 100% (5/5 PASS): tạo nhóm, chặn người ngoài truy cập phòng (HTTP 403), thêm thành viên mới, lưu tin nhắn vào `tin_nhans` & đọc lịch sử, lấy danh sách nhóm và dọn dẹp dữ liệu test.

### Added - Sprint 3 (PB11: Chia sẻ cẩm nang du lịch - UI_23)
- **Backend API (`/api/guides`):**
  - `GET /api/guides` & `GET /api/guides/:id`: Lấy danh sách cẩm nang cộng đồng (hỗ trợ tìm kiếm) và chi tiết cẩm nang kèm danh sách bình luận, bộ ảnh liên kết, số lượt chia sẻ.
  - `POST /api/guides/upload`: Upload hình ảnh cẩm nang (Multer -> Supabase Storage / fallback `/uploads/guides`), lưu bản ghi vào bảng `cam_nang_hinh_anhs`.
  - `POST /api/guides`: Đăng bài viết cẩm nang mới (`cam_nangs`), tự động tạo liên kết bảo toàn ảnh dùng chung trong bảng `cam_nang_anh_lien_kets`.
  - `POST /api/guides/:id/comments`, `POST /api/guides/:id/share`, `DELETE /api/guides/:id`: Bình luận, ghi nhận lượt chia sẻ và xóa cẩm nang theo phân quyền tác giả/Admin.
- **Frontend Components & Pages:**
  - `guideService.js`: API client cho toàn bộ chức năng cẩm nang.
  - `GuidesPage.jsx` (`UI_23`): Màn hình cẩm nang cộng đồng với thanh tìm kiếm, lưới bài viết trực quan, nút **"Viết cẩm nang mới"** phục vụ test E2E kèm modal upload ảnh & soạn thảo, modal xem chi tiết bài viết, nút chia sẻ và khung bình luận tương tác.
  - `App.jsx`: Đăng ký route chính thức `/guides` dẫn đến `GuidesPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb11.js` đạt 100% (5/5 PASS): lấy danh sách, upload ảnh vào `cam_nang_hinh_anhs`, đăng bài và kiểm tra liên kết `cam_nang_anh_lien_kets`, bình luận, chia sẻ và dọn dẹp dữ liệu test.

### Added - Sprint 3 (PB10: Đánh giá địa điểm 1–5 sao - UI_16)
- **Database Schema (`BE/prisma/schema.prisma`):**
  - Bổ sung cột `diem_danh_gia_tb` (`Decimal(3,2)`) vào bảng `dia_diems` và đồng bộ lên Supabase Cloud (`npx prisma db push`).
- **Backend API (`/api/reviews`):**
  - `POST /api/reviews`: Tiếp nhận đánh giá 1–5 sao kèm nhận xét (`dia_diem_id`, `so_sao`, `noi_dung`), kiểm tra tính hợp lệ (1–5 sao nguyên, nội dung không rỗng), lưu vào bảng `danh_gias`, đồng thời tự động tính toán lại và cập nhật `diem_danh_gia_tb` vào bảng `dia_diems`.
  - `GET /api/reviews/destination/:dia_diem_id`: Lấy danh sách đánh giá công khai theo địa điểm (mới nhất lên đầu).
  - `DELETE /api/reviews/:id`: Cho phép tác giả đánh giá hoặc Admin xóa đánh giá và tự động tính lại điểm trung bình.
- **Frontend Components & Pages:**
  - `reviewService.js`: API client giao tiếp với `/api/reviews`.
  - `DestinationDetailPage.jsx` (`UI_16`): Bổ sung nút **"Viết đánh giá"**, Modal đánh giá chọn 1–5 sao trực quan có hiệu ứng hover preview và mô tả mức độ hài lòng, ô nhập nhận xét, cập nhật danh sách đánh giá và điểm trung bình tức thì không cần tải lại trang, sửa hiển thị tên/ảnh người đánh giá.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb10.js` đạt 100% (5/5 PASS): chặn chưa đăng nhập (HTTP 401), chặn số sao/nội dung sai (HTTP 400), gửi đánh giá 5 sao & 3 sao, đối chiếu chính xác `diem_danh_gia_tb` trong bảng `dia_diems` và dọn dẹp dữ liệu test.

### Added - Sprint 2 (PB09: Quản lý lịch trình cá nhân - UI_20, UI_21, UI_22)
- **Backend API (`/api/trips`):**
  - `GET /api/trips`: Lấy danh sách toàn bộ lịch trình cá nhân đã lưu của tài khoản (không phân trang theo quy định chống scope-creep), sắp xếp mới nhất lên đầu, bao gồm thông tin tỉnh/thành, các ngày và chặng dừng.
  - `GET /api/trips/:id`: Xem chi tiết 1 lịch trình. Bảo toàn toàn vẹn dữ liệu Snapshot: tự động kiểm tra trạng thái địa điểm gốc, nếu địa điểm đã bị xóa mềm (`trang_thai = 'da_xoa'`), hệ thống gắn cờ `dia_diem_da_xoa = true` đồng thời vẫn giữ nguyên tên, địa chỉ, tọa độ, chi phí và hoạt động đã lưu.
  - `PUT /api/trips/:id`: Chỉnh sửa lịch trình với cơ chế Khóa lạc quan (Optimistic Locking) thông qua trường `phien_ban`. Chặn đứng xung đột ghi đè dữ liệu (HTTP 409 Conflict) nếu phiên bản gửi lên không khớp với phiên bản trong cơ sở dữ liệu; tự động tăng `phien_ban` lên 1 khi cập nhật thành công.
  - `DELETE /api/trips/:id`: Xóa lịch trình và tự động dọn sạch các bản ghi ngày tham quan (`lich_trinh_ngays`) và chặng dừng liên kết (`lich_trinh_chi_tiets`) trong CSDL.
- **Frontend Components & Pages:**
  - `MyTripsPage.jsx` (`UI_20`): Màn hình danh sách lịch trình cá nhân với giao diện Teal hiện đại; bộ lọc tab ("Tất cả", "Do AI tạo", "Tự tạo thủ công"); thanh tìm kiếm thời gian thực; thẻ lịch trình hiển thị ảnh cover, badge nguồn tạo, phiên bản `v{phien_ban}`, ngày đi/về, số ngày/chặng, người đi, ngân sách và tổng chi phí ước tính; nút xem chi tiết và nút xóa.
  - `TripDetailPage.jsx` (`UI_21`): Màn hình chi tiết và chỉnh sửa lịch trình; chế độ sửa inline thông tin chuyến đi (tên, ngân sách, số người, sở thích) tích hợp Optimistic Locking và banner cảnh báo xung đột phiên; bộ tab ngày và danh sách các chặng dừng chi tiết; **đặc biệt: hiển thị banner cảnh báo màu vàng khi địa điểm gốc bị xóa mềm, bảo toàn thông tin từ bản sao lưu Snapshot**.
  - **Modal Xác nhận Xóa màu đỏ (`UI_22`):** Hộp thoại cảnh báo bảo mật màu đỏ với icon `ShieldAlert`, hiển thị rõ tên chuyến đi cần xóa, cảnh báo hành động không thể hoàn tác, nút Hủy bỏ và nút Xác nhận xóa vĩnh viễn.
  - `App.jsx`: Đăng ký route `/my-trips`, `/trips/:id` và `/my-trips/:id`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb09.js` đạt 100% (6/6 PASS) toàn bộ các trường hợp: lấy danh sách (UI_20), xem chi tiết (UI_21), cờ Snapshot `dia_diem_da_xoa` khi địa điểm bị xóa mềm, chặn xung đột Optimistic Locking (HTTP 409), cập nhật tăng phiên bản thành công và xóa sạch bản ghi khỏi CSDL (UI_22).

### Added - Sprint 2 (PB20: Tạo lịch trình thủ công - UI_19)
- **Backend API (`/api/trips`):**
  - `POST /api/trips/manual`: Tiếp nhận thông tin chuyến đi thủ công (`ten_lich_trinh`, `tinh_thanh_id`, `ngay_bat_dau`, `ngay_ket_thuc`, `ngan_sach_du_kien`, `so_nguoi`, `so_thich`) kèm mảng `danh_sach_ngay` và các chặng tham quan `cac_chang`.
  - Kiểm tra ràng buộc hợp lệ: Tên lịch trình bắt buộc, tỉnh thành hợp lệ trong CSDL, giới hạn tối đa 14 ngày, tính toán tổng chi phí ước tính, gắn cờ cảnh báo vượt ngân sách.
  - Sử dụng Prisma Interactive Transaction (`timeout: 45000`) lưu an toàn vào Supabase Cloud: tạo bản ghi `lich_trinhs` (`nguon_tao = 'thu_cong'`), tạo `lich_trinh_ngays`, và lưu dữ liệu Snapshot đầy đủ tại `lich_trinh_chi_tiets`.
- **Frontend Components & Pages:**
  - `tripService.js`: Bổ sung hàm `createManualTrip(payload)`.
  - `ManualTripCreatePage.jsx` (`UI_19`):
    - **Thông tin chuyến đi:** Tên lịch trình, dropdown chọn tỉnh thành tải động từ CSDL, ngày bắt đầu và kết thúc (tự động điều chỉnh số ngày tương ứng), ngân sách dự kiến, số người.
    - **Bộ công cụ chia ngày:** Thanh tab ngày (Ngày 1, Ngày 2... kèm số lượng chặng), nút thêm/xóa ngày linh hoạt, ô ghi chú tiêu đề cho từng ngày.
    - **Kéo thả sắp xếp chặng `@dnd-kit`:** Thẻ chặng tương tác với handle `GripVertical`, badge buổi (Sáng, Chiều, Tối), thời gian dự kiến, chi phí ước tính, ghi chú hoạt động cá nhân, nút xóa chặng.
    - **Thêm điểm dừng:** Modal tìm kiếm và chọn nhanh các địa điểm du lịch có sẵn trong CSDL của tỉnh thành đó; hỗ trợ thêm điểm tham quan tự do.
    - **Tổng kết & Lưu:** Thanh thống kê tổng ngày, tổng chặng, tổng chi phí ước tính, cảnh báo vượt ngân sách trực quan, nút lưu lịch trình kèm modal thông báo thành công.
  - `App.jsx`: Đăng ký route chính thức `/trips/manual-create` dẫn đến `ManualTripCreatePage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb20.js` đạt 100% (5/5 PASS) tất cả các tiêu chí: chặn khi thiếu thông tin (HTTP 400), chặn khi quá 14 ngày, lưu thành công lịch trình thủ công vào CSDL, kiểm tra nguồn tạo `thu_cong` và bảo toàn vẹn toàn Snapshot điểm dừng.

### Added - Sprint 2 (PB08: Tạo lịch trình du lịch bằng Gemini AI - UI_17, UI_18)
- **Backend API (`/api/ai`):**
  - `POST /api/ai/generate-itinerary`: Tiếp nhận 6 thông tin bắt buộc (`tinh_thanh_id`, `ngay_bat_dau`, `ngay_ket_thuc`, `ngan_sach_du_kien`, `so_luong_nguoi`, `so_thich`), truy vấn danh sách địa điểm hợp lệ trong CSDL Supabase, sinh lịch trình JSON qua Google Gemini AI hoặc bộ máy dự phòng thông minh (Fallback generator), tự động kiểm tra số ngày (tối đa 14 ngày), cảnh báo vượt ngân sách, và lưu bản nháp vào `ban_nhap_ais`.
  - `POST /api/ai/regenerate-day`: Cho phép tạo lại lịch trình cho 1 ngày cụ thể mà không làm ảnh hưởng đến các ngày khác trong bản nháp.
  - `POST /api/ai/save-draft`: Lưu bản nháp AI vào lịch trình chính thức trong bảng `lich_trinhs` và bảo toàn toàn vẹn dữ liệu Snapshot (tên địa điểm, địa chỉ, tọa độ GPS, thời gian, chi phí, hoạt động) tại bảng `lich_trinh_chi_tiets` qua Prisma interactive transaction (kết nối Supabase Cloud an toàn).
  - `GET /api/ai/draft/:id`: Lấy chi tiết bản nháp AI đã sinh.
- **Frontend Components & Pages:**
  - `aiService.js`: API client kết nối các endpoint AI của TripMate.
  - `TripPlannerPage.jsx` (`UI_17, UI_18`):
    - **UI_17 (Form tạo lịch trình):** Form nhập 6 thông tin bắt buộc, dropdown tỉnh thành tải từ CSDL, chọn nhanh các mức ngân sách phổ biến, bộ đếm số lượng người có nút tăng/giảm, các pills sở thích đa dạng kèm ô ghi chú chi tiết, nút kích hoạt Gemini AI với hiệu ứng Sparkles.
    - **Loading AI State:** Hiệu ứng animation AI sinh động kèm các thông báo bước xử lý xoay vòng.
    - **UI_18 (Màn hình kết quả theo ngày):** Banner thông tin tổng quan (tổng chi phí ước tính, ngân sách, số người, cảnh báo vượt ngân sách màu vàng/đỏ), thanh chuyển đổi Tabs từng ngày (Ngày 1, Ngày 2, Ngày 3...), danh sách chặng tham quan Sáng/Chiều/Tối chi tiết kèm ảnh đại diện, địa chỉ, thời gian, dự toán chi phí, nút "Tạo lại ngày này" độc lập, nút "Lập lại từ đầu" và nút "Lưu vào tài khoản" kèm modal thông báo thành công.
  - `App.jsx`: Đăng ký route chính thức `/trips/ai-create` và `/trips/create` dẫn đến `TripPlannerPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb08.js` đạt 100% (5/5 PASS) tất cả các tiêu chí: chặn khi thiếu 6 thông tin đầu vào (HTTP 400), sinh lịch trình AI 3 ngày 2 đêm, tạo lại 1 ngày cụ thể, lưu bản nháp vào lịch trình chính thức và bảo toàn toàn vẹn dữ liệu Snapshot CSDL.

### Added - Sprint 2 (PB07: Xem dự báo thời tiết - UI_06, UI_11)
- **Backend API (`/api/weather`):**
  - Tích hợp OpenWeatherMap API dự báo 5 ngày theo tọa độ (`vi_do`, `kinh_do`) hoặc tên tỉnh thành (`tinh_thanh_id`, `city`).
  - Phân tích và nhóm dữ liệu theo từng ngày với đầy đủ các chỉ số: Nhiệt độ hiện tại, nhiệt độ min/max, độ ẩm (%), tốc độ gió (km/h), mô tả thời tiết tiếng Việt và mã icon OpenWeather.
  - Bộ nhớ đệm Cache 30 phút (`Map` in-memory) tối ưu hóa hạn ngạch quota và tốc độ phản hồi (< 10ms cho các truy vấn lặp lại).
  - Tích hợp cơ chế fallback dữ liệu khí tượng dự phòng mô phỏng khi mất kết nối mạng hoặc lỗi dịch vụ ngoại vi.
- **Frontend Components & Pages:**
  - `weatherService.js`: API client lấy thông tin thời tiết.
  - `WeatherPage.jsx` (`UI_06, UI_11`):
    - Thẻ thời tiết hiện tại trực quan với gradient Teal sang trọng, hiển thị nhiệt độ lớn, độ ẩm, tốc độ gió, cảm giác thực tế và tầm nhìn.
    - Bộ chỉ thị **Gợi ý trang phục du lịch AI** thông minh tự động đưa ra lời khuyên chuẩn bị đồ đạc và hoạt động phù hợp (nắng nóng, se lạnh, mưa gió, lý tưởng).
    - Lưới 5 ngày dự báo tiếp theo với nhiệt độ, độ ẩm, sức gió và trạng thái thời tiết từng ngày.
    - Thanh chọn nhanh các địa danh du lịch nổi tiếng của Việt Nam (Đà Nẵng, Hà Nội, TP.HCM, Hội An, Huế, Nha Trang, Đà Lạt, Phú Quốc, Sa Pa...).
    - Trạng thái Shimmer Loading skeleton và giao diện báo lỗi kèm nút "Thử lại".
  - `App.jsx`: Đăng ký route chính thức `/weather` dẫn đến `WeatherPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb07.js` đạt 100% (4/4 PASS) các tiêu chí lấy dữ liệu 5 ngày, chỉ số khí tượng, cache 30 phút và gọi API HTTP.

### Added - Sprint 2 (PB06: Xem bản đồ và lộ trình - UI_07, UI_12)
- **Backend API (`/api/maps`):**
  - `POST /api/maps/optimize-route`: Tối ưu hóa thứ tự tham quan các địa điểm bằng thuật toán TSP (Traveling Salesperson Problem) Nearest Neighbor, tự động giới hạn tối đa 10 địa điểm/ngày theo quy chuẩn PB06.
  - `POST /api/maps/calculate-route`: Tính toán khoảng cách (km), thời gian di chuyển (phút) và chi tiết từng chặng (Legs) theo thứ tự người dùng kéo thả tùy chỉnh.
  - Tích hợp OSRM Routing API (`https://router.project-osrm.org`) lấy GeoJSON polyline thực tế bám theo đường bộ Việt Nam và cơ chế fallback Haversine an toàn.
- **Frontend Components & Pages:**
  - `mapService.js`: API client hỗ trợ gọi các endpoint tối ưu và tính toán lộ trình.
  - `MapRoutePage.jsx` (`UI_07, UI_12`): Bố cục chia đôi trực quan:
    - **Panel Trái:** Nhập điểm xuất phát (hỗ trợ các preset thông dụng: Sân bay, Ga tàu, Khách sạn), danh sách các điểm dừng tham quan kéo thả mượt mà bằng `@dnd-kit`, modal thêm địa điểm từ CSDL, nút bấm "Tự động tối ưu hóa (TSP)", tùy chọn quay về điểm xuất phát, thẻ tổng kết km/phút và danh sách các chặng.
    - **Panel Phải:** Bản đồ tương tác Leaflet (OpenStreetMap) với Marker đánh số thứ tự (1, 2, 3...) và marker ngôi sao cho điểm xuất phát, đường Polyline Teal `#0D9488`, tự động căn chỉnh khung nhìn (`fitBounds`) và popup thông tin chi tiết.
  - `App.jsx`: Đăng ký route chính thức `/map` dẫn đến `MapRoutePage`.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb06.js` đạt 100% (5/5 PASS) tất cả các tiêu chí khoảng cách Haversine, thuật toán TSP Nearest Neighbor, giới hạn tối đa 10 điểm và gọi API OSRM.

### Added - Sprint 2 (PB04: Quản lý danh sách yêu thích - UI_15)
- **Backend API (`/api/favorites`):**
  - `GET /api/favorites`: Phân trang 10 địa điểm/trang, chỉ lấy địa điểm đang ở trạng thái hiển thị (`hien_thi`), định dạng chuẩn kèm điểm đánh giá và tỉnh thành.
  - `GET /api/favorites/my-ids`: Trả về danh sách ID địa điểm người dùng đã thích để Frontend highlight biểu tượng trái tim đỏ nhanh chóng trên tất cả các trang.
  - `POST /api/favorites/:dia_diem_id`: Thêm địa điểm vào danh sách yêu thích với kiểm tra trạng thái địa điểm và chống trùng lặp.
  - `DELETE /api/favorites/:dia_diem_id`: Bỏ yêu thích địa điểm.
  - `POST /api/favorites/toggle/:dia_diem_id`: Chuyển đổi trạng thái thích/bỏ thích 1-click tiện lợi.
  - Xác thực phiên bằng JWT Token, từ chối khách vãng lai với HTTP 401.
- **Frontend Components & Pages:**
  - `favoriteService.js`: Bộ API service tương tác danh sách yêu thích đầy đủ CRUD & Toggle.
  - `DestinationCard.jsx`: Tự động đồng bộ hóa trạng thái yêu thích với hiệu ứng Optimistic UI, tự động chuyển hướng đăng nhập nếu chưa đăng nhập.
  - `FavoritesPage.jsx` (`UI_15`): Màn hình danh sách địa điểm yêu thích cá nhân, thanh tìm kiếm lọc nhanh, số lượng địa điểm đã lưu, Shimmer loading, empty state sinh động kèm nút "Khám phá địa điểm ngay".
  - `DestinationDetailPage.jsx` (`UI_05, UI_10`): Tích hợp nút thả tim đồng bộ trạng thái yêu thích từ CSDL.
  - `DestinationsPage.jsx` (`UI_04, UI_09`): Tự động nạp danh sách `favoriteIds` để đánh dấu tim đỏ cho các địa điểm đã lưu.
  - `App.jsx`: Đăng ký route chính thức `/favorites` dẫn đến `FavoritesPage`.
- **Kiểm thử tự động:**
  - Script kiểm thử CSDL `BE/tests/test_pb04.js` (5/5 PASS 100%) và kiểm thử HTTP Endpoints `BE/tests/test_pb04_api.js` (5/5 PASS 100%).

### Added - Sprint 2 (PB05: Trang chủ & Tìm kiếm/Lọc địa điểm - UI_03, UI_04, UI_05, UI_08, UI_09, UI_10)
- **Backend API (`/api/destinations`):**
  - Tìm kiếm tiếng Việt không dấu chuẩn xác sử dụng PostgreSQL extension `unaccent` (`ten_dia_diem`, `dia_chi`, `mo_ta_ngan`).
  - Lọc nhiều danh mục con đồng thời qua `danh_muc_ids` (hỗ trợ mảng hoặc chuỗi phân tách bằng dấu phẩy) hoặc theo nhóm danh mục `nhom_danh_muc_id`.
  - Phân trang 10 địa điểm/trang chuẩn giao diện và tính toán điểm đánh giá trung bình `diem_danh_gia_tb`.
  - API chi tiết địa điểm `GET /api/destinations/:id` trả về đầy đủ bộ sưu tập ảnh `dia_diem_hinh_anhs` và danh sách đánh giá `danh_gias` có thông tin người dùng đánh giá.
- **Frontend Components & Pages:**
  - `DestinationCard.jsx`: Hiển thị thẻ địa điểm du lịch với hiệu ứng zoom, huy hiệu tỉnh thành, tag danh mục, cờ nổi bật, điểm số sao, định dạng giá VND/Miễn phí và nút lưu yêu thích.
  - `DestinationSkeleton.jsx`: Hiệu ứng Shimmer Loading Skeleton mượt mà khi đang tải dữ liệu.
  - `DestinationsPage.jsx` (`UI_04, UI_09`): Bộ lọc sidebar gồm Tỉnh/Thành phố, checkbox đa danh mục, thanh tìm kiếm không dấu, dropdown sắp xếp (Mới nhất, Đánh giá, Tên A-Z, Giá), bộ phân trang 10/trang và nút đặt lại bộ lọc.
  - `DestinationDetailPage.jsx` (`UI_05, UI_10`): Breadcrumb dẫn đường, gallery ảnh có thumbnail preview, thông tin chi tiết (Giờ hoạt động, Giá vé, Địa chỉ, Tọa độ GPS), nút liên kết "Lên lịch trình với AI", liên kết bản đồ, danh sách đánh giá từ cộng đồng và địa điểm lân cận cùng tỉnh.
  - `HomePage.jsx` (`UI_03, UI_08`): Kết nối tìm kiếm trực tiếp, hiển thị 4 địa điểm nổi bật thực tế từ CSDL và danh mục khám phá.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb05.js` & `BE/tests/test_e2e_proxy_auth.js` đạt 100% tất cả các trường hợp tìm kiếm không dấu, lọc danh mục, phân trang và đăng nhập qua Vite proxy.

### Added - Sprint 1 (PB19: Admin Quản lý địa điểm du lịch - UI_27, UI_28)
- **Backend API (`/api/destinations` & `/api/admin/destinations`):**
  - `GET /api/destinations`: Phân trang chuẩn 10 địa điểm/trang, hỗ trợ tìm kiếm không dấu/có dấu, lọc theo tỉnh/thành, danh mục con, cờ nổi bật, và trạng thái hiển thị hoặc xóa mềm.
  - `GET /api/destinations/:id`: Chi tiết địa điểm kèm quan hệ tỉnh thành, danh mục và bộ sưu tập ảnh.
  - `POST /api/destinations`: Tạo mới địa điểm du lịch, validate bắt buộc tên & tỉnh/thành, gắn nhiều danh mục con trong một Transaction.
  - `PUT /api/destinations/:id`: Cập nhật địa điểm với cơ chế **Optimistic Locking**: so khớp `phien_ban`, trả về mã `HTTP 409 Conflict` nếu dữ liệu đã bị sửa đổi bởi người khác, tự động tăng phiên bản sau mỗi lần cập nhật thành công.
  - `PATCH /api/destinations/:id/toggle-featured`: Bật/tắt cờ nổi bật (`noi_bat`) nhanh chóng từ danh sách.
  - `DELETE /api/destinations/:id`: **Xóa mềm** (soft delete) bằng cách cập nhật `trang_thai = 'da_xoa'` nhằm bảo vệ toàn vẹn lịch trình của khách hàng.
  - `PATCH /api/destinations/:id/restore`: Khôi phục địa điểm đã xóa mềm trở lại trạng thái hiển thị (`hien_thi`).
  - `POST /api/destinations/upload`: Tải lên ảnh địa điểm qua Multer lên Supabase Storage CDN.
- **Frontend (`AdminDestinationsPage.jsx` - `UI_27, UI_28`):**
  - Bảng quản lý địa điểm phân trang 10 mục/trang (`UI_27`) kèm ảnh thumbnail, giá vé định dạng VND, badge trạng thái và huy hiệu phiên bản (`v1, v2...`).
  - Thanh công cụ tìm kiếm và lọc đa điều kiện: Từ khóa, Tỉnh/Thành phố, Danh mục con, Trạng thái (Hiển thị / Thùng rác).
  - Modal form Thêm / Sửa địa điểm toàn diện (`UI_28`): Chọn tỉnh thành, tick chọn nhiều danh mục, nhập tọa độ vĩ độ/kinh độ, tải ảnh lên hoặc dán link ảnh, mô tả ngắn và chi tiết.
  - Modal cảnh báo xung đột phiên bản Optimistic Locking với nút tải lại dữ liệu mới nhất.
  - Modal xác nhận xóa mềm an toàn và nút khôi phục tức thì.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb19.js` đạt 100% tất cả các tiêu chí phân trang, tạo mới, kiểm soát phiên bản Optimistic Locking, cờ nổi bật, xóa mềm và khôi phục.

### Added - Sprint 1 (PB15: Admin Quản lý danh mục địa điểm - UI_29, UI_30)
- **Backend API (`/api/categories` & `/api/admin/categories`):**
  - `GET /api/categories/tree`: Trả về cây danh mục 2 cấp (Nhóm cấp 1 -> Danh mục con cấp 2) kèm số lượng địa điểm du lịch thực tế liên kết với từng danh mục.
  - `POST /api/categories/groups`: Tạo nhóm danh mục mới với cơ chế chuẩn hóa và chống trùng tên không dấu tiếng Việt.
  - `PUT /api/categories/groups/:id`: Cập nhật thông tin nhóm danh mục.
  - `DELETE /api/categories/groups/:id`: Xóa nhóm danh mục với ràng buộc an toàn (chặn xóa nếu các danh mục con bên trong đang có địa điểm du lịch liên kết).
  - `POST /api/categories/items`: Tạo danh mục con với ràng buộc nghiêm ngặt: giới hạn tối đa 10 mục con/nhóm và chống trùng tên không dấu tiếng Việt.
  - `PUT /api/categories/items/:id`: Cập nhật danh mục con, kiểm tra chống trùng tên với các danh mục khác.
  - `DELETE /api/categories/items/:id`: Chặn xóa nếu danh mục đang được gắn vào bất kỳ địa điểm du lịch nào trong `dia_diem_danh_mucs`.
- **Frontend (`AdminCategoriesPage.jsx` - `UI_29, UI_30`):**
  - Bảng quản lý cây danh mục 2 cấp trực quan, hiển thị dạng Accordion mở rộng/thu gọn mượt mà.
  - Thanh tiến độ hiển thị dung lượng mục con trực quan (`X/10`) với cảnh báo màu khi nhóm sắp hoặc đã đầy 10 mục con.
  - Modal tạo mới và chỉnh sửa nhóm danh mục (`UI_30`).
  - Modal tạo mới và chỉnh sửa danh mục con (`UI_30`) với dropdown chọn nhóm cha.
  - Modal xác nhận xóa an toàn với cảnh báo chống mất mát dữ liệu liên kết.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb15.js` hoàn thành 100% các test case: chuẩn hóa tiếng Việt không dấu, cấu trúc cây 2 cấp, giới hạn 10 mục con, chặn trùng tên không dấu và ràng buộc xóa an toàn.

### Added - Sprint 1 (PB03: Quản lý hồ sơ cá nhân - UI_13, UI_14)
- **Backend API (`/api/users`):**
  - `GET /api/users/profile`: Trả về chi tiết tài khoản hiện tại kèm trạng thái và vai trò.
  - `PUT /api/users/profile`: Cập nhật họ tên và số điện thoại, kiểm tra ràng buộc 10 số bắt đầu bằng 0 và chống trùng SĐT.
  - `POST /api/users/avatar`: Tải lên ảnh đại diện qua Multer (giới hạn $\le$ 5MB), upload lên Supabase Storage CDN và fallback lưu đĩa cục bộ.
  - `PUT /api/users/change-password`: Đổi mật khẩu bảo mật, so khớp mật khẩu cũ qua bcrypt, kiểm tra độ mạnh mật khẩu mới ($\ge$ 8 ký tự, 1 hoa, 1 số, 1 ký tự đặc biệt).
- **Frontend (`ProfilePage.jsx` - `UI_13, UI_14`):**
  - Khắc phục triệt để lỗi nhân đôi thanh điều hướng (Navbar duplicate).
  - Thiết kế bố cục 2 cột chuẩn đồ án: Sidebar bên trái hiển thị ảnh đại diện bo tròn kèm nút camera đổi ảnh trực tiếp, tên, tên đăng nhập và badge vai trò.
  - Tab 1 (`UI_13`): Xem và chỉnh sửa họ tên, số điện thoại, tên đăng nhập & email cố định bảo vệ danh tính.
  - Tab 2 (`UI_14`): Đổi mật khẩu với nút bật/tắt ẩn hiện mật khẩu và 4 tiêu chí bảo mật trực quan.
  - Menu điều hướng nhanh đến danh sách chuyến đi và đăng xuất an toàn.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb03.js` đạt 100% các tiêu chí đọc hồ sơ, cập nhật thông tin và logic đổi mật khẩu.
- **Backend API (`POST /api/auth/login` & `GET /api/auth/me`):**
  - Xác thực người dùng bằng Tên đăng nhập hoặc Email cùng mật khẩu bảo mật `bcryptjs`.
  - Kiểm tra trạng thái tài khoản `bi_khoa`: lập tức chặn với mã HTTP 403 Forbidden và trả về lý do khóa chi tiết (`ly_do_khoa`).
  - Cung cấp JWT Token thời hạn 7 ngày chứa định danh `id` và phân quyền `vai_tro`.
  - Endpoint `GET /api/auth/me` xác thực thông tin phiên người dùng thông qua Bearer Token.
- **Frontend (`LoginPage.jsx` - `UI_02`):**
  - Thiết kế đồng bộ giao diện TripMate Teal `#0F766E` / `#0D9488`, bo góc mềm mại, đổ bóng cao cấp.
  - Hỗ trợ nhập Tên đăng nhập hoặc Email linh hoạt.
  - Nút chuyển đổi ẩn/hiện mật khẩu trực quan.
  - Xử lý thông báo lỗi đăng nhập và banner cảnh báo đặc biệt khi tài khoản bị khóa.
  - Phân quyền điều hướng tự động: Admin chuyển đến Bảng điều khiển Quản trị (`/admin`), Khách hàng chuyển về Trang chủ (`/`).
  - Tích hợp bảng nút bấm điền tự động tài khoản mẫu (Admin, Khách hàng, Tài khoản bị khóa) giúp kiểm thử nhanh chóng.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb02.js` đạt 100% các tiêu chí xác thực, chặn tài khoản khóa và phân quyền.
- **Backend API (`POST /api/auth/register`):**
  - Hash mật khẩu an toàn với bcrypt.
  - Chuẩn hóa và làm sạch dữ liệu đầu vào (`ten_dang_nhap`, `email`, `so_dien_thoai`).
  - Kiểm tra tiêu chuẩn mật khẩu an toàn: >= 8 ký tự, ít nhất 1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt.
  - Kiểm tra số điện thoại: đúng 10 chữ số và bắt đầu bằng số `0`.
  - Kiểm tra định dạng email chuẩn regex RFC.
  - Kiểm tra và ngăn chặn trùng lặp tài khoản (`ten_dang_nhap`, `email`, `so_dien_thoai`) trên CSDL Supabase PostgreSQL.
  - Trả về mã JWT hợp lệ và đối tượng thông tin người dùng.
- **Frontend (`RegisterPage.jsx` - `UI_01`):**
  - Giao diện đăng ký chuẩn phong cách nhận diện TripMate Teal (`#0F766E`), bo tròn 3xl, đổ bóng hiện đại.
  - Bộ tiêu chí mật khẩu trực quan (checkmarks xanh khi đạt từng tiêu chuẩn).
  - Nút chuyển đổi ẩn/hiện mật khẩu cho cả ô mật khẩu và xác nhận mật khẩu.
  - Báo lỗi realtime và banner cảnh báo lỗi chi tiết khi trùng lặp hoặc không hợp lệ.
  - Tích hợp `AuthContext.jsx` tự động đăng nhập và chuyển hướng mượt mà sau khi đăng ký thành công.
- **Kiểm thử tự động:**
  - Script kiểm thử `BE/tests/test_pb01.js` đạt 100% các ca kiểm thử validation, tạo tài khoản và chống trùng lặp.

---

## [0.1.0] - 2026-11-22 (Hoàn thành Giai đoạn 0: Khảo sát, Guardrails & Quản lý dự án)

### Added
- **Hệ thống Guardrails & Quy tắc dự án (AGENTS.md & .agent/rules/project-rules.md):**
  - Chốt Tech Stack chính thức: Node.js/Express + MySQL (XAMPP) + Prisma ORM + Socket.io + React Vite + TailwindCSS.
  - Định nghĩa chuẩn 22 bảng MySQL khớp `Nhom1_6.ProjectDatabase.docx` với collation `utf8mb4_unicode_ci` và múi giờ `Asia/Ho_Chi_Minh` (UTC+7).
  - Chuẩn hóa cấu trúc API Response thống nhất `{ success, message, data, errors }`.
  - Quy định chặt chẽ chính sách Anti-Scope-Creep và danh sách điều cấm.
- **Kế hoạch chuyển đổi Module (docs/MIGRATION_PLAN.md):**
  - Bảng ánh xạ chi tiết toàn bộ service từ `AI-TripPlanner/` (READ-ONLY) sang `BE/src/services/` (Gemini AI, Leaflet + OSRM routing TSP, OpenWeatherMap, Socket.io, security middleware).
  - Kế hoạch chuyển đổi mô hình dữ liệu NoSQL (MongoDB) sang RDBMS (MySQL 22 bảng).
- **Hợp đồng API chi tiết (docs/API_CONTRACT.md):**
  - Đặc tả REST API endpoints và Socket.io events cho toàn bộ 20 mục chức năng (`PB01–PB20`).
  - Định nghĩa rõ HTTP method, URL, quyền hạn (`Public`, `khach_hang`, `admin`), request body, response JSON và mã trạng thái HTTP.
- **Hệ thống thiết kế giao diện (docs/UI_DESIGN_SYSTEM.md):**
  - Bảng màu nhận diện TripMate: Teal `#0F766E` / `#0D9488`, Amber `#F59E0B`, Danger `#DC2626`, Nền `#F8FAFC`.
  - Quy chuẩn component dùng chung: Button, Card `rounded-2xl`, Modal bo góc lớn, Pagination 10 dòng/trang, Badge.
  - Ánh xạ chi tiết toàn bộ 39 màn hình (`UI_01–UI_39`) sang React Router và Layout tương ứng.
- **Kế hoạch dự án & Phân rã công việc (docs/PROJECT_PLAN.md):**
  - Kế hoạch 3 Sprint bám sát Bảng 5 Product Backlog từ 23/10/2026 đến 11/12/2026.
  - Phân công nhiệm vụ FE/BE/DB/Test cho 5 thành viên (Hòa - Scrum Master, Thúy An, Hoài An, Huy, Tần).
- **Bảng theo dõi tiến độ chức năng (docs/TASK_BOARD.md):**
  - Bảng ma trận theo dõi tiến độ từng mã PB (`PB01–PB20`) và giai đoạn dự án.
- **Bản ghi quyết định kiến trúc (docs/DECISION_LOG.md):**
  - ADR-01: Chuyển BE sang Node.js/Express + MySQL + Prisma + Socket.io.
  - ADR-02: Cơ chế Xóa mềm (`trang_thai = 'da_xoa'`) cho địa điểm du lịch (`PB19`) bảo toàn snapshot trong lịch trình.
  - ADR-03: Bổ sung nút "Tạo cẩm nang" và "Tạo nhóm chat / Thêm thành viên" phục vụ test E2E (`PB11`, `PB12`).
  - ADR-04: Chuẩn hóa tên bảng `ban_nhap_ais`.
  - ADR-05: Chính sách nghiêm ngặt chống tự bịa tính năng.
- **Quy trình đóng góp nhóm (CONTRIBUTING.md):**
  - Chiến lược phân nhánh Git (`main`, `dev`, `feat/PBxx-...`), quy ước Conventional Commits, PR Checklist.
- **Mẫu biến môi trường (BE/.env.example & FE/.env.example):**
  - Cấu hình cổng, kết nối MySQL, Prisma URL, JWT secret, Gemini AI API, OpenWeatherMap, OSRM URL, Client URL.
- **Hướng dẫn cài đặt toàn diện (README.md):**
  - Các bước thiết lập trên môi trường Windows PowerShell, bật MySQL XAMPP, cài đặt dependency và tài khoản mẫu.

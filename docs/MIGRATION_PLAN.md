# KẾ HOẠCH TÁI SỬ DỤNG VÀ CHUYỂN ĐỔI MODULE (MIGRATION PLAN)

Tài liệu này xác định chi tiết các thành phần logic/công nghệ từ `AI-TripPlanner/` (READ-ONLY) được tái sử dụng, chuẩn hóa và chuyển đổi sang dự án đích `LapKeHoachDuLichCaNhanHoa/`.

---

## 1. NGUYÊN TẮC CHUYỂN ĐỔI
1. Thư mục `AI-TripPlanner/` là **tài sản tham khảo chỉ đọc**, không can thiệp.
2. Chuyển đổi toàn diện cơ chế lưu trữ từ **MongoDB (Mongoose NoSQL)** sang **MySQL 8.x (Prisma ORM quan hệ - 22 bảng chuẩn)**.
3. Chuyển đổi mã nguồn từ phong cách CommonJS (`require`) sang **ES Modules (`import/export`)** theo chuẩn `BE/` hiện tại.
4. Giao diện Frontend chuyển từ phong cách cũ của AI-TripPlanner sang **chuẩn thiết kế TripMate (Teal `#0F766E` / `#0D9488`, bo góc lớn `rounded-2xl`, 39 màn hình `UI_01–UI_39`)**.

---

## 2. BẢNG ÁNH XẠ MODULE TỪ AI-TRIPPLANNER SANG DỰ ÁN ĐÍCH

| Nguồn trong `AI-TripPlanner/` | Đích trong `LapKeHoachDuLichCaNhanHoa/` | Mục đích & Chi tiết chuyển đổi |
| :--- | :--- | :--- |
| **`server/services/freeMapService.js`** | `BE/src/services/mapService.js` | Tái sử dụng: <br>• Hàm tính khoảng cách Haversine giữa 2 tọa độ (`calculateDistance`).<br>• Tích hợp OSRM Routing (`https://router.project-osrm.org/route/v1/driving/`) lấy lộ trình polyline, khoảng cách và thời gian.<br>• Thuật toán TSP Nearest Neighbor để tối ưu hóa thứ tự tham quan các điểm (tối đa 10 điểm theo `PB06`).<br>• Chuyển sang ES Module, bổ sung fallback khi OSRM quá tải. |
| **`server/controllers/aiController.js`** | `BE/src/services/aiService.js`<br>`BE/src/controllers/aiController.js` | Tái sử dụng: <br>• Tích hợp Google Gemini AI (`@google/generative-ai` hoặc `@google/genai`).<br>• Kỹ thuật System Instruction & Response Schema để ép Gemini trả về Structured JSON hợp lệ.<br>**Cải tiến bắt buộc theo PB08:**<br>• Truy vấn danh sách địa điểm hợp lệ trong bảng `dia_diems` của tỉnh/thành phố được chọn đưa vào prompt context.<br>• Ép AI chỉ sắp xếp các địa điểm có thật trong DB.<br>• Kiểm tra đủ số ngày tham quan và tính toán tổng chi phí ước tính so với `ngan_sach_du_kien` (báo cảnh báo vượt ngân sách).<br>• Lưu trữ trạng thái tạm thời vào bảng `ban_nhap_ais`. |
| **`server/controllers/mapsController.js`** | `BE/src/controllers/mapController.js` | Tái sử dụng API định tuyến đường đi, tính toán khoảng cách tổng và thời gian di chuyển giữa các điểm mốc. |
| **`server/middleware/security.js`** | `BE/src/middleware/security.js` | Tái sử dụng cấu hình bảo mật Express: `helmet()`, `cors()`, `express-rate-limit` chống DDoS (100 req/15 phút cho API chung, 5 req/15 phút cho tạo AI). |
| **`server/middleware/auth.js`** | `BE/src/middleware/authMiddleware.js` | Tái sử dụng cơ chế xác thực JWT qua header `Authorization: Bearer <token>`, giải mã payload và kiểm tra phân quyền `khach_hang` / `admin` dựa trên bảng `tai_khoans`. |
| **`server/server.js` (Socket.io)** | `BE/src/sockets/socketHandler.js` | Tái sử dụng kết nối `socket.io`: quản lý phòng chat nhóm (`join-room`, `send-message`, `receive-message` cho PB12) và phát thông báo (`notification` cho PB13). |
| **`client/src/services/api.js`** | `FE/src/services/api.js` | Tái sử dụng cấu hình Axios instance: thiết lập `baseURL`, timeout 120s cho AI generation, request interceptor tự động gán Bearer Token, response interceptor xử lý mã lỗi `401 Unauthorized`. |
| **OpenWeatherMap Integration** | `BE/src/services/weatherService.js` | Xây dựng service gọi API OpenWeatherMap (`https://api.openweathermap.org/data/2.5/forecast`), parse dự báo thời tiết theo tọa độ tỉnh thành hoặc địa điểm, hỗ trợ cache 30 phút để giảm tải quota. |

---

## 3. KẾ HOẠCH CHUYỂN ĐỔI DATABASE TỪ MONGODB SANG MYSQL (PRISMA ORM)

| MongoDB Collection (AI-TripPlanner) | Bảng MySQL tương ứng (TripMate) | Điểm khác biệt cốt lõi |
| :--- | :--- | :--- |
| `users` (schema tự do, nhúng địa chỉ) | `tai_khoans` | Chuẩn hóa quan hệ chặt chẽ: `id` (BIGINT PK), `vai_tro` ('khach_hang', 'admin'), `trang_thai` ('hoat_dong', 'bi_khoa'), `ly_do_khoa`, `thoi_gian_khoa`. |
| `trips` (nhúng mảng `itinerary.days[].places[]`) | `lich_trinhs`<br>`lich_trinh_ngays`<br>`lich_trinh_chi_tiets` | Tách chuẩn 3NF: Bảng lịch trình cha -> Bảng các ngày du lịch -> Bảng chi tiết từng chặng với khóa ngoại tới `dia_diems` và lưu snapshot thông tin địa điểm phòng khi xóa mềm. |
| Không có danh mục cố định | `nhom_danh_mucs`<br>`danh_mucs`<br>`dia_diem_danh_mucs` | Cấu trúc phân cấp 2 cấp nghiêm ngặt (Nhóm danh mục -> Danh mục con tối đa 10 mục con/nhóm) và bảng nối N-N với địa điểm. |
| Tỉnh thành dạng text tự do | `tinh_thanh_phos` | Danh mục chuẩn tỉnh/thành phố Việt Nam để ràng buộc tính toàn vẹn dữ liệu cho tìm kiếm, lọc và tạo lịch trình. |
| Không có cẩm nang quan hệ | `cam_nangs`<br>`cam_nang_hinh_anhs`<br>`cam_nang_anh_lien_kets`<br>`chia_se_cam_nangs`<br>`binh_luan_cam_nangs` | Xử lý quan hệ chia sẻ, bình luận và cơ chế bảo toàn ảnh dùng chung khi xóa cẩm nang (PB14). |
| Chat nhúng | `nhom_tro_chuyens`<br>`thanh_vien_nhoms`<br>`tin_nhans` | Quản lý phòng chat nhóm, thành viên nhóm và tin nhắn phân quyền nghiêm ngặt theo tài khoản khách hàng. |
| Không có thông báo riêng | `thong_baos` | Bảng lưu thông báo cá nhân, cờ `da_doc`, liên kết điều hướng và phân loại thông báo. |
| AI tạm thời không lưu DB | `ban_nhap_ais` | Lưu bản nháp AI kết quả và thông tin đầu vào JSON, bảo đảm không ghi đè lịch trình cũ cho đến khi người dùng nhấn Lưu. |

---

## 4. CHIẾN LƯỢC BẢO ĐẢM TƯƠNG THÍCH VÀ TEST CHUYỂN ĐỔI
1. **Kiểm thử đơn vị từng Service:** Viết các kịch bản test cho `mapService` và `aiService` độc lập trước khi gắn Controller.
2. **Mocking External APIs khi cần:** Hỗ trợ dữ liệu giả lập cho Gemini và Weather trong trường hợp mạng gián đoạn hoặc API key chạm hạn mức.
3. **Log & Giám sát:** Tích hợp `morgan` và format logging rõ ràng với mã PB tương ứng.

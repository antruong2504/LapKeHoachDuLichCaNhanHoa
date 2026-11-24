# TRIPMATE - PROJECT GUARDRAILS & ARCHITECTURAL GUIDELINES (AGENTS.md)

Tài liệu này là **nguồn quy tắc tối cao cho mọi AI Agent và lập trình viên** tham gia phát triển dự án **"Nghiên cứu và phát triển nền tảng lập kế hoạch du lịch cá nhân hóa ứng dụng AI" (TripMate)** — Nhóm 1.

---

## 1. THÔNG TIN CHUNG DỰ ÁN
- **Tên dự án:** TripMate (Lập kế hoạch du lịch cá nhân hóa ứng dụng AI)
- **Đơn vị phát triển:** Ban phát triển dự án TripMate
- **Liên hệ hỗ trợ:** support@tripmate.vn (Hotline: 1900 6868)
- **Cơ cấu đội ngũ kỹ thuật:**
  1. Backend & Database Lead
  2. Frontend Lead & UI/UX
  3. AI & Map Routing Engineer
  4. Realtime Chat & Community Engineer
  5. QA & Testing Lead
- **Thời gian thực hiện:** 3 Sprint hoàn thiện hệ thống

---

## 2. NGUYÊN TẮC BẤT KHẢ XÂM PHẠM (CRITICAL GUARDRAILS)
1. **Thư mục `AI-TripPlanner/` là CHỈ ĐỌC (READ-ONLY):**
   - Tuyệt đối KHÔNG sửa đổi, di chuyển hoặc xóa bất kỳ file/thư mục nào trong `AI-TripPlanner/`.
   - Chỉ tham khảo logic thuật toán (Gemini AI, Leaflet + OSRM, OpenWeatherMap, security middlewares).
2. **Tuân thủ nguồn sự thật (Single Source of Truth):**
   - `Nhom1_4.Product-Backlog.docx`: Quy tắc nghiệp vụ, tiêu chí chấp nhận cho 20 mục `PB01–PB20`, 3 Sprint.
   - `Nhom1_5.ProjectUserInterface.docx`: 39 màn hình `UI_01–UI_39`, màu xanh ngọc / teal `#0F766E` / `#0D9488`, nhãn nút, thông báo tiếng Việt.
   - `Nhom1_6.ProjectDatabase.docx`: Chuẩn 22 bảng MySQL, tên bảng & tên cột tiếng Việt `snake_case`.
3. **Quy tắc chống tự bịa tính năng (ANTI-SCOPE-CREEP):**
   - KHÔNG thêm quản lý chi tiêu thực tế / chia tiền nhóm.
   - KHÔNG thêm cổng thanh toán / VietQR.
   - KHÔNG thêm đặt phòng khách sạn, vé xe, đặt tour.
   - KHÔNG thêm lọc theo giá ở PB05.
   - KHÔNG thêm chức năng "Quên mật khẩu" hay "Ghi nhớ đăng nhập" ở PB02.
   - KHÔNG thêm tìm kiếm / lọc / phân trang cho danh sách lịch trình cá nhân ở PB09 (chỉ hiển thị toàn bộ lịch trình của người dùng).
4. **Quy chuẩn thông báo lỗi & Validation:**
   - Mật khẩu: tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt (`/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`).
   - Số điện thoại: 10 chữ số, bắt đầu bằng số `0` (`/^0\d{9}$/`).
   - Phân trang: cố định 10 bản ghi / trang cho tất cả danh sách có phân trang.
   - Hành động Admin (Khóa tài khoản PB16, Xóa cẩm nang PB14, Xóa đánh giá PB17): **Bắt buộc nhập lý do**, lưu lý do và gửi thông báo UTC+7 tới người dùng bị ảnh hưởng.
   - Xóa địa điểm du lịch (PB19): Sử dụng **Xóa mềm (Soft Delete)** qua cờ `trang_thai = 'da_xoa'`.

---

## 3. TECH STACK CHÍNH THỨC
### Backend (`LapKeHoachDuLichCaNhanHoa/BE/`):
- **Runtime:** Node.js (v20+ LTS / v22 LTS), ES Modules (`"type": "module"`).
- **Framework:** Express.js (`express`), `cors`, `helmet`, `morgan`, `compression`.
- **Database & ORM:** MySQL 8.x / MariaDB (XAMPP) + **Prisma ORM** (`prisma`, `@prisma/client`).
- **Collation:** `utf8mb4_unicode_ci` (tìm kiếm tiếng Việt không phân biệt hoa/thường, không phân biệt dấu).
- **Timezone:** `Asia/Ho_Chi_Minh` (UTC+7) cho hiển thị thời gian, log thông báo, và thống kê báo cáo.
- **Authentication & Security:** JWT (`jsonwebtoken`), hash mật khẩu (`bcryptjs` với salt rounds = 10), rate limiting (`express-rate-limit`), input validation (`express-validator`).
- **File Upload:** `multer` (kiểm tra MIME type `image/jpeg`, `image/png`, `image/webp`, giới hạn <= 5MB).
- **Realtime Server:** `socket.io` tích hợp HTTP Server cho PB12 (Nhóm trò chuyện) và PB13 (Thông báo real-time).

### Frontend (`LapKeHoachDuLichCaNhanHoa/FE/`):
- **Framework & Bundler:** React 19 / 18 + Vite.
- **Styling:** TailwindCSS v4 / v3, icon từ `lucide-react`.
- **Routing:** `react-router-dom` v6.
- **State & HTTP:** React Context API (`AuthContext`, `SocketContext`), `axios` kèm Interceptor.
- **Bản đồ & Tương tác:** `leaflet`, `react-leaflet`, `@dnd-kit/core`, `@dnd-kit/sortable` (kéo thả đổi thứ tự lộ trình).
- **Biểu đồ Admin (PB18):** `recharts`.
- **Realtime Client:** `socket.io-client`.

### Dịch vụ bên ngoài (External Services):
- **AI Service (PB08):** Google Gemini API (`@google/generative-ai`), bắt buộc ép JSON Schema output, chọn địa điểm từ danh sách có sẵn trong DB theo tỉnh/thành phố, cảnh báo vượt ngân sách.
- **Bản đồ & Định tuyến (PB06):** Leaflet + OpenStreetMap tile + OSRM Public Routing API (`https://router.project-osrm.org`), tối đa 10 địa điểm, điểm xuất phát nhập tay không dùng GPS, thuật toán TSP tối ưu quãng đường ngắn nhất.
- **Thời tiết (PB07):** OpenWeatherMap 5-day / current forecast API (`https://api.openweathermap.org/data/2.5/`), hiển thị nhiệt độ, icon, trạng thái và nút "Thử lại" khi mất kết nối.

---

## 4. CHUẨN ĐẶC TẢ DATABASE: 22 BẢNG MYSQL
Tất cả bảng và cột sử dụng tên tiếng Việt `snake_case`, khóa chính kiểu `BIGINT AUTO_INCREMENT` (hoặc composite PK cho bảng liên kết):

1. `tai_khoans` (id, ten_dang_nhap, mat_khau_hash, ho_ten, email, so_dien_thoai, vai_tro ['khach_hang', 'admin'], anh_dai_dien, trang_thai ['hoat_dong', 'bi_khoa'], ly_do_khoa, thoi_gian_khoa, created_at, updated_at)
2. `tinh_thanh_phos` (id, ten_tinh_thanh, ma_tinh_thanh, created_at)
3. `nhom_danh_mucs` (id, ten_nhom, mo_ta, created_at)
4. `danh_mucs` (id, nhom_danh_muc_id [FK], ten_danh_muc, mo_ta, created_at)
5. `dia_diems` (id, tinh_thanh_id [FK], ten_dia_diem, mo_ta_ngan, mo_ta_chi_tiet, dia_chi, vi_do, kinh_do, gia_ve, noi_bat [0/1], trang_thai ['hoat_dong', 'da_xoa'], phien_ban [INT default 1 - Optimistic Locking], created_at, updated_at)
6. `dia_diem_danh_mucs` (dia_diem_id [FK], danh_muc_id [FK]) -> Composite PK
7. `dia_diem_hinh_anhs` (id, dia_diem_id [FK], duong_dan, thu_tu, created_at)
8. `dia_diem_yeu_thichs` (id, tai_khoan_id [FK], dia_diem_id [FK], created_at) -> UNIQUE(tai_khoan_id, dia_diem_id)
9. `lich_trinhs` (id, tai_khoan_id [FK], tinh_thanh_id [FK], ten_lich_trinh, nguon_tao ['ai', 'thu_cong'], ngay_bat_dau, ngay_ket_thuc, ngan_sach_du_kien, so_luong_nguoi, so_thich, phien_ban [INT default 1], created_at, updated_at)
10. `lich_trinh_ngays` (id, lich_trinh_id [FK], ngay_tham_quan, thu_tu_ngay, ghi_chu, created_at) -> UNIQUE(lich_trinh_id, thu_tu_ngay)
11. `lich_trinh_chi_tiets` (id, lich_trinh_ngay_id [FK], dia_diem_id [FK nullable], thu_tu, buoi ['sang', 'chieu', 'toi'], ghi_chu, ten_dia_diem_snapshot, dia_chi_snapshot, vi_do_snapshot, kinh_do_snapshot, created_at)
12. `ban_nhap_ais` (id, tai_khoan_id [FK], lich_trinh_goc_id [FK nullable], du_lieu_dau_vao [JSON], noi_dung_ket_qua [JSON], trang_thai ['dang_xu_ly', 'thanh_cong', 'that_bai'], created_at, updated_at)
13. `cam_nangs` (id, tac_gia_id [FK], tieu_de, mo_ta_ngan, noi_dung [LONGTEXT], anh_dai_dien, tinh_thanh_id [FK nullable], created_at, updated_at)
14. `cam_nang_hinh_anhs` (id, duong_dan, created_at)
15. `cam_nang_anh_lien_kets` (cam_nang_id [FK], hinh_anh_id [FK]) -> Composite PK
16. `chia_se_cam_nangs` (id, cam_nang_id [FK], tai_khoan_id [FK], kenh_chia_se, created_at)
17. `binh_luan_cam_nangs` (id, cam_nang_id [FK], tai_khoan_id [FK], noi_dung, created_at)
18. `danh_gias` (id, tai_khoan_id [FK], dia_diem_id [FK nullable], cam_nang_id [FK nullable], so_sao [1-5], noi_dung, created_at, updated_at)
19. `nhom_tro_chuyens` (id, ten_nhom, nguoi_tao_id [FK], lich_trinh_id [FK nullable], created_at, updated_at)
20. `thanh_vien_nhoms` (nhom_id [FK], tai_khoan_id [FK], vai_tro_nhom ['truong_nhom', 'thanh_vien'], ngay_tham_gia) -> Composite PK
21. `tin_nhans` (id, nhom_id [FK], nguoi_gui_id [FK], noi_dung, loai_tin_nhan ['van_ban', 'he_thong'], created_at)
22. `thong_baos` (id, tai_khoan_id [FK], tieu_de, noi_dung, loai_thong_bao, lien_ket, da_doc [0/1], created_at)

---

## 5. FORMAT API RESPONSE CHUẨN
Tất cả endpoint HTTP trả về JSON bám theo cấu trúc 4 trường:
```json
{
  "success": true,
  "message": "Thông báo trạng thái dễ đọc tiếng Việt",
  "data": {},
  "errors": null
}
```
Khi lỗi (`success: false`):
```json
{
  "success": false,
  "message": "Mật khẩu hiện tại không chính xác",
  "data": null,
  "errors": [
    { "field": "mat_khau_cu", "message": "Mật khẩu hiện tại không chính xác" }
  ]
}
```

---

## 6. QUY TRÌNH LÀM VIỆC THEO GIAI ĐOẠN (STRICT PHASE GATES)
Sau mỗi giai đoạn hoặc chức năng hoàn thành, AI Agent bắt buộc phải:
1. Đánh dấu `[x]` hoặc `✅ HOÀN THÀNH` ngay trong `TIEN_DO_DU_AN.md`.
2. Ghi nhận cập nhật vào `CHANGELOG.md` và `docs/TASK_BOARD.md`.
3. Kiểm tra code không có lỗi build/syntax.
4. Dừng lại, tổng kết và chờ người dùng duyệt lệnh kiểm tra trên Windows PowerShell trước khi sang giai đoạn tiếp theo.

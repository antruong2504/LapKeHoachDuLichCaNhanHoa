# HỢP ĐỒNG GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API CONTRACT)

Tài liệu đặc tả toàn bộ REST API endpoints và Socket.io events cho 20 mục chức năng (`PB01–PB20`) của dự án **TripMate**. Đảm bảo khớp 100% giữa Frontend và Backend.

---

## 1. QUY CHUẨN CHUNG
- **Base URL:** `/api`
- **Múi giờ dữ liệu:** `Asia/Ho_Chi_Minh` (UTC+7)
- **Định dạng dữ liệu:** `application/json` (trừ upload file dùng `multipart/form-data`)
- **Định dạng chuẩn của API Response:**
```json
{
  "success": true,
  "message": "Thông báo trạng thái bằng tiếng Việt",
  "data": null,
  "errors": null
}
```
- **Xác thực (Authentication):** Gửi qua Header `Authorization: Bearer <access_token>`.
- **Phân quyền người dùng (Role):**
  - `Public`: Khách vãng lai và mọi người dùng.
  - `khach_hang`: Người dùng có tài khoản đã đăng nhập.
  - `admin`: Quản trị viên hệ thống.

---

## 2. NHÓM XÁC THỰC VÀ HỒ SƠ CÁ NHÂN (PB01, PB02, PB03)

### `POST /api/auth/register` — PB01: Đăng ký tài khoản
- **Quyền:** `Public`
- **Request Body:**
  ```json
  {
    "ten_dang_nhap": "customer",
    "ho_ten": "Nguyễn Văn An",
    "email": "customer@tripmate.vn",
    "so_dien_thoai": "0912345678",
    "mat_khau": "Password@123",
    "xac_nhan_mat_khau": "Password@123"
  }
  ```
- **Validation:** 
  - `mat_khau`: >= 8 ký tự, ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt.
  - `so_dien_thoai`: 10 chữ số, bắt đầu bằng `0`.
  - `ten_dang_nhap`, `email`: không được trùng lặp trong hệ thống.
- **Response Success (201):**
  ```json
  {
    "success": true,
    "message": "Đăng ký tài khoản thành công",
    "data": { "id": 1, "ten_dang_nhap": "customer", "email": "customer@tripmate.vn" }
  }
  ```

### `POST /api/auth/login` — PB02: Đăng nhập hệ thống
- **Quyền:** `Public`
- **Request Body:**
  ```json
  {
    "ten_dang_nhap": "customer",
    "mat_khau": "Password@123"
  }
  ```
- **Xử lý khóa:** Nếu `trang_thai == 'bi_khoa'`, trả về HTTP 403 kèm lý do khóa.
- **Response Success (200):**
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "token": "jwt_token_string",
      "user": {
        "id": 1,
        "ten_dang_nhap": "customer",
        "ho_ten": "Nguyễn Văn An",
        "email": "customer@tripmate.vn",
        "vai_tro": "khach_hang",
        "anh_dai_dien": "/uploads/avatars/default.png"
      }
    }
  }
  ```

### `GET /api/auth/me` — PB02: Kiểm tra phiên đăng nhập
- **Quyền:** `khach_hang`, `admin`
- **Response Success (200):** Trả về thông tin user hiện tại.

### `GET /api/users/profile` — PB03: Xem hồ sơ cá nhân
- **Quyền:** `khach_hang`, `admin`
- **Response Success (200):** Trả về chi tiết tài khoản (họ tên, email, SĐT, ảnh đại diện, vai trò, ngày tham gia).

### `PUT /api/users/profile` — PB03: Cập nhật thông tin hồ sơ
- **Quyền:** `khach_hang`, `admin`
- **Request Body:** `{ "ho_ten": "Nguyễn Văn An", "so_dien_thoai": "0912345678" }`
- **Response Success (200):** Thông báo cập nhật thành công.

### `POST /api/users/avatar` — PB03: Tải lên ảnh đại diện
- **Quyền:** `khach_hang`, `admin`
- **Request:** `multipart/form-data` (trường `avatar`, file ảnh <= 5MB JPG/PNG/WEBP).
- **Response Success (200):** `{ "success": true, "message": "Cập nhật ảnh đại diện thành công", "data": { "anh_dai_dien": "/uploads/avatars/avatar-123.jpg" } }`

### `PUT /api/users/change-password` — PB03: Đổi mật khẩu
- **Quyền:** `khach_hang`, `admin`
- **Request Body:**
  ```json
  {
    "mat_khau_cu": "Password@123",
    "mat_khau_moi": "Password@456",
    "xac_nhan_mat_khau_moi": "Password@456"
  }
  ```
- **Response Success (200):** Thông báo đổi mật khẩu thành công.

---

## 3. NHÓM ĐỊA ĐIỂM, DANH MỤC, YÊU THÍCH (PB04, PB05, PB15, PB19)

### `GET /api/destinations` — PB05: Tra cứu & Tìm kiếm địa điểm
- **Quyền:** `Public`
- **Query Params:**
  - `keyword`: Tìm kiếm không dấu theo tên địa điểm hoặc địa chỉ.
  - `tinh_thanh_id`: Lọc theo tỉnh/thành phố.
  - `danh_muc_ids`: Danh sách ID danh mục loại hình du lịch (phân cách bằng dấu phẩy, ví dụ `1,2,5`).
  - `noi_bat`: Lọc địa điểm nổi bật (`1` hoặc `true`).
  - `page`: Trang hiện tại (mặc định `1`).
  - `limit`: Số lượng bản ghi (cố định `10`).
- **Response Success (200):** Danh sách địa điểm hoạt động kèm tổng số bản ghi và thông tin phân trang.

### `GET /api/destinations/:id` — PB05: Chi tiết địa điểm
- **Quyền:** `Public`
- **Response Success (200):** Chi tiết địa điểm, bộ sưu tập ảnh, danh mục, tọa độ, điểm đánh giá trung bình.

### `GET /api/provinces` — PB05: Danh sách tỉnh / thành phố
- **Quyền:** `Public`
- **Response Success (200):** Trả về danh sách tỉnh/thành phố phục vụ dropdown.

### `GET /api/categories/tree` — PB05, PB15: Danh mục 2 cấp
- **Quyền:** `Public`
- **Response Success (200):** Danh sách nhóm danh mục kèm các danh mục con trực thuộc.

### `GET /api/favorites` — PB04: Xem danh sách yêu thích của tôi
- **Quyền:** `khach_hang`
- **Response Success (200):** Danh sách các địa điểm người dùng đã thả tim.

### `POST /api/favorites/:dia_diem_id` — PB04: Thêm vào yêu thích
- **Quyền:** `khach_hang`
- **Response Success (201):** Thêm thành công.

### `DELETE /api/favorites/:dia_diem_id` — PB04: Xóa khỏi yêu thích
- **Quyền:** `khach_hang`
- **Response Success (200):** Xóa thành công.

### `POST /api/admin/destinations` — PB19: Admin thêm địa điểm
- **Quyền:** `admin`
- **Request:** `multipart/form-data` hoặc JSON kèm URL ảnh, danh mục liên kết, tọa độ `vi_do`, `kinh_do`, giá vé.
- **Response Success (201):** Tạo địa điểm thành công.

### `PUT /api/admin/destinations/:id` — PB19: Admin sửa địa điểm
- **Quyền:** `admin`
- **Request Body:** Thông tin cập nhật kèm trường `phien_ban` phục vụ Optimistic Locking.
- **Response Success (200):** Cập nhật thành công.

### `DELETE /api/admin/destinations/:id` — PB19: Admin xóa mềm địa điểm
- **Quyền:** `admin`
- **Xử lý:** Cập nhật `trang_thai = 'da_xoa'`.
- **Response Success (200):** `{ "success": true, "message": "Xóa địa điểm du lịch thành công" }`

### `POST /api/admin/categories/groups` — PB15: Admin tạo nhóm danh mục
- **Quyền:** `admin`
- **Validation:** Chống trùng tên nhóm không dấu.

### `POST /api/admin/categories` — PB15: Admin tạo danh mục con
- **Quyền:** `admin`
- **Validation:** Tối đa 10 danh mục con cho một nhóm, chống trùng tên không dấu trong cấp danh mục con.

---

## 4. NHÓM BẢN ĐỒ & THỜI TIẾT (PB06, PB07)

### `POST /api/maps/optimize-route` — PB06: Tối ưu lộ trình ngắn nhất
- **Quyền:** `Public`
- **Request Body:**
  ```json
  {
    "diem_xuat_phat": { "ten": "Khách sạn Sông Hàn", "vi_do": 16.0718, "kinh_do": 108.2231 },
    "danh_sach_dia_diem": [
      { "id": 1, "ten": "Bà Nà Hills", "vi_do": 15.9988, "kinh_do": 107.9961 },
      { "id": 2, "ten": "Bán đảo Sơn Trà", "vi_do": 16.1132, "kinh_do": 108.2772 }
    ],
    "quay_ve_diem_xuat_phat": false
  }
  ```
- **Ràng buộc:** Tối đa 10 địa điểm.
- **Response Success (200):**
  ```json
  {
    "success": true,
    "message": "Tối ưu lộ trình thành công",
    "data": {
      "lo_trinh": [ ... ],
      "tong_quang_duong_km": 42.5,
      "tong_thoi_gian_phut": 65,
      "polyline": "encoded_or_geojson_coordinates"
    }
  }
  ```

### `GET /api/weather` — PB07: Dự báo thời tiết
- **Quyền:** `Public`
- **Query Params:** `tinh_thanh_id` hoặc `vi_do`, `kinh_do`.
- **Response Success (200):**
  ```json
  {
    "success": true,
    "message": "Lấy thông tin thời tiết thành công",
    "data": {
      "dia_diem": "Đà Nẵng",
      "hien_tai": { "nhiet_do": 28, "trang_thai": "Nhiều mây", "do_am": 75, "icon": "04d" },
      "du_bao_5_ngay": [ ... ]
    }
  }
  ```

---

## 5. NHÓM LẬP KẾ HOẠCH DU LỊCH BẰNG AI & THỦ CÔNG (PB08, PB09, PB20)

### `POST /api/ai/generate-itinerary` — PB08: Tạo lịch trình bằng Gemini AI
- **Quyền:** `khach_hang`
- **Request Body (Đủ 6 thông tin bắt buộc):**
  ```json
  {
    "tinh_thanh_id": 1,
    "ngay_bat_dau": "2026-12-01",
    "ngay_ket_thuc": "2026-12-03",
    "ngan_sach_du_kien": 5000000,
    "so_luong_nguoi": 2,
    "so_thich": "Thích thiên nhiên, ẩm thực địa phương"
  }
  ```
- **Xử lý:** 
  1. Lấy danh sách địa điểm thuộc tỉnh/thành có sẵn trong DB.
  2. Gửi prompt chuẩn hóa tới Gemini AI kèm danh sách địa điểm hợp lệ.
  3. Kiểm tra tính hợp lệ: đủ số ngày, địa điểm có thực, cảnh báo vượt ngân sách nếu ước tính chi phí > ngân sách.
  4. Lưu kết quả vào bảng `ban_nhap_ais`.
- **Response Success (200):**
  ```json
  {
    "success": true,
    "message": "Tạo lịch trình AI thành công",
    "data": {
      "ban_nhap_id": 12,
      "canh_bao_ngan_sach": false,
      "chi_phi_uoc_tinh": 4200000,
      "noi_dung_lich_trinh": { ... }
    }
  }
  ```

### `POST /api/ai/regenerate-day` — PB08: Tạo lại lịch trình cho 1 ngày cụ thể
- **Quyền:** `khach_hang`
- **Request Body:** `{ "ban_nhap_id": 12, "thu_tu_ngay": 2 }`

### `POST /api/ai/save-draft` — PB08: Lưu bản nháp AI thành Lịch trình chính thức
- **Quyền:** `khach_hang`
- **Request Body:** `{ "ban_nhap_id": 12, "ten_lich_trinh": "Du lịch Đà Nẵng 3N2Đ cùng bạn bè" }`
- **Response Success (201):** Lưu thành công vào bảng `lich_trinhs`, `lich_trinh_ngays`, `lich_trinh_chi_tiets`.

### `POST /api/trips/manual` — PB20: Tạo lịch trình thủ công
- **Quyền:** `khach_hang`
- **Request Body:** Tên lịch trình, tỉnh thành, ngày bắt đầu/kết thúc, ngân sách, số lượng người, và danh sách các ngày kèm địa điểm chọn tay.
- **Response Success (201):** Lưu lịch trình thủ công thành công.

### `GET /api/trips` — PB09: Danh sách lịch trình của tôi
- **Quyền:** `khach_hang`
- **Response Success (200):** Danh sách toàn bộ lịch trình người dùng đã tạo (không phân trang theo quy định chống scope-creep).

### `GET /api/trips/:id` — PB09: Xem chi tiết lịch trình
- **Quyền:** `khach_hang`
- **Response Success (200):** Chi tiết các ngày và chặng tham quan; nếu địa điểm đã bị xóa mềm, trả về cờ `dia_diem_da_xoa: true` và thông tin snapshot để hiển thị cảnh báo.

### `PUT /api/trips/:id` — PB09: Chỉnh sửa lịch trình (Optimistic Locking)
- **Quyền:** `khach_hang`
- **Request Body:** Dữ liệu chỉnh sửa kèm trường `phien_ban`.
- **Response Success (200):** Cập nhật thành công và tăng `phien_ban`.

### `DELETE /api/trips/:id` — PB09: Xóa lịch trình
- **Quyền:** `khach_hang`
- **Response Success (200):** Xóa lịch trình thành công.

---

## 6. NHÓM ĐÁNH GIÁ, CẨM NANG, CHAT & THÔNG BÁO (PB10, PB11, PB12, PB13, PB14, PB16, PB17, PB18)

### `POST /api/reviews` — PB10: Đánh giá địa điểm
- **Quyền:** `khach_hang`
- **Request Body:** `{ "dia_diem_id": 1, "so_sao": 5, "noi_dung": "Cảnh quan rất đẹp và dịch vụ tốt!" }`
- **Response Success (201):** Gửi đánh giá thành công.

### `GET /api/guides` — PB11: Danh sách cẩm nang
- **Quyền:** `Public`
- **Response Success (200):** Danh sách cẩm nang du lịch cộng đồng.

### `POST /api/guides` — PB11: Tạo cẩm nang mới
- **Quyền:** `khach_hang`
- **Request Body:** Tiêu đề, mô tả ngắn, nội dung chi tiết, ảnh đại diện, danh sách ảnh liên kết.

### `GET /api/chat/groups` — PB12: Danh sách nhóm chat của tôi
- **Quyền:** `khach_hang`
- **Response Success (200):** Danh sách nhóm chat người dùng tham gia.

### `POST /api/chat/groups` — PB12: Tạo nhóm chat mới
- **Quyền:** `khach_hang`
- **Request Body:** `{ "ten_nhom": "Hội phượt Đà Nẵng", "thanh_vien_ids": [2, 3] }`

### `GET /api/chat/groups/:id/messages` — PB12: Lịch sử tin nhắn nhóm
- **Quyền:** `khach_hang` (phải là thành viên nhóm)

### `GET /api/notifications` — PB13: Danh sách thông báo
- **Quyền:** `khach_hang`, `admin`
- **Response Success (200):** Danh sách thông báo cá nhân xếp theo thời gian mới nhất (UTC+7).

### `PATCH /api/notifications/:id/read` — PB13: Đánh dấu đã đọc
- **Quyền:** `khach_hang`, `admin`

### `DELETE /api/admin/guides/:id` — PB14: Admin xóa cẩm nang
- **Quyền:** `admin`
- **Request Body:** `{ "ly_do": "Nội dung vi phạm quy chuẩn cộng đồng" }` (bắt buộc)
- **Xử lý:** Xóa cẩm nang, giữ lại ảnh dùng chung trong `cam_nang_anh_lien_kets`, gửi thông báo tới tác giả.

### `PATCH /api/admin/users/:id/status` — PB16: Admin khóa / mở khóa tài khoản
- **Quyền:** `admin`
- **Request Body:** `{ "trang_thai": "bi_khoa", "ly_do_khoa": "Spam bình luận vi phạm" }`
- **Xử lý:** Cập nhật trạng thái, lưu thời gian khóa UTC+7, gửi thông báo.

### `DELETE /api/admin/reviews/:id` — PB17: Admin xóa đánh giá
- **Quyền:** `admin`
- **Request Body:** `{ "ly_do": "Ngôn từ không phù hợp" }`
- **Xử lý:** Xóa đánh giá, tính toán lại điểm đánh giá trung bình của địa điểm, gửi thông báo cho người đánh giá.

### `GET /api/admin/analytics/overview` — PB18: Thống kê tổng quan Admin
- **Quyền:** `admin`
- **Query Params:** `from_date`, `to_date` (UTC+7).
- **Response Success (200):** Số liệu tổng người dùng, địa điểm, lịch trình, cẩm nang, đánh giá và biểu đồ tăng trưởng.

---

## 7. ĐẶC TẢ SOCKET.IO REALTIME EVENTS

| Event Name | Direction | Payload / Mô tả |
| :--- | :--- | :--- |
| `join_group` | Client -> Server | `{ "nhom_id": 1 }`: Đăng ký socket vào phòng chat `group-1`. |
| `leave_group` | Client -> Server | `{ "nhom_id": 1 }`: Rời phòng chat. |
| `send_message` | Client -> Server | `{ "nhom_id": 1, "noi_dung": "Xin chào cả nhóm!" }`: Gửi tin nhắn. |
| `new_message` | Server -> Client | Phát tán tin nhắn tới toàn bộ socket đang join `group-1`. |
| `notification_received` | Server -> Client | Phát tới room cá nhân `user-{id}` khi có thông báo hệ thống mới (khóa nick, xóa cẩm nang, xóa đánh giá). |

# HỆ THỐNG THIẾT KẾ GIAO DIỆN & ÁNH XẠ 39 MÀN HÌNH (UI DESIGN SYSTEM)

Tài liệu quy chuẩn giao diện Frontend cho nền tảng **TripMate**, tuân thủ tuyệt đối theo đặc tả trong `Nhom1_5.ProjectUserInterface.docx`.

---

## 1. HỆ THỐNG MÀU SẮC & PHONG CÁCH CHỦ ĐẠO (DESIGN TOKENS)

| Nhóm màu | Mã Hex | Tên biến Tailwind đề xuất | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- |
| **Primary (Chính)** | `#0F766E`<br>`#0D9488`<br>`#115E59` | `teal-700`<br>`teal-600`<br>`teal-800` | Màu thương hiệu TripMate, nút chính (Primary Button), header, sidebar active item, icon nổi bật. |
| **Light Tint (Nền nhấn)**| `#F0FDFA`<br>`#CCFBF1` | `teal-50`<br>`teal-100` | Nền icon, badge đang chọn, hover menu, thẻ làm nổi bật. |
| **Accent / AI (Điểm nhấn)**| `#F59E0B`<br>`#D97706` | `amber-500`<br>`amber-600` | Nút **"Tạo lịch trình bằng AI"**, ngôi sao đánh giá (Rating Stars), huy hiệu VIP/Nổi bật. |
| **Danger (Nguy hiểm)** | `#DC2626`<br>`#FEF2F2` | `red-600`<br>`red-50` | Nút Khóa tài khoản, Xóa cẩm nang, Xóa địa điểm, cảnh báo vượt ngân sách, viền lỗi input. |
| **Success (Thành công)**| `#16A34A`<br>`#F0FDF4` | `green-600`<br>`green-50` | Thông báo thành công, trạng thái hoạt động của tài khoản/địa điểm. |
| **Background (Nền)** | `#F8FAFC`<br>`#FFFFFF` | `slate-50`<br>`white` | Nền toàn trang web (Neutral gray rất nhẹ), nền Card và Panel (trắng tinh khiết). |
| **Border & Divider** | `#E2E8F0`<br>`#CBD5E1` | `slate-200`<br>`slate-300` | Viền Card, đường chia tách bảng, viền ô nhập liệu. |
| **Text (Chữ)** | `#0F172A`<br>`#475569`<br>`#94A3B8` | `slate-900`<br>`slate-600`<br>`slate-400` | Tiêu đề chính (slate-900), nội dung mô tả (slate-600), placeholder & nhãn phụ (slate-400). |

---

## 2. QUY CHUẨN THÀNH PHẦN DÙNG CHUNG (REUSABLE UI COMPONENTS)
- **Card (Thẻ nội dung):** Nền trắng (`bg-white`), bo góc lớn (`rounded-2xl`), viền mảnh (`border border-slate-200`), đổ bóng nhẹ (`shadow-sm hover:shadow-md transition-shadow`).
- **Button (Nút bấm):** Bo góc `rounded-xl`, padding chuẩn (`px-4 py-2.5`), font chữ `font-medium`, hiệu ứng chuyển động mượt `transition duration-200 active:scale-95`.
  - Primary: `bg-teal-600 hover:bg-teal-700 text-white shadow-sm`.
  - AI Accent: `bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-md`.
  - Danger: `bg-red-600 hover:bg-red-700 text-white`.
  - Outline: `border border-slate-300 hover:bg-slate-50 text-slate-700`.
- **Modal (Hộp thoại nổi):** Bo góc `rounded-2xl`, overlay nền tối mờ (`bg-slate-900/50 backdrop-blur-sm`), header có nút đóng (X), footer gồm 2 nút (Hủy bỏ viền xám & Xác nhận màu tương ứng).
- **Pagination (Phân trang):** Hiển thị số trang, nút Trang trước / Trang sau, trang hiện tại nền `bg-teal-600 text-white`, cố định 10 bản ghi/trang.
- **Empty State (Trạng thái rỗng):** Icon minh họa lớn màu xám nhạt ở giữa, tiêu đề xám đậm, câu gợi ý hành động và nút CTA (Call-to-Action).
- **Badge / Chip:** Bo tròn toàn bộ `rounded-full`, chữ nhỏ `text-xs font-semibold px-2.5 py-0.5`.

---

## 3. BỐ CỤC KHUNG CHUẨN (LAYOUT ARCHITECTURE)
1. **Public & Customer Layout (`GuestLayout` & `CustomerLayout`):**
   - **Top Navbar cố định (`h-16 bg-white border-b border-slate-200 sticky top-0 z-50`):**
     - Bên trái: Logo **TripMate** (Biểu tượng la bàn/máy bay màu xanh ngọc + chữ TripMate đậm nét).
     - Ở giữa: 5 liên kết điều hướng: `Khám phá`, `Bản đồ`, `Thời tiết`, `Lịch trình`, `Cẩm nang`.
     - Bên phải:
       - Khách vãng lai: Nút `Đăng nhập` (Outline) và `Đăng ký` (Primary Teal).
       - Khách hàng: Chuông `Thông báo` kèm chấm đỏ số lượng chưa đọc + Avatar dropdown (Hồ sơ, Đổi mật khẩu, Lịch trình của tôi, Yêu thích, Đăng xuất).
   - **Footer 4 cột:**
     - Cột 1: Giới thiệu TripMate & Sứ mệnh cá nhân hóa du lịch bằng AI.
     - Cột 2: Khám phá (Điểm đến nổi bật, Tỉnh/thành phố, Danh mục du lịch).
     - Cột 3: Công cụ (Lập lịch AI, Bản đồ lộ trình, Dự báo thời tiết).
     - Cột 4: Cộng đồng & Trợ giúp (Cẩm nang du lịch, Nhóm trò chuyện, Điều khoản).
   - **Bố cục 2 cột cho trang Cá nhân (`UI_13`, `UI_14`, `UI_20`):**
     - Cột trái (1/4): Sidebar tài khoản (Avatar, họ tên, menu: Thông tin cá nhân, Đổi mật khẩu, Lịch trình đã lưu, Địa điểm yêu thích).
     - Cột phải (3/4): Card nội dung chính.
   - **Bố cục chia đôi cho trang Bản đồ (`UI_07`, `UI_12`):**
     - Panel trái (w-96 đến w-[420px]): Bộ điều khiển chặng (chọn tỉnh, nhập điểm xuất phát tay, danh sách chặng kéo thả `@dnd-kit`, nút Tối ưu quãng đường, thẻ tổng km/phút).
     - Panel phải (flex-1): Bản đồ tương tác Leaflet toàn màn hình kèm custom marker và popup thông tin.

2. **Admin Layout (`AdminLayout`):**
   - **Sidebar trái cố định (`w-64 bg-slate-900 text-white min-h-screen`):**
     - Logo: **TripMate ADMIN** nổi bật với tone teal.
     - 6 mục menu quản trị:
       1. `Tổng quan` (`UI_26`)
       2. `Địa điểm` (`UI_27`)
       3. `Danh mục` (`UI_29`)
       4. `Tài khoản` (`UI_31`)
       5. `Cẩm nang` (`UI_34`)
       6. `Đánh giá` (`UI_37`)
     - Trạng thái chọn: Nền xanh ngọc `bg-teal-600 rounded-xl font-medium text-white shadow-sm`.
   - **Topbar Admin:** Breadcrumb chỉ rõ vị trí màn hình, icon thông báo, thông tin Admin và nút Đăng xuất.
   - **Nội dung Admin:** Thống kê nhanh phía trên thẻ Card bo góc, thanh tìm kiếm + bộ lọc, bảng dữ liệu phân trang 10 dòng/trang, action buttons (Sửa xanh dương, Khóa vàng cam, Xóa đỏ).

---

## 4. BẢNG ÁNH XẠ 39 MÀN HÌNH (`UI_01` – `UI_39`) SANG REACT ROUTER

| Mã màn hình | Tên màn hình | Tác nhân | Đường dẫn Route | Layout | Thành phần chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`UI_01`** | Đăng ký tài khoản | Khách vãng lai | `/register` | GuestAuthLayout | Form đăng ký, validation lỗi trực tiếp, nút chuyển sang `/login`. |
| **`UI_02`** | Đăng nhập hệ thống | Khách vãng lai | `/login` | GuestAuthLayout | Form đăng nhập username/password, link chuyển sang `/register`. |
| **`UI_03`** | Trang chủ | Khách vãng lai | `/` | GuestLayout | Hero banner, ô tìm kiếm nhanh, địa điểm nổi bật, banner kêu gọi đăng ký. |
| **`UI_04`** | Tìm kiếm & lọc địa điểm | Khách vãng lai | `/destinations` | GuestLayout | Ô tìm kiếm không dấu, bộ lọc danh mục/tỉnh thành, lưới Card 10 mục/trang. |
| **`UI_05`** | Chi tiết địa điểm | Khách vãng lai | `/destinations/:id` | GuestLayout | Gallery ảnh, mô tả chi tiết, giá vé, tọa độ, nút Xem thời tiết, nút Yêu cầu đăng nhập để đánh giá. |
| **`UI_06`** | Dự báo thời tiết | Khách vãng lai | `/weather` | GuestLayout | Card thời tiết tỉnh/thành hiện tại, dự báo 5 ngày, nút Thử lại khi lỗi. |
| **`UI_07`** | Bản đồ và lộ trình | Khách vãng lai | `/map` | GuestLayout | Chia đôi: Panel trái tối đa 10 điểm kéo thả + Bản đồ Leaflet OSRM bên phải. |
| **`UI_08`** | Trang chủ | Khách hàng | `/` | CustomerLayout | Tương tự UI_03 nhưng Navbar có avatar user, gợi ý lịch trình AI, địa điểm yêu thích. |
| **`UI_09`** | Tìm kiếm & lọc địa điểm | Khách hàng | `/destinations` | CustomerLayout | Tương tự UI_04 kèm nút thả tim yêu thích nhanh trên từng Card. |
| **`UI_10`** | Chi tiết địa điểm | Khách hàng | `/destinations/:id` | CustomerLayout | Tương tự UI_05 kèm nút thả tim, nút mở Modal đánh giá sao (`UI_16`). |
| **`UI_11`** | Dự báo thời tiết | Khách hàng | `/weather` | CustomerLayout | Card thời tiết chi tiết theo tỉnh thành/địa điểm của lịch trình. |
| **`UI_12`** | Bản đồ và lộ trình | Khách hàng | `/map` | CustomerLayout | Bản đồ lộ trình, hỗ trợ chọn địa điểm từ danh sách đã lưu/yêu thích. |
| **`UI_13`** | Hồ sơ cá nhân | Khách hàng | `/profile` | CustomerSidebarLayout | 2 cột: Upload avatar <= 5MB, sửa họ tên, SĐT, hiển thị email/username. |
| **`UI_14`** | Đổi mật khẩu | Khách hàng | `/profile/change-password` | CustomerSidebarLayout | 2 cột: Form nhập pass cũ, pass mới, xác nhận pass mới. |
| **`UI_15`** | Danh sách địa điểm yêu thích | Khách hàng | `/favorites` | CustomerSidebarLayout | Lưới Card các địa điểm đã thả tim, nút bỏ thích nhanh, chuyển sang chi tiết. |
| **`UI_16`** | Đánh giá địa điểm | Khách hàng | Modal tại `/destinations/:id` | In-page Modal | Chọn 1-5 sao, viết nhận xét, gửi đánh giá, cập nhật điểm TB. |
| **`UI_17`** | Tạo lịch trình bằng AI | Khách hàng | `/trips/ai-create` | CustomerLayout | Form nhập đủ 6 thông tin bắt buộc, nút Gradient Vàng cam, animation loading AI. |
| **`UI_18`** | Kết quả lịch trình bằng AI | Khách hàng | `/trips/ai-result/:draftId` | CustomerLayout | Xem từng ngày, cảnh báo vượt ngân sách, nút Tạo lại toàn bộ/từng ngày, nút Lưu. |
| **`UI_19`** | Tạo lịch trình thủ công | Khách hàng | `/trips/manual-create` | CustomerLayout | Chia ngày, chọn địa điểm có sẵn trong tỉnh/thành, kéo thả sắp xếp thứ tự chặng. |
| **`UI_20`** | Danh sách lịch trình của tôi | Khách hàng | `/my-trips` | CustomerSidebarLayout | Danh sách toàn bộ lịch trình đã lưu (thẻ tóm tắt ngày, ngân sách, nguồn AI/thủ công). |
| **`UI_21`** | Chi tiết & chỉnh sửa lịch trình | Khách hàng | `/my-trips/:id` | CustomerLayout | Xem chi tiết theo ngày, chặng tham quan, cảnh báo địa điểm xóa mềm, nút Sửa/Xóa. |
| **`UI_22`** | Xác nhận xóa lịch trình | Khách hàng | Modal tại `/my-trips/:id` | In-page Modal | Hộp thoại cảnh báo màu đỏ, nút Hủy bỏ và nút Xóa vĩnh viễn. |
| **`UI_23`** | Chia sẻ cẩm nang du lịch | Khách hàng | `/guides` | CustomerLayout | Danh sách cẩm nang cộng đồng, nút "Viết cẩm nang mới", bình luận bài viết. |
| **`UI_24`** | Trò chuyện nhóm | Khách hàng | `/chat` | CustomerLayout | Chia đôi: Danh sách nhóm bên trái (kèm nút Tạo nhóm/Thêm bạn) + Khung chat Socket.io. |
| **`UI_25`** | Thông báo | Khách hàng | `/notifications` | CustomerLayout | Danh sách thông báo theo dòng thời gian UTC+7, nút Đánh dấu đã đọc tất cả. |
| **`UI_26`** | Tổng quan, thống kê & báo cáo | Admin | `/admin` | AdminLayout | Thẻ số liệu tổng, biểu đồ Recharts tăng trưởng, lịch trình theo tỉnh thành (UTC+7). |
| **`UI_27`** | Quản lý địa điểm du lịch | Admin | `/admin/destinations` | AdminLayout | Bảng địa điểm phân trang 10 dòng, tìm kiếm, nút Thêm mới, Sửa, Xóa mềm. |
| **`UI_28`** | Thêm / Sửa địa điểm du lịch | Admin | `/admin/destinations/new`<br>`/admin/destinations/:id/edit` | AdminLayout | Form nhập tên, tỉnh thành, mô tả, upload ảnh, tọa độ bản đồ, danh mục 2 cấp. |
| **`UI_29`** | Quản lý danh mục địa điểm | Admin | `/admin/categories` | AdminLayout | Cấu trúc cây 2 cấp (Nhóm danh mục -> Danh mục con), nút Thêm nhóm, Thêm mục con. |
| **`UI_30`** | Thêm / Sửa danh mục | Admin | Modal tại `/admin/categories` | Admin Modal | Nhập tên (chống trùng không dấu), chọn nhóm cha (tối đa 10 con), mô tả. |
| **`UI_31`** | Quản lý tài khoản người dùng | Admin | `/admin/users` | AdminLayout | Bảng tài khoản phân trang 10 dòng, cột vai trò, trạng thái hoạt động/bị khóa. |
| **`UI_32`** | Chi tiết tài khoản người dùng | Admin | `/admin/users/:id` | AdminLayout | Xem thông tin cá nhân, lịch sử tạo lịch trình, lý do khóa (nếu có). |
| **`UI_33`** | Hộp thoại Khóa / Mở khóa tài khoản | Admin | Modal tại `/admin/users` | Admin Modal | Form bắt buộc nhập lý do khóa, hiển thị thời gian khóa UTC+7, gửi thông báo. |
| **`UI_34`** | Quản lý cẩm nang du lịch | Admin | `/admin/guides` | AdminLayout | Bảng danh sách cẩm nang do người dùng tạo, nút Xem chi tiết và nút Xóa. |
| **`UI_35`** | Chi tiết cẩm nang du lịch | Admin | `/admin/guides/:id` | AdminLayout | Xem toàn bộ nội dung bài viết, ảnh đính kèm, danh sách bình luận. |
| **`UI_36`** | Hộp thoại xóa cẩm nang | Admin | Modal tại `/admin/guides` | Admin Modal | Hộp thoại cảnh báo, bắt buộc nhập lý do xóa, bảo toàn ảnh dùng chung, gửi thông báo. |
| **`UI_37`** | Quản lý đánh giá | Admin | `/admin/reviews` | AdminLayout | Bảng đánh giá phân trang 10 dòng, lọc theo số sao (1-5 sao), xem chi tiết, nút Xóa. |
| **`UI_38`** | Chi tiết đánh giá | Admin | Modal/Page tại `/admin/reviews/:id` | AdminLayout | Xem nội dung đánh giá chi tiết, tên địa điểm, người viết, thời gian đăng. |
| **`UI_39`** | Hộp thoại xóa đánh giá | Admin | Modal tại `/admin/reviews` | Admin Modal | Bắt buộc nhập lý do xóa, tự động tính lại điểm TB địa điểm, gửi thông báo UTC+7. |

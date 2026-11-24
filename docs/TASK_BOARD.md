# BẢNG THEO DÕI TIẾN ĐỘ CHỨC NĂNG (TASK BOARD)

Bảng phân công và trạng thái thực hiện 20 mục chức năng (`PB01–PB20`) theo đúng Bảng 5 Product Backlog và Kế hoạch dự án.

> **Trạng thái quy ước:**
> - `[TODO]`: Chưa bắt đầu
> - `[IN PROGRESS]`: Đang thực hiện
> - `[REVIEW]`: Đang kiểm thử / Chờ nghiệm thu
> - `[DONE]`: Đã hoàn thành và kiểm thử đạt yêu cầu (100%)

---

## 1. BẢNG TIẾN ĐỘ 20 CHỨC NĂNG (PB01 - PB20)

| ID | Tên chức năng | Sprint | Phụ trách FE | Phụ trách BE | Trạng thái | Ghi chú & Màn hình UI |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PB01** | Đăng ký tài khoản | Sprint 1 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_01`. Hoàn thành 22/11/2026. Đã kiểm thử 100%. |
| **PB02** | Đăng nhập hệ thống | Sprint 1 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_02`. Hoàn thành 22/11/2026. Đã kiểm thử 100%. |
| **PB03** | Quản lý hồ sơ cá nhân | Sprint 1 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_13, UI_14`. Hoàn thành 23/11/2026. Đã kiểm thử 100%. |
| **PB04** | Quản lý danh sách yêu thích | Sprint 2 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_15`. Hoàn thành 23/11/2026. Thả tim/bỏ tim optimistic update. Đã kiểm thử 100%. |
| **PB05** | Tìm kiếm và lọc địa điểm | Sprint 2 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_03–05, UI_08–10`. Hoàn thành 23/11/2026. Tìm không dấu, phân trang 10. Đã kiểm thử 100%. |
| **PB06** | Xem bản đồ và lộ trình | Sprint 2 | Frontend Team | AI & Maps Team | `[DONE]` | Màn hình `UI_07, UI_12`. Hoàn thành 23/11/2026. Leaflet + OSRM, TSP tối đa 10 điểm, kéo thả dnd-kit. Đã kiểm thử 100%. |
| **PB07** | Xem dự báo thời tiết | Sprint 2 | Frontend Team | AI & Maps Team | `[DONE]` | Màn hình `UI_06, UI_11`. Hoàn thành 23/11/2026. OpenWeatherMap 5 ngày, cache 30p, gợi ý AI trang phục. Đã kiểm thử 100%. |
| **PB08** | Tạo lịch trình bằng AI | Sprint 2 | Frontend Team | AI & Maps Team | `[DONE]` | Màn hình `UI_17, UI_18`. Hoàn thành 23/11/2026. Gemini AI 6 inputs, tạo lại ngày, lưu snapshot. Đã kiểm thử 100%. |
| **PB09** | Quản lý lịch trình cá nhân | Sprint 2 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_20–22`. Hoàn thành 23/11/2026. Danh sách, chi tiết, Optimistic locking, cảnh báo xóa mềm, modal xóa đỏ. Đã kiểm thử 100%. |
| **PB10** | Đánh giá địa điểm | Sprint 3 | Frontend Team | Realtime Team | `[DONE]` | Màn hình `UI_16`. Hoàn thành 24/11/2026. Đánh giá 1–5 sao, cập nhật `diem_danh_gia_tb` vào `dia_diems`. Đã kiểm thử 100%. |
| **PB11** | Chia sẻ cẩm nang du lịch | Sprint 3 | Frontend Team | Realtime Team | `[DONE]` | Màn hình `UI_23`. Hoàn thành 24/11/2026. Đăng bài, upload ảnh `cam_nang_anh_lien_kets`, bình luận. Đã kiểm thử 100%. |
| **PB12** | Trò chuyện nhóm | Sprint 3 | Frontend Team | Realtime Team | `[DONE]` | Màn hình `UI_24`. Hoàn thành 24/11/2026. Socket.io chat realtime, bảo mật phòng 403, tạo nhóm/thêm bạn. Đã kiểm thử 100%. |
| **PB13** | Nhận thông báo | Sprint 3 | Frontend Team | Realtime Team | `[DONE]` | Màn hình `UI_25`. Hoàn thành 24/11/2026. Room `user-{id}`, badge đỏ chưa đọc, UTC+7. Đã kiểm thử 100%. |
| **PB14** | Admin Quản lý cẩm nang | Sprint 3 | Frontend Team | QA & Admin Team | `[DONE]` | Màn hình `UI_34–36`. Hoàn thành 24/11/2026. Xóa kèm lý do bắt buộc, bảo toàn ảnh dùng chung, gửi TB UTC+7. Đã kiểm thử 100%. |
| **PB15** | Admin Quản lý danh mục | Sprint 1 | Frontend Team | QA & Admin Team | `[DONE]` | Màn hình `UI_29, UI_30`. Hoàn thành 23/11/2026. Danh mục 2 cấp, max 10 mục con/nhóm, chống trùng không dấu. Đã kiểm thử 100%. |
| **PB16** | Admin Quản lý tài khoản | Sprint 3 | Frontend Team | QA & Admin Team | `[DONE]` | Màn hình `UI_31–33`. Hoàn thành 24/11/2026. Phân trang 10 dòng, khóa/mở khóa kèm lý do, thời gian UTC+7. Đã kiểm thử 100%. |
| **PB17** | Admin Quản lý đánh giá | Sprint 3 | Frontend Team | Realtime Team | `[DONE]` | Màn hình `UI_37–39`. Hoàn thành 24/11/2026. Lọc số sao, xóa kèm lý do bắt buộc, tính lại điểm TB. Đã kiểm thử 100%. |
| **PB18** | Admin Thống kê và báo cáo | Sprint 3 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_26`. Hoàn thành 24/11/2026. Biểu đồ Recharts, lọc khoảng thời gian UTC+7. Đã kiểm thử 100%. |
| **PB19** | Admin Quản lý địa điểm | Sprint 1 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_27, UI_28`. Hoàn thành 23/11/2026. Phân trang 10, Optimistic Locking `phien_ban`, xóa mềm `da_xoa`. Đã kiểm thử 100%. |
| **PB20** | Tạo lịch trình thủ công | Sprint 2 | Frontend Team | Backend Team | `[DONE]` | Màn hình `UI_19`. Hoàn thành 23/11/2026. Chia ngày, chọn địa điểm CSDL, kéo thả dnd-kit, snapshot. Đã kiểm thử 100%. |

---

## 2. TIẾN ĐỘ THEO CÁC GIAI ĐOẠN PHÁT TRIỂN (PHASE STATUS)

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Ngày hoàn thành | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Giai đoạn 0** | Khảo sát `AI-TripPlanner`, đọc 6 docx, tạo bộ 10 file quản lý dự án & Guardrails | `[DONE]` | 22/11/2026 | Đã tạo đủ 10 file + UI Design System + API Contract + Guardrails. |
| **Giai đoạn 1** | Khởi tạo MySQL 22 bảng (Prisma), Seed data, chuyển Service Core, dựng Layout FE | `[DONE]` | 22/11/2026 | Đã push 22 bảng lên Supabase Cloud, seed đủ data và build Vite thành công. |
| **Giai đoạn 2** | Triển khai Sprint 1 (`PB01, PB02, PB03, PB15, PB19`) | `[DONE]` | 23/11/2026 | Hoàn thành 5/5 PB Sprint 1, kiểm thử tự động 100% PASS. |
| **Giai đoạn 3** | Triển khai Sprint 2 (`PB04, PB05, PB06, PB07, PB08, PB09, PB20`) | `[DONE]` | 23/11/2026 | Hoàn thành 7/7 PB Sprint 2, kiểm thử tự động 100% PASS. Sẵn sàng nghiệm thu! |
| **Giai đoạn 4** | Triển khai Sprint 3 (`PB10, PB11, PB12, PB13, PB14, PB16, PB17, PB18`) | `[DONE]` | 24/11/2026 | Hoàn thành 8/8 PB Sprint 3, kiểm thử tự động 100% PASS. Toàn dự án đạt 20/20 PB! |

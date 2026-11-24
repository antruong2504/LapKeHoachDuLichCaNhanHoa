# QUY TRÌNH LÀM VIỆC NHÓM & ĐÓNG GÓP MÃ NGUỒN (CONTRIBUTING)

Dự án: **TripMate** — Nền tảng lập kế hoạch du lịch cá nhân hóa ứng dụng AI  
Nhóm: **Ban phát triển dự án TripMate**

---

## 1. CHIẾN LƯỢC PHÂN NHÁNH GIT (GIT BRANCHING STRATEGY)

Nhóm áp dụng mô hình phân nhánh **Git Flow tinh gọn**:
- `main`: Nhánh ổn định cao nhất, chứa mã nguồn sẵn sàng phát hành hoặc chấm đồ án. Chỉ merge từ nhánh `dev` sau khi toàn bộ nhóm test đạt yêu cầu.
- `dev`: Nhánh tích hợp chính. Mọi tính năng sau khi hoàn thành ở nhánh con sẽ được tạo Pull Request (PR) merge vào `dev`.
- `feat/PBxx-<ten-chuc-nang>`: Nhánh phát triển tính năng mới bám sát Product Backlog.
  - Ví dụ: `feat/PB01-dang-ky`, `feat/PB06-ban-do-osrm`, `feat/PB08-gemini-ai`.
- `fix/PBxx-<loi-can-sua>`: Nhánh sửa lỗi phát sinh trong quá trình kiểm thử Sprint.
  - Ví dụ: `fix/PB05-tim-kiem-khong-dau`, `fix/PB19-optimistic-locking`.

---

## 2. QUY ƯỚC ĐẶT TÊN COMMIT (CONVENTIONAL COMMITS)

Mọi commit bắt buộc tuân thủ cấu trúc chuẩn:
```text
<type>(<scope>): <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>

[Mô tả chi tiết tùy chọn nếu cần]
```

### Các tiền tố Type quy chuẩn:
- `feat(PBxx)`: Bổ sung chức năng mới thuộc mục Product Backlog tương ứng.
  - Ví dụ: `feat(PB01): hoàn thiện form đăng ký và validation mật khẩu`
  - Ví dụ: `feat(PB08): tích hợp Google Gemini AI và prompt structured JSON`
- `fix(PBxx)`: Sửa lỗi của một chức năng đã có.
  - Ví dụ: `fix(PB06): xử lý trường hợp không tìm thấy đường đi OSRM`
- `docs`: Cập nhật tài liệu kỹ thuật, kế hoạch hoặc hướng dẫn.
  - Ví dụ: `docs: cập nhật API_CONTRACT và TASK_BOARD cho Sprint 2`
- `style`: Thay đổi định dạng code, căn lề, TailwindCSS class mà không đổi logic.
- `refactor`: Tái cấu trúc mã nguồn, tối ưu hóa hàm mà không thay đổi tính năng.
- `test`: Thêm hoặc sửa kịch bản kiểm thử (test script/unit test).
- `chore`: Cập nhật dependency `package.json`, cấu hình build Vite/Prisma.

---

## 3. QUY TẮC BẢO MẬT & QUẢN LÝ TỆP TIN
1. **Tuyệt đối KHÔNG commit file chứa bí mật hoặc mã nhạy cảm:**
   - `.env`, `.env.local`, `.env.production` (chỉ commit `.env.example`).
   - Khóa bí mật JWT, Google Gemini API key, OpenWeatherMap key.
2. **Tuyệt đối KHÔNG commit thư mục tạm và file sinh tự động:**
   - `node_modules/`
   - `dist/`, `build/`
   - `BE/uploads/*` (ngoại trừ file `.gitkeep` để giữ cấu trúc thư mục)
   - `.DS_Store`, `Thumbs.db`
3. **Thư mục `AI-TripPlanner/`:**
   - Là tài sản tham khảo CHỈ ĐỌC (READ-ONLY). Không được thực hiện lệnh `git add` hay sửa đổi bất kỳ file nào trong thư mục này.

---

## 4. CHECKLIST TRƯỚC KHI TẠO PULL REQUEST (PR CHECKLIST)

Trước khi gửi PR merge vào nhánh `dev`, lập trình viên phụ trách phải kiểm tra:
- [ ] Mã nguồn đã được chạy `npm run lint` hoặc định dạng sạch sẽ, không có console log thừa.
- [ ] Ứng dụng Backend khởi động không lỗi: `npm run dev` (kết nối DB thành công).
- [ ] Ứng dụng Frontend build thành công không lỗi: `npm run build`.
- [ ] Đã kiểm tra các tiêu chí chấp nhận (Acceptance Criteria) trong `docs/PROJECT_PLAN.md` tương ứng với mã PB.
- [ ] Đã cập nhật trạng thái trong `docs/TASK_BOARD.md` và ghi chú thay đổi vào `CHANGELOG.md`.
- [ ] PR đã được ít nhất 1 thành viên khác (hoặc Tech Lead) review và phê duyệt.

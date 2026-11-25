import api from './api';

export const aiService = {
  // 1. Tạo lịch trình du lịch bằng Gemini AI (PB08 - UI_17)
  generateItinerary: async (data) => {
    return await api.post('/ai/generate-itinerary', data);
  },

  // 2. Tạo lại lịch trình cho 1 ngày cụ thể (PB08 - UI_18)
  regenerateDay: async (ban_nhap_id, thu_tu_ngay) => {
    return await api.post('/ai/regenerate-day', { ban_nhap_id, thu_tu_ngay });
  },

  // 2.5. Tối ưu lại bản nháp cho vừa ngân sách dự kiến
  optimizeBudget: async (ban_nhap_id) => {
    return await api.post('/ai/optimize-budget', { ban_nhap_id });
  },

  // 3. Lưu bản nháp AI thành Lịch trình chính thức (PB08 - UI_18 -> UI_20)
  saveDraft: async (ban_nhap_id, ten_lich_trinh) => {
    return await api.post('/ai/save-draft', { ban_nhap_id, ten_lich_trinh });
  },

  // 4. Lấy chi tiết & cập nhật nhanh chặng trong bản nháp AI
  getDraft: async (id) => {
    return await api.get(`/ai/draft/${id}`);
  },
  updateDraftDay: async (ban_nhap_id, thu_tu_ngay, cac_chang) => {
    return await api.put(`/ai/draft/${ban_nhap_id}`, { thu_tu_ngay, cac_chang });
  },
};

export default aiService;

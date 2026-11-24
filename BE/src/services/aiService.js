import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Sinh lịch trình du lịch thông minh bằng Google Gemini AI (PB08)
 * @param {Object} input - { destinationName, startDate, endDate, budget, groupSize, interests, validDestinations }
 */
export const generateItineraryWithGemini = async ({
  destinationName,
  startDate,
  endDate,
  budget,
  groupSize,
  interests,
  validDestinations = [],
}) => {
  if (!genAI) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env');
  }

  // Tính số ngày
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Danh sách địa điểm có thật trong database
  const validPlacesContext = validDestinations.map(d => ({
    id: d.id.toString(),
    ten: d.ten_dia_diem,
    dia_chi: d.dia_chi,
    gia_ve: d.gia_tham_quan ? Number(d.gia_tham_quan) : 0,
    vi_do: d.vi_do ? Number(d.vi_do) : null,
    kinh_do: d.kinh_do ? Number(d.kinh_do) : null,
  }));

  const prompt = `
Bạn là chuyên gia lập kế hoạch du lịch cá nhân hóa cho ứng dụng TripMate tại Việt Nam.
Hãy tạo một lịch trình du lịch ${totalDays} ngày tại tỉnh/thành phố: "${destinationName}".

THÔNG TIN ĐẦU VÀO:
- Ngày bắt đầu: ${startDate}
- Ngày kết thúc: ${endDate}
- Tổng số ngày: ${totalDays} ngày
- Ngân sách dự kiến: ${budget} VNĐ
- Số lượng người: ${groupSize} người
- Sở thích / Phong cách du lịch: ${interests || 'Khám phá, trải nghiệm ẩm thực và ngắm cảnh'}

QUY TẮC BẮT BUỘC (CRITICAL RULES):
1. Bạn CHỈ ĐƯỢC CHỌN các địa điểm tham quan từ DANH SÁCH ĐỊA ĐIỂM HỢP LỆ sau đây:
${JSON.stringify(validPlacesContext, null, 2)}

2. Bắt buộc tạo ĐỦ ${totalDays} ngày. Mỗi ngày gồm các buổi (Sáng, Chiều, Tối).
3. Mỗi hoạt động/địa điểm phải giữ nguyên chính xác id và tên của địa điểm trong danh sách trên.
4. Ước tính chi phí chi tiết (tiền vé, ăn uống, di chuyển) cho từng chặng.
5. Tính tổng chi phí ước tính toàn bộ chuyến đi. Nếu tổng chi phí > ngân sách dự kiến (${budget} VNĐ), hãy đặt trường "vuot_ngan_sach": true và đưa ra câu cảnh báo rõ ràng.

ĐỊNH DẠNG TRẢ VỀ (BẮT BUỘC LÀ JSON THUẦN TÚY KHÔNG CHỨA MARKDOWN CODEBLOCK):
{
  "ten_lich_trinh": "Tên lịch trình hấp dẫn",
  "tong_so_ngay": ${totalDays},
  "tong_chi_phi_uoc_tinh": 3500000,
  "vuot_ngan_sach": false,
  "canh_bao": "Câu cảnh báo hoặc lưu ý nếu có",
  "cac_ngay": [
    {
      "thu_tu_ngay": 1,
      "tieu_de_ngay": "Khám phá trung tâm thành phố và Cầu Rồng",
      "cac_chang": [
        {
          "thu_tu": 1,
          "buoi": "sang",
          "thoi_gian": "08:30 - 11:30",
          "dia_diem_id": "id_chính_xác_trong_danh_sách",
          "ten_dia_diem": "Tên địa điểm chính xác",
          "hoat_dong": "Mô tả hoạt động cụ thể",
          "chi_phi_uoc_tinh": 100000
        }
      ]
    }
  ]
}
`;

  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse JSON
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleaned);

  // Tính toán kiểm tra lại ngân sách
  const estCost = Number(parsed.tong_chi_phi_uoc_tinh || 0);
  const isOverBudget = estCost > Number(budget);

  return {
    ...parsed,
    vuot_ngan_sach: isOverBudget,
    canh_bao: isOverBudget 
      ? `Chi phí ước tính (${estCost.toLocaleString('vi-VN')} VNĐ) vượt quá ngân sách dự kiến (${Number(budget).toLocaleString('vi-VN')} VNĐ). Bạn có thể cân nhắc điều chỉnh lại!` 
      : null,
  };
};

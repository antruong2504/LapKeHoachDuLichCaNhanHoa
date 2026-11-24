import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const LEGACY_MODEL_PREFIXES = [
  'gemini-1.5-',
  'gemini-2.0-',
  'gemini-2.5-',
  'gemini-flash-lite-latest',
];

const resolveGeminiModel = (rawModel) => {
  if (!rawModel) return 'gemini-4-hydrogen';
  const normalized = rawModel.trim();
  if (LEGACY_MODEL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return 'gemini-4-hydrogen';
  }
  return normalized;
};

const modelName = resolveGeminiModel(process.env.GEMINI_MODEL);
const FALLBACK_AI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const getModelCandidates = (primaryModel = modelName) => {
  const candidates = [primaryModel, ...FALLBACK_AI_MODELS];
  return [...new Set(candidates.filter(Boolean))];
};

const ITINERARY_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    ten_lich_trinh: {
      type: 'string',
      description: 'Tên lịch trình hấp dẫn, súc tích bằng tiếng Việt',
    },
    tong_so_ngay: {
      type: 'integer',
      description: 'Tổng số ngày của lịch trình',
    },
    tong_chi_phi_uoc_tinh: {
      type: 'number',
      description: 'Tổng chi phí ước tính toàn bộ chuyến đi (VNĐ)',
    },
    vuot_ngan_sach: {
      type: 'boolean',
      description: 'true nếu tổng chi phí ước tính > ngân sách dự kiến',
    },
    canh_bao: {
      type: 'string',
      description: 'Câu cảnh báo nếu vượt ngân sách hoặc chuỗi rỗng nếu phù hợp',
    },
    cac_ngay: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          thu_tu_ngay: { type: 'integer' },
          tieu_de_ngay: { type: 'string' },
          cac_chang: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                thu_tu: { type: 'integer' },
                buoi: { type: 'string', enum: ['sang', 'chieu', 'toi'] },
                thoi_gian: { type: 'string' },
                dia_diem_id: { type: 'string' },
                ten_dia_diem: { type: 'string' },
                hoat_dong: { type: 'string' },
                chi_phi_uoc_tinh: { type: 'number' },
              },
              required: [
                'thu_tu',
                'buoi',
                'thoi_gian',
                'dia_diem_id',
                'ten_dia_diem',
                'hoat_dong',
                'chi_phi_uoc_tinh',
              ],
            },
          },
        },
        required: ['thu_tu_ngay', 'tieu_de_ngay', 'cac_chang'],
      },
    },
  },
  required: [
    'ten_lich_trinh',
    'tong_so_ngay',
    'tong_chi_phi_uoc_tinh',
    'vuot_ngan_sach',
    'cac_ngay',
  ],
};

/**
 * Sinh lịch trình du lịch thông minh bằng Google Gemini AI (Interactions API + Structured Output)
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
  if (!ai) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const validPlacesContext = validDestinations.map((d) => ({
    id: d.id.toString(),
    ten: d.ten_dia_diem,
    dia_chi: d.dia_chi,
    gia_ve: d.gia_tham_quan ? Number(d.gia_tham_quan) : 0,
    vi_do: d.vi_do ? Number(d.vi_do) : null,
    kinh_do: d.kinh_do ? Number(d.kinh_do) : null,
  }));

  const systemInstruction = [
    'Bạn là chuyên gia lập kế hoạch du lịch cá nhân hóa cho ứng dụng TripMate tại Việt Nam.',
    'Quy tắc bắt buộc:',
    '1. Chỉ sử dụng các địa điểm có trong DANH SÁCH ĐỊA ĐIỂM HỢP LỆ được cung cấp, giữ nguyên chính xác id và ten.',
    '2. Sắp xếp các điểm đến gần nhau về tọa độ (vi_do, kinh_do) trong cùng một ngày để tối ưu quãng đường di chuyển.',
    '3. Hạn chế lặp lại địa điểm giữa các ngày nếu danh sách địa điểm đủ phong phú.',
    '4. Phân bổ hợp lý 3 buổi (sang, chieu, toi) mỗi ngày, mô tả hoạt động cụ thể phù hợp sở thích và số lượng người.',
    '5. Ước tính chi phí thực tế (vé tham quan + ăn uống + di chuyển) cho cả nhóm và đối chiếu ngân sách.',
  ].join('\n');

  const prompt = `Hãy lập lịch trình du lịch ${totalDays} ngày tại "${destinationName}".

THÔNG TIN CHUYẾN ĐI:
- Thời gian: ${startDate} đến ${endDate} (${totalDays} ngày)
- Ngân sách dự kiến: ${Number(budget).toLocaleString('vi-VN')} VNĐ
- Số lượng người: ${groupSize} người
- Sở thích / Phong cách: ${interests || 'Khám phá, trải nghiệm ẩm thực và ngắm cảnh'}

DANH SÁCH ĐỊA ĐIỂM HỢP LỆ (CHỈ CHỌN TỪ ĐÂY):
${JSON.stringify(validPlacesContext, null, 2)}

Yêu cầu: Tạo đủ ${totalDays} ngày trong mảng "cac_ngay", mỗi ngày có các chặng buổi "sang", "chieu", "toi".`;

  const candidates = getModelCandidates(modelName);
  let interaction = null;
  let lastError = null;

  for (const candidateModel of candidates) {
    try {
      const requestPayload = {
        model: candidateModel,
        system_instruction: systemInstruction,
        input: prompt,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: ITINERARY_RESPONSE_SCHEMA,
        },
      };

      if (candidateModel.startsWith('gemini-4-')) {
        requestPayload.generation_config = { thinking_level: 'low' };
      }

      interaction = await ai.interactions.create(requestPayload);
      if (interaction?.output_text?.trim()) {
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini AI] Model "${candidateModel}" thất bại (${err.message}), thử model dự phòng...`);
    }
  }

  const rawText = (interaction?.output_text || '').trim();
  if (!rawText) {
    throw lastError || new Error('Gemini API trả về nội dung rỗng ở tất cả các model dự phòng');
  }

  const parsed = JSON.parse(rawText);

  // Chuẩn hóa & bảo toàn địa điểm hợp lệ (tránh hallucination ID)
  const placeMap = new Map(validDestinations.map((d) => [d.id.toString(), d]));
  let fallbackIdx = 0;

  const normalizedDays = (Array.isArray(parsed.cac_ngay) ? parsed.cac_ngay : []).map(
    (day, dayIdx) => {
      const normalizedChangs = (Array.isArray(day.cac_chang) ? day.cac_chang : []).map(
        (chang, changIdx) => {
          const matched = placeMap.get(chang.dia_diem_id?.toString());
          const safePlace =
            matched || validDestinations[fallbackIdx++ % Math.max(1, validDestinations.length)];
          return {
            ...chang,
            thu_tu: Number(chang.thu_tu || changIdx + 1),
            buoi: ['sang', 'chieu', 'toi'].includes(chang.buoi) ? chang.buoi : 'sang',
            dia_diem_id: safePlace ? safePlace.id.toString() : chang.dia_diem_id?.toString(),
            ten_dia_diem: safePlace ? safePlace.ten_dia_diem : chang.ten_dia_diem,
            chi_phi_uoc_tinh: Number(chang.chi_phi_uoc_tinh || 0),
          };
        }
      );

      return {
        ...day,
        thu_tu_ngay: Number(day.thu_tu_ngay || dayIdx + 1),
        cac_chang: normalizedChangs,
      };
    }
  );

  // Tính toán kiểm tra lại ngân sách
  const computedCost = normalizedDays.reduce(
    (sum, day) =>
      sum + day.cac_chang.reduce((cSum, c) => cSum + Number(c.chi_phi_uoc_tinh || 0), 0),
    0
  );
  const estCost = Number(parsed.tong_chi_phi_uoc_tinh || computedCost || 0);
  const isOverBudget = estCost > Number(budget);

  return {
    ...parsed,
    tong_so_ngay: normalizedDays.length || totalDays,
    tong_chi_phi_uoc_tinh: estCost,
    cac_ngay: normalizedDays,
    vuot_ngan_sach: isOverBudget,
    canh_bao: isOverBudget
      ? `Chi phí ước tính (${estCost.toLocaleString('vi-VN')} VNĐ) vượt quá ngân sách dự kiến (${Number(budget).toLocaleString('vi-VN')} VNĐ). Bạn có thể cân nhắc điều chỉnh lại!`
      : null,
  };
};

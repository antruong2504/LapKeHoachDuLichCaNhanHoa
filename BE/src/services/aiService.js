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
const FALLBACK_AI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const modelCooldownUntil = new Map();
const MODEL_TIMEOUT_MS = 28000;

const getModelCandidates = (primaryModel = modelName) => {
  const now = Date.now();
  const candidates = [primaryModel, ...FALLBACK_AI_MODELS].filter(Boolean);
  const unique = [...new Set(candidates)];
  const ready = unique.filter((m) => (modelCooldownUntil.get(m) || 0) <= now);
  return ready.length > 0 ? ready : unique;
};

const ITINERARY_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    ten_lich_trinh: {
      type: 'string',
      description: 'Tên lịch trình hấp dẫn, súc tích bằng tiếng Việt',
    },
    tom_tat_chuyen_di: {
      type: 'string',
      description: 'Tóm tắt ngắn gọn 2-3 câu về điểm nhấn hành trình, cách di chuyển và thích ứng thời tiết',
    },
    goi_y_chuan_bi: {
      type: 'array',
      items: { type: 'string' },
      description: '3 đến 5 gạch đầu dòng gợi ý trang phục, vật dụng và lưu ý thực tế theo thời tiết & điểm đến',
    },
    tong_so_ngay: {
      type: 'integer',
      description: 'Tổng số ngày của lịch trình',
    },
    tong_chi_phi_uoc_tinh: {
      type: 'number',
      description: 'Tổng chi phí ước tính toàn bộ chuyến đi (VNĐ)',
    },
    phan_bo_chi_phi: {
      type: 'object',
      description: 'Phân tách chi phí dự kiến toàn chuyến theo 4 nhóm (VNĐ)',
      properties: {
        tham_quan: { type: 'number' },
        an_uong: { type: 'number' },
        di_chuyen: { type: 'number' },
        luu_tru: { type: 'number' },
      },
      required: ['tham_quan', 'an_uong', 'di_chuyen', 'luu_tru'],
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
                dia_chi: { type: 'string', description: 'Địa chỉ cụ thể của địa điểm' },
                phuong_tien_di_chuyen: { type: 'string', description: 'Phương tiện gợi ý đến điểm này (VD: Taxi / Xe máy, Đi bộ, Xe khách / Tàu hỏa)' },
                hoat_dong: { type: 'string' },
                luu_y: { type: 'string', description: 'Mẹo tham quan, lưu ý thời tiết, giờ mở cửa hoặc món nên thử' },
                chi_phi_uoc_tinh: { type: 'number' },
              },
              required: [
                'thu_tu',
                'buoi',
                'thoi_gian',
                'dia_diem_id',
                'ten_dia_diem',
                'dia_chi',
                'phuong_tien_di_chuyen',
                'hoat_dong',
                'luu_y',
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
  selectedProvinces = [],
  startDate,
  endDate,
  budget,
  groupSize,
  interests,
  preferences = {},
  validDestinations = [],
  weatherForecasts = [],
}) => {
  if (!ai) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong file .env');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const provinceList =
    selectedProvinces.length > 0
      ? selectedProvinces
      : destinationName.split(',').map((s) => s.trim()).filter(Boolean);
  const hasDbPlaces = validDestinations.length > 0;
  const provincesWithDb = new Set(
    validDestinations.map((d) => d.tinh_thanh?.ten_tinh_thanh).filter(Boolean)
  );
  const provincesWithoutDb = provinceList.filter((name) => !provincesWithDb.has(name));
  const isHybrid = hasDbPlaces && provincesWithoutDb.length > 0;

  const validPlacesContext = validDestinations.map((d) => ({
    id: d.id.toString(),
    ten: d.ten_dia_diem,
    tinh_thanh: d.tinh_thanh?.ten_tinh_thanh || undefined,
    danh_muc: (d.dia_diem_danh_mucs || [])
      .map((dm) => dm.danh_muc?.ten_danh_muc)
      .filter(Boolean),
    mo_ta: d.mo_ta_ngan || undefined,
    dia_chi: d.dia_chi,
    gia_ve: d.gia_tham_quan ? Number(d.gia_tham_quan) : 0,
    vi_do: d.vi_do ? Number(d.vi_do) : null,
    kinh_do: d.kinh_do ? Number(d.kinh_do) : null,
  }));

  const multiProvinceRule =
    provinceList.length > 1
      ? `QUY TẮC NHIỀU TỈNH/THÀNH: Người dùng đã chọn ${provinceList.length} tỉnh/thành (${provinceList.join(', ')}). BẮT BUỘC phân bổ lịch trình ${totalDays} ngày đi qua ĐẦY ĐỦ tất cả các tỉnh/thành này một cách hợp lý theo cụm ngày liền kề; tên lịch trình (ten_lich_trinh) và tiêu đề từng ngày (tieu_de_ngay) phải thể hiện rõ các tỉnh/thành đã chọn.`
      : '';

  const weatherRule =
    weatherForecasts.length > 0
      ? 'QUY TẮC THỜI TIẾT: Dựa vào DỮ LIỆU THỜI TIẾT THỰC TẾ của từng tỉnh/ngày để chọn địa điểm và hoạt động hợp lý (trời mưa/dông ưu tiên bảo tàng, chợ, quán ăn, trung tâm thương mại trong nhà và tránh biển/đèo/trekking; trời nắng ráo ưu tiên tham quan ngoài trời, bãi biển, thắng cảnh; ghi chú ngắn gợi ý phù hợp thời tiết trong hoat_dong).'
      : '';

  const dbRule = !hasDbPlaces
    ? '1. Đề xuất các địa danh, điểm tham quan, quán ăn nổi tiếng có thật tại các tỉnh/thành người dùng chọn (đặt dia_diem_id là chuỗi rỗng "").'
    : isHybrid
    ? `1. Với các tỉnh có dữ liệu trong DANH SÁCH ĐỊA ĐIỂM HỢP LỆ (${[...provincesWithDb].join(', ')}), CHỈ ĐƯỢC PHÉP chọn từ danh sách đó và giữ nguyên chính xác id và ten. Riêng với các tỉnh chưa có địa điểm mẫu trong hệ thống (${provincesWithoutDb.join(', ')}), được phép đề xuất địa danh nổi tiếng có thật tại tỉnh đó và đặt dia_diem_id là "".`
    : '1. CHỈ SỬ DỤNG các địa điểm có trong DANH SÁCH ĐỊA ĐIỂM HỢP LỆ được cung cấp, giữ nguyên chính xác id và ten.';

  const systemInstruction = [
    'Bạn là chuyên gia lập kế hoạch du lịch cá nhân hóa cho ứng dụng TripMate tại Việt Nam.',
    'Quy tắc bắt buộc:',
    dbRule,
    multiProvinceRule,
    weatherRule,
    '2. Sắp xếp các điểm đến gần nhau về tọa độ (vi_do, kinh_do) trong cùng một ngày để tối ưu quãng đường di chuyển.',
    '3. Tính toán khung giờ thoi_gian ("HH:MM - HH:MM") sát với thời gian di chuyển thực tế giữa các điểm và giữa các tỉnh (tính cả thời gian nghỉ trưa/tối), không xếp các chặng chồng chéo hoặc quá gấp.',
    '4. Hạn chế lặp lại địa điểm giữa các ngày nếu danh sách địa điểm đủ phong phú.',
    '5. Số lượng chặng mỗi ngày KHÔNG cố định ở mức 3 chặng: hãy linh hoạt sắp xếp từ 2 đến 6 chặng/ngày tùy theo nhịp độ (thư giãn: 2-3 chặng, cân bằng: 3-4 chặng, dày đặc: 4-6 chặng), quãng đường di chuyển và đặc thù ngày đi/về.',
    '6. Khung giờ bắt đầu và kết thúc mỗi ngày hoàn toàn linh hoạt theo thực tế trải nghiệm (có thể bắt đầu sớm 06:00-07:30 để ngắm bình minh/chợ sáng, hoặc muộn 09:00-09:30 nếu thư giãn; buổi tối có thể kéo dài đến 21:30-22:30 cho chợ đêm/phố đi bộ, không gò bó cố định 08:00 - 20:00).',
    '7. Ước tính chi phí thực tế (vé tham quan + ăn uống + di chuyển) cho cả nhóm và đối chiếu ngân sách.',
  ]
    .filter(Boolean)
    .join('\n');

  const weatherSection =
    weatherForecasts.length > 0
      ? `\nDỮ LIỆU THỜI TIẾT THỰC TẾ THEO TỈNH/THÀNH:\n${JSON.stringify(weatherForecasts, null, 2)}\n`
      : '';

  const placesSection = hasDbPlaces
    ? `\nDANH SÁCH ĐỊA ĐIỂM HỢP LỆ TRONG CSDL (ƯU TIÊN TUYỆT ĐỐI):\n${JSON.stringify(validPlacesContext, null, 2)}\n`
    : '';

  const preferenceLines = [
    preferences.nhip_do ? `- Nhịp độ mong muốn: ${preferences.nhip_do}` : '',
    preferences.phuong_tien && preferences.phuong_tien !== 'Linh hoạt'
      ? `- Phương tiện di chuyển ưu tiên: ${preferences.phuong_tien}`
      : '',
    preferences.doi_tuong ? `- Đối tượng đồng hành: ${preferences.doi_tuong}` : '',
    preferences.luu_tru && preferences.luu_tru !== 'Linh hoạt'
      ? `- Phong cách lưu trú ưu tiên: ${preferences.luu_tru}`
      : '',
    preferences.diem_xuat_phat
      ? `- Điểm xuất phát ngày đầu tiên: ${preferences.diem_xuat_phat} (tính chặng đầu từ điểm này)`
      : '',
    preferences.gio_den_ngay_dau
      ? `- Giờ đến nơi ngày đầu tiên: ${preferences.gio_den_ngay_dau} (lịch trình ngày 1 chỉ bắt đầu sau giờ này + thời gian di chuyển)`
      : '',
    preferences.gio_ve_ngay_cuoi
      ? `- Giờ khởi hành về ngày cuối: ${preferences.gio_ve_ngay_cuoi} (ngày cuối phải kết thúc trước giờ này tối thiểu 60 phút để kịp ra sân bay/ga/bến xe)`
      : '',
    preferences.toi_uu_ngan_sach
      ? `- YÊU CẦU TỐI ƯU NGÂN SÁCH NGHIÊM NGẶT: Tổng chi phí toàn bộ chuyến đi BẮT BUỘC <= ${Number(budget).toLocaleString('vi-VN')} VNĐ. Ưu tiên điểm tham quan miễn phí hoặc vé rẻ, quán ăn bình dân/streetfood, phương tiện tiết kiệm và lưu trú vừa túi tiền.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `Hãy lập lịch trình du lịch ${totalDays} ngày đi qua các tỉnh/thành: ${provinceList.join(', ')}.

THÔNG TIN CHUYẾN ĐI:
- Tỉnh/Thành phố đã chọn: ${provinceList.join(', ')}
- Thời gian: ${startDate} đến ${endDate} (${totalDays} ngày)
- Ngân sách dự kiến: ${Number(budget).toLocaleString('vi-VN')} VNĐ
- Số lượng người: ${groupSize} người
- Sở thích / Phong cách: ${interests || 'Khám phá, trải nghiệm ẩm thực và ngắm cảnh'}
${preferenceLines ? `${preferenceLines}\n` : ''}${weatherSection}${placesSection}
Yêu cầu: Tạo đủ ${totalDays} ngày trong mảng "cac_ngay", phân bổ đều và hợp lý qua TẤT CẢ các tỉnh/thành đã chọn (${provinceList.join(', ')}). Số lượng chặng mỗi ngày (2–6 chặng) và khung giờ bắt đầu/kết thúc từng ngày phải tự nhiên, linh hoạt theo nhịp độ (${preferences.nhip_do || 'Cân bằng'}), thời tiết, thời gian di chuyển thực tế và các tùy chọn cá nhân hóa của người dùng.`;

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

      interaction = await Promise.race([
        ai.interactions.create(requestPayload),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout sau ${MODEL_TIMEOUT_MS / 1000}s`)), MODEL_TIMEOUT_MS)
        ),
      ]);
      if (interaction?.output_text?.trim()) {
        break;
      }
    } catch (err) {
      lastError = err;
      if (String(err.message || '').includes('429')) {
        modelCooldownUntil.set(candidateModel, Date.now() + 15 * 60 * 1000);
      }
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
          const allowOpenStop = !hasDbPlaces || provincesWithoutDb.length > 0;
          const safePlace = matched
            ? matched
            : allowOpenStop
            ? null
            : validDestinations[fallbackIdx++ % Math.max(1, validDestinations.length)];
          return {
            ...chang,
            thu_tu: Number(chang.thu_tu || changIdx + 1),
            buoi: ['sang', 'chieu', 'toi'].includes(chang.buoi) ? chang.buoi : 'sang',
            dia_diem_id: safePlace ? safePlace.id.toString() : null,
            ten_dia_diem: safePlace ? safePlace.ten_dia_diem : chang.ten_dia_diem,
            dia_chi: safePlace?.dia_chi || chang.dia_chi || '',
            phuong_tien_di_chuyen: chang.phuong_tien_di_chuyen || '',
            luu_y: chang.luu_y || '',
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
  const rawBreakdown = parsed.phan_bo_chi_phi || {};
  const phanBoChiPhi = {
    tham_quan: Number(rawBreakdown.tham_quan || Math.round(estCost * 0.25)),
    an_uong: Number(rawBreakdown.an_uong || Math.round(estCost * 0.3)),
    di_chuyen: Number(rawBreakdown.di_chuyen || Math.round(estCost * 0.2)),
    luu_tru: Number(rawBreakdown.luu_tru || Math.round(estCost * 0.25)),
  };

  return {
    ...parsed,
    tom_tat_chuyen_di: parsed.tom_tat_chuyen_di || '',
    goi_y_chuan_bi: Array.isArray(parsed.goi_y_chuan_bi) ? parsed.goi_y_chuan_bi : [],
    tong_so_ngay: normalizedDays.length || totalDays,
    tong_chi_phi_uoc_tinh: estCost,
    phan_bo_chi_phi: phanBoChiPhi,
    cac_ngay: normalizedDays,
    vuot_ngan_sach: isOverBudget,
    canh_bao: isOverBudget
      ? `Chi phí ước tính (${estCost.toLocaleString('vi-VN')} VNĐ) vượt quá ngân sách dự kiến (${Number(budget).toLocaleString('vi-VN')} VNĐ). Bạn có thể cân nhắc điều chỉnh lại!`
      : null,
  };
};

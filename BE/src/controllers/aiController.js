import prisma from '../config/db.js';
import { generateItineraryWithGemini } from '../services/aiService.js';
import { geocodeCityName, getWeatherForecast } from '../services/weatherService.js';
import { fetchOsrmRoute } from '../services/mapService.js';

const fetchWeatherContextForProvinces = async (provinces, validDestinations) => {
  const provinceCoordsMap = new Map();
  const weatherResults = await Promise.allSettled(
    provinces.map(async (prov) => {
      const samplePlace = validDestinations.find(
        (d) => d.tinh_thanh_id === prov.id && d.vi_do && d.kinh_do
      );
      let lat = samplePlace ? Number(samplePlace.vi_do) : null;
      let lon = samplePlace ? Number(samplePlace.kinh_do) : null;
      if (!lat || !lon) {
        const cleanName = prov.ten_tinh_thanh.replace(/\s*\(.*?\)\s*/g, '').trim();
        const geo = await geocodeCityName(cleanName);
        lat = geo?.lat || null;
        lon = geo?.lon || null;
      }
      if (lat && lon) {
        provinceCoordsMap.set(prov.ten_tinh_thanh, { lat, lon });
      }
      const forecast = await getWeatherForecast(lat, lon, prov.ten_tinh_thanh);
      return {
        tinh_thanh: prov.ten_tinh_thanh,
        hien_tai: forecast?.hien_tai || null,
        du_bao_theo_ngay: (forecast?.du_bao_5_ngay || []).slice(0, 7),
      };
    })
  );

  const weatherForecasts = weatherResults
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);

  return { provinceCoordsMap, weatherForecasts };
};

const formatMinutesToHHMM = (totalMins) => {
  const clamped = Math.max(0, Math.min(23 * 60 + 55, Math.round(totalMins / 5) * 5));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const parseTimeRangeMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const matches = timeStr.match(/(\d{1,2})[:h](\d{2})/g);
  if (!matches || matches.length === 0) return null;
  const toMins = (token) => {
    const [h, m] = token.replace('h', ':').split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };
  const startMin = toMins(matches[0]);
  if (startMin === null) return null;
  const endMin = matches[1] ? toMins(matches[1]) : null;
  const rawDur = endMin !== null && endMin > startMin ? endMin - startMin : 120;
  return {
    startMin,
    durationMin: Math.max(45, Math.min(240, rawDur)),
  };
};

const parseClockHHMMToMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
};

const enrichItineraryWithRealTravelTimes = async (
  aiResult,
  validDestinations,
  provinceCoordsMap,
  weatherForecasts = [],
  scheduleConstraints = {}
) => {
  if (!aiResult?.cac_ngay || !Array.isArray(aiResult.cac_ngay)) return aiResult;

  const arrivalMin = parseClockHHMMToMinutes(scheduleConstraints.gio_den_ngay_dau);
  const departureMin = parseClockHHMMToMinutes(scheduleConstraints.gio_ve_ngay_cuoi);
  let startOriginCoords = null;
  if (scheduleConstraints.diem_xuat_phat) {
    const geoStart = await geocodeCityName(scheduleConstraints.diem_xuat_phat);
    if (geoStart?.lat && geoStart?.lon) {
      startOriginCoords = { vi_do: geoStart.lat, kinh_do: geoStart.lon };
    }
  }

  const placeMap = new Map(validDestinations.map((p) => [p.id.toString(), p]));
  const stopsToGeocode = [];

  for (const day of aiResult.cac_ngay) {
    for (const chang of day.cac_chang || []) {
      const p = placeMap.get(chang.dia_diem_id?.toString());
      if (p) {
        chang.anh_dai_dien = p.anh_dai_dien;
        chang.dia_chi = p.dia_chi || chang.dia_chi || '';
        chang.vi_do = p.vi_do ? Number(p.vi_do) : null;
        chang.kinh_do = p.kinh_do ? Number(p.kinh_do) : null;
      }
      if ((!chang.vi_do || !chang.kinh_do) && chang.ten_dia_diem) {
        stopsToGeocode.push({ chang, dayTitle: day.tieu_de_ngay || '' });
      }
    }
  }

  // Geocode các điểm AI đề xuất (ngoài CSDL) song song để tính OSRM thực tế
  await Promise.allSettled(
    stopsToGeocode.map(async ({ chang, dayTitle }) => {
      const geo = await geocodeCityName(chang.ten_dia_diem);
      if (geo?.lat && geo?.lon) {
        chang.vi_do = geo.lat;
        chang.kinh_do = geo.lon;
        return;
      }
      // Fallback theo tọa độ tỉnh xuất hiện trong tiêu đề ngày
      for (const [provName, coords] of provinceCoordsMap.entries()) {
        const cleanProv = provName.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
        if (dayTitle.toLowerCase().includes(cleanProv) && coords?.lat && coords?.lon) {
          chang.vi_do = coords.lat;
          chang.kinh_do = coords.lon;
          return;
        }
      }
    })
  );

  // Chuẩn bị tọa độ OSRM cho tất cả các ngày và gọi song song để tối ưu tốc độ
  const dayValidStopsList = aiResult.cac_ngay.map((d) =>
    (d.cac_chang || []).filter((c) => c.vi_do && c.kinh_do)
  );
  const dayOsrmMeta = aiResult.cac_ngay.map((_, dIdx) => {
    const validStops = dayValidStopsList[dIdx];
    let prevLast = null;
    for (let p = dIdx - 1; p >= 0; p--) {
      if (dayValidStopsList[p].length > 0) {
        const last = dayValidStopsList[p][dayValidStopsList[p].length - 1];
        prevLast = { vi_do: last.vi_do, kinh_do: last.kinh_do };
        break;
      }
    }
    const osrmInputs = [];
    const hasOriginStart = Boolean(dIdx === 0 && startOriginCoords && validStops.length > 0);
    const hasInterDayStart = Boolean(dIdx > 0 && prevLast && validStops.length > 0);
    if (hasOriginStart) {
      osrmInputs.push(startOriginCoords);
    } else if (hasInterDayStart) {
      osrmInputs.push(prevLast);
    }
    for (const s of validStops) {
      osrmInputs.push({ vi_do: s.vi_do, kinh_do: s.kinh_do });
    }
    return { osrmInputs, hasOriginStart, hasInterDayStart };
  });

  const dayOsrmRoutes = await Promise.all(
    dayOsrmMeta.map(({ osrmInputs }) =>
      osrmInputs.length >= 2 ? fetchOsrmRoute(osrmInputs) : Promise.resolve({ legs: [] })
    )
  );

  for (let dIdx = 0; dIdx < aiResult.cac_ngay.length; dIdx++) {
    const day = aiResult.cac_ngay[dIdx];
    const changs = day.cac_chang || [];
    const validStops = dayValidStopsList[dIdx];
    const { hasOriginStart, hasInterDayStart } = dayOsrmMeta[dIdx];
    const legs = dayOsrmRoutes[dIdx]?.legs || [];

    // Gán khoảng cách & thời gian di chuyển cho từng chặng có tọa độ
    let legCursor = 0;
    for (let i = 0; i < validStops.length; i++) {
      if (i === 0) {
        if ((hasOriginStart || hasInterDayStart) && legs[0]) {
          if (hasOriginStart || legs[0].distanceKm > 20) {
            validStops[0].khoang_cach_km = legs[0].distanceKm;
            validStops[0].thoi_gian_di_chuyen_phut = legs[0].durationMin;
          }
          legCursor = 1;
        }
      } else if (legs[legCursor]) {
        validStops[i].khoang_cach_km = legs[legCursor].distanceKm;
        validStops[i].thoi_gian_di_chuyen_phut = legs[legCursor].durationMin;
        legCursor++;
      }
    }

    // Giữ khung giờ linh hoạt do AI đề xuất (không ép cứng 08:00 - 20:00), chỉ dịch chuyển khi bị chồng lấn thời gian di chuyển thực tế
    const isFirstDay = dIdx === 0;
    const isLastDay = dIdx === aiResult.cac_ngay.length - 1;
    const maxAllowedEnd = isLastDay && departureMin !== null ? Math.max(10 * 60, departureMin - 60) : 23 * 60 + 30;
    let prevEndMin = null;
    for (let i = 0; i < changs.length; i++) {
      const chang = changs[i];
      const travelMin = Number(chang.thoi_gian_di_chuyen_phut || 0);
      const parsed = parseTimeRangeMinutes(chang.thoi_gian);

      let startMin = parsed?.startMin;
      let durationMin = parsed?.durationMin || 120;

      if (i === 0) {
        if (isFirstDay && arrivalMin !== null) {
          const earliestArrivalStart = arrivalMin + Math.max(15, travelMin);
          startMin = startMin != null ? Math.max(startMin, earliestArrivalStart) : earliestArrivalStart;
        } else if (startMin === undefined || startMin === null) {
          startMin = travelMin > 30 ? 7 * 60 + 30 + travelMin : 8 * 60 + 30;
        } else if (travelMin > 30) {
          startMin = Math.max(startMin, 7 * 60 + 30 + travelMin);
        }
      } else {
        const minValidStart = prevEndMin !== null ? prevEndMin + travelMin + 10 : 12 * 60;
        if (startMin === undefined || startMin === null) {
          startMin = minValidStart;
        } else {
          startMin = Math.max(startMin, minValidStart);
        }
      }

      if (isLastDay && departureMin !== null && startMin >= maxAllowedEnd - 30) {
        // Bỏ các chặng tối/muộn vượt quá giờ khởi hành về của ngày cuối
        changs.splice(i, changs.length - i);
        break;
      }

      const endMin = Math.min(maxAllowedEnd, startMin + durationMin);
      chang.thoi_gian = `${formatMinutesToHHMM(startMin)} - ${formatMinutesToHHMM(endMin)}`;
      chang.buoi = startMin < 12 * 60 ? 'sang' : startMin < 17 * 60 + 30 ? 'chieu' : 'toi';
      if (!chang.phuong_tien_di_chuyen) {
        const km = Number(chang.khoang_cach_km || 0);
        chang.phuong_tien_di_chuyen =
          km > 35 ? 'Ô tô / Xe khách / Limousine' : km > 1.5 ? 'Taxi / Xe máy' : 'Đi bộ / Xe điện';
      }
      prevEndMin = endMin;
    }

    // Gắn dự báo thời tiết tương ứng cho ngày này
    if (weatherForecasts.length > 0) {
      const dayTitleLower = (day.tieu_de_ngay || '').toLowerCase();
      const matchedWeather =
        weatherForecasts.find((w) => {
          const clean = w.tinh_thanh.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
          return dayTitleLower.includes(clean);
        }) || weatherForecasts[dIdx % weatherForecasts.length];
      const dayForecast =
        matchedWeather.du_bao_theo_ngay?.[dIdx] ||
        matchedWeather.du_bao_theo_ngay?.[0] ||
        matchedWeather.hien_tai;
      if (dayForecast) {
        day.thoi_tiet = {
          tinh_thanh: matchedWeather.tinh_thanh,
          nhiet_do: dayForecast.nhiet_do,
          nhiet_do_min: dayForecast.nhiet_do_min,
          nhiet_do_max: dayForecast.nhiet_do_max,
          mo_ta: dayForecast.mo_ta,
          do_am: dayForecast.do_am,
          gio_kmh: dayForecast.gio_kmh,
        };
      }
    }

    // Tổng hợp thống kê ngày
    day.tong_chi_phi_ngay = changs.reduce((sum, c) => sum + Number(c.chi_phi_uoc_tinh || 0), 0);
    day.tong_quang_duong_km = Math.round(
      changs.reduce((sum, c) => sum + Number(c.khoang_cach_km || 0), 0) * 10
    ) / 10;
    day.tong_thoi_gian_di_chuyen_phut = changs.reduce(
      (sum, c) => sum + Number(c.thoi_gian_di_chuyen_phut || 0),
      0
    );
  }

  aiResult.tong_quang_duong_km = Math.round(
    aiResult.cac_ngay.reduce((sum, d) => sum + Number(d.tong_quang_duong_km || 0), 0) * 10
  ) / 10;

  return aiResult;
};

// Fallback generator khi mất mạng hoặc Gemini API gặp sự cố
const generateFallbackItinerary = (provinceName, validPlaces, totalDays, budget, groupSize, interests) => {
  const cac_ngay = [];
  const placesCount = validPlaces.length;

  for (let d = 1; d <= totalDays; d++) {
    const dayPlaces = [];
    const buois = ['sang', 'chieu', 'toi'];
    const times = ['08:00 - 11:30', '14:00 - 17:30', '19:00 - 21:30'];

    for (let b = 0; b < 3; b++) {
      const pIndex = ((d - 1) * 3 + b) % Math.max(1, placesCount);
      const place = validPlaces[pIndex] || {
        id: '1',
        ten_dia_diem: `Điểm tham quan ${b + 1} tại ${provinceName}`,
        dia_chi: provinceName,
        gia_tham_quan: 50000,
        vi_do: 16.0544,
        kinh_do: 108.2022,
      };

      dayPlaces.push({
        thu_tu: b + 1,
        buoi: buois[b],
        thoi_gian: times[b],
        dia_diem_id: place.id ? place.id.toString() : '1',
        ten_dia_diem: place.ten_dia_diem || place.ten,
        hoat_dong: b === 0 
          ? `Tham quan, chụp ảnh và tìm hiểu văn hóa tại ${place.ten_dia_diem || place.ten}`
          : b === 1
          ? `Trải nghiệm các hoạt động giải trí và thưởng thức ẩm thực đặc sản`
          : `Dạo phố đêm, ngắm cảnh và thư giãn`,
        chi_phi_uoc_tinh: Number(place.gia_tham_quan || 50000) + 100000,
      });
    }

    cac_ngay.push({
      thu_tu_ngay: d,
      tieu_de_ngay: `Ngày ${d}: Khám phá các điểm đến đặc sắc tại ${provinceName}`,
      cac_chang: dayPlaces,
    });
  }

  const tongChiPhi = cac_ngay.reduce((acc, n) => {
    return acc + n.cac_chang.reduce((cAcc, c) => cAcc + (c.chi_phi_uoc_tinh || 0), 0);
  }, 0) * Number(groupSize || 1);

  const isOver = tongChiPhi > Number(budget);

  return {
    ten_lich_trinh: `Hành trình khám phá ${provinceName} ${totalDays}N${totalDays - 1 > 0 ? totalDays - 1 : 1}Đ`,
    tong_so_ngay: totalDays,
    tong_chi_phi_uoc_tinh: tongChiPhi,
    vuot_ngan_sach: isOver,
    canh_bao: isOver 
      ? `Chi phí ước tính (${tongChiPhi.toLocaleString('vi-VN')} VNĐ) vượt ngân sách dự kiến (${Number(budget).toLocaleString('vi-VN')} VNĐ).` 
      : null,
    cac_ngay,
  };
};

// @desc  Sinh lịch trình du lịch bằng Gemini AI (PB08, UI_17, UI_18)
// @route POST /api/ai/generate-itinerary
export const generateItinerary = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tinh_thanh_id,
      tinh_thanh_ids,
      tinh_thanh_names,
      ngay_bat_dau,
      ngay_ket_thuc,
      ngan_sach_du_kien,
      so_luong_nguoi,
      so_thich,
      nhip_do,
      phuong_tien,
      doi_tuong,
      luu_tru,
      diem_xuat_phat,
      gio_den_ngay_dau,
      gio_ve_ngay_cuoi,
    } = req.body;

    const rawProvinceIds =
      Array.isArray(tinh_thanh_ids) && tinh_thanh_ids.length > 0
        ? tinh_thanh_ids
        : tinh_thanh_id
        ? [tinh_thanh_id]
        : [];
    const uniqueProvinceIds = [
      ...new Set(rawProvinceIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)),
    ];
    const customProvinceNames = Array.isArray(tinh_thanh_names)
      ? [...new Set(tinh_thanh_names.map((n) => String(n || '').trim()).filter(Boolean))]
      : [];

    // 1. Kiểm tra 6 thông tin bắt buộc
    if (
      (uniqueProvinceIds.length === 0 && customProvinceNames.length === 0) ||
      !ngay_bat_dau ||
      !ngay_ket_thuc ||
      !ngan_sach_du_kien ||
      !so_luong_nguoi
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ 6 thông tin bắt buộc: Điểm đến, Ngày bắt đầu, Ngày kết thúc, Ngân sách, Số người và Sở thích.',
      });
    }

    const start = new Date(ngay_bat_dau);
    const end = new Date(ngay_ket_thuc);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải diễn ra sau hoặc trùng với ngày bắt đầu',
      });
    }

    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 14) {
      return res.status(400).json({
        success: false,
        message: 'Hệ thống hỗ trợ lập lịch trình tối đa 14 ngày cho một chuyến đi',
      });
    }

    // 2. Tra cứu các tỉnh thành được chọn (kèm tạo nhanh tỉnh mới nếu người dùng chọn tỉnh ngoài DB)
    const provinces = uniqueProvinceIds.length > 0
      ? await prisma.tinh_thanh_phos.findMany({
          where: { id: { in: uniqueProvinceIds.map((id) => BigInt(id)) } },
        })
      : [];

    for (const customName of customProvinceNames) {
      const existing = await prisma.tinh_thanh_phos.findFirst({
        where: { ten_tinh_thanh: { equals: customName, mode: 'insensitive' } },
      });
      if (existing) {
        if (!provinces.some((p) => p.id === existing.id)) {
          provinces.push(existing);
        }
      } else {
        const created = await prisma.tinh_thanh_phos.create({
          data: { ten_tinh_thanh: customName },
        });
        provinces.push(created);
      }
    }

    if (provinces.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin tỉnh/thành phố được chọn',
      });
    }
    const combinedProvinceName = provinces.map((p) => p.ten_tinh_thanh).join(', ');

    // 3. Lấy danh sách địa điểm có thật trong database thuộc các tỉnh thành này (kèm danh mục để AI lọc theo thời tiết)
    const validDestinations = await prisma.dia_diems.findMany({
      where: {
        tinh_thanh_id: { in: provinces.map((p) => p.id) },
        trang_thai: 'hien_thi',
      },
      select: {
        id: true,
        tinh_thanh_id: true,
        ten_dia_diem: true,
        mo_ta_ngan: true,
        dia_chi: true,
        gia_tham_quan: true,
        vi_do: true,
        kinh_do: true,
        anh_dai_dien: true,
        tinh_thanh: { select: { ten_tinh_thanh: true } },
        dia_diem_danh_mucs: {
          select: { danh_muc: { select: { ten_danh_muc: true } } },
        },
      },
    });

    // 3.5. Lấy dự báo thời tiết thực tế theo từng tỉnh được chọn để AI sắp xếp lịch trình hợp lý
    const { provinceCoordsMap, weatherForecasts } = await fetchWeatherContextForProvinces(
      provinces,
      validDestinations
    );

    // 4. Gọi Gemini AI để sinh lịch trình
    let aiResult;
    try {
      aiResult = await generateItineraryWithGemini({
        destinationName: combinedProvinceName,
        selectedProvinces: provinces.map((p) => p.ten_tinh_thanh),
        startDate: ngay_bat_dau,
        endDate: ngay_ket_thuc,
        budget: Number(ngan_sach_du_kien),
        groupSize: Number(so_luong_nguoi),
        interests: so_thich || '',
        preferences: {
          nhip_do,
          phuong_tien,
          doi_tuong,
          luu_tru,
          diem_xuat_phat,
          gio_den_ngay_dau,
          gio_ve_ngay_cuoi,
        },
        validDestinations,
        weatherForecasts,
      });
    } catch (aiErr) {
      console.warn('Gemini AI generation fallback:', aiErr.message);
      aiResult = generateFallbackItinerary(
        combinedProvinceName,
        validDestinations,
        diffDays,
        ngan_sach_du_kien,
        so_luong_nguoi,
        so_thich
      );
    }

    // 4.5. Gắn tọa độ, ảnh đại diện & chuẩn hóa thời gian theo lộ trình di chuyển thực tế (OSRM)
    await enrichItineraryWithRealTravelTimes(
      aiResult,
      validDestinations,
      provinceCoordsMap,
      weatherForecasts,
      { diem_xuat_phat, gio_den_ngay_dau, gio_ve_ngay_cuoi }
    );

    // 5. Lưu bản nháp vào bảng `ban_nhap_ais`
    const draft = await prisma.ban_nhap_ais.create({
      data: {
        tai_khoan_id: BigInt(userId),
        du_lieu_dau_vao: {
          tinh_thanh_id: Number(provinces[0].id),
          tinh_thanh_ids: provinces.map((p) => Number(p.id)),
          ten_tinh_thanh: combinedProvinceName,
          ngay_bat_dau,
          ngay_ket_thuc,
          ngan_sach_du_kien: Number(ngan_sach_du_kien),
          so_luong_nguoi: Number(so_luong_nguoi),
          so_thich: so_thich || '',
          nhip_do: nhip_do || '',
          phuong_tien: phuong_tien || '',
          doi_tuong: doi_tuong || '',
          luu_tru: luu_tru || '',
          diem_xuat_phat: diem_xuat_phat || '',
          gio_den_ngay_dau: gio_den_ngay_dau || '',
          gio_ve_ngay_cuoi: gio_ve_ngay_cuoi || '',
        },
        noi_dung_ket_qua: aiResult,
        trang_thai: 'hop_le',
        vuot_ngan_sach: Boolean(aiResult.vuot_ngan_sach),
      },
    });

    res.json({
      success: true,
      message: 'Tạo lịch trình du lịch bằng Gemini AI thành công',
      data: {
        ban_nhap_id: draft.id.toString(),
        vuot_ngan_sach: draft.vuot_ngan_sach,
        canh_bao: aiResult.canh_bao,
        noi_dung_lich_trinh: aiResult,
      },
    });
  } catch (error) {
    console.error('LỖI regenerateDay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// @route POST /api/ai/regenerate-day
export const regenerateDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ban_nhap_id, thu_tu_ngay } = req.body;

    if (!ban_nhap_id || !thu_tu_ngay) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ban_nhap_id và thu_tu_ngay cần tạo lại',
      });
    }

    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(ban_nhap_id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp lịch trình',
      });
    }

    const inputData = draft.du_lieu_dau_vao;
    const currentResult = draft.noi_dung_ket_qua;
    const targetDayNum = Number(thu_tu_ngay);

    // Lấy danh sách tỉnh thành & địa điểm hợp lệ (hỗ trợ 1 hoặc nhiều tỉnh thành)
    const regenProvinceIds =
      Array.isArray(inputData.tinh_thanh_ids) && inputData.tinh_thanh_ids.length > 0
        ? inputData.tinh_thanh_ids
        : [inputData.tinh_thanh_id];
    const provinces = await prisma.tinh_thanh_phos.findMany({
      where: { id: { in: regenProvinceIds.map((id) => BigInt(id)) } },
    });
    const validDestinations = await prisma.dia_diems.findMany({
      where: {
        tinh_thanh_id: { in: regenProvinceIds.map((id) => BigInt(id)) },
        trang_thai: 'hien_thi',
      },
      select: {
        id: true,
        tinh_thanh_id: true,
        ten_dia_diem: true,
        mo_ta_ngan: true,
        dia_chi: true,
        gia_tham_quan: true,
        vi_do: true,
        kinh_do: true,
        anh_dai_dien: true,
        tinh_thanh: { select: { ten_tinh_thanh: true } },
        dia_diem_danh_mucs: {
          select: { danh_muc: { select: { ten_danh_muc: true } } },
        },
      },
    });

    const { provinceCoordsMap, weatherForecasts } = await fetchWeatherContextForProvinces(
      provinces,
      validDestinations
    );

    const existingDay = (currentResult.cac_ngay || []).find((d) => d.thu_tu_ngay === targetDayNum);
    const prevStopNames = (existingDay?.cac_chang || []).map((c) => c.ten_dia_diem).filter(Boolean);
    const targetDate = new Date(inputData.ngay_bat_dau || Date.now());
    targetDate.setDate(targetDate.getDate() + Math.max(0, targetDayNum - 1));
    const targetDateStr = targetDate.toISOString().split('T')[0];

    let newDayObj = null;
    try {
      const regenAi = await generateItineraryWithGemini({
        destinationName: inputData.ten_tinh_thanh || provinces.map((p) => p.ten_tinh_thanh).join(', '),
        selectedProvinces: provinces.map((p) => p.ten_tinh_thanh),
        startDate: targetDateStr,
        endDate: targetDateStr,
        budget: Math.round(Number(inputData.ngan_sach_du_kien || 3000000) / Math.max(1, currentResult.cac_ngay?.length || 1)),
        groupSize: Number(inputData.so_luong_nguoi || 2),
        interests: `${inputData.so_thich || ''}${prevStopNames.length ? `. Đổi phương án mới khác với: ${prevStopNames.join(', ')}` : ''}`,
        preferences: {
          nhip_do: inputData.nhip_do,
          phuong_tien: inputData.phuong_tien,
          doi_tuong: inputData.doi_tuong,
          luu_tru: inputData.luu_tru,
        },
        validDestinations,
        weatherForecasts,
      });
      if (regenAi?.cac_ngay?.[0]) {
        newDayObj = {
          ...regenAi.cac_ngay[0],
          thu_tu_ngay: targetDayNum,
        };
      }
    } catch (regenErr) {
      console.warn('Regenerate day Gemini fallback:', regenErr.message);
    }

    if (!newDayObj) {
      const shuffled = [...validDestinations].sort(() => 0.5 - Math.random());
      newDayObj = {
        thu_tu_ngay: targetDayNum,
        tieu_de_ngay: `Ngày ${targetDayNum}: Khám phá điểm đến mới tại ${inputData.ten_tinh_thanh}`,
        cac_chang: [0, 1, 2].map((idx) => ({
          thu_tu: idx + 1,
          buoi: idx === 0 ? 'sang' : idx === 1 ? 'chieu' : 'toi',
          thoi_gian: idx === 0 ? '08:30 - 11:00' : idx === 1 ? '14:00 - 16:30' : '18:30 - 21:00',
          dia_diem_id: shuffled[idx]?.id ? shuffled[idx].id.toString() : null,
          ten_dia_diem: shuffled[idx]?.ten_dia_diem || `Điểm tham quan ${idx + 1} tại ${inputData.ten_tinh_thanh}`,
          dia_chi: shuffled[idx]?.dia_chi || inputData.ten_tinh_thanh,
          hoat_dong: 'Khám phá địa phương và trải nghiệm ẩm thực đặc sắc',
          luu_y: 'Kiểm tra thời tiết và giờ mở cửa trước khi khởi hành.',
          chi_phi_uoc_tinh: Number(shuffled[idx]?.gia_tham_quan || 50000) + 100000,
        })),
      };
    }

    // Thay thế ngày tương ứng và chuẩn hóa lại OSRM + thời tiết toàn lịch trình
    const updatedDays = (currentResult.cac_ngay || []).map((d) =>
      d.thu_tu_ngay === targetDayNum ? newDayObj : d
    );

    const updatedResult = {
      ...currentResult,
      cac_ngay: updatedDays,
    };

    await enrichItineraryWithRealTravelTimes(
      updatedResult,
      validDestinations,
      provinceCoordsMap,
      weatherForecasts,
      {
        diem_xuat_phat: inputData.diem_xuat_phat,
        gio_den_ngay_dau: inputData.gio_den_ngay_dau,
        gio_ve_ngay_cuoi: inputData.gio_ve_ngay_cuoi,
      }
    );

    await prisma.ban_nhap_ais.update({
      where: { id: draft.id },
      data: { noi_dung_ket_qua: updatedResult },
    });

    res.json({
      success: true,
      message: `Đã tạo lại lịch trình Ngày ${thu_tu_ngay} thành công`,
      data: {
        thu_tu_ngay: targetDayNum,
        ngay_moi: updatedResult.cac_ngay.find((d) => d.thu_tu_ngay === targetDayNum),
        tong_quang_duong_km: updatedResult.tong_quang_duong_km,
      },
    });
  } catch (error) {
    console.error('LỖI regenerateDay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Tối ưu lại toàn bộ bản nháp cho vừa ngân sách dự kiến
// @route POST /api/ai/optimize-budget
export const optimizeBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ban_nhap_id } = req.body;

    if (!ban_nhap_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ban_nhap_id cần tối ưu ngân sách',
      });
    }

    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(ban_nhap_id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp lịch trình',
      });
    }

    const inputData = draft.du_lieu_dau_vao;
    const regenProvinceIds =
      Array.isArray(inputData.tinh_thanh_ids) && inputData.tinh_thanh_ids.length > 0
        ? inputData.tinh_thanh_ids
        : [inputData.tinh_thanh_id];
    const provinces = await prisma.tinh_thanh_phos.findMany({
      where: { id: { in: regenProvinceIds.map((id) => BigInt(id)) } },
    });
    const validDestinations = await prisma.dia_diems.findMany({
      where: {
        tinh_thanh_id: { in: regenProvinceIds.map((id) => BigInt(id)) },
        trang_thai: 'hien_thi',
      },
      select: {
        id: true,
        tinh_thanh_id: true,
        ten_dia_diem: true,
        mo_ta_ngan: true,
        dia_chi: true,
        gia_tham_quan: true,
        vi_do: true,
        kinh_do: true,
        anh_dai_dien: true,
        tinh_thanh: { select: { ten_tinh_thanh: true } },
        dia_diem_danh_mucs: {
          select: { danh_muc: { select: { ten_danh_muc: true } } },
        },
      },
    });

    const { provinceCoordsMap, weatherForecasts } = await fetchWeatherContextForProvinces(
      provinces,
      validDestinations
    );

    const budget = Number(inputData.ngan_sach_du_kien || 5000000);
    const start = new Date(inputData.ngay_bat_dau);
    const end = new Date(inputData.ngay_ket_thuc);
    const diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1);

    let aiResult;
    try {
      aiResult = await generateItineraryWithGemini({
        destinationName: inputData.ten_tinh_thanh || provinces.map((p) => p.ten_tinh_thanh).join(', '),
        selectedProvinces: provinces.map((p) => p.ten_tinh_thanh),
        startDate: inputData.ngay_bat_dau,
        endDate: inputData.ngay_ket_thuc,
        budget,
        groupSize: Number(inputData.so_luong_nguoi || 2),
        interests: inputData.so_thich || '',
        preferences: {
          nhip_do: inputData.nhip_do,
          phuong_tien: inputData.phuong_tien,
          doi_tuong: inputData.doi_tuong,
          luu_tru: 'Tiết kiệm / Hostel',
          diem_xuat_phat: inputData.diem_xuat_phat,
          gio_den_ngay_dau: inputData.gio_den_ngay_dau,
          gio_ve_ngay_cuoi: inputData.gio_ve_ngay_cuoi,
          toi_uu_ngan_sach: true,
        },
        validDestinations,
        weatherForecasts,
      });
    } catch (aiErr) {
      console.warn('Optimize budget Gemini fallback:', aiErr.message);
      aiResult = generateFallbackItinerary(
        inputData.ten_tinh_thanh,
        validDestinations,
        diffDays,
        budget,
        inputData.so_luong_nguoi,
        inputData.so_thich
      );
    }

    await enrichItineraryWithRealTravelTimes(
      aiResult,
      validDestinations,
      provinceCoordsMap,
      weatherForecasts,
      {
        diem_xuat_phat: inputData.diem_xuat_phat,
        gio_den_ngay_dau: inputData.gio_den_ngay_dau,
        gio_ve_ngay_cuoi: inputData.gio_ve_ngay_cuoi,
      }
    );

    await prisma.ban_nhap_ais.update({
      where: { id: draft.id },
      data: {
        noi_dung_ket_qua: aiResult,
        vuot_ngan_sach: Boolean(aiResult.vuot_ngan_sach),
      },
    });

    res.json({
      success: true,
      message: 'Đã tối ưu lại lịch trình theo ngân sách dự kiến',
      data: {
        ban_nhap_id: draft.id.toString(),
        vuot_ngan_sach: Boolean(aiResult.vuot_ngan_sach),
        canh_bao: aiResult.canh_bao,
        noi_dung_lich_trinh: aiResult,
      },
    });
  } catch (error) {
    console.error('LỖI optimizeBudget:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Cập nhật nhanh thứ tự / danh sách chặng của 1 ngày trong bản nháp (tính lại OSRM & chi phí)
// @route PUT /api/ai/draft/:id
export const updateDraftDayStops = async (req, res) => {
  try {
    const userId = req.user.id;
    const draftId = req.params.id;
    const { thu_tu_ngay, cac_chang } = req.body;

    if (!thu_tu_ngay || !Array.isArray(cac_chang) || cac_chang.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp thu_tu_ngay và danh sách cac_chang hợp lệ (ít nhất 1 chặng)',
      });
    }

    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(draftId),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp lịch trình',
      });
    }

    const inputData = draft.du_lieu_dau_vao;
    const currentResult = draft.noi_dung_ket_qua;
    const targetDayNum = Number(thu_tu_ngay);

    const regenProvinceIds =
      Array.isArray(inputData.tinh_thanh_ids) && inputData.tinh_thanh_ids.length > 0
        ? inputData.tinh_thanh_ids
        : [inputData.tinh_thanh_id];
    const provinces = await prisma.tinh_thanh_phos.findMany({
      where: { id: { in: regenProvinceIds.map((id) => BigInt(id)) } },
    });
    const validDestinations = await prisma.dia_diems.findMany({
      where: {
        tinh_thanh_id: { in: regenProvinceIds.map((id) => BigInt(id)) },
        trang_thai: 'hien_thi',
      },
      select: {
        id: true,
        tinh_thanh_id: true,
        ten_dia_diem: true,
        mo_ta_ngan: true,
        dia_chi: true,
        gia_tham_quan: true,
        vi_do: true,
        kinh_do: true,
        anh_dai_dien: true,
        tinh_thanh: { select: { ten_tinh_thanh: true } },
      },
    });

    const { provinceCoordsMap, weatherForecasts } = await fetchWeatherContextForProvinces(
      provinces,
      validDestinations
    );

    const normalizedChangs = cac_chang.map((c, idx) => ({
      ...c,
      thu_tu: idx + 1,
    }));

    const updatedDays = (currentResult.cac_ngay || []).map((d) =>
      d.thu_tu_ngay === targetDayNum ? { ...d, cac_chang: normalizedChangs } : d
    );

    const updatedResult = {
      ...currentResult,
      cac_ngay: updatedDays,
    };

    await enrichItineraryWithRealTravelTimes(
      updatedResult,
      validDestinations,
      provinceCoordsMap,
      weatherForecasts,
      {
        diem_xuat_phat: inputData.diem_xuat_phat,
        gio_den_ngay_dau: inputData.gio_den_ngay_dau,
        gio_ve_ngay_cuoi: inputData.gio_ve_ngay_cuoi,
      }
    );

    const totalCost = updatedResult.cac_ngay.reduce(
      (sum, d) => sum + Number(d.tong_chi_phi_ngay || 0),
      0
    );
    const budget = Number(inputData.ngan_sach_du_kien || 0);
    const isOverBudget = budget > 0 && totalCost > budget;
    updatedResult.tong_chi_phi_uoc_tinh = totalCost;
    updatedResult.vuot_ngan_sach = isOverBudget;
    updatedResult.canh_bao = isOverBudget
      ? `Chi phí ước tính (${totalCost.toLocaleString('vi-VN')} VNĐ) vượt quá ngân sách dự kiến (${budget.toLocaleString('vi-VN')} VNĐ).`
      : null;

    await prisma.ban_nhap_ais.update({
      where: { id: draft.id },
      data: {
        noi_dung_ket_qua: updatedResult,
        vuot_ngan_sach: isOverBudget,
      },
    });

    res.json({
      success: true,
      message: `Đã cập nhật lại các chặng Ngày ${targetDayNum}`,
      data: {
        thu_tu_ngay: targetDayNum,
        ngay_moi: updatedResult.cac_ngay.find((d) => d.thu_tu_ngay === targetDayNum),
        tong_quang_duong_km: updatedResult.tong_quang_duong_km,
        tong_chi_phi_uoc_tinh: updatedResult.tong_chi_phi_uoc_tinh,
        vuot_ngan_sach: updatedResult.vuot_ngan_sach,
        canh_bao: updatedResult.canh_bao,
      },
    });
  } catch (error) {
    console.error('LỖI updateDraftDayStops:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Lưu bản nháp AI thành Lịch trình chính thức (PB08, UI_18 -> UI_20)
// @route POST /api/ai/save-draft
export const saveDraftToItinerary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ban_nhap_id, ten_lich_trinh } = req.body;

    if (!ban_nhap_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ban_nhap_id cần lưu',
      });
    }

    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(ban_nhap_id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp AI để lưu',
      });
    }

    const inputData = draft.du_lieu_dau_vao;
    const aiResult = draft.noi_dung_ket_qua;

    // Sử dụng Prisma Transaction với timeout 30s để đảm bảo kết nối mạng Cloud Supabase không bị ngắt
    const newTrip = await prisma.$transaction(async (tx) => {
      // 1. Tạo lịch trình chính (lich_trinhs)
      const trip = await tx.lich_trinhs.create({
        data: {
          tai_khoan_id: BigInt(userId),
          tinh_thanh_id: BigInt(inputData.tinh_thanh_id),
          ten_lich_trinh: ten_lich_trinh || aiResult.ten_lich_trinh || `Lịch trình du lịch ${inputData.ten_tinh_thanh}`,
          nguon_tao: 'ai',
          ngay_bat_dau: new Date(inputData.ngay_bat_dau),
          ngay_ket_thuc: new Date(inputData.ngay_ket_thuc),
          ngan_sach_du_kien: Number(inputData.ngan_sach_du_kien),
          so_nguoi: Number(inputData.so_luong_nguoi),
          so_thich: inputData.so_thich || '',
          tong_chi_phi_uoc_tinh: Number(aiResult.tong_chi_phi_uoc_tinh || 0),
          da_xac_nhan_vuot_ngan_sach: Boolean(draft.vuot_ngan_sach),
          phien_ban: 1,
        },
      });

      // 2. Tạo các ngày (lich_trinh_ngays) và chặng tham quan (lich_trinh_chi_tiets)
      const startDate = new Date(inputData.ngay_bat_dau);
      for (const day of (aiResult.cac_ngay || [])) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + (day.thu_tu_ngay - 1));

        const tripDay = await tx.lich_trinh_ngays.create({
          data: {
            lich_trinh_id: trip.id,
            ngay_tham_quan: dayDate,
            thu_tu_ngay: day.thu_tu_ngay,
            ghi_chu: day.tieu_de_ngay || null,
          },
        });

        // Tạo từng chặng tham quan kèm snapshot bảo vệ toàn vẹn dữ liệu
        for (const chang of (day.cac_chang || [])) {
          let diaDiemId = null;
          if (chang.dia_diem_id && !isNaN(chang.dia_diem_id) && Number(chang.dia_diem_id) > 0) {
            diaDiemId = BigInt(chang.dia_diem_id);
          }

          await tx.lich_trinh_chi_tiets.create({
            data: {
              lich_trinh_ngay_id: tripDay.id,
              dia_diem_id: diaDiemId,
              thu_tu: chang.thu_tu,
              buoi: chang.buoi || 'sang',
              thoi_gian_du_kien: chang.thoi_gian || '08:00 - 11:30',
              ten_dia_diem_luu: chang.ten_dia_diem || 'Điểm tham quan',
              dia_chi_luu: chang.dia_chi || inputData.ten_tinh_thanh,
              vi_do_luu: chang.vi_do ? Number(chang.vi_do) : null,
              kinh_do_luu: chang.kinh_do ? Number(chang.kinh_do) : null,
              chi_phi_uoc_tinh: chang.chi_phi_uoc_tinh ? Number(chang.chi_phi_uoc_tinh) : 0,
              ghi_chu: chang.hoat_dong || null,
            },
          });
        }
      }

      // 3. Cập nhật bản nháp AI liên kết với lịch trình chính
      await tx.ban_nhap_ais.update({
        where: { id: draft.id },
        data: {
          lich_trinh_goc_id: trip.id,
          trang_thai: 'da_luu',
        },
      });

      return trip;
    }, {
      maxWait: 15000,
      timeout: 45000,
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu lịch trình AI thành công vào danh sách của bạn',
      data: {
        trip_id: newTrip.id.toString(),
        ten_lich_trinh: newTrip.ten_lich_trinh,
      },
    });
  } catch (error) {
    console.error('LỖI regenerateDay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// @route GET /api/ai/draft/:id
export const getDraftById = async (req, res) => {
  try {
    const userId = req.user.id;
    const draft = await prisma.ban_nhap_ais.findFirst({
      where: {
        id: BigInt(req.params.id),
        tai_khoan_id: BigInt(userId),
      },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp AI',
      });
    }

    res.json({
      success: true,
      data: {
        id: draft.id.toString(),
        du_lieu_dau_vao: draft.du_lieu_dau_vao,
        noi_dung_ket_qua: draft.noi_dung_ket_qua,
        vuot_ngan_sach: draft.vuot_ngan_sach,
        trang_thai: draft.trang_thai,
      },
    });
  } catch (error) {
    console.error('LỖI regenerateDay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { destinationService } from '../services/destinationService';
import { tripService } from '../services/tripService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Plus,
  Trash2,
  GripVertical,
  BookmarkCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Search,
  Sun,
  Sunset,
  Moon,
  Compass,
  ArrowRight,
  Layers,
  X,
  Info
} from 'lucide-react';

// Sortable Stop Component cho từng chặng tham quan
function SortableStopCard({
  id,
  stop,
  index,
  onUpdateStop,
  onRemoveStop,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const getBuoiBadge = (buoi) => {
    if (buoi === 'sang') return { label: 'Sáng', icon: <Sun className="w-3.5 h-3.5 text-amber-500" />, bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (buoi === 'chieu') return { label: 'Chiều', icon: <Sunset className="w-3.5 h-3.5 text-orange-500" />, bg: 'bg-orange-50 text-orange-800 border-orange-200' };
    return { label: 'Tối', icon: <Moon className="w-3.5 h-3.5 text-indigo-500" />, bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
  };

  const buoiInfo = getBuoiBadge(stop.buoi);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 text-slate-400 hover:text-teal-600 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 transition"
          title="Kéo thả để sắp xếp thứ tự chặng"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Số thứ tự chặng */}
        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm mt-1">
          {index + 1}
        </div>

        {/* Ảnh đại diện chặng nếu có */}
        {stop.anh_dai_dien && (
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
            <img
              src={stop.anh_dai_dien}
              alt={stop.ten_dia_diem_luu}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Thông tin chặng & các trường chỉnh sửa */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
                {stop.ten_dia_diem_luu}
              </h4>
              {stop.dia_chi_luu && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{stop.dia_chi_luu}</span>
                </p>
              )}
            </div>

            {/* Buổi & Xóa */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={stop.buoi || 'sang'}
                onChange={(e) => onUpdateStop(index, { buoi: e.target.value })}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="sang">🌅 Buổi Sáng</option>
                <option value="chieu">🌇 Buổi Chiều</option>
                <option value="toi">🌙 Buổi Tối</option>
              </select>

              <button
                type="button"
                onClick={() => onRemoveStop(index)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Xóa chặng này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thời gian, Chi phí & Hoạt động */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Thời gian dự kiến
              </label>
              <input
                type="text"
                value={stop.thoi_gian_du_kien || ''}
                onChange={(e) => onUpdateStop(index, { thoi_gian_du_kien: e.target.value })}
                placeholder="VD: 08:00 - 11:30"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-400" />
                Chi phí ước tính (VNĐ)
              </label>
              <input
                type="number"
                step="50000"
                min="0"
                value={stop.chi_phi_uoc_tinh || 0}
                onChange={(e) => onUpdateStop(index, { chi_phi_uoc_tinh: Number(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              value={stop.ghi_chu || ''}
              onChange={(e) => onUpdateStop(index, { ghi_chu: e.target.value })}
              placeholder="Ghi chú hoạt động cá nhân (VD: Check-in chụp ảnh, thưởng thức cafe, mua quà lưu niệm...)"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManualTripCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tỉnh thành & địa điểm
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Form thông tin chung
  const [tripInfo, setTripInfo] = useState({
    ten_lich_trinh: '',
    tinh_thanh_id: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
    ngan_sach_du_kien: 5000000,
    so_nguoi: 2,
    so_thich: '',
  });

  // Cấu trúc ngày & chặng
  const [days, setDays] = useState([
    {
      thu_tu_ngay: 1,
      ngay_tham_quan: '',
      ghi_chu: 'Ngày 1: Khởi hành và khám phá các điểm nổi bật',
      cac_chang: [],
    },
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Modal thêm địa điểm từ CSDL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchModalKeyword, setSearchModalKeyword] = useState('');

  // Trạng thái lưu
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successTripId, setSuccessTripId] = useState(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Tải danh sách tỉnh thành ban đầu
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await destinationService.getProvinces();
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setProvinces(data);
          const daNang = data.find((p) => p.ten_tinh_thanh.includes('Đà Nẵng')) || data[0];
          setTripInfo((prev) => ({
            ...prev,
            tinh_thanh_id: daNang.id.toString(),
            ten_lich_trinh: `Kỳ nghỉ tự túc ${daNang.ten_tinh_thanh}`,
          }));
        }
      } catch (err) {
        console.error('Lỗi tải tỉnh thành:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();

    // Thiết lập ngày mặc định
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysLater = new Date(tomorrow);
    threeDaysLater.setDate(tomorrow.getDate() + 2);

    const startStr = tomorrow.toISOString().split('T')[0];
    const endStr = threeDaysLater.toISOString().split('T')[0];

    setTripInfo((prev) => ({
      ...prev,
      ngay_bat_dau: startStr,
      ngay_ket_thuc: endStr,
    }));

    // Khởi tạo 3 ngày mặc định
    setDays([
      {
        thu_tu_ngay: 1,
        ngay_tham_quan: startStr,
        ghi_chu: 'Ngày 1: Check-in và tham quan điểm gần trung tâm',
        cac_chang: [],
      },
      {
        thu_tu_ngay: 2,
        ngay_tham_quan: new Date(tomorrow.setDate(tomorrow.getDate() + 1)).toISOString().split('T')[0],
        ghi_chu: 'Ngày 2: Khám phá các danh thắng nổi tiếng',
        cac_chang: [],
      },
      {
        thu_tu_ngay: 3,
        ngay_tham_quan: endStr,
        ghi_chu: 'Ngày 3: Mua sắm đặc sản và dạo phố',
        cac_chang: [],
      },
    ]);
  }, []);

  // Tải danh sách địa điểm theo tỉnh thành được chọn
  useEffect(() => {
    if (!tripInfo.tinh_thanh_id) return;
    const fetchDestinations = async () => {
      setLoadingDestinations(true);
      try {
        const res = await destinationService.getDestinations({
          tinh_thanh_id: tripInfo.tinh_thanh_id,
          limit: 30,
        });
        const list = res.data?.danh_sach || res.data || [];
        setAvailableDestinations(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Lỗi tải địa điểm:', err);
      } finally {
        setLoadingDestinations(false);
      }
    };
    fetchDestinations();
  }, [tripInfo.tinh_thanh_id]);

  // Cập nhật lại số ngày khi đổi Ngày bắt đầu / kết thúc
  const handleDateChange = (field, val) => {
    const updated = { ...tripInfo, [field]: val };
    setTripInfo(updated);

    if (updated.ngay_bat_dau && updated.ngay_ket_thuc) {
      const s = new Date(updated.ngay_bat_dau);
      const e = new Date(updated.ngay_ket_thuc);
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0 && diff <= 14) {
        const newDays = [];
        for (let i = 0; i < diff; i++) {
          const d = new Date(s);
          d.setDate(s.getDate() + i);
          const existingDay = days[i];
          newDays.push({
            thu_tu_ngay: i + 1,
            ngay_tham_quan: d.toISOString().split('T')[0],
            ghi_chu: existingDay?.ghi_chu || `Ngày ${i + 1}: Lộ trình tham quan`,
            cac_chang: existingDay?.cac_chang || [],
          });
        }
        setDays(newDays);
        if (activeDayIndex >= newDays.length) setActiveDayIndex(0);
      }
    }
  };

  // Thêm 1 ngày mới thủ công
  const handleAddDay = () => {
    if (days.length >= 14) {
      alert('Tối đa 14 ngày cho một chuyến đi.');
      return;
    }
    const nextIndex = days.length + 1;
    let nextDateStr = '';
    if (tripInfo.ngay_bat_dau) {
      const d = new Date(tripInfo.ngay_bat_dau);
      d.setDate(d.getDate() + (nextIndex - 1));
      nextDateStr = d.toISOString().split('T')[0];
    }

    setDays((prev) => [
      ...prev,
      {
        thu_tu_ngay: nextIndex,
        ngay_tham_quan: nextDateStr,
        ghi_chu: `Ngày ${nextIndex}: Lộ trình tự túc`,
        cac_chang: [],
      },
    ]);
    setActiveDayIndex(days.length);
  };

  // Xóa ngày
  const handleRemoveDay = (indexToRemove) => {
    if (days.length <= 1) {
      alert('Lịch trình cần có ít nhất 1 ngày tham quan.');
      return;
    }
    const newDays = days
      .filter((_, idx) => idx !== indexToRemove)
      .map((d, idx) => ({ ...d, thu_tu_ngay: idx + 1 }));
    setDays(newDays);
    setActiveDayIndex(Math.max(0, indexToRemove - 1));
  };

  // Xử lý kéo thả sắp xếp chặng trong ngày hiện tại
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDays((prevDays) => {
      const currentDay = prevDays[activeDayIndex];
      const oldIndex = currentDay.cac_chang.findIndex(
        (c, idx) => `stop-${activeDayIndex}-${idx}` === active.id
      );
      const newIndex = currentDay.cac_chang.findIndex(
        (c, idx) => `stop-${activeDayIndex}-${idx}` === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return prevDays;

      const reorderedChangs = arrayMove(currentDay.cac_chang, oldIndex, newIndex).map(
        (c, idx) => ({ ...c, thu_tu: idx + 1 })
      );

      const updatedDays = [...prevDays];
      updatedDays[activeDayIndex] = {
        ...currentDay,
        cac_chang: reorderedChangs,
      };
      return updatedDays;
    });
  };

  // Cập nhật thông tin 1 chặng
  const handleUpdateStop = (stopIndex, updatedFields) => {
    setDays((prevDays) => {
      const currentDay = prevDays[activeDayIndex];
      const updatedChangs = [...currentDay.cac_chang];
      updatedChangs[stopIndex] = {
        ...updatedChangs[stopIndex],
        ...updatedFields,
      };
      const updatedDays = [...prevDays];
      updatedDays[activeDayIndex] = {
        ...currentDay,
        cac_chang: updatedChangs,
      };
      return updatedDays;
    });
  };

  // Xóa 1 chặng
  const handleRemoveStop = (stopIndex) => {
    setDays((prevDays) => {
      const currentDay = prevDays[activeDayIndex];
      const filtered = currentDay.cac_chang
        .filter((_, idx) => idx !== stopIndex)
        .map((c, idx) => ({ ...c, thu_tu: idx + 1 }));
      const updatedDays = [...prevDays];
      updatedDays[activeDayIndex] = {
        ...currentDay,
        cac_chang: filtered,
      };
      return updatedDays;
    });
  };

  // Thêm địa điểm từ modal vào ngày hiện tại
  const handleAddDestinationFromModal = (place) => {
    const currentDay = days[activeDayIndex];
    const newStop = {
      dia_diem_id: place.id.toString(),
      thu_tu: currentDay.cac_chang.length + 1,
      buoi: currentDay.cac_chang.length === 0 ? 'sang' : currentDay.cac_chang.length === 1 ? 'chieu' : 'toi',
      thoi_gian_du_kien: '08:30 - 11:30',
      ten_dia_diem_luu: place.ten_dia_diem,
      dia_chi_luu: place.dia_chi,
      vi_do_luu: Number(place.vi_do),
      kinh_do_luu: Number(place.kinh_do),
      anh_dai_dien: place.anh_dai_dien,
      chi_phi_uoc_tinh: place.gia_ve_trung_binh ? Number(place.gia_ve_trung_binh) : 100000,
      ghi_chu: `Tham quan ${place.ten_dia_diem}`,
    };

    setDays((prevDays) => {
      const updatedDays = [...prevDays];
      updatedDays[activeDayIndex] = {
        ...currentDay,
        cac_chang: [...currentDay.cac_chang, newStop],
      };
      return updatedDays;
    });
    setIsModalOpen(false);
  };

  // Thêm địa điểm tự do (custom stop)
  const handleAddCustomStop = () => {
    const customName = prompt('Nhập tên điểm tham quan / quán ăn tự do:');
    if (!customName || !customName.trim()) return;

    const currentDay = days[activeDayIndex];
    const newStop = {
      dia_diem_id: null,
      thu_tu: currentDay.cac_chang.length + 1,
      buoi: 'chieu',
      thoi_gian_du_kien: '14:00 - 16:30',
      ten_dia_diem_luu: customName.trim(),
      dia_chi_luu: selectedProvince?.ten_tinh_thanh || '',
      vi_do_luu: null,
      kinh_do_luu: null,
      anh_dai_dien: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
      chi_phi_uoc_tinh: 150000,
      ghi_chu: 'Tham quan và trải nghiệm tự do',
    };

    setDays((prevDays) => {
      const updatedDays = [...prevDays];
      updatedDays[activeDayIndex] = {
        ...currentDay,
        cac_chang: [...currentDay.cac_chang, newStop],
      };
      return updatedDays;
    });
  };

  // Tính tổng chi phí ước tính toàn bộ chuyến đi
  const totalEstimatedCost = useMemo(() => {
    let sum = 0;
    days.forEach((day) => {
      (day.cac_chang || []).forEach((chang) => {
        sum += Number(chang.chi_phi_uoc_tinh) || 0;
      });
    });
    return sum;
  }, [days]);

  const totalStopsCount = useMemo(() => {
    return days.reduce((acc, d) => acc + (d.cac_chang?.length || 0), 0);
  }, [days]);

  const budget = Number(tripInfo.ngan_sach_du_kien) || 0;
  const isOverBudget = budget > 0 && totalEstimatedCost > budget;

  // Xử lý gửi Form tạo lịch trình thủ công (PB20)
  const handleSaveTrip = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      alert('Vui lòng đăng nhập để lưu lịch trình của bạn.');
      navigate('/login');
      return;
    }

    if (!tripInfo.ten_lich_trinh.trim()) {
      setErrorMessage('Vui lòng nhập tên lịch trình');
      return;
    }

    if (totalStopsCount === 0) {
      setErrorMessage('Lịch trình cần có ít nhất 1 điểm dừng tham quan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ten_lich_trinh: tripInfo.ten_lich_trinh.trim(),
        tinh_thanh_id: tripInfo.tinh_thanh_id,
        ngay_bat_dau: tripInfo.ngay_bat_dau,
        ngay_ket_thuc: tripInfo.ngay_ket_thuc,
        ngan_sach_du_kien: budget,
        so_nguoi: Number(tripInfo.so_nguoi) || 1,
        so_thich: tripInfo.so_thich || '',
        danh_sach_ngay: days,
      };

      const res = await tripService.createManualTrip(payload);
      if (res.success && res.data?.trip_id) {
        setSuccessTripId(res.data.trip_id);
      } else {
        throw new Error(res.message || 'Lưu lịch trình thất bại');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi lưu lịch trình. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProvince = provinces.find((p) => p.id.toString() === tripInfo.tinh_thanh_id?.toString());

  // Lọc địa điểm trong Modal
  const filteredModalDestinations = availableDestinations.filter((d) =>
    d.ten_dia_diem.toLowerCase().includes(searchModalKeyword.toLowerCase()) ||
    (d.dia_chi && d.dia_chi.toLowerCase().includes(searchModalKeyword.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Title & Switch to AI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1.5">
              <Compass className="w-4 h-4" />
              <span>Chức năng tự thiết kế • PB20 (UI_19)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tạo lịch trình du lịch <span className="text-teal-600">Thủ công</span>
            </h1>
            <p className="mt-1 text-slate-600 text-sm sm:text-base">
              Tự do sắp xếp từng ngày, chọn các điểm đến theo sở thích và kéo thả để tối ưu lộ trình.
            </p>
          </div>

          <Link
            to="/trips/ai-create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Chuyển sang Tạo bằng Gemini AI</span>
          </Link>
        </div>

        {/* Modal Thông báo lưu thành công */}
        {successTripId && (
          <div className="mb-6 p-6 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold">Lịch trình tự tạo đã được lưu thành công!</h3>
                <p className="text-xs text-emerald-700">
                  Dữ liệu chuyến đi và các snapshot điểm dừng đã được bảo toàn trong cơ sở dữ liệu.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/trips/${successTripId}`}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition"
              >
                Xem chi tiết lịch trình
              </Link>
              <Link
                to="/my-trips"
                className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-50 transition"
              >
                Về danh sách
              </Link>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Chưa thể lưu lịch trình</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveTrip} className="space-y-8">
          {/* ======================================================== */}
          {/* SECTION 1: CÀI ĐẶT THÔNG TIN CHUYẾN ĐI */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              1. Thông tin tổng quan chuyến đi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tên chuyến đi */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tên lịch trình chuyến đi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tripInfo.ten_lich_trinh}
                  onChange={(e) => setTripInfo({ ...tripInfo, ten_lich_trinh: e.target.value })}
                  placeholder="VD: Kỳ nghỉ Đà Nẵng 3N2Đ cùng gia đình"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              {/* Tỉnh thành */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Điểm đến (Tỉnh / Thành phố) <span className="text-red-500">*</span>
                </label>
                <select
                  value={tripInfo.tinh_thanh_id}
                  onChange={(e) => setTripInfo({ ...tripInfo, tinh_thanh_id: e.target.value })}
                  disabled={loadingProvinces}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id.toString()}>
                      {prov.ten_tinh_thanh} ({prov.vung_mien || 'Việt Nam'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngân sách */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  Ngân sách dự kiến (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500000"
                    min="0"
                    value={tripInfo.ngan_sach_du_kien}
                    onChange={(e) => setTripInfo({ ...tripInfo, ngan_sach_du_kien: e.target.value })}
                    className="w-full pl-4 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Ngày bắt đầu & Ngày kết thúc */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Ngày bắt đầu khởi hành <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tripInfo.ngay_bat_dau}
                  onChange={(e) => handleDateChange('ngay_bat_dau', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Ngày kết thúc chuyến đi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tripInfo.ngay_ket_thuc}
                  onChange={(e) => handleDateChange('ngay_ket_thuc', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: CHIA NGÀY & KÉO THẢ SẮP XẾP CHẶNG (UI_19 CORE) */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  2. Thiết kế chi tiết từng ngày tham quan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn tab ngày để thêm điểm đến và kéo thả icon ⠿ để sắp xếp thứ tự các chặng.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddDay}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm 1 ngày mới</span>
              </button>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
              {days.map((day, idx) => (
                <button
                  type="button"
                  key={day.thu_tu_ngay}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shrink-0 transition flex items-center gap-2 ${
                    activeDayIndex === idx
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Ngày {day.thu_tu_ngay}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    activeDayIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {day.cac_chang?.length || 0} chặng
                  </span>
                </button>
              ))}
            </div>

            {/* Content của Ngày đang chọn */}
            {days[activeDayIndex] && (
              <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tiêu đề / Ghi chú Ngày {days[activeDayIndex].thu_tu_ngay}
                    </label>
                    <input
                      type="text"
                      value={days[activeDayIndex].ghi_chu || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDays((prev) => {
                          const updated = [...prev];
                          updated[activeDayIndex].ghi_chu = val;
                          return updated;
                        });
                      }}
                      placeholder={`VD: Ngày ${days[activeDayIndex].thu_tu_ngay}: Dạo biển và ẩm thực đêm`}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(activeDayIndex)}
                      className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition self-end sm:self-auto"
                    >
                      Xóa ngày này
                    </button>
                  )}
                </div>

                {/* Danh sách các chặng dạng Sortable DnD */}
                {days[activeDayIndex].cac_chang?.length === 0 ? (
                  <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                    <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Ngày này chưa có điểm dừng nào</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Hãy chọn từ danh mục địa điểm có sẵn của {selectedProvince?.ten_tinh_thanh || 'tỉnh thành'} hoặc thêm điểm tự do.
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={days[activeDayIndex].cac_chang.map((_, idx) => `stop-${activeDayIndex}-${idx}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {days[activeDayIndex].cac_chang.map((stop, sIdx) => (
                          <SortableStopCard
                            key={`stop-${activeDayIndex}-${sIdx}`}
                            id={`stop-${activeDayIndex}-${sIdx}`}
                            stop={stop}
                            index={sIdx}
                            onUpdateStop={handleUpdateStop}
                            onRemoveStop={handleRemoveStop}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {/* Action buttons: Thêm điểm dừng */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchModalKeyword('');
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-teal-600/20 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Chọn địa điểm tại {selectedProvince?.ten_tinh_thanh || 'CSDL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCustomStop}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm điểm đến tự do</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: TỔNG KẾT & NÚT LƯU LỊCH TRÌNH */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Thống kê chuyến đi */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Tổng số ngày</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{days.length} ngày</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Tổng số điểm dừng</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{totalStopsCount} chặng</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-500 font-medium">Tổng chi phí ước tính</span>
                  <p className="text-base font-black text-teal-700 mt-0.5">
                    {totalEstimatedCost.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <BookmarkCheck className="w-5 h-5" />
                  <span>{isSubmitting ? 'Đang lưu lịch trình...' : 'Lưu lịch trình thủ công'}</span>
                </button>
              </div>
            </div>

            {/* Cảnh báo vượt ngân sách */}
            {isOverBudget && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cảnh báo ngân sách:</strong> Chi phí ước tính ({totalEstimatedCost.toLocaleString('vi-VN')} đ) đang vượt quá ngân sách dự kiến ({budget.toLocaleString('vi-VN')} đ). Bạn vẫn có thể lưu lịch trình này bình thường.
                </span>
              </div>
            )}
          </div>
        </form>

        {/* ======================================================== */}
        {/* MODAL CHỌN ĐỊA ĐIỂM TỪ CƠ SỞ DỮ LIỆU */}
        {/* ======================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chọn địa điểm tại {selectedProvince?.ten_tinh_thanh || 'tỉnh thành'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thêm vào Ngày {days[activeDayIndex]?.thu_tu_ngay}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search in modal */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchModalKeyword}
                    onChange={(e) => setSearchModalKeyword(e.target.value)}
                    placeholder="Tìm theo tên địa điểm hoặc địa chỉ..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Destinations List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {loadingDestinations ? (
                  <div className="py-12 text-center text-xs text-slate-500">Đang tải địa điểm...</div>
                ) : filteredModalDestinations.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Không tìm thấy địa điểm phù hợp trong cơ sở dữ liệu.
                  </div>
                ) : (
                  filteredModalDestinations.map((place) => (
                    <div
                      key={place.id}
                      className="p-3 sm:p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-sm bg-white flex items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={
                              place.anh_dai_dien ||
                              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300'
                            }
                            alt={place.ten_dia_diem}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {place.ten_dia_diem}
                          </h4>
                          {place.dia_chi && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {place.dia_chi}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {place.gia_ve_trung_binh ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                ~{Number(place.gia_ve_trung_binh).toLocaleString('vi-VN')} đ
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Miễn phí vé vào</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddDestinationFromModal(place)}
                        className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 transition"
                      >
                        + Thêm vào ngày
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  MapPin,
  Navigation,
  GripVertical,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Clock,
  Milestone,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import mapService from '../services/mapService';
import destinationService from '../services/destinationService';

// Fix icon mặc định của Leaflet trong môi trường Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component tự động căn chỉnh khung hình theo danh sách tọa độ
function MapAutoBounds({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [Number(c.vi_do), Number(c.kinh_do)]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coordinates, map]);
  return null;
}

// Custom Marker Icon với số thứ tự
const createCustomMarkerIcon = (number, isStart = false) => {
  const bgClass = isStart ? 'bg-amber-500' : 'bg-teal-600';
  const label = isStart ? '★' : number;
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${isStart ? '#F59E0B' : '#0D9488'};
        border: 2px solid white;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Item có thể kéo thả (Sortable Item)
function SortableStopItem({ id, stop, index, onRemove }) {
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
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-white rounded-xl border transition-all flex items-center gap-3 ${
        isDragging
          ? 'border-teal-500 shadow-lg scale-102 opacity-90'
          : 'border-slate-200 hover:border-teal-300 shadow-xs'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 shrink-0"
        title="Kéo thả để đổi chặng"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 truncate">{stop.ten_dia_diem}</p>
        <p className="text-[11px] text-slate-400 truncate">{stop.dia_chi || 'Đà Nẵng'}</p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(stop.id)}
        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition shrink-0"
        title="Xóa khỏi lộ trình"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function MapRoutePage() {
  // Điểm xuất phát mặc định (Đà Nẵng)
  const [startPoint, setStartPoint] = useState({
    id: 'start_point',
    ten_dia_diem: 'Khách sạn Sông Hàn',
    dia_chi: 'Bạch Đằng, Hải Châu, Đà Nẵng',
    vi_do: 16.0718,
    kinh_do: 108.2231,
  });

  // Preset điểm xuất phát phổ biến
  const startPresets = [
    { ten_dia_diem: 'Khách sạn Sông Hàn', dia_chi: 'Bạch Đằng, Đà Nẵng', vi_do: 16.0718, kinh_do: 108.2231 },
    { ten_dia_diem: 'Sân bay Quốc tế Đà Nẵng', dia_chi: 'Hòa Thuận Tây, Đà Nẵng', vi_do: 16.0538, kinh_do: 108.2022 },
    { ten_dia_diem: 'Ga Đà Nẵng', dia_chi: 'Hải Phòng, Đà Nẵng', vi_do: 16.0694, kinh_do: 108.2125 },
    { ten_dia_diem: 'Bãi biển Mỹ Khê', dia_chi: 'Võ Nguyên Giáp, Đà Nẵng', vi_do: 16.0592, kinh_do: 108.2467 },
  ];

  // Danh sách các điểm dừng tham quan
  const [stops, setStops] = useState([]);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [returnToStart, setReturnToStart] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [showLegs, setShowLegs] = useState(true);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Tải danh sách địa điểm mẫu từ DB để người dùng dễ chọn
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await destinationService.getDestinations({ limit: 20 });
        if (res.success && res.data) {
          setAvailableDestinations(res.data);
          // Mặc định chọn trước 3 địa điểm nổi tiếng
          if (stops.length === 0 && res.data.length >= 3) {
            setStops(res.data.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Lỗi nạp địa điểm:', err);
      }
    };
    fetchPlaces();
  }, []);

  // Tự động tính toán lại lộ trình khi danh sách điểm dừng thay đổi
  useEffect(() => {
    if (stops.length >= 1) {
      handleCalculateRoute();
    }
  }, [stops, returnToStart, startPoint]);

  // Xử lý kéo thả xong
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex((i) => i.id.toString() === active.id.toString());
        const newIndex = items.findIndex((i) => i.id.toString() === over.id.toString());
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Thêm điểm dừng
  const handleAddStop = (dest) => {
    if (stops.some((s) => s.id.toString() === dest.id.toString())) {
      alert('Địa điểm này đã có trong lộ trình của bạn!');
      return;
    }
    if (stops.length >= 10) {
      alert('Lộ trình chỉ hỗ trợ tối đa 10 điểm dừng mỗi ngày.');
      return;
    }
    setStops((prev) => [...prev, dest]);
    setShowAddModal(false);
  };

  // Xóa điểm dừng
  const handleRemoveStop = (id) => {
    setStops((prev) => prev.filter((s) => s.id.toString() !== id.toString()));
  };

  // Tính toán lộ trình theo thứ tự hiện tại
  const handleCalculateRoute = async () => {
    if (stops.length === 0) return;
    try {
      const fullList = [
        startPoint,
        ...stops,
        ...(returnToStart ? [{ ...startPoint, id: 'return_point', ten_dia_diem: `Quay lại: ${startPoint.ten_dia_diem}` }] : []),
      ];
      const res = await mapService.calculateRoute({ danh_sach_dia_diem: fullList });
      if (res.success && res.data) {
        setRouteResult(res.data);
      }
    } catch (err) {
      console.error('Lỗi tính toán lộ trình:', err);
    }
  };

  // Tự động tối ưu hóa thứ tự tham quan bằng thuật toán TSP
  const handleOptimizeTSP = async () => {
    if (stops.length < 2) {
      alert('Vui lòng chọn ít nhất 2 điểm dừng để hệ thống tối ưu hóa!');
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await mapService.optimizeRoute({
        diem_xuat_phat: startPoint,
        danh_sach_dia_diem: stops,
        quay_ve_diem_xuat_phat: returnToStart,
      });

      if (res.success && res.data) {
        setRouteResult(res.data);
        // Cập nhật lại thứ tự stops trên giao diện (loại bỏ điểm xuất phát ở đầu và cuối)
        const reordered = res.data.lo_trinh.filter(
          (p) => p.id !== 'start_point' && p.id !== 'return_point'
        );
        setStops(reordered);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi tối ưu hóa lộ trình');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Chuẩn bị danh sách tọa độ Polyline cho Leaflet
  const polylinePositions = useMemo(() => {
    if (!routeResult) return [];
    // Nếu có geometry GeoJSON từ OSRM (lưu ý GeoJSON là [lon, lat], Leaflet cần [lat, lon])
    if (routeResult.geometry && routeResult.geometry.coordinates) {
      return routeResult.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
    }
    // Fallback: nối thẳng các điểm dừng
    if (routeResult.lo_trinh) {
      return routeResult.lo_trinh.map((p) => [Number(p.vi_do), Number(p.kinh_do)]);
    }
    return [];
  }, [routeResult]);

  // Tất cả các điểm để căn chỉnh bounds
  const allMapPoints = useMemo(() => {
    return [
      startPoint,
      ...stops,
      ...(returnToStart ? [startPoint] : []),
    ];
  }, [startPoint, stops, returnToStart]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      
      {/* Top Banner Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-2xs z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">
              Bản Đồ Lộ Trình & Tối Ưu Quãng Đường
            </h1>
            <p className="text-xs text-slate-500">
              Sắp xếp thứ tự tham quan tối ưu · Kéo thả đổi chặng linh hoạt · Tối đa 10 điểm/ngày
            </p>
          </div>
        </div>

        {/* Nút tối ưu nhanh */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOptimizeTSP}
            disabled={isOptimizing || stops.length < 2}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isOptimizing ? 'Đang tối ưu hóa...' : 'Tối ưu lộ trình'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Control Panel + Right Map */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* PANEL TRÁI: Nhập điểm xuất phát & Quản lý điểm dừng (kéo thả) */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shadow-sm shrink-0 z-10">
          <div className="p-4 overflow-y-auto flex-1 space-y-5">
            
            {/* 1. Điểm xuất phát (Khách sạn/Nhà ga/Sân bay) */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Điểm xuất phát (Ngày 1)</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Khởi hành
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={startPoint.ten_dia_diem}
                  onChange={(e) => setStartPoint({ ...startPoint, ten_dia_diem: e.target.value })}
                  placeholder="Nhập điểm xuất phát..."
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* Presets gợi ý nhanh */}
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Gợi ý địa điểm khởi hành nhanh:</p>
                <div className="flex flex-wrap gap-1.5">
                  {startPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStartPoint({ ...preset, id: 'start_point' })}
                      className="px-2 py-1 rounded-lg bg-white border border-amber-200 hover:border-amber-400 text-[11px] text-amber-900 font-medium transition cursor-pointer"
                    >
                      {preset.ten_dia_diem}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Danh sách điểm dừng (Kéo thả @dnd-kit) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Các điểm tham quan ({stops.length}/10)
                  </h3>
                  <p className="text-[11px] text-slate-500">Giữ chuột để kéo thả sắp xếp thứ tự chặng</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  disabled={stops.length >= 10}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm điểm</span>
                </button>
              </div>

              {stops.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-2">
                  <Milestone className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Chưa có địa điểm tham quan nào trong hành trình.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="text-teal-600 font-bold hover:underline"
                  >
                    Bấm vào đây để thêm địa điểm
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={stops.map((s) => s.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {stops.map((stop, idx) => (
                        <SortableStopItem
                          key={stop.id.toString()}
                          id={stop.id.toString()}
                          stop={stop}
                          index={idx}
                          onRemove={handleRemoveStop}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* 3. Tùy chọn vòng khép kín (Round-trip) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={returnToStart}
                  onChange={(e) => setReturnToStart(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span>Quay về điểm xuất phát khi kết thúc ngày</span>
              </label>
            </div>

            {/* 4. Tổng kết hành trình (Summary Card) */}
            {routeResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-teal-800 pb-2">
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    Thông số hành trình OSRM
                  </span>
                  <span className="text-[11px] text-teal-200 font-mono">
                    {stops.length + (returnToStart ? 2 : 1)} điểm dừng
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-[11px] text-teal-200">Tổng quãng đường</p>
                    <p className="text-xl font-black text-amber-300 mt-0.5">
                      {routeResult.tong_quang_duong_km} <span className="text-xs font-normal">km</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-[11px] text-teal-200">Thời gian di chuyển</p>
                    <p className="text-xl font-black text-white mt-0.5">
                      {routeResult.tong_thoi_gian_phut} <span className="text-xs font-normal">phút</span>
                    </p>
                  </div>
                </div>

                {/* Chi tiết từng chặng (Legs) */}
                {routeResult.cac_chang && routeResult.cac_chang.length > 0 && (
                  <div className="pt-2 border-t border-teal-800/80">
                    <button
                      type="button"
                      onClick={() => setShowLegs(!showLegs)}
                      className="w-full flex items-center justify-between text-xs text-teal-200 hover:text-white font-medium"
                    >
                      <span>Chi tiết {routeResult.cac_chang.length} chặng di chuyển</span>
                      {showLegs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showLegs && (
                      <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1 text-[11px] text-slate-300">
                        {routeResult.cac_chang.map((leg, idx) => (
                          <div key={idx} className="p-1.5 bg-black/20 rounded-lg flex items-center justify-between">
                            <span className="truncate max-w-[190px]">
                              {idx + 1}. {leg.from} → {leg.to}
                            </span>
                            <span className="text-amber-300 font-mono shrink-0">
                              {leg.distance_km} km
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PANEL PHẢI: Bản đồ Leaflet tương tác */}
        <div className="flex-1 relative h-full">
          <MapContainer
            center={[16.0718, 108.2231]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Tự động fit bounds khi lộ trình thay đổi */}
            <MapAutoBounds coordinates={allMapPoints} />

            {/* Đường lộ trình Polyline */}
            {polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#0D9488',
                  weight: 5,
                  opacity: 0.85,
                  lineJoin: 'round',
                }}
              />
            )}

            {/* Marker Điểm xuất phát */}
            <Marker
              position={[Number(startPoint.vi_do), Number(startPoint.kinh_do)]}
              icon={createCustomMarkerIcon(0, true)}
            >
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <p className="font-bold text-amber-700 uppercase">★ Điểm xuất phát</p>
                  <p className="font-semibold text-slate-900">{startPoint.ten_dia_diem}</p>
                  <p className="text-slate-500">{startPoint.dia_chi}</p>
                </div>
              </Popup>
            </Marker>

            {/* Markers các điểm tham quan */}
            {stops.map((stop, idx) => (
              <Marker
                key={stop.id.toString()}
                position={[Number(stop.vi_do), Number(stop.kinh_do)]}
                icon={createCustomMarkerIcon(idx + 1, false)}
              >
                <Popup>
                  <div className="text-xs font-sans space-y-1.5 min-w-[160px]">
                    <div className="flex items-center gap-1 text-teal-700 font-bold">
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>Chặng tham quan {idx + 1}</span>
                    </div>
                    {stop.anh_dai_dien && (
                      <img
                        src={stop.anh_dai_dien}
                        alt={stop.ten_dia_diem}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    )}
                    <p className="font-bold text-slate-900 text-sm">{stop.ten_dia_diem}</p>
                    <p className="text-slate-500 text-[11px]">{stop.dia_chi || 'Đà Nẵng'}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Modal Chọn Thêm Điểm Tham Quan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chọn địa điểm thêm vào hành trình</h3>
                <p className="text-xs text-slate-500">Danh sách các điểm đến có tọa độ chuẩn tại Đà Nẵng</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {availableDestinations.map((dest) => {
                const isSelected = stops.some((s) => s.id.toString() === dest.id.toString());
                return (
                  <div
                    key={dest.id}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-teal-400 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={dest.anh_dai_dien || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200'}
                        alt={dest.ten_dia_diem}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{dest.ten_dia_diem}</p>
                        <p className="text-[11px] text-slate-400 truncate">{dest.dia_chi || dest.tinh_thanh?.ten_tinh_thanh}</p>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                          {dest.gia_tham_quan > 0 ? `${Number(dest.gia_tham_quan).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => handleAddStop(dest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        isSelected
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs'
                      }`}
                    >
                      {isSelected ? 'Đã thêm' : 'Chọn'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

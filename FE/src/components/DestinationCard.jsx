import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import favoriteService from '../services/favoriteService';

export default function DestinationCard({ destination, onToggleFavorite, isFavorite = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favActive, setFavActive] = useState(isFavorite);

  useEffect(() => {
    setFavActive(isFavorite);
  }, [isFavorite]);

  if (!destination) return null;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (onToggleFavorite) {
      onToggleFavorite(destination.id);
    } else {
      const nextState = !favActive;
      setFavActive(nextState);
      try {
        await favoriteService.toggleFavorite(destination.id);
      } catch (err) {
        setFavActive(!nextState); // Rollback on error
      }
    }
  };

  const formattedPrice = destination.gia_tham_quan > 0
    ? `${Number(destination.gia_tham_quan).toLocaleString('vi-VN')} đ`
    : 'Miễn phí';

  const defaultImg = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';

  return (
    <div
      onClick={() => navigate(`/destinations/${destination.id}`)}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-300 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
        <img
          src={destination.anh_dai_dien || defaultImg}
          alt={destination.ten_dia_diem}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = defaultImg;
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Province Pill (Top Left) */}
        {destination.tinh_thanh?.ten_tinh_thanh && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-xs font-semibold shadow-xs">
            <MapPin className="w-3 h-3 text-teal-400" />
            <span>{destination.tinh_thanh.ten_tinh_thanh}</span>
          </div>
        )}

        {/* Featured Badge */}
        {destination.noi_bat && (
          <div className="absolute top-3 left-auto right-12 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
            <Sparkles className="w-3 h-3" />
            <span>Nổi bật</span>
          </div>
        )}

        {/* Favorite Button (Top Right) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={favActive ? 'Bỏ thích' : 'Yêu thích'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs ${
            favActive
              ? 'bg-rose-500 text-white scale-110 shadow-rose-500/30 shadow-md'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${favActive ? 'fill-current' : ''}`} />
        </button>

        {/* Price Tag (Bottom Left Overlay) */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-teal-600/90 backdrop-blur-md text-white text-xs font-bold shadow-xs">
            {formattedPrice}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Categories */}
          {destination.danh_mucs && destination.danh_mucs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {destination.danh_mucs.slice(0, 2).map((dm) => (
                <span
                  key={dm.id}
                  className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-medium border border-teal-100"
                >
                  {dm.ten_danh_muc}
                </span>
              ))}
              {destination.danh_mucs.length > 2 && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                  +{destination.danh_mucs.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3
            className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 text-base"
            title={destination.ten_dia_diem}
          >
            {destination.ten_dia_diem}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {destination.mo_ta_ngan || destination.dia_chi || 'Điểm đến du lịch hấp dẫn không thể bỏ lỡ tại Việt Nam.'}
          </p>
        </div>

        {/* Footer: Rating & Link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{destination.diem_danh_gia_tb || 4.8}</span>
            <span className="text-slate-400 font-normal">
              ({destination.so_danh_gia || 12} đánh giá)
            </span>
          </div>

          <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
            Chi tiết &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}

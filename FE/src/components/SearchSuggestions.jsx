import React from 'react';
import { MapPin, Tag, Compass } from 'lucide-react';

const TYPE_META = {
  province: { icon: MapPin, badge: 'Tỉnh / Thành', badgeClass: 'bg-teal-50 text-teal-700' },
  category: { icon: Tag, badge: 'Danh mục', badgeClass: 'bg-amber-50 text-amber-700' },
  destination: { icon: Compass, badge: 'Địa điểm', badgeClass: 'bg-sky-50 text-sky-700' },
};

export default function SearchSuggestions({ items = [], visible = false, onSelect }) {
  if (!visible || items.length === 0) return null;

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 text-left max-h-80 overflow-y-auto"
    >
      {items.map((item) => {
        const isString = typeof item === 'string';
        const label = isString ? item : item.label;
        const type = isString ? 'province' : item.type || 'province';
        const meta = TYPE_META[type] || TYPE_META.province;
        const Icon = meta.icon;
        const key = isString ? item : `${type}-${item.id || item.label}`;

        return (
          <li key={key}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="w-full px-4 py-2.5 text-sm text-slate-800 hover:bg-teal-50 hover:text-teal-700 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-medium truncate">{label}</span>
              </span>
              {!isString && item.type && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${meta.badgeClass}`}>
                  {meta.badge}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

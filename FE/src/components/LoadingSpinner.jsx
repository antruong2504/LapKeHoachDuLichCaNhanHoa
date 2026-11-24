import React from 'react';

export default function LoadingSpinner({ text = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

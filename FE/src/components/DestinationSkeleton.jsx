import React from 'react';

export default function DestinationSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse flex flex-col"
        >
          {/* Image skeleton */}
          <div className="relative aspect-4/3 w-full bg-slate-200">
            {/* Top badges placeholder */}
            <div className="absolute top-3 left-3 w-20 h-6 bg-slate-300 rounded-full" />
            <div className="absolute top-3 right-3 w-8 h-8 bg-slate-300 rounded-full" />
            <div className="absolute bottom-3 left-3 w-24 h-6 bg-slate-300 rounded-lg" />
          </div>

          {/* Content skeleton */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
              {/* Category tags */}
              <div className="flex gap-2">
                <div className="w-16 h-5 bg-slate-200 rounded-md" />
                <div className="w-20 h-5 bg-slate-200 rounded-md" />
              </div>
              {/* Title */}
              <div className="w-4/5 h-6 bg-slate-200 rounded-md" />
              {/* Address / summary */}
              <div className="w-full h-4 bg-slate-100 rounded-md" />
              <div className="w-2/3 h-4 bg-slate-100 rounded-md" />
            </div>

            {/* Bottom rating & detail link */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="w-20 h-4 bg-slate-200 rounded-md" />
              <div className="w-16 h-4 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

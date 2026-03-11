// frontend/src/components/LoadingSpinner/LoadingSpinner.jsx
import React from 'react';

const sizeMap = {
  small: 'h-8 w-8',
  medium: 'h-14 w-14',
  large: 'h-20 w-20',
};

const LoadingSpinner = ({ size = 'medium', message = 'กำลังโหลด...' }) => {
  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 animate-in fade-in duration-500">
      {/* ── Modern Dual-Ring Glowing Spinner ── */}
      <div className={`relative flex items-center justify-center ${spinnerSize}`}>

        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-sky-400/30 rounded-full blur-xl animate-pulse" />

        {/* Outer Background Track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200/50 shadow-inner" />

        {/* Primary Outer Ring (Fast Spin) */}
        <div className="absolute inset-0 rounded-full border-[3px] border-sky-500 border-r-transparent animate-[spin_1s_cubic-bezier(0.5,0,0.5,1)_infinite]" />

        {/* Secondary Inner Ring (Slow Reverse Spin) */}
        <div className="absolute inset-2.5 rounded-full border-[3px] border-indigo-400 border-l-transparent animate-[spin_1.5s_linear_infinite_reverse] opacity-80" />

        {/* Center Core dot */}
        <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
      </div>

      {/* ── Typography & Dots ── */}
      {message && (
        <div className="flex flex-col items-center gap-2.5 text-center mt-2">
          <p className="text-sm font-bold text-slate-700 tracking-wide">
            {message}
          </p>

          {/* Animated 3 Dots */}
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-[bounce_1s_infinite_-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-[bounce_1s_infinite_-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_0s]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
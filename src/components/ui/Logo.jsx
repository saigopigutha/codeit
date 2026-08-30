import React from 'react';

export default function Logo({ size = 'md', subtitle }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className="flex items-center gap-2 select-none">
      <div className={`flex items-center justify-center font-mono font-bold rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-orange-500 ${isSm ? 'w-7 h-7 text-xs' : isLg ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'}`}>
        &lt;/&gt;
      </div>
      <div>
        <div className={`font-bold tracking-tight text-white flex items-center gap-1 ${isSm ? 'text-base' : isLg ? 'text-2xl' : 'text-lg'}`}>
          <span>codeit</span>
        </div>
        {subtitle && (
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

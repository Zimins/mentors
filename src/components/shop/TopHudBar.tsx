'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopHudBar() {
  const pathname = usePathname();
  const isRoomRoute = pathname?.startsWith('/room');

  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 md:px-10 bg-[#060913]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between">
      <Link
        href="/"
        className="text-lg font-extrabold tracking-tight text-white hover:opacity-85 transition-opacity"
      >
        Mentors
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/room"
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
            isRoomRoute
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.3)]'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-400/35'
          }`}
        >
          🧪 Room Standalone Test
        </Link>
      </div>
    </header>
  );
}

export default TopHudBar;

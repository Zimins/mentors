'use client';

import React from 'react';
import Link from 'next/link';

export function TopHudBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 md:px-10 bg-[#060913]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between">
      <Link
        href="/"
        className="text-lg font-extrabold tracking-tight text-white hover:opacity-85 transition-opacity"
      >
        Mentors
      </Link>
    </header>
  );
}

export default TopHudBar;

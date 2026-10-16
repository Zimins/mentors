'use client';

import React from 'react';
import Link from 'next/link';

export function TopHudBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-14 px-6 md:px-10 bg-[#060913]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white hover:opacity-85 transition-opacity"
      >
        <img
          src="/logo.png"
          alt="Mentors Logo"
          className="w-7 h-7 object-contain shrink-0"
        />
        <span>Mentors</span>
      </Link>
    </header>
  );
}

export default TopHudBar;

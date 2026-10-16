'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiveAvatar } from '@/components/avatar/RiveAvatar';
import {
  ArrowRight,
  ChevronDown,
  Hash,
  Play,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

interface HoneycombCell {
  id: string;
  baseMentorId: string;
  name: string;
  roleTitle: string;
  subject: string;
  shortTag: string;
  rivFile: string;
  accentColor: string;
  secondaryColor: string;
  discBackground: string;
  baseX: number;
  baseY: number;
  dist: number;
  ringScale: number;
}

const CUSTOM_CHARACTER_OPTIONS = [
  { label: 'Prof. Jun', riv: '/riv/jun.riv', color: '#38bdf8' },
  { label: 'Mina', riv: '/riv/mina.riv', color: '#34d399' },
  { label: 'Bolt', riv: '/riv/bolt.riv', color: '#6366f1' },
  { label: 'Ms. Han', riv: '/riv/ms-han.riv', color: '#f59e0b' },
  { label: 'Coach Pen', riv: '/riv/coach-pen.riv', color: '#ec4899' },
  { label: 'Sora', riv: '/riv/sora.riv', color: '#a855f7' },
  { label: 'Nabi', riv: '/riv/nabi.riv', color: '#f97316' },
  { label: 'Mong', riv: '/riv/mong.riv', color: '#14b8a6' },
];

// Vibrant Mentos-like circular candy palettes
const WATCH_DISC_PALETTES = [
  'radial-gradient(circle at 35% 28%, #ffffff 0%, #f1f5f9 72%, #cbd5e1 100%)',
  'radial-gradient(circle at 35% 28%, #fb923c 0%, #f97316 68%, #c2410c 100%)',
  'radial-gradient(circle at 35% 28%, #60a5fa 0%, #2563eb 68%, #1e3a8a 100%)',
  'radial-gradient(circle at 35% 28%, #4ade80 0%, #22c55e 68%, #15803d 100%)',
  'radial-gradient(circle at 35% 28%, #fb7185 0%, #f43f5e 68%, #be123c 100%)',
  'radial-gradient(circle at 35% 28%, #fde047 0%, #eab308 70%, #a16207 100%)',
  'radial-gradient(circle at 35% 28%, #a78bfa 0%, #7c3aed 68%, #4c1d95 100%)',
  'radial-gradient(circle at 35% 28%, #2dd4bf 0%, #0d9488 68%, #115e59 100%)',
  'radial-gradient(circle at 35% 28%, #38bdf8 0%, #0284c7 68%, #0c4a6e 100%)',
  'radial-gradient(circle at 35% 28%, #f472b6 0%, #db2777 68%, #831843 100%)',
];

// Helper to preview the curriculum channels a mentor will teach once enrolled
function getPreviewCurriculumForSubject(subject: string, shortTag: string): string[] {
  const s = `${subject} ${shortTag}`.toLowerCase();
  if (s.includes('architecture') || s.includes('kernel') || s.includes('cs')) {
    return [
      '01-pointers-and-stack-heap',
      '02-cpu-cache-hierarchy',
      '03-virtual-memory-and-tlb',
      '04-concurrency-and-locks',
    ];
  }
  if (s.includes('data') || s.includes('deep') || s.includes('vision') || s.includes('ml')) {
    return [
      '01-gradient-descent-foundations',
      '02-multi-head-attention',
      '03-embeddings-and-vector-space',
      '04-backprop-optimization',
    ];
  }
  if (s.includes('quantum') || s.includes('robot') || s.includes('gpu') || s.includes('cuda')) {
    return [
      '01-superposition-and-qubits',
      '02-quantum-entanglement-gates',
      '03-kinematics-and-control',
      '04-parallel-warp-execution',
    ];
  }
  if (s.includes('math') || s.includes('calc') || s.includes('discrete')) {
    return [
      '01-eigenvalues-and-linear-maps',
      '02-fourier-harmonics',
      '03-combinatorics-graph-proofs',
      '04-vector-fields-and-pdes',
    ];
  }
  if (s.includes('algo') || s.includes('shader') || s.includes('design')) {
    return [
      '01-shortest-path-and-search',
      '02-dynamic-programming-patterns',
      '03-real-time-rendering-math',
      '04-distributed-cache-architecture',
    ];
  }
  if (s.includes('neuro') || s.includes('bio') || s.includes('protein')) {
    return [
      '01-synaptic-action-potentials',
      '02-neurotransmitter-signaling',
      '03-protein-folding-dynamics',
      '04-hebbian-memory-networks',
    ];
  }
  if (s.includes('sec') || s.includes('pwn') || s.includes('network')) {
    return [
      '01-tls-zero-trust-handshake',
      '02-stack-frame-defense',
      '03-packet-routing-topology',
      '04-memory-safety-audits',
    ];
  }
  return [
    '01-distributed-raft-consensus',
    '02-b-tree-and-lsm-storage',
    '03-global-mesh-load-balancing',
    '04-fault-tolerant-replication',
  ];
}

// Mentor catalog cycling the 8 expressive .riv files
const HONEYCOMB_CATALOG: Array<
  Omit<HoneycombCell, 'id' | 'baseX' | 'baseY' | 'dist' | 'ringScale' | 'discBackground'>
> = [
  {
    baseMentorId: 'cs-professor',
    name: 'Prof. Jun',
    roleTitle: 'Systems & Architecture',
    subject: 'Computer Architecture, Pointers & Memory Hierarchy',
    shortTag: 'CS & Systems',
    rivFile: '/riv/jun.riv',
    accentColor: '#38bdf8',
    secondaryColor: '#0284c7',
  },
  {
    baseMentorId: 'data-scientist',
    name: 'Mina',
    roleTitle: 'AI & Deep Learning',
    subject: 'Neural Networks, Attention & Representation Learning',
    shortTag: 'AI & ML',
    rivFile: '/riv/mina.riv',
    accentColor: '#34d399',
    secondaryColor: '#059669',
  },
  {
    baseMentorId: 'quantum-physicist',
    name: 'Bolt',
    roleTitle: 'Quantum & Robotics',
    subject: 'Quantum Superposition, Entanglement & Control Systems',
    shortTag: 'Quantum',
    rivFile: '/riv/bolt.riv',
    accentColor: '#6366f1',
    secondaryColor: '#4338ca',
  },
  {
    baseMentorId: 'math-olympiad',
    name: 'Ms. Han',
    roleTitle: 'Linear Algebra & Math',
    subject: 'Linear Transformations, Eigenvalues & Proof Strategy',
    shortTag: 'Pure Math',
    rivFile: '/riv/ms-han.riv',
    accentColor: '#f59e0b',
    secondaryColor: '#b45309',
  },
  {
    baseMentorId: 'graphics-shader',
    name: 'Coach Pen',
    roleTitle: 'Algorithms & Systems',
    subject: 'Graph Search, Dynamic Programming & System Design',
    shortTag: 'Algorithms',
    rivFile: '/riv/coach-pen.riv',
    accentColor: '#ec4899',
    secondaryColor: '#be185d',
  },
  {
    baseMentorId: 'neuro-biologist',
    name: 'Sora',
    roleTitle: 'Neuroscience & Bio',
    subject: 'Synaptic Transmission, Action Potentials & Proteins',
    shortTag: 'Bio & Neuro',
    rivFile: '/riv/sora.riv',
    accentColor: '#a855f7',
    secondaryColor: '#7e22ce',
  },
  {
    baseMentorId: 'cyber-security',
    name: 'Nabi',
    roleTitle: 'Cybersecurity & Net',
    subject: 'Zero-Trust Handshakes, Packet Routing & Exploit Defense',
    shortTag: 'Security',
    rivFile: '/riv/nabi.riv',
    accentColor: '#f97316',
    secondaryColor: '#c2410c',
  },
  {
    baseMentorId: 'cloud-architect',
    name: 'Mong',
    roleTitle: 'Distributed Cloud',
    subject: 'Raft Consensus, Kubernetes & Global Service Mesh',
    shortTag: 'Cloud Mesh',
    rivFile: '/riv/mong.riv',
    accentColor: '#14b8a6',
    secondaryColor: '#0f766e',
  },
  {
    baseMentorId: 'cs-professor',
    name: 'Prof. Jun',
    roleTitle: 'OS Kernel Mentor',
    subject: 'Virtual Memory, Page Tables & Kernel Scheduling',
    shortTag: 'OS Kernel',
    rivFile: '/riv/jun.riv',
    accentColor: '#38bdf8',
    secondaryColor: '#0284c7',
  },
  {
    baseMentorId: 'data-scientist',
    name: 'Mina',
    roleTitle: 'Applied ML Mentor',
    subject: 'Model Diagnostics, Fine-Tuning & Evaluation',
    shortTag: 'Applied ML',
    rivFile: '/riv/mina.riv',
    accentColor: '#34d399',
    secondaryColor: '#059669',
  },
  {
    baseMentorId: 'quantum-physicist',
    name: 'Bolt',
    roleTitle: 'GPU Systems Mentor',
    subject: 'CUDA Warps & Parallel Memory Banks',
    shortTag: 'CUDA & GPU',
    rivFile: '/riv/bolt.riv',
    accentColor: '#6366f1',
    secondaryColor: '#4338ca',
  },
  {
    baseMentorId: 'math-olympiad',
    name: 'Ms. Han',
    roleTitle: 'Calculus & PDEs',
    subject: 'Vector Fields & Differential Equations',
    shortTag: 'Vector Calc',
    rivFile: '/riv/ms-han.riv',
    accentColor: '#f59e0b',
    secondaryColor: '#b45309',
  },
  {
    baseMentorId: 'graphics-shader',
    name: 'Coach Pen',
    roleTitle: 'Architecture Coach',
    subject: 'High-Throughput Distributed Caches',
    shortTag: 'System Design',
    rivFile: '/riv/coach-pen.riv',
    accentColor: '#ec4899',
    secondaryColor: '#be185d',
  },
  {
    baseMentorId: 'neuro-biologist',
    name: 'Sora',
    roleTitle: 'Cognitive Science',
    subject: 'Memory Consolidation & Hebbian Learning',
    shortTag: 'Neuroscience',
    rivFile: '/riv/sora.riv',
    accentColor: '#a855f7',
    secondaryColor: '#7e22ce',
  },
  {
    baseMentorId: 'cyber-security',
    name: 'Nabi',
    roleTitle: 'Binary Security',
    subject: 'ROP Chains & Stack Canary Defense',
    shortTag: 'Pwn & Reverse',
    rivFile: '/riv/nabi.riv',
    accentColor: '#f97316',
    secondaryColor: '#c2410c',
  },
  {
    baseMentorId: 'cloud-architect',
    name: 'Mong',
    roleTitle: 'Database Internals',
    subject: 'B+ Trees, LSM Trees & WAL Recovery',
    shortTag: 'DB Internals',
    rivFile: '/riv/mong.riv',
    accentColor: '#14b8a6',
    secondaryColor: '#0f766e',
  },
];

export function WatchHoneycomb() {
  const router = useRouter();
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);
  const [selectedPitchCell, setSelectedPitchCell] =
    useState<HoneycombCell | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Mentos Candy Flip-In state: starts false (showing pure colorful Mentos candy discs)
  // then flips 180deg in a radial wave to reveal the mentors!
  const [isMentosFlipped, setIsMentosFlipped] = useState(false);

  // Automatic Random Mentor Spotlight (especially for mobile where there is no mouse cursor)
  const [spotlightCellId, setSpotlightCellId] = useState<string | null>(null);

  // Subtle drag pan + pointer proximity magnification (desktop mouse)
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);

  // Custom Mentor Builder Form State
  const [customName, setCustomName] = useState('Dr. Nova');
  const [customRole, setCustomRole] = useState('Personal Adaptive Mentor');
  const [customSubject, setCustomSubject] = useState(
    'Distributed Systems & Architecture'
  );
  const [customRivChoice, setCustomRivChoice] = useState('/riv/jun.riv');
  const [customColor, setCustomColor] = useState('#38bdf8');
  const [diagLevel, setDiagLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('intermediate');

  // Detect mobile vs desktop viewport and trigger the Mentos candy flip animation on entry
  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);

    // Hold the colorful Mentos candy layout briefly on initial entry, then flip each candy over
    const flipTimer = setTimeout(() => {
      setIsMentosFlipped(true);
    }, 320);

    return () => {
      window.removeEventListener('resize', updateViewport);
      clearTimeout(flipTimer);
    };
  }, []);

  // Desktop Apple Watch Hexagonal Honeycomb Lattice with comfortable breathing room
  const desktopHoneycombCells: HoneycombCell[] = useMemo(() => {
    const pool = HONEYCOMB_CATALOG;
    const hexSpacingX = 172;
    const hexSpacingY = 148;
    const rawPoints: Array<{ x: number; y: number; dist: number }> = [];

    for (let row = -3; row <= 3; row++) {
      const isOddRow = Math.abs(row) % 2 === 1;
      for (let col = -5; col <= 5; col++) {
        const x = col * hexSpacingX + (isOddRow ? hexSpacingX * 0.5 : 0);
        const y = row * hexSpacingY;

        // Generous elliptical exclusion zone in the exact center so the title & CTA buttons have breathing room
        const normX = x / 325;
        const normY = y / 215;
        if (normX * normX + normY * normY < 1.0) {
          continue;
        }

        const dist = Math.hypot(x, y);
        if (dist > 820) continue;

        rawPoints.push({ x, y, dist });
      }
    }

    rawPoints.sort((a, b) => a.dist - b.dist);

    return rawPoints.map((pt, idx) => {
      const template = pool[idx % pool.length];
      const discBackground =
        WATCH_DISC_PALETTES[idx % WATCH_DISC_PALETTES.length];
      const ringScale = Math.max(0.72, Math.min(1.04, 1.14 - pt.dist / 1750));

      return {
        id: `cell-${idx}-${template.baseMentorId}`,
        ...template,
        discBackground,
        baseX: pt.x,
        baseY: pt.y,
        dist: pt.dist,
        ringScale,
      };
    });
  }, []);

  // Mobile Apple Watch Honeycomb Lattice: rich, prominent mentor cluster framing the mobile hero
  const mobileHoneycombCells: HoneycombCell[] = useMemo(() => {
    const pool = HONEYCOMB_CATALOG;
    const hexSpacingX = 94;
    const hexSpacingY = 82;
    const rawPoints: Array<{ x: number; y: number; dist: number }> = [];

    for (let row = -3; row <= 3; row++) {
      if (Math.abs(row) <= 1) continue;
      const isOddRow = Math.abs(row) % 2 === 1;
      const minCol = isOddRow ? -2 : -2;
      const maxCol = isOddRow ? 1 : 2;

      for (let col = minCol; col <= maxCol; col++) {
        const x = col * hexSpacingX + (isOddRow ? hexSpacingX * 0.5 : 0);
        // Keep within mobile screen width while framing the hero copy cleanly
        if (Math.abs(x) > 165) continue;
        const y = row * hexSpacingY + (row > 0 ? 34 : -34);
        const dist = Math.hypot(x, y);
        rawPoints.push({ x, y, dist });
      }
    }

    rawPoints.sort((a, b) => a.dist - b.dist);

    return rawPoints.map((pt, idx) => {
      const template = pool[idx % pool.length];
      const discBackground =
        WATCH_DISC_PALETTES[idx % WATCH_DISC_PALETTES.length];
      const ringScale = Math.abs(pt.y) > 225 ? 0.9 : 1.02;

      return {
        id: `mcell-${idx}-${template.baseMentorId}`,
        ...template,
        discBackground,
        baseX: pt.x,
        baseY: pt.y,
        dist: pt.dist,
        ringScale,
      };
    });
  }, []);

  const activeCells = isMobileViewport
    ? mobileHoneycombCells
    : desktopHoneycombCells;

  // Randomly highlight a mentor every 2.4s when no mouse cursor is hovering (essential on mobile!)
  useEffect(() => {
    if (!isMentosFlipped || activeCells.length === 0) return;

    // Pick candidates that are well inside the viewport so the highlighted mentor + label never clip
    const spotlightCandidates = activeCells.filter((cell) =>
      isMobileViewport
        ? Math.abs(cell.baseX) <= 125 && Math.abs(cell.baseY) <= 235
        : Math.abs(cell.baseX) <= 460 && Math.abs(cell.baseY) <= 280
    );
    const pool =
      spotlightCandidates.length > 0 ? spotlightCandidates : activeCells;

    // Immediately pick an initial spotlight mentor once flipped
    setSpotlightCellId((prev) => {
      if (prev && pool.some((c) => c.id === prev)) return prev;
      return pool[Math.floor(Math.random() * pool.length)]?.id ?? null;
    });

    const interval = setInterval(() => {
      setSpotlightCellId((prev) => {
        const available =
          pool.length > 1 ? pool.filter((c) => c.id !== prev) : pool;
        const chosen =
          available[Math.floor(Math.random() * available.length)] || pool[0];
        return chosen ? chosen.id : null;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isMentosFlipped, activeCells, isMobileViewport]);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: panOffset.x,
      panY: panOffset.y,
      moved: false,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      setPointerPos({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }

    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragStartRef.current.moved = true;
    }
    setPanOffset({
      x: Math.max(-95, Math.min(95, dragStartRef.current.panX + dx * 0.5)),
      y: Math.max(-65, Math.min(65, dragStartRef.current.panY + dy * 0.5)),
    });
  };

  const handleStagePointerUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      if (dragStartRef.current) {
        dragStartRef.current.moved = false;
      }
    }, 0);
  };

  const handleSelectCell = (cell: HoneycombCell) => {
    if (dragStartRef.current?.moved) return;
    setIsEnrolling(false);
    setSelectedPitchCell(cell);
  };

  const handleEnrollMentor = (cell: HoneycombCell) => {
    setIsEnrolling(true);
    const params = new URLSearchParams({
      name: cell.name,
      role: cell.roleTitle,
      subject: cell.subject,
      color: cell.accentColor,
      riv: cell.rivFile,
    });
    setTimeout(() => {
      router.push(`/mentor/${cell.baseMentorId}?${params.toString()}`);
    }, 420);
  };

  const handleTryDemo = () => {
    router.push('/mentor/cs-professor?demo=true');
  };

  const handleCreateCustomMentor = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      name: customName.trim() || 'My Mentor',
      role: customRole.trim() || 'Personal Adaptive Mentor',
      subject: customSubject.trim() || 'Computer Science & Systems',
      color: customColor,
      riv: customRivChoice,
    });
    router.push(`/mentor/custom?${params.toString()}`);
  };

  const scrollToStorySection = () => {
    const el = document.getElementById('why-mentors');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const previewChannels = selectedPitchCell
    ? getPreviewCurriculumForSubject(
        selectedPitchCell.subject,
        selectedPitchCell.shortTag
      )
    : [];

  // Active virtual focus point: either the desktop mouse pointer OR the randomly spotlighted mentor cell
  const activeSpotlightCell =
    !pointerPos && !hoveredCellId && !selectedPitchCell && spotlightCellId
      ? activeCells.find((c) => c.id === spotlightCellId) ?? null
      : null;

  const effectiveFocusPos = pointerPos
    ? pointerPos
    : activeSpotlightCell
    ? { x: activeSpotlightCell.baseX, y: activeSpotlightCell.baseY }
    : null;

  return (
    <div className="min-h-screen w-full bg-black text-[#f5f5f7] overflow-x-hidden selection:bg-sky-500/30">
      {/* Main Page Content Wrapper (transform only applied while enrolling so fixed modals stay viewport-centered) */}
      <div
        className={`w-full transition-all duration-500 ${
          isEnrolling
            ? 'scale-[1.03] opacity-0 blur-sm'
            : 'opacity-100'
        }`}
      >
        {/* =====================================================================
            HERO SECTION: MENTOS-FLIP APPLE WATCH HONEYCOMB LAUNCHER
           ===================================================================== */}
        <section
          ref={stageRef}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerLeave={() => {
            setIsDragging(false);
            setPointerPos(null);
          }}
          className="relative h-[calc(100dvh-3.5rem)] min-h-[620px] w-full overflow-hidden bg-black flex flex-col items-center justify-center select-none touch-pan-y"
        >
          {/* HONEYCOMB BUBBLE CLUSTER WITH 3D MENTOS CANDY FLIP REVEAL */}
          <div className="pointer-events-none absolute inset-0">
            {activeCells.map((cell, idx) => {
              const isHovered = hoveredCellId === cell.id;
              const isSelected = selectedPitchCell?.id === cell.id;
              const isSpotlight = activeSpotlightCell?.id === cell.id;
              const isHighlighted = isHovered || isSelected || isSpotlight;

              const baseX = cell.baseX + (isMobileViewport ? 0 : panOffset.x);
              const baseY = cell.baseY + (isMobileViewport ? 0 : panOffset.y);

              // Apple Watch Cursor-Proximity OR Mobile Random Spotlight Magnification + radial neighbor push
              let proximityScale = 1;
              let pushX = 0;
              let pushY = 0;

              if (effectiveFocusPos) {
                const dx = baseX - effectiveFocusPos.x;
                const dy = baseY - effectiveFocusPos.y;
                const dist = Math.hypot(dx, dy);
                const radius = isMobileViewport ? 175 : 260;

                if (dist < radius) {
                  const t = 1 - dist / radius;
                  const smoothT = t * t * (3 - 2 * t);
                  proximityScale =
                    1 + smoothT * (isMobileViewport ? 0.28 : 0.34);

                  if (dist > 6) {
                    const pushMag =
                      (1 - t) * smoothT * (isMobileViewport ? 14 : 18);
                    pushX = (dx / dist) * pushMag;
                    pushY = (dy / dist) * pushMag;
                  }
                }
              }

              const finalX = baseX + pushX;
              const finalY = baseY + pushY;
              const finalScale =
                cell.ringScale *
                proximityScale *
                (isHovered || isSelected ? 1.1 : isSpotlight ? 1.08 : 1);

              const avatarSize = isMobileViewport ? 82 : 108;
              // Snappy staggered radial flip delay so Mentos discs flip outward smoothly without lag
              const flipDelayMs = Math.min(340, idx * 9);
              const riveMountDelayMs = Math.min(180, Math.floor(idx / 6) * 18);

              return (
                <div
                  key={cell.id}
                  style={{
                    transform: `translate3d(${finalX.toFixed(
                      1
                    )}px, ${finalY.toFixed(1)}px, 0) scale(${finalScale.toFixed(
                      3
                    )})`,
                    zIndex: isHighlighted
                      ? 50
                      : proximityScale > 1.12
                      ? 35
                      : 15,
                  }}
                  className={`pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform ${
                    pointerPos
                      ? 'transition-transform duration-150 ease-out'
                      : 'transition-transform duration-500 ease-out'
                  }`}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredCellId(cell.id)}
                    onMouseLeave={() => setHoveredCellId(null)}
                    onClick={() => handleSelectCell(cell)}
                    aria-label={`${cell.name} - ${cell.shortTag}`}
                    style={{ perspective: '900px' }}
                    className="group relative flex items-center justify-center rounded-full focus:outline-none cursor-pointer active:scale-95 transition-transform"
                  >
                    {/* 3D Flip Container: Front = Mentos Candy Disc, Back = Mentor Face */}
                    <div
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        transformStyle: 'preserve-3d',
                        transition: `transform 520ms cubic-bezier(0.22, 1, 0.36, 1) ${flipDelayMs}ms, box-shadow 350ms ease`,
                        transform: isMentosFlipped
                          ? 'rotateY(180deg)'
                          : 'rotateY(0deg)',
                        boxShadow: isHighlighted
                          ? `0 0 0 3px #ffffff, 0 0 28px ${cell.accentColor}cc, 0 14px 36px rgba(0,0,0,0.85)`
                          : `0 0 0 2px ${cell.accentColor}77, 0 8px 22px rgba(0,0,0,0.75)`,
                      }}
                      className="relative rounded-full"
                    >
                      {/* FRONT FACE (0deg): Tactile Glossy Mentos Candy Disc */}
                      <div
                        style={{
                          background: cell.discBackground,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                        className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center"
                      >
                        {/* Mentos 3D Glossy Specular Highlight & Rim */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full"
                          style={{
                            background:
                              'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.12) 34%, rgba(0,0,0,0.22) 100%)',
                            boxShadow:
                              'inset 0 3px 6px rgba(255,255,255,0.6), inset 0 -5px 10px rgba(0,0,0,0.35)',
                          }}
                        />
                      </div>

                      {/* BACK FACE (180deg): Expressive Mentor Face revealed after flip */}
                      <div
                        style={{
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                        className="absolute inset-0 rounded-full overflow-hidden"
                      >
                        <RiveAvatar
                          rivSrc={cell.rivFile}
                          state={isHighlighted ? 'talking' : 'idle'}
                          accentColor={cell.accentColor}
                          secondaryColor={cell.secondaryColor}
                          discBackground={cell.discBackground}
                          size={avatarSize}
                          mentorName={cell.name}
                          stateMachineName="Character"
                          loadDelayMs={riveMountDelayMs}
                        />
                        {/* Glossy Mentos-colored inner rim over the Rive canvas edge so mentors stand out vividly */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full z-20"
                          style={{
                            boxShadow: isHighlighted
                              ? `inset 0 0 0 3.5px ${cell.accentColor}, inset 0 2px 8px rgba(255,255,255,0.5)`
                              : `inset 0 0 0 2.5px ${cell.accentColor}99, inset 0 2px 5px rgba(255,255,255,0.28)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Floating pill label shown on hover OR when randomly spotlighted on mobile/idle */}
                    {(isHovered || isSpotlight) && (
                      <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 z-50 px-2.5 py-0.5 rounded-full bg-slate-950/95 border border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.9)] whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: cell.accentColor }}
                        />
                        <span className="text-[10px] font-bold text-white">
                          {cell.name}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: cell.accentColor }}
                        >
                          {cell.shortTag}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

        {/* WINDOW-CENTERED HERO TITLE, DESCRIPTION & TWO MAIN BUTTONS */}
        <div className="relative z-40 max-w-lg w-full mx-auto px-5 text-center pointer-events-auto">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
            Proactive Mentors
            <span className="block mt-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Tailored to Your Level
            </span>
          </h1>

          <p className="mt-3 text-xs sm:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
            Tap any mentor around you. They speak first, diagnose your exact
            level of understanding, and guide you through a personalized
            curriculum step by step.
          </p>

          {/* Main Start Buttons: Try Demo & Meet My Own */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTryDemo}
              className="min-w-[144px] sm:min-w-[160px] inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-slate-950 bg-sky-400 hover:bg-sky-300 shadow-[0_8px_24px_rgba(56,189,248,0.35)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950" />
              <span>Try Demo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMeetModalOpen(true)}
              className="min-w-[144px] sm:min-w-[160px] inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
              <span>Meet My Own</span>
            </button>
          </div>
        </div>

        {/* Minimal Scroll Cue at Bottom of Hero */}
        <button
          type="button"
          onClick={scrollToStorySection}
          aria-label="Scroll down to explore Mentors"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-1.5 text-xs font-medium text-[#86868b] hover:text-white transition-colors cursor-pointer"
        >
          <span>Discover Mentors</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </section>

      {/* =====================================================================
          APPLE.COM EDITORIAL SHOWCASE + VISUAL SCHEMATICS & LIVE MENTOR NODES
         ===================================================================== */}
      <div id="why-mentors" className="relative z-30 bg-black">
        {/* -------------------------------------------------------------------
            01. WHY A MENTOR, NOT JUST A TEACHER (PROACTIVE LEVEL DIAGNOSIS SCHEMATIC)
           ------------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 pt-28 sm:pt-36 pb-24 sm:pb-32">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
            Why a Mentor, Not a Teacher
          </p>
          <h2 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.035em] text-[#f5f5f7] leading-[1.04]">
            A teacher waits for questions.{' '}
            <span className="text-[#86868b]">
              A mentor reads your level and speaks first.
            </span>
          </h2>
          <p className="mt-8 max-w-3xl text-lg sm:text-2xl text-[#86868b] leading-relaxed font-normal">
            Most learners don&apos;t know what they don&apos;t know. Instead of
            handing you a static syllabus or waiting passively for prompts, your
            Mentor initiates the conversation, diagnoses your current depth in
            real time, and reshapes every curriculum channel to fit your exact
            pace.
          </p>

          {/* VISUAL SCHEMATIC 01: 3-STAGE PROACTIVE DIAGNOSTIC PIPELINE */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Live Architectural Schematic · Proactive Level Calibration
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 mr-1">Simulate Level:</span>
                {(
                  [
                    { id: 'beginner', label: 'Lv.1 Intuition', color: '#34d399' },
                    { id: 'intermediate', label: 'Lv.2 Systems', color: '#38bdf8' },
                    { id: 'advanced', label: 'Lv.3 Kernel', color: '#a855f7' },
                  ] as const
                ).map((lv) => (
                  <button
                    key={lv.id}
                    type="button"
                    onClick={() => setDiagLevel(lv.id)}
                    className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer ${
                      diagLevel === lv.id
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-white/[0.04]'
                    }`}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Node Horizontal Flow Diagram with Live RiveAvatar */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
              {/* STAGE 1: PROACTIVE MENTOR INITIATION NODE */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="relative flex items-center gap-4">
                  <div className="relative">
                    {/* Radar Pulse Rings around Live Mentor */}
                    <span className="pointer-events-none absolute -inset-3 rounded-full border border-sky-400/30 animate-ping opacity-30" />
                    <span className="pointer-events-none absolute -inset-1.5 rounded-full border border-sky-400/40" />
                    <RiveAvatar
                      rivSrc="/riv/jun.riv"
                      state="talking"
                      accentColor="#38bdf8"
                      secondaryColor="#0284c7"
                      discBackground={WATCH_DISC_PALETTES[2]}
                      size={88}
                      mentorName="Prof. Jun"
                      stateMachineName="Character"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      01 · Speaks First
                    </div>
                    <div className="text-lg font-bold text-white">
                      Prof. Jun
                    </div>
                    <div className="text-xs text-[#86868b]">
                      Proactive Diagnostic Probe
                    </div>
                  </div>
                </div>

                {/* Speech Signal Callout */}
                <div className="mt-4 pl-0 lg:pl-3 border-l-0 lg:border-l-2 border-sky-400/40 text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  &ldquo;Before we start—when you pass a large struct in C, what
                  happens to the stack frame?&rdquo;
                </div>
              </div>

              {/* SVG CONNECTOR ARROW 1 */}
              <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                <svg
                  viewBox="0 0 64 24"
                  className="w-16 h-6 text-sky-400/70 overflow-visible"
                >
                  <line
                    x1="0"
                    y1="12"
                    x2="54"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <polygon points="52,7 62,12 52,17" fill="currentColor" />
                </svg>
              </div>

              {/* STAGE 2: REAL-TIME LEVEL RADAR & SPECTRUM GAUGE */}
              <div className="lg:col-span-3 flex flex-col justify-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2">
                  02 · Live Depth Radar
                </div>
                <div className="text-base font-bold text-white">
                  {diagLevel === 'beginner'
                    ? 'Diagnosed: Visual Intuition (38%)'
                    : diagLevel === 'intermediate'
                    ? 'Diagnosed: Systems Mental Model (74%)'
                    : 'Diagnosed: Kernel & ABI Mastery (94%)'}
                </div>

                {/* Spectrum Bar Schematic */}
                <div className="mt-3 relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 transition-all duration-500"
                    style={{
                      width:
                        diagLevel === 'beginner'
                          ? '38%'
                          : diagLevel === 'intermediate'
                          ? '74%'
                          : '94%',
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                  <span className={diagLevel === 'beginner' ? 'text-emerald-400' : ''}>
                    Analogy
                  </span>
                  <span className={diagLevel === 'intermediate' ? 'text-sky-400' : ''}>
                    Architecture
                  </span>
                  <span className={diagLevel === 'advanced' ? 'text-purple-400' : ''}>
                    Assembly
                  </span>
                </div>
              </div>

              {/* SVG CONNECTOR ARROW 2 (BRANCHING) */}
              <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                <svg
                  viewBox="0 0 64 64"
                  className="w-16 h-16 text-indigo-400/70 overflow-visible"
                >
                  <path
                    d="M 0 32 C 28 32, 28 10, 56 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 0 32 L 56 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 0 32 C 28 32, 28 54, 56 54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx="56" cy="10" r="3" fill="#34d399" />
                  <circle cx="56" cy="32" r="3" fill="#38bdf8" />
                  <circle cx="56" cy="54" r="3" fill="#a855f7" />
                </svg>
              </div>

              {/* STAGE 3: ADAPTIVE #CHANNEL CURRICULUM TREE */}
              <div className="lg:col-span-3 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  03 · Tailored #Channels
                </div>
                {[
                  {
                    ch: '01-pointers-and-stack-heap',
                    desc:
                      diagLevel === 'beginner'
                        ? 'Visualizing memory boxes & addresses'
                        : diagLevel === 'intermediate'
                        ? 'Stack frame layout & heap fragmentation'
                        : 'RSP/RBP register calling conventions',
                    color: '#34d399',
                  },
                  {
                    ch: '02-cpu-cache-hierarchy',
                    desc:
                      diagLevel === 'beginner'
                        ? 'Why nearby data loads 100x faster'
                        : diagLevel === 'intermediate'
                        ? '64-byte cache lines & spatial locality'
                        : 'MESI coherence & false sharing stalls',
                    color: '#38bdf8',
                  },
                  {
                    ch: '03-virtual-memory-and-tlb',
                    desc:
                      diagLevel === 'beginner'
                        ? 'How every app gets its own private map'
                        : diagLevel === 'intermediate'
                        ? 'Multi-level page tables & TLB misses'
                        : 'HugePages, CR3 switches & PCID tags',
                    color: '#a855f7',
                  },
                ].map((item) => (
                  <div
                    key={item.ch}
                    className="flex items-start gap-2.5 py-1.5 border-b border-white/[0.07] last:border-b-0"
                  >
                    <Hash
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {item.ch}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            02. HUMAN EDUCATOR MONITORING & PROFESSIONAL FEEDBACK (DUAL-LOOP DIAGRAM)
           ------------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 py-24 sm:py-32 border-t border-white/10">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Human-in-the-Loop Supervision
          </p>
          <h2 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.035em] text-[#f5f5f7] leading-[1.04]">
            Guided by AI.{' '}
            <span className="text-[#86868b]">
              Watched over by real human teachers.
            </span>
          </h2>
          <p className="mt-8 max-w-3xl text-lg sm:text-2xl text-[#86868b] leading-relaxed font-normal">
            You are never left alone with an automated system. Experienced human
            educators monitor your learning trajectory, review your diagnostic
            checkpoints, and step in to deliver deeper, professional feedback
            whenever nuance matters most.
          </p>

          {/* VISUAL SCHEMATIC 02: AI MENTOR <-> HUMAN EDUCATOR DUAL-LOOP TELEMETRY */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center">
              {/* LEFT NODE: AI MENTOR (24/7 ADAPTIVE DIALOGUE) */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="flex items-center gap-4">
                  <RiveAvatar
                    rivSrc="/riv/mina.riv"
                    state="talking"
                    accentColor="#34d399"
                    secondaryColor="#10b981"
                    discBackground={WATCH_DISC_PALETTES[3]}
                    size={84}
                    mentorName="Mina"
                    stateMachineName="Character"
                  />
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-sky-400">
                      Instant Loop · AI Mentor
                    </span>
                    <div className="text-xl font-bold text-white mt-0.5">
                      Mina · Deep Learning
                    </div>
                    <div className="text-xs text-[#86868b]">
                      1:1 Socratic pacing & live quizzes
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs sm:text-sm text-[#86868b] leading-relaxed">
                  Handles immediate Socratic questioning, interactive 3D
                  visualizations, and diagnostic checkpoints with zero latency.
                </p>
              </div>

              {/* CENTER SVG DUAL-LOOP SIGNAL BRIDGE */}
              <div className="lg:col-span-3 flex flex-col items-center justify-center py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-1">
                   Hesitation & Progress Telemetry ➔
                </div>
                <svg
                  viewBox="0 0 220 56"
                  className="w-full max-w-[220px] h-14 overflow-visible"
                >
                  {/* Top forward arc: AI -> Human */}
                  <path
                    d="M 12 20 Q 110 -6 208 20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.75"
                    strokeDasharray="5 4"
                  />
                  <polygon points="204,15 214,21 203,24" fill="#38bdf8" />

                  {/* Bottom return arc: Human -> Student Thread */}
                  <path
                    d="M 208 36 Q 110 62 12 36"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1.75"
                  />
                  <polygon points="16,31 6,35 15,41" fill="#34d399" />

                  <circle cx="110" cy="28" r="4" fill="#f5f5f7" />
                </svg>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mt-1">
                  ⬅ Verified Expert Coaching Note
                </div>
              </div>

              {/* RIGHT NODE: REAL HUMAN TEACHER SUPERVISOR */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-end text-center lg:text-right">
                <div className="flex flex-row lg:flex-row-reverse items-center gap-4">
                  <div className="relative">
                    <RiveAvatar
                      rivSrc="/riv/ms-han.riv"
                      state="happy"
                      accentColor="#f59e0b"
                      secondaryColor="#d97706"
                      discBackground={WATCH_DISC_PALETTES[1]}
                      size={84}
                      mentorName="Ms. Han"
                      stateMachineName="Character"
                    />
                    <span className="absolute -bottom-1 right-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
                      Human Lead
                    </span>
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      Supervisory Loop · Human Educator
                    </span>
                    <div className="text-xl font-bold text-white mt-0.5">
                      Senior Instructor Review
                    </div>
                    <div className="text-xs text-[#86868b]">
                       spots subtle blind spots & sends deep feedback
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs sm:text-sm text-[#86868b] leading-relaxed">
                  Reviews your diagnostic trajectory across channels and steps in
                  with personalized architectural critiques when deeper insight
                  is needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            03. PREVIEW FEATURES: CUSTOM MENTOR BLUEPRINT & GROUP CONSTELLATION
           ------------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 py-24 sm:py-36 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            {/* PREVIEW 1: BUILD & DEPLOY YOUR OWN MENTOR + INTERACTIVE PERSONA SCHEMATIC */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                <span>Preview</span>
                <span className="text-white/25">·</span>
                <span className="text-[#86868b]">Creator Studio</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-[#f5f5f7] leading-[1.08]">
                Create and deploy your own Mentor.
              </h2>

              <p className="mt-5 text-base sm:text-xl text-[#86868b] leading-relaxed">
                Shape a custom mentor persona with your own curriculum channels,
                diagnostic criteria, and domain expertise—then share a single
                link so anyone can enroll and learn at their level.
              </p>

              {/* VISUAL SCHEMATIC 03A: MENTOR BLUEPRINT SYNTHESIS DIAGRAM */}
              <div className="mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* 3 Blueprint Inputs */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="font-semibold">Custom #Channels</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="font-semibold">Diagnostic Rubric</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-semibold">Mentor Persona</span>
                    </div>
                  </div>

                  {/* Converging SVG Lines */}
                  <svg
                    viewBox="0 0 56 72"
                    className="w-12 h-16 text-white/30 shrink-0 overflow-visible"
                  >
                    <path
                      d="M 0 12 C 28 12, 28 36, 52 36"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 0 36 L 52 36"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 0 60 C 28 60, 28 36, 52 36"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Live Previewable Custom Mentor Node */}
                  <div className="flex items-center gap-3.5">
                    <RiveAvatar
                      rivSrc={customRivChoice}
                      state="talking"
                      accentColor={customColor}
                      discBackground={WATCH_DISC_PALETTES[6]}
                      size={84}
                      mentorName={customName}
                      stateMachineName="Character"
                    />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Live Persona
                      </div>
                      <div className="text-sm font-bold text-white">
                        {
                          CUSTOM_CHARACTER_OPTIONS.find(
                            (o) => o.riv === customRivChoice
                          )?.label ?? 'Custom'
                        }
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {CUSTOM_CHARACTER_OPTIONS.slice(0, 4).map((opt) => (
                          <button
                            key={opt.riv}
                            type="button"
                            onClick={() => {
                              setCustomRivChoice(opt.riv);
                              setCustomColor(opt.color);
                            }}
                            title={`Preview ${opt.label}`}
                            style={{ backgroundColor: opt.color }}
                            className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                              customRivChoice === opt.riv
                                ? 'scale-125 ring-2 ring-white'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setIsMeetModalOpen(true)}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                >
                  <span>Build a custom Mentor in Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PREVIEW 2: LIVE GROUP SESSIONS + MULTI-LEARNER CONSTELLATION SCHEMATIC */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                <span>Preview</span>
                <span className="text-white/25">·</span>
                <span className="text-[#86868b]">Collaborative Learning</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-[#f5f5f7] leading-[1.08]">
                Learn together in Group Sessions.
              </h2>

              <p className="mt-5 text-base sm:text-xl text-[#86868b] leading-relaxed">
                Bring classmates or teammates into a shared curriculum channel.
                Your Mentor facilitates group discussions, calibrates questions
                across participants, and keeps everyone progressing together.
              </p>

              {/* VISUAL SCHEMATIC 03B: MULTI-LEARNER CONSTELLATION HUB */}
              <div className="mt-10 pt-8 border-t border-white/10">
                <div className="relative h-44 w-full max-w-md flex items-center justify-center">
                  {/* Orbital SVG Lines connecting Lead Mentor to 3 Learners */}
                  <svg
                    viewBox="0 0 360 170"
                    className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
                  >
                    <line
                      x1="85"
                      y1="85"
                      x2="235"
                      y2="30"
                      stroke="#ec4899"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                    <line
                      x1="85"
                      y1="85"
                      x2="265"
                      y2="85"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                    <line
                      x1="85"
                      y1="85"
                      x2="235"
                      y2="140"
                      stroke="#14b8a6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                  </svg>

                  {/* Left Hub: Lead Group Mentor */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <RiveAvatar
                      rivSrc="/riv/coach-pen.riv"
                      state="talking"
                      accentColor="#ec4899"
                      secondaryColor="#db2777"
                      discBackground={WATCH_DISC_PALETTES[9]}
                      size={80}
                      mentorName="Coach Pen"
                      stateMachineName="Character"
                    />
                    <span className="mt-1.5 text-[10px] font-bold text-pink-400">
                      Host · Coach Pen
                    </span>
                  </div>

                  {/* Right Orbit: 3 Connected Peers with Calibrated Level Tags */}
                  <div className="absolute right-12 top-0 flex items-center gap-2">
                    <RiveAvatar
                      rivSrc="/riv/nabi.riv"
                      state="idle"
                      accentColor="#f97316"
                      discBackground={WATCH_DISC_PALETTES[1]}
                      size={46}
                      mentorName="Peer 1"
                      stateMachineName="Character"
                    />
                    <div className="text-[11px]">
                      <div className="font-bold text-white">Alex</div>
                      <div className="text-[10px] text-orange-400">Lv.2 Sync</div>
                    </div>
                  </div>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <RiveAvatar
                      rivSrc="/riv/mong.riv"
                      state="happy"
                      accentColor="#14b8a6"
                      discBackground={WATCH_DISC_PALETTES[7]}
                      size={46}
                      mentorName="Peer 2"
                      stateMachineName="Character"
                    />
                    <div className="text-[11px]">
                      <div className="font-bold text-white">Jisu</div>
                      <div className="text-[10px] text-teal-400">Lv.3 Sync</div>
                    </div>
                  </div>

                  <div className="absolute right-12 bottom-0 flex items-center gap-2">
                    <RiveAvatar
                      rivSrc="/riv/sora.riv"
                      state="thinking"
                      accentColor="#a855f7"
                      discBackground={WATCH_DISC_PALETTES[6]}
                      size={46}
                      mentorName="Peer 3"
                      stateMachineName="Character"
                    />
                    <div className="text-[11px]">
                      <div className="font-bold text-white">Min</div>
                      <div className="text-[10px] text-purple-400">Lv.2 Sync</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                >
                  <span>Explore Group Session Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="max-w-5xl mx-auto px-6 sm:px-10 py-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868b]">
          <div className="font-semibold text-[#f5f5f7]">Mentors</div>
          <div>
            Proactive Level Diagnosis · Human-Supervised Mentorship
          </div>
        </footer>
      </div>
      </div>

      {/* COMPACT MENTOR GREETING & ENROLL MODAL (When clicking any mentor bubble on the home screen) */}
      {selectedPitchCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isEnrolling && setSelectedPitchCell(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedPitchCell.name} Introduction`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-3xl bg-slate-950/95 border border-white/15 p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.9)] text-slate-100 transition-all duration-300 ${
              isEnrolling
                ? 'scale-105 opacity-0 -translate-y-4'
                : 'scale-100 opacity-100 translate-y-0'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedPitchCell(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mentor Face Avatar Actively Speaking ('talking' state) */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <RiveAvatar
                  rivSrc={selectedPitchCell.rivFile}
                  state={isEnrolling ? 'happy' : 'talking'}
                  accentColor={selectedPitchCell.accentColor}
                  secondaryColor={selectedPitchCell.secondaryColor}
                  discBackground={selectedPitchCell.discBackground}
                  size={84}
                  mentorName={selectedPitchCell.name}
                  stateMachineName="Character"
                />
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-400 text-slate-950 shadow">
                  Speaking
                </span>
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-sky-300 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{selectedPitchCell.roleTitle}</span>
                </div>
                <h2 className="text-xl font-black text-white truncate">
                  {selectedPitchCell.name}
                </h2>
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: selectedPitchCell.accentColor }}
                >
                  {selectedPitchCell.subject}
                </p>
              </div>
            </div>

            {/* Proactive Speech Bubble from the Mentor */}
            <div className="mt-4 relative rounded-2xl bg-slate-900/90 border border-white/10 p-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <div className="absolute -top-2 left-9 w-3.5 h-3.5 rotate-45 bg-slate-900 border-l border-t border-white/10" />
              <p>
                &ldquo;Hi! I&apos;m <strong>{selectedPitchCell.name}</strong>! 👋
                I&apos;ll start by proactively diagnosing your current level in{' '}
                <strong className="text-white">
                  {selectedPitchCell.subject}
                </strong>
                , then guide you step-by-step through a curriculum tailored just
                for you!&rdquo;
              </p>
            </div>

            {/* Preview of Curriculum Channels unlocked on Enroll */}
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Curriculum Channels You&apos;ll Unlock
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {previewChannels.map((ch) => (
                  <div
                    key={ch}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[11px] text-slate-300 truncate"
                  >
                    <Hash
                      className="w-3 h-3 shrink-0"
                      style={{ color: selectedPitchCell.accentColor }}
                    />
                    <span className="truncate font-medium">{ch}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enroll CTA Button */}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedPitchCell(null)}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                type="button"
                disabled={isEnrolling}
                onClick={() => handleEnrollMentor(selectedPitchCell)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-black text-slate-950 bg-sky-400 hover:bg-sky-300 shadow-[0_8px_28px_rgba(56,189,248,0.4)] active:scale-95 transition-all cursor-pointer"
              >
                <span>{isEnrolling ? 'Starting Class...' : 'Enroll'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "MEET MY OWN" CUSTOM MENTOR BUILDER MODAL */}
      {isMeetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Create Custom Mentor"
        >
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-400/30 mb-1">
                  Preview · Custom Mentor Studio
                </div>
                <h2 className="text-lg font-extrabold text-white">
                  Create & Deploy Your Own Mentor
                </h2>
                <p className="text-xs text-slate-400">
                  Configure a proactive mentor tailored to your topic and level
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMeetModalOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomMentor} className="mt-5 space-y-4">
              {/* Live Character Preview */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                <RiveAvatar
                  rivSrc={customRivChoice}
                  state="talking"
                  accentColor={customColor}
                  size={76}
                  mentorName={customName}
                  stateMachineName="Character"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {customName || 'My Mentor'}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {customSubject || 'Custom Topic'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CUSTOM_CHARACTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.riv}
                        type="button"
                        onClick={() => {
                          setCustomRivChoice(opt.riv);
                          setCustomColor(opt.color);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
                          customRivChoice === opt.riv
                            ? 'bg-white text-slate-950 border-white'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mentor Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Prof. Pixel"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Systems Mentor"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  What do you want to learn?
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Distributed Systems & Consensus"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMeetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 transition cursor-pointer"
                >
                  Deploy & Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchHoneycomb;

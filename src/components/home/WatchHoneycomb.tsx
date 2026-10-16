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
    }, 220);

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
        if (dist > 920) continue;

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

  // Mobile Apple Watch Honeycomb Lattice: frames top & bottom of mobile screens without overlapping the central title
  const mobileHoneycombCells: HoneycombCell[] = useMemo(() => {
    const pool = HONEYCOMB_CATALOG;
    const hexSpacingX = 96;
    const hexSpacingY = 82;
    const rawPoints: Array<{ x: number; y: number; dist: number }> = [];

    for (let row = -3; row <= 3; row++) {
      if (Math.abs(row) <= 1) continue;
      const isOddRow = Math.abs(row) % 2 === 1;
      const minCol = isOddRow ? -2 : -1;
      const maxCol = 1;

      for (let col = minCol; col <= maxCol; col++) {
        const x = col * hexSpacingX + (isOddRow ? hexSpacingX * 0.5 : 0);
        const y = row * hexSpacingY + (row > 0 ? 28 : -28);
        const dist = Math.hypot(x, y);
        rawPoints.push({ x, y, dist });
      }
    }

    rawPoints.sort((a, b) => a.dist - b.dist);

    return rawPoints.map((pt, idx) => {
      const template = pool[idx % pool.length];
      const discBackground =
        WATCH_DISC_PALETTES[idx % WATCH_DISC_PALETTES.length];
      const ringScale = Math.abs(pt.y) > 220 ? 0.88 : 0.98;

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

  return (
    <div
      className={`min-h-screen w-full bg-black text-[#f5f5f7] overflow-x-hidden selection:bg-sky-500/30 transition-all duration-500 ${
        isEnrolling ? 'scale-[1.03] opacity-0 blur-sm' : 'scale-100 opacity-100'
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
        className="relative h-[calc(100vh-3.5rem)] min-h-[640px] w-full overflow-hidden bg-black flex flex-col items-center justify-center select-none touch-pan-y"
      >
        {/* HONEYCOMB BUBBLE CLUSTER WITH 3D MENTOS CANDY FLIP REVEAL */}
        <div className="pointer-events-none absolute inset-0">
          {activeCells.map((cell, idx) => {
            const isHovered = hoveredCellId === cell.id;
            const isSelected = selectedPitchCell?.id === cell.id;
            const baseX = cell.baseX + (isMobileViewport ? 0 : panOffset.x);
            const baseY = cell.baseY + (isMobileViewport ? 0 : panOffset.y);

            // Apple Watch Cursor-Proximity Magnification + gentle radial neighbor push
            let proximityScale = 1;
            let pushX = 0;
            let pushY = 0;

            if (!isMobileViewport && pointerPos) {
              const dx = baseX - pointerPos.x;
              const dy = baseY - pointerPos.y;
              const dist = Math.hypot(dx, dy);
              const radius = 260;

              if (dist < radius) {
                const t = 1 - dist / radius;
                const smoothT = t * t * (3 - 2 * t);
                proximityScale = 1 + smoothT * 0.34;

                if (dist > 6) {
                  const pushMag = (1 - t) * smoothT * 18;
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
              (isHovered || isSelected ? 1.1 : 1);

            const avatarSize = isMobileViewport ? 72 : 108;
            // Staggered radial flip delay so the Mentos discs flip outward in a wave
            const flipDelayMs = Math.min(780, idx * 28);

            return (
              <div
                key={cell.id}
                style={{
                  transform: `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(
                    1
                  )}px, 0) scale(${finalScale.toFixed(3)})`,
                  zIndex:
                    isHovered || isSelected
                      ? 50
                      : proximityScale > 1.12
                      ? 35
                      : 15,
                }}
                className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out will-change-transform"
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
                      transition: `transform 760ms cubic-bezier(0.22, 1, 0.36, 1) ${flipDelayMs}ms, box-shadow 200ms ease`,
                      transform: isMentosFlipped
                        ? 'rotateY(180deg)'
                        : 'rotateY(0deg)',
                      boxShadow:
                        isHovered || isSelected
                          ? '0 0 0 3px #ffffff, 0 14px 36px rgba(0,0,0,0.85)'
                          : '0 6px 18px rgba(0,0,0,0.75)',
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
                        state={isHovered || isSelected ? 'talking' : 'idle'}
                        accentColor={cell.accentColor}
                        secondaryColor={cell.secondaryColor}
                        discBackground={cell.discBackground}
                        size={avatarSize}
                        mentorName={cell.name}
                        stateMachineName="Character"
                      />
                    </div>
                  </div>

                  {/* Floating pill label shown on hover */}
                  {isHovered && (
                    <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 z-50 px-2.5 py-0.5 rounded-full bg-slate-950/95 border border-white/20 shadow-xl whitespace-nowrap">
                      <span className="text-[10px] font-bold text-white">
                        {cell.name}
                      </span>
                      <span className="mx-1 text-slate-500">·</span>
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
          APPLE.COM EDITORIAL SHOWCASE (PURE DARK TYPOGRAPHY, NO BOX CLUTTER)
         ===================================================================== */}
      <div id="why-mentors" className="relative z-30 bg-black">
        {/* -------------------------------------------------------------------
            01. WHY A MENTOR, NOT JUST A TEACHER (PROACTIVE LEVEL DIAGNOSIS)
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

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-white/10">
            <div>
              <div className="text-sm font-semibold text-sky-400">
                Proactive Initiative
              </div>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
                Starts the dialogue first.
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[#86868b] leading-relaxed">
                The moment you enter a curriculum channel, your mentor greets
                you with a targeted question to uncover how you already think
                about the topic.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-indigo-400">
                Live Level Calibration
              </div>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
                Adapts from Beginner to Advanced.
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[#86868b] leading-relaxed">
                Every response and diagnostic quiz recalibrates your mastery
                profile—automatically shifting between intuitive analogies and
                rigorous engineering depth.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-400">
                Channel-Based Curriculum
              </div>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
                Structured like a real workspace.
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[#86868b] leading-relaxed">
                Learn across dedicated <code className="text-white">#01</code>{' '}
                to <code className="text-white">#04</code> curriculum channels
                where each step builds deliberately on what you just mastered.
              </p>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            02. HUMAN EDUCATOR MONITORING & PROFESSIONAL FEEDBACK
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

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/10">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Continuous trajectory monitoring.
              </h3>
              <p className="mt-3 text-base sm:text-lg text-[#86868b] leading-relaxed">
                Human instructors observe where your intuition hesitates across
                curriculum channels—catching subtle misconceptions that standard
                automated grading misses.
              </p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Direct expert feedback in your thread.
              </h3>
              <p className="mt-3 text-base sm:text-lg text-[#86868b] leading-relaxed">
                Domain specialists send verified coaching notes, architecture
                critiques, and personalized study recommendations straight into
                your active learning channel.
              </p>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            03. PREVIEW FEATURES: CUSTOM MENTOR DEPLOYMENT & GROUP SESSIONS
           ------------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 py-24 sm:py-36 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* PREVIEW 1: BUILD & DEPLOY YOUR OWN MENTOR */}
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

            {/* PREVIEW 2: LIVE GROUP SESSIONS */}
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

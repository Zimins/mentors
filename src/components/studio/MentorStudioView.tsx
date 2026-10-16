'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Gamepad2,
  Hash,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Lightbulb,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react';
import { RiveAvatar } from '@/components/avatar/RiveAvatar';
import { Argon3DViewer } from '@/components/studio/Argon3DViewer';
import { LearningMaterialPreviewCard } from '@/components/studio/LearningMaterialPreviewCard';
import { QuizDrawer } from '@/components/studio/QuizDrawer';
import { useUserProgress } from '@/context/UserProgressContext';
import { MENTORS } from '@/data/mentors';
import {
  buildAdaptiveLearningMaterial,
  MATERIAL_TYPE_META,
  selectOptimalMaterialType,
} from '@/lib/gemini/learningMaterialTemplates';
import {
  ChatMessage,
  LearningMaterialType,
  MentorAgentTurnResponse,
  MentorConfig,
  MentorRequestMode,
  QuizQuestion,
  RiveAvatarState,
  Scene3DSpec,
  StudentLevel,
} from '@/types/mentor';

export interface MentorStudioViewProps {
  mentor: MentorConfig;
  standaloneTestMode?: boolean;
}

export type ProactiveNudgeType = '3d_pointout' | 'socratic_quiz' | 'real_world_tip';

interface CourseProactiveNudges {
  pointOut3D: string;
  socraticQuestion: string;
  realWorldTip: string;
  followUpChips: string[];
}

interface CurriculumChannel {
  id: string;
  slug: string;
  title: string;
  summary: string;
  proactiveGreeting: string;
  proactiveNudges: CourseProactiveNudges;
  starterPrompts: string[];
  scene3d: Scene3DSpec;
  quiz: QuizQuestion;
}

interface ChannelThreadState {
  messages: ChatMessage[];
  scene3d: Scene3DSpec;
  quiz: QuizQuestion | null;
  learningStepTitle: string;
  keyTakeaways: string[];
  unread?: boolean;
}

const RIVE_STATES: {
  state: RiveAvatarState;
  label: string;
  dotColor: string;
}[] = [
  { state: 'idle', label: 'idle', dotColor: '#38bdf8' },
  { state: 'happy', label: 'happy', dotColor: '#34d399' },
  { state: 'sad', label: 'sad', dotColor: '#60a5fa' },
  { state: 'thinking', label: 'thinking', dotColor: '#fbbf24' },
  { state: 'talking', label: 'talking', dotColor: '#ec4899' },
];

const LEVEL_BADGE_MAP: Record<
  StudentLevel,
  { label: string; colorClass: string; progress: number }
> = {
  unassessed: {
    label: 'Unassessed',
    colorClass: 'bg-slate-800 text-slate-300 border-slate-600',
    progress: 20,
  },
  beginner: {
    label: 'Beginner',
    colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    progress: 45,
  },
  intermediate: {
    label: 'Intermediate',
    colorClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    progress: 75,
  },
  advanced: {
    label: 'Advanced',
    colorClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    progress: 96,
  },
};

interface ChannelTemplateSpec {
  slug: string;
  title: string;
  summary: string;
  greeting: string;
  prompts: string[];
  nodeColors: [string, string, string];
  quizQ: string;
  quizOpts: string[];
  quizCorrect: number;
  quizExp: string;
  nudges?: CourseProactiveNudges;
}

// Build 4 rich, mentor-specific Slack Curriculum Channels per mentor so every mentor has their own distinct courses & course-aware proactive messages
function buildCurriculumForMentor(mentor: MentorConfig): CurriculumChannel[] {
  const baseScene = mentor.defaultScene3d;
  const primaryNode = baseScene.nodes?.[0]?.label || 'Primary Core Node';
  const secondaryNode = baseScene.nodes?.[1]?.label || 'Connected Layer Node';

  const MENTOR_CURRICULUM_MAP: Record<string, ChannelTemplateSpec[]> = {
    'cs-professor': [
      {
        slug: '01-pointers-and-memory',
        title: 'Pointers, Stack Frames & Heap Allocation',
        summary:
          'Visualize how stack frames store local variables and pointers dereference heap blocks in 3D.',
        greeting: `Hey there! Welcome to **#01-pointers-and-memory**! 👋 I'm **${mentor.name}**. Before you even type, check out the 3D model on the right: notice how **${primaryNode}** holds an address pointing into **Heap Allocator**. Have you worked with pointers in C/C++ or Rust before, or should we start from the basics?`,
        prompts: [
          'I am new to pointers—explain them with a simple 3D analogy!',
          'Show me what happens in 3D when a dangling pointer or memory leak occurs.',
          'Quiz me on stack vs. heap allocation speed!',
        ],
        nodeColors: ['#38bdf8', '#6366f1', '#34d399'],
        quizQ:
          'When a function returns in C/C++, what happens to its local stack frame compared to a heap-allocated block?',
        quizOpts: [
          'The stack frame is popped in O(1) by moving the stack pointer, while heap memory persists until explicitly freed',
          'Both stack and heap blocks are immediately erased by the CPU ALU',
          'Heap memory is automatically popped before the stack frame returns',
          'Stack frames require garbage collection sweeps on every clock cycle',
        ],
        quizCorrect: 0,
        quizExp:
          'Stack allocation/deallocation simply adjusts the stack pointer register (ESP/RSP) in O(1), whereas heap allocations live until free() or GC reclamation.',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#01-pointers-and-memory)**: Look at the purple **malloc()** packet flowing from **ALU Core #0** to **Heap Allocator** on the right. What do you think happens to that heap block if the local stack pointer holding its address is popped without calling \`free()\`?`,
          socraticQuestion: `🎯 **Quick Socratic Check (+10 🍬)**: Why is allocating a local variable on the **Stack** roughy 100x faster than calling \`malloc()\` on the **Heap**? Try answering in one sentence!`,
          realWorldTip: `💡 **Systems Tip from ${mentor.name}**: In real production bugs, **Use-After-Free (dangling pointer)** happens when a pointer still points to \`0x72\` after the heap block was freed. Want me to simulate a Use-After-Free state in the 3D viewer?`,
          followUpChips: [
            'Simulate a Use-After-Free bug in 3D!',
            'Because the stack only increments RSP in O(1) while heap searches free lists!',
            'Show me how Rust ownership prevents dangling pointers in 3D.',
          ],
        },
      },
      {
        slug: '02-cpu-cache-hierarchy',
        title: 'L1/L2/L3 Cache Lines & Spatial Locality',
        summary:
          'Inspect how 64-byte cache lines travel from DRAM to L1 cache and why contiguous arrays beat linked lists.',
        greeting: `Welcome to **#02-cpu-cache-hierarchy**! ⚡ Let me ask you a warm-up question first: why does iterating over a contiguous array run up to 10x faster than traversing a pointer-chasing linked list of the exact same size? Check out **L1 Cache Line (64B)** in the 3D model on the right!`,
        prompts: [
          'Explain 64-byte cache line prefetching in 3D!',
          'Simulate a Cache Miss vs. Cache Hit in the 3D viewer.',
          'Give me an interview-level quiz on false sharing!',
        ],
        nodeColors: ['#f59e0b', '#38bdf8', '#10b981'],
        quizQ:
          'Why does traversing a contiguous array exhibit much higher L1 cache hit rates than a linked list?',
        quizOpts: [
          'Spatial locality loads adjacent array elements together in a single 64-byte cache line fetch',
          'Arrays bypass the CPU registers completely',
          'Linked lists are stored exclusively inside the GPU VRAM',
          'Arrays compress 64-bit integers into 1-bit flags automatically',
        ],
        quizCorrect: 0,
        quizExp:
          'CPUs fetch memory in 64-byte cache lines. Contiguous arrays pack neighbor elements into the same cache line, triggering hardware prefetching and L1 hits!',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#02-cpu-cache-hierarchy)**: Watch the cyan **Cache Hit** connection between **L1 Cache Line (64B)** and **ALU Core #0**. Notice how short that path is compared to fetching from main heap memory! What happens to CPU cycles on an L1 miss?`,
          socraticQuestion: `🎯 **Pop Question (+10 🍬)**: A CPU cache line is typically **64 bytes**. If you store an array of 4-byte \`int32\` values, how many integers get pulled into L1 cache in a single fetch?`,
          realWorldTip: `💡 **High-Performance Tip**: Game engines use **Data-Oriented Design (Struct of Arrays)** instead of scattered objects specifically to keep the **L1 Cache Line (64B)** 100% full of useful data. Want to see AoS vs. SoA in 3D?`,
          followUpChips: [
            '16 integers get loaded in a single 64-byte cache line!',
            'Show me Struct-of-Arrays (SoA) vs Array-of-Structs in 3D!',
            'What happens during multi-core False Sharing?',
          ],
        },
      },
      {
        slug: '03-trees-and-graphs-3d',
        title: 'Self-Balancing Trees & Graph Topologies',
        summary:
          'Explore BST rotations, AVL/Red-Black balance invariants, and B+ Trees for storage engines.',
        greeting: `Glad you jumped into **#03-trees-and-graphs-3d**! 🌲 I've loaded our 3D Binary Search Tree (**Root Node [0x40]**, **Left Subtree [0x28]**, **Right Subtree [0x72]**) on the right. Tell me—what happens to this tree's shape if you insert already-sorted numbers \`10, 20, 30, 40, 50\`?`,
        prompts: [
          'Show me in 3D how an AVL left-rotation fixes a skewed tree!',
          'Why do databases use B+ Trees instead of binary trees?',
          'Challenge me with a tree rotation Candy quiz!',
        ],
        nodeColors: ['#34d399', '#38bdf8', '#a855f7'],
        quizQ:
          'If sorted keys are inserted sequentially into an unbalanced Binary Search Tree, what does worst-case lookup time degrade to?',
        quizOpts: [
          'O(N) — it degenerates into a singly linked list',
          'O(1) — it becomes a direct hash table',
          'O(log log N) — it compresses height automatically',
          'O(N^3) — it creates cycles between leaf nodes',
        ],
        quizCorrect: 0,
        quizExp:
          'Inserting sorted keys without self-balancing rotations creates a degenerate chain of right-child pointers, turning O(log N) search into O(N).',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#03-trees-and-graphs-3d)**: Look at **Root Node [0x40]** branching to **Left Subtree [0x28]** and **Right Subtree [0x72]**. Because it's balanced, 1 million keys only need ~20 hops. Want me to animate an AVL tree rotation in 3D?`,
          socraticQuestion: `🎯 **Socratic Check (+10 🍬)**: Why do SSD databases like PostgreSQL and MySQL use wide **B+ Trees** instead of tall Binary Search Trees? (Hint: think about our previous cache/page course!)`,
          realWorldTip: `💡 **Interview Insight**: Linux's Completely Fair Scheduler (CFS) uses a **Red-Black Tree** indexed by \`vruntime\` so picking the next task is always fast. Want to visualize a Red-Black Tree in 3D?`,
          followUpChips: [
            'Animate an AVL tree rotation in the 3D viewer!',
            'B+ Trees pack many keys per 4KB disk page to minimize I/O hops!',
            'Visualize Linux CFS Red-Black Tree scheduling in 3D!',
          ],
        },
      },
      {
        slug: '04-os-virtual-memory',
        title: 'Virtual Memory, Page Tables & TLB',
        summary:
          'How the MMU and TLB translate virtual addresses to physical RAM frames and handle page faults.',
        greeting: `Welcome to **#04-os-virtual-memory**! 🖥️ Here we explore how every process gets its own private 64-bit address space illusion. Want me to walk you through a **TLB Hit vs. Page Fault** in 3D?`,
        prompts: [
          'Trace a Virtual-to-Physical address translation in 3D!',
          'What happens inside the OS kernel during a Minor vs. Major Page Fault?',
          'Give me a Candy quiz on TLB shootdowns and multi-level page tables!',
        ],
        nodeColors: ['#818cf8', '#ec4899', '#38bdf8'],
        quizQ:
          'What is the role of the TLB (Translation Lookaside Buffer) inside the CPU MMU?',
        quizOpts: [
          'It caches recent virtual-to-physical page table translations to avoid slow multi-level page walks in RAM',
          'It encrypts network packets before they leave the NIC',
          'It schedules threads onto GPU shader cores',
          'It stores BIOS firmware strings on boot',
        ],
        quizCorrect: 0,
        quizExp:
          'Walking a 4-level page table in RAM takes multiple memory accesses. The hardware TLB caches hot translations so virtual addresses resolve in ~1 cycle.',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#04-os-virtual-memory)**: When your code dereferences address \`0x72\`, the CPU doesn't go straight to RAM—it checks the **TLB** first. Want to see the 4-level page table walk in 3D when a TLB miss happens?`,
          socraticQuestion: `🎯 **Pop Question (+10 🍬)**: When you call \`fork()\` in Linux, does the OS immediately copy all gigabytes of RAM, or does it use a clever trick with page table permissions?`,
          realWorldTip: `💡 **Production Tip**: High-frequency trading & database servers enable **HugePages (2MB / 1GB)** so the hardware TLB can cover gigabytes of RAM without TLB misses!`,
          followUpChips: [
            'It uses Copy-on-Write (CoW) by marking pages read-only first!',
            'Model a 4-level Page Table + TLB Miss in 3D!',
            'Explain how 2MB HugePages reduce TLB misses.',
          ],
        },
      },
    ],
    'algo-coach': [
      {
        slug: '01-dijkstra-shortest-path',
        title: 'Dijkstra Priority Queue & Edge Relaxation',
        summary:
          'Watch weighted shortest-path packets propagate from Source S to Target T via min-heap edge relaxation.',
        greeting: `Hey! I'm **${mentor.name}**! 🏃‍♀️ Welcome to **#01-dijkstra-shortest-path**! Look at the 3D graph on the right: packets travel along **Source S → Vertex A (w=2) → Vertex C (w=3) → Target T (w=2)** for a total cost of **7**, bypassing the slower detours! Can you spot why **Vertex B (d=6)** wasn't chosen?`,
        prompts: [
          'Walk me through Dijkstra edge relaxation step-by-step in 3D!',
          'What breaks in Dijkstra if an edge has a negative weight?',
          'Quiz me on Min-Heap Priority Queue time complexity!',
        ],
        nodeColors: ['#34d399', '#10b981', '#fbbf24'],
        quizQ:
          'Why does Dijkstra’s algorithm use a Min-Heap Priority Queue when selecting the next vertex to expand?',
        quizOpts: [
          'To greedily extract the unvisited vertex with the smallest tentative distance in O(log V) time',
          'To randomize vertex order on every iteration',
          'To sort edges by alphabetical label',
          'To force O(V^3) matrix multiplication',
        ],
        quizCorrect: 0,
        quizExp:
          'A Min-Heap Priority Queue always pops the closest frontier vertex in O(log V), guaranteeing optimal shortest-path discovery for non-negative weights.',
      },
      {
        slug: '02-bfs-dfs-graph-traversals',
        title: 'BFS Wavefront vs. DFS Backtracking in 3D',
        summary:
          'Compare level-by-level FIFO queue expansion against deep recursive stack exploration in 3D space.',
        greeting: `Welcome to **#02-bfs-dfs-graph-traversals**! 🌐 If you want to find the **minimum number of hops** in an unweighted graph, would you reach for **BFS (Queue)** or **DFS (Stack)** first? Let's visualize both wavefronts in 3D!`,
        prompts: [
          'Compare BFS vs. DFS traversal order on our 3D graph!',
          'Show me how DFS detects cycles using 3-color vertex states in 3D.',
          'Give me a Candy quiz on BFS vs. DFS!',
        ],
        nodeColors: ['#2dd4bf', '#38bdf8', '#34d399'],
        quizQ:
          'In an unweighted graph, why does Breadth-First Search (BFS) guarantee finding the shortest path in terms of edge count?',
        quizOpts: [
          'It explores vertices in concentric layers of distance d, d+1, d+2 using a FIFO queue',
          'It plunges to the deepest leaf node before checking neighbors',
          'It requires all edge weights to be prime numbers',
          'It sorts vertices by memory address',
        ],
        quizCorrect: 0,
        quizExp:
          'Because BFS uses a FIFO queue, all nodes at distance k are visited before any node at distance k+1.',
      },
      {
        slug: '03-dynamic-programming-3d',
        title: 'Dynamic Programming DAG & State Lattice',
        summary:
          'Turn overlapping subproblems and memoization tables into directed acyclic 3D state lattices.',
        greeting: `Welcome to **#03-dynamic-programming-3d**! 🧩 DP feels magical once you see that every DP table is just a **DAG (Directed Acyclic Graph)** in disguise! Which DP problem has tripped you up before—Knapsack, Edit Distance, or Longest Increasing Subsequence?`,
        prompts: [
          'Visualize a 2D Dynamic Programming state table as a 3D DAG!',
          'Explain Top-Down Memoization vs. Bottom-Up Tabulation in 3D.',
          'Challenge me with a DP state-transition Candy quiz!',
        ],
        nodeColors: ['#10b981', '#a855f7', '#fbbf24'],
        quizQ:
          'What two fundamental properties must a problem have to be solved optimally with Dynamic Programming?',
        quizOpts: [
          'Optimal Substructure and Overlapping Subproblems',
          'Negative Cycles and Random Pivots',
          'Exponential Space and Unbounded Recursion',
          'Hash Collisions and Mutex Locks',
        ],
        quizCorrect: 0,
        quizExp:
          'DP caches overlapping subproblems and combines optimal sub-solutions along a topological state order.',
      },
      {
        slug: '04-a-star-and-network-flow',
        title: 'A* Heuristic Search & Max-Flow Bottlenecks',
        summary:
          'Guide shortest-path search toward the goal with heuristics f(n) = g(n) + h(n) and analyze network capacity.',
        greeting: `Welcome to **#04-a-star-and-network-flow**! 🏆 Ready for boss-level algorithms? In our 3D graph on the right, watch how adding an admissible heuristic steers search straight toward **Target T (d=7)**!`,
        prompts: [
          'Show me how A* f(n) = g(n) + h(n) prunes the 3D search space!',
          'Simulate Max-Flow Min-Cut bottleneck edges in 3D!',
          'Give me a +35 Candy Boss Quiz on A* admissibility!',
        ],
        nodeColors: ['#fbbf24', '#34d399', '#f43f5e'],
        quizQ:
          'For A* search to guarantee an optimal shortest path, what condition must the heuristic function h(n) satisfy?',
        quizOpts: [
          'It must be admissible — never overestimating the true remaining cost to the goal',
          'It must always return Infinity for every node',
          'It must be strictly greater than g(n)^2',
          'It must ignore the target coordinates completely',
        ],
        quizCorrect: 0,
        quizExp:
          'An admissible heuristic h(n) <= h*(n) ensures A* never skips a potentially optimal path before expanding the goal.',
      },
    ],
    'physics-lab': [
      {
        slug: '01-kepler-orbital-mechanics',
        title: 'Keplerian Orbits & Centripetal Force Balance',
        summary:
          'Explore how gravitational attraction F = GMm/r² balances orbital velocity around a central star in 3D.',
        greeting: `Hey explorer! I'm **${mentor.name}**! 🚀 Welcome to **#01-kepler-orbital-mechanics**! Look at **Central Star (M₀)** and **Planet Alpha** in our 3D lab on the right. Quick question: if Gravity pulls **Planet Alpha** inward, why doesn't it crash into the star?`,
        prompts: [
          'Explain why an orbiting planet is in perpetual free-fall in 3D!',
          'What happens in the 3D orbit if we suddenly double Planet Alpha’s velocity?',
          'Quiz me on Kepler’s Laws and orbital velocity!',
        ],
        nodeColors: ['#f59e0b', '#38bdf8', '#fbbf24'],
        quizQ:
          'For a planet in a circular orbit of radius r around a star of mass M, how does orbital speed v depend on radius r?',
        quizOpts: [
          'v = sqrt(G·M / r) — inner planets orbit faster than outer planets',
          'v increases linearly with radius r',
          'All planets move at the exact same speed regardless of distance',
          'v depends only on the planet’s color',
        ],
        quizCorrect: 0,
        quizExp:
          'Setting gravitational force GMm/r² equal to centripetal force mv²/r gives v = sqrt(GM/r), so closer orbits require higher speed!',
      },
      {
        slug: '02-lagrange-points-and-gravity',
        title: 'Lagrange Equilibrium Points (L1–L5) & Tidal Locking',
        summary:
          'Visualize gravitational saddle points where two-body forces and centrifugal acceleration cancel out.',
        greeting: `Welcome to **#02-lagrange-points-and-gravity**! 🛰️ Spot the purple **Lagrange Point L1** cone between **Central Star (M₀)** and **Exo-Giant Beta** in the 3D viewer! Do you know why NASA parks space telescopes at Lagrange points?`,
        prompts: [
          'Show me in 3D how forces cancel out at Lagrange Point L1 and L2!',
          'Why are L4 and L5 stable while L1, L2, and L3 are unstable?',
          'Give me a Candy quiz on Lagrange equilibria!',
        ],
        nodeColors: ['#a855f7', '#f59e0b', '#ef4444'],
        quizQ:
          'Why is Lagrange Point L1 useful for solar observation spacecraft?',
        quizOpts: [
          'The combined gravity of the Star and Planet balances centrifugal force, letting the craft orbit with the same period as the planet',
          'Gravity is completely absent across the entire solar system',
          'It teleports spacecraft faster than light',
          'It shields the craft behind the planet’s shadow at all times',
        ],
        quizCorrect: 0,
        quizExp:
          'At L1, the planet’s inward pull slightly reduces the star’s net pull, matching the planet’s angular orbital period.',
      },
      {
        slug: '03-electromagnetic-flux-3d',
        title: 'Lorentz Force, Magnetic Flux & Faraday Induction',
        summary:
          'Model 3D charged particle spirals in magnetic fields (F = qv × B) and induced EMF loops.',
        greeting: `Welcome to **#03-electromagnetic-flux-3d**! ⚡ When a charged particle enters a magnetic field perpendicular to its velocity, the cross-product force \`F = q(v × B)\` bends it into a 3D helix! Want to see that 3D trajectory right now?`,
        prompts: [
          'Model a charged particle spiraling through a 3D magnetic field!',
          'Visualize Faraday’s Law of Induction when magnetic flux changes in 3D.',
          'Quiz me on the Right-Hand Rule and Lorentz force!',
        ],
        nodeColors: ['#38bdf8', '#ef4444', '#fbbf24'],
        quizQ:
          'How much mechanical work does a static magnetic field perform on a moving electric charge?',
        quizOpts: [
          'Zero work — the magnetic force F = q(v × B) is always perpendicular to velocity v',
          'Infinite work along the direction of motion',
          'Work proportional to the square of mass',
          'Negative work that stops the particle instantly',
        ],
        quizCorrect: 0,
        quizExp:
          'Because the cross product v × B is always perpendicular to v, magnetic forces change a particle’s direction without changing its kinetic energy.',
      },
      {
        slug: '04-quantum-wave-tunneling',
        title: 'Quantum Wavefunctions & Barrier Tunneling in 3D',
        summary:
          'Inspect probability amplitude shells |ψ|² and evanescent wave decay through potential barriers.',
        greeting: `Welcome to **#04-quantum-wave-tunneling**! ⚛️ Check out **Outer Quantum Shell (r=3.2)** in our 3D viewer! In classical physics, a ball without enough energy can never cross a wall—how does a quantum wavefunction pull it off?`,
        prompts: [
          'Visualize 3D Quantum Barrier Tunneling and probability amplitude decay!',
          'Explain wave-particle duality and standing orbital harmonics in 3D.',
          'Launch the +35 Candy Physics Boss Quiz!',
        ],
        nodeColors: ['#ef4444', '#a855f7', '#38bdf8'],
        quizQ:
          'What happens to a quantum particle’s wavefunction ψ(x) inside a finite potential energy barrier where E < V₀?',
        quizOpts: [
          'It decays exponentially (evanescent wave) rather than dropping to zero instantly, allowing non-zero transmission if the barrier is thin',
          'It explodes to infinite amplitude inside the barrier',
          'It turns into a classical rigid billiard ball',
          'Its wavelength becomes zero everywhere',
        ],
        quizCorrect: 0,
        quizExp:
          'Solving the Schrödinger equation for E < V₀ yields an exponential decay across the barrier; if the barrier is narrow, a non-zero amplitude emerges on the far side!',
      },
    ],
    'math-wizard': [
      {
        slug: '01-basis-vectors-and-span',
        title: 'Basis Vectors (î, ĵ, k̂), Linear Combinations & Span',
        summary:
          'See how coordinate systems are built by scaling and adding basis vectors in 3D geometric space.',
        greeting: `Hello! I'm **${mentor.name}**! ✨ Welcome to **#01-basis-vectors-and-span**. Look at **Origin O (0,0,0)**, **Basis î [1, 0, 0]**, and **Basis ĵ [0, 1, 0]** in our 3D space on the right. Every matrix multiplication is really just moving those basis vectors to new landing spots! Ready to see how?`,
        prompts: [
          'Show me in 3D how columns of a matrix represent transformed basis vectors!',
          'What happens geometrically when two 3D vectors are linearly dependent?',
          'Quiz me on Span and Linear Independence!',
        ],
        nodeColors: ['#38bdf8', '#34d399', '#a855f7'],
        quizQ:
          'Geometrically, what do the columns of a 3×3 transformation matrix A represent?',
        quizOpts: [
          'The exact 3D coordinates where the standard basis vectors î, ĵ, and k̂ land after the transformation',
          'Random scalars unrelated to coordinate axes',
          'The roots of a 9th-degree polynomial',
          'Only the translation offset of the origin',
        ],
        quizCorrect: 0,
        quizExp:
          'Multiplying A by î = [1,0,0]ᵀ extracts the first column of A—meaning each column shows where a unit basis vector lands!',
      },
      {
        slug: '02-matrix-transformations-det',
        title: '3D Rotations, Shears & The Determinant as Volume Scaling',
        summary:
          'Watch the unit sphere deform into a 3D ellipsoid and measure how det(A) scales 3D volume.',
        greeting: `Welcome to **#02-matrix-transformations-det**! 🔮 Check out the wireframe **Transformed Ellipsoid det(A)** in our 3D viewer on the right! Tell me: if a 3D matrix has \`det(A) = 0\`, what happened to our 3D space?`,
        prompts: [
          'Show me in 3D what det(A) = 0 looks like when space squishes into a plane!',
          'What does a negative determinant det(A) < 0 mean for 3D orientation?',
          'Give me a Candy quiz on Determinants and Invertibility!',
        ],
        nodeColors: ['#c084fc', '#ec4899', '#38bdf8'],
        quizQ:
          'If a 3×3 matrix transformation A has determinant det(A) = 0, what happens geometrically to 3D space?',
        quizOpts: [
          'All of 3D space is squished onto a lower-dimensional plane, line, or point of zero volume, making A non-invertible',
          'Every volume is multiplied by 100',
          'The matrix becomes a pure rigid rotation',
          'All vectors keep their original lengths',
        ],
        quizCorrect: 0,
        quizExp:
          'The determinant measures the volume scaling factor. When det(A) = 0, 3D volume collapses to 0 and information is permanently lost.',
      },
      {
        slug: '03-eigenvectors-and-eigenvalues',
        title: 'Eigenvectors (A·v = λv) & Invariant Axes in 3D',
        summary:
          'Discover why almost every vector gets knocked off its span during a transformation—except the eigenvectors.',
        greeting: `Welcome to **#03-eigenvectors-and-eigenvalues**! 🌟 Look at **Eigenvector v₁ (λ₁=2.4)** and **Eigenvector v₂ (λ₂=0.8)** in the 3D viewer on the right! Notice how ` +
          '`A·v₁ = λ₁v₁` stretches directly along its own axis without rotating! Want to explore why?',
        prompts: [
          'Intuitively explain A·v = λv using our 3D eigenvector model!',
          'How does a 3D rotation axis relate to an eigenvector with λ = 1?',
          'Challenge me with an Eigenvector Candy quiz!',
        ],
        nodeColors: ['#a855f7', '#ec4899', '#34d399'],
        quizQ:
          'What defines an eigenvector v of a linear transformation matrix A?',
        quizOpts: [
          'A non-zero vector whose direction stays on the exact same line through the origin after applying A, only scaled by eigenvalue λ',
          'A vector that is always rotated by 90 degrees',
          'The zero vector [0, 0, 0] exclusively',
          'A vector whose coordinates must all be prime integers',
        ],
        quizCorrect: 0,
        quizExp:
          'While most vectors get rotated off their span by A, an eigenvector v remains on its own span line and simply stretches or flips by factor λ.',
      },
      {
        slug: '04-svd-and-pca-geometry',
        title: 'Singular Value Decomposition (SVD) & PCA Variance Axes',
        summary:
          'Decompose any matrix into Rotation → Scaling → Rotation (U·Σ·Vᵀ) and find principal 3D axes of data.',
        greeting: `Welcome to **#04-svd-and-pca-geometry**! 🏆 Did you know that **every** matrix transformation—even non-square ones—can be broken into **Rotate (Vᵀ) → Stretch along perpendicular axes (Σ) → Rotate (U)**? Let's see SVD and PCA in 3D!`,
        prompts: [
          'Visualize SVD (U · Σ · Vᵀ) as three geometric steps in 3D!',
          'How does PCA use eigenvectors of the covariance matrix to reduce dimensions?',
          'Give me the +35 Candy Linear Algebra Boss Quiz!',
        ],
        nodeColors: ['#ec4899', '#a855f7', '#fbbf24'],
        quizQ:
          'In Principal Component Analysis (PCA), what does the first principal component axis represent in 3D data space?',
        quizOpts: [
          'The orthogonal direction (eigenvector of the covariance matrix) with the largest eigenvalue, capturing maximum variance',
          'The axis with zero variance and maximum noise',
          'Always the standard X-axis regardless of the dataset',
          'A random line that misses the data centroid',
        ],
        quizCorrect: 0,
        quizExp:
          'PCA aligns coordinates with the eigenvectors of the covariance matrix, where the top eigenvalue λ₁ points along the direction of greatest variance.',
      },
    ],
    'arch-sensei': [
      {
        slug: '01-global-load-balancing-l7',
        title: 'Global Anycast L7 Load Balancing & Traffic Routing',
        summary:
          'Route worldwide HTTP/3 and gRPC requests through edge load balancers to healthy regional backends.',
        greeting: `Hey team! I'm **${mentor.name}**! ☁️ Welcome to **#01-global-load-balancing-l7**! Check out **Global HTTPS Load Balancer** at the top of our 3D mesh on the right, fanning traffic out to **Cloud Run Pod #1, #2, #3**. What happens if Pod #1 suddenly crashes mid-request?`,
        prompts: [
          'Simulate a Pod failure and Load Balancer health-check failover in 3D!',
          'What is the difference between L4 (TCP) and L7 (HTTP/gRPC) load balancing?',
          'Quiz me on Global Anycast Load Balancing!',
        ],
        nodeColors: ['#60a5fa', '#38bdf8', '#34d399'],
        quizQ:
          'How does a Global Anycast L7 HTTPS Load Balancer minimize latency for users on different continents?',
        quizOpts: [
          'It terminates TLS/HTTP at the nearest edge PoP using a single Anycast IP and routes over fiber backbone to the closest healthy backend',
          'It forces all global packets through a single home router',
          'It disables TLS encryption to save CPU cycles',
          'It drops 50% of requests at random',
        ],
        quizCorrect: 0,
        quizExp:
          'Anycast routes users to the physically closest Google edge PoP for fast TLS handshake, then forwards requests over low-latency backbone links.',
      },
      {
        slug: '02-cloud-run-k8s-autoscaling',
        title: 'Cloud Run & Kubernetes HPA Zero-Downtime Autoscaling',
        summary:
          'Watch burst instances spin up on concurrency spikes while streaming AI & database state.',
        greeting: `Welcome to **#02-cloud-run-k8s-autoscaling**! 🚀 Look at **Cloud Run Pod #3 (Burst)** in our 3D viewer on the right! When traffic spikes 20x in 5 seconds, how do we scale out containers without dropping active WebSocket/GenAI streams?`,
        prompts: [
          'Show me Cold Start vs. Min-Instances warm pooling in 3D!',
          'How does Kubernetes HPA calculate desired replica count under CPU/concurrency spikes?',
          'Give me a Candy quiz on Serverless & K8s Autoscaling!',
        ],
        nodeColors: ['#38bdf8', '#a855f7', '#fbbf24'],
        quizQ:
          'Why is keeping stateless compute in Cloud Run/Kubernetes Pods essential for rapid horizontal autoscaling?',
        quizOpts: [
          'Any request can be routed to any newly spun-up instance while durable state lives in external stores like Firestore or Redis',
          'Stateless pods store all user databases solely on local temp disk',
          'It prevents more than one container from running at a time',
          'It requires manual SSH configuration for every new user',
        ],
        quizCorrect: 0,
        quizExp:
          'Decoupling stateless compute pods from durable storage allows the load balancer to distribute traffic across new burst instances immediately.',
      },
      {
        slug: '03-distributed-cache-stampede',
        title: 'Distributed Caching, Redis Rings & Cache Stampede Defense',
        summary:
          'Protect databases like Cloud Firestore from thundering-herd cache misses using request coalescing.',
        greeting: `Welcome to **#03-distributed-cache-stampede**! 🛡️ Imagine a celebrity post expires from cache at the exact millisecond 100,000 users request it—suddenly all pods hammer **Cloud Firestore (NoSQL)** at once! How would you stop a **Cache Stampede**?`,
        prompts: [
          'Simulate a Cache Stampede (Thundering Herd) and Singleflight defense in 3D!',
          'Explain Consistent Hashing rings when adding or removing cache nodes in 3D.',
          'Quiz me on Cache-Aside vs. Write-Through and Stampede protection!',
        ],
        nodeColors: ['#f43f5e', '#fbbf24', '#60a5fa'],
        quizQ:
          'Which technique prevents a Cache Stampede (Thundering Herd) when a hot cache key expires under high concurrency?',
        quizOpts: [
          'Request coalescing (Singleflight / mutex lock) or probabilistic early expiration so only one worker recomputes the value',
          'Deleting the entire database whenever a key expires',
          'Setting TTL to 0 milliseconds on every key',
          'Opening 10,000 duplicate database connections per user click',
        ],
        quizCorrect: 0,
        quizExp:
          'Singleflight (request coalescing) ensures only one pod fetches from the database on a cache miss while concurrent requests share the result.',
      },
      {
        slug: '04-firestore-raft-consensus',
        title: 'Multi-Region Replication, Raft Consensus & ACID Transactions',
        summary:
          'Understand quorum writes, leader election, and optimistic concurrency control across distributed nodes.',
        greeting: `Welcome to **#04-firestore-raft-consensus**! 🏆 Ready for Staff-level distributed systems? Let's inspect how **Cloud Firestore** commits state across replicas without split-brain corruption!`,
        prompts: [
          'Visualize Raft Leader Election and Quorum Writes (N=3 or N=5) in 3D!',
          'Explain CAP Theorem trade-offs during a network partition in 3D.',
          'Launch the +35 Candy Cloud Architecture Boss Quiz!',
        ],
        nodeColors: ['#fbbf24', '#34d399', '#a855f7'],
        quizQ:
          'In a 5-node Raft consensus cluster, how many nodes must acknowledge a log entry before the leader can safely commit it?',
        quizOpts: [
          'A majority quorum of at least 3 nodes (⌊N/2⌋ + 1)',
          'Only 1 node (the client browser)',
          'All 5 nodes plus 2 external DNS servers',
          'Zero nodes',
        ],
        quizCorrect: 0,
        quizExp:
          'A majority quorum (3 of 5) guarantees that any future elected leader overlaps in at least one node containing the committed entry.',
      },
    ],
    'bio-mentor': [
      {
        slug: '01-alpha-helix-h-bonds',
        title: 'Polypeptide Backbone & Alpha-Helix Hydrogen Bonds',
        summary:
          'Trace peptide bonds from N-Terminus to C-Terminus and see how i → i+3/i+4 hydrogen bonds stabilize helices.',
        greeting: `Hi there! I'm **${mentor.name}**! 🧬 Welcome to **#01-alpha-helix-h-bonds**! Rotate our 3D molecule on the right—do you see the pink **Peptide Bond** chain from **N-Terminus (Met-1)** to **C-Terminus Domain**, held together by cyan **H-Bond** bridges?`,
        prompts: [
          'Explain how Hydrogen Bonds fold a linear amino acid chain into a 3D Alpha Helix!',
          'Why do hydrophobic residues tuck into the interior core of a protein in water?',
          'Quiz me on Primary, Secondary, Tertiary, and Quaternary protein structure!',
        ],
        nodeColors: ['#fb7185', '#38bdf8', '#f43f5e'],
        quizQ:
          'What primary non-covalent interaction stabilizes the helical backbone of an Alpha-Helix in secondary protein structure?',
        quizOpts: [
          'Hydrogen bonds between the backbone carbonyl oxygen (C=O) of residue i and the amide hydrogen (N-H) of residue i+3 / i+4',
          'Metallic bonds between iron atoms in the solvent',
          'Gravitational attraction between ribosome subunits',
          'Radioactive decay of peptide bonds',
        ],
        quizCorrect: 0,
        quizExp:
          'Regular backbone hydrogen bonding between C=O and N-H groups every turn coils the polypeptide chain into a stable alpha-helix.',
      },
      {
        slug: '02-active-site-ligand-docking',
        title: 'Catalytic Active Site Pocket & ATP Ligand Docking',
        summary:
          'Explore induced-fit molecular recognition and cofactor binding inside 3D enzyme pockets.',
        greeting: `Welcome to **#02-active-site-ligand-docking**! 🔬 Look closely at **Active Site Pocket** and the glowing cyan ring **ATP Ligand Cofactor** in our 3D viewer on the right! How does an enzyme recognize its exact substrate out of thousands of molecules in a cell?`,
        prompts: [
          'Visualize Lock-and-Key vs. Induced-Fit enzyme catalysis in 3D!',
          'How does a single point mutation in the Active Site Pocket affect ligand binding?',
          'Give me a Candy quiz on Enzyme Kinetics & Ligand Docking!',
        ],
        nodeColors: ['#fda4af', '#38bdf8', '#34d399'],
        quizQ:
          'How do enzymes accelerate biochemical reactions inside the catalytic active site pocket?',
        quizOpts: [
          'By stabilizing the transition state and lowering the activation energy barrier (ΔG‡) through precise 3D side-chain geometry',
          'By boiling the entire cell to 500°C',
          'By permanently changing the thermodynamic equilibrium constant of the products',
          'By destroying ATP without releasing energy',
        ],
        quizCorrect: 0,
        quizExp:
          'Enzymes orient substrates and stabilize the high-energy transition state, dramatically lowering activation energy without altering overall ΔG.',
      },
      {
        slug: '03-crispr-cas9-dna-cleavage',
        title: 'CRISPR-Cas9 Guide RNA & Target DNA Cleavage in 3D',
        summary:
          'Model how Cas9 scans PAM sequences, unwinds the DNA double helix, and forms an R-loop for precision editing.',
        greeting: `Welcome to **#03-crispr-cas9-dna-cleavage**! ✂️ Want to see how **CRISPR-Cas9** acts like a 3D molecular GPS + scissors? Before Cas9 even unzips DNA to check the 20-nucleotide guide RNA, it looks for a tiny 3-letter **PAM motif (5'-NGG-3')**!`,
        prompts: [
          'Generate a 3D model of CRISPR-Cas9 scanning PAM sites and unwinding DNA!',
          'Why is the PAM sequence essential so CRISPR doesn’t cut its own bacterial locus?',
          'Quiz me on CRISPR-Cas9 R-loop formation and gene editing!',
        ],
        nodeColors: ['#f472b6', '#a855f7', '#38bdf8'],
        quizQ:
          'In CRISPR-Cas9 gene editing, what must Cas9 recognize on the target DNA before unwinding the double helix to match the guide RNA?',
        quizOpts: [
          'A short PAM (Protospacer Adjacent Motif, such as 5′-NGG-3′) immediately adjacent to the target site',
          'The entire chromosome telomere cap',
          'A lipid bilayer membrane channel',
          'A ribosome stop codon',
        ],
        quizCorrect: 0,
        quizExp:
          'Cas9 rapidly scans DNA for PAM sequences first; only upon PAM binding does it melt the local duplex to test guide-RNA complementarity.',
      },
      {
        slug: '04-alphafold-protein-folding',
        title: 'Levinthal’s Paradox & AI 3D Structure Prediction',
        summary:
          'How proteins fold in milliseconds on funnel energy landscapes and how Evoformer attention predicts 3D coordinates.',
        greeting: `Welcome to **#04-alphafold-protein-folding**! 🏆 If a 100-residue protein tried every random 3D conformation, it would take longer than the age of the universe (**Levinthal's Paradox**)—yet it folds in milliseconds! Let's explore how nature and Bio-AI solve 3D folding!`,
        prompts: [
          'Visualize the 3D Folding Energy Funnel and hydrophobic core collapse!',
          'How does AlphaFold predict 3D Cα coordinates from multiple sequence alignments?',
          'Launch the +35 Candy Bio-AI Boss Quiz!',
        ],
        nodeColors: ['#ec4899', '#38bdf8', '#fbbf24'],
        quizQ:
          'How does nature resolve Levinthal’s Paradox so proteins fold in milliseconds instead of billions of years?',
        quizOpts: [
          'Cooperative local interactions guide the polypeptide down a funnel-shaped free-energy landscape toward the native minimum',
          'Each protein tests every possible conformation sequentially at 1 per second',
          'Proteins remain completely unfolded flat lines inside cells',
          'DNA manually folds every amino acid using mechanical gears',
        ],
        quizCorrect: 0,
        quizExp:
          'Rather than a random exhaustive search, hydrophobic collapse and local hydrogen bonds steer folding down a steep thermodynamic energy funnel.',
      },
    ],
    'astro-guide': [
      {
        slug: '01-event-horizon-schwarzschild',
        title: 'Singularity, Schwarzschild Radius & Event Horizon Geometry',
        summary:
          'Explore the point of no return where escape velocity equals the speed of light (R_s = 2GM/c²).',
        greeting: `Meow—hello stargazer! I'm **${mentor.name}**! 🐾🌌 Welcome to **#01-event-horizon-schwarzschild**. Gaze into **Singularity & Event Horizon** and **Photon Ring & Inner Disk** in our 3D cosmos on the right. What happens to time itself as a clock approaches the Event Horizon?`,
        prompts: [
          'Explain gravitational time dilation near the Event Horizon in 3D!',
          'What is the Photon Sphere at r = 1.5 R_s where light orbits in circles?',
          'Quiz me on Schwarzschild Radius and escape velocity!',
        ],
        nodeColors: ['#c084fc', '#818cf8', '#38bdf8'],
        quizQ:
          'If our Sun were compressed into a black hole without changing its mass, what would happen to Earth’s orbit?',
        quizOpts: [
          'Earth would continue in the exact same orbit because gravitational curvature at Earth’s distance depends only on total mass M',
          'Earth would be sucked into the event horizon within 8 minutes',
          'Earth would fly out of the galaxy immediately',
          'Gravity would reverse into repulsion',
        ],
        quizCorrect: 0,
        quizExp:
          'By Birkhoff’s theorem and Newton/Einstein gravity, exterior spacetime curvature at distance r >> R_s depends only on total enclosed mass M!',
      },
      {
        slug: '02-relativistic-accretion-jets',
        title: 'Accretion Disk Plasma & Blandford-Znajek Polar Jets',
        summary:
          'See how twisted magnetic fields extract rotational energy to launch twin plasma jets at 99% light speed.',
        greeting: `Welcome to **#02-relativistic-accretion-jets**! ⚡ Look at **Relativistic North Jet** and **Relativistic South Jet** blasting out of the poles in our 3D model on the right! If nothing can escape from *inside* a black hole, where do those colossal jets come from?`,
        prompts: [
          'Trace how the Accretion Disk and magnetic fields launch Relativistic Jets in 3D!',
          'Why does one side of the Outer Plasma Torus look brighter due to Doppler beaming?',
          'Give me a Candy quiz on Black Hole Accretion & Polar Jets!',
        ],
        nodeColors: ['#38bdf8', '#c084fc', '#fbbf24'],
        quizQ:
          'How do supermassive black holes launch relativistic polar jets without violating the rule that nothing escapes from inside the event horizon?',
        quizOpts: [
          'Twisted magnetic fields in the spinning accretion disk and ergosphere outside the horizon accelerate surrounding plasma along the poles',
          'Matter tunnels directly out of the central singularity at 10x light speed',
          'Nuclear fusion inside the singularity ejects solid rock',
          'Jets are optical illusions caused by telescope lenses',
        ],
        quizCorrect: 0,
        quizExp:
          'The Blandford-Znajek mechanism extracts rotational energy from the ergosphere just outside the event horizon via wound-up magnetic field lines.',
      },
      {
        slug: '03-spacetime-gravitational-lensing',
        title: 'Einstein Rings, Geodesics & Gravitational Lensing in 3D',
        summary:
          'Follow light packets from distant stars bending along curved spacetime geodesics around massive objects.',
        greeting: `Welcome to **#03-spacetime-gravitational-lensing**! ✨ Follow the purple **Spacetime Geodesic** packet from **Gravitationally Lensed Star** curving around the black hole in our 3D viewer! If photons have **zero rest mass**, why does gravity bend light?`,
        prompts: [
          'Show me in 3D how curved spacetime bends massless photons into an Einstein Ring!',
          'How do astronomers use Gravitational Lensing to map invisible Dark Matter?',
          'Quiz me on General Relativity and Geodesics!',
        ],
        nodeColors: ['#fbbf24', '#c084fc', '#818cf8'],
        quizQ:
          'According to Einstein’s General Relativity, why do massless photons bend when passing near a massive star or black hole?',
        quizOpts: [
          'Mass-energy curves the 4D geometry of spacetime itself, and photons follow the straightest possible paths (null geodesics) through that curved geometry',
          'Photons actually have heavy iron cores that feel Newtonian attraction',
          'Magnetic fields refract all light regardless of wavelength',
          'Space is filled with glass prisms around every star',
        ],
        quizCorrect: 0,
        quizExp:
          'In General Relativity, gravity is the curvature of spacetime; light travels along null geodesics which appear bent in curved coordinates.',
      },
      {
        slug: '04-pulsar-magnetosphere-3d',
        title: 'Neutron Star Pulsars, Lighthouse Beams & Gravitational Waves',
        summary:
          'Model millisecond-spinning neutron stars, misaligned magnetic dipole beams, and binary inspiral ripples.',
        greeting: `Welcome to **#04-pulsar-magnetosphere-3d**! 🏆 Imagine packing the mass of our Sun into a sphere only **20 km across** spinning 700 times per second! Ready to model a **Neutron Star Pulsar** in 3D?`,
        prompts: [
          'Generate a 3D Neutron Star Pulsar with misaligned magnetic lighthouse beams!',
          'Why do neutron star mergers emit both Gravitational Waves and kilonova light?',
          'Launch the +35 Candy Astrophysics Boss Quiz!',
        ],
        nodeColors: ['#818cf8', '#38bdf8', '#f472b6'],
        quizQ:
          'Why does a collapsing star spin dramatically faster when it shrinks from a 1,000,000 km stellar core down to a 20 km Neutron Star?',
        quizOpts: [
          'Conservation of angular momentum (L = I·ω): as radius r shrinks by ~50,000×, moment of inertia I drops as r², forcing angular velocity ω to skyrocket',
          'External rockets push the neutron star after the supernova',
          'Its mass increases by a factor of a million during collapse',
          'Time runs backward inside neutron stars',
        ],
        quizCorrect: 0,
        quizExp:
          'Just like a figure skater pulling their arms in, shrinking radius r reduces moment of inertia I ∝ M·r², spinning the core up to ratusan Hz.',
      },
    ],
    'ai-companion': [
      {
        slug: '01-token-embeddings-3d-space',
        title: 'Token Embeddings & Positional Encoding in 3D Vector Space',
        summary:
          'See how discrete words map into continuous high-dimensional vectors where semantic similarity equals cosine proximity.',
        greeting: `Woof! Hi friend, I'm **${mentor.name}**! 🐶✨ Welcome to **#01-token-embeddings-3d-space**! Look at **Input Token Embedding** at the base of our 3D neural network on the right. Why can't a Transformer process raw words without **Positional Encoding**?`,
        prompts: [
          'Show me how Token Embeddings + Positional Encodings combine in 3D vector space!',
          'Why does King - Man + Woman ≈ Queen work geometrically with cosine similarity?',
          'Quiz me on Tokenization & Embedding Vectors!',
        ],
        nodeColors: ['#fbbf24', '#38bdf8', '#34d399'],
        quizQ:
          'Why must Transformers add Positional Encodings (such as RoPE or sinusoidal vectors) to input token embeddings?',
        quizOpts: [
          'Because self-attention treats tokens as an order-invariant set without recurrence, so positional vectors inject word-order geometry',
          'To convert floating-point numbers into ASCII strings',
          'To delete half the vocabulary randomly',
          'Because GPUs cannot add matrices without sine waves',
        ],
        quizCorrect: 0,
        quizExp:
          'Without recurrence or convolution, permutation of input tokens would yield identical attention scores unless position is encoded into the vectors.',
      },
      {
        slug: '02-qkv-self-attention-heads',
        title: 'Query, Key, Value (QKV) & Scaled Dot-Product Attention',
        summary:
          'Trace how Softmax(QKᵀ / √dₖ)·V dynamically routes context across tokens in 3D.',
        greeting: `Welcome to **#02-qkv-self-attention-heads**! 🧠 Look at **Query (Q)**, **Key (K)**, and **Value (V)** feeding into **Softmax(QKᵀ / √dₖ)** and **Contextual Output Head** on the right! Why do we divide the dot product \`Q·Kᵀ\` by **\`√dₖ\`** before applying Softmax?`,
        prompts: [
          'Walk through Query, Key, and Value projections using a 3D database analogy!',
          'What goes wrong with gradients if we forget to divide QKᵀ by √dₖ?',
          'Give me a Candy quiz on Multi-Head Self-Attention!',
        ],
        nodeColors: ['#38bdf8', '#34d399', '#a855f7'],
        quizQ:
          'In Scaled Dot-Product Attention, why is the dot product Q·Kᵀ divided by √dₖ before applying the Softmax function?',
        quizOpts: [
          'To prevent large dot products in high dimensions from pushing Softmax into saturated regions where gradients vanish near zero',
          'To make the matrix non-square',
          'To force all attention weights to equal negative infinity',
          'To skip multiplying by the Value (V) matrix',
        ],
        quizCorrect: 0,
        quizExp:
          'As dimension dₖ grows, dot-product variance scales by dₖ; scaling by 1/√dₖ keeps variance near 1 so Softmax retains healthy gradients.',
      },
      {
        slug: '03-backprop-loss-landscape',
        title: 'Backpropagation, Chain Rule & 3D Loss Landscape Optimization',
        summary:
          'Follow gradient vectors (-∇L) descending 3D loss surfaces and see how residual skip connections save gradients.',
        greeting: `Welcome to **#03-backprop-loss-landscape**! ⛰️ When training a 100-layer deep network, gradients flowing backward can shrink to zero (**Vanishing Gradients**). Do you know the simple 3D architectural bridge that solved this?`,
        prompts: [
          'Visualize Gradient Descent and Adam momentum across a 3D Loss Landscape!',
          'Show me in 3D how Residual Skip Connections (x + F(x)) create a gradient highway!',
          'Quiz me on Backpropagation and LayerNorm!',
        ],
        nodeColors: ['#f59e0b', '#ec4899', '#38bdf8'],
        quizQ:
          'How do Residual Connections (y = x + F(x)) enable training very deep Transformer and ResNet architectures?',
        quizOpts: [
          'The identity term (+ x) creates an unimpeded gradient highway (∂y/∂x = 1 + ∂F/∂x) so gradients flow directly to early layers without vanishing',
          'They freeze all weights at random initial values',
          'They remove the loss function completely',
          'They force learning rate to zero on step 1',
        ],
        quizCorrect: 0,
        quizExp:
          'Differentiating x + F(x) yields 1 + F′(x), ensuring upstream gradients propagate backward across dozens of layers without multiplicative collapse.',
      },
      {
        slug: '04-multi-agent-orchestration',
        title: 'Reasoning Loops, Tool Calling & Multi-Agent Topologies',
        summary:
          'Design autonomous AI agents that plan, invoke tools, synthesize 3D scenes, and verify outputs.',
        greeting: `Welcome to **#04-multi-agent-orchestration**! 🏆 Here we zoom out to how AI agents like me (**${mentor.name}**) combine reasoning, structured JSON schemas, and tool calls! Ready for the Deep Learning Boss Challenge?`,
        prompts: [
          'Model a Router + Specialist Multi-Agent architecture in 3D!',
          'How does KV-Cache speed up autoregressive token generation in 3D?',
          'Launch the +35 Candy AI & Neural Nets Boss Quiz!',
        ],
        nodeColors: ['#a855f7', '#fbbf24', '#34d399'],
        quizQ:
          'Why do production LLM inference engines maintain a KV-Cache during autoregressive token generation?',
        quizOpts: [
          'To store previously computed Key and Value tensors for past tokens so each new token only computes Q, K, V for the newest position instead of recomputing the entire sequence',
          'To re-train the entire model from scratch on every generated word',
          'To disable attention between past tokens',
          'To convert GPU FP16 weights into HTML files',
        ],
        quizCorrect: 0,
        quizExp:
          'Caching past K and V projections turns per-step generation from O(T²) recomputation into O(T) linear memory reads.',
      },
    ],
  };

  const fallbackTemplates: ChannelTemplateSpec[] = [
    {
      slug: '01-foundations-and-diagnosis',
      title: `${mentor.shortTag} — Core Foundations & Level Check`,
      summary: `Build rock-solid spatial intuition for ${mentor.subject} and calibrate your starting level.`,
      greeting: `Hi! I'm **${mentor.name}** (${mentor.roleTitle})! 👋 Welcome to **#01-foundations-and-diagnosis**. Check out **${primaryNode}** and **${secondaryNode}** in our **${mentor.subject}** 3D model on the right. Tell me a bit about your background, or click a prompt below so I can tailor this course to you!`,
      prompts: [
        `Diagnose my level in ${mentor.subject} with a quick warm-up!`,
        `Explain the 3D model for ${mentor.shortTag} using an everyday analogy.`,
        `Give me a Beginner-friendly quiz to earn my first Candy!`,
      ],
      nodeColors: [mentor.accentColor, mentor.secondaryColor, '#34d399'],
      quizQ: `When exploring ${mentor.subject} in this channel, how do the 3D nodes and animated packets help you learn?`,
      quizOpts: [
        'They map abstract concepts into concrete spatial nodes and live directional interactions',
        'They hide all relationships between system components',
        'They replace logical reasoning with random guessing',
        'They restrict learning to static text memorization',
      ],
      quizCorrect: 0,
      quizExp: `Spatial 3D visualization turns abstract ${mentor.subject} relationships into concrete mental models you can rotate and inspect!`,
    },
    {
      slug: '02-spatial-3d-architecture',
      title: `${mentor.shortTag} — Deep 3D Architecture`,
      summary: `Inspect internal state transitions, vector flows, and structural trade-offs in 3D.`,
      greeting: `Welcome to **#02-spatial-3d-architecture**! 🚀 In this curriculum channel, we zoom inside the core engine of **${mentor.subject}**. Notice how packets flow between **${primaryNode}** and **${secondaryNode}** in the 3D viewer—which part of this pipeline looks most intriguing to you?`,
      prompts: [
        `Break down each node in this ${mentor.shortTag} 3D architecture!`,
        `What happens if ${primaryNode} in this 3D model becomes a bottleneck?`,
        `Generate an Intermediate 3D simulation and quiz!`,
      ],
      nodeColors: ['#38bdf8', mentor.accentColor, '#f59e0b'],
      quizQ: `In an intermediate ${mentor.subject} architecture, why is separating responsibilities across modular nodes critical?`,
      quizOpts: [
        'It isolates state transitions, prevents cascading bottlenecks, and keeps data flow predictable',
        'It forces every calculation to wait on a single global lock',
        'It doubles memory latency without any structural benefit',
        'It disables error recovery across the pipeline',
      ],
      quizCorrect: 0,
      quizExp:
        'Modular node boundaries allow each stage to scale, optimize, and recover independently while maintaining clean interfaces.',
    },
    {
      slug: '03-bottlenecks-and-edge-cases',
      title: `${mentor.shortTag} — Bottlenecks & Edge Cases`,
      summary: `Stress-test failure modes, performance limits, and real-world optimization tricks.`,
      greeting: `Hey! Glad to see you in **#03-bottlenecks-and-edge-cases**! 🔍 Real mastery in **${mentor.subject}** comes from knowing where systems break under pressure. Want me to simulate a high-load edge case in our 3D viewer right now?`,
      prompts: [
        `Show me a 3D bottleneck scenario in ${mentor.subject} and how to fix it!`,
        `What is the #1 mistake engineers make in ${mentor.shortTag}?`,
        `Test me with a tricky edge-case Candy quiz!`,
      ],
      nodeColors: ['#f43f5e', '#f59e0b', mentor.accentColor],
      quizQ: `When diagnosing a performance bottleneck in ${mentor.subject}, what should you inspect first?`,
      quizOpts: [
        'The highest-latency critical path and high-contention hub nodes in the topology',
        'Only the color theme of the terminal window',
        'Nodes that receive zero traffic',
        'Comments in unrelated files',
      ],
      quizCorrect: 0,
      quizExp:
        'Amdahl’s Law and critical-path analysis show that optimizing the highest-contention hub node yields the largest end-to-end speedup.',
    },
    {
      slug: '04-mastery-boss-challenge',
      title: `${mentor.shortTag} — Advanced Boss Challenge`,
      summary: `Synthesize everything you've learned with advanced 3D scenarios and high-reward Candy quizzes.`,
      greeting: `Welcome to **#04-mastery-boss-challenge**! 🏆 Ready to put your **${mentor.subject}** intuition to the ultimate test? Tell me when you're ready and I'll generate an Advanced 3D puzzle and a **+35 🍬 Candy** boss quiz!`,
      prompts: [
        `Launch the Advanced ${mentor.shortTag} 3D Boss Challenge!`,
        `Ask me an Olympiad / Staff-level design question on ${mentor.subject}!`,
        `Generate a +35 Candy boss quiz right now!`,
      ],
      nodeColors: ['#a855f7', '#34d399', '#38bdf8'],
      quizQ: `What distinguishes Advanced mastery in ${mentor.subject} from surface-level familiarity?`,
      quizOpts: [
        'The ability to reason about end-to-end 3D system dynamics, trade-offs, and invariants under adversarial conditions',
        'Memorizing definitions without knowing when they fail',
        'Avoiding quantitative trade-offs',
        'Ignoring boundary conditions',
      ],
      quizCorrect: 0,
      quizExp:
        'True mastery combines intuitive spatial mental models with rigorous reasoning about invariants and trade-offs.',
    },
  ];

  const channelTemplates =
    MENTOR_CURRICULUM_MAP[mentor.id] || fallbackTemplates;

  return channelTemplates.map((tpl, idx) => {
    const customNodes = (baseScene.nodes || []).map((n, nIdx) => ({
      ...n,
      color: tpl.nodeColors[nIdx % tpl.nodeColors.length] || n.color,
    }));

    const firstNodeLabel = customNodes[0]?.label || primaryNode;
    const secondNodeLabel = customNodes[1]?.label || secondaryNode;
    const firstConnLabel =
      baseScene.connections?.[0]?.label || 'active packet stream';

    const proactiveNudges: CourseProactiveNudges = tpl.nudges || {
      pointOut3D: `🔍 **3D Course Observation (#${tpl.slug})**: Take a look at **${firstNodeLabel}** connected to **${secondNodeLabel}** via **${firstConnLabel}** in the 3D viewer on the right! In the context of **${tpl.title}**, what do you think happens to the downstream nodes if **${firstNodeLabel}** changes state or spikes 10x?`,
      socraticQuestion: `🎯 **Socratic Check-In (+10 🍬 Candy)**: We're learning **${tpl.title}** right now! Before I dive deeper, how would you explain the role of **${firstNodeLabel}** in one simple sentence? Give it a shot and I'll calibrate your level!`,
      realWorldTip: `💡 **${mentor.name}'s Course Insight**: In real-world **${mentor.subject}**, the biggest "aha!" moment for **#${tpl.slug}** is seeing how **${firstNodeLabel}** and **${secondNodeLabel}** trade off speed vs. stability. Want me to build a live 3D comparison or give you a quick analogy?`,
      followUpChips: [
        tpl.prompts[0],
        `Explain how ${firstNodeLabel} interacts with ${secondNodeLabel} in 3D!`,
        tpl.prompts[2] || `Quiz me on ${tpl.title}!`,
      ],
    };

    return {
      id: `${mentor.id}-${tpl.slug}`,
      slug: tpl.slug,
      title: tpl.title,
      summary: tpl.summary,
      proactiveGreeting: tpl.greeting,
      proactiveNudges,
      starterPrompts: tpl.prompts,
      scene3d: {
        ...baseScene,
        title: `${tpl.title} (3D)`,
        conceptSummary: tpl.summary,
        nodes: customNodes,
      },
      quiz: {
        id: `quiz-${mentor.id}-${idx}`,
        topic: tpl.title,
        difficulty: idx === 0 ? 'beginner' : idx === 3 ? 'advanced' : 'intermediate',
        question: tpl.quizQ,
        options: tpl.quizOpts,
        correctIndex: tpl.quizCorrect,
        explanation: tpl.quizExp,
        candyReward: idx === 3 ? 35 : 25,
      },
    };
  });
}

function buildClientFallbackResponse(
  mentor: MentorConfig,
  channelTitle: string,
  userPrompt: string,
  currentLevel: StudentLevel
): MentorAgentTurnResponse {
  const nextLevel: StudentLevel =
    currentLevel === 'unassessed' ? 'intermediate' : currentLevel;
  const cleanTopic = userPrompt.slice(0, 42);

  return {
    replyText: `Great point in **#${channelTitle}**! As **${mentor.name}**, I've updated the **Gemini 4 Argon** 3D model on the right for **"${cleanTopic}"**.\n\n- **Spatial Nodes**: Represent the core functional states in this curriculum step.\n- **Animated Packets**: Show live data/pointer transitions across connected layers.\n\nRotate the 3D scene on the right and try the updated **Candy Quiz** below!`,
    avatarState: 'talking',
    assessedLevel: nextLevel,
    levelReason:
      'Calibrated to Intermediate based on your question inside this curriculum channel.',
    learningStepTitle: `${cleanTopic} — 3D Breakdown`,
    keyTakeaways: [
      `Trace how ${mentor.shortTag} components interact across 3D nodes`,
      'Spot bottlenecks by watching packet density along directed edges',
      'Solve the curriculum quiz to earn +25 🍬 Candy',
    ],
    scene3d: {
      ...mentor.defaultScene3d,
      title: `${cleanTopic} · Argon 3D`,
      conceptSummary: `Interactive 3D topology synthesized for "${cleanTopic}".`,
    },
    quiz: {
      id: `quiz-${Date.now()}`,
      topic: cleanTopic,
      difficulty: nextLevel,
      question: `In the 3D model for "${cleanTopic}", what do the directed packet flows between nodes illustrate?`,
      options: [
        'Live state transitions, memory/data transfers, and causal dependencies between layers',
        'Disconnected components with zero runtime interaction',
        'Static comments that are stripped at compile time',
        'Random noise unrelated to system execution',
      ],
      correctIndex: 0,
      explanation:
        'Each animated packet represents an active transfer of data, pointers, or control signals across the architecture.',
      candyReward: 25,
    },
    candyDelta: 10,
    suggestedFollowUps: [
      'Show me what happens when load spikes 10x in this 3D model!',
      'Give me a deeper Advanced explanation and quiz!',
      'How does this connect to the next curriculum channel?',
    ],
    modelUsed: 'gemini-4-argon',
  };
}

function getDefaultLevelReason(mentor: MentorConfig, level: StudentLevel): string {
  if (level !== 'unassessed') {
    return `${mentor.name} calibrated ${mentor.shortTag} courses to your ${LEVEL_BADGE_MAP[level].label} level.`;
  }
  return `${mentor.name} (${mentor.roleTitle}) diagnoses your ${mentor.shortTag} mastery from your questions.`;
}

export function MentorStudioView({
  mentor: initialMentor,
  standaloneTestMode = false,
}: MentorStudioViewProps) {
  const {
    profile,
    addCandy,
    updateMentorLevel,
    markQuizCompleted,
    customRivFiles,
    setIsShopOpen,
  } = useUserProgress();

  // Slack Workspace Rail: All mentors available to switch on the far-left rail, preserving any custom overrides on initialMentor
  const workspaceMentors = useMemo(() => {
    const exists = MENTORS.some((m) => m.id === initialMentor.id);
    if (exists) {
      return MENTORS.map((m) => (m.id === initialMentor.id ? initialMentor : m));
    }
    return [initialMentor, ...MENTORS];
  }, [initialMentor]);

  const [activeMentor, setActiveMentor] = useState<MentorConfig>(initialMentor);

  // Build Curriculum Channels for each mentor (Slack Channels sidebar)
  const [customChannelsByMentor, setCustomChannelsByMentor] = useState<
    Record<string, CurriculumChannel[]>
  >({});
  const [newChannelName, setNewChannelName] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  const curriculumChannels = useMemo(() => {
    const base = buildCurriculumForMentor(activeMentor);
    const extra = customChannelsByMentor[activeMentor.id] || [];
    return [...base, ...extra];
  }, [activeMentor, customChannelsByMentor]);

  const [activeChannelId, setActiveChannelId] = useState<string>(
    () => buildCurriculumForMentor(initialMentor)[0].id
  );

  // Sync if initialMentor prop changes via route navigation
  useEffect(() => {
    setActiveMentor(initialMentor);
    const chs = buildCurriculumForMentor(initialMentor);
    setActiveChannelId(chs[0].id);
  }, [initialMentor]);

  const activeChannel = useMemo(
    () =>
      curriculumChannels.find((c) => c.id === activeChannelId) ||
      curriculumChannels[0],
    [curriculumChannels, activeChannelId]
  );

  // Per-channel independent conversation & 3D lesson state
  const [threadsByChannel, setThreadsByChannel] = useState<
    Record<string, ChannelThreadState>
  >({});

  // Rive Avatar State
  const [avatarState, setAvatarState] = useState<RiveAvatarState>('talking');
  const talkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Student Autonomous Diagnostic State for active mentor
  const savedLevel = profile.mentorLevels?.[activeMentor.id] || 'unassessed';
  const [assessedLevel, setAssessedLevel] = useState<StudentLevel>(savedLevel);
  const [levelReason, setLevelReason] = useState<string>(() =>
    getDefaultLevelReason(initialMentor, savedLevel)
  );

  // Keep assessedLevel and levelReason synchronized whenever activeMentor or savedLevel changes
  useEffect(() => {
    const nextLevel = profile.mentorLevels?.[activeMentor.id] || 'unassessed';
    setAssessedLevel(nextLevel);
    setLevelReason(getDefaultLevelReason(activeMentor, nextLevel));
  }, [activeMentor, profile.mentorLevels]);

  // Chat Input State & Standalone Room Test Bar State
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [candyToast, setCandyToast] = useState<string | null>(null);
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileLabOpen, setIsMobileLabOpen] = useState(false);
  const [isRoomTestOpen, setIsRoomTestOpen] =
    useState<boolean>(standaloneTestMode);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const triggerTemporaryAvatarState = useCallback(
    (targetState: RiveAvatarState, durationMs = 2800) => {
      if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
      setAvatarState(targetState);
      talkTimerRef.current = setTimeout(() => {
        setAvatarState('idle');
      }, durationMs);
    },
    []
  );

  const showCandyNotification = useCallback((message: string) => {
    setCandyToast(message);
    setTimeout(() => {
      setCandyToast(null);
    }, 3200);
  }, []);

  // Ensure every curriculum channel initializes with the Mentor proactively speaking first!
  useEffect(() => {
    if (!activeChannel) return;
    setThreadsByChannel((prev) => {
      if (prev[activeChannel.id]) return prev;
      const initialMsg: ChatMessage = {
        id: `proactive-${activeChannel.id}`,
        role: 'mentor',
        text: activeChannel.proactiveGreeting,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        avatarState: 'talking',
        assessedLevel: savedLevel,
        scene3d: activeChannel.scene3d,
        proactiveBadge: `Proactive Welcome · #${activeChannel.slug}`,
        suggestedFollowUps: activeChannel.starterPrompts,
        modelUsed: 'gemini-4-argon',
      };
      return {
        ...prev,
        [activeChannel.id]: {
          messages: [initialMsg],
          scene3d: activeChannel.scene3d,
          quiz: activeChannel.quiz,
          learningStepTitle: activeChannel.title,
          keyTakeaways: [
            activeChannel.summary,
            'Interact with the 3D nodes on the right to inspect spatial flows',
            'Solve the channel quiz below to earn Candy rewards',
          ],
        },
      };
    });

    // Mentor speaks proactively whenever you enter a channel
    triggerTemporaryAvatarState('talking', 2600);
  }, [activeChannel, savedLevel, triggerTemporaryAvatarState]);

  const currentThread: ChannelThreadState = useMemo(() => {
    if (threadsByChannel[activeChannel.id]) {
      return threadsByChannel[activeChannel.id];
    }
    return {
      messages: [
        {
          id: `proactive-${activeChannel.id}`,
          role: 'mentor',
          text: activeChannel.proactiveGreeting,
          timestamp: 'Just now',
          avatarState: 'talking',
          assessedLevel: savedLevel,
          scene3d: activeChannel.scene3d,
          proactiveBadge: `Proactive Welcome · #${activeChannel.slug}`,
          suggestedFollowUps: activeChannel.starterPrompts,
          modelUsed: 'gemini-4-argon',
        },
      ],
      scene3d: activeChannel.scene3d,
      quiz: activeChannel.quiz,
      learningStepTitle: activeChannel.title,
      keyTakeaways: [activeChannel.summary],
    };
  }, [threadsByChannel, activeChannel, savedLevel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread.messages, isLoading]);

  // Switch Mentor in the Leftmost Slack Workspace Rail
  const handleSelectWorkspaceMentor = (nextMentor: MentorConfig) => {
    setActiveMentor(nextMentor);
    const nextChannels = buildCurriculumForMentor(nextMentor);
    setActiveChannelId(nextChannels[0].id);
    const nextSavedLevel =
      profile.mentorLevels?.[nextMentor.id] || 'unassessed';
    setAssessedLevel(nextSavedLevel);
    setLevelReason(getDefaultLevelReason(nextMentor, nextSavedLevel));
    triggerTemporaryAvatarState('talking', 2800);

    // Sync browser URL without full page reload so the URL matches the selected mentor
    if (typeof window !== 'undefined') {
      const targetUrl =
        standaloneTestMode || window.location.pathname.startsWith('/room')
          ? `/room?mentor=${nextMentor.id}`
          : `/mentor/${nextMentor.id}`;
      window.history.replaceState(null, '', targetUrl);
    }
  };

  // Switch Curriculum Channel in the Slack Channels Sidebar
  const handleSelectChannel = (ch: CurriculumChannel) => {
    setActiveChannelId(ch.id);
    setIsMobileChannelsOpen(false);
    triggerTemporaryAvatarState('talking', 2400);
  };

  // Add a custom Curriculum Channel to the active mentor
  const handleCreateCustomChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newChannelName.trim();
    if (!raw) return;
    const cleanSlug = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const idx = curriculumChannels.length + 1;
    const prefix = idx < 10 ? `0${idx}` : `${idx}`;
    const fullSlug = `${prefix}-${cleanSlug || 'custom-topic'}`;

    const customChannel: CurriculumChannel = {
      id: `${activeMentor.id}-${fullSlug}-${Date.now()}`,
      slug: fullSlug,
      title: raw,
      summary: `Custom curriculum channel for ${raw} with ${activeMentor.name}.`,
      proactiveGreeting: `Welcome to your new curriculum channel **#${fullSlug}**! 🎉 I'm **${activeMentor.name}**, and I'll lead this session on **${raw}**. Let's kick off: what's the #1 thing about **${raw}** you want to see modeled in 3D right now?`,
      proactiveNudges: {
        pointOut3D: `🔍 **3D Observation (#${fullSlug})**: Look at how the 3D nodes on the right model **${raw}**. Which component do you think is the most critical bottleneck?`,
        socraticQuestion: `🎯 **Socratic Check (+10 🍬)**: In your own words, what problem does **${raw}** solve? Answer in one line and I'll calibrate the 3D scene to your level!`,
        realWorldTip: `💡 **${activeMentor.name}'s Course Tip**: The fastest way to master **${raw}** is to trace how state flows from input to output in 3D. Want me to generate a custom 3D breakdown?`,
        followUpChips: [
          `Build a 3D model of the core architecture of ${raw}`,
          `Explain ${raw} from first principles and diagnose my level`,
          `Give me a Candy quiz on ${raw}!`,
        ],
      },
      starterPrompts: [
        `Build a 3D model of the core architecture of ${raw}`,
        `Explain ${raw} from first principles and diagnose my level`,
        `Give me a Candy quiz on ${raw}!`,
      ],
      scene3d: {
        ...activeMentor.defaultScene3d,
        title: `${raw} — 3D Spatial Model`,
        conceptSummary: `Interactive 3D architecture for ${raw}`,
      },
      quiz: {
        id: `quiz-custom-${Date.now()}`,
        topic: raw,
        difficulty: 'intermediate',
        question: `What is the primary goal of modeling "${raw}" in 3D with ${activeMentor.name}?`,
        options: [
          'To visualize structural nodes, state transitions, and live directional packet flows',
          'To memorize isolated terms without context',
          'To skip foundational principles',
          'To avoid testing understanding',
        ],
        correctIndex: 0,
        explanation: `Visualizing ${raw} in 3D reveals how each component interacts dynamically.`,
        candyReward: 25,
      },
    };

    setCustomChannelsByMentor((prev) => ({
      ...prev,
      [activeMentor.id]: [...(prev[activeMentor.id] || []), customChannel],
    }));
    setActiveChannelId(customChannel.id);
    setNewChannelName('');
    setIsAddingChannel(false);
  };

  // Course-Driven Proactive Mentor Nudge ("내가 배우고 있는 코스에 따른 Proactive 메시지")
  const handleMentorSpeakFirst = (preferredType?: ProactiveNudgeType) => {
    if (isLoading) return;

    const liveNodes = currentThread.scene3d?.nodes || [];
    const primaryNodeLabel = liveNodes[0]?.label || 'Primary Node';
    const secondaryNodeLabel = liveNodes[1]?.label || 'Connected Node';

    const nudgeTypes: ProactiveNudgeType[] = [
      '3d_pointout',
      'socratic_quiz',
      'real_world_tip',
    ];
    const selectedType =
      preferredType ||
      nudgeTypes[currentThread.messages.length % nudgeTypes.length];

    let text = '';
    let badge = '';
    let targetEmotion: RiveAvatarState = 'talking';

    if (selectedType === '3d_pointout') {
      text =
        activeChannel.proactiveNudges.pointOut3D ||
        `🔍 **3D Observation (#${activeChannel.slug})**: Look at **${primaryNodeLabel}** and **${secondaryNodeLabel}** in the 3D viewer on the right. Notice how the animated packets flow between them—what happens if **${primaryNodeLabel}** gets overloaded?`;
      badge = `🔍 3D Point-Out · #${activeChannel.slug}`;
      targetEmotion = 'talking';
    } else if (selectedType === 'socratic_quiz') {
      text =
        activeChannel.proactiveNudges.socraticQuestion ||
        `🎯 **Socratic Check (+10 🍬)**: In **${activeChannel.title}**, why does **${primaryNodeLabel}** connect directly to **${secondaryNodeLabel}**? Share your intuition in one sentence!`;
      badge = `🎯 Socratic Check · ${LEVEL_BADGE_MAP[assessedLevel].label}`;
      targetEmotion = 'thinking';
    } else {
      text =
        activeChannel.proactiveNudges.realWorldTip ||
        `💡 **${activeMentor.name}'s Course Tip**: While studying **#${activeChannel.slug}**, try rotating the 3D scene and clicking **${primaryNodeLabel}** to inspect its tooltip! Want me to simulate a real-world failure case in 3D?`;
      badge = `💡 Course Insight · #${activeChannel.slug}`;
      targetEmotion = 'happy';
    }

    const nudgeMsg: ChatMessage = {
      id: `nudge-${Date.now()}`,
      role: 'mentor',
      text,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      avatarState: targetEmotion,
      assessedLevel,
      proactiveBadge: badge,
      suggestedFollowUps: activeChannel.proactiveNudges.followUpChips,
      modelUsed: 'gemini-4-argon',
    };

    setThreadsByChannel((prev) => ({
      ...prev,
      [activeChannel.id]: {
        ...currentThread,
        messages: [...currentThread.messages, nudgeMsg],
      },
    }));
    triggerTemporaryAvatarState('talking', 3000);
  };

  // Send message / run autonomous mentor turn inside the active Curriculum Channel
  const handleSendMessage = async (
    overridePrompt?: string,
    mode: 'chat' | 'generate_3d' | 'generate_quiz' = 'chat'
  ) => {
    const promptText = (overridePrompt ?? inputPrompt).trim();
    if (!promptText || isLoading) return;

    if (!overridePrompt) {
      setInputPrompt('');
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updatedMessages = [...currentThread.messages, userMsg];
    setThreadsByChannel((prev) => ({
      ...prev,
      [activeChannel.id]: {
        ...currentThread,
        messages: updatedMessages,
      },
    }));

    setIsLoading(true);
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    setAvatarState('thinking');

    try {
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.userId || 'demo-scholar-01',
          mentorId: activeMentor.id,
          mentorName: activeMentor.name,
          roleTitle: activeMentor.roleTitle,
          subject: `${activeMentor.subject} (Curriculum Channel: #${activeChannel.slug} - ${activeChannel.title})`,
          systemPersona: activeMentor.systemPersona,
          userMessage: promptText,
          currentLevel: assessedLevel,
          history: updatedMessages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          mode,
        }),
      });

      let data: MentorAgentTurnResponse;
      if (response.ok) {
        data = (await response.json()) as MentorAgentTurnResponse;
      } else {
        data = buildClientFallbackResponse(
          activeMentor,
          activeChannel.slug,
          promptText,
          assessedLevel
        );
      }

      if (data.assessedLevel) {
        setAssessedLevel(data.assessedLevel);
        updateMentorLevel(activeMentor.id, data.assessedLevel);
      }
      if (data.levelReason) {
        setLevelReason(data.levelReason);
      }

      const participationCandy = data.candyDelta || 10;
      addCandy(participationCandy);
      showCandyNotification(
        `+${participationCandy} 🍬 Candy for active learning in #${activeChannel.slug}!`
      );

      const nextScene = data.scene3d?.nodes?.length
        ? data.scene3d
        : currentThread.scene3d;
      const nextQuiz = data.quiz?.options?.length
        ? data.quiz
        : currentThread.quiz;

      const mentorMsg: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: 'mentor',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        avatarState: data.avatarState || 'talking',
        assessedLevel: data.assessedLevel,
        scene3d: nextScene,
        quiz: nextQuiz || undefined,
        candyEarned: participationCandy,
        suggestedFollowUps: data.suggestedFollowUps,
        modelUsed: data.modelUsed || 'gemini-4-argon',
      };

      setThreadsByChannel((prev) => ({
        ...prev,
        [activeChannel.id]: {
          messages: [...updatedMessages, mentorMsg],
          scene3d: nextScene,
          quiz: nextQuiz,
          learningStepTitle:
            data.learningStepTitle || currentThread.learningStepTitle,
          keyTakeaways:
            data.keyTakeaways?.length
              ? data.keyTakeaways
              : currentThread.keyTakeaways,
        },
      }));

      triggerTemporaryAvatarState(data.avatarState || 'talking', 3600);
    } catch {
      const fallback = buildClientFallbackResponse(
        activeMentor,
        activeChannel.slug,
        promptText,
        assessedLevel
      );
      setAssessedLevel(fallback.assessedLevel);
      updateMentorLevel(activeMentor.id, fallback.assessedLevel);
      addCandy(10);

      const fallbackMsg: ChatMessage = {
        id: `mentor-fb-${Date.now()}`,
        role: 'mentor',
        text: fallback.replyText,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        avatarState: 'talking',
        assessedLevel: fallback.assessedLevel,
        scene3d: fallback.scene3d,
        quiz: fallback.quiz,
        candyEarned: 10,
        suggestedFollowUps: fallback.suggestedFollowUps,
        modelUsed: 'gemini-4-argon',
      };

      setThreadsByChannel((prev) => ({
        ...prev,
        [activeChannel.id]: {
          messages: [...updatedMessages, fallbackMsg],
          scene3d: fallback.scene3d || currentThread.scene3d,
          quiz: fallback.quiz ?? currentThread.quiz,
          learningStepTitle:
            fallback.learningStepTitle || currentThread.learningStepTitle,
          keyTakeaways: fallback.keyTakeaways || currentThread.keyTakeaways,
        },
      }));

      triggerTemporaryAvatarState('talking', 3200);
    } finally {
      setIsLoading(false);
    }
  };

  // Event-Driven Post-Quiz Proactive Follow-up in the active course channel
  const handleQuizComplete = (correct: boolean, candyEarned: number) => {
    const firstNode =
      currentThread.scene3d?.nodes?.[0]?.label || 'the primary 3D node';
    const currentIdx = curriculumChannels.findIndex(
      (c) => c.id === activeChannel.id
    );
    const nextChannel =
      curriculumChannels[(currentIdx + 1) % curriculumChannels.length];

    // Record submission to Admin store for human expert supervision
    if (currentThread.quiz) {
      fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.userId || 'demo-scholar-01',
          mentorId: activeMentor.id,
          channelSlug: activeChannel.slug,
          questionText: currentThread.quiz.question,
          options: currentThread.quiz.options,
          selectedOptionIndex: correct ? currentThread.quiz.correctIndex : 0,
          correctOptionIndex: currentThread.quiz.correctIndex,
          isCorrect: correct,
          candyReward: correct ? candyEarned : 0,
          explanation: currentThread.quiz.explanation,
        }),
      }).catch(() => {});
    }

    if (correct) {
      addCandy(candyEarned);
      if (currentThread.quiz?.id) {
        markQuizCompleted(currentThread.quiz.id, candyEarned);
      }
      triggerTemporaryAvatarState('happy', 4000);
      showCandyNotification(
        `🎉 Quiz Mastered! +${candyEarned} 🍬 Candy Earned!`
      );

      const celebrationMsg: ChatMessage = {
        id: `proactive-quiz-win-${Date.now()}`,
        role: 'mentor',
        text: `🎉 **Awesome job on the #${activeChannel.slug} quiz!** You just earned **+${candyEarned} 🍬 Candy**!\n\nNotice how that exact principle plays out around **${firstNode}** in our 3D viewer on the right. Want to push this topic to an **Advanced 3D simulation**, or are you ready to jump into **#${nextChannel.slug}** next?`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        avatarState: 'happy',
        assessedLevel,
        candyEarned,
        proactiveBadge: `🏆 Quiz Mastered · #${activeChannel.slug}`,
        suggestedFollowUps: [
          `Upgrade #${activeChannel.slug} to an Advanced 3D Stress-Test!`,
          `Give me a harder bonus quiz on ${activeChannel.title}!`,
          `How does #${activeChannel.slug} connect to #${nextChannel.slug}?`,
        ],
        modelUsed: 'gemini-4-argon',
      };

      setThreadsByChannel((prev) => ({
        ...prev,
        [activeChannel.id]: {
          ...currentThread,
          messages: [...currentThread.messages, celebrationMsg],
        },
      }));
    } else {
      triggerTemporaryAvatarState('sad', 2600);

      const hintMsg: ChatMessage = {
        id: `proactive-quiz-hint-${Date.now()}`,
        role: 'mentor',
        text: `Almost there! 💡 **Quick #${activeChannel.slug} Hint from ${activeMentor.name}**: Take a look at **${firstNode}** in the 3D viewer on the right and watch the direction of the animated packets. Want me to break down the quiz concept with a simpler 3D analogy?`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        avatarState: 'talking',
        assessedLevel,
        proactiveBadge: `💡 Proactive Quiz Hint · #${activeChannel.slug}`,
        suggestedFollowUps: [
          `Explain the quiz answer for #${activeChannel.slug} with a simple 3D analogy!`,
          `Highlight which 3D node shows the answer!`,
        ],
        modelUsed: 'gemini-4-argon',
      };

      setThreadsByChannel((prev) => ({
        ...prev,
        [activeChannel.id]: {
          ...currentThread,
          messages: [...currentThread.messages, hintMsg],
        },
      }));
    }
  };

  // Room Test Helper: Simulate Student Level change to test Profile Calibration + Level-adaptive Proactive Messages
  const handleSimulateStudentLevel = (targetLevel: StudentLevel) => {
    setAssessedLevel(targetLevel);
    updateMentorLevel(activeMentor.id, targetLevel);
    setLevelReason(
      targetLevel === 'unassessed'
        ? `${activeMentor.name} (${activeMentor.roleTitle}) diagnoses your ${activeMentor.shortTag} mastery from your questions.`
        : `[Room Test Override] ${activeMentor.name} calibrated #${activeChannel.slug} to ${LEVEL_BADGE_MAP[targetLevel].label} depth.`
    );
    showCandyNotification(
      `🧪 Level set to ${LEVEL_BADGE_MAP[targetLevel].label} for ${activeMentor.name}`
    );
  };

  // Room Test Helper: Reset current course thread to fresh Proactive Welcome state
  const handleResetActiveCourseThread = () => {
    const initialMsg: ChatMessage = {
      id: `proactive-reset-${activeChannel.id}-${Date.now()}`,
      role: 'mentor',
      text: activeChannel.proactiveGreeting,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      avatarState: 'talking',
      assessedLevel,
      scene3d: activeChannel.scene3d,
      proactiveBadge: `Proactive Welcome · #${activeChannel.slug}`,
      suggestedFollowUps: activeChannel.starterPrompts,
      modelUsed: 'gemini-4-argon',
    };

    setThreadsByChannel((prev) => ({
      ...prev,
      [activeChannel.id]: {
        messages: [initialMsg],
        scene3d: activeChannel.scene3d,
        quiz: activeChannel.quiz,
        learningStepTitle: activeChannel.title,
        keyTakeaways: [
          activeChannel.summary,
          'Interact with the 3D nodes on the right to inspect spatial flows',
          'Solve the channel quiz below to earn Candy rewards',
        ],
      },
    }));
    triggerTemporaryAvatarState('talking', 2400);
    showCandyNotification(`🔄 Reset #${activeChannel.slug} thread`);
  };

  const activeCustomRivUrl =
    customRivFiles[activeMentor.id] || customRivFiles['global'] || null;
  const currentLevelBadge = LEVEL_BADGE_MAP[assessedLevel];

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#0b0e17] text-slate-100 flex">
      {/* Candy Reward Floating Toast */}
      {candyToast && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-amber-400/50 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{candyToast}</span>
        </div>
      )}

      {/* =====================================================================
          COLUMN 1: SLACK WORKSPACE RAIL (Enrolled / Available Mentor Profiles)
         ===================================================================== */}
      <aside
        aria-label="Mentor Workspaces"
        className="w-[74px] shrink-0 h-full bg-[#06080f] border-r border-white/[0.08] flex flex-col items-center py-3 gap-3 z-30 select-none"
      >
        {/* Back to Apple Watch Home */}
        <Link
          href="/"
          title="Back to Mentor Honeycomb Home"
          className="w-11 h-11 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          <Home className="w-5 h-5" />
        </Link>

        <div className="w-8 h-[1px] bg-white/10" />

        {/* Scrollable Mentor Face Icons (Slack Workspace Switcher) */}
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-3 py-1 no-scrollbar">
          {workspaceMentors.map((m) => {
            const isActive = m.id === activeMentor.id;
            return (
              <div
                key={m.id}
                className="relative w-full flex items-center justify-center group"
              >
                {/* Slack Left Edge Active Pill Indicator */}
                <span
                  className={`absolute left-0 w-1 rounded-r-full transition-all duration-200 ${
                    isActive
                      ? 'h-9 opacity-100'
                      : 'h-3 opacity-0 group-hover:opacity-60'
                  }`}
                  style={{
                    backgroundColor: isActive ? m.accentColor : '#ffffff',
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleSelectWorkspaceMentor(m)}
                  title={`${m.name} (${m.roleTitle} · ${m.shortTag})`}
                  className={`relative rounded-2xl p-0.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'ring-2 ring-white scale-105'
                      : 'opacity-75 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <RiveAvatar
                    key={`rail-${m.id}-${m.rivFile}`}
                    rivSrc={m.rivFile}
                    state={isActive ? avatarState : 'idle'}
                    accentColor={m.accentColor}
                    secondaryColor={m.secondaryColor}
                    size={46}
                    mentorName={m.name}
                    stateMachineName="Character"
                  />
                  {/* Online / Proactive Indicator Dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#06080f]"
                    style={{
                      backgroundColor: isActive ? '#34d399' : m.accentColor,
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Candy Shop Shortcut */}
        <button
          type="button"
          onClick={() => setIsShopOpen(true)}
          title="Open Candy Reward Shop"
          className="w-11 h-11 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 flex flex-col items-center justify-center text-amber-300 transition cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[9px] font-black mt-0.5">
            {profile.candyBalance}
          </span>
        </button>
      </aside>

      {/* Mobile Backdrop for Curriculum Channels Drawer */}
      {isMobileChannelsOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileChannelsOpen(false)}
        />
      )}

      {/* =====================================================================
          COLUMN 2: SLACK CHANNELS SIDEBAR (Mentor's Detailed Profile & Courses)
         ===================================================================== */}
      <aside
        aria-label="Curriculum Channels"
        className={`${
          isMobileChannelsOpen
            ? 'fixed left-[74px] top-14 bottom-0 z-40 flex shadow-2xl'
            : 'hidden md:flex'
        } w-64 lg:w-72 shrink-0 h-full bg-[#0f1322] border-r border-white/[0.08] flex-col select-none`}
      >
        {/* Workspace Header: Active Mentor Detailed Profile Card */}
        <div
          key={`profile-card-${activeMentor.id}`}
          className="p-3.5 border-b border-white/[0.08] relative overflow-hidden transition-all duration-300"
          style={{
            background: `linear-gradient(165deg, ${activeMentor.accentColor}16 0%, rgba(15,19,34,0.95) 65%)`,
          }}
        >
          {/* Top Accent Bar */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, ${activeMentor.accentColor}, ${activeMentor.secondaryColor})`,
            }}
          />

          <div className="flex items-start gap-3">
            <RiveAvatar
              key={`profile-avatar-${activeMentor.id}-${activeMentor.rivFile}`}
              rivSrc={activeMentor.rivFile}
              customRivBlobUrl={activeCustomRivUrl}
              state={avatarState}
              accentColor={activeMentor.accentColor}
              secondaryColor={activeMentor.secondaryColor}
              equippedSkinId={profile.equippedSkinId}
              equippedAuraId={profile.equippedAuraId}
              size={56}
              mentorName={activeMentor.name}
              stateMachineName="Character"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-white truncate">
                  {activeMentor.name}
                </h2>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeMentor.accentColor }}
                />
              </div>
              <p className="text-[11px] font-bold text-slate-300 truncate">
                {activeMentor.roleTitle}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border"
                  style={{
                    color: activeMentor.accentColor,
                    borderColor: `${activeMentor.accentColor}55`,
                    backgroundColor: `${activeMentor.accentColor}18`,
                  }}
                >
                  {activeMentor.shortTag}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${currentLevelBadge.colorClass}`}
                >
                  <Brain className="w-2.5 h-2.5" />
                  <span>{currentLevelBadge.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mentor Detailed Bio & Specialty Subject */}
          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/65 border border-white/[0.07] space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Specialty
              </span>
              <span
                className="font-bold truncate"
                style={{ color: activeMentor.accentColor }}
              >
                {activeMentor.subject}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {activeMentor.description}
            </p>
            <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">
                3D Lab: <strong className="text-slate-200">{activeMentor.defaultScene3d.title}</strong>
              </span>
            </div>
          </div>

          {/* Mastery Calibration Progress Bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-400 font-semibold truncate">
                {levelReason}
              </span>
              <span
                className="font-mono font-bold shrink-0 ml-1"
                style={{ color: activeMentor.accentColor }}
              >
                {currentLevelBadge.progress}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${currentLevelBadge.progress}%`,
                  background: `linear-gradient(90deg, ${activeMentor.accentColor}, ${activeMentor.secondaryColor})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Curriculum Channels List (Slack #channels style) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {activeMentor.name}&apos;s Courses
              </span>
              <button
                type="button"
                onClick={() => setIsAddingChannel((v) => !v)}
                title="Add Custom Curriculum Topic"
                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional Add Custom Curriculum Channel Input */}
            {isAddingChannel && (
              <form
                onSubmit={handleCreateCustomChannel}
                className="mb-2 p-2 rounded-xl bg-slate-950/90 border border-white/15 space-y-2"
              >
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. raft-consensus-3d"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingChannel(false)}
                    className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-md bg-sky-400 text-slate-950 text-[10px] font-bold"
                  >
                    Create #Channel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {curriculumChannels.map((ch) => {
                const isSelected = ch.id === activeChannel.id;
                const msgCount =
                  threadsByChannel[ch.id]?.messages?.length || 1;

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChannel(ch)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-start gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 text-white border border-sky-400/35 shadow-sm'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Hash
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{
                        color: isSelected
                          ? activeMentor.accentColor
                          : '#64748b',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            isSelected ? 'font-extrabold text-white' : 'font-semibold'
                          }`}
                        >
                          {ch.slug}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400">
                          {msgCount}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {ch.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Curriculum Key Takeaways */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Channel Learning Goals
            </div>
            <ul className="space-y-1.5">
              {currentThread.keyTakeaways.map((item, i) => (
                <li
                  key={i}
                  className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Rive State Controller */}
        <div className="p-3 border-t border-white/[0.08] bg-slate-950/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mentor .riv Emotion
            </span>
            <span className="text-[10px] font-mono text-sky-300">
              {avatarState}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {RIVE_STATES.map((item) => {
              const active = avatarState === item.state;
              return (
                <button
                  key={item.state}
                  type="button"
                  onClick={() => setAvatarState(item.state)}
                  className={`py-1 rounded-lg text-[10px] font-bold capitalize border transition cursor-pointer ${
                    active
                      ? 'bg-white text-slate-950 border-white'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          COLUMN 3: SLACK CURRICULUM CHANNEL CONVERSATION (Proactive Mentor Chat)
         ===================================================================== */}
      <main className="flex-1 h-full flex flex-col min-w-0 bg-[#0b0e17]">
        {/* Slack Channel Top Header + Course-Specific Proactive Triggers */}
        <header className="h-14 shrink-0 px-3.5 sm:px-5 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-slate-950/40">
          <div className="min-w-0 flex items-center gap-2">
            {/* Mobile Toggle for Curriculum Channels Sidebar */}
            <button
              type="button"
              onClick={() => setIsMobileChannelsOpen((v) => !v)}
              className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-xs font-bold text-white shrink-0 cursor-pointer"
              title="Toggle Curriculum Channels"
            >
              <Hash
                className="w-3.5 h-3.5"
                style={{ color: activeMentor.accentColor }}
              />
              <span>Courses</span>
            </button>

            <Hash
              className="hidden md:block w-5 h-5 shrink-0"
              style={{ color: activeMentor.accentColor }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-base font-black text-white truncate">
                  {activeChannel.slug}
                </h1>
                <span className="hidden md:inline-block text-xs text-slate-500">
                  |
                </span>
                <span className="hidden md:inline-block text-xs text-slate-400 truncate">
                  {activeChannel.title}
                </span>
              </div>
            </div>
          </div>

          {/* Course-Specific Proactive Mentor Action Bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleMentorSpeakFirst('3d_pointout')}
              disabled={isLoading}
              title="Mentor points out a specific 3D node in this course"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/12 hover:bg-sky-500/25 border border-sky-400/25 text-sky-200 text-[11px] font-bold transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>3D Point-Out</span>
            </button>

            <button
              type="button"
              onClick={() => handleMentorSpeakFirst('socratic_quiz')}
              disabled={isLoading}
              title="Mentor asks a Socratic warm-up question for this course"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/25 border border-amber-400/25 text-amber-200 text-[11px] font-bold transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Socratic Check</span>
            </button>

            <button
              type="button"
              onClick={() => handleMentorSpeakFirst('real_world_tip')}
              disabled={isLoading}
              title="Mentor shares a real-world engineering insight for this course"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-500/12 hover:bg-purple-500/25 border border-purple-400/25 text-purple-200 text-[11px] font-bold transition cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
              <span>Course Tip</span>
            </button>

            <button
              type="button"
              onClick={() => handleMentorSpeakFirst()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-[11px] sm:text-xs font-bold transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Have {activeMentor.name}</span>
              <span>Speak</span>
            </button>

            {/* Mobile/Tablet Toggle for 3D Argon & Quiz Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileLabOpen((v) => !v)}
              className="xl:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-[11px] font-bold transition cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span>3D & Quiz</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleSendMessage(
                  `Synthesize a deeper 3D spatial model for #${activeChannel.slug} (${activeChannel.title})!`,
                  'generate_3d'
                )
              }
              disabled={isLoading}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span>New 3D View</span>
            </button>

            {/* Toggle Standalone Room QA Test Console */}
            <button
              type="button"
              onClick={() => setIsRoomTestOpen((v) => !v)}
              title="Toggle Standalone Room Test Console"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${
                isRoomTestOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/35 text-amber-200'
              }`}
            >
              <span>🧪 Room QA</span>
            </button>
          </div>
        </header>

        {/* Collapsible Standalone Room Test Console (Mentor Switch + Level Calibration + Proactive Message Simulator) */}
        {isRoomTestOpen && (
          <div className="shrink-0 px-4 py-3 border-b border-amber-400/25 bg-gradient-to-r from-amber-500/[0.08] via-slate-900/95 to-sky-500/[0.08] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-black uppercase tracking-wider">
                  🧪 Room Test Sandbox
                </span>
                <span className="text-[11px] text-slate-300">
                  Active Mentor:{' '}
                  <strong className="text-white">{activeMentor.name}</strong> (
                  <span style={{ color: activeMentor.accentColor }}>
                    {activeMentor.shortTag}
                  </span>
                  ) · Course:{' '}
                  <strong className="text-sky-300">
                    #{activeChannel.slug}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetActiveCourseThread}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.15] border border-white/15 text-[10px] font-bold text-slate-200 cursor-pointer transition"
                >
                  <RefreshCw className="w-3 h-3 text-sky-300" />
                  <span>Reset Thread</span>
                </button>
              </div>
            </div>

            {/* Row 1: 1-Click Mentor Profile Switcher + Student Level Calibration */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Switch Mentor:
                </span>
                {workspaceMentors.map((m) => {
                  const active = m.id === activeMentor.id;
                  return (
                    <button
                      key={`qa-mentor-${m.id}`}
                      type="button"
                      onClick={() => handleSelectWorkspaceMentor(m)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        active
                          ? 'bg-white text-slate-950 border-white shadow-sm'
                          : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Simulate Level:
                </span>
                {(
                  [
                    'unassessed',
                    'beginner',
                    'intermediate',
                    'advanced',
                  ] as StudentLevel[]
                ).map((lvl) => {
                  const active = assessedLevel === lvl;
                  return (
                    <button
                      key={`qa-lvl-${lvl}`}
                      type="button"
                      onClick={() => handleSimulateStudentLevel(lvl)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize border transition cursor-pointer ${
                        active
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Course-Contextual Proactive Message Simulator */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.06]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Proactive Triggers (#{activeChannel.slug}):
              </span>
              <button
                type="button"
                onClick={() => handleMentorSpeakFirst('3d_pointout')}
                className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-[10px] font-bold cursor-pointer transition"
              >
                🔍 3D Node Point-Out
              </button>
              <button
                type="button"
                onClick={() => handleMentorSpeakFirst('socratic_quiz')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 text-[10px] font-bold cursor-pointer transition"
              >
                🎯 Socratic Quiz (+10🍬)
              </button>
              <button
                type="button"
                onClick={() => handleMentorSpeakFirst('real_world_tip')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 text-[10px] font-bold cursor-pointer transition"
              >
                💡 Real-World Course Tip
              </button>
              <button
                type="button"
                onClick={() => handleQuizComplete(true, 25)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold cursor-pointer transition"
              >
                🏆 Simulate Quiz Win (+25🍬)
              </button>
              <button
                type="button"
                onClick={() => handleQuizComplete(false, 0)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[10px] font-bold cursor-pointer transition"
              >
                💡 Simulate Quiz Wrong Hint
              </button>
            </div>
          </div>
        )}

        {/* Slack Channel Message Feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Channel Intro Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <RiveAvatar
                key={`banner-${activeMentor.id}-${activeMentor.rivFile}`}
                rivSrc={activeMentor.rivFile}
                customRivBlobUrl={activeCustomRivUrl}
                state={avatarState}
                accentColor={activeMentor.accentColor}
                secondaryColor={activeMentor.secondaryColor}
                size={54}
                mentorName={activeMentor.name}
                stateMachineName="Character"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-white">
                    Welcome to #{activeChannel.slug}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      color: activeMentor.accentColor,
                      borderColor: `${activeMentor.accentColor}44`,
                      backgroundColor: `${activeMentor.accentColor}15`,
                    }}
                  >
                    {activeMentor.name} · {activeMentor.shortTag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {activeChannel.summary}
                </p>
              </div>
            </div>
          </div>

          {currentThread.messages.map((msg) => {
            const isMentor = msg.role === 'mentor';
            return (
              <div key={msg.id} className="flex items-start gap-3.5 group">
                {isMentor ? (
                  <div className="shrink-0 mt-0.5">
                    <RiveAvatar
                      key={`msg-${activeMentor.id}-${msg.id}`}
                      rivSrc={activeMentor.rivFile}
                      customRivBlobUrl={activeCustomRivUrl}
                      state={
                        msg.id ===
                        currentThread.messages[
                          currentThread.messages.length - 1
                        ]?.id
                          ? avatarState
                          : 'idle'
                      }
                      accentColor={activeMentor.accentColor}
                      secondaryColor={activeMentor.secondaryColor}
                      size={42}
                      mentorName={activeMentor.name}
                      stateMachineName="Character"
                    />
                  </div>
                ) : (
                  <div className="w-[42px] h-[42px] rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xs font-black text-indigo-200 shrink-0 mt-0.5">
                    YOU
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">
                      {isMentor
                        ? activeMentor.name
                        : profile.displayName || 'You'}
                    </span>
                    {isMentor && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5"
                        style={{ color: activeMentor.accentColor }}
                      >
                        {activeMentor.roleTitle}
                      </span>
                    )}
                    {isMentor && msg.proactiveBadge && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                        <Zap className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{msg.proactiveBadge}</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {msg.timestamp}
                    </span>
                    {msg.candyEarned && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                        +{msg.candyEarned} 🍬
                      </span>
                    )}
                  </div>

                  <div
                    className={`mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line rounded-2xl px-4 py-3 border ${
                      msg.proactiveBadge
                        ? 'bg-slate-900/85 border-emerald-400/25 shadow-[0_4px_24px_rgba(16,185,129,0.07)]'
                        : 'bg-slate-900/65 border-white/[0.07]'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Suggested Follow-up Chips */}
                  {isMentor &&
                    msg.suggestedFollowUps &&
                    msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((followUp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(followUp, 'chat')}
                            disabled={isLoading}
                            className="text-left px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-[11px] text-sky-300 transition cursor-pointer"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-amber-300 bg-slate-900/60 border border-amber-400/20 rounded-2xl px-4 py-3">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>
                <strong>{activeMentor.name}</strong> is thinking & synthesizing
                a 3D scene for <strong>#{activeChannel.slug}</strong>...
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Starter Prompts Bar + Slack Message Composer */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/60 space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {activeChannel.starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(prompt, 'chat')}
                className="shrink-0 px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              placeholder={`Message #${activeChannel.slug} (Ask ${activeMentor.name} for a 3D model or quiz)...`}
              className="flex-1 bg-slate-900 border border-white/15 focus:border-sky-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 disabled:opacity-40 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </main>

      {/* Mobile/Tablet Backdrop for 3D & Quiz Drawer */}
      {isMobileLabOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/65 backdrop-blur-xs xl:hidden"
          onClick={() => setIsMobileLabOpen(false)}
        />
      )}

      {/* =====================================================================
          COLUMN 4: INTERACTIVE 3D ARGON VIEWER & ADAPTIVE CANDY QUIZ
         ===================================================================== */}
      <aside
        className={`${
          isMobileLabOpen
            ? 'fixed right-0 top-14 bottom-0 z-40 flex w-[88vw] max-w-[420px] shadow-2xl'
            : 'hidden xl:flex w-[440px]'
        } shrink-0 h-full border-l border-white/[0.08] bg-[#080b14] flex-col overflow-y-auto p-3.5 gap-3.5`}
      >
        <div className="h-[340px] shrink-0">
          <Argon3DViewer
            scene={currentThread.scene3d}
            accentColor={activeMentor.accentColor}
            isGenerating={isLoading}
            onRequestGenerate3D={(topic) =>
              handleSendMessage(
                topic
                  ? `Generate a 3D visualization for ${topic} in #${activeChannel.slug}`
                  : `Generate a new 3D visualization for #${activeChannel.slug}: ${activeChannel.title}`,
                'generate_3d'
              )
            }
          />
        </div>

        <div className="flex-1">
          <QuizDrawer
            quiz={currentThread.quiz}
            accentColor={activeMentor.accentColor}
            onAnswerSubmit={(isCorrect, candyEarned) =>
              handleQuizComplete(isCorrect, candyEarned)
            }
            onRequestNewQuiz={() =>
              handleSendMessage(
                `Give me a new adaptive quiz for #${activeChannel.slug}!`,
                'generate_quiz'
              )
            }
            isLoadingQuiz={isLoading}
          />
        </div>
      </aside>
    </div>
  );
}

export default MentorStudioView;

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  Box,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  FolderOpen,
  Gamepad2,
  Hash,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  MessageSquare,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react';
import type { CrossMentorNudgeResponse } from '@/app/api/mentor/proactive-nudge/route';
import { RiveAvatar } from '@/components/avatar/RiveAvatar';
import { Argon3DViewer } from '@/components/studio/Argon3DViewer';
import { LearningMaterialPreviewCard } from '@/components/studio/LearningMaterialPreviewCard';
import MentorMarkdown from '@/components/studio/MentorMarkdown';
import { QuizDrawer } from '@/components/studio/QuizDrawer';
import { useUserProgress } from '@/context/UserProgressContext';
import { buildPreseededDemoMessages } from '@/data/demoConversations';
import { MENTORS } from '@/data/mentors';
import {
  buildAdaptiveLearningMaterial,
  MATERIAL_TYPE_META,
  selectOptimalMaterialType,
} from '@/lib/gemini/learningMaterialTemplates';
import {
  ChatAttachment,
  ChatMessage,
  LearningMaterialProposal,
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

interface CollectedLearningMaterialItem {
  id: string;
  messageId: string;
  channelId: string;
  channelSlug: string;
  channelTitle: string;
  timestamp: string;
  assessedLevel: StudentLevel;
  material: LearningMaterialProposal;
  scene3d: Scene3DSpec;
  quiz: QuizQuestion;
  proactiveBadge?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
        slug: '01-binary-and-logic-gates',
        title: 'Binary Numbers, Logic Gates (AND/OR/XOR) & CPU ALU',
        summary:
          'Discover how 0s and 1s flow through logic gates inside the CPU ALU to compute everything in 3D.',
        greeting: `Hey there! Welcome to **#01-binary-and-logic-gates**! 👋 I'm **${mentor.name}** (Computer Science 101). Look at **${primaryNode}** and **${secondaryNode}** in the 3D model on the right: every photo, game, and AI model is ultimately 0s and 1s switching through logic gates! Want to see how a Half-Adder adds binary numbers in 3D?`,
        prompts: [
          'Show me in 3D how XOR and AND gates build a Binary Half-Adder!',
          'Why do computers use Binary (0 and 1) instead of Base-10?',
          'Quiz me on Binary numbers and Logic Gates!',
        ],
        nodeColors: ['#38bdf8', '#6366f1', '#34d399'],
        quizQ:
          'In a binary Half-Adder circuit adding two bits A and B, which logic gates compute the Sum bit and the Carry bit?',
        quizOpts: [
          'XOR gate computes the Sum bit, and AND gate computes the Carry bit',
          'NOT gate computes both Sum and Carry bits',
          'OR gate computes the Carry bit, and NAND computes nothing',
          'Binary addition does not use logic gates inside the ALU',
        ],
        quizCorrect: 0,
        quizExp:
          '1 + 1 in binary equals 10 (Sum = 0 via XOR, Carry = 1 via AND). Combining XOR and AND gives a complete 1-bit Half-Adder!',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#01-binary-and-logic-gates)**: Look at the cyan instruction bus flowing into **Binary & Logic Gates (ALU)** on the right. Notice how two 1-bits entering an XOR gate output 0 while firing the Carry bit!`,
          socraticQuestion: `🎯 **Quick Socratic Check (+10 🍬)**: What is the decimal value of the 4-bit binary number \`1011\`? Try calculating it!`,
          realWorldTip: `💡 **CS 101 Tip from ${mentor.name}**: Modern CPUs pack billions of microscopic MOSFET transistors that act as super-fast on/off switches for these exact logic gates!`,
          followUpChips: [
            '1011 in binary equals 8 + 0 + 2 + 1 = 11!',
            'Build a 3D Binary Half-Adder with XOR + AND gates!',
            'How does the CPU clock synchronize billions of gates?',
          ],
        },
      },
      {
        slug: '02-variables-stack-and-heap',
        title: 'Variables, Pointers, Stack Frames & Heap Memory',
        summary:
          'Visualize how local variables live on the fast Stack while dynamic objects live on the Heap in 3D.',
        greeting: `Welcome to **#02-variables-stack-and-heap**! ⚡ In CS 101, students often wonder where variables actually live in RAM. Check out **Stack Frame (Local Vars)** pointing to **Heap Memory (Objects)** in our 3D viewer on the right! Why do we need both a Stack and a Heap?`,
        prompts: [
          'Explain Stack vs. Heap memory using a 3D visual analogy!',
          'Show me what happens in 3D when a pointer references an object on the Heap.',
          'Give me a CS 101 quiz on Stack Overflow vs. Memory Leaks!',
        ],
        nodeColors: ['#f59e0b', '#38bdf8', '#10b981'],
        quizQ:
          'When a function finishes executing and returns, what happens to its local variables stored on the Call Stack?',
        quizOpts: [
          'Its stack frame is popped immediately in O(1) by moving the stack pointer, freeing that space automatically',
          'They stay in RAM forever until you reboot the computer',
          'They are moved onto the hard drive sector by sector',
          'The CPU deletes the entire operating system',
        ],
        quizCorrect: 0,
        quizExp:
          'The Call Stack works Last-In, First-Out (LIFO). Returning from a function simply moves the stack pointer back, reclaiming local variables in O(1)!',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#02-variables-stack-and-heap)**: Follow the purple **Pointer Ref** arrow from **Stack Frame (Local Vars)** to **Heap Memory (Objects)**. If you lose the stack pointer without freeing the heap object, you get a memory leak!`,
          socraticQuestion: `🎯 **Pop Question (+10 🍬)**: What happens to the Call Stack if a recursive function calls itself infinitely without a base case?`,
          realWorldTip: `💡 **CS 101 Pro Tip**: That famous error—**Stack Overflow**—literally means your program pushed so many stack frames that the Call Stack ran out of memory!`,
          followUpChips: [
            'It causes a Stack Overflow because stack frames pile up endlessly!',
            'Simulate a Recursive Stack Overflow in the 3D viewer!',
            'Show me how Garbage Collection cleans up Heap objects in 3D.',
          ],
        },
      },
      {
        slug: '03-algorithms-and-big-o',
        title: 'Sorting, Binary Search & Big-O Complexity in 3D',
        summary:
          'See why O(log N) Binary Search crushes O(N) Linear Scan and how Arrays vs. Trees organize data.',
        greeting: `Glad you jumped into **#03-algorithms-and-big-o**! 🌲 Check out **Data Structures (Array / Tree)** in the 3D canvas. Imagine searching for a name in a phonebook of 1,000,000 people: checking page by page takes 1,000,000 steps, but **Binary Search** takes at most **20 steps**! Want to see why in 3D?`,
        prompts: [
          'Show me in 3D how Binary Search cuts the search space in half every step!',
          'Compare O(1), O(log N), O(N), and O(N²) growth in 3D!',
          'Challenge me with a Big-O Complexity Candy quiz!',
        ],
        nodeColors: ['#34d399', '#38bdf8', '#a855f7'],
        quizQ:
          'What is the maximum number of comparisons Binary Search needs to find an item in a sorted array of 1,024 elements?',
        quizOpts: [
          'At most 10 comparisons (since log₂(1024) = 10)',
          '1,024 comparisons',
          '1,048,576 comparisons',
          '512 comparisons minimum',
        ],
        quizCorrect: 0,
        quizExp:
          'Each comparison halves the remaining array: 1024 → 512 → 256 → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1, which is log₂(1024) = 10 steps!',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#03-algorithms-and-big-o)**: Look at how **Data Structures (Array / Tree)** branches out in 3D. Halving the problem at each level is the secret behind \`O(log N)\` speed!`,
          socraticQuestion: `🎯 **Socratic Check (+10 🍬)**: Why must an array be **sorted** before you can run Binary Search on it?`,
          realWorldTip: `💡 **CS 101 Insight**: Hash Tables give you \`O(1)\` average lookup by computing an index directly from the key, while Binary Search Trees keep items sorted in \`O(log N)\`!`,
          followUpChips: [
            'Because you need order to know whether to eliminate the left half or right half!',
            'Visualize a Hash Table vs. Binary Search Tree in 3D!',
            'Show me QuickSort partitioning in the 3D viewer!',
          ],
        },
      },
      {
        slug: '04-os-and-internet-packets',
        title: 'Operating Systems, Processes & How the Internet Works',
        summary:
          'Follow how the OS schedules processes on the CPU and how TCP/IP packets travel from browser to server.',
        greeting: `Welcome to **#04-os-and-internet-packets**! 🌐 Ever wondered what actually happens in the 50 milliseconds after you type a URL and press Enter? Let's trace **DNS → TCP Handshake → HTTP Packet → OS Process** in 3D!`,
        prompts: [
          'Trace a web request from Browser → DNS → TCP/IP → Server in 3D!',
          'How does the Operating System run dozens of apps at once on a CPU?',
          'Give me a CS 101 Boss Quiz on Operating Systems & Networking!',
        ],
        nodeColors: ['#818cf8', '#ec4899', '#38bdf8'],
        quizQ:
          'What is the main purpose of DNS (Domain Name System) when you visit a website?',
        quizOpts: [
          'It translates human-readable domain names (like google.com) into numerical IP addresses that routers use to route packets',
          'It cools down the CPU fan when browsing',
          'It compiles C++ code inside your keyboard',
          'It deletes local variables from the Call Stack',
        ],
        quizCorrect: 0,
        quizExp:
          'Routers forward packets using IP addresses (e.g., 142.250.190.46). DNS acts as the internet phonebook translating domain names into IP addresses.',
        nudges: {
          pointOut3D: `🔍 **3D Observation (#04-os-and-internet-packets)**: Watch how the OS kernel shares CPU time slices across processes while network packets arrive asynchronously!`,
          socraticQuestion: `🎯 **Pop Question (+10 🍬)**: What is the difference between **TCP** (used for web pages & messages) and **UDP** (used for live gaming & video calls)?`,
          realWorldTip: `💡 **CS 101 Takeaway**: TCP guarantees ordered delivery with a 3-way handshake and retransmissions, while UDP blasts packets out with minimal delay!`,
          followUpChips: [
            'TCP guarantees reliable ordered delivery while UDP prioritizes low-latency speed!',
            'Model the TCP 3-Way Handshake (SYN, SYN-ACK, ACK) in 3D!',
            'Show me how OS Context Switching swaps CPU registers in 3D!',
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
    'basic-spanish': [
      {
        slug: '01-hola-greetings-and-pronunciation',
        title: '¡Hola! Core Greetings, Self-Intro & Spanish Vowels',
        summary:
          'Master the 5 crisp Spanish vowel sounds (A, E, I, O, U) and introduce yourself naturally from Day 1.',
        greeting: `¡Hola, amigo! 🇪🇸💃 I'm **${mentor.name}** (Basic Spanish)! Welcome to **#01-hola-greetings-and-pronunciation**! Check out **¡Hola! Greeting Hub** in our 3D scene on the right. Notice how Spanish vowels (**a, e, i, o, u**) each have only ONE pure sound! Try saying *"¡Hola! Me llamo..."*—how are you feeling today: *¿Muy bien* or *más o menos*?`,
        prompts: [
          'Teach me the 5 Spanish vowel sounds and basic greetings with a 3D map!',
          'How do I introduce myself and ask someone’s name in Spanish?',
          'Quiz me on ¡Hola!, Buenos días, and Me llamo!',
        ],
        nodeColors: ['#f97316', '#facc15', '#ec4899'],
        quizQ:
          'How do you naturally say "My name is Alex, nice to meet you!" in Spanish?',
        quizOpts: [
          '¡Me llamo Alex, mucho gusto!',
          '¡Tengo hambre Alex, hasta luego!',
          '¡Dónde está el baño Alex!',
          '¡La cuenta por favor Alex!',
        ],
        quizCorrect: 0,
        quizExp:
          '"Me llamo..." literally means "I call myself..." and "¡Mucho gusto!" means "Nice to meet you!"',
      },
      {
        slug: '02-ser-vs-estar-and-verbs',
        title: 'Ser vs. Estar (DOCTOR vs. PLACE) & Core Action Verbs',
        summary:
          'Never confuse the two "to be" verbs again using a 3D spatial memory map of identity vs. state.',
        greeting: `¡Bienvenido to **#02-ser-vs-estar-and-verbs**! 🌟 Look at **Ser (Identity / Origin)** and **Estar (Emotion / Location)** on the right! In English both mean *"to be"*, so why does *"Soy aburrido"* mean *"I'm a boring person"* while *"Estoy aburrido"* means *"I'm feeling bored right now"*? Let's unlock this in 3D!`,
        prompts: [
          'Show me in 3D the difference between Ser (Identity) and Estar (State/Location)!',
          'Why does "Soy listo" vs. "Estoy listo" change meaning completely?',
          'Give me a Candy quiz on Ser vs. Estar!',
        ],
        nodeColors: ['#facc15', '#34d399', '#f97316'],
        quizQ:
          'Which Spanish sentence correctly says "I am in Madrid right now, and I am from Korea"?',
        quizOpts: [
          'Estoy en Madrid ahora, y soy de Corea.',
          'Soy en Madrid ahora, y estoy de Corea.',
          'Tener en Madrid ahora, y hablar de Corea.',
          'Quiero Madrid ahora, y vamos de Corea.',
        ],
        quizCorrect: 0,
        quizExp:
          'Physical location uses ESTAR ("Estoy en Madrid"), whereas permanent origin/nationality uses SER ("Soy de Corea")!',
      },
      {
        slug: '03-tapas-cafe-and-travel-roleplay',
        title: 'Tapas Café Ordering, Numbers & Survival Travel Phrases',
        summary:
          'Roleplay ordering churros, tapas, and coffee in Madrid or Mexico City with polite confidence.',
        greeting: `¡Vamos a comer! ☕🥘 Welcome to **#03-tapas-cafe-and-travel-roleplay**! Look at **Tapas Café Roleplay** in the 3D viewer. Imagine you just walked into a sunny café in Barcelona—how do you politely order a coffee and ask for the check without sounding like a textbook?`,
        prompts: [
          'Roleplay ordering tapas and coffee with me in a 3D Spanish café!',
          'Why is "Quisiera..." or "Me pone..." much more natural than "Yo quiero..."?',
          'Quiz me on Spanish restaurant & travel survival phrases!',
        ],
        nodeColors: ['#ec4899', '#f97316', '#38bdf8'],
        quizQ:
          'At a café in Spain or Latin America, what is the polite, natural way to ask the waiter for the bill?',
        quizOpts: [
          '¿Me trae la cuenta, por favor?',
          '¿Dónde está la biblioteca, por favor?',
          '¡Dame todo el dinero ahora!',
          '¿Cuántos años tienes, por favor?',
        ],
        quizCorrect: 0,
        quizExp:
          '"La cuenta, por favor" or "¿Me trae la cuenta, por favor?" is the universal, polite way to ask for the check.',
      },
      {
        slug: '04-past-tense-and-daily-stories',
        title: 'Talking About Your Day, Gustar & Everyday Conversation',
        summary:
          'Express what you love (Me gusta / Me encanta), your plans (Voy a...), and stories with friends.',
        greeting: `¡Increíble! 🏆 You made it to **#04-past-tense-and-daily-stories**! Let's learn how to talk about your favorite music, food, and weekend plans using **Me gusta / Me encanta** and **Ir + a + infinitivo**!`,
        prompts: [
          'Show me in 3D how "Me gusta el café" vs "Me gustan los tacos" works!',
          'Let’s have a 3-turn Spanish mini-conversation about my weekend plans!',
          'Launch the +35 Candy Basic Spanish Boss Quiz!',
        ],
        nodeColors: ['#34d399', '#facc15', '#ec4899'],
        quizQ:
          'Why do we say "Me gusta la música" (singular) but "Me gustan los libros" (plural) in Spanish?',
        quizOpts: [
          'Because "gustar" literally means "to be pleasing to me", so the verb agrees with the thing that pleases you',
          'Because "libros" is a verb in the future tense',
          'Because plural nouns are never allowed after "me"',
          'They are spelled the exact same way',
        ],
        quizCorrect: 0,
        quizExp:
          'In "Me gustan los libros", "los libros" is the grammatical subject ("the books are pleasing to me"), so gustar becomes plural (gustan)!',
      },
    ],
    'vibe-coding': [
      {
        slug: '01-vibe-spec-and-prompt-architecture',
        title: 'Vibe Spec Writing: Turning Ideas into Crisp AI Prompts',
        summary:
          'Structure your product vision, constraints, and stack so AI code generators build the right thing on the first shot.',
        greeting: `Yo builder! ⚡🎧 I'm **${mentor.name}** (Vibe Coding)! Welcome to **#01-vibe-spec-and-prompt-architecture**! Check out **Product Vibe Spec** flowing into **AI Code Generator** in our 3D loop on the right. Why do vague prompts like *"build me a cool app"* produce broken spaghetti, while a 5-bullet **Vibe Spec** ships magic?`,
        prompts: [
          'Show me the 3D anatomy of a perfect Vibe Coding Spec prompt!',
          'How do I break a full app idea into small, verifiable AI slices?',
          'Quiz me on Vibe Spec prompt architecture!',
        ],
        nodeColors: ['#a855f7', '#38bdf8', '#34d399'],
        quizQ:
          'In Vibe Coding, what is the biggest advantage of writing a structured "Vibe Spec" (Goal + UI flow + Data shape + Constraints) before generating code?',
        quizOpts: [
          'It anchors the AI’s context window on exact user flows, file boundaries, and states instead of letting it hallucinate architecture',
          'It makes the AI run without electricity',
          'It forces you to write every line in assembly language manually',
          'It disables TypeScript type checking',
        ],
        quizCorrect: 0,
        quizExp:
          'Giving the AI explicit data shapes, UI states, and file boundaries keeps generation surgical and prevents architectural drift.',
      },
      {
        slug: '02-ai-ui-and-3d-canvas-prototyping',
        title: 'Rapid UI, Tailwind & Interactive 3D Canvas Prototyping',
        summary:
          'Iterate on glassmorphic UI components, micro-animations, and Three.js / Rive scenes in seconds.',
        greeting: `Welcome to **#02-ai-ui-and-3d-canvas-prototyping**! 🎨 Look at **Live Preview & UI State** in the 3D viewer on the right! When you're vibe-coding a frontend, how do you prompt for tactile micro-interactions, responsive layouts, and zero-lag 3D canvases?`,
        prompts: [
          'Show me in 3D how State → UI Component → Animation Loop connect!',
          'Give me a Vibe Coding recipe for turning a boring UI into an Apple-tier interactive experience!',
          'Give me a Candy quiz on AI UI Prototyping!',
        ],
        nodeColors: ['#38bdf8', '#f59e0b', '#a855f7'],
        quizQ:
          'When vibe-coding an interactive UI, why should you build and verify a working interactive state skeleton before adding 10 extra features?',
        quizOpts: [
          'Fast visual feedback loops let you feel the UX immediately and catch state bugs while the diff is still small',
          'Because browsers can only render one button per week',
          'Because CSS deletes itself after 5 minutes',
          'So you never have to test the app in a browser',
        ],
        quizCorrect: 0,
        quizExp:
          'Tight visual feedback loops are the heart of Vibe Coding—verify core state and feel first, then layer polish and features!',
      },
      {
        slug: '03-agentic-debugging-and-context',
        title: 'Agentic Debugging: Fixing Hallucinations & Context Drift',
        summary:
          'Learn how to feed exact error stack traces, console logs, and invariants back into your AI coding agent.',
        greeting: `Welcome to **#03-agentic-debugging-and-context**! 🛠️ Look at the red **Error Trace** loop from **Auto-Debug & Deploy** back into **AI Code Generator** on the right! Every vibe coder hits a bug where the AI loops on the same mistake—want to know the 3-step trick to break out of an AI debugging loop?`,
        prompts: [
          'Visualize the 3D Self-Healing Debug Loop (Error Trace → Root Cause → Minimal Diff)!',
          'What should I do when the AI keeps breaking File A while fixing File B?',
          'Quiz me on Agentic Debugging & Context hygiene!',
        ],
        nodeColors: ['#f43f5e', '#a855f7', '#38bdf8'],
        quizQ:
          'When an AI coding assistant gets stuck repeating the same broken fix, what is the most effective Vibe Coding move?',
        quizOpts: [
          'Paste the exact error trace/state, ask the AI to explain the root cause first without editing, and constrain the fix to specific files',
          'Type "FIX IT NOW!!!" 20 times in all caps',
          'Delete the entire git repository without committing',
          'Ask the AI to rewrite the whole app in a different framework',
        ],
        quizCorrect: 0,
        quizExp:
          'Forcing root-cause analysis with concrete runtime evidence (stack trace + state values) resets hallucinated assumptions and produces a clean diff.',
      },
      {
        slug: '04-zero-to-deploy-shipping-loop',
        title: 'Zero-to-One Full-Stack Shipping (Auth, DB, API & Deploy)',
        summary:
          'Wire up API routes, schema validation, and one-click deployment without losing your creative flow.',
        greeting: `Welcome to **#04-zero-to-deploy-shipping-loop**! 🚀 A real vibe coder doesn't stop at localhost:3000—we ship live URLs! Let's trace the full 3D loop from **Frontend Action → Typed API Route → Database → Live Deploy**!`,
        prompts: [
          'Show me the 3D Full-Stack Vibe Coding architecture from UI to API & DB!',
          'What is the 5-minute pre-launch checklist before shipping an AI-built app?',
          'Launch the +35 Candy Vibe Coding Boss Quiz!',
        ],
        nodeColors: ['#34d399', '#a855f7', '#fbbf24'],
        quizQ:
          'Before deploying a vibe-coded full-stack app to production, which security check is non-negotiable?',
        quizOpts: [
          'Keeping API keys in server-side environment variables and validating/authenticating requests on the server',
          'Hardcoding secret API keys directly inside public client-side HTML',
          'Turning off HTTPS so requests feel faster',
          'Letting any anonymous user run raw SQL DROP TABLE commands',
        ],
        quizCorrect: 0,
        quizExp:
          'Even when moving at vibe-coding speed, secrets must stay server-side in env vars and API routes must validate inputs and auth!',
      },
    ],
    'dating-coach': [
      {
        slug: '01-first-impression-and-approaching',
        title: 'Warm Confidence, Eye Contact & Natural Conversation Openers',
        summary:
          'Overcome approach anxiety and start effortless, zero-pressure conversations using observational openers.',
        greeting: `Hey! 💕✨ I'm **${mentor.name}** (your **How to Make a Girlfriend** & Social Confidence Coach)! Welcome to **#01-first-impression-and-approaching**! Look at **Warm Eye Contact & Vibe** and **Playful Situational Opener** in our 3D social flow on the right. Most guys freeze up because they think they need a "genius pickup line"—want to see why a simple **Situational Observation** works 10x better?`,
        prompts: [
          'Show me in 3D why Situational Openers beat cheesy pickup lines every time!',
          'Let’s roleplay: I see someone cute at a coffee shop or campus—what do I say first?',
          'Quiz me on First Impressions, Body Language & Openers!',
        ],
        nodeColors: ['#ec4899', '#f472b6', '#fbbf24'],
        quizQ:
          'Why does a warm situational opener (commenting lightly on the shared environment or moment) work much better than a memorized pickup line?',
        quizOpts: [
          'It feels genuine, low-pressure, and socially calibrated, making it easy for her to respond naturally',
          'Because memorized pickup lines are legally required to be 500 words long',
          'Because you should never smile or make eye contact when saying hello',
          'Because talking like a robot is the best way to build warmth',
        ],
        quizCorrect: 0,
        quizExp:
          'Situational openers share a real moment in the present environment with zero pressure, signaling social intelligence and relaxed warmth.',
      },
      {
        slug: '02-magnetic-banter-and-active-listening',
        title: 'Escaping Interview Mode: Playful Banter & Active Listening',
        summary:
          'Stop asking boring resume questions ("What’s your major?") and create fun emotional spark.',
        greeting: `Welcome to **#02-magnetic-banter-and-active-listening**! 💬🔥 Check out **Active Listening & Empathy** in the 3D viewer on the right! Have you ever felt a conversation turn into a dry job interview (*"Where are you from? What do you do? How many siblings?"*)? Let's learn the **Callback + Playful Tease + Open Why** loop in 3D!`,
        prompts: [
          'Show me in 3D how to turn "Interview Mode" into playful, magnetic banter!',
          'Roleplay a 3-turn conversation with me and rate my vibe!',
          'Give me a Candy quiz on Active Listening & Banter!',
        ],
        nodeColors: ['#fbbf24', '#ec4899', '#a855f7'],
        quizQ:
          'How do you avoid "Job Interview Mode" when getting to know someone you like?',
        quizOpts: [
          'Dive into the feelings/stories behind what she just shared (why she loves it) and mix in light, warm observations before switching topics',
          'Read 25 rapid-fire yes/no questions off a clipboard without reacting',
          'Talk only about yourself for 45 minutes straight without pausing',
          'Stare at your phone while she is speaking',
        ],
        quizCorrect: 0,
        quizExp:
          'Great chemistry comes from emotional resonance—listening to *why* something excites her, sharing a relatable story, and adding playful warmth!',
      },
      {
        slug: '03-asking-her-out-and-first-date-vibe',
        title: 'Texting Chemistry, Asking Her Out & First Date Architecture',
        summary:
          'When and how to suggest a low-pressure, high-chemistry first date with a clear plan.',
        greeting: `Welcome to **#03-asking-her-out-and-first-date-vibe**! ☕✨ Look at **Low-Pressure Date Invite** in our 3D graph on the right! Notice the difference between a vague *"We should hang out sometime"* vs. a warm, specific *"Hey, I’m checking out this cozy dessert café on Thursday after 5—come join me for 45 minutes!"* Ready to practice?`,
        prompts: [
          'Show me the 3D blueprint of a high-chemistry, low-pressure First Date!',
          'How do I ask her out over text or in person without making it awkward?',
          'Quiz me on Texting & First Date planning!',
        ],
        nodeColors: ['#34d399', '#ec4899', '#f472b6'],
        quizQ:
          'When inviting someone on a first date, what makes the invitation feel confident yet comfortable and low-pressure?',
        quizOpts: [
          'Suggesting a specific, casual activity + day/time tied to a shared interest (e.g., coffee, matcha, or an art walk) with an easy vibe',
          'Saying "Idk, whatever you want whenever in the next 6 months"',
          'Booking a 6-hour formal banquet with your entire extended family on Date #1',
          'Sending 18 texts in a row at 3 AM if she hasn’t replied in 5 minutes',
        ],
        quizCorrect: 0,
        quizExp:
          'A clear, casual plan ("Let’s grab matcha at X on Friday afternoon!") removes decision fatigue while keeping the vibe relaxed and fun.',
      },
      {
        slug: '04-emotional-connection-and-confession',
        title: 'Deepening Trust, Reading Signals & Becoming a Great Partner',
        summary:
          'Build authentic emotional closeness, respect boundaries, and transition naturally into a relationship.',
        greeting: `Welcome to **#04-emotional-connection-and-confession**! 💖 Attraction starts the spark, but **emotional safety, shared laughter, and genuine kindness** build a real relationship. Let's explore how to read mutual signals and express your feelings sincerely!`,
        prompts: [
          'Visualize the 3D stages from First Spark → Mutual Trust → Relationship!',
          'How do I tell if she likes me as more than a friend—and how do I express my feelings?',
          'Launch the +35 Candy Dating & Social Confidence Boss Quiz!',
        ],
        nodeColors: ['#a855f7', '#ec4899', '#34d399'],
        quizQ:
          'What is the healthiest foundation when transitioning from great dates into an official relationship?',
        quizOpts: [
          'Consistent warmth, mutual effort, clear communication of your feelings, and respecting her pace and boundaries',
          'Playing toxic mind games and purposely ignoring her for a week',
          'Pretending to be a completely different person with fake hobbies',
          'Demanding an answer on the first 5 minutes of meeting',
        ],
        quizCorrect: 0,
        quizExp:
          'Authentic confidence means being honest about your interest while valuing mutual enthusiasm, kindness, and emotional respect.',
      },
    ],
    'korea-history': [
      {
        slug: '01-three-kingdoms-goguryeo-baekje-silla',
        title: 'Three Kingdoms: Goguryeo, Baekje & Silla along the Han River',
        summary:
          'Discover why controlling the Han River basin decided the fate of Goguryeo, Baekje, and Silla in 3D.',
        greeting: `안녕하세요! 🏛️📜 I'm **${mentor.name}** (Korea History)! Welcome to **#01-three-kingdoms-goguryeo-baekje-silla**! Look at **Goguryeo · Baekje · Silla** in our 3D historical timeline on the right. Here is a thrilling mystery: why did all three kingdoms fight so fiercely to control the **Han River (한강)** basin in the 4th to 6th centuries?`,
        prompts: [
          'Show me a 3D strategic map of Goguryeo, Baekje, and Silla competing for the Han River!',
          'Compare the cultures of Goguryeo (Gwanggaeto), Baekje, and Silla!',
          'Quiz me on the Three Kingdoms of Korea!',
        ],
        nodeColors: ['#f59e0b', '#38bdf8', '#34d399'],
        quizQ:
          'Why was the Han River basin (한강 유역) the most decisive strategic prize among Goguryeo, Baekje, and Silla?',
        quizOpts: [
          'It sits at the center of the peninsula with fertile plains and direct Yellow Sea maritime routes to trade and diplomacy with China',
          'It was covered in active volcanoes that produced laser weapons',
          'It was the only place where horses were allowed to sleep',
          'None of the Three Kingdoms ever visited the Han River',
        ],
        quizCorrect: 0,
        quizExp:
          'Whichever kingdom held the Han River controlled the agricultural heartland, split the other two rivals, and gained direct sea trade across the Yellow Sea (4thC Baekje → 5thC Goguryeo → 6thC Silla)!',
      },
      {
        slug: '02-goryeo-celadon-and-tripitaka',
        title: 'Goryeo Dynasty: Trade Port Byeokrando, Celadon & Jikji',
        summary:
          'Explore how "Korea" got its global name, the 80,000 woodblocks of Tripitaka Koreana, and the world’s oldest metal type.',
        greeting: `Welcome to **#02-goryeo-celadon-and-tripitaka**! 🏺📖 Check out **Goryeo Celadon & Jikji** in the 3D viewer on the right! Did you know the English word **"Korea"** comes directly from **Goryeo (고려)**, and that Goryeo artisans invented movable metal printing type (**Jikji**, 1377) **78 years before Gutenberg**?`,
        prompts: [
          'Visualize the 3D printing heritage of Tripitaka Koreana (팔만대장경) and Jikji (직지)!',
          'How did Arabian merchants at Byeokrando port spread the name "Korea" to the world?',
          'Give me a Candy quiz on the Goryeo Dynasty!',
        ],
        nodeColors: ['#34d399', '#f59e0b', '#a855f7'],
        quizQ:
          'What historic milestone makes "Jikji" (직지심체요절, 1377) from the late Goryeo Dynasty famous worldwide?',
        quizOpts: [
          'It is the world’s oldest extant book printed with movable metal type, predating Gutenberg’s Bible by 78 years',
          'It was the first smartphone app created in Kaesong',
          'It is a painting of a dinosaur from the Jurassic period',
          'It was written in English by Marco Polo',
        ],
        quizCorrect: 0,
        quizExp:
          'Printed at Heungdeoksa Temple in Cheongju in 1377, Jikji is recognized by UNESCO Memory of the World as the oldest surviving movable metal type book.',
      },
      {
        slug: '03-king-sejong-and-hunminjeongeum',
        title: 'Joseon Renaissance: King Sejong, Hangul & Jang Yeong-sil',
        summary:
          'See how Hunminjeongeum (Hangul) was scientifically modeled on the human vocal organs and cosmic principles in 1443.',
        greeting: `Welcome to **#03-king-sejong-and-hunminjeongeum**! 👑✨ Look at **Joseon & Hangul (1443)** in our 3D timeline on the right! Before 1443, ordinary people couldn't read or write classical Chinese characters. So **King Sejong** designed **Hunminjeongeum (Hangul)**—where the consonants literally mirror the **3D shape of your tongue and vocal organs**! Want to see how?`,
        prompts: [
          'Show me in 3D how Hangul consonants (ㄱ, ㄴ, ㅁ, ㅅ, ㅇ) model human vocal organs!',
          'Tell me the story of King Sejong and scientist Jang Yeong-sil’s water clock & celestial globe!',
          'Quiz me on King Sejong and Hunminjeongeum!',
        ],
        nodeColors: ['#a855f7', '#f59e0b', '#ec4899'],
        quizQ:
          'What scientific principle did King Sejong use to design the basic consonant letters (ㄱ, ㄴ, ㅁ, ㅅ, ㅇ) of Hunminjeongeum (Hangul)?',
        quizOpts: [
          'They visually model the physical shape and position of the speech organs (tongue, lips, teeth, throat) when pronouncing each sound',
          'They were copied randomly from cloud shapes during a thunderstorm',
          'They represent the recipes for five royal court soups',
          'They were designed so only 3 nobles in the palace could read them',
        ],
        quizCorrect: 0,
        quizExp:
          'For example, ㄱ (g/k) shows the root of the tongue blocking the throat, ㄴ (n) shows the tongue tip touching the upper gums, and ㅁ (m) shows the shape of the lips!',
      },
      {
        slug: '04-admiral-yi-sun-sin-and-modern-korea',
        title: 'Admiral Yi Sun-sin’s Geobukseon & The Miracle on the Han River',
        summary:
          'From Battle of Myeongnyang (13 ships vs 133) and the Independence Movement to modern Korea’s global rise.',
        greeting: `Welcome to **#04-admiral-yi-sun-sin-and-modern-korea**! 🐢⚓ Look at **Miracle on the Han River** in our 3D canvas on the right! From **Admiral Yi Sun-sin** turning the tide at Myeongnyang with just 13 ships using the whirlpool currents of Uldolmok, to Korea's modern cultural & tech renaissance—which era do you want to explore in 3D?`,
        prompts: [
          'Model Admiral Yi Sun-sin’s Crane Wing Formation (학익진) & Geobukseon in 3D!',
          'How did Admiral Yi win the Battle of Myeongnyang with 13 ships against 133?',
          'Launch the +35 Candy Korean History Boss Quiz!',
        ],
        nodeColors: ['#ec4899', '#38bdf8', '#f59e0b'],
        quizQ:
          'At the Battle of Hansando (1592), which naval formation did Admiral Yi Sun-sin use to lure the enemy fleet into open waters and encircle them?',
        quizOpts: [
          'The Crane Wing Formation (학익진, Hagikjin), surrounding the fleet in a U-shaped arc with heavy cannon fire',
          'Submarine torpedo warfare under the Arctic ice',
          'Hot air balloon cavalry charges',
          'Retreating onto Mount Paektu with horses',
        ],
        quizCorrect: 0,
        quizExp:
          'Admiral Yi feigned retreat to draw the enemy out of narrow straits into open water near Hansando, then deployed the Crane Wing Formation (학익진) to envelop them with long-range Panokseon & Geobukseon cannons!',
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

  const customSlugs =
    mentor.customChannels && mentor.customChannels.length >= 4
      ? mentor.customChannels
      : [
          '01-foundations-and-diagnosis',
          '02-spatial-3d-architecture',
          '03-bottlenecks-and-edge-cases',
          '04-mastery-boss-challenge',
        ];

  const humanizeSlug = (slug: string, fallbackSuffix: string) => {
    const withoutPrefix = slug.replace(/^\d+[-_]?/, '').trim();
    if (!withoutPrefix) return `${mentor.shortTag} — ${fallbackSuffix}`;
    const words = withoutPrefix
      .split(/[-_]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return `${mentor.shortTag} — ${words.join(' ')}`;
  };

  const fallbackTemplates: ChannelTemplateSpec[] = [
    {
      slug: customSlugs[0],
      title: mentor.customChannels?.[0]
        ? humanizeSlug(customSlugs[0], 'Core Foundations & Level Check')
        : `${mentor.shortTag} — Core Foundations & Level Check`,
      summary: `Build rock-solid spatial intuition for ${mentor.subject} and calibrate your starting level.`,
      greeting: `Hi! I'm **${mentor.name}** (${mentor.roleTitle})! 👋 Welcome to **#${customSlugs[0]}**. Check out **${primaryNode}** and **${secondaryNode}** in our **${mentor.subject}** 3D model on the right. Tell me a bit about your background, or click a prompt below so I can tailor this course to you!`,
      prompts:
        mentor.starterPrompts && mentor.starterPrompts.length >= 3
          ? mentor.starterPrompts.slice(0, 3)
          : [
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
      slug: customSlugs[1],
      title: mentor.customChannels?.[1]
        ? humanizeSlug(customSlugs[1], 'Deep 3D Architecture')
        : `${mentor.shortTag} — Deep 3D Architecture`,
      summary: `Inspect internal state transitions, vector flows, and structural trade-offs in 3D.`,
      greeting: `Welcome to **#${customSlugs[1]}**! 🚀 In this curriculum channel, we zoom inside the core engine of **${mentor.subject}**. Notice how packets flow between **${primaryNode}** and **${secondaryNode}** in the 3D viewer—which part of this pipeline looks most intriguing to you?`,
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
      slug: customSlugs[2],
      title: mentor.customChannels?.[2]
        ? humanizeSlug(customSlugs[2], 'Bottlenecks & Edge Cases')
        : `${mentor.shortTag} — Bottlenecks & Edge Cases`,
      summary: `Stress-test failure modes, performance limits, and real-world optimization tricks.`,
      greeting: `Hey! Glad to see you in **#${customSlugs[2]}**! 🔍 Real mastery in **${mentor.subject}** comes from knowing where systems break under pressure. Want me to simulate a high-load edge case in our 3D viewer right now?`,
      prompts: [
        `Show me a 3D bottleneck scenario in ${mentor.subject} and how to fix it!`,
        `What is the #1 mistake learners make in ${mentor.shortTag}?`,
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
      slug: customSlugs[3],
      title: mentor.customChannels?.[3]
        ? humanizeSlug(customSlugs[3], 'Advanced Boss Challenge')
        : `${mentor.shortTag} — Advanced Boss Challenge`,
      summary: `Synthesize everything you've learned with advanced 3D scenarios and high-reward Candy quizzes.`,
      greeting: `Welcome to **#${customSlugs[3]}**! 🏆 Ready to put your **${mentor.subject}** intuition to the ultimate test? Tell me when you're ready and I'll generate an Advanced 3D puzzle and a **+35 🍬 Candy** boss quiz!`,
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

function getDefaultMaterialTypeForChannel(
  channelSlug: string,
  level: StudentLevel
): LearningMaterialType {
  if (channelSlug.startsWith('01-')) {
    return level === 'advanced' ? '3d_preview' : 'image_explanation';
  }
  if (channelSlug.startsWith('02-')) {
    return 'mini_game';
  }
  if (channelSlug.startsWith('03-')) {
    return '3d_preview';
  }
  if (channelSlug.startsWith('04-')) {
    return 'small_test';
  }
  return selectOptimalMaterialType(channelSlug, level, 'auto_recommend', 0);
}

function buildClientFallbackResponse(
  mentor: MentorConfig,
  channelTitle: string,
  userPrompt: string,
  currentLevel: StudentLevel,
  mode: MentorRequestMode = 'chat',
  turnIndex = 0
): MentorAgentTurnResponse {
  const nextLevel: StudentLevel =
    currentLevel === 'unassessed' ? 'intermediate' : currentLevel;
  const cleanTopic = userPrompt.slice(0, 42);
  const recommendedMaterialType = selectOptimalMaterialType(
    userPrompt,
    nextLevel,
    mode,
    turnIndex
  );
  const meta = MATERIAL_TYPE_META[recommendedMaterialType];

  const fallbackScene: Scene3DSpec = {
    ...mentor.defaultScene3d,
    title: `${cleanTopic} · Argon 3D`,
    conceptSummary: `Interactive 3D topology synthesized for "${cleanTopic}".`,
  };

  const fallbackQuiz: QuizQuestion = {
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
  };

  const learningMaterial = buildAdaptiveLearningMaterial({
    mentorId: mentor.id,
    mentorName: mentor.name,
    roleTitle: mentor.roleTitle,
    subject: mentor.subject,
    accentColor: mentor.accentColor,
    userMessage: userPrompt,
    assessedLevel: nextLevel,
    materialType: recommendedMaterialType,
    learningStepTitle: `${cleanTopic} — ${meta.shortLabel}`,
    scene3d: fallbackScene,
    quiz: fallbackQuiz,
  });

  return {
    replyText: `Great point in **#${channelTitle}**! As **${mentor.name}**, I diagnosed your level as **${LEVEL_BADGE_MAP[nextLevel].label}** and built a custom **${meta.label}** right inside this chat bubble for **"${cleanTopic}"**.\n\n- **Why this format**: ${learningMaterial.pedagogicalReason}\n- **Interactive Mini-Preview**: Play with the live HTML/JS widget below or switch between **3D Preview · Mini Game · Small Test · Image Explanation** anytime!`,
    avatarState: 'talking',
    assessedLevel: nextLevel,
    levelReason:
      'Calibrated to your mastery level based on your question inside this curriculum channel.',
    learningStepTitle: `${cleanTopic} — ${meta.shortLabel}`,
    keyTakeaways: [
      `Trace how ${mentor.shortTag} components interact across 3D nodes`,
      `Complete the inline ${meta.shortLabel} mini-preview in chat for +${learningMaterial.candyReward} 🍬`,
      'Solve the curriculum quiz on the right to earn +25 🍬 Candy',
    ],
    recommendedMaterialType,
    learningMaterial,
    scene3d: fallbackScene,
    quiz: fallbackQuiz,
    candyDelta: 10,
    suggestedFollowUps: [
      `Make a Mini Game for #${channelTitle}!`,
      `Show an Image Explanation diagram for "${cleanTopic}"`,
      `Give me a Small Test challenge on #${channelTitle}!`,
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
  mentor: routeMentor,
}: MentorStudioViewProps) {
  const {
    profile,
    addCandy,
    updateMentorLevel,
    markQuizCompleted,
    customRivFiles,
    customMentors,
    setIsShopOpen,
  } = useUserProgress();

  // Resolve browser-stored custom mentor config if this mentor was created in browser localStorage
  const initialMentor = useMemo(() => {
    const savedCustom = customMentors.find((m) => m.id === routeMentor.id);
    return savedCustom || routeMentor;
  }, [customMentors, routeMentor]);

  // Slack Workspace Rail: All mentors available to switch on the far-left rail, including browser-local customMentors
  const workspaceMentors = useMemo(() => {
    const mergedMap = new Map<string, MentorConfig>();
    if (!MENTORS.some((m) => m.id === initialMentor.id)) {
      mergedMap.set(initialMentor.id, initialMentor);
    }
    for (const cm of customMentors) {
      mergedMap.set(cm.id, cm.id === initialMentor.id ? initialMentor : cm);
    }
    for (const m of MENTORS) {
      mergedMap.set(m.id, m.id === initialMentor.id ? initialMentor : m);
    }
    return Array.from(mergedMap.values());
  }, [initialMentor, customMentors]);

  const [activeMentor, setActiveMentor] = useState<MentorConfig>(initialMentor);
  const [hoveredRailMentor, setHoveredRailMentor] = useState<{
    mentor: MentorConfig;
    centerY: number;
  } | null>(null);

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

  // Sync if initialMentor prop or browser customMentors hydrate/change
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

  // Per-channel independent conversation & lesson state
  const [threadsByChannel, setThreadsByChannel] = useState<
    Record<string, ChannelThreadState>
  >({});

  // Autonomous Rive Avatar State (strictly driven by conversation & quiz events, never manual)
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

  // Chat Input State, File Upload State & Learning Materials Collection Hub State
  const [inputPrompt, setInputPrompt] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<
    ChatAttachment[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedMaterialMode, setSelectedMaterialMode] =
    useState<MentorRequestMode>('auto_recommend');
  const [isLoading, setIsLoading] = useState(false);
  const [candyToast, setCandyToast] = useState<string | null>(null);
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileLabOpen, setIsMobileLabOpen] = useState(false);

  // Right Sidebar: Learning Materials Collection Hub ("학습 자료 보관함 / 모아보기")
  const [materialScope, setMaterialScope] = useState<'channel' | 'mentor'>(
    'channel'
  );
  const [materialFilter, setMaterialFilter] = useState<
    'all' | LearningMaterialType
  >('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null
  );

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

  // Ensure every curriculum channel initializes with realistic pre-seeded conversation + domain-specific visual messages
  useEffect(() => {
    if (!activeChannel) return;
    setThreadsByChannel((prev) => {
      if (prev[activeChannel.id]) return prev;

      const preseededMessages = buildPreseededDemoMessages(
        activeMentor,
        activeChannel,
        savedLevel
      );
      return {
        ...prev,
        [activeChannel.id]: {
          messages: preseededMessages,
          scene3d: activeChannel.scene3d,
          quiz: activeChannel.quiz,
          learningStepTitle: activeChannel.title,
          keyTakeaways: [activeChannel.summary],
        },
      };
    });

    // Mentor speaks proactively whenever you enter a channel
    triggerTemporaryAvatarState('talking', 2600);
  }, [activeChannel, activeMentor, savedLevel, triggerTemporaryAvatarState]);

  const currentThread: ChannelThreadState = useMemo(() => {
    if (threadsByChannel[activeChannel.id]) {
      return threadsByChannel[activeChannel.id];
    }

    return {
      messages: buildPreseededDemoMessages(
        activeMentor,
        activeChannel,
        savedLevel
      ),
      scene3d: activeChannel.scene3d,
      quiz: activeChannel.quiz,
      learningStepTitle: activeChannel.title,
      keyTakeaways: [activeChannel.summary],
    };
  }, [threadsByChannel, activeMentor, activeChannel, savedLevel]);

  // Collect Learning Materials added one by one during the session for the Right Sidebar
  const allMentorMaterials = useMemo<CollectedLearningMaterialItem[]>(() => {
    const items: CollectedLearningMaterialItem[] = [];
    for (const ch of curriculumChannels) {
      const thread =
        ch.id === activeChannel.id ? currentThread : threadsByChannel[ch.id];

      if (thread) {
        for (const msg of thread.messages) {
          if (msg.role === 'mentor' && msg.learningMaterial) {
            items.push({
              id: `${ch.id}::${msg.id}`,
              messageId: msg.id,
              channelId: ch.id,
              channelSlug: ch.slug,
              channelTitle: ch.title,
              timestamp: msg.timestamp,
              assessedLevel: msg.assessedLevel || assessedLevel,
              material: msg.learningMaterial,
              scene3d: msg.scene3d || thread.scene3d || ch.scene3d,
              quiz: msg.quiz || thread.quiz || ch.quiz,
              proactiveBadge: msg.proactiveBadge,
            });
          }
        }
      }
    }
    return items.reverse();
  }, [
    curriculumChannels,
    activeChannel.id,
    currentThread,
    threadsByChannel,
    assessedLevel,
  ]);

  const scopedMaterials = useMemo(() => {
    return allMentorMaterials.filter(
      (item) => item.channelId === activeChannel.id
    );
  }, [allMentorMaterials, activeChannel.id]);

  const filteredMaterials = scopedMaterials;

  const activeCollectedMaterial = useMemo<CollectedLearningMaterialItem | null>(() => {
    if (filteredMaterials.length === 0) return null;
    if (selectedMaterialId) {
      const found = filteredMaterials.find(
        (m) =>
          m.id === selectedMaterialId || m.messageId === selectedMaterialId
      );
      if (found) return found;
    }
    return filteredMaterials[0];
  }, [filteredMaterials, selectedMaterialId]);

  // Collect user-uploaded files in the active scope so the user can view their uploaded study files in the hub
  const uploadedFilesInScope = useMemo(() => {
    const list: Array<{
      attachment: ChatAttachment;
      channelSlug: string;
      timestamp: string;
      messageText: string;
    }> = [];
    const targetChannels =
      materialScope === 'channel' ? [activeChannel] : curriculumChannels;
    for (const ch of targetChannels) {
      const thread =
        ch.id === activeChannel.id ? currentThread : threadsByChannel[ch.id];
      if (!thread) continue;
      for (const msg of thread.messages) {
        if (msg.attachments && msg.attachments.length > 0) {
          for (const att of msg.attachments) {
            list.push({
              attachment: att,
              channelSlug: ch.slug,
              timestamp: msg.timestamp,
              messageText: msg.text,
            });
          }
        }
      }
    }
    return list.reverse();
  }, [
    materialScope,
    activeChannel,
    curriculumChannels,
    currentThread,
    threadsByChannel,
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread.messages, isLoading]);

  // Switch Mentor in the Leftmost Slack Workspace Rail
  const handleSelectWorkspaceMentor = (nextMentor: MentorConfig) => {
    setActiveMentor(nextMentor);
    const nextChannels = buildCurriculumForMentor(nextMentor);
    setActiveChannelId(nextChannels[0].id);
    setSelectedMaterialId(null);
    const nextSavedLevel =
      profile.mentorLevels?.[nextMentor.id] || 'unassessed';
    setAssessedLevel(nextSavedLevel);
    setLevelReason(getDefaultLevelReason(nextMentor, nextSavedLevel));
    triggerTemporaryAvatarState('talking', 2800);

    // Sync browser URL without full page reload so the URL matches the selected mentor
    if (typeof window !== 'undefined') {
      const targetUrl = window.location.pathname.startsWith('/room')
        ? `/room?mentor=${nextMentor.id}`
        : `/mentor/${nextMentor.id}`;
      window.history.replaceState(null, '', targetUrl);
    }
  };

  // Switch Curriculum Channel in the Slack Channels Sidebar
  const handleSelectChannel = (ch: CurriculumChannel) => {
    setActiveChannelId(ch.id);
    setSelectedMaterialId(null);
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
      proactiveGreeting: `Welcome to your new curriculum channel **#${fullSlug}**! 🎉 I'm **${activeMentor.name}**, and I'll lead this session on **${raw}**. Let's kick off: what's the #1 thing about **${raw}** you want to see modeled in 3D or as an interactive Mini-Preview right now?`,
      proactiveNudges: {
        pointOut3D: `🔍 **3D Observation (#${fullSlug})**: Look at how the 3D nodes model **${raw}**. Which component do you think is the most critical bottleneck?`,
        socraticQuestion: `🎯 **Socratic Check (+10 🍬)**: In your own words, what problem does **${raw}** solve? Answer in one line and I'll calibrate the 3D scene to your level!`,
        realWorldTip: `💡 **${activeMentor.name}'s Course Tip**: The fastest way to master **${raw}** is to trace how state flows from input to output in 3D. Want me to generate a custom 3D breakdown?`,
        followUpChips: [
          `Build a 3D model of the core architecture of ${raw}`,
          `Make a Mini Game to practice ${raw}`,
          `Give me a Small Test on ${raw}!`,
        ],
      },
      starterPrompts: [
        `Build a 3D model of the core architecture of ${raw}`,
        `Make a Mini Game to practice ${raw}`,
        `Give me a Small Test on ${raw}!`,
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

  // Handle File Selection (Priority 1: File Upload; Voice/Image/Video remembered as next priority)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const textExtensions =
      /\.(txt|md|markdown|json|csv|tsv|js|jsx|ts|tsx|py|java|c|cpp|h|hpp|cs|go|rs|rb|php|html|htm|css|scss|sql|yaml|yml|xml|sh|bash|zsh|env|ini|toml|log|tex|r|jl|swift|kt|scala)$/i;

    const newlyRead: ChatAttachment[] = [];
    for (const file of Array.from(fileList)) {
      let textContent: string | undefined;
      const isTextLike =
        file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        file.type === 'application/xml' ||
        file.type === 'application/javascript' ||
        textExtensions.test(file.name);

      if (isTextLike && file.size <= 512 * 1024) {
        try {
          const rawText = await file.text();
          textContent = rawText.slice(0, 6000);
        } catch {
          textContent = undefined;
        }
      }

      newlyRead.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: 'file',
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        textContent,
      });
    }

    setPendingAttachments((prev) => [...prev, ...newlyRead]);
    showCandyNotification(
      `📎 Attached ${newlyRead.length} file(s): ${newlyRead.map((f) => f.name).join(', ')}`
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  // Course-Driven Proactive Mentor Nudge
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
    let matType: LearningMaterialType = '3d_preview';

    if (selectedType === '3d_pointout') {
      text =
        activeChannel.proactiveNudges.pointOut3D ||
        `🔍 **3D Observation (#${activeChannel.slug})**: Look at **${primaryNodeLabel}** and **${secondaryNodeLabel}** in the 3D model. Notice how the animated packets flow between them—what happens if **${primaryNodeLabel}** gets overloaded?`;
      badge = `🔍 3D Point-Out · #${activeChannel.slug}`;
      targetEmotion = 'talking';
      matType = '3d_preview';
    } else if (selectedType === 'socratic_quiz') {
      text =
        activeChannel.proactiveNudges.socraticQuestion ||
        `🎯 **Socratic Check (+10 🍬)**: In **${activeChannel.title}**, why does **${primaryNodeLabel}** connect directly to **${secondaryNodeLabel}**? Try the interactive Small Test preview below!`;
      badge = `🎯 Socratic Check · ${LEVEL_BADGE_MAP[assessedLevel].label}`;
      targetEmotion = 'thinking';
      matType = 'small_test';
    } else {
      text =
        activeChannel.proactiveNudges.realWorldTip ||
        `💡 **${activeMentor.name}'s Course Tip**: While studying **#${activeChannel.slug}**, try routing packets in the interactive Mini Game below to see how **${primaryNodeLabel}** behaves under load!`;
      badge = `💡 Course Insight · #${activeChannel.slug}`;
      targetEmotion = 'happy';
      matType = 'mini_game';
    }

    const nudgeMaterial = buildAdaptiveLearningMaterial({
      mentorId: activeMentor.id,
      mentorName: activeMentor.name,
      roleTitle: activeMentor.roleTitle,
      subject: activeMentor.subject,
      accentColor: activeMentor.accentColor,
      userMessage: text,
      assessedLevel,
      materialType: matType,
      learningStepTitle: activeChannel.title,
      scene3d: currentThread.scene3d || activeChannel.scene3d,
      quiz: currentThread.quiz || activeChannel.quiz,
    });

    const nudgeMsgId = `nudge-${Date.now()}`;
    const nudgeMsg: ChatMessage = {
      id: nudgeMsgId,
      role: 'mentor',
      text,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      avatarState: targetEmotion,
      assessedLevel,
      recommendedMaterialType: matType,
      learningMaterial: nudgeMaterial,
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
    setSelectedMaterialId(`${activeChannel.id}::${nudgeMsgId}`);
    triggerTemporaryAvatarState(targetEmotion, 3000);
  };

  // Send message (with optional attached files) inside the active Curriculum Channel
  const handleSendMessage = async (
    overridePrompt?: string,
    mode: MentorRequestMode = selectedMaterialMode
  ) => {
    const isUsingComposer = overridePrompt === undefined;
    const attachmentsToSend = isUsingComposer ? pendingAttachments : [];
    const rawPrompt = (overridePrompt ?? inputPrompt).trim();

    if ((!rawPrompt && attachmentsToSend.length === 0) || isLoading) return;

    const promptText =
      rawPrompt ||
      `Please analyze the attached file(s) (${attachmentsToSend.map((a) => a.name).join(', ')}) in the context of #${activeChannel.slug} (${activeChannel.title}) and generate interactive learning materials.`;

    if (isUsingComposer) {
      setInputPrompt('');
      setPendingAttachments([]);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      attachments:
        attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
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
          attachments: attachmentsToSend,
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
          assessedLevel,
          mode,
          updatedMessages.length
        );
      }

      if (data.assessedLevel) {
        setAssessedLevel(data.assessedLevel);
        updateMentorLevel(activeMentor.id, data.assessedLevel);
      }
      if (data.levelReason) {
        setLevelReason(data.levelReason);
      }

      const participationCandy =
        (data.candyDelta || 10) + (attachmentsToSend.length > 0 ? 5 : 0);
      addCandy(participationCandy);
      showCandyNotification(
        attachmentsToSend.length > 0
          ? `+${participationCandy} 🍬 File analyzed & learning material added to sidebar!`
          : `+${participationCandy} 🍬 Candy for active learning in #${activeChannel.slug}!`
      );

      const nextScene = data.scene3d?.nodes?.length
        ? data.scene3d
        : currentThread.scene3d;
      const nextQuiz = data.quiz?.options?.length
        ? data.quiz
        : currentThread.quiz;

      const resolvedMaterialType: LearningMaterialType =
        data.recommendedMaterialType ||
        data.learningMaterial?.type ||
        selectOptimalMaterialType(
          promptText,
          data.assessedLevel || assessedLevel,
          mode,
          updatedMessages.length
        );

      const resolvedMaterial =
        data.learningMaterial && data.learningMaterial.interactiveHtmlCode
          ? data.learningMaterial
          : buildAdaptiveLearningMaterial({
              mentorId: activeMentor.id,
              mentorName: activeMentor.name,
              roleTitle: activeMentor.roleTitle,
              subject: activeMentor.subject,
              accentColor: activeMentor.accentColor,
              userMessage: promptText,
              assessedLevel: data.assessedLevel || assessedLevel,
              materialType: resolvedMaterialType,
              learningStepTitle:
                data.learningStepTitle || currentThread.learningStepTitle,
              scene3d: nextScene,
              quiz: nextQuiz || activeChannel.quiz,
            });

      const mentorMsgId = `mentor-${Date.now()}`;
      const mentorMsg: ChatMessage = {
        id: mentorMsgId,
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
        recommendedMaterialType: resolvedMaterialType,
        learningMaterial: resolvedMaterial,
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

      setSelectedMaterialId(`${activeChannel.id}::${mentorMsgId}`);
      triggerTemporaryAvatarState(data.avatarState || 'talking', 3600);
    } catch {
      const fallback = buildClientFallbackResponse(
        activeMentor,
        activeChannel.slug,
        promptText,
        assessedLevel,
        mode,
        updatedMessages.length
      );
      setAssessedLevel(fallback.assessedLevel);
      updateMentorLevel(activeMentor.id, fallback.assessedLevel);
      addCandy(10);

      const fallbackMsgId = `mentor-fb-${Date.now()}`;
      const fallbackMsg: ChatMessage = {
        id: fallbackMsgId,
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
        recommendedMaterialType: fallback.recommendedMaterialType,
        learningMaterial: fallback.learningMaterial,
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

      setSelectedMaterialId(`${activeChannel.id}::${fallbackMsgId}`);
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
        text: `🎉 **Awesome job on the #${activeChannel.slug} quiz!** You just earned **+${candyEarned} 🍬 Candy**!\n\nNotice how that exact principle plays out around **${firstNode}** in our 3D model. Want to push this topic to an **Advanced 3D simulation**, or are you ready to jump into **#${nextChannel.slug}** next?`,
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
        text: `Almost there! 💡 **Quick #${activeChannel.slug} Hint from ${activeMentor.name}**: Take a look at **${firstNode}** in the 3D model and watch the direction of the animated packets. Want me to break down the quiz concept with a simpler 3D analogy?`,
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

  const activeCustomRivUrl =
    customRivFiles[activeMentor.id] || customRivFiles['global'] || null;
  const currentLevelBadge = LEVEL_BADGE_MAP[assessedLevel];

  // =========================================================================
  // Cross-Mentor AI Proactive Top Notification Banner (타 멘토 AI 상단 알림)
  // =========================================================================
  const [crossMentorNudge, setCrossMentorNudge] =
    useState<CrossMentorNudgeResponse | null>(null);
  const [isCrossNudgeLoading, setIsCrossNudgeLoading] = useState(false);
  const [isCrossNudgeVisible, setIsCrossNudgeVisible] = useState(false);
  const nudgeCycleIndexRef = useRef<number>(0);

  const nudgeSenderMentor = useMemo(() => {
    if (!crossMentorNudge) return MENTORS[1] || MENTORS[0];
    return (
      workspaceMentors.find((m) => m.id === crossMentorNudge.fromMentorId) ||
      MENTORS.find((m) => m.id === crossMentorNudge.fromMentorId) ||
      MENTORS[1] ||
      MENTORS[0]
    );
  }, [crossMentorNudge, workspaceMentors]);

  const triggerCrossMentorNotification = useCallback(
    async (explicitFromMentorId?: string) => {
      const priorityIds = [
        'basic-spanish',
        'vibe-coding',
        'dating-coach',
        'korea-history',
        'cs-professor',
      ].filter((id) => id !== activeMentor.id);

      const chosenFromId =
        explicitFromMentorId && explicitFromMentorId !== activeMentor.id
          ? explicitFromMentorId
          : priorityIds[nudgeCycleIndexRef.current % priorityIds.length];

      const targetMentorObj =
        workspaceMentors.find((m) => m.id === chosenFromId) ||
        MENTORS.find((m) => m.id === chosenFromId) ||
        MENTORS.find((m) => m.id !== activeMentor.id) ||
        MENTORS[0];

      const targetChannels = buildCurriculumForMentor(targetMentorObj);
      const targetChannel = targetChannels[1] || targetChannels[0];

      nudgeCycleIndexRef.current += 1;
      setIsCrossNudgeLoading(true);

      try {
        const res = await fetch('/api/mentor/proactive-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentMentorId: activeMentor.id,
            currentMentorName: activeMentor.name,
            currentSubject: activeMentor.subject,
            currentChannelSlug: activeChannel?.slug,
            targetMentorId: targetMentorObj.id,
            targetMentorName: targetMentorObj.name,
            targetMentorRole: targetMentorObj.roleTitle,
            targetMentorSubject: targetMentorObj.subject,
            targetMentorShortTag: targetMentorObj.shortTag,
            targetChannelSlug: targetChannel?.slug,
            targetChannelTitle: targetChannel?.title,
            studentLevel: assessedLevel,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as CrossMentorNudgeResponse;
          setCrossMentorNudge(data);
          setIsCrossNudgeVisible(true);
        }
      } catch {
        // Silent fallback if network fails
      } finally {
        setIsCrossNudgeLoading(false);
      }
    },
    [
      activeMentor.id,
      activeMentor.name,
      activeMentor.subject,
      activeChannel?.slug,
      assessedLevel,
      workspaceMentors,
    ]
  );

  // Auto-trigger Cross-Mentor AI Top Notification when entering the Demo / switching mentor room
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCrossMentorNotification();
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMentor.id]);

  // Accept the Cross-Mentor Top Notification: switch to that mentor & channel and open the promised 3D preview or mini-game!
  const handleAcceptCrossMentorNudge = useCallback(() => {
    if (!crossMentorNudge) return;
    const targetMentor =
      workspaceMentors.find((m) => m.id === crossMentorNudge.fromMentorId) ||
      MENTORS.find((m) => m.id === crossMentorNudge.fromMentorId);
    if (!targetMentor) return;

    const targetChannels = buildCurriculumForMentor(targetMentor);
    const matchedChannel =
      targetChannels.find(
        (c) => c.slug === crossMentorNudge.targetChannelSlug
      ) ||
      targetChannels[1] ||
      targetChannels[0];

    const targetLevel =
      profile.mentorLevels?.[targetMentor.id] || 'beginner';

    const customMaterial = buildAdaptiveLearningMaterial({
      mentorId: targetMentor.id,
      mentorName: targetMentor.name,
      roleTitle: targetMentor.roleTitle,
      subject: targetMentor.subject,
      accentColor: targetMentor.accentColor,
      userMessage: `${crossMentorNudge.struggledConcept} — ${crossMentorNudge.bannerMessage}`,
      assessedLevel: targetLevel,
      materialType: crossMentorNudge.recommendedFormat,
      learningStepTitle: `${crossMentorNudge.struggledConcept} (${
        crossMentorNudge.recommendedFormat === '3d_preview'
          ? 'Custom 3D Preview'
          : 'Custom Interactive Mini Game'
      })`,
      scene3d: matchedChannel.scene3d,
      quiz: matchedChannel.quiz,
    });

    const rewardCandy = crossMentorNudge.candyBonus || 15;
    const welcomeMsgId = `cross-nudge-welcome-${Date.now()}`;
    const welcomeMsg: ChatMessage = {
      id: welcomeMsgId,
      role: 'mentor',
      text: `${crossMentorNudge.channelFollowUpMessage || crossMentorNudge.bannerMessage}\n\n👇 I added a custom **${
        crossMentorNudge.recommendedFormat === '3d_preview'
          ? 'Interactive 3D Preview'
          : 'Playable Mini Game'
      }** (**${crossMentorNudge.struggledConcept}**) to your Right Sidebar so we can explore it hands-on!`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      avatarState: 'happy',
      assessedLevel: targetLevel,
      scene3d: matchedChannel.scene3d,
      quiz: matchedChannel.quiz,
      recommendedMaterialType: crossMentorNudge.recommendedFormat,
      learningMaterial: customMaterial,
      candyEarned: rewardCandy,
      proactiveBadge: `🔔 Cross-Mentor Nudge · Custom ${
        crossMentorNudge.recommendedFormat === '3d_preview'
          ? '3D Preview'
          : 'Mini Game'
      }`,
      suggestedFollowUps: matchedChannel.starterPrompts,
      modelUsed: crossMentorNudge.modelUsed || 'gemini-3-flash-preview',
    };

    setIsCrossNudgeVisible(false);
    setActiveMentor(targetMentor);
    setActiveChannelId(matchedChannel.id);
    setAssessedLevel(targetLevel);
    setLevelReason(getDefaultLevelReason(targetMentor, targetLevel));

    setThreadsByChannel((prev) => {
      const existing = prev[matchedChannel.id];
      const baseMessages = existing ? existing.messages : [];
      return {
        ...prev,
        [matchedChannel.id]: {
          messages: [...baseMessages, welcomeMsg],
          scene3d: matchedChannel.scene3d,
          quiz: matchedChannel.quiz,
          learningStepTitle: matchedChannel.title,
          keyTakeaways: [
            matchedChannel.summary,
            `Generated custom ${
              crossMentorNudge.recommendedFormat === '3d_preview'
                ? '3D Preview'
                : 'Mini Game'
            } for "${crossMentorNudge.struggledConcept}"`,
          ],
        },
      };
    });

    setSelectedMaterialId(`${matchedChannel.id}::${welcomeMsgId}`);
    addCandy(rewardCandy);
    showCandyNotification(
      `+${rewardCandy} 🍬 Switched to ${targetMentor.name}'s custom ${
        crossMentorNudge.recommendedFormat === '3d_preview'
          ? '3D Preview'
          : 'Mini Game'
      } session!`
    );
    triggerTemporaryAvatarState('happy', 3500);

    if (typeof window !== 'undefined') {
      const targetUrl = window.location.pathname.startsWith('/room')
        ? `/room?mentor=${targetMentor.id}`
        : `/mentor/${targetMentor.id}`;
      window.history.replaceState(null, '', targetUrl);
    }
  }, [
    crossMentorNudge,
    workspaceMentors,
    profile.mentorLevels,
    addCandy,
    showCandyNotification,
    triggerTemporaryAvatarState,
  ]);

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
          title="Back to Mentors Home"
          className="w-11 h-11 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          <img
            src="/logo.png"
            alt="Mentors Home"
            className="w-6 h-6 object-contain"
          />
        </Link>

        <div className="w-8 h-[1px] bg-white/10" />

        {/* Scrollable Mentor Face Icons (Slack Workspace Switcher) */}
        <div
          onScroll={() => setHoveredRailMentor(null)}
          className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-3 py-1 no-scrollbar"
        >
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
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredRailMentor({
                      mentor: m,
                      centerY: rect.top + rect.height / 2,
                    });
                  }}
                  onMouseLeave={() => setHoveredRailMentor(null)}
                  aria-label={`${m.name} (${m.shortTag})`}
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
                  {/* Subtle bottom specialty tag on hover */}
                  <span
                    className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-slate-950/95 border border-white/20 text-[8px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 shadow"
                    style={{ color: m.accentColor }}
                  >
                    {m.shortTag}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Subtle Floating Specialty Pill next to Hovered Rail Mentor */}
        {hoveredRailMentor && (
          <div
            style={{ top: hoveredRailMentor.centerY }}
            className="pointer-events-none fixed left-[68px] -translate-y-1/2 z-50 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/95 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: hoveredRailMentor.mentor.accentColor }}
            />
            <span className="text-[11px] font-bold text-white whitespace-nowrap">
              {hoveredRailMentor.mentor.name}
            </span>
            <span className="text-slate-600 text-[10px]">·</span>
            <span
              className="text-[11px] font-semibold whitespace-nowrap"
              style={{ color: hoveredRailMentor.mentor.accentColor }}
            >
              {hoveredRailMentor.mentor.shortTag}
            </span>
          </div>
        )}

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
            <div className="relative shrink-0 group/profile-avatar">
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
              <span
                className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/95 border border-white/20 text-[9px] font-bold whitespace-nowrap opacity-0 group-hover/profile-avatar:opacity-100 transition-opacity duration-150 z-20 shadow-md"
                style={{ color: activeMentor.accentColor }}
              >
                {activeMentor.shortTag}
              </span>
            </div>
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

            {/* Trigger / Cycle Cross-Mentor AI Top Notification Banner */}
            <button
              type="button"
              onClick={() => triggerCrossMentorNotification()}
              disabled={isCrossNudgeLoading}
              title="Another AI Mentor evaluates your learning context and sends a top notification"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 hover:from-pink-500/30 hover:to-amber-500/30 border border-pink-400/40 text-pink-200 text-[11px] sm:text-xs font-extrabold transition cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.2)]"
            >
              <Bell className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span className="hidden sm:inline">AI Mentor Nudge</span>
              <span className="sm:hidden">Nudge</span>
            </button>

            {/* Mobile/Tablet Toggle for Learning Materials Sidebar */}
            <button
              type="button"
              onClick={() => setIsMobileLabOpen((v) => !v)}
              className="xl:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-[11px] font-bold transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Materials ({scopedMaterials.length + uploadedFilesInScope.length})
              </span>
            </button>
          </div>
        </header>

        {/* =================================================================
            CROSS-MENTOR AI PROACTIVE TOP NOTIFICATION BANNER
            Sent by a mentor OTHER than the mentor the user is currently viewing!
           ================================================================= */}
        {isCrossNudgeVisible && crossMentorNudge && (
          <div
            role="region"
            aria-label="Cross-Mentor AI Proactive Top Notification"
            className="mx-4 mt-2 px-3 py-2 rounded-xl border shadow-md relative overflow-hidden transition-all duration-300 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${nudgeSenderMentor.accentColor}1f 0%, rgba(15, 23, 42, 0.96) 55%, ${nudgeSenderMentor.secondaryColor}14 100%)`,
              borderColor: `${nudgeSenderMentor.accentColor}55`,
            }}
          >
            {/* Top Animated Glow Line */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{
                background: `linear-gradient(90deg, ${nudgeSenderMentor.accentColor}, ${nudgeSenderMentor.secondaryColor}, ${nudgeSenderMentor.accentColor})`,
              }}
            />

            <div className="flex items-center justify-between gap-2.5">
              {/* Left: Compact Sending Mentor Avatar + 2-Line Clamped Message */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <RiveAvatar
                    key={`cross-nudge-avatar-${crossMentorNudge.fromMentorId}`}
                    rivSrc={nudgeSenderMentor.rivFile}
                    state="happy"
                    accentColor={nudgeSenderMentor.accentColor}
                    secondaryColor={nudgeSenderMentor.secondaryColor}
                    size={36}
                    mentorName={crossMentorNudge.fromMentorName}
                    stateMachineName="Character"
                  />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 shadow"
                    style={{
                      backgroundColor: nudgeSenderMentor.accentColor,
                    }}
                    title="Cross-Mentor AI Notification"
                  >
                    🔔
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5 overflow-hidden">
                    <span
                      className="shrink-0 text-[10px] font-black px-1.5 py-0.2 rounded-full text-slate-950"
                      style={{
                        backgroundColor: nudgeSenderMentor.accentColor,
                      }}
                    >
                      {crossMentorNudge.fromMentorName} · {crossMentorNudge.fromMentorShortTag}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                      {crossMentorNudge.recommendedFormat === '3d_preview'
                        ? '🧊 3D Preview'
                        : '🎮 Mini Game'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      #{crossMentorNudge.targetChannelSlug} · {crossMentorNudge.struggledConcept}
                    </span>
                  </div>

                  <p
                    className="text-xs font-medium text-slate-100 leading-snug line-clamp-2 break-keep"
                    title={crossMentorNudge.bannerMessage}
                  >
                    {crossMentorNudge.bannerMessage}
                  </p>
                </div>
              </div>

              {/* Right: Compact Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAcceptCrossMentorNudge}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-black text-slate-950 transition hover:opacity-95 cursor-pointer shadow flex items-center gap-1"
                  style={{
                    background: `linear-gradient(135deg, ${nudgeSenderMentor.accentColor}, ${nudgeSenderMentor.secondaryColor})`,
                  }}
                >
                  {crossMentorNudge.recommendedFormat === '3d_preview' ? (
                    <Box className="w-3 h-3" />
                  ) : (
                    <Gamepad2 className="w-3 h-3" />
                  )}
                  <span className="whitespace-nowrap">
                    {crossMentorNudge.recommendedFormat === '3d_preview'
                      ? 'Open 3D'
                      : 'Open Game'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerCrossMentorNotification()}
                  disabled={isCrossNudgeLoading}
                  title="Cycle to another Mentor AI Nudge"
                  className="p-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-slate-300 transition cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${
                      isCrossNudgeLoading ? 'animate-spin text-sky-400' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCrossNudgeVisible(false)}
                  title="Dismiss notification"
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.12] text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slack Channel Message Feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Channel Intro Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0 group/banner-avatar">
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
                <span
                  className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950/95 border border-white/20 text-[9px] font-bold whitespace-nowrap opacity-0 group-hover/banner-avatar:opacity-100 transition-opacity duration-150 z-20 shadow-md"
                  style={{ color: activeMentor.accentColor }}
                >
                  {activeMentor.shortTag}
                </span>
              </div>
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
            const isInitialWelcomeMsg =
              msg.id === `proactive-${activeChannel.id}`;
            return (
              <div key={msg.id} className="flex items-start gap-3.5 group">
                {isMentor ? (
                  <div className="relative shrink-0 mt-0.5 group/msg-avatar">
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
                    <span
                      className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-slate-950/95 border border-white/20 text-[8px] font-bold whitespace-nowrap opacity-0 group-hover/msg-avatar:opacity-100 transition-opacity duration-150 z-20 shadow-md"
                      style={{ color: activeMentor.accentColor }}
                    >
                      {activeMentor.shortTag}
                    </span>
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

                  <div className="mt-1 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <MentorMarkdown
                      content={msg.text}
                      accentColor={activeMentor.accentColor}
                    />
                  </div>

                  {/* User Uploaded File Attachments Card */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-sky-400/30 max-w-sm"
                        >
                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-sky-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {att.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                ({formatFileSize(att.sizeBytes)})
                              </span>
                            </div>
                            <p className="text-[10px] text-sky-300/90 mt-0.5">
                              {att.textContent
                                ? `Extracted ${att.textContent.length.toLocaleString()} chars · Added to Sidebar`
                                : 'File attached · Added to Sidebar'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Domain-Specific Visualization Card */}
                  {isMentor && !isInitialWelcomeMsg && msg.visualCard && (
                    <div
                      className="mt-2.5 p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 shadow-lg space-y-2.5"
                      style={{
                        borderColor: `${activeMentor.accentColor}40`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase"
                          style={{
                            backgroundColor: `${activeMentor.accentColor}22`,
                            color: activeMentor.accentColor,
                            border: `1px solid ${activeMentor.accentColor}45`,
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          {msg.visualCard.badge}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {msg.visualCard.subtitle}
                        </span>
                      </div>

                      <p className="text-xs font-extrabold text-white">
                        {msg.visualCard.title}
                      </p>

                      {/* 3-Step Visual Pipeline */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {msg.visualCard.steps.map((step, sIdx) => (
                          <div
                            key={`${msg.id}-step-${sIdx}`}
                            className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col justify-between gap-1"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] font-extrabold text-white truncate">
                                {step.title}
                              </span>
                              <span
                                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/5 text-slate-300 shrink-0"
                                style={{ color: step.color || activeMentor.accentColor }}
                              >
                                {step.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Optional Before/After or Side-by-Side Comparison */}
                      {msg.visualCard.comparisons &&
                        msg.visualCard.comparisons.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {msg.visualCard.comparisons.map((cmp, cIdx) => (
                              <div
                                key={`${msg.id}-cmp-${cIdx}`}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]"
                              >
                                {cmp.badExample && (
                                  <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-200 truncate">
                                    <span className="font-extrabold text-rose-300 mr-1">
                                      [{cmp.label}]
                                    </span>
                                    {cmp.badExample}
                                  </div>
                                )}
                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 truncate">
                                  <span className="font-extrabold text-emerald-300 mr-1">
                                    ✓ {cmp.badExample ? '' : `[${cmp.label}] `}
                                  </span>
                                  {cmp.goodExample}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      <div className="pt-1 flex items-center justify-between gap-2 text-[10px] text-slate-300 border-t border-white/5">
                        <span className="font-semibold text-amber-300/90 truncate">
                          💡 {msg.visualCard.footerTakeaway}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Compact "Added to Learning Materials" Card (opens in Right Sidebar) — never shown on the initial greeting message */}
                  {isMentor && !isInitialWelcomeMsg && msg.learningMaterial && (
                    <div className="mt-2">
                      {(() => {
                        const meta = MATERIAL_TYPE_META[msg.learningMaterial.type];
                        const itemId = `${activeChannel.id}::${msg.id}`;
                        const isCurrentlySelected =
                          activeCollectedMaterial?.id === itemId;
                        return (
                          <div
                            onClick={() => {
                              setSelectedMaterialId(itemId);
                              setIsMobileLabOpen(true);
                            }}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                              isCurrentlySelected
                                ? 'bg-sky-500/15 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                                : 'bg-slate-900/80 hover:bg-slate-900 border-white/10 hover:border-sky-400/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-slate-950"
                                style={{
                                  backgroundColor: meta.badgeColor,
                                }}
                              >
                                <span>{meta.shortLabel}</span>
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-white truncate">
                                  {msg.learningMaterial.title}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  Added to Right Sidebar · {msg.learningMaterial.pedagogicalReason}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterialId(itemId);
                                setIsMobileLabOpen(true);
                              }}
                              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-[11px] font-extrabold text-sky-200 transition cursor-pointer"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-sky-300" />
                              <span>Open in Sidebar</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Suggested Follow-up Chips — never shown on the initial greeting message */}
                  {isMentor &&
                    !isInitialWelcomeMsg &&
                    msg.suggestedFollowUps &&
                    msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((followUp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              handleSendMessage(followUp, selectedMaterialMode)
                            }
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
                <strong>{activeMentor.name}</strong> is diagnosing your level
                with <strong>Gemini 4 Argon</strong> & authoring an interactive{' '}
                <strong>JS/HTML Mini-Preview</strong> for{' '}
                <strong>#{activeChannel.slug}</strong>...
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Gemini 4 Argon Material Format Selector + Starter Prompts + File Upload + Slack Message Composer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-slate-950/60 space-y-2.5">
          {/* Autonomous / Manual Material Format Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
                Add Material:
              </span>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => setSelectedMaterialMode('auto_recommend')}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold transition cursor-pointer ${
                  selectedMaterialMode === 'auto_recommend'
                    ? 'bg-amber-400/20 border-amber-300/60 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.2)]'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Gemini 4 Argon automatically diagnoses your level and picks 3D Preview, Mini Game, Small Test, or Image Explanation"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Auto</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedMaterialMode('generate_3d');
                  if (!inputPrompt.trim() && pendingAttachments.length === 0) {
                    handleSendMessage(
                      `Build an interactive 3D Preview for #${activeChannel.slug} (${activeChannel.title}) calibrated to my level!`,
                      'generate_3d'
                    );
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  selectedMaterialMode === 'generate_3d'
                    ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-sky-200'
                }`}
              >
                <Box className="w-3 h-3 text-sky-400" />
                <span>3D Preview</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedMaterialMode('generate_mini_game');
                  if (!inputPrompt.trim() && pendingAttachments.length === 0) {
                    handleSendMessage(
                      `Create a playable JS/HTML Mini Game for #${activeChannel.slug} (${activeChannel.title}) calibrated to my level!`,
                      'generate_mini_game'
                    );
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  selectedMaterialMode === 'generate_mini_game'
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-emerald-200'
                }`}
              >
                <Gamepad2 className="w-3 h-3 text-emerald-400" />
                <span>Mini Game</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedMaterialMode('generate_small_test');
                  if (!inputPrompt.trim() && pendingAttachments.length === 0) {
                    handleSendMessage(
                      `Make an interactive Small Test for #${activeChannel.slug} (${activeChannel.title}) calibrated to my level!`,
                      'generate_small_test'
                    );
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  selectedMaterialMode === 'generate_small_test'
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-amber-200'
                }`}
              >
                <ClipboardCheck className="w-3 h-3 text-amber-400" />
                <span>Small Test / Quiz</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedMaterialMode('generate_image_explanation');
                  if (!inputPrompt.trim() && pendingAttachments.length === 0) {
                    handleSendMessage(
                      `Create an interactive Image Explanation diagram for #${activeChannel.slug} (${activeChannel.title}) calibrated to my level!`,
                      'generate_image_explanation'
                    );
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  selectedMaterialMode === 'generate_image_explanation'
                    ? 'bg-purple-500/20 border-purple-400/60 text-purple-200'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-purple-200'
                }`}
              >
                <ImageIcon className="w-3 h-3 text-purple-400" />
                <span>Image Explanation</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {activeChannel.starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(prompt, selectedMaterialMode)}
                className="shrink-0 px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Pending File Attachments Preview Bar */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-sky-400/30">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 mr-1">
                Attached Files ({pendingAttachments.length}):
              </span>
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-400/35 text-xs text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span className="font-bold truncate max-w-[180px]">
                    {att.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300">
                    {formatFileSize(att.sizeBytes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-300 transition cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.md,.json,.csv,.py,.js,.ts,.tsx,.jsx,.html,.css,.sql,.yaml,.yml,.xml,.log,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,text/*"
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(undefined, selectedMaterialMode);
            }}
            className="flex items-center gap-2"
          >
            {/* File Upload Trigger Button (Active) */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              title="Upload study file (.txt, .md, .py, .js, .ts, .csv, .json, .pdf, etc.)"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-sky-500/20 border border-white/15 hover:border-sky-400/40 text-xs font-bold text-slate-200 hover:text-sky-200 transition cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Upload File</span>
            </button>

            {/* Planned Multimodal Upload Indicators (Voice / Image / Video - Next Priority) */}
            <div
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] text-slate-500 shrink-0"
              title="Voice, Image, and Video uploads are scheduled as next priority"
            >
              <Mic className="w-3 h-3 text-slate-500" />
              <ImageIcon className="w-3 h-3 text-slate-500" />
              <Video className="w-3 h-3 text-slate-500" />
              <span>Voice · Image · Video Soon</span>
            </div>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              placeholder={
                pendingAttachments.length > 0
                  ? `Ask ${activeMentor.name} about your ${pendingAttachments.length} attached file(s) or press Send...`
                  : `Message #${activeChannel.slug} or upload a file...`
              }
              className="flex-1 bg-slate-900 border border-white/15 focus:border-sky-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={
                isLoading ||
                (!inputPrompt.trim() && pendingAttachments.length === 0)
              }
              className="px-4 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 disabled:opacity-40 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </main>

      {/* Mobile/Tablet Backdrop for Learning Materials Hub */}
      {isMobileLabOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/65 backdrop-blur-xs xl:hidden"
          onClick={() => setIsMobileLabOpen(false)}
        />
      )}

      {/* =====================================================================
          COLUMN 4: LEARNING MATERIALS SIDEBAR (100% English · One-by-One Feed)
         ===================================================================== */}
      <aside
        className={`${
          isMobileLabOpen
            ? 'fixed right-0 top-14 bottom-0 z-40 flex w-[90vw] max-w-[460px] shadow-2xl'
            : 'hidden xl:flex w-[460px]'
        } shrink-0 h-full border-l border-white/[0.08] bg-[#080b14] flex-col overflow-hidden`}
      >
        {/* Top Header: Title + 1-Click Add Buttons */}
        <div className="p-3.5 border-b border-white/[0.08] bg-slate-950/70 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-black text-white truncate">
                    Learning Materials
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-[10px] font-black text-sky-300">
                    {scopedMaterials.length + uploadedFilesInScope.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Added one by one as you learn in #{activeChannel.slug}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileLabOpen(false)}
              className="xl:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add Bar: Add 3D, Mini Game, Quiz, Visual Guide, or File one by one */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                handleSendMessage(
                  `Build an interactive 3D Preview for #${activeChannel.slug} (${activeChannel.title})!`,
                  'generate_3d'
                )
              }
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[10px] font-bold text-sky-200 transition cursor-pointer"
            >
              <Box className="w-3 h-3 text-sky-400" />
              <span>+ 3D</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                handleSendMessage(
                  `Create a playable JS/HTML Mini Game for #${activeChannel.slug} (${activeChannel.title})!`,
                  'generate_mini_game'
                )
              }
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] font-bold text-emerald-200 transition cursor-pointer"
            >
              <Gamepad2 className="w-3 h-3 text-emerald-400" />
              <span>+ Game</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                handleSendMessage(
                  `Make an interactive Small Test & Quiz for #${activeChannel.slug} (${activeChannel.title})!`,
                  'generate_small_test'
                )
              }
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-[10px] font-bold text-amber-200 transition cursor-pointer"
            >
              <ClipboardCheck className="w-3 h-3 text-amber-400" />
              <span>+ Quiz</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                handleSendMessage(
                  `Create an interactive Image Explanation diagram for #${activeChannel.slug} (${activeChannel.title})!`,
                  'generate_image_explanation'
                )
              }
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-[10px] font-bold text-purple-200 transition cursor-pointer"
            >
              <ImageIcon className="w-3 h-3 text-purple-400" />
              <span>+ Visual</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-[10px] font-bold text-slate-200 transition cursor-pointer"
            >
              <Paperclip className="w-3 h-3 text-sky-400" />
              <span>+ File</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content: Empty State OR One-by-One Added Items + Interactive Viewer */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {filteredMaterials.length === 0 && uploadedFilesInScope.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/[0.07] text-center space-y-3 my-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-400/25 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5 text-sky-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-white">
                  No learning materials added yet
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Each time you chat with <strong className="text-slate-200">{activeMentor.name}</strong> or click{' '}
                  <strong className="text-sky-300">+ 3D</strong>,{' '}
                  <strong className="text-emerald-300">+ Game</strong>,{' '}
                  <strong className="text-amber-300">+ Quiz</strong>, or{' '}
                  <strong className="text-purple-300">+ Visual</strong> above, new materials and quizzes will appear here one by one.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Added Learning Materials List (1 by 1) */}
              {filteredMaterials.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Added Materials ({filteredMaterials.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Select an item to interact
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                    {filteredMaterials.map((item, idx) => {
                      const meta = MATERIAL_TYPE_META[item.material.type];
                      const isSelected = activeCollectedMaterial?.id === item.id;
                      const itemNumber = filteredMaterials.length - idx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedMaterialId(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                              : 'bg-slate-900/70 hover:bg-slate-900 border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                            #{itemNumber}
                          </span>
                          <span
                            className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-extrabold text-slate-950"
                            style={{
                              backgroundColor: meta.badgeColor,
                              borderColor: meta.badgeColor,
                            }}
                          >
                            <span>{meta.shortLabel}</span>
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-white truncate">
                              {item.material.title}
                            </p>
                          </div>

                          <span className="text-[10px] text-slate-500 shrink-0">
                            {item.timestamp}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Selected Material & Quiz Viewer */}
              {activeCollectedMaterial && (
                <div className="pt-2 border-t border-white/[0.08] space-y-3">
                  {/* If 3D Preview is selected, also show the interactive Three.js 3D Viewport */}
                  {activeCollectedMaterial.material.type === '3d_preview' &&
                    activeCollectedMaterial.scene3d && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-sky-400" />
                          <span>Interactive 3D Spatial Viewport</span>
                        </span>
                        <div className="h-[260px] rounded-2xl overflow-hidden border border-white/10">
                          <Argon3DViewer
                            scene={activeCollectedMaterial.scene3d}
                            accentColor={activeMentor.accentColor}
                            isGenerating={isLoading}
                            onRequestGenerate3D={(topic) =>
                              handleSendMessage(
                                `Build an interactive 3D Preview of "${topic}" for #${activeChannel.slug}!`,
                                'generate_3d'
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                  {/* If Small Test / Quiz is selected, prominently render the QuizDrawer */}
                  {activeCollectedMaterial.material.type === 'small_test' &&
                    activeCollectedMaterial.quiz && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Interactive Quiz Challenge</span>
                        </span>
                        <QuizDrawer
                          quiz={activeCollectedMaterial.quiz}
                          accentColor={activeMentor.accentColor}
                          isLoadingQuiz={isLoading}
                          onAnswerSubmit={(isCorrect, candyEarned) =>
                            handleQuizComplete(isCorrect, candyEarned)
                          }
                          onRequestNewQuiz={() =>
                            handleSendMessage(
                              `Make a new interactive Small Test & Quiz for #${activeChannel.slug} (${activeChannel.title})!`,
                              'generate_small_test'
                            )
                          }
                        />
                      </div>
                    )}

                  {/* Interactive JS/HTML Preview Card (Mini Game, Visual Guide, 3D Lab, or Small Test) */}
                  <LearningMaterialPreviewCard
                    key={`hub-viewer-${activeCollectedMaterial.id}`}
                    material={activeCollectedMaterial.material}
                    mentorId={activeMentor.id}
                    mentorName={activeMentor.name}
                    roleTitle={activeMentor.roleTitle}
                    subject={activeMentor.subject}
                    accentColor={activeMentor.accentColor}
                    assessedLevel={activeCollectedMaterial.assessedLevel}
                    scene3d={activeCollectedMaterial.scene3d}
                    quiz={activeCollectedMaterial.quiz}
                    onClaimCandyReward={(amount, reason) => {
                      addCandy(amount);
                      triggerTemporaryAvatarState('happy', 3800);
                      showCandyNotification(`+${amount} 🍬 ${reason}`);
                    }}
                    onRequestRegenerateFormat={(type, reqMode) => {
                      const meta = MATERIAL_TYPE_META[type];
                      handleSendMessage(
                        `Create a custom ${meta.label} for #${activeChannel.slug} (${activeChannel.title}) calibrated to my ${LEVEL_BADGE_MAP[assessedLevel].label} level!`,
                        reqMode
                      );
                    }}
                  />
                </div>
              )}

              {/* Uploaded Study Files Section (only shown when files have been uploaded) */}
              {uploadedFilesInScope.length > 0 && (
                <div className="pt-3 border-t border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Uploaded Files ({uploadedFilesInScope.length})
                      </span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {uploadedFilesInScope.map((fileItem) => (
                      <div
                        key={fileItem.attachment.id}
                        className="p-2.5 rounded-xl bg-slate-900/75 border border-white/[0.08] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate">
                              {fileItem.attachment.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {formatFileSize(fileItem.attachment.sizeBytes)}
                          </span>
                        </div>

                        {fileItem.attachment.textContent && (
                          <pre className="text-[10px] text-slate-300 bg-slate-950/80 border border-white/[0.06] rounded-lg p-2 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                            {fileItem.attachment.textContent.slice(0, 360)}
                            {fileItem.attachment.textContent.length > 360
                              ? '...'
                              : ''}
                          </pre>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[10px] text-slate-500">
                            #{fileItem.channelSlug} · {fileItem.timestamp}
                          </span>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              handleSendMessage(
                                `Analyze my uploaded file "${fileItem.attachment.name}" in the context of #${activeChannel.slug} and generate an interactive quiz or mini game!`,
                                selectedMaterialMode
                              )
                            }
                            className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] font-bold text-emerald-200 cursor-pointer transition"
                          >
                            Generate Material
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default MentorStudioView;

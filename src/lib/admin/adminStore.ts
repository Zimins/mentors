import { Firestore } from '@google-cloud/firestore';
import {
  LearnerSummary,
  AgentDiagnosticReport,
  QuizSubmissionRecord,
  LearnerSessionLog,
  MentorPromptConfig,
  ReferenceMaterial,
} from '@/types/admin';
import { MENTORS } from '@/data/mentors';

const GCP_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCP_PROJECT_ID ||
  'h2gdm-hack26icn-2694';

// In-memory collections as primary fast store and seamless Firestore fallback
const learnersStore = new Map<string, LearnerSummary>([
  [
    'demo-scholar-01',
    {
      userId: 'demo-scholar-01',
      displayName: 'Hackathon Scholar (You)',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      totalTurns: 18,
      candyBalance: 165,
      streakDays: 5,
      xpTotal: 420,
      activeMentorId: 'cs-professor',
      engagedMentorIds: [
        'cs-professor',
        'basic-spanish',
        'vibe-coding',
        'dating-coach',
        'korea-history',
      ],
      mentorLevels: {
        'cs-professor': 'intermediate',
        'basic-spanish': 'beginner',
        'vibe-coding': 'intermediate',
        'dating-coach': 'beginner',
        'korea-history': 'intermediate',
      },
      quizStats: {
        totalAttempted: 11,
        correctCount: 9,
        accuracyRate: 81.8,
      },
    },
  ],
  [
    'alex-systems-dev',
    {
      userId: 'alex-systems-dev',
      displayName: 'Alex Kim (Junior SWE)',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      totalTurns: 22,
      candyBalance: 240,
      streakDays: 12,
      xpTotal: 580,
      activeMentorId: 'vibe-coding',
      engagedMentorIds: ['cs-professor', 'vibe-coding', 'basic-spanish'],
      mentorLevels: {
        'cs-professor': 'advanced',
        'vibe-coding': 'intermediate',
        'basic-spanish': 'beginner',
      },
      quizStats: {
        totalAttempted: 12,
        correctCount: 11,
        accuracyRate: 91.6,
      },
    },
  ],
  [
    'sarah-cloud-intern',
    {
      userId: 'sarah-cloud-intern',
      displayName: 'Sarah Lee (Learner)',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      totalTurns: 9,
      candyBalance: 40,
      streakDays: 2,
      xpTotal: 190,
      activeMentorId: 'korea-history',
      engagedMentorIds: ['korea-history', 'dating-coach', 'cs-professor'],
      mentorLevels: {
        'korea-history': 'beginner',
        'dating-coach': 'beginner',
        'cs-professor': 'beginner',
      },
      quizStats: {
        totalAttempted: 5,
        correctCount: 2,
        accuracyRate: 40,
      },
    },
  ],
]);

const submissionsStore: QuizSubmissionRecord[] = [
  // Prof. Jun (CS Professor) Submissions
  {
    id: 'sub-001',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    channelSlug: '01-pointers-and-memory',
    questionText: 'When a function returns in C/C++, what happens to its local stack frame compared to a heap-allocated block?',
    options: [
      'The stack frame is popped in O(1) by moving the stack pointer, while heap memory persists until explicitly freed',
      'Both stack and heap blocks are immediately erased by the CPU ALU',
      'Heap memory is automatically popped before the stack frame returns',
      'Stack frames require garbage collection sweeps on every clock cycle',
    ],
    selectedOptionIndex: 0,
    correctOptionIndex: 0,
    isCorrect: true,
    candyReward: 15,
    submittedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    explanation: 'Stack allocation simply adjusts the ESP/RSP stack pointer register in O(1), whereas heap memory lives until explicit free() or GC.',
  },
  {
    id: 'sub-002',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    channelSlug: '02-cpu-cache-hierarchy',
    questionText: 'Why does traversing a contiguous array exhibit much higher L1 cache hit rates than a linked list?',
    options: [
      'Spatial locality loads adjacent array elements together in a single 64-byte cache line fetch',
      'Arrays bypass the CPU registers completely',
      'Linked lists are stored exclusively inside the GPU VRAM',
      'Arrays compress 64-bit integers into 1-bit flags automatically',
    ],
    selectedOptionIndex: 0,
    correctOptionIndex: 0,
    isCorrect: true,
    candyReward: 15,
    submittedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    explanation: 'CPUs fetch memory in 64-byte cache lines. Contiguous elements share cache lines, triggering hardware prefetching.',
  },
  {
    id: 'sub-003',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    channelSlug: '01-pointers-and-memory',
    questionText: 'What is the immediate consequence of dereferencing a dangling pointer after free(ptr)?',
    options: [
      'It triggers a guaranteed compilation error before runtime',
      'Undefined behavior: read/write to already freed memory, risking crash or security exploits',
      'The memory controller automatically clones the block back to ROM',
      'The CPU switches into kernel ring 0 mode safely',
    ],
    selectedOptionIndex: 2,
    correctOptionIndex: 1,
    isCorrect: false,
    candyReward: 0,
    submittedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    explanation: 'Dereferencing a freed pointer leads to Undefined Behavior (UB), which can silently corrupt adjacent data or crash with SIGSEGV.',
  },
  // Mina (Algorithm Coach) Submissions
  {
    id: 'sub-005',
    userId: 'demo-scholar-01',
    mentorId: 'algo-coach',
    channelSlug: 'dijkstra-shortest-paths',
    questionText: 'In Dijkstra algorithm with a min-priority queue, why can negative edge weights produce incorrect shortest paths?',
    options: [
      'Min-heap only works on even integer numbers',
      'Once a vertex distance is finalized and popped, Dijkstra assumes its optimal distance will never decrease again',
      'Negative edges cause an immediate stack overflow in graph traversal',
      'Dijkstra requires directed acyclic graphs (DAGs) only',
    ],
    selectedOptionIndex: 1,
    correctOptionIndex: 1,
    isCorrect: true,
    candyReward: 20,
    submittedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    explanation: 'Dijkstra greedy invariant assumes visited vertices have reached global optimum. Negative weights violate this monotonic relaxation.',
  },
  {
    id: 'sub-006',
    userId: 'demo-scholar-01',
    mentorId: 'algo-coach',
    channelSlug: 'bfs-vs-dfs',
    questionText: 'Which graph search algorithm is guaranteed to find the shortest path in an unweighted graph?',
    options: [
      'Depth First Search (DFS)',
      'Breadth First Search (BFS)',
      'Topological Sort',
      'Post-order Traversal',
    ],
    selectedOptionIndex: 1,
    correctOptionIndex: 1,
    isCorrect: true,
    candyReward: 15,
    submittedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    explanation: 'BFS explores vertices in concentric level rings (distance 0, 1, 2...), guaranteeing first arrival at target is minimal hop count.',
  },
  // Coach Pen (Cloud & Systems) Submissions
  {
    id: 'sub-007',
    userId: 'demo-scholar-01',
    mentorId: 'arch-sensei',
    channelSlug: 'cloud-run-mesh',
    questionText: 'When Cloud Run auto-scales from zero to 100 instances during a traffic burst, how can we prevent overloading downstream Firestore databases?',
    options: [
      'Disable HTTPS load balancing during peak times',
      'Implement Cloud Tasks queue throttling and connection pool clamping on container instances',
      'Convert all NoSQL documents into CSV files on local disk',
      'Increase client timeout to 30 minutes',
    ],
    selectedOptionIndex: 1,
    correctOptionIndex: 1,
    isCorrect: true,
    candyReward: 20,
    submittedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    explanation: 'Rate-limiting ingress via Cloud Tasks queues or Redis mutex locks buffers spiky traffic without exhausting DB connection pools.',
  },
  // Sarah Lee Submissions
  {
    id: 'sub-004',
    userId: 'sarah-cloud-intern',
    mentorId: 'arch-sensei',
    channelSlug: '01-global-lb',
    questionText: 'In a microservices architecture, what is the role of an Anycast Global Load Balancer?',
    options: [
      'It compiles Docker containers into binary files',
      'It routes client traffic to the nearest healthy regional backend with single IP and SSL offloading',
      'It replaces the relational database with flat files',
      'It executes unit tests before pushing to GitHub',
    ],
    selectedOptionIndex: 3,
    correctOptionIndex: 1,
    isCorrect: false,
    candyReward: 0,
    submittedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    explanation: 'Anycast LB announces a single Anycast VIP globally and routes traffic to the closest Google Cloud point-of-presence (PoP).',
  },
];

const sessionLogsStore: LearnerSessionLog[] = [
  // Prof. Jun (CS Professor) Session Logs
  {
    id: 'log-001',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    role: 'user',
    text: 'Can you show me in 3D how stack frames and heap pointers connect across the memory bus?',
    studentIntent: 'request_3d',
    scene3dTitle: 'CPU Memory Hierarchy & Stack Frame Visualizer',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 'log-002',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    role: 'mentor',
    text: 'Certainly! Look at the 3D model: Notice node [0x40] as the stack frame pointer and the animated packet reaching out to [0x28] in the heap pool. What happens when the stack frame unwinds?',
    studentIntent: 'general',
    scene3dTitle: 'CPU Memory Hierarchy & Stack Frame Visualizer',
    timestamp: new Date(Date.now() - 1000 * 60 * 39).toISOString(),
  },
  {
    id: 'log-003',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    role: 'user',
    text: 'What happens when a dangling pointer is dereferenced? Could you quiz me on this?',
    studentIntent: 'challenge_quiz',
    timestamp: new Date(Date.now() - 1000 * 60 * 36).toISOString(),
  },
  {
    id: 'log-004',
    userId: 'demo-scholar-01',
    mentorId: 'cs-professor',
    role: 'user',
    text: 'Show me an interview-level question on 64-byte L1 cache line prefetching!',
    studentIntent: 'propose_topic',
    timestamp: new Date(Date.now() - 1000 * 60 * 26).toISOString(),
  },
  // Mina (Algorithm Coach) Session Logs
  {
    id: 'log-006',
    userId: 'demo-scholar-01',
    mentorId: 'algo-coach',
    role: 'user',
    text: 'Can you demonstrate how Dijkstra algorithm relaxes edges using a 3D animated packet trace?',
    studentIntent: 'request_3d',
    scene3dTitle: 'Dijkstra Shortest Path & Priority Queue Frontier',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'log-007',
    userId: 'demo-scholar-01',
    mentorId: 'algo-coach',
    role: 'mentor',
    text: 'Here is the 3D graph frontier! Glowing emerald vertices represent visited nodes, while yellow packets relax the next closest edge (S -> A -> C -> T) with minimal cumulative cost d=7.',
    studentIntent: 'general',
    scene3dTitle: 'Dijkstra Shortest Path & Priority Queue Frontier',
    timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
  },
  {
    id: 'log-008',
    userId: 'demo-scholar-01',
    mentorId: 'algo-coach',
    role: 'user',
    text: 'I want to master A* heuristic search compared to vanilla Dijkstra. Can you quiz me?',
    studentIntent: 'challenge_quiz',
    timestamp: new Date(Date.now() - 1000 * 60 * 56).toISOString(),
  },
  // Coach Pen (Cloud & Systems) Session Logs
  {
    id: 'log-009',
    userId: 'demo-scholar-01',
    mentorId: 'arch-sensei',
    role: 'user',
    text: 'How does Google Anycast Global Load Balancing route packets across multi-region Cloud Run pods in 3D?',
    studentIntent: 'request_3d',
    scene3dTitle: 'GCP Cloud Run + Firestore + Global Load Balancer Mesh',
    timestamp: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
  },
  {
    id: 'log-010',
    userId: 'demo-scholar-01',
    mentorId: 'arch-sensei',
    role: 'mentor',
    text: 'Take a look at the 3D mesh: The top cylinder is our Anycast L7 VIP. Incoming HTTP/3 requests are fanned out directly to regional Cloud Run instances with zero cross-region hops!',
    studentIntent: 'general',
    scene3dTitle: 'GCP Cloud Run + Firestore + Global Load Balancer Mesh',
    timestamp: new Date(Date.now() - 1000 * 60 * 98).toISOString(),
  },
  {
    id: 'log-005',
    userId: 'alex-systems-dev',
    mentorId: 'cs-professor',
    role: 'user',
    text: 'Can we simulate false sharing in a multi-core CPU with MESI cache coherence protocol in 3D?',
    studentIntent: 'propose_topic',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
];

// Default mentor prompt configs seeded from MENTORS
const promptConfigsStore = new Map<string, MentorPromptConfig>();
MENTORS.forEach((m) => {
  promptConfigsStore.set(m.id, {
    mentorId: m.id,
    systemPersona: m.systemPersona,
    diagnosticGuidelines:
      'Evaluate whether the student understands low-level hardware memory layouts, algorithmic complexity, and real-time distributed systems trade-offs. Adapt responses according to their diagnosed level (beginner, intermediate, advanced).',
    studentDirectives: {
      'demo-scholar-01':
        'Focus on preventing dangling pointers and memory safety patterns. Ask thought-provoking architectural questions before giving away the answer.',
      'sarah-cloud-intern':
        'Use simple real-world analogies (e.g. postal sorting center for load balancers) and reinforce foundational cloud networking concepts.',
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'Lead Human Architect',
  });
});

// Seeded expert reference materials
const referenceMaterialsStore: ReferenceMaterial[] = [
  {
    id: 'ref-cs-01',
    mentorId: 'cs-professor',
    title: 'Modern Memory Hierarchy & 64-Byte Cache Line Prefetching Guide',
    category: 'architecture_guide',
    content: `# Modern CPU Cache Architecture & Spatial Locality

## 1. 64-Byte Cache Line Mechanics
- CPUs do not fetch individual bytes or 8-byte words from DRAM; instead, memory is transferred in chunks called **Cache Lines** (typically 64 bytes on x86-64 and ARM Cortex).
- When a 4-byte integer is accessed at address \`0x1000\`, the memory controller reads the 64-byte window \`[0x1000, 0x103F]\` into the L1 data cache.

## 2. Contiguous Memory vs. Pointer Chasing
- **Contiguous Array**: Iterating sequentially over \`int data[1024]\` causes 1 cache miss every 16 integers (64B / 4B). The remaining 15 accesses are guaranteed L1 cache hits (latency ~1-4 cycles).
- **Linked List**: Nodes are scattered non-contiguously in heap memory. Every \`node->next\` pointer dereference risks a DRAM fetch (~150-250 cycles), degrading performance by up to 10-20x.

## 3. Teaching Directive
Guide students to visualize the cache hierarchy in 3D: L1 Data Cache (fastest, smallest) -> L2 Cache -> L3 Shared Cache -> System DRAM Bus.`,
    tags: ['CPU Cache', 'Spatial Locality', 'Systems Architecture', 'L1/L2/L3'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'ref-arch-01',
    mentorId: 'arch-sensei',
    title: 'Google Cloud Anycast Global Load Balancing & Cloud Run Topologies',
    category: 'textbook',
    content: `# Google Cloud Anycast LB & Serverless Architecture

## 1. Anycast IP Routing
- Google's Global External Application Load Balancer uses BGP Anycast to announce the same IP address from over 100+ Edge Points of Presence (PoPs) worldwide.
- Traffic enters Google's private fiber backbone at the nearest edge location, minimizing public internet transit latency.

## 2. Multi-Region Cloud Run Failover
- Backend services can be configured across multiple regions (e.g. \`asia-northeast3\` Seoul and \`us-central1\` Iowa).
- If one region experiences latency spikes or capacity exhaustion, cross-region traffic overflows seamlessly without DNS propagation delays.`,
    tags: ['GCP', 'Anycast', 'Cloud Run', 'Architecture'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

// Diagnostic summaries generated by Gemini (keyed by userId and userId:mentorId)
const diagnosticReportsStore = new Map<string, AgentDiagnosticReport>([
  [
    'demo-scholar-01:cs-professor',
    {
      userId: 'demo-scholar-01',
      mentorId: 'cs-professor',
      generatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      masterySummary:
        'The student demonstrates a solid intermediate understanding of CPU stack frame unwinding and L1 cache line spatial locality. However, they exhibited a notable misconception regarding dangling pointer dereference safety and heap reclamation lifecycle.',
      identifiedWeaknesses: [
        'Heap memory lifecycle: Believed CPU memory controller automatically clones or frees blocks upon pointer dissolution',
        'Undefined Behavior (UB) implications in low-level systems programming',
      ],
      learningHabits:
        'Highly proactive learner who requests 3D interactive visualizations before attempting quizzes. Responds well to architectural mental models.',
      recommendedNextSteps: [
        'Run an interactive 3D simulation specifically demonstrating a Dangling Pointer dereference and segmentation fault boundary',
        'Assign a multi-step quiz on C++ smart pointers (unique_ptr vs shared_ptr) to reinforce automated ownership',
      ],
      suggestedTopics: [
        'Dangling Pointers & Use-After-Free Vulnerabilities',
        'RAII (Resource Acquisition Is Initialization)',
        'Cache Line False Sharing in Multi-core Systems',
      ],
      confidenceScore: 88,
    },
  ],
  [
    'demo-scholar-01:algo-coach',
    {
      userId: 'demo-scholar-01',
      mentorId: 'algo-coach',
      generatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      masterySummary:
        'Demonstrates clear fundamental intuition regarding BFS level-ring shortest path guarantees in unweighted graphs, and understands priority queue edge relaxation in Dijkstra. Shows keen interest in comparing A* heuristic estimators.',
      identifiedWeaknesses: [
        'Nuance of negative weight cycles and why Bellman-Ford is needed over Dijkstra',
        'Memory overhead of storing visited node parent pointers during massive graph frontiers',
      ],
      learningHabits:
        'Engages strongly with animated 3D packet traces and challenges themselves with algorithmic edge cases before moving to new topics.',
      recommendedNextSteps: [
        'Simulate a directed graph with a negative edge cycle to visualize why Dijkstra enters an incorrect state',
        'Introduce A* Euclidean vs Manhattan distance heuristic comparison in 3D',
      ],
      suggestedTopics: [
        'A* Heuristic Search & Admissibility',
        'Bellman-Ford & Negative Cycle Detection',
        'Topological Sort on Dependency DAGs',
      ],
      confidenceScore: 92,
    },
  ],
  [
    'demo-scholar-01',
    {
      userId: 'demo-scholar-01',
      mentorId: 'cs-professor',
      generatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      masterySummary:
        'The student demonstrates a solid intermediate understanding of CPU stack frame unwinding and L1 cache line spatial locality. However, they exhibited a notable misconception regarding dangling pointer dereference safety and heap reclamation lifecycle.',
      identifiedWeaknesses: [
        'Heap memory lifecycle: Believed CPU memory controller automatically clones or frees blocks upon pointer dissolution',
        'Undefined Behavior (UB) implications in low-level systems programming',
      ],
      learningHabits:
        'Highly proactive learner who requests 3D interactive visualizations before attempting quizzes. Responds well to architectural mental models.',
      recommendedNextSteps: [
        'Run an interactive 3D simulation specifically demonstrating a Dangling Pointer dereference and segmentation fault boundary',
        'Assign a multi-step quiz on C++ smart pointers (unique_ptr vs shared_ptr) to reinforce automated ownership',
      ],
      suggestedTopics: [
        'Dangling Pointers & Use-After-Free Vulnerabilities',
        'RAII (Resource Acquisition Is Initialization)',
        'Cache Line False Sharing in Multi-core Systems',
      ],
      confidenceScore: 88,
    },
  ],
]);

let firestoreClient: Firestore | null = null;
let firestoreUnavailable = false;

function getFirestoreClient(): Firestore | null {
  if (firestoreUnavailable) return null;
  if (!firestoreClient) {
    try {
      firestoreClient = new Firestore({
        projectId: GCP_PROJECT_ID,
        ignoreUndefinedProperties: true,
      });
    } catch {
      firestoreUnavailable = true;
      return null;
    }
  }
  return firestoreClient;
}

export const adminStore = {
  // Learners
  getLearners(): LearnerSummary[] {
    return Array.from(learnersStore.values());
  },

  getLearner(userId: string): LearnerSummary | undefined {
    return learnersStore.get(userId);
  },

  updateLearner(summary: LearnerSummary): void {
    learnersStore.set(summary.userId, summary);
  },

  // Submissions (Filterable by userId and mentorId)
  getSubmissions(userId?: string, mentorId?: string): QuizSubmissionRecord[] {
    let list = submissionsStore;
    if (userId) list = list.filter((s) => s.userId === userId);
    if (mentorId) list = list.filter((s) => s.mentorId === mentorId);
    return list;
  },

  recordSubmission(submission: QuizSubmissionRecord): void {
    submissionsStore.unshift(submission);

    // Update learner stats & active mentor
    const learner = learnersStore.get(submission.userId);
    if (learner) {
      learner.quizStats.totalAttempted += 1;
      if (submission.isCorrect) {
        learner.quizStats.correctCount += 1;
        learner.candyBalance += submission.candyReward;
      }
      learner.quizStats.accuracyRate = Math.round(
        (learner.quizStats.correctCount / learner.quizStats.totalAttempted) * 100
      );
      learner.lastActiveAt = new Date().toISOString();
      learner.activeMentorId = submission.mentorId;
      if (!learner.engagedMentorIds) learner.engagedMentorIds = [];
      if (!learner.engagedMentorIds.includes(submission.mentorId)) {
        learner.engagedMentorIds.push(submission.mentorId);
      }
      learnersStore.set(submission.userId, learner);
    }
  },

  // Session Logs (Filterable by userId and mentorId)
  getSessionLogs(userId?: string, mentorId?: string): LearnerSessionLog[] {
    let list = sessionLogsStore;
    if (userId) list = list.filter((l) => l.userId === userId);
    if (mentorId) list = list.filter((l) => l.mentorId === mentorId);
    return list;
  },

  recordSessionLog(log: LearnerSessionLog): void {
    sessionLogsStore.unshift(log);
    const learner = learnersStore.get(log.userId);
    if (learner) {
      learner.totalTurns += 1;
      learner.lastActiveAt = new Date().toISOString();
      learner.activeMentorId = log.mentorId;
      if (!learner.engagedMentorIds) learner.engagedMentorIds = [];
      if (!learner.engagedMentorIds.includes(log.mentorId)) {
        learner.engagedMentorIds.push(log.mentorId);
      }
      learnersStore.set(log.userId, learner);
    }
  },

  // Prompts & Directives
  getPromptConfig(mentorId: string): MentorPromptConfig | undefined {
    return promptConfigsStore.get(mentorId);
  },

  getAllPromptConfigs(): MentorPromptConfig[] {
    return Array.from(promptConfigsStore.values());
  },

  savePromptConfig(config: MentorPromptConfig): void {
    promptConfigsStore.set(config.mentorId, config);

    const db = getFirestoreClient();
    if (db) {
      db.collection('mentors_admin_prompts')
        .doc(config.mentorId)
        .set(config, { merge: true })
        .catch(() => {
          firestoreUnavailable = true;
        });
    }
  },

  // Reference Materials
  getReferences(mentorId?: string): ReferenceMaterial[] {
    if (!mentorId) return referenceMaterialsStore;
    return referenceMaterialsStore.filter((r) => r.mentorId === mentorId);
  },

  saveReference(ref: ReferenceMaterial): void {
    const idx = referenceMaterialsStore.findIndex((r) => r.id === ref.id);
    if (idx >= 0) {
      referenceMaterialsStore[idx] = ref;
    } else {
      referenceMaterialsStore.unshift(ref);
    }

    const db = getFirestoreClient();
    if (db) {
      db.collection('mentors_admin_references')
        .doc(ref.id)
        .set(ref, { merge: true })
        .catch(() => {
          firestoreUnavailable = true;
        });
    }
  },

  deleteReference(id: string): void {
    const idx = referenceMaterialsStore.findIndex((r) => r.id === id);
    if (idx >= 0) {
      referenceMaterialsStore.splice(idx, 1);
    }
  },

  // AI Diagnostic Reports (Query by userId and optional mentorId)
  getDiagnosticReport(userId: string, mentorId?: string): AgentDiagnosticReport | undefined {
    if (mentorId) {
      const specific = diagnosticReportsStore.get(`${userId}:${mentorId}`);
      if (specific) return specific;
    }
    return diagnosticReportsStore.get(userId);
  },

  saveDiagnosticReport(report: AgentDiagnosticReport): void {
    diagnosticReportsStore.set(`${report.userId}:${report.mentorId}`, report);
    diagnosticReportsStore.set(report.userId, report);

    const db = getFirestoreClient();
    if (db) {
      db.collection('mentors_admin_diagnostics')
        .doc(`${report.userId}_${report.mentorId}`)
        .set(report, { merge: true })
        .catch(() => {
          firestoreUnavailable = true;
        });
    }
  },
};

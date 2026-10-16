import { buildAdaptiveLearningMaterial } from '@/lib/gemini/learningMaterialTemplates';
import type {
  ChatMessage,
  LearningMaterialType,
  MentorConfig,
  QuizQuestion,
  Scene3DSpec,
  StudentLevel,
  VisualCardSpec,
} from '@/types/mentor';

export interface DemoChannelSeedInput {
  id: string;
  slug: string;
  title: string;
  summary: string;
  proactiveGreeting: string;
  starterPrompts: string[];
  scene3d: Scene3DSpec;
  quiz: QuizQuestion;
}

interface ChannelConversationScript {
  userQuestion1: string;
  mentorReply1: string;
  materialType1: LearningMaterialType;
  visualCard1: VisualCardSpec;
  userQuestion2: string;
  mentorReply2: string;
  materialType2: LearningMaterialType;
  visualCard2: VisualCardSpec;
}

const DEMO_CHANNEL_SCRIPTS: Record<string, ChannelConversationScript> = {
  // =========================================================================
  // 1. CS 101 — Prof. Jun (cs-professor)
  // =========================================================================
  'cs-professor::01-binary-and-logic-gates': {
    userQuestion1:
      'I know computers use 0s and 1s, but how do physical logic gates actually add two binary bits like 1 + 1 = 10 inside the CPU ALU? Can you show me visually?',
    mentorReply1:
      'Awesome question! Inside the **CPU Arithmetic Logic Unit (ALU)**, adding two 1-bit binary numbers (`A` and `B`) only takes **two logic gates wired in parallel**—a circuit called a **1-Bit Half-Adder**:\n\n- **XOR Gate (`A ⊕ B` → Sum Bit)**: Outputs `1` only when inputs differ. When `A=1` and `B=1`, `XOR` outputs `0`.\n- **AND Gate (`A · B` → Carry Bit)**: Outputs `1` only when *both* inputs are `1`. When `A=1` and `B=1`, `AND` outputs Carry `1`.\n\nPut Carry (`1`) and Sum (`0`) together and you get binary **`10`** (which is `2` in decimal)! Check out the visual circuit diagram below:',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D ALU Circuit Visualization',
      title: '1-Bit Binary Half-Adder (XOR + AND Parallel Pipeline)',
      subtitle:
        'How two logic gates combine to compute 1 + 1 = 10₂ (Decimal 2) in hardware',
      steps: [
        {
          badge: 'INPUT BITS',
          title: 'Registers A = 1, B = 1',
          detail: 'High voltage (+1.0V) signals enter the ALU instruction bus.',
          color: '#38bdf8',
        },
        {
          badge: 'SUM GATE (XOR)',
          title: 'A ⊕ B → Sum = 0',
          detail: 'XOR outputs 1 if inputs differ, or 0 when both are 1.',
          color: '#818cf8',
        },
        {
          badge: 'CARRY GATE (AND)',
          title: 'A · B → Carry = 1',
          detail: 'AND fires a Carry-Out bit (1) to the 2¹ column when A=1 & B=1.',
          color: '#34d399',
        },
      ],
      comparisons: [
        {
          label: '0 + 0',
          goodExample: 'Carry = 0 (AND) | Sum = 0 (XOR) → Output: 00₂ (0)',
        },
        {
          label: '1 + 0',
          goodExample: 'Carry = 0 (AND) | Sum = 1 (XOR) → Output: 01₂ (1)',
        },
        {
          label: '1 + 1',
          goodExample: 'Carry = 1 (AND) | Sum = 0 (XOR) → Output: 10₂ (2)',
          note: 'Overflow into the 2s place via the AND Carry bit!',
        },
      ],
      footerTakeaway:
        'Chain 64 of these Full-Adders together and you get a modern 64-bit CPU ALU!',
    },
    userQuestion2:
      'Oh! Seeing XOR compute the Sum bit while AND computes the Carry bit makes total sense. Can I test toggling the bits and routing ALU signals myself in a mini-game?',
    mentorReply2:
      'You bet! 🎮 I just spun up an interactive **ALU Logic Gate & Packet Router Mini-Game** for you below (and pinned it to your **Learning Materials** sidebar on the right). Toggle the binary inputs, route the instruction packets through the **ALU**, and claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive CS 101 Simulation',
      title: 'Live ALU Binary Adder & Register Bus Challenge',
      subtitle: 'Trace instruction packets from CPU Clock → ALU Gates → RAM',
      steps: [
        {
          badge: 'STAGE 1',
          title: 'Decode 4-Bit Binary',
          detail: 'Convert 1011₂ = (1×8) + (0×4) + (1×2) + (1×1) = 11₁₀.',
          color: '#38bdf8',
        },
        {
          badge: 'STAGE 2',
          title: 'Trigger XOR + AND',
          detail: 'Fire the Half-Adder gates and watch Carry propagation.',
          color: '#f59e0b',
        },
        {
          badge: 'STAGE 3',
          title: 'Write to Register R0',
          detail: 'Latch the 64-bit output on the rising CPU clock edge.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Click "Play Live Inline" below or interact directly in the Right Sidebar!',
    },
  },

  'cs-professor::02-variables-stack-and-heap': {
    userQuestion1:
      'When I write `let user = { name: "Alex" }`, what actually goes on the Call Stack vs. the Heap in RAM? Why can’t everything just sit on the Stack?',
    mentorReply1:
      'Great intuition check! The **Call Stack** requires fixed-size variables known at compile/call time so it can allocate and pop frames in `O(1)` just by moving one CPU register (`RSP`).\n\nDynamic objects like `{ name: "Alex" }` can grow or outlive a single function call, so the runtime splits the work across **both regions**:\n1. **Heap (`0x7FA0`)**: Stores the actual dynamic object `{ name: "Alex" }`.\n2. **Stack Frame (`0x7FFF`)**: Stores the local variable `user`, which holds the **64-bit pointer address (`0x7FA0`)** pointing to that Heap object!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Memory Layout Visualization',
      title: 'Call Stack Frame (0x7FFF) → Pointer → Heap Object (0x7FA0)',
      subtitle:
        'Why primitive values & pointers live on the Stack while dynamic objects live on the Heap',
      steps: [
        {
          badge: 'CALL STACK (0x7FFF)',
          title: 'Local Frame: user = 0x7FA0',
          detail: 'Ultra-fast LIFO memory. Holds primitives & 8-byte pointers.',
          color: '#f59e0b',
        },
        {
          badge: 'POINTER REF',
          title: '64-Bit Memory Address',
          detail: 'Directs the CPU MMU from Stack slot 0x7FFF to Heap 0x7FA0.',
          color: '#a855f7',
        },
        {
          badge: 'HEAP RAM (0x7FA0)',
          title: 'Object { name: "Alex" }',
          detail: 'Flexible dynamic allocation managed by Garbage Collection.',
          color: '#38bdf8',
        },
      ],
      comparisons: [
        {
          label: 'Call Stack (LIFO)',
          goodExample: 'O(1) push/pop via Stack Pointer · Fixed size · Auto-freed on return',
        },
        {
          label: 'Heap Memory',
          goodExample: 'Dynamic size at runtime · Accessed via pointers · Cleaned by GC / free()',
          note: 'Losing the pointer without freeing causes a Memory Leak!',
        },
      ],
      footerTakeaway:
        'Copying `let b = user` copies the 8-byte pointer on the Stack—both point to the same Heap object!',
    },
    userQuestion2:
      'That explains why mutating `b.name` also changes `user.name`! Can I test Stack frame pop vs. Heap Garbage Collection in a simulation?',
    mentorReply2:
      'Spot on! Because both stack variables hold the same `0x7FA0` address, mutating through one reference mutates the shared Heap object. Here is an interactive **Stack vs. Heap Pointer Simulator** so you can test pointer aliasing, Stack Overflow, and Garbage Collection hands-on!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Memory Simulator',
      title: 'Stack Pointer Aliasing & Garbage Collector Lab',
      subtitle: 'Trace stack frames, heap allocations, and reachable roots',
      steps: [
        {
          badge: 'PUSH FRAME',
          title: 'Allocate Stack Local',
          detail: 'Push function parameters and return address onto Call Stack.',
          color: '#f59e0b',
        },
        {
          badge: 'HEAP ALLOC',
          title: 'Link Pointer → 0x7FA0',
          detail: 'Connect stack variable to dynamic Heap memory block.',
          color: '#38bdf8',
        },
        {
          badge: 'GC SWEEP',
          title: 'Reclaim Unreferenced Heap',
          detail: 'Free unreachable Heap objects when Stack pointers pop.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Test the live simulator in the Right Sidebar or expand it inline below!',
    },
  },

  'cs-professor::03-algorithms-and-big-o': {
    userQuestion1:
      'Why is O(log N) Binary Search so much faster than O(N) Linear Scan on 1,000,000 items? Can you visualize how the search space shrinks?',
    mentorReply1:
      'Let’s visualize the math in action! Suppose you have a sorted array of **1,000,000 items**:\n- **`O(N)` Linear Scan**: Checks items one by one from index `0` to `999,999` → up to **1,000,000 comparisons**.\n- **`O(log N)` Binary Search**: Jumps to the middle element (`index 500,000`). If your target is larger, it instantly eliminates the entire left half (**500,000 items gone in 1 step!**). Halving `1,000,000` repeatedly reaches `1` item in just **`log₂(1,000,000) ≈ 20` steps**!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Algorithmic Scaling Map',
      title: 'Binary Search Halving Tree: 1,000,000 Items in 20 Steps',
      subtitle:
        'Why dividing the search space by 2 on every comparison crushes linear scanning',
      steps: [
        {
          badge: 'STEP 1',
          title: '1,000,000 → 500,000',
          detail: 'Compare middle element; eliminate 500,000 items in 1 check.',
          color: '#34d399',
        },
        {
          badge: 'STEP 10',
          title: '500,000 → ~976 Items',
          detail: 'After 10 halvings (2¹⁰ = 1,024), 99.9% of the array is gone.',
          color: '#38bdf8',
        },
        {
          badge: 'STEP 20',
          title: 'Exact Target Found!',
          detail: '2²⁰ = 1,048,576. Guaranteed discovery in ≤ 20 comparisons!',
          color: '#a855f7',
        },
      ],
      comparisons: [
        {
          label: 'O(1) Hash Lookup',
          goodExample: '1 operation regardless of N (Direct key → bucket index)',
        },
        {
          label: 'O(log N) Binary Search',
          goodExample: '≤ 20 operations for N = 1,000,000 (Requires sorted array)',
        },
        {
          label: 'O(N) vs O(N²)',
          badExample: 'O(N²) Nested Loops = 1,000,000,000,000 operations (Freeze!)',
          goodExample: 'O(N log N) MergeSort/QuickSort = ~20,000,000 operations',
        },
      ],
      footerTakeaway:
        'Rule of thumb: If your data is sorted, Binary Search turns a million-item needle-in-a-haystack into 20 checks!',
    },
    userQuestion2:
      'Eliminating 99.9% of a million items in 10 steps is wild! Can you challenge me with an interactive Big-O & Binary Search quiz game?',
    mentorReply2:
      'Challenge accepted! ⚡ Below is your interactive **Big-O Complexity & Binary Search Challenge**. Solve the halving rounds and quiz to claim **+25 🍬 Candy**!',
    materialType2: 'small_test',
    visualCard2: {
      badge: 'Interactive Big-O Assessment',
      title: 'Logarithmic Halving & Time Complexity Challenge',
      subtitle: 'Match data structures to O(1), O(log N), O(N), and O(N log N)',
      steps: [
        {
          badge: 'ROUND 1',
          title: 'Sorted Array (N=1,024)',
          detail: 'Compute max Binary Search steps: log₂(1024) = 10.',
          color: '#34d399',
        },
        {
          badge: 'ROUND 2',
          title: 'BST vs. Hash Map',
          detail: 'Compare ordered O(log N) range queries vs. O(1) key lookup.',
          color: '#38bdf8',
        },
        {
          badge: 'ROUND 3',
          title: 'Spot the O(N²) Bottleneck',
          detail: 'Replace nested array.includes() with a Set for O(N) speed.',
          color: '#fbbf24',
        },
      ],
      footerTakeaway:
        'Answer the interactive quiz in the Right Sidebar or open the live test inline!',
    },
  },

  'cs-professor::04-os-and-internet-packets': {
    userQuestion1:
      'What actually happens under the hood in the 50 milliseconds after I type a website URL and press Enter?',
    mentorReply1:
      'In those 50 milliseconds, your **Operating System** and the **Internet protocol stack** run a four-stage relay race:\n1. **DNS Resolution**: Your browser asks a DNS resolver to translate `mentors.ai` into an IP address (`142.250.190.46`).\n2. **TCP 3-Way Handshake**: Your OS kernel exchanges `SYN` → `SYN-ACK` → `ACK` packets with the server to open a reliable connection.\n3. **TLS & HTTP Request**: Encrypted packets stream across fiber routers.\n4. **OS Process Scheduling**: The CPU context-switches between your network driver and browser renderer to paint the pixels at 60 FPS!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Network & OS Pipeline',
      title: 'Browser URL → DNS → TCP 3-Way Handshake → OS Kernel',
      subtitle: 'How packets cross the internet while the OS schedules CPU slices',
      steps: [
        {
          badge: '1. DNS LOOKUP',
          title: 'Domain → IP Address',
          detail: 'Translates human domain name into routable IP (e.g. 142.250.x.x).',
          color: '#38bdf8',
        },
        {
          badge: '2. TCP HANDSHAKE',
          title: 'SYN → SYN-ACK → ACK',
          detail: 'Establishes reliable, ordered packet delivery with sequence IDs.',
          color: '#ec4899',
        },
        {
          badge: '3. OS SCHEDULER',
          title: 'Kernel Context Switch',
          detail: 'Interrupts wake the browser process to parse HTML & render.',
          color: '#818cf8',
        },
      ],
      footerTakeaway:
        'TCP guarantees every byte arrives in order; UDP skips the handshake for ultra-low-latency live video & gaming!',
    },
    userQuestion2:
      'Can I trace a live packet through DNS lookup and the TCP 3-Way Handshake in an interactive simulation?',
    mentorReply2:
      'Ready to roll! 🌐 Use the **Packet Router & OS Scheduler Simulator** below (or in the Right Sidebar) to guide a request from browser to server and earn **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Network Simulator',
      title: 'TCP/IP Packet Journey & Kernel Time-Slice Game',
      subtitle: 'Route DNS, SYN/ACK packets, and CPU interrupts without dropping frames',
      steps: [
        {
          badge: 'HOP 1',
          title: 'Resolve DNS Cache',
          detail: 'Fetch IP address in 4ms from local/edge DNS resolver.',
          color: '#38bdf8',
        },
        {
          badge: 'HOP 2',
          title: 'Complete 3-Way Handshake',
          detail: 'Acknowledge sequence numbers before sending HTTP GET.',
          color: '#ec4899',
        },
        {
          badge: 'HOP 3',
          title: 'Schedule Browser Thread',
          detail: 'Allocate CPU time slice to decode response & paint DOM.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Launch the interactive simulation inline or in the Right Sidebar!',
    },
  },

  // =========================================================================
  // 2. BASIC SPANISH — Mina (basic-spanish)
  // =========================================================================
  'basic-spanish::01-hola-and-pronunciation': {
    userQuestion1:
      'I’m visiting Madrid next month! How do I greet people and order coffee naturally without sounding like a robot reading a textbook?',
    mentorReply1:
      '¡Qué emocionante! 🇪🇸✨ The secret to sounding natural in Madrid is mastering two things: **5 crisp, unchanging vowels (`A, E, I, O, U`)** and **warm rhythm**!\n\nUnlike English, where vowels glide ("oh-la"), Spanish vowels are short and pure. And in Spain, locals love a friendly **`¡Hola! ¡Buenas!`** followed by **`¿Me pones un café con leche, por favor?`** ("Could you get me a coffee with milk, please?"). Look at the pronunciation & rhythm visual below:',
    materialType1: 'image_explanation',
    visualCard1: {
      badge: 'Spanish Phonetics & Rhythm Map',
      title: 'The 5 Pure Spanish Vowels + Natural Madrid Café Greeting',
      subtitle:
        'Zero silent vowels (except "h"!) — every vowel keeps one crisp sound every time',
      steps: [
        {
          badge: 'VOWEL RULE',
          title: 'A (ah) · E (eh) · I (ee) · O (oh) · U (oo)',
          detail: 'Keep vowels short and crisp—never glide "O" into "ow"!',
          color: '#f59e0b',
        },
        {
          badge: 'SILENT H',
          title: '¡Hola! → "OH-lah"',
          detail: '"H" is 100% silent in Spanish (Hola, Hoy, Hablar).',
          color: '#fb7185',
        },
        {
          badge: 'CAFÉ ORDER',
          title: '¡Un café con leche, por favor!',
          detail: 'Add "¡Buenas!" when walking in and "¡Muchas gracias!" after.',
          color: '#34d399',
        },
      ],
      comparisons: [
        {
          label: 'Morning / Casual Hello',
          badExample: 'Robot textbook: "Hola. Quiero un café." (Too blunt)',
          goodExample: 'Natural local: "¡Hola, buenos días! ¿Me pones un café con leche, por favor?"',
        },
        {
          label: 'Asking How They Are',
          goodExample: '¿Cómo estás? (KOH-moh ehs-TAHS) / ¿Qué tal? (KEH tahl)',
          note: 'Reply: "¡Muy bien, gracias! ¿Y tú?" (Very good, thanks! And you?)',
        },
      ],
      footerTakeaway:
        'Pro tip: Notice the upside-down ¡ and ¿—they tell you to lift your voice melody right from the first syllable!',
    },
    userQuestion2:
      'That vowel rhythm chart and "¿Me pones un café con leche?" tip are so helpful! Can we roleplay a real Madrid café conversation in a mini-game?',
    mentorReply2:
      '¡Claro que sí! ☕💃 I built an interactive **Madrid Café & Greeting Roleplay Mini-Game** for you right below (and in your **Learning Materials** sidebar). Pick the natural Spanish responses in each round to earn **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Spanish Roleplay',
      title: 'Madrid Morning Café Conversation Simulator',
      subtitle: 'Practice greeting the barista, ordering, and thanking like a local',
      steps: [
        {
          badge: 'SCENE 1',
          title: 'Enter Café in Sol',
          detail: 'Greet warmly: "¡Hola, buenos días! ¿Qué tal?"',
          color: '#f59e0b',
        },
        {
          badge: 'SCENE 2',
          title: 'Order Your Drink',
          detail: '"Un café con leche y un churro, por favor."',
          color: '#fb7185',
        },
        {
          badge: 'SCENE 3',
          title: 'Wrap Up & Smile',
          detail: '"¡Muy rico! Muchas gracias, ¡hasta luego!"',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Play the interactive roleplay inline below or in the Right Sidebar!',
    },
  },

  'basic-spanish::02-ser-vs-estar-and-verbs': {
    userQuestion1:
      'I always mix up "Soy" and "Estoy" because both mean "I am" in English! Is there a visual rule so I never confuse Ser and Estar again?',
    mentorReply1:
      'Every Spanish learner hits this exact wall—and once you see the visual split, it clicks forever! 🎯\n\nThink of **SER (`Soy, Eres, Es`)** as **Who/Where You Are From Permanently (Essence & Identity)**, and **ESTAR (`Estoy, Estás, Está`)** as **How/Where You Are Right Now (State & Location)**:\n- **`Soy de Corea / Soy estudiante`** → Permanent origin & identity (**SER**)\n- **`Estoy en Madrid / Estoy muy feliz`** → Current location & temporary emotion (**ESTAR**)',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Spanish Grammar Map',
      title: 'SER (Permanent Identity) vs. ESTAR (Location & Temporary State)',
      subtitle: 'The "Essence vs. Condition" visual rule for "I am" in Spanish',
      steps: [
        {
          badge: 'SER (SOY / ES)',
          title: 'Identity · Origin · Profession',
          detail: '"Soy de Seúl." / "Soy ingeniero." (Permanent traits)',
          color: '#f59e0b',
        },
        {
          badge: 'DECISION NODE',
          title: 'Essence vs. Current State?',
          detail: 'Ask: Is this WHO I am (Ser) or WHERE/HOW I am right now (Estar)?',
          color: '#a855f7',
        },
        {
          badge: 'ESTAR (ESTOY / ESTÁ)',
          title: 'Location · Mood · Condition',
          detail: '"Estoy en Madrid." / "Estoy cansado." (Physical place or mood)',
          color: '#34d399',
        },
      ],
      comparisons: [
        {
          label: 'Origin vs. Current Location',
          goodExample: 'Soy de Corea (I am from Korea — SER) vs. Estoy en España (I am in Spain right now — ESTAR)',
        },
        {
          label: 'Personality vs. Mood Today',
          goodExample: 'Eres muy alegre (You are a cheerful person — SER) vs. Estás muy alegre hoy (You’re in a great mood today — ESTAR)',
        },
      ],
      footerTakeaway:
        'Memory rhyme: "For how you feel and where you are, always use the verb ESTAR!"',
    },
    userQuestion2:
      '"Soy de Corea, pero ahora estoy en Madrid!" That rhyme makes it so easy. Can I test myself with a fast Ser vs. Estar sentence builder game?',
    mentorReply2:
      '¡Exacto! That sentence was 10/10! 🌟 Jump into the **Ser vs. Estar Speed Builder Mini-Game** below to lock in your reflexes and earn **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Grammar Mini-Game',
      title: 'Soy vs. Estoy 60-Second Sentence Builder',
      subtitle: 'Match real-life travel & conversation sentences to SER or ESTAR',
      steps: [
        {
          badge: 'CHALLENGE 1',
          title: '"___ de Corea" → SOY',
          detail: 'Origin/nationality is permanent → SER.',
          color: '#f59e0b',
        },
        {
          badge: 'CHALLENGE 2',
          title: '"___ en el hotel" → ESTOY',
          detail: 'Physical location always uses ESTAR.',
          color: '#34d399',
        },
        {
          badge: 'CHALLENGE 3',
          title: '"El café ___ caliente" → ESTÁ',
          detail: 'Temperature is a temporary physical state → ESTAR.',
          color: '#fb7185',
        },
      ],
      footerTakeaway:
        'Complete the interactive mini-game in the Right Sidebar or inline!',
    },
  },

  'basic-spanish::03-tapas-travel-and-ordering': {
    userQuestion1:
      'At a tapas restaurant in Barcelona, how do I ask what they recommend and ask for the check politely?',
    mentorReply1:
      'Tapas dining is one of the best parts of Spain! 🥘🍷 You only need **3 golden phrases** to sound effortless from the moment you sit down to paying the bill:\n1. **Ask for recommendations**: *`¿Qué nos recomienda para compartir?`* ("What do you recommend for us to share?")\n2. **Order smoothly**: *`Para mí, patatas bravas y una sangría, por favor.`*\n3. **Ask for the check**: Make gentle eye contact and say *`La cuenta, por favor.`*',
    materialType1: 'image_explanation',
    visualCard1: {
      badge: 'Travel Spanish Visual Guide',
      title: '3-Step Tapas Restaurant & Travel Survival Flow',
      subtitle: 'Essential phrases for menus, recommendations, and paying the bill',
      steps: [
        {
          badge: '1. RECOMMEND',
          title: '¿Qué me recomienda?',
          detail: '"What do you recommend?" — waiters love when you ask this!',
          color: '#f59e0b',
        },
        {
          badge: '2. TO SHARE',
          title: 'Para compartir, por favor',
          detail: 'Tapas are meant for sharing across the table.',
          color: '#fb7185',
        },
        {
          badge: '3. THE BILL',
          title: 'La cuenta, por favor',
          detail: '"The check, please" + "¿Puedo pagar con tarjeta?" (Card OK?)',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Need directions after dinner? Just ask: "Perdón, ¿dónde está la estación de metro?"',
    },
    userQuestion2:
      'Let’s practice ordering tapas and asking for the check in an interactive travel game!',
    mentorReply2:
      '¡Vamos! 🥘 Here is your interactive **Barcelona Tapas & Travel Survival Game**. Complete the restaurant dialogue to claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Travel Game',
      title: 'Barcelona Tapas Night Dialogue Simulator',
      subtitle: 'Order dishes to share, ask for recommendations, and pay by card',
      steps: [
        {
          badge: 'TABLE SEAT',
          title: 'Mesa para dos, por favor',
          detail: 'Request a table for two on the terrace.',
          color: '#f59e0b',
        },
        {
          badge: 'TAPAS PICK',
          title: 'Patatas Bravas & Paella',
          detail: 'Order house specialties with polite connectors.',
          color: '#fb7185',
        },
        {
          badge: 'CHECKOUT',
          title: 'La cuenta + Con tarjeta',
          detail: 'Ask for the bill and confirm contactless card payment.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Play live in the Right Sidebar or toggle the inline preview below!',
    },
  },

  'basic-spanish::04-past-future-and-fluency': {
    userQuestion1:
      'How do I tell a Spanish friend what I did today vs. what I’m going to do tomorrow without memorizing 50 verb charts?',
    mentorReply1:
      'Here is the ultimate conversational shortcut used by native speakers every day! 🚀\n\nInstead of memorizing complex future conjugations, use **`Ir a + Infinitive`** (*Voy a...* = "I’m going to..."), and pair it with 3 high-frequency past frames:\n- **Today / Past**: *`Hoy visité el museo y comí paella.`* ("Today I visited the museum and ate paella.")\n- **Reaction**: *`¡Me encantó!`* ("I loved it!")\n- **Tomorrow / Future**: *`Mañana voy a visitar Toledo.`* ("Tomorrow I’m going to visit Toledo.")',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Conversation Timeline',
      title: 'Past → Reaction → Future ("Voy a + Verb") Storytelling Formula',
      subtitle: 'Tell complete stories in Spanish using 3 plug-and-play frames',
      steps: [
        {
          badge: 'PAST (HOY / AYER)',
          title: 'Visité... y comí...',
          detail: '"Ayer visité el Prado y comí tapas." (What you did)',
          color: '#a855f7',
        },
        {
          badge: 'EMOTION',
          title: '¡Me encantó! / ¡Fue increíble!',
          detail: 'Express how you felt about the experience naturally.',
          color: '#fb7185',
        },
        {
          badge: 'FUTURE (MAÑANA)',
          title: 'Voy a + Infinitive',
          detail: '"Mañana voy a viajar a Barcelona." (I am going to...)',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        '`Voy a + any verb` unlocks 100% of future plans immediately!',
    },
    userQuestion2:
      'Wait—"Voy a + infinitive" works just like "I’m going to" in English! Quiz me on real-life Spanish storytelling!',
    mentorReply2:
      '¡Brillante! 🏆 Take on the **Basic Spanish Fluency Boss Quiz** below (or in the Right Sidebar) to earn **+35 🍬 Candy**!',
    materialType2: 'small_test',
    visualCard2: {
      badge: 'Spanish Fluency Boss Quiz',
      title: 'Past, Present & "Voy a" Storytelling Challenge',
      subtitle: 'Connect time markers (Ayer, Hoy, Mañana) with the right Spanish verb frame',
      steps: [
        {
          badge: 'FRAME 1',
          title: 'Ayer / Hoy → Past Action',
          detail: 'Visité, comí, hablé, fui.',
          color: '#a855f7',
        },
        {
          badge: 'FRAME 2',
          title: 'Ahora → Estoy + Location',
          detail: 'Estoy en Madrid disfrutando del viaje.',
          color: '#f59e0b',
        },
        {
          badge: 'FRAME 3',
          title: 'Mañana → Voy a + Infinitive',
          detail: 'Mañana voy a probar churros con chocolate.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Complete the Boss Quiz in the Right Sidebar to claim +35 🍬 Candy!',
    },
  },

  // =========================================================================
  // 3. VIBE CODING — Bolt (vibe-coding)
  // =========================================================================
  'vibe-coding::01-spec-first-prompting': {
    userQuestion1:
      'Whenever I ask an AI coding agent "build me a SaaS app", it generates messy code and hallucinates random libraries. How do I structure a Spec-First prompt?',
    mentorReply1:
      'That’s the #1 trap in Vibe Coding! ⚡ When you give a vague 1-liner, the AI has to guess your stack, schema, and UI flow—so it hallucinates.\n\nGreat builders use the **4-Block Spec-First Blueprint**:\n1. **Tech Stack & Aesthetic**: Pin exact versions (e.g., *Next.js 15 App Router, TypeScript, Tailwind, dark glassmorphism*).\n2. **Data Schema**: Define the exact TypeScript interface first.\n3. **Vertical User Flow**: Describe 1 concrete user action from click → state update.\n4. **Guardrails (Non-Goals)**: Explicitly state *what NOT to touch or install*!',
    materialType1: 'image_explanation',
    visualCard1: {
      badge: 'Spec-First Prompt Blueprint',
      title: 'Vague 1-Liner vs. 4-Block Spec-First Architecture Prompt',
      subtitle:
        'How to turn AI coding agents into deterministic full-stack builders',
      steps: [
        {
          badge: '1. STACK & UI',
          title: 'Pin Framework & Design',
          detail: 'Next.js App Router + TypeScript + Tailwind CSS tokens.',
          color: '#10b981',
        },
        {
          badge: '2. DATA SCHEMA',
          title: 'Define Exact Interfaces',
          detail: 'Give the exact TypeScript struct / JSON shape upfront.',
          color: '#38bdf8',
        },
        {
          badge: '3. GUARDRAILS',
          title: 'Scope to 1 Vertical Slice',
          detail: '"Do NOT add external UI libs or modify unrelated files."',
          color: '#a855f7',
        },
      ],
      comparisons: [
        {
          label: 'Vague Prompt vs. Spec-First Prompt',
          badExample: '❌ "Build me an AI habit tracker app with a nice UI."',
          goodExample:
            '✅ "Build Slice #1: HabitCard.tsx + POST /api/habits using interface { id, title, streak }. Keep state in localStorage first; do not install external state libraries."',
          note: 'Vertical slicing cuts bug loops by 80%!',
        },
      ],
      footerTakeaway:
        'Always ship 1 working vertical slice before prompting for the next feature!',
    },
    userQuestion2:
      'Seeing the 4-block blueprint side-by-side makes it obvious why my 1-sentence prompts failed! Can I try assembling a Spec-First prompt in a mini-game?',
    mentorReply2:
      'Let’s ship it! 🚀 I loaded the **Spec-First Prompt Architect Simulator** below and in your **Learning Materials** sidebar. Assemble the 4 spec blocks to ship a clean MVP and claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Vibe Coding Game',
      title: 'Spec-First Prompt Builder & MVP Shipper',
      subtitle: 'Select the right Stack, Schema, Slice, and Guardrails to hit 100% build pass',
      steps: [
        {
          badge: 'STEP 1',
          title: 'Lock TypeScript Schema',
          detail: 'Define strict input/output types before UI generation.',
          color: '#10b981',
        },
        {
          badge: 'STEP 2',
          title: 'Build Vertical Slice #1',
          detail: 'Wire 1 UI component → 1 API route end-to-end.',
          color: '#38bdf8',
        },
        {
          badge: 'STEP 3',
          title: 'Verify & Commit Checkpoint',
          detail: 'Test localhost render before adding Slice #2.',
          color: '#f59e0b',
        },
      ],
      footerTakeaway:
        'Play the interactive Prompt Architect inline or in the Right Sidebar!',
    },
  },

  'vibe-coding::02-fullstack-ui-and-api-routes': {
    userQuestion1:
      'How do I wire a Next.js client component to a `/api/generate` route with a strict JSON schema so the UI never crashes on malformed AI output?',
    mentorReply1:
      'Never parse raw freeform markdown when your UI needs structured state! ⚡\n\nIn a production Vibe Coding pipeline:\n1. **Frontend (`Client Component`)**: Sends a typed `POST` payload and renders a skeleton state while `isLoading` is true.\n2. **Backend (`/api/route.ts`)**: Calls Gemini with `response_format: { mime_type: "application/json", schema }` and keeps `GEMINI_API_KEY` strictly on the server.\n3. **Fallback Guard**: Always wrap `JSON.parse` with a deterministic fallback object so the UI never white-screens!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Full-Stack Slice Pipeline',
      title: 'Client State → Typed /api Route → Structured JSON Schema → UI',
      subtitle: 'Zero-crash AI full-stack wiring in Next.js & TypeScript',
      steps: [
        {
          badge: 'CLIENT UI',
          title: 'Optimistic / Loading State',
          detail: 'Disable double-submit & show clear progress feedback.',
          color: '#38bdf8',
        },
        {
          badge: 'SERVER ROUTE',
          title: 'Hidden API Key + JSON Schema',
          detail: 'Enforce strict schema properties & required fields on server.',
          color: '#10b981',
        },
        {
          badge: 'SAFE RENDER',
          title: 'Typed Response + Fallback',
          detail: 'Guarantee valid props reach your React components.',
          color: '#a855f7',
        },
      ],
      footerTakeaway:
        'Never expose `GEMINI_API_KEY` in `NEXT_PUBLIC_*`—always route through `/api/*`!',
    },
    userQuestion2:
      'Can I test tracing a vertical slice request from UI button click to structured JSON render?',
    mentorReply2:
      'Here you go! 💻 Play the **Full-Stack Vertical Slice Simulator** below (or in the Right Sidebar) to wire the client, server route, and schema validator for **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Full-Stack Wiring Game',
      title: 'Next.js + Gemini JSON Schema Pipeline Builder',
      subtitle: 'Connect Client fetch(), Server API route, and Schema validation',
      steps: [
        {
          badge: 'WIRE 1',
          title: 'POST /api/mentor/chat',
          detail: 'Send typed JSON body from React client.',
          color: '#38bdf8',
        },
        {
          badge: 'WIRE 2',
          title: 'Enforce JSON Schema',
          detail: 'Validate required fields before returning 200 OK.',
          color: '#10b981',
        },
        {
          badge: 'WIRE 3',
          title: 'Update React State',
          detail: 'Render cards smoothly with zero runtime TypeErrors.',
          color: '#a855f7',
        },
      ],
      footerTakeaway:
        'Interact with the live builder in the Right Sidebar or inline below!',
    },
  },

  'vibe-coding::03-agentic-debugging-and-context': {
    userQuestion1:
      'Help! My AI agent is stuck in a bug loop where fixing file A breaks file B, and fixing file B breaks file A again. How do I break out of it?',
    mentorReply1:
      'Stop saying *"it still doesn’t work"*—that causes the agent to guess blindly and overwrite working code! 🛑\n\nUse the **4-Step Bug-Loop Escape Protocol**:\n1. **`git checkout` / Revert** back to the last working checkpoint.\n2. **Paste the Exact Stack Trace** (file path, line number, and error message).\n3. **Pin the Minimal Context**: Reference only the 1–2 files involved (`@fileA.ts`, `@types.ts`).\n4. **Freeze Working Files**: Tell the agent: *"Only modify `fileA.ts` lines 40–75. Do NOT modify `fileB.ts`."*',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Context Engineering Loop',
      title: 'The 4-Step AI Bug-Loop Escape Protocol',
      subtitle: 'How to stop regression cascades with stack traces & file locks',
      steps: [
        {
          badge: '1. CHECKPOINT',
          title: 'Revert Bad Diff',
          detail: 'Never stack 5 broken AI guesses on top of each other.',
          color: '#f59e0b',
        },
        {
          badge: '2. EXACT TRACE',
          title: 'Line # + Error Message',
          detail: 'Provide exact TypeScript/Console stack trace, not "it broke".',
          color: '#ec4899',
        },
        {
          badge: '3. FILE LOCK',
          title: 'Constrain Blast Radius',
          detail: '"Fix only route.ts; do NOT edit working UI components."',
          color: '#10b981',
        },
      ],
      footerTakeaway:
        'Small diffs + exact stack traces + locked working files = instant bug resolution!',
    },
    userQuestion2:
      'Locking the working files in the prompt and pasting the exact stack trace is a lifesaver! Let me practice this in the debugging simulator.',
    mentorReply2:
      'You’ve got the pro mindset now! ⚡ Jump into the **Agentic Bug-Loop Escape Simulator** below to resolve a live multi-file bug and claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Debugging Simulator',
      title: 'Context Engineering & Regression Guardrail Game',
      subtitle: 'Isolate the broken line, lock working files, and ship a clean patch',
      steps: [
        {
          badge: 'INSPECT',
          title: 'Locate Stack Trace Line',
          detail: 'Pinpoint TypeError at route.ts:48.',
          color: '#ec4899',
        },
        {
          badge: 'CONSTRAIN',
          title: 'Lock UI Component',
          detail: 'Prevent agent from rewriting working frontend styles.',
          color: '#f59e0b',
        },
        {
          badge: 'VERIFY',
          title: 'Green Build Check',
          detail: 'Confirm 0 TypeScript errors and commit checkpoint.',
          color: '#10b981',
        },
      ],
      footerTakeaway:
        'Try the live debugging game in the Right Sidebar or inline!',
    },
  },

  'vibe-coding::04-one-click-deploy-and-ship': {
    userQuestion1:
      'My app works on localhost:3000, but I want to ship it to production today without leaking my API keys. What’s the pre-launch checklist?',
    mentorReply1:
      'Before you push to `main` and deploy to Vercel/Cloud Run, run this **4-Point Production Ship Checklist**:\n1. **Secret Audit**: Verify `.env.local` is in `.gitignore` and API keys only live in server environment variables.\n2. **Production Build Check (`next build`)**: Catch strict TypeScript or unused import errors that dev mode ignores.\n3. **API Rate & Error Guard**: Return clean fallback JSON if an upstream AI call times out.\n4. **OpenGraph & Mobile Polish**: Add title, description, and responsive layout checks!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Production Ship Pipeline',
      title: 'Localhost:3000 → Security Audit → Next Build → Global Edge Deploy',
      subtitle: 'The 4-gate checklist every AI builder runs before going live',
      steps: [
        {
          badge: 'GATE 1',
          title: 'Zero Client Key Leaks',
          detail: 'Keep GEMINI_API_KEY server-side only; audit .gitignore.',
          color: '#10b981',
        },
        {
          badge: 'GATE 2',
          title: 'Strict Build Verification',
          detail: 'Pass TypeScript typecheck & static route compilation.',
          color: '#38bdf8',
        },
        {
          badge: 'GATE 3',
          title: 'Graceful AI Fallbacks',
          detail: 'Ensure demo works smoothly even under rate limits.',
          color: '#a855f7',
        },
      ],
      footerTakeaway:
        'A shipped product with graceful fallbacks beats a fragile localhost prototype every time!',
    },
    userQuestion2:
      'Quiz me on the Production Security & Ship Checklist before I push to main!',
    mentorReply2:
      'Let’s verify you’re ready for launch! 🚀 Complete the **Vibe Coding Ship-to-Prod Boss Quiz** below (or in the Right Sidebar) for **+35 🍬 Candy**!',
    materialType2: 'small_test',
    visualCard2: {
      badge: 'Production Launch Boss Quiz',
      title: 'Security, Env Vars & Edge Deployment Assessment',
      subtitle: 'Pass all 3 launch gates to earn your Vibe Coding Ship Badge',
      steps: [
        {
          badge: 'CHECK 1',
          title: 'Server vs. Client Env Vars',
          detail: 'Why NEXT_PUBLIC_ exposes secrets in browser bundles.',
          color: '#10b981',
        },
        {
          badge: 'CHECK 2',
          title: 'Schema & Timeout Resilience',
          detail: 'Handling latency spikes without breaking UI state.',
          color: '#38bdf8',
        },
        {
          badge: 'CHECK 3',
          title: 'Zero-Downtime Rollouts',
          detail: 'Preview URLs → Production promotion workflow.',
          color: '#a855f7',
        },
      ],
      footerTakeaway:
        'Solve the Boss Quiz in the Right Sidebar or open it inline below!',
    },
  },

  // =========================================================================
  // 4. HOW TO MAKE A GIRLFRIEND — Sora (dating-coach)
  // =========================================================================
  'dating-coach::01-first-impressions-and-confidence': {
    userQuestion1:
      'When I see someone cute at a coffee shop or campus event, I overthink my opening line for 10 minutes until she leaves. How do I start a conversation naturally?',
    mentorReply1:
      'First: take a breath—you don’t need a clever "pickup line" at all! 💖 In fact, rehearsed pickup lines feel unnatural because they ignore the moment.\n\nInstead, use the **3-Second Warm Observational Opener**:\n1. **Open Body Language**: Uncross your arms, relax your shoulders, and offer a warm, genuine smile.\n2. **Situational Observation**: Comment lightly on something you’re *both* experiencing right now (the drink line, a book, the music, or the event).\n3. **Low-Pressure Delivery**: Speak as if you’re already chatting with a friendly acquaintance!',
    materialType1: 'image_explanation',
    visualCard1: {
      badge: 'Social Confidence Visual Guide',
      title: 'The 3-Second Observational Opener (Zero Pickup Lines Needed)',
      subtitle:
        'How to turn everyday moments into warm, low-pressure first conversations',
      steps: [
        {
          badge: '1. WARM PRESENCE',
          title: 'Eye Contact + Relaxed Smile',
          detail: 'Calm posture signals confidence and safety before you speak.',
          color: '#ec4899',
        },
        {
          badge: '2. OBSERVATION',
          title: 'Shared Context Comment',
          detail: '"That iced matcha looks amazing—is that their seasonal special?"',
          color: '#f472b6',
        },
        {
          badge: '3. OPEN HOOK',
          title: 'Easy Follow-Up Bridge',
          detail: 'If she smiles and engages, introduce yourself naturally!',
          color: '#38bdf8',
        },
      ],
      comparisons: [
        {
          label: 'Coffee Shop / Bookstore Opener',
          badExample: '❌ Staring silently for 15 minutes or using a cheesy memorized line.',
          goodExample:
            '✅ "Hey! Excuse me—I noticed you reading that book, is it worth picking up? I’m looking for my next read."',
          note: 'Authentic curiosity feels natural and respectful!',
        },
      ],
      footerTakeaway:
        'The 3-Second Rule: Say hi within 3 seconds of noticing shared context before your brain invents excuses!',
    },
    userQuestion2:
      'Focusing on a situational observation instead of a pickup line takes away so much pressure! Can I practice choosing the best opener in a scenario game?',
    mentorReply2:
      'Yes! 🌟 I created a **Real-Life First Impression & Opener Simulator** for you below (and in your **Learning Materials** sidebar). Practice reading the situation and picking the warmest opener to earn **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Social Scenario Game',
      title: 'Café, Bookstore & Campus Opener Simulator',
      subtitle: 'Pick the most natural, confident response in 3 real-world scenes',
      steps: [
        {
          badge: 'SCENARIO 1',
          title: 'Weekend Matcha Café Line',
          detail: 'Spark a light conversation about the menu without pressure.',
          color: '#ec4899',
        },
        {
          badge: 'SCENARIO 2',
          title: 'Campus Club / Art Gallery',
          detail: 'Use a shared observation to transition into introductions.',
          color: '#f472b6',
        },
        {
          badge: 'SCENARIO 3',
          title: 'Reading Social Cues',
          detail: 'Spot warm engagement vs. busy signals with grace.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Play the scenario simulator inline below or in the Right Sidebar!',
    },
  },

  'dating-coach::02-magnetic-banter-and-active-listening': {
    userQuestion1:
      'Once we say hi, I accidentally fall into "job interview mode" asking boring back-to-back questions. How do I create fun banter and emotional connection?',
    mentorReply1:
      'We call that the **Interrogation Trap** ("Where are you from? What’s your major? How many siblings do you have?")—and it’s super easy to fix! ✨\n\nUse the **Listen → Relate/Playful Observation → Open "How/Why" Loop**:\n- When she answers a question, **don’t jump to a new topic**. Pick one emotional keyword from what she just said.\n- Share a **1-sentence playful observation or personal mini-story** first.\n- Then ask an open **"How/What made you..."** question that invites feeling, not just facts!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Conversation Chemistry Map',
      title: 'Breaking Out of "Job Interview Mode" into Magnetic Banter',
      subtitle: 'The Statement-to-Question Rhythm that builds effortless chemistry',
      steps: [
        {
          badge: '1. CATCH KEYWORD',
          title: 'Active Listening Hook',
          detail: 'She says: "I just got back from a trip to Kyoto."',
          color: '#f472b6',
        },
        {
          badge: '2. PLAYFUL STATEMENT',
          title: 'React Before Asking',
          detail: '"No way—you strike me as someone who hunted down the best ramen alleys!"',
          color: '#ec4899',
        },
        {
          badge: '3. EMOTIONAL OPEN-END',
          title: 'Ask "What Was the Highlight?"',
          detail: '"What was your favorite moment from the whole trip?"',
          color: '#a855f7',
        },
      ],
      comparisons: [
        {
          label: 'Interview Mode vs. Magnetic Banter',
          badExample: '❌ "Cool. How long did you go? When did you get back? Where do you work?" (Fact interrogation)',
          goodExample:
            '✅ "Kyoto is on my bucket list! Did you go for the peaceful temples or the midnight food stalls?" (Fun & expressive)',
        },
      ],
      footerTakeaway:
        'Golden rule: Pair every question with a warm reaction or playful observation of your own!',
    },
    userQuestion2:
      'Oh! Adding a playful observation before asking an open-ended question changes the whole energy. Let me try the Banter Flow mini-game!',
    mentorReply2:
      'You’ve got it! 💖 Jump into the **Magnetic Banter & Active Listening Mini-Game** below (or in the Right Sidebar) to keep the conversation flowing and claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Conversation Game',
      title: 'Banter & Active Listening Flow Simulator',
      subtitle: 'Turn dry Q&A into warm, playful back-and-forth chemistry',
      steps: [
        {
          badge: 'TURN 1',
          title: 'Spot the Emotional Thread',
          detail: 'Notice what she lights up talking about.',
          color: '#ec4899',
        },
        {
          badge: 'TURN 2',
          title: 'Add Playful Callback',
          detail: 'Connect her answer to a fun observation or shared vibe.',
          color: '#f472b6',
        },
        {
          badge: 'TURN 3',
          title: 'High-Note Close',
          detail: 'Swap socials naturally while the conversation is peaking!',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Practice the conversation flow in the Right Sidebar or inline below!',
    },
  },

  'dating-coach::03-texting-and-first-date-blueprint': {
    userQuestion1:
      'We had a great chat and swapped Instagrams! How do I text her and invite her on a first date without being needy or too vague?',
    mentorReply1:
      'Keep your texting **warm, light, and purposeful**! 📱✨\n\n1. **The Callback Opener (Same evening or next day)**: Reference an inside joke or topic from your conversation (*"Hey Mia! Still thinking about your controversial hot take on iced matcha 😄 Hope your week is off to a great start!"*).\n2. **2–3 Fun Exchanges**: Chat briefly while the energy is high.\n3. **The Specific, Low-Pressure Date Invite**: Suggest a **clear activity + day** tied to what you both enjoy (*"Let’s continue the matcha debate—are you free Thursday or Friday afternoon to check out that café in Seongsu?"*).',
    materialType1: 'image_explanation',
    visualCard1: {
      badge: 'First Date Blueprint',
      title: 'Callback Text → Specific Casual Invite → 2-Stop First Date',
      subtitle: 'Why specific, low-pressure plans always beat "Wanna hang out sometime?"',
      steps: [
        {
          badge: '1. CALLBACK TEXT',
          title: 'Reference Shared Joke',
          detail: 'Re-spark the exact warm vibe from when you met in person.',
          color: '#ec4899',
        },
        {
          badge: '2. CLEAR INVITE',
          title: 'Activity + Day Option',
          detail: '"Let’s grab matcha at X this Friday afternoon—are you free?"',
          color: '#34d399',
        },
        {
          badge: '3. TWO-STOP FLOW',
          title: 'Cozy Café → Scenic Walk',
          detail: 'Side-by-side walking removes stiffness and makes talking easy!',
          color: '#a855f7',
        },
      ],
      footerTakeaway:
        'Specific plans show leadership and confidence while keeping the vibe relaxed!',
    },
    userQuestion2:
      'Suggesting a specific day and a casual activity related to what we talked about is so clean. Can I test my texting & date invite instincts?',
    mentorReply2:
      'Let’s test your instincts! 🌟 Play the **Texting Vibe & First Date Planner Game** below (or in the Right Sidebar) and earn **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Date Planner Game',
      title: 'Texting Chemistry & First Date Architect',
      subtitle: 'Craft the callback text, propose the date, and design a great 2-stop vibe',
      steps: [
        {
          badge: 'STEP 1',
          title: 'Send Callback Opener',
          detail: 'Warm, personal message referencing your first chat.',
          color: '#ec4899',
        },
        {
          badge: 'STEP 2',
          title: 'Pitch Specific Plan',
          detail: 'Clear activity + day without decision fatigue.',
          color: '#34d399',
        },
        {
          badge: 'STEP 3',
          title: '2-Stop Date Route',
          detail: 'Transition smoothly from coffee to an interactive walk.',
          color: '#a855f7',
        },
      ],
      footerTakeaway:
        'Try the interactive date planner inline or in the Right Sidebar!',
    },
  },

  'dating-coach::04-emotional-connection-and-confession': {
    userQuestion1:
      'We’ve been on three awesome dates and the chemistry feels mutual. How do I read her signals and transition naturally into an official relationship?',
    mentorReply1:
      'That’s the best stage! 💖 When someone genuinely likes you, you’ll notice **consistent green-light signals**: she makes time to see you, initiates texts/questions, remembers small details you mentioned, and leans into warm moments.\n\nWhen transitioning to an official relationship:\n- **Be sincere and direct** (no mind games!).\n- Express how much you enjoy your time together and that you’d love to date exclusively as partners, while respecting her pace and feelings.',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Relationship Progression',
      title: 'First Spark → Emotional Safety → Mutual Signals → Sincere Confession',
      subtitle: 'Building a healthy, lasting relationship on mutual warmth and trust',
      steps: [
        {
          badge: 'STAGE 1',
          title: 'Consistent Warmth',
          detail: 'Mutual effort, reliability, and shared laughter across dates.',
          color: '#f472b6',
        },
        {
          badge: 'STAGE 2',
          title: 'Emotional Depth',
          detail: 'Sharing values, stories, and making each other feel understood.',
          color: '#a855f7',
        },
        {
          badge: 'STAGE 3',
          title: 'Clear, Honest Expression',
          detail: '"I really love spending time with you—I’d love for us to be official."',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'True confidence is being warm, honest about your feelings, and respectful of boundaries!',
    },
    userQuestion2:
      'Give me the final Dating & Social Confidence Boss Quiz to test everything I’ve learned!',
    mentorReply2:
      'You’ve come so far! 🏆 Take on the **Dating & Relationship Confidence Boss Quiz** below (or in the Right Sidebar) to claim **+35 🍬 Candy**!',
    materialType2: 'small_test',
    visualCard2: {
      badge: 'Social Confidence Boss Quiz',
      title: 'First Impressions, Banter, Dates & Relationship Mastery',
      subtitle: 'Complete the final assessment to unlock +35 Candy',
      steps: [
        {
          badge: 'PART 1',
          title: 'Observational Openers',
          detail: 'Low-pressure, situational conversation starters.',
          color: '#ec4899',
        },
        {
          badge: 'PART 2',
          title: '70/30 Active Listening',
          detail: 'Balancing playful statements with open questions.',
          color: '#a855f7',
        },
        {
          badge: 'PART 3',
          title: 'Sincere Relationship Trust',
          detail: 'Clear communication and mutual respect.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Solve the Boss Quiz in the Right Sidebar or inline below!',
    },
  },

  // =========================================================================
  // 5. KOREA HISTORY — Ms. Han (korea-history)
  // =========================================================================
  'korea-history::01-three-kingdoms-goguryeo-baekje-silla': {
    userQuestion1:
      'Why did Baekje, Goguryeo, and Silla all fight so fiercely over the Han River basin from the 4th to the 6th century? Can you show me the geopolitical flow?',
    mentorReply1:
      'What a great historical question! 🏛️📜 In the **Three Kingdoms Period (삼국시대)**, the **Han River Basin (한강 유역)** was the ultimate geopolitical prize for three reasons:\n1. **Economic Heartland**: Rich alluvial plains at the center of the Korean Peninsula.\n2. **Strategic Wedge**: Controlling the center split the other two rival kingdoms apart.\n3. **Gateway to the Yellow Sea**: Direct maritime trade and diplomatic routes to China!\n\nWatch how whichever kingdom captured the Han River immediately reached its Golden Age (`4thC Baekje` → `5thC Goguryeo` → `6thC Silla`):',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Geopolitical Timeline Map',
      title: 'Three Kingdoms Power Shift Along the Han River (4thC–6thC)',
      subtitle:
        'How controlling the Han River Basin determined the peak of Baekje, Goguryeo, and Silla',
      steps: [
        {
          badge: '4TH CENTURY',
          title: 'Baekje (King Geunchogo)',
          detail: 'Holds Han River first; expands maritime trade across Yellow Sea & Japan.',
          color: '#38bdf8',
        },
        {
          badge: '5TH CENTURY',
          title: 'Goguryeo (Gwanggaeto & Jangsu)',
          detail: 'Moves capital to Pyongyang (427) & captures Han River; dominates Northeast Asia.',
          color: '#f59e0b',
        },
        {
          badge: '6TH CENTURY',
          title: 'Silla (King Jinheung)',
          detail: 'Seizes Han River (553), opens direct sea route to Tang, & unifies in 668–676.',
          color: '#34d399',
        },
      ],
      comparisons: [
        {
          label: 'How to Remember the 3-Century Order',
          goodExample:
            '4thC Baekje (Geunchogo) → 5thC Goguryeo (Gwanggaeto/Jangsu) → 6thC Silla (Jinheung)',
          note: 'Follow the Han River from West (Baekje) → North (Goguryeo) → Southeast (Silla)!',
        },
      ],
      footerTakeaway:
        'King Jinheung erected the Bukhansan Monument (북한산 순수비) to commemorate Silla seizing the Han River!',
    },
    userQuestion2:
      'Seeing how whoever held the Han River controlled both the heartland and direct sea routes makes the whole era click! Can I play the Three Kingdoms strategy simulation?',
    mentorReply2:
      'Let’s step into the command tent! ⚔️🏛️ Play the **Three Kingdoms Han River Strategy Mini-Game** below (and in your **Learning Materials** sidebar) to trace the 4th–6th century power shifts and claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive History Strategy Game',
      title: 'Chronicle of the Han River: Baekje · Goguryeo · Silla',
      subtitle: 'Match each century’s monarch, capital move, and strategic milestone',
      steps: [
        {
          badge: 'ERA 1 (300s)',
          title: 'Baekje Maritime Peak',
          detail: 'King Geunchogo builds sea trade network from Hanseong.',
          color: '#38bdf8',
        },
        {
          badge: 'ERA 2 (400s)',
          title: 'Goguryeo Southward Drive',
          detail: 'King Gwanggaeto & King Jangsu secure the Han River.',
          color: '#f59e0b',
        },
        {
          badge: 'ERA 3 (500s)',
          title: 'Silla’s Final Breakthrough',
          detail: 'King Jinheung captures the basin & sets the stage for unification.',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Play the strategy simulation inline below or in the Right Sidebar!',
    },
  },

  'korea-history::02-goryeo-celadon-and-tripitaka': {
    userQuestion1:
      'Is it true that the English name "Korea" comes from Goryeo, and that Goryeo invented movable metal type 78 years before Gutenberg?',
    mentorReply1:
      '100% true on both counts! 🏺📖 The **Goryeo Dynasty (고려, 918–1392)** was a cosmopolitan powerhouse of trade, art, and printing science:\n1. **Origin of "Korea"**: International merchants from Song China, Persia, and Arabia traded silk, ginseng, and celadon at the port of **Byeokrando (벽란도)**, spreading the name *"Goryeo" → "Corea / Korea"* across the world.\n2. **Tripitaka Koreana (팔만대장경)**: Over **81,258 carved birch woodblocks** with zero known typos, housed in Haeinsa’s natural ventilation halls.\n3. **Jikji (직지심체요절, 1377)**: Printed at Heungdeoksa Temple using **movable metal type**—**78 years before Gutenberg’s Bible**!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Cultural & Scientific Heritage',
      title: 'Goryeo’s Global Legacy: Byeokrando · Inlaid Celadon · 1377 Jikji',
      subtitle: 'How Goryeo connected Eurasia and pioneered movable metal printing',
      steps: [
        {
          badge: 'GLOBAL PORT',
          title: 'Byeokrando (벽란도)',
          detail: 'Arabian & Song merchants spread the name "Goryeo → Korea".',
          color: '#38bdf8',
        },
        {
          badge: 'WOODBLOCK ART',
          title: 'Tripitaka Koreana (81,258)',
          detail: 'UNESCO masterpiece preserved at Haeinsa Janggyeong Panjeon.',
          color: '#34d399',
        },
        {
          badge: 'METAL TYPE (1377)',
          title: 'Jikji (직지심체요절)',
          detail: 'World’s oldest extant movable metal type book (78 yrs pre-Gutenberg).',
          color: '#f59e0b',
        },
      ],
      footerTakeaway:
        'Goryeo artists also perfected Sanggam Cheongja (inlaid jade-green celadon pottery) admired across Asia!',
    },
    userQuestion2:
      '78 years before Gutenberg is incredible! Can I explore Goryeo’s inventions in an interactive heritage game?',
    mentorReply2:
      'Right this way! 🏺 Play the **Goryeo Printing & Maritime Trade Mini-Game** below (or in the Right Sidebar) to earn **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Heritage Game',
      title: 'Goryeo Master Artisans: Celadon, Woodblocks & Metal Type',
      subtitle: 'Inspect Byeokrando trade routes, Haeinsa woodblocks, and 1377 Jikji',
      steps: [
        {
          badge: 'ARTIFACT 1',
          title: 'Sanggam Celadon',
          detail: 'Inlay white and black clay cranes into jade glaze.',
          color: '#34d399',
        },
        {
          badge: 'ARTIFACT 2',
          title: 'Tripitaka Ventilation',
          detail: 'Preserve 81,258 woodblocks for 750+ years via natural airflow.',
          color: '#38bdf8',
        },
        {
          badge: 'ARTIFACT 3',
          title: 'Cast Bronze Type (1377)',
          detail: 'Assemble movable metal characters to print Jikji in Cheongju.',
          color: '#f59e0b',
        },
      ],
      footerTakeaway:
        'Launch the interactive heritage game inline or in the Right Sidebar!',
    },
  },

  'korea-history::03-king-sejong-and-hunminjeongeum': {
    userQuestion1:
      'How did King Sejong design the consonants and vowels of Hangul in 1443? I heard the letters literally mirror human speech organs!',
    mentorReply1:
      'Yes! Linguistic scholars around the world call **Hunminjeongeum (훈민정음, Hangul — 1443)** a "featural alphabet" because **King Sejong the Great** designed every letter from scientific principles so anyone could learn to read in a single afternoon! 👑✨\n\n- **5 Root Consonants (`ㄱ, ㄴ, ㅁ, ㅅ, ㅇ`)**: Visually trace the **physical cross-section of your mouth and speech organs** when pronouncing each sound!\n- **3 Root Vowels (`ㆍ, ㅡ, ㅣ`)**: Combine **Sky (`ㆍ`)**, **Earth (`ㅡ`)**, and **Human (`ㅣ`)**!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Phonetic Geometry Diagram',
      title: 'King Sejong’s Hunminjeongeum (1443): Vocal Organ Consonants & Cosmic Vowels',
      subtitle: 'Why Hangul is the world’s most scientific featural writing system',
      steps: [
        {
          badge: 'TONGUE SHAPES',
          title: 'ㄱ (g/k) & ㄴ (n)',
          detail: 'ㄱ = Tongue root blocking throat | ㄴ = Tongue tip touching upper gums.',
          color: '#a855f7',
        },
        {
          badge: 'LIPS · TEETH · THROAT',
          title: 'ㅁ (m) · ㅅ (s) · ㅇ (ng)',
          detail: 'ㅁ = Outline of lips | ㅅ = Shape of tooth | ㅇ = Round open throat.',
          color: '#f59e0b',
        },
        {
          badge: 'COSMIC VOWELS',
          title: 'ㆍ (Sky) · ㅡ (Earth) · ㅣ (Human)',
          detail: 'Combine these 3 strokes to form ㅏ, ㅓ, ㅗ, ㅜ, ㅐ, ㅔ!',
          color: '#ec4899',
        },
      ],
      comparisons: [
        {
          label: 'Featural Stroke Addition (Adding Aspiration)',
          goodExample:
            'ㄴ (n) + 1 stroke = ㄷ (d/t) + 1 stroke = ㅌ (aspirated tʰ) · ㄱ (g) → ㅋ (kʰ) · ㅁ (m) → ㅂ (b) → ㅍ (pʰ)',
          note: 'Related sounds share visual geometry—add a stroke as airflow increases!',
        },
      ],
      footerTakeaway:
        'Alongside Hangul, King Sejong & engineer Jang Yeong-sil created the Cheugugi rain gauge and Jagyeongnu self-striking water clock!',
    },
    userQuestion2:
      'The fact that "ㄱ" and "ㄴ" literally trace the shape of your tongue inside your mouth is genius! Let me try matching Hangul phonetic geometry in a mini-game!',
    mentorReply2:
      'King Sejong would be proud! 👑 Try the **Hunminjeongeum Vocal Organ Builder Game** below (or in the Right Sidebar) and claim **+30 🍬 Candy**!',
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Hangul Science Game',
      title: '1443 Hall of Worthies (Jiphyeonjeon) Phonetic Builder',
      subtitle: 'Match vocal organ cross-sections to ㄱ, ㄴ, ㅁ, ㅅ, ㅇ and build syllables',
      steps: [
        {
          badge: 'ROUND 1',
          title: 'Match Vocal Organs',
          detail: 'Connect Tongue Root (ㄱ), Tongue Tip (ㄴ), and Lips (ㅁ).',
          color: '#a855f7',
        },
        {
          badge: 'ROUND 2',
          title: 'Add Aspiration Strokes',
          detail: 'Transform ㄱ → ㅋ and ㄴ → ㄷ → ㅌ systematically.',
          color: '#f59e0b',
        },
        {
          badge: 'ROUND 3',
          title: 'Joseon Science Lab',
          detail: 'Inspect Jang Yeong-sil’s Honcheonui & Jagyeongnu water clock.',
          color: '#ec4899',
        },
      ],
      footerTakeaway:
        'Play the interactive Hangul builder inline or in the Right Sidebar!',
    },
  },

  'korea-history::04-admiral-yi-sun-sin-and-modern-korea': {
    userQuestion1:
      'How did Admiral Yi Sun-sin defeat 133 enemy warships with only 13 ships at the Battle of Myeongnyang, and how does his legacy connect to modern Korea?',
    mentorReply1:
      'It is one of the greatest naval victories in world history! 🐢⚓\n\n1. **Battle of Hansando (1592)**: Admiral Yi lured the fleet into open water and deployed the **Crane Wing Formation (학익진, Hagikjin)**, surrounding them in a U-shaped arc with heavy Panokseon and **Geobukseon (Turtle Ship)** cannon fire.\n2. **Miracle at Myeongnyang (1597)**: With only **13 Panokseon warships against 133**, Admiral Yi chose the narrow **Uldolmok Strait**, where roaring tidal currents reversed direction mid-battle—trapping the enemy fleet while his cannons dominated the chokepoint!',
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Naval & Modern History Map',
      title: 'Admiral Yi Sun-sin’s Tactical Genius → Modern Korea’s Global Rise',
      subtitle: 'From Hansando & Myeongnyang (13 vs. 133) to the Miracle on the Han River',
      steps: [
        {
          badge: 'HANSANDO (1592)',
          title: 'Crane Wing Formation (학익진)',
          detail: 'Feigned retreat into open water + U-shaped cannon encirclement.',
          color: '#38bdf8',
        },
        {
          badge: 'MYEONGNYANG (1597)',
          title: '13 Ships vs. 133 at Uldolmok',
          detail: 'Used narrow strait chokepoint and reversing whirlpool tides.',
          color: '#f59e0b',
        },
        {
          badge: 'MODERN ERA',
          title: 'Miracle on the Han River',
          detail: 'Rapid industrialization, democratization, & global K-Culture hub.',
          color: '#ec4899',
        },
      ],
      footerTakeaway:
        '"Those who seek death shall live, and those who seek life shall die." — Admiral Yi Sun-sin before Myeongnyang (1597)',
    },
    userQuestion2:
      'Test my mastery with the Korean History Boss Quiz!',
    mentorReply2:
      'Here is your grand finale challenge! 🏆 Complete the **5,000-Year Korean History Boss Quiz** below (or in the Right Sidebar) to claim **+35 🍬 Candy**!',
    materialType2: 'small_test',
    visualCard2: {
      badge: 'Korean History Boss Quiz',
      title: 'Three Kingdoms · Goryeo · Joseon · Modern Korea Mastery',
      subtitle: 'Complete the final historical synthesis challenge for +35 Candy',
      steps: [
        {
          badge: 'ERA 1–2',
          title: 'Three Kingdoms & Goryeo',
          detail: 'Han River geopolitics, Byeokrando trade, and 1377 Jikji.',
          color: '#38bdf8',
        },
        {
          badge: 'ERA 3',
          title: 'Joseon Renaissance & Defense',
          detail: '1443 Hunminjeongeum & Admiral Yi’s Crane Wing Formation.',
          color: '#f59e0b',
        },
        {
          badge: 'ERA 4',
          title: 'Modern Resilience',
          detail: 'Independence movement, economic miracle, and global culture.',
          color: '#ec4899',
        },
      ],
      footerTakeaway:
        'Take the Boss Quiz in the Right Sidebar or open it inline below!',
    },
  },
};

function buildFallbackScriptForChannel(
  mentor: MentorConfig,
  channel: DemoChannelSeedInput
): ChannelConversationScript {
  const nodes = channel.scene3d.nodes || [];
  const n0 = nodes[0]?.label || 'Primary Input Node';
  const n1 = nodes[1]?.label || 'Core Processing Layer';
  const n2 = nodes[2]?.label || 'Output State Node';

  return {
    userQuestion1:
      channel.starterPrompts[0] ||
      `Can you show me visually how ${n0} and ${n1} interact in #${channel.slug}?`,
    mentorReply1: `Great question! In **#${channel.slug}** (**${channel.title}**), the fastest way to build intuition is to trace how state flows across our 3 core nodes:\n\n1. **${n0}** initializes the primary input state.\n2. **${n1}** transforms and routes packets along the active connection.\n3. **${n2}** synthesizes the final output.\n\nCheck out the visual architecture breakdown below—and inspect the 3D model in your **Learning Materials** sidebar on the right!`,
    materialType1: '3d_preview',
    visualCard1: {
      badge: '3D Spatial Architecture Flow',
      title: `${channel.title} — Visual Node Pipeline`,
      subtitle: channel.summary,
      steps: [
        {
          badge: 'STAGE 1',
          title: n0,
          detail: nodes[0]?.tooltip || 'Initializes input state and parameters.',
          color: nodes[0]?.color || mentor.accentColor,
        },
        {
          badge: 'STAGE 2',
          title: n1,
          detail:
            nodes[1]?.tooltip ||
            'Processes transitions and routes active packets.',
          color: nodes[1]?.color || mentor.secondaryColor,
        },
        {
          badge: 'STAGE 3',
          title: n2,
          detail:
            nodes[2]?.tooltip || 'Delivers verified output state and metrics.',
          color: nodes[2]?.color || '#34d399',
        },
      ],
      footerTakeaway: `Rotate the 3D scene or launch the interactive preview in the Right Sidebar!`,
    },
    userQuestion2:
      channel.starterPrompts[1] ||
      `That visual breakdown is super clear! Can I test this hands-on with an interactive simulation or mini-game?`,
    mentorReply2: `Absolutely! 🎮 I generated an interactive **Hands-On Practice Simulation** for **#${channel.slug}** right below (and added it to your **Learning Materials** sidebar). Complete the interactive steps to claim **+30 🍬 Candy**!`,
    materialType2: 'mini_game',
    visualCard2: {
      badge: 'Interactive Practice Simulation',
      title: `${mentor.shortTag} Hands-On Challenge`,
      subtitle: `Test your intuition on ${n0} → ${n1} → ${n2}`,
      steps: [
        {
          badge: 'STEP 1',
          title: `Inspect ${n0}`,
          detail: 'Verify initial state and input parameters.',
          color: mentor.accentColor,
        },
        {
          badge: 'STEP 2',
          title: `Route via ${n1}`,
          detail: 'Observe live state transitions under load.',
          color: mentor.secondaryColor,
        },
        {
          badge: 'STEP 3',
          title: 'Claim Candy Reward',
          detail: 'Complete the challenge to earn +30 🍬 Candy!',
          color: '#34d399',
        },
      ],
      footerTakeaway:
        'Click "Play Live Inline" below or interact directly in the Right Sidebar!',
    },
  };
}

/**
 * Builds a rich, realistic 5-message pre-populated conversation for any mentor & curriculum channel:
 *  1. Mentor Proactive Greeting
 *  2. Simulated User Question #1
 *  3. Mentor Visualization Response #1 (with inline VisualCardSpec + 3D/Visual LearningMaterial)
 *  4. Simulated User Follow-up #2
 *  5. Mentor Visualization Response #2 (with inline VisualCardSpec + Mini-Game/Quiz LearningMaterial)
 */
export function buildPreseededDemoMessages(
  mentor: MentorConfig,
  channel: DemoChannelSeedInput,
  studentLevel: StudentLevel
): ChatMessage[] {
  const effectiveLevel: StudentLevel =
    studentLevel === 'unassessed' ? 'intermediate' : studentLevel;

  const key = `${mentor.id}::${channel.slug}`;
  const script =
    DEMO_CHANNEL_SCRIPTS[key] || buildFallbackScriptForChannel(mentor, channel);

  const material1 = buildAdaptiveLearningMaterial({
    mentorId: mentor.id,
    mentorName: mentor.name,
    roleTitle: mentor.roleTitle,
    subject: mentor.subject,
    accentColor: mentor.accentColor,
    userMessage: script.userQuestion1,
    assessedLevel: effectiveLevel,
    materialType: script.materialType1,
    learningStepTitle: script.visualCard1.title,
    scene3d: channel.scene3d,
    quiz: channel.quiz,
  });

  const material2 = buildAdaptiveLearningMaterial({
    mentorId: mentor.id,
    mentorName: mentor.name,
    roleTitle: mentor.roleTitle,
    subject: mentor.subject,
    accentColor: mentor.accentColor,
    userMessage: script.userQuestion2,
    assessedLevel: effectiveLevel,
    materialType: script.materialType2,
    learningStepTitle: script.visualCard2.title,
    scene3d: channel.scene3d,
    quiz: channel.quiz,
  });

  return [
    {
      id: `proactive-${channel.id}`,
      role: 'mentor',
      text: channel.proactiveGreeting,
      timestamp: '10:12 AM',
      avatarState: 'talking',
      assessedLevel: effectiveLevel,
      scene3d: channel.scene3d,
      proactiveBadge: `Proactive Welcome · #${channel.slug}`,
      modelUsed: 'gemini-4-argon',
    },
    {
      id: `demo-user-1-${channel.id}`,
      role: 'user',
      text: script.userQuestion1,
      timestamp: '10:13 AM',
    },
    {
      id: `demo-mentor-vis-1-${channel.id}`,
      role: 'mentor',
      text: script.mentorReply1,
      timestamp: '10:13 AM',
      avatarState: 'talking',
      assessedLevel: effectiveLevel,
      recommendedMaterialType: script.materialType1,
      learningMaterial: material1,
      visualCard: script.visualCard1,
      scene3d: channel.scene3d,
      quiz: channel.quiz,
      candyEarned: 15,
      proactiveBadge: `📊 Visual Breakdown · ${script.visualCard1.badge}`,
      modelUsed: 'gemini-4-argon',
    },
    {
      id: `demo-user-2-${channel.id}`,
      role: 'user',
      text: script.userQuestion2,
      timestamp: '10:14 AM',
    },
    {
      id: `demo-mentor-vis-2-${channel.id}`,
      role: 'mentor',
      text: script.mentorReply2,
      timestamp: '10:15 AM',
      avatarState: 'happy',
      assessedLevel: effectiveLevel,
      recommendedMaterialType: script.materialType2,
      learningMaterial: material2,
      visualCard: script.visualCard2,
      scene3d: channel.scene3d,
      quiz: channel.quiz,
      candyEarned: 20,
      proactiveBadge: `🎮 Interactive Lab · ${script.visualCard2.badge}`,
      suggestedFollowUps: channel.starterPrompts,
      modelUsed: 'gemini-4-argon',
    },
  ];
}

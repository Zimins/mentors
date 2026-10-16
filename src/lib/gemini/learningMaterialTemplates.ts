import type {
  LearningMaterialProposal,
  LearningMaterialType,
  MentorRequestMode,
  QuizQuestion,
  Scene3DSpec,
  StudentLevel,
} from '@/types/mentor';

export interface BuildMaterialInput {
  mentorId: string;
  mentorName: string;
  roleTitle: string;
  subject: string;
  accentColor?: string;
  userMessage: string;
  assessedLevel: StudentLevel;
  materialType: LearningMaterialType;
  learningStepTitle: string;
  scene3d: Scene3DSpec;
  quiz: QuizQuestion;
  rawModelMaterial?: Partial<LearningMaterialProposal> | null;
}

export const MATERIAL_TYPE_META: Record<
  LearningMaterialType,
  {
    label: string;
    shortLabel: string;
    koreanHint: string;
    badgeColor: string;
    defaultCandy: number;
  }
> = {
  '3d_preview': {
    label: '3D Spatial Preview',
    shortLabel: '3D Preview',
    koreanHint: '입체 3D 구조 프리뷰',
    badgeColor: '#38bdf8',
    defaultCandy: 20,
  },
  mini_game: {
    label: 'Interactive Mini Game',
    shortLabel: 'Mini Game',
    koreanHint: '직접 조작하는 미니게임',
    badgeColor: '#34d399',
    defaultCandy: 30,
  },
  small_test: {
    label: 'Adaptive Small Test',
    shortLabel: 'Small Test',
    koreanHint: '수준별 미니 테스트',
    badgeColor: '#fbbf24',
    defaultCandy: 25,
  },
  image_explanation: {
    label: 'Visual Image Explanation',
    shortLabel: 'Image Explanation',
    koreanHint: '인터랙티브 도식/이미지 해설',
    badgeColor: '#c084fc',
    defaultCandy: 15,
  },
};

/**
 * Autonomously selects which of the 4 learning material types best fits the
 * student's prompt, current diagnosed mastery level, and request mode.
 */
export function selectOptimalMaterialType(
  userMessage: string,
  assessedLevel: StudentLevel,
  mode: MentorRequestMode = 'chat',
  turnIndex = 0
): LearningMaterialType {
  if (mode === 'generate_3d') return '3d_preview';
  if (mode === 'generate_mini_game') return 'mini_game';
  if (mode === 'generate_small_test' || mode === 'generate_quiz') {
    return 'small_test';
  }
  if (mode === 'generate_image_explanation') return 'image_explanation';

  const lower = userMessage.toLowerCase();

  // Explicit intent detection in English or Korean
  if (
    lower.includes('mini game') ||
    lower.includes('minigame') ||
    lower.includes('game') ||
    lower.includes('play') ||
    lower.includes('simulat') ||
    lower.includes('hands-on') ||
    lower.includes('게임') ||
    lower.includes('시뮬레이션')
  ) {
    return 'mini_game';
  }

  if (
    lower.includes('small test') ||
    lower.includes('quiz') ||
    lower.includes('test me') ||
    lower.includes('challenge me') ||
    lower.includes('check my') ||
    lower.includes('퀴즈') ||
    lower.includes('테스트') ||
    lower.includes('문제')
  ) {
    return 'small_test';
  }

  if (
    lower.includes('image') ||
    lower.includes('diagram') ||
    lower.includes('infographic') ||
    lower.includes('analogy') ||
    lower.includes('visual') ||
    lower.includes('step-by-step') ||
    lower.includes('new to') ||
    lower.includes('first principles') ||
    lower.includes('이미지') ||
    lower.includes('그림') ||
    lower.includes('도식') ||
    lower.includes('비유')
  ) {
    return 'image_explanation';
  }

  if (
    lower.includes('3d') ||
    lower.includes('spatial') ||
    lower.includes('orbit') ||
    lower.includes('topology') ||
    lower.includes('architecture')
  ) {
    return '3d_preview';
  }

  // Autonomous pedagogical selection based on diagnosed student level
  const effectiveLevel: StudentLevel =
    assessedLevel === 'unassessed' ? 'intermediate' : assessedLevel;

  if (effectiveLevel === 'beginner') {
    const beginnerRotation: LearningMaterialType[] = [
      'image_explanation',
      'mini_game',
      '3d_preview',
      'small_test',
    ];
    return beginnerRotation[turnIndex % beginnerRotation.length];
  }

  if (effectiveLevel === 'advanced') {
    const advancedRotation: LearningMaterialType[] = [
      '3d_preview',
      'small_test',
      'mini_game',
      'image_explanation',
    ];
    return advancedRotation[turnIndex % advancedRotation.length];
  }

  const intermediateRotation: LearningMaterialType[] = [
    'mini_game',
    'image_explanation',
    '3d_preview',
    'small_test',
  ];
  return intermediateRotation[turnIndex % intermediateRotation.length];
}

export function getPedagogicalReasonForMaterial(
  type: LearningMaterialType,
  level: StudentLevel,
  mentorName: string,
  topic: string
): string {
  const cleanLevel = level === 'unassessed' ? 'intermediate' : level;
  const levelLabel =
    cleanLevel.charAt(0).toUpperCase() + cleanLevel.slice(1);

  switch (type) {
    case 'image_explanation':
      return `${mentorName} selected an Interactive Image & Diagram Explanation tailored for your ${levelLabel} level so you can visually trace each stage of "${topic}" before diving into dense equations.`;
    case 'mini_game':
      return `${mentorName} built a hands-on JS/HTML Mini Game calibrated to your ${levelLabel} level—actively manipulating "${topic}" variables builds muscle memory 3x faster than passive reading.`;
    case 'small_test':
      return `${mentorName} proposed a ${levelLabel}-level Adaptive Small Test to verify your mental model of "${topic}" and spot any hidden misconceptions right in the chat.`;
    case '3d_preview':
    default:
      return `${mentorName} synthesized an interactive 3D Spatial Preview for your ${levelLabel} level so you can rotate, stress-test, and inspect how "${topic}" nodes interact in 3D space.`;
  }
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds an interactive HTML/JS Mini Game preview tailored to the topic & student level.
 */
function buildMiniGameHtml(input: BuildMaterialInput): string {
  const level =
    input.assessedLevel === 'unassessed' ? 'intermediate' : input.assessedLevel;
  const accent = input.accentColor || '#38bdf8';
  const nodes = (input.scene3d?.nodes || []).slice(0, 4);
  const nodeData =
    nodes.length >= 3
      ? nodes.map((n, i) => ({
          id: n.id,
          label: n.label || `Stage ${i + 1}`,
          role:
            n.tooltip ||
            (i === 0
              ? 'Primary Entry & Dispatch Layer'
              : i === 1
              ? 'Fast Memory / Intermediate Processing Node'
              : 'Final Target & Validation Output State'),
          color: n.color || accent,
        }))
      : [
          {
            id: 'n1',
            label: '1. Input & Address Dispatch',
            role: 'Receives incoming request/signal and validates initial invariants',
            color: '#38bdf8',
          },
          {
            id: 'n2',
            label: '2. Core State Transform',
            role: 'Executes the primary structural transition or algorithm step',
            color: '#34d399',
          },
          {
            id: 'n3',
            label: '3. Target Output Commit',
            role: 'Commits verified state and emits output packet without bottleneck',
            color: '#a855f7',
          },
        ];

  const targetScore = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
  const candyReward = MATERIAL_TYPE_META.mini_game.defaultCandy;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #070b14; color: #f1f5f9; padding: 14px; user-select: none; overflow-x: hidden; }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 999px; background: rgba(52,211,153,0.16); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.35); }
  .score-pill { font-size: 11px; font-weight: 800; color: #fde68a; background: rgba(251,191,36,0.14); border: 1px solid rgba(251,191,36,0.35); padding: 3px 10px; border-radius: 999px; }
  .title { font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
  .subtitle { font-size: 11px; color: #94a3b8; margin-bottom: 10px; line-height: 1.4; }
  .arena { position: relative; background: radial-gradient(circle at 50% 35%, rgba(56,189,248,0.14), rgba(15,23,42,0.92)); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; min-height: 185px; display: flex; flex-direction: column; justify-content: space-between; }
  .mission-box { background: rgba(2,6,23,0.85); border: 1px solid rgba(56,189,248,0.3); border-radius: 10px; padding: 9px 11px; margin-bottom: 10px; }
  .mission-label { font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-bottom: 3px; }
  .mission-text { font-size: 12px; font-weight: 700; color: #f8fafc; }
  .nodes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 10px; }
  .node-btn { background: rgba(30,41,59,0.75); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 11px; padding: 9px; text-align: left; cursor: pointer; transition: all 0.16s ease; position: relative; overflow: hidden; }
  .node-btn:hover { transform: translateY(-2px); border-color: ${accent}; background: rgba(30,41,59,0.95); }
  .node-btn.correct { border-color: #34d399; background: rgba(16,185,129,0.22); box-shadow: 0 0 18px rgba(52,211,153,0.25); }
  .node-btn.wrong { border-color: #fb7185; background: rgba(244,63,94,0.2); }
  .node-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
  .node-name { font-size: 11px; font-weight: 800; color: #fff; display: flex; align-items: center; margin-bottom: 3px; }
  .node-desc { font-size: 10px; color: #cbd5e1; line-height: 1.3; }
  .controls-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.07); }
  .status-msg { font-size: 11px; font-weight: 700; color: #38bdf8; }
  .btn { background: linear-gradient(90deg, #10b981, #0ea5e9); color: #020617; font-weight: 800; font-size: 11px; border: none; border-radius: 9px; padding: 6px 12px; cursor: pointer; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.92; }
  .progress-track { width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
  .progress-bar { height: 100%; background: linear-gradient(90deg, #34d399, #38bdf8); width: 0%; transition: width 0.25s ease; }
</style>
</head>
<body>
  <div class="header">
    <span class="badge">🎮 ${escapeHtml(level.toUpperCase())} MINI GAME · ${escapeHtml(input.mentorName)}</span>
    <span class="score-pill" id="scoreDisplay">Score: 0 / ${targetScore} (+${candyReward} 🍬)</span>
  </div>
  <div class="title">${escapeHtml(input.learningStepTitle)} — Packet &amp; State Router</div>
  <div class="subtitle">Route each live system operation to the correct architectural node below to stabilize the pipeline!</div>
  <div class="progress-track"><div class="progress-bar" id="progBar"></div></div>
  <div class="arena">
    <div class="mission-box">
      <div class="mission-label" id="roundLabel">ACTIVE MISSION ROUND 1 OF ${targetScore}</div>
      <div class="mission-text" id="missionPrompt">Loading mission...</div>
    </div>
    <div class="nodes-grid" id="nodesGrid"></div>
    <div class="controls-row">
      <div class="status-msg" id="statusMsg">👆 Click the node that handles the active mission above!</div>
      <button class="btn" id="actionBtn" onclick="resetGame()">Restart Game</button>
    </div>
  </div>
<script>
  const nodes = ${JSON.stringify(nodeData)};
  const targetScore = ${targetScore};
  let score = 0;
  let currentTargetIdx = 0;
  let completed = false;

  const missionClues = nodes.map((n, idx) => ({
    targetIdx: idx,
    clue: "Dispatch packet to the node responsible for: \\"" + n.role + "\\""
  }));

  function pickNextMission() {
    currentTargetIdx = score % nodes.length;
    const roundNum = Math.min(score + 1, targetScore);
    document.getElementById('roundLabel').textContent = completed
      ? '🏆 ALL MISSIONS COMPLETED!'
      : 'ACTIVE MISSION ROUND ' + roundNum + ' OF ' + targetScore;
    document.getElementById('missionPrompt').textContent = completed
      ? 'Pipeline 100% stabilized! You mastered how each node interacts in real time.'
      : missionClues[currentTargetIdx].clue;
  }

  function renderNodes() {
    const grid = document.getElementById('nodesGrid');
    grid.innerHTML = '';
    nodes.forEach((n, idx) => {
      const btn = document.createElement('button');
      btn.className = 'node-btn';
      btn.innerHTML =
        '<div class="node-name"><span class="node-dot" style="background:' + n.color + '"></span>' + n.label + '</div>' +
        '<div class="node-desc">' + n.role + '</div>';
      btn.onclick = () => handleSelectNode(idx, btn);
      grid.appendChild(btn);
    });
  }

  function handleSelectNode(idx, btnEl) {
    if (completed) return;
    if (idx === currentTargetIdx) {
      score += 1;
      btnEl.classList.add('correct');
      const pct = Math.min(100, Math.round((score / targetScore) * 100));
      document.getElementById('progBar').style.width = pct + '%';
      document.getElementById('scoreDisplay').textContent = 'Score: ' + score + ' / ' + targetScore + ' (+${candyReward} 🍬)';
      document.getElementById('statusMsg').style.color = '#34d399';
      document.getElementById('statusMsg').textContent = '✅ Direct Hit! Node [' + nodes[idx].label + '] processed the state transition!';
      setTimeout(() => {
        btnEl.classList.remove('correct');
        if (score >= targetScore) {
          completed = true;
          pickNextMission();
          document.getElementById('statusMsg').textContent = '🎉 Victory! +${candyReward} Candy awarded to your profile!';
          window.parent.postMessage({
            type: 'MENTOR_MINI_PREVIEW_REWARD',
            materialType: 'mini_game',
            candy: ${candyReward},
            title: ${JSON.stringify(input.learningStepTitle)}
          }, '*');
        } else {
          pickNextMission();
        }
      }, 420);
    } else {
      btnEl.classList.add('wrong');
      document.getElementById('statusMsg').style.color = '#fb7185';
      document.getElementById('statusMsg').textContent = '⚠️ Bottleneck! Check the role description and try the matching node.';
      setTimeout(() => btnEl.classList.remove('wrong'), 450);
    }
  }

  function resetGame() {
    score = 0;
    completed = false;
    document.getElementById('progBar').style.width = '0%';
    document.getElementById('scoreDisplay').textContent = 'Score: 0 / ' + targetScore + ' (+${candyReward} 🍬)';
    document.getElementById('statusMsg').style.color = '#38bdf8';
    document.getElementById('statusMsg').textContent = '👆 Click the node that handles the active mission above!';
    renderNodes();
    pickNextMission();
  }

  renderNodes();
  pickNextMission();
</script>
</body>
</html>`;
}

/**
 * Builds an interactive Visual Image & Annotated SVG Diagram Explanation widget.
 */
function buildImageExplanationHtml(input: BuildMaterialInput): string {
  const level =
    input.assessedLevel === 'unassessed' ? 'intermediate' : input.assessedLevel;
  const nodes = (input.scene3d?.nodes || []).slice(0, 3);
  const n0 = nodes[0]?.label || 'Stage 1: Input & Encoding';
  const n1 = nodes[1]?.label || 'Stage 2: Core Transformation';
  const n2 = nodes[2]?.label || 'Stage 3: Output & Verification';

  const t0 =
    nodes[0]?.tooltip ||
    'Initial state enters the system and establishes reference coordinates.';
  const t1 =
    nodes[1]?.tooltip ||
    'Core processing mechanism transforms state according to system invariants.';
  const t2 =
    nodes[2]?.tooltip ||
    'Final verified state is emitted downstream with predictable complexity.';

  const candyReward = MATERIAL_TYPE_META.image_explanation.defaultCandy;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #070b14; color: #f1f5f9; padding: 14px; overflow-x: hidden; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .badge { font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: rgba(192,132,252,0.16); color: #e9d5ff; border: 1px solid rgba(192,132,252,0.38); }
  .step-tabs { display: flex; gap: 6px; margin-bottom: 10px; }
  .tab { flex: 1; padding: 6px 8px; border-radius: 9px; background: rgba(30,41,59,0.65); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.15s; }
  .tab.active { background: rgba(192,132,252,0.22); color: #fff; border-color: #c084fc; box-shadow: 0 0 14px rgba(192,132,252,0.22); }
  .canvas-card { background: radial-gradient(circle at 50% 40%, rgba(168,85,247,0.14), rgba(15,23,42,0.94)); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 10px; margin-bottom: 10px; }
  svg { width: 100%; height: 135px; display: block; }
  .pulse-line { stroke-dasharray: 6 6; animation: dash 1.4s linear infinite; }
  @keyframes dash { to { stroke-dashoffset: -12; } }
  .callout { background: rgba(2,6,23,0.85); border-left: 3px solid #c084fc; border-radius: 8px; padding: 9px 11px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .callout-title { font-size: 12px; font-weight: 800; color: #f8fafc; margin-bottom: 2px; }
  .callout-desc { font-size: 11px; color: #cbd5e1; line-height: 1.4; }
  .claim-btn { shrink: 0; white-space: nowrap; background: linear-gradient(90deg, #a855f7, #38bdf8); color: #020617; border: none; border-radius: 8px; padding: 6px 10px; font-size: 10px; font-weight: 800; cursor: pointer; }
</style>
</head>
<body>
  <div class="top">
    <span class="badge">🖼️ INTERACTIVE VISUAL DIAGRAM · ${escapeHtml(level.toUpperCase())} LEVEL</span>
    <span style="font-size:11px;color:#cbd5e1;font-weight:700;">Click any diagram node or step</span>
  </div>
  <div class="step-tabs">
    <button class="tab active" id="tab0" onclick="selectStep(0)">1. ${escapeHtml(n0.slice(0, 18))}</button>
    <button class="tab" id="tab1" onclick="selectStep(1)">2. ${escapeHtml(n1.slice(0, 18))}</button>
    <button class="tab" id="tab2" onclick="selectStep(2)">3. ${escapeHtml(n2.slice(0, 18))}</button>
  </div>
  <div class="canvas-card">
    <svg viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#c084fc" />
          <stop offset="100%" stop-color="#34d399" />
        </linearGradient>
      </defs>
      <!-- Directed Flow Lines -->
      <line x1="145" y1="75" x2="245" y2="75" stroke="url(#gradLine)" stroke-width="3" class="pulse-line" />
      <line x1="355" y1="75" x2="455" y2="75" stroke="url(#gradLine)" stroke-width="3" class="pulse-line" />
      <polygon points="243,70 253,75 243,80" fill="#c084fc" />
      <polygon points="453,70 463,75 453,80" fill="#34d399" />

      <!-- Node 0 -->
      <g onclick="selectStep(0)" style="cursor:pointer">
        <rect id="box0" x="20" y="36" width="125" height="78" rx="14" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="2.5" />
        <text x="82" y="66" fill="#38bdf8" font-size="10" font-weight="800" text-anchor="middle">STEP 01</text>
        <text x="82" y="85" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">${escapeHtml(n0.slice(0, 16))}</text>
        <text x="82" y="102" fill="#94a3b8" font-size="9" text-anchor="middle">Click to inspect</text>
      </g>

      <!-- Node 1 -->
      <g onclick="selectStep(1)" style="cursor:pointer">
        <rect id="box1" x="238" y="36" width="125" height="78" rx="14" fill="rgba(192,132,252,0.12)" stroke="#64748b" stroke-width="1.5" />
        <text x="300" y="66" fill="#c084fc" font-size="10" font-weight="800" text-anchor="middle">STEP 02</text>
        <text x="300" y="85" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">${escapeHtml(n1.slice(0, 16))}</text>
        <text x="300" y="102" fill="#94a3b8" font-size="9" text-anchor="middle">Core Mechanism</text>
      </g>

      <!-- Node 2 -->
      <g onclick="selectStep(2)" style="cursor:pointer">
        <rect id="box2" x="455" y="36" width="125" height="78" rx="14" fill="rgba(52,211,153,0.12)" stroke="#64748b" stroke-width="1.5" />
        <text x="517" y="66" fill="#34d399" font-size="10" font-weight="800" text-anchor="middle">STEP 03</text>
        <text x="517" y="85" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">${escapeHtml(n2.slice(0, 16))}</text>
        <text x="517" y="102" fill="#94a3b8" font-size="9" text-anchor="middle">Verified State</text>
      </g>
    </svg>
  </div>
  <div class="callout">
    <div>
      <div class="callout-title" id="stepTitle">1. ${escapeHtml(n0)}</div>
      <div class="callout-desc" id="stepDesc">${escapeHtml(t0)}</div>
    </div>
    <button class="claim-btn" id="claimBtn" onclick="claimDiagramReward()">Got It! (+${candyReward} 🍬)</button>
  </div>
<script>
  const steps = [
    { title: '1. ' + ${JSON.stringify(n0)}, desc: ${JSON.stringify(t0)}, color: '#38bdf8' },
    { title: '2. ' + ${JSON.stringify(n1)}, desc: ${JSON.stringify(t1)}, color: '#c084fc' },
    { title: '3. ' + ${JSON.stringify(n2)}, desc: ${JSON.stringify(t2)}, color: '#34d399' }
  ];
  let rewarded = false;

  function selectStep(idx) {
    [0, 1, 2].forEach((i) => {
      document.getElementById('tab' + i).className = i === idx ? 'tab active' : 'tab';
      const box = document.getElementById('box' + i);
      box.setAttribute('stroke', i === idx ? steps[i].color : '#64748b');
      box.setAttribute('stroke-width', i === idx ? '2.5' : '1.5');
    });
    document.getElementById('stepTitle').textContent = steps[idx].title;
    document.getElementById('stepDesc').textContent = steps[idx].desc;
  }

  function claimDiagramReward() {
    if (rewarded) return;
    rewarded = true;
    const btn = document.getElementById('claimBtn');
    btn.textContent = '✅ +${candyReward} 🍬 Claimed!';
    btn.style.background = '#34d399';
    window.parent.postMessage({
      type: 'MENTOR_MINI_PREVIEW_REWARD',
      materialType: 'image_explanation',
      candy: ${candyReward},
      title: ${JSON.stringify(input.learningStepTitle)}
    }, '*');
  }
</script>
</body>
</html>`;
}

/**
 * Builds an interactive Small Test HTML/JS widget right inside the chat message bubble.
 */
function buildSmallTestHtml(input: BuildMaterialInput): string {
  const level =
    input.assessedLevel === 'unassessed' ? 'intermediate' : input.assessedLevel;
  const q = input.quiz;
  const primaryNode = input.scene3d?.nodes?.[0]?.label || 'Primary Root Node';
  const secondaryNode =
    input.scene3d?.nodes?.[1]?.label || 'Connected Target Node';
  const candyReward = q.candyReward || MATERIAL_TYPE_META.small_test.defaultCandy;

  const questions = [
    {
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    },
    {
      question: `In ${input.mentorName}'s breakdown of "${input.learningStepTitle}", how does [${primaryNode}] interact with [${secondaryNode}]?`,
      options: [
        `[${primaryNode}] transfers directed state/packets to [${secondaryNode}] while maintaining system invariants`,
        `[${primaryNode}] and [${secondaryNode}] are completely isolated with zero communication`,
        `[${secondaryNode}] deletes [${primaryNode}] before initialization`,
        `They bypass all memory and physical constraints`,
      ],
      correctIndex: 0,
      explanation: `In the spatial model, [${primaryNode}] connects directly to [${secondaryNode}] via animated state/packet transitions.`,
    },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #070b14; color: #f1f5f9; padding: 14px; overflow-x: hidden; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .badge { font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: rgba(251,191,36,0.16); color: #fde68a; border: 1px solid rgba(251,191,36,0.4); }
  .q-counter { font-size: 11px; font-weight: 800; color: #38bdf8; }
  .q-text { font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 10px; line-height: 1.4; }
  .opts { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .opt-btn { text-align: left; padding: 8px 11px; border-radius: 10px; background: rgba(30,41,59,0.75); border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; line-height: 1.35; }
  .opt-btn:hover { border-color: #fbbf24; background: rgba(30,41,59,0.95); }
  .opt-btn.correct { border-color: #34d399; background: rgba(16,185,129,0.22); color: #ecfdf5; }
  .opt-btn.wrong { border-color: #fb7185; background: rgba(244,63,94,0.2); color: #ffe4e6; }
  .footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 30px; }
  .feedback { font-size: 11px; color: #cbd5e1; line-height: 1.35; flex: 1; }
  .next-btn { background: #fbbf24; color: #020617; border: none; border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 800; cursor: pointer; display: none; }
</style>
</head>
<body>
  <div class="header">
    <span class="badge">📝 SMALL TEST · ${escapeHtml(level.toUpperCase())} LEVEL</span>
    <span class="q-counter" id="qCounter">Question 1 / 2 · +${candyReward} 🍬</span>
  </div>
  <div class="q-text" id="qText"></div>
  <div class="opts" id="optsBox"></div>
  <div class="footer">
    <div class="feedback" id="feedbackText">Select the best answer above to verify your understanding!</div>
    <button class="next-btn" id="nextBtn" onclick="nextQuestion()">Next Question →</button>
  </div>
<script>
  const questions = ${JSON.stringify(questions)};
  let qIdx = 0;
  let answered = false;
  let completed = false;

  function renderQuestion() {
    answered = false;
    const item = questions[qIdx];
    document.getElementById('qCounter').textContent = 'Question ' + (qIdx + 1) + ' / ' + questions.length + ' · +${candyReward} 🍬';
    document.getElementById('qText').textContent = item.question;
    document.getElementById('feedbackText').textContent = 'Select the best answer above to verify your understanding!';
    document.getElementById('feedbackText').style.color = '#94a3b8';
    document.getElementById('nextBtn').style.display = 'none';

    const box = document.getElementById('optsBox');
    box.innerHTML = '';
    item.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = String.fromCharCode(65 + idx) + '. ' + opt;
      btn.onclick = () => selectAnswer(idx, btn);
      box.appendChild(btn);
    });
  }

  function selectAnswer(idx, btn) {
    if (answered) return;
    const item = questions[qIdx];
    if (idx === item.correctIndex) {
      answered = true;
      btn.classList.add('correct');
      document.getElementById('feedbackText').style.color = '#6ee7b7';
      document.getElementById('feedbackText').textContent = '✅ Correct! ' + item.explanation;
      const nextBtn = document.getElementById('nextBtn');
      nextBtn.style.display = 'inline-block';
      nextBtn.textContent = qIdx < questions.length - 1 ? 'Next Question →' : 'Claim +${candyReward} 🍬';
    } else {
      btn.classList.add('wrong');
      document.getElementById('feedbackText').style.color = '#fda4af';
      document.getElementById('feedbackText').textContent = '💡 Not quite—re-read how the primary layer transitions state and try another option!';
    }
  }

  function nextQuestion() {
    if (qIdx < questions.length - 1) {
      qIdx += 1;
      renderQuestion();
    } else if (!completed) {
      completed = true;
      document.getElementById('nextBtn').textContent = '🏆 +${candyReward} 🍬 Earned!';
      document.getElementById('nextBtn').style.background = '#34d399';
      window.parent.postMessage({
        type: 'MENTOR_MINI_PREVIEW_REWARD',
        materialType: 'small_test',
        candy: ${candyReward},
        title: ${JSON.stringify(input.learningStepTitle)}
      }, '*');
    }
  }

  renderQuestion();
</script>
</body>
</html>`;
}

/**
 * Builds an interactive 3D Spatial Canvas Mini-Preview right inside the chat message bubble.
 */
function build3DPreviewHtml(input: BuildMaterialInput): string {
  const level =
    input.assessedLevel === 'unassessed' ? 'intermediate' : input.assessedLevel;
  const nodes = (input.scene3d?.nodes || []).map((n, idx) => ({
    id: n.id,
    label: n.label || `Node ${idx + 1}`,
    position: n.position || [Math.cos(idx) * 2, Math.sin(idx) * 1.2, 0],
    color: n.color || '#38bdf8',
    tooltip: n.tooltip || n.label || 'Interactive 3D Node',
  }));
  const connections = input.scene3d?.connections || [];
  const candyReward = MATERIAL_TYPE_META['3d_preview'].defaultCandy;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #060913; color: #f8fafc; padding: 12px; overflow: hidden; user-select: none; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .badge { font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: rgba(56,189,248,0.16); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.38); }
  .controls { display: flex; align-items: center; gap: 6px; }
  .ctrl-btn { background: rgba(30,41,59,0.85); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.14); border-radius: 7px; padding: 4px 8px; font-size: 10px; font-weight: 700; cursor: pointer; }
  .ctrl-btn:hover { border-color: #38bdf8; color: #fff; }
  .stage { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgba(56,189,248,0.25); background: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%); }
  canvas { width: 100%; height: 175px; display: block; cursor: grab; }
  canvas:active { cursor: grabbing; }
  .inspector { margin-top: 8px; padding: 7px 10px; border-radius: 9px; background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; }
</style>
</head>
<body>
  <div class="top">
    <span class="badge">🧊 3D SPATIAL MINI PREVIEW · ${escapeHtml(level.toUpperCase())}</span>
    <div class="controls">
      <button class="ctrl-btn" onclick="toggleSpeed()">⚡ Packet Speed</button>
      <button class="ctrl-btn" id="rewardBtn" onclick="claimExplore()">+20 🍬 Inspect</button>
    </div>
  </div>
  <div class="stage">
    <canvas id="c3d" width="560" height="175"></canvas>
  </div>
  <div class="inspector">
    <span id="nodeInfo">🖱️ Drag to orbit 3D topology · Click any 3D node to inspect its role!</span>
  </div>
<script>
  const nodes = ${JSON.stringify(nodes)};
  const conns = ${JSON.stringify(connections)};
  const canvas = document.getElementById('c3d');
  const ctx = canvas.getContext('2d');
  let yaw = 0.4;
  let pitch = 0.2;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let speedMult = 1;
  let t = 0;
  let projectedNodes = [];
  let rewarded = false;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
    for (const p of projectedNodes) {
      const dx = mx - p.x;
      const dy = my - p.y;
      if (Math.sqrt(dx*dx + dy*dy) < 22) {
        document.getElementById('nodeInfo').innerHTML =
          '<strong style="color:' + p.color + '">[' + p.label + ']</strong>: ' + p.tooltip;
        break;
      }
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    pitch = Math.max(-0.8, Math.min(0.8, pitch + (e.clientY - lastY) * 0.01));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  function project(pos) {
    const x = pos[0], y = pos[1], z = pos[2];
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const x1 = x * cosY - z * sinY;
    const z1 = z * cosY + x * sinY;
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const y2 = y * cosP - z1 * sinP;
    const z2 = z1 * cosP + y * sinP;
    const scale = 220 / (5.5 + z2);
    return {
      x: canvas.width / 2 + x1 * scale * 1.15,
      y: canvas.height / 2 - y2 * scale * 0.9,
      scale,
      z: z2
    };
  }

  function toggleSpeed() {
    speedMult = speedMult === 1 ? 2.6 : 1;
  }

  function claimExplore() {
    if (rewarded) return;
    rewarded = true;
    const btn = document.getElementById('rewardBtn');
    btn.textContent = '✅ +${candyReward} 🍬';
    window.parent.postMessage({
      type: 'MENTOR_MINI_PREVIEW_REWARD',
      materialType: '3d_preview',
      candy: ${candyReward},
      title: ${JSON.stringify(input.learningStepTitle)}
    }, '*');
  }

  function animate() {
    t += 0.018 * speedMult;
    if (!dragging) yaw += 0.004 * speedMult;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    projectedNodes = nodes.map((n, idx) => {
      const bob = Math.sin(t + idx) * 0.12;
      const p = project([n.position[0], n.position[1] + bob, n.position[2]]);
      return { ...n, ...p };
    });

    // Draw connections & packets
    conns.forEach((c, idx) => {
      const from = projectedNodes.find((n) => n.id === c.fromId) || projectedNodes[0];
      const to = projectedNodes.find((n) => n.id === c.toId) || projectedNodes[1];
      if (!from || !to) return;
      ctx.strokeStyle = 'rgba(56,189,248,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      const prog = (t * 0.7 + idx * 0.33) % 1;
      const px = from.x + (to.x - from.x) * prog;
      const py = from.y + (to.y - from.y) * prog;
      ctx.fillStyle = c.color || '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw nodes sorted back-to-front
    projectedNodes.slice().sort((a, b) => b.z - a.z).forEach((n) => {
      const r = Math.max(10, Math.min(22, n.scale * 0.36));
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label.slice(0, 18), n.x, n.y + r + 12);
    });

    requestAnimationFrame(animate);
  }
  animate();
</script>
</body>
</html>`;
}

export function buildAdaptiveLearningMaterial(
  input: BuildMaterialInput
): LearningMaterialProposal {
  const validTypes: LearningMaterialType[] = [
    '3d_preview',
    'mini_game',
    'small_test',
    'image_explanation',
  ];

  const resolvedType: LearningMaterialType = validTypes.includes(
    input.rawModelMaterial?.type as LearningMaterialType
  )
    ? (input.rawModelMaterial!.type as LearningMaterialType)
    : input.materialType;

  const meta = MATERIAL_TYPE_META[resolvedType];
  const effectiveLevel: StudentLevel =
    input.assessedLevel === 'unassessed' ? 'intermediate' : input.assessedLevel;

  // Check if Gemini 4 Argon generated a full self-contained HTML snippet
  const rawHtml = input.rawModelMaterial?.interactiveHtmlCode?.trim() || '';
  const hasUsableModelHtml =
    rawHtml.length > 220 &&
    (rawHtml.includes('<html') ||
      rawHtml.includes('<div') ||
      rawHtml.includes('<canvas') ||
      rawHtml.includes('<svg') ||
      rawHtml.includes('<script'));

  let interactiveHtmlCode = '';
  if (hasUsableModelHtml) {
    interactiveHtmlCode = rawHtml.includes('<html')
      ? rawHtml
      : `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{background:#070b14;color:#f1f5f9;font-family:system-ui,sans-serif;padding:12px;margin:0;}</style></head><body>${rawHtml}</body></html>`;
  } else {
    if (resolvedType === 'mini_game') {
      interactiveHtmlCode = buildMiniGameHtml(input);
    } else if (resolvedType === 'image_explanation') {
      interactiveHtmlCode = buildImageExplanationHtml(input);
    } else if (resolvedType === 'small_test') {
      interactiveHtmlCode = buildSmallTestHtml(input);
    } else {
      interactiveHtmlCode = build3DPreviewHtml(input);
    }
  }

  return {
    id:
      input.rawModelMaterial?.id ||
      `mat-${resolvedType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: resolvedType,
    title:
      input.rawModelMaterial?.title ||
      `${input.learningStepTitle} · ${meta.shortLabel}`,
    targetLevel: effectiveLevel,
    pedagogicalReason:
      input.rawModelMaterial?.pedagogicalReason ||
      getPedagogicalReasonForMaterial(
        resolvedType,
        effectiveLevel,
        input.mentorName,
        input.learningStepTitle
      ),
    summary:
      input.rawModelMaterial?.summary ||
      `Interactive ${meta.label} (${meta.koreanHint}) tailored by ${input.mentorName} for your ${effectiveLevel} level.`,
    controlsHint:
      input.rawModelMaterial?.controlsHint ||
      (resolvedType === 'mini_game'
        ? 'Play directly inside this chat card to earn +30 🍬 Candy!'
        : resolvedType === 'image_explanation'
        ? 'Click through the visual diagram steps & nodes to earn +15 🍬 Candy!'
        : resolvedType === 'small_test'
        ? 'Solve the 2-step check-in test right in chat to earn +25 🍬 Candy!'
        : 'Drag to orbit the 3D nodes & click to inspect tooltips (+20 🍬)!'),
    candyReward:
      Number(input.rawModelMaterial?.candyReward) || meta.defaultCandy,
    interactiveHtmlCode,
  };
}

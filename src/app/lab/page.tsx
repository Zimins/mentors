"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RiveAvatar } from "@/components/avatar/RiveAvatar";
import { Argon3DViewer } from "@/components/studio/Argon3DViewer";
import { QuizDrawer } from "@/components/studio/QuizDrawer";
import { MENTORS } from "@/data/mentors";
import { SHOP_ITEMS } from "@/data/shopItems";
import { useUserProgress } from "@/context/UserProgressContext";
import type {
  RiveAvatarState,
  Scene3DSpec,
  QuizQuestion,
  MentorAgentTurnResponse,
} from "@/types/mentor";

type TrackTab = "A" | "B" | "C" | "D";

const SAMPLE_QUIZ: QuizQuestion = {
  id: "lab-quiz-1",
  topic: "Binary Search Tree & CPU Cache",
  difficulty: "intermediate",
  question:
    "When a Binary Search Tree (BST) becomes skewed to one side, what does its worst-case lookup time degrade to, and which self-balancing tree resolves this via rotations?",
  options: [
    "O(log N) — Binary Heap",
    "O(N) — AVL Tree or Red-Black Tree",
    "O(1) — Open-Addressed Hash Table",
    "O(N log N) — Prefix Trie",
  ],
  correctIndex: 1,
  explanation:
    "A skewed BST degenerates into a linked list with O(N) search time. Self-balancing trees like AVL or Red-Black Trees apply tree rotations to maintain O(log N) height.",
  candyReward: 30,
};

export default function TrackTestLabPage() {
  const [activeTrack, setActiveTrack] = useState<TrackTab>("A");

  // Track A state
  const [selectedMentorIdx, setSelectedMentorIdx] = useState(0);
  const [avatarState, setAvatarState] = useState<RiveAvatarState>("idle");
  const [customRivBlobUrl, setCustomRivBlobUrl] = useState<string | null>(null);
  const [customRivFileName, setCustomRivFileName] = useState<string | null>(
    null
  );

  // Track B state
  const [gcpStatusJson, setGcpStatusJson] = useState<string>("");
  const [agentPrompt, setAgentPrompt] = useState<string>(
    "Diagnose my level and show me a 3D model of how stack frames and heap pointers interact in memory!"
  );
  const [agentMode, setAgentMode] = useState<
    "chat" | "generate_3d" | "generate_quiz"
  >("chat");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] =
    useState<MentorAgentTurnResponse | null>(null);
  const [agentLatencyMs, setAgentLatencyMs] = useState<number | null>(null);

  // Track C state
  const [labScene3d, setLabScene3d] = useState<Scene3DSpec>(
    MENTORS[0].defaultScene3d
  );
  const [labQuiz, setLabQuiz] = useState<QuizQuestion | null>(SAMPLE_QUIZ);
  const [isGenerating3d, setIsGenerating3d] = useState(false);

  // Track D state
  const {
    profile,
    addCandy,
    purchaseItem,
    equipItem,
    setIsShopOpen,
    customRivFiles,
    setCustomRivFile,
    updateDisplayName,
    resetAnonymousSession,
  } = useUserProgress();
  const [progressApiOutput, setProgressApiOutput] = useState<string>("");
  const [anonNicknameInput, setAnonNicknameInput] = useState<string>("");

  const currentMentor = MENTORS[selectedMentorIdx] || MENTORS[0];

  const handleUploadRiv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomRivBlobUrl(url);
    setCustomRivFileName(file.name);
    setCustomRivFile("global", url);
  };

  const runTrackBGcpCheck = async () => {
    setGcpStatusJson("Checking /api/gcp/status ...");
    try {
      const res = await fetch("/api/gcp/status");
      const data = await res.json();
      setGcpStatusJson(JSON.stringify(data, null, 2));
    } catch (err) {
      setGcpStatusJson(String(err));
    }
  };

  const runTrackBMentorTurn = async () => {
    setAgentLoading(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: currentMentor.id,
          mentorName: currentMentor.name,
          roleTitle: currentMentor.roleTitle,
          subject: currentMentor.subject,
          systemPersona: currentMentor.systemPersona,
          userMessage: agentPrompt,
          currentLevel: "unassessed",
          history: [],
          mode: agentMode,
        }),
      });
      const data: MentorAgentTurnResponse = await res.json();
      setAgentLatencyMs(Math.round(performance.now() - start));
      setAgentResult(data);
      if (data.scene3d) {
        setLabScene3d(data.scene3d);
      }
      if (data.quiz) {
        setLabQuiz(data.quiz);
      }
      if (data.avatarState) {
        setAvatarState(data.avatarState);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleRequest3dInLab = async (topic: string) => {
    setIsGenerating3d(true);
    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: currentMentor.id,
          mentorName: currentMentor.name,
          roleTitle: currentMentor.roleTitle,
          subject: currentMentor.subject,
          systemPersona: currentMentor.systemPersona,
          userMessage: `Generate a detailed interactive 3D model preview for: ${topic}`,
          currentLevel: "intermediate",
          history: [],
          mode: "generate_3d",
        }),
      });
      const data: MentorAgentTurnResponse = await res.json();
      if (data.scene3d) {
        setLabScene3d(data.scene3d);
      }
    } finally {
      setIsGenerating3d(false);
    }
  };

  const testTrackDProgressApi = async () => {
    setProgressApiOutput(`Fetching /api/progress?userId=${profile.userId} ...`);
    try {
      const res = await fetch(`/api/progress?userId=${encodeURIComponent(profile.userId)}`);
      const data = await res.json();
      setProgressApiOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setProgressApiOutput(String(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
            <span>Independent Track Verification Sandbox</span>
            <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-sky-300">
              GCP: h2gdm-hack26icn-2694
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Independent Track Test Lab (Track A / B / C / D)
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Test and verify each of the 4 parallel engineering tracks in an isolated sandbox environment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-sky-500/50 hover:text-white"
          >
            ← Back to Home
          </Link>
          <Link
            href="/mentor/cs-professor"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:brightness-110"
          >
            Open Full Studio →
          </Link>
        </div>
      </div>

      {/* Track Selector Tabs */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            id: "A" as TrackTab,
            title: "Track A: Rive & Home",
            desc: "Test .riv 5 states (idle/happy/sad/thinking/talking), skins & mentor presets",
            badge: "Rive Runtime",
            color: "from-sky-500/20 to-blue-600/10 border-sky-500/40",
          },
          {
            id: "B" as TrackTab,
            title: "Track B: Gemini 4 Argon API",
            desc: "Test GCP h2gdm-hack26icn-2694 status & autonomous level + 3D JSON synthesis",
            badge: "gemini-4-argon",
            color: "from-indigo-500/20 to-purple-600/10 border-indigo-500/40",
          },
          {
            id: "C" as TrackTab,
            title: "Track C: 3D Preview & Quiz",
            desc: "Test interactive Three.js 3D scene viewer & Duolingo-style Quiz Drawer",
            badge: "Three.js + Quiz",
            color: "from-emerald-500/20 to-teal-600/10 border-emerald-500/40",
          },
          {
            id: "D" as TrackTab,
            title: "Track D: Candy Shop & GCP",
            desc: "Test Candy rewards, avatar skin purchases, Streak Freeze & Firestore API",
            badge: "Candy + Firestore",
            color: "from-rose-500/20 to-amber-600/10 border-rose-500/40",
          },
        ].map((tab) => {
          const active = activeTrack === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTrack(tab.id)}
              className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                active
                  ? `bg-gradient-to-br ${tab.color} ring-2 ring-sky-400/60`
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-base font-bold text-white">
                  {tab.title}
                </span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                  {tab.badge}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* TRACK A SANDBOX */}
      {activeTrack === "A" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-5">
            <h2 className="text-lg font-bold text-white">
              Track A — Rive (`.riv`) Profile Component Sandbox
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Verify all 5 explicit states (<code>idle</code>,{" "}
              <code>happy</code>, <code>sad</code>, <code>thinking</code>,{" "}
              <code>talking</code>) using files in <code>public/riv/</code> or
              upload a local <code>.riv</code> file on the fly.
            </p>

            <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/70 p-8">
              <RiveAvatar
                rivSrc={currentMentor.rivFile}
                state={avatarState}
                accentColor={currentMentor.accentColor}
                size="xl"
                equippedSkinId={profile.equippedSkinId}
                equippedAuraId={profile.equippedAuraId}
                mentorName={currentMentor.name}
                customRivBlobUrl={
                  customRivBlobUrl ||
                  customRivFiles[currentMentor.id] ||
                  customRivFiles.global
                }
              />
              <div className="mt-4 text-center">
                <div className="text-base font-bold text-white">
                  {currentMentor.name} ({currentMentor.roleTitle})
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Target .riv:{" "}
                  <code>{customRivFileName || currentMentor.rivFile}</code> •
                  Auto State:{" "}
                  <span className="font-semibold text-sky-400">
                    {avatarState.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom .riv File Uploader */}
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4">
              <div className="text-xs font-semibold text-slate-300">
                Hot-Load Local <code>.riv</code> File
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Drop files into <code>/Users/zimin/mentors/public/riv/</code> or
                choose a <code>.riv</code> file right here to test immediately.
              </p>
              <input
                type="file"
                accept=".riv"
                onChange={handleUploadRiv}
                className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sky-300 hover:file:bg-sky-500/30"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-7">
            <h3 className="text-base font-bold text-white">
              7 AI Mentor Presets & Honeycomb Constellation Data
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Select any mentor to switch the Rive Avatar stage and default 3D
              scene.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MENTORS.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMentorIdx(idx);
                    setLabScene3d(m.defaultScene3d);
                  }}
                  className={`flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition ${
                    selectedMentorIdx === idx
                      ? "border-sky-500/60 bg-sky-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="shrink-0">
                    <RiveAvatar
                      rivSrc={m.rivFile}
                      state={selectedMentorIdx === idx ? avatarState : "idle"}
                      accentColor={m.accentColor}
                      size="sm"
                      customRivBlobUrl={customRivBlobUrl}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-white">
                        {m.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                        Ring {m.ring}
                      </span>
                    </div>
                    <div className="truncate text-xs text-sky-400">
                      {m.roleTitle}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      {m.subject}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRACK B SANDBOX */}
      {activeTrack === "B" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-5">
            <div>
              <h2 className="text-lg font-bold text-white">
                Track B — Gemini 4 Argon & GCP Agent API Sandbox
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Directly call <code>/api/gcp/status</code> and{" "}
                <code>/api/mentor/chat</code> to verify{" "}
                <code>gemini-4-argon</code> level assessment, 3D scene JSON
                generation, and quiz creation.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  1. GCP Project (<code>h2gdm-hack26icn-2694</code>) Status
                </span>
                <button
                  onClick={runTrackBGcpCheck}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-slate-700"
                >
                  Run GET /api/gcp/status
                </button>
              </div>
              {gcpStatusJson && (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] text-emerald-300">
                  {gcpStatusJson}
                </pre>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold text-slate-300">
                2. <code>POST /api/mentor/chat</code> (Invoke Gemini 4 Argon)
              </div>

              <div className="flex gap-2">
                {(["chat", "generate_3d", "generate_quiz"] as const).map(
                  (m) => (
                    <button
                      key={m}
                      onClick={() => setAgentMode(m)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        agentMode === m
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      mode: {m}
                    </button>
                  )
                )}
              </div>

              <textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white focus:border-sky-500 focus:outline-none"
              />

              <button
                onClick={runTrackBMentorTurn}
                disabled={agentLoading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
              >
                {agentLoading
                  ? "Synthesizing with Gemini 4 Argon..."
                  : "Invoke Gemini 4 Argon Mentor Agent"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Structured Response Inspector (MentorAgentTurnResponse)
              </h3>
              {agentLatencyMs !== null && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {agentResult?.modelUsed || "gemini-4-argon"} •{" "}
                  {agentLatencyMs}ms
                </span>
              )}
            </div>

            {agentResult ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="text-slate-400">Rive Avatar State</div>
                    <div className="mt-1 font-bold text-sky-400">
                      {agentResult.avatarState}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="text-slate-400">Assessed Level</div>
                    <div className="mt-1 font-bold text-amber-400">
                      {agentResult.assessedLevel}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="text-slate-400">3D Nodes / Candy</div>
                    <div className="mt-1 font-bold text-emerald-400">
                      {agentResult.scene3d?.nodes?.length || 0} nodes / +
                      {agentResult.candyDelta} 🍬
                    </div>
                  </div>
                </div>
                <pre className="max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-black/70 p-4 text-xs text-sky-200">
                  {JSON.stringify(agentResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="mt-8 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                Click &ldquo;Invoke Gemini 4 Argon Mentor Agent&rdquo; on the
                left to inspect the live JSON payload.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRACK C SANDBOX */}
      {activeTrack === "C" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Argon3DViewer
              scene={labScene3d}
              accentColor={currentMentor.accentColor}
              isGenerating={isGenerating3d}
              onRequestGenerate3D={handleRequest3dInLab}
            />
          </div>
          <div className="lg:col-span-5">
            <QuizDrawer
              quiz={labQuiz}
              accentColor={currentMentor.accentColor}
              onAnswerSubmit={(isCorrect, candy) => {
                if (isCorrect) {
                  addCandy(candy, "Track C Quiz Solved!");
                  setAvatarState("happy");
                } else {
                  setAvatarState("sad");
                }
              }}
              onRequestNewQuiz={() => {
                setLabQuiz({
                  ...SAMPLE_QUIZ,
                  id: "lab-quiz-" + Date.now(),
                });
              }}
            />
          </div>
        </div>
      )}

      {/* TRACK D SANDBOX */}
      {activeTrack === "D" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-5">
            <h2 className="text-lg font-bold text-white">
              Track D — Candy Economy, Avatar Shop & Firestore Sync
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="text-xs text-slate-400">Candy Balance</div>
                <div className="mt-1 text-xl font-bold text-rose-400">
                  🍬 {profile.candyBalance}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="text-xs text-slate-400">Daily Streak</div>
                <div className="mt-1 text-xl font-bold text-amber-400">
                  🔥 {profile.streakDays}d
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="text-xs text-slate-400">Streak Freezes</div>
                <div className="mt-1 text-xl font-bold text-sky-400">
                  🧊 {profile.streakFreezeCount}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addCandy(25, "Track D Sandbox Reward")}
                className="rounded-xl bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
              >
                +25 Candy Reward Test
              </button>
              <button
                onClick={() => addCandy(100, "Hackathon Bonus Grant")}
                className="rounded-xl bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
              >
                +100 Candy Grant Test
              </button>
              <button
                onClick={() => setIsShopOpen(true)}
                className="rounded-xl bg-sky-500/20 px-3.5 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/30"
              >
                🛍️ Open Full Candy Shop Modal
              </button>
            </div>

            {/* Browser-Based Anonymous Login Session */}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Browser-Based Anonymous Login Session
                  </span>
                </div>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                  {profile.userId}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Display Name:{" "}
                <span className="font-semibold text-white">
                  {profile.displayName}
                </span>{" "}
                (Auto-persisted in browser <code>localStorage</code> & synced to Firestore)
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={anonNicknameInput}
                  onChange={(e) => setAnonNicknameInput(e.target.value)}
                  placeholder="Optional alias (e.g. Alex)"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (anonNicknameInput.trim()) {
                      updateDisplayName(anonNicknameInput.trim());
                      setAnonNicknameInput("");
                    }
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-slate-700"
                >
                  Rename
                </button>
                <button
                  onClick={resetAnonymousSession}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                  title="Generate a brand-new anonymous browser identity"
                >
                  New Anon ID
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Firestore / Progress API (<code>/api/progress</code>)
                </span>
                <button
                  onClick={testTrackDProgressApi}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-slate-700"
                >
                  Call GET /api/progress
                </button>
              </div>
              {progressApiOutput && (
                <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] text-emerald-300">
                  {progressApiOutput}
                </pre>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-7">
            <h3 className="text-base font-bold text-white">
              Direct Shop Purchase & Equip Tester
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SHOP_ITEMS.map((item) => {
                const unlocked = profile.unlockedItemIds.includes(item.id);
                const equipped =
                  profile.equippedSkinId === item.id ||
                  profile.equippedAuraId === item.id ||
                  profile.equippedThemeId === item.id;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-bold text-white">
                          {item.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {item.description}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-rose-400">
                        🍬 {item.costCandy} Candy
                      </div>
                    </div>
                    <div>
                      {unlocked && item.category !== "streak_item" ? (
                        <button
                          onClick={() => equipItem(item)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            equipped
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {equipped ? "Equipped" : "Equip"}
                        </button>
                      ) : (
                        <button
                          onClick={() => purchaseItem(item)}
                          className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600"
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

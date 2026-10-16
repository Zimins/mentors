'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Brain,
  FileCheck2,
  Sliders,
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Clock,
  ExternalLink,
  ShieldCheck,
  Compass,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { MENTORS } from '@/data/mentors';
import type {
  LearnerSummary,
  AgentDiagnosticReport,
  QuizSubmissionRecord,
  LearnerSessionLog,
  MentorPromptConfig,
  ReferenceMaterial,
  EngagedMentorStats,
} from '@/types/admin';

export default function AdminSupervisionPage() {
  const [activeTab, setActiveTab] = useState<'learners' | 'submissions' | 'prompts' | 'mentors'>('learners');

  // Learners state
  const [learners, setLearners] = useState<LearnerSummary[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('demo-scholar-01');
  const [activeMentorTrackId, setActiveMentorTrackId] = useState<string>('cs-professor');
  const [profileViewMentorId, setProfileViewMentorId] = useState<string>('cs-professor');
  const [learnerDetail, setLearnerDetail] = useState<{
    learner: LearnerSummary;
    engagedMentors: EngagedMentorStats[];
    submissions: QuizSubmissionRecord[];
    sessionLogs: LearnerSessionLog[];
    allSubmissions: QuizSubmissionRecord[];
    allSessionLogs: LearnerSessionLog[];
    diagnosticReport: AgentDiagnosticReport | null;
  } | null>(null);

  // Submissions state
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [submissionTab, setSubmissionTab] = useState<'quizzes' | 'dialogue'>('quizzes');

  // Prompts & Directives state
  const [selectedMentorId, setSelectedMentorId] = useState<string>('cs-professor');

  const [promptConfig, setPromptConfig] = useState<MentorPromptConfig | null>(null);
  const [systemPersonaInput, setSystemPersonaInput] = useState<string>('');
  const [diagnosticGuidelinesInput, setDiagnosticGuidelinesInput] = useState<string>('');
  const [targetStudentForDirective, setTargetStudentForDirective] = useState<string>('demo-scholar-01');
  const [studentDirectiveInput, setStudentDirectiveInput] = useState<string>('');

  // References state
  const [references, setReferences] = useState<ReferenceMaterial[]>([]);
  const [newRefTitle, setNewRefTitle] = useState<string>('');
  const [newRefCategory, setNewRefCategory] = useState<'textbook' | 'paper' | 'architecture_guide' | 'cheat_sheet'>('architecture_guide');
  const [newRefTags, setNewRefTags] = useState<string>('');
  const [newRefContent, setNewRefContent] = useState<string>('');
  const [showAddRefModal, setShowAddRefModal] = useState<boolean>(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // 1. Fetch Learners
  const loadLearners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/learners');
      const data = await res.json();
      if (data.ok && Array.isArray(data.learners)) {
        setLearners(data.learners);
      }
    } catch (err) {
      console.error('Failed to load learners:', err);
    }
  }, []);

  // 2. Fetch Selected Learner Detail
  const loadLearnerDetail = useCallback(async (userId: string, mentorId?: string) => {
    try {
      const url = mentorId
        ? `/api/admin/learners/${userId}?mentorId=${mentorId}`
        : `/api/admin/learners/${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setLearnerDetail({
          learner: data.learner,
          engagedMentors: data.engagedMentors || [],
          submissions: data.submissions || [],
          sessionLogs: data.sessionLogs || [],
          allSubmissions: data.allSubmissions || data.submissions || [],
          allSessionLogs: data.allSessionLogs || data.sessionLogs || [],
          diagnosticReport: data.diagnosticReport || null,
        });

        // Sync activeMentorTrackId if not currently in engaged list
        if (!mentorId && data.learner?.activeMentorId) {
          setActiveMentorTrackId(data.learner.activeMentorId);
        }
      }
    } catch (err) {
      console.error('Failed to load learner detail:', err);
    }
  }, []);

  // 3. Fetch Prompt Config
  const loadPromptConfig = useCallback(async (mentorId: string) => {
    try {
      const res = await fetch(`/api/admin/prompts?mentorId=${mentorId}`);
      const data = await res.json();
      if (data.ok && data.config) {
        setPromptConfig(data.config);
        setSystemPersonaInput(data.config.systemPersona || '');
        setDiagnosticGuidelinesInput(data.config.diagnosticGuidelines || '');
        setStudentDirectiveInput(data.config.studentDirectives?.[targetStudentForDirective] || '');
      }
    } catch (err) {
      console.error('Failed to load prompt config:', err);
    }
  }, [targetStudentForDirective]);

  // 4. Fetch References
  const loadReferences = useCallback(async (mentorId?: string) => {
    try {
      const url = mentorId ? `/api/admin/references?mentorId=${mentorId}` : '/api/admin/references';
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && Array.isArray(data.references)) {
        setReferences(data.references);
      }
    } catch (err) {
      console.error('Failed to load references:', err);
    }
  }, []);

  useEffect(() => {
    loadLearners();
    loadReferences();
  }, [loadLearners, loadReferences]);

  useEffect(() => {
    if (selectedLearnerId) {
      loadLearnerDetail(selectedLearnerId, activeMentorTrackId);
    }
  }, [selectedLearnerId, activeMentorTrackId, loadLearnerDetail]);

  useEffect(() => {
    loadPromptConfig(selectedMentorId);
    loadReferences(selectedMentorId);
  }, [selectedMentorId, loadPromptConfig, loadReferences]);

  useEffect(() => {
    if (promptConfig?.studentDirectives) {
      setStudentDirectiveInput(promptConfig.studentDirectives[targetStudentForDirective] || '');
    }
  }, [targetStudentForDirective, promptConfig]);

  // Trigger Gemini AI Diagnostic Summary for the active track mentor
  const handleGenerateSummary = async () => {
    if (!selectedLearnerId) return;
    setIsLoadingSummary(true);
    try {
      const res = await fetch('/api/admin/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedLearnerId,
          mentorId: activeMentorTrackId,
        }),
      });
      const data = await res.json();
      if (data.ok && data.report) {
        setLearnerDetail((prev) =>
          prev ? { ...prev, diagnosticReport: data.report } : null
        );
        showToast(`✨ ${currentTrackMentorObj?.name || 'Mentor'} AI diagnostic generated!`);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Save Prompt & Directives
  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      const updatedDirectives = {
        ...(promptConfig?.studentDirectives || {}),
        [targetStudentForDirective]: studentDirectiveInput,
      };

      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentorId,
          systemPersona: systemPersonaInput,
          diagnosticGuidelines: diagnosticGuidelinesInput,
          studentDirectives: updatedDirectives,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPromptConfig(data.config);
        showToast(`✅ Prompt & directives updated for ${selectedMentorId}!`);
      }
    } catch (err) {
      console.error('Failed to save prompt:', err);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Add Reference Material
  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefTitle || !newRefContent) return;

    try {
      const tags = newRefTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentorId,
          title: newRefTitle,
          category: newRefCategory,
          content: newRefContent,
          tags,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewRefTitle('');
        setNewRefContent('');
        setNewRefTags('');
        setShowAddRefModal(false);
        loadReferences(selectedMentorId);
        showToast('📚 Knowledge base document indexed successfully!');
      }
    } catch (err) {
      console.error('Failed to add reference:', err);
    }
  };

  const handleDeleteReference = async (id: string) => {
    if (!confirm('Remove this document from the grounding knowledge base?')) return;
    try {
      const res = await fetch(`/api/admin/references?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        loadReferences(selectedMentorId);
        showToast('Document removed from knowledge base.');
      }
    } catch (err) {
      console.error('Failed to delete reference:', err);
    }
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3600);
  };

  const filteredLearners = useMemo(() => {
    return learners.filter((l) =>
      l.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [learners, searchTerm]);

  const filteredSubmissions = useMemo(() => {
    const list = learnerDetail?.submissions || [];
    if (submissionsFilter === 'correct') return list.filter((s) => s.isCorrect);
    if (submissionsFilter === 'incorrect') return list.filter((s) => !s.isCorrect);
    return list;
  }, [learnerDetail?.submissions, submissionsFilter]);

  const selectedLearner = learnerDetail?.learner;
  const currentMentorObj = MENTORS.find((m) => m.id === selectedMentorId) || MENTORS[0];
  const currentTrackMentorObj = MENTORS.find((m) => m.id === activeMentorTrackId) || MENTORS[0];

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* Toast Notification */}

      {saveToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 border border-sky-500/40 text-sky-200 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-medium">{saveToast}</span>
        </div>
      )}

      {/* Clean Top Navigation Bar (Borderless, subtle bottom line) */}
      <header className="border-b border-white/[0.08] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold tracking-tight text-white">Supervision Studio</span>
            <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 uppercase">
              Human Expert Co-Pilot
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 text-xs text-slate-400 pl-4 border-l border-white/[0.08]">
            <div>
              <span className="text-slate-500 mr-1.5">Learners:</span>
              <span className="text-white font-medium">{learners.length}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">Mentors:</span>
              <span className="text-white font-medium">{MENTORS.length}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">Grounding Docs:</span>
              <span className="text-white font-medium">{references.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link
            href={`/mentor/${selectedMentorId}`}
            target="_blank"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition"
          >
            <span>Live Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/lab"
            target="_blank"
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition"
          >
            <span>Agent Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Clean Minimalist Tab Bar */}
      <div className="border-b border-white/[0.06] px-8 flex items-center gap-8">
        <button
          onClick={() => setActiveTab('learners')}
          className={`py-3 text-xs font-semibold tracking-wide transition border-b-2 flex items-center gap-2 ${
            activeTab === 'learners'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Learner Intelligence & AI Diagnosis</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-3 text-xs font-semibold tracking-wide transition border-b-2 flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Submissions & Inquiry Trace</span>
          {learnerDetail?.submissions && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-slate-300">
              {learnerDetail.submissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`py-3 text-xs font-semibold tracking-wide transition border-b-2 flex items-center gap-2 ${
            activeTab === 'prompts'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Prompt Engineering & Knowledge Base</span>
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`py-3 text-xs font-semibold tracking-wide transition border-b-2 flex items-center gap-2 ${
            activeTab === 'mentors'
              ? 'border-sky-400 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Mentor Profiles & Agent Specs</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-slate-300">
            {MENTORS.length}
          </span>
        </button>
      </div>

      {/* Main Content Area without bulky section boxes */}
      <main className="flex-1 px-8 py-8 max-w-7xl w-full mx-auto">
        {/* ========================================================================= */}
        {/* TAB 1: Learner Intelligence & AI Diagnosis */}
        {/* ========================================================================= */}
        {activeTab === 'learners' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Directory of Learners (Borderless List) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Learners</h2>
                <button
                  onClick={loadLearners}
                  title="Refresh"
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Minimal Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-b border-white/[0.1] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 transition"
                />
              </div>

              {/* Seamless Learner List */}
              <div className="divide-y divide-white/[0.05] max-h-[680px] overflow-y-auto pr-1">
                {filteredLearners.map((lrn) => {
                  const isSelected = lrn.userId === selectedLearnerId;
                  const activeMentorObj = MENTORS.find((m) => m.id === (lrn.activeMentorId || 'cs-professor'));
                  const engagedCount = lrn.engagedMentorIds?.length || Object.keys(lrn.mentorLevels || {}).length || 1;

                  return (
                    <div
                      key={lrn.userId}
                      onClick={() => {
                        setSelectedLearnerId(lrn.userId);
                        if (lrn.activeMentorId) {
                          setActiveMentorTrackId(lrn.activeMentorId);
                        }
                      }}
                      className={`py-3.5 px-3 rounded-lg transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-white/[0.07] text-white'
                          : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {lrn.displayName}
                          </span>
                          {lrn.userId === 'demo-scholar-01' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Active Mentor Badge */}
                        {activeMentorObj && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeMentorObj.accentColor }} />
                            <span>{activeMentorObj.name.split(' ')[0]}</span>
                          </span>
                        )}
                      </div>

                      {/* Mentor engagement chips & subject */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-mono text-[10px]">
                            {activeMentorObj?.shortTag || 'Mentor'}
                          </span>
                          {engagedCount > 1 && (
                            <span className="text-[10px] px-1 rounded bg-white/[0.04] text-slate-400">
                              +{engagedCount - 1} tracks
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span>Acc: <strong className="text-emerald-400">{lrn.quizStats.accuracyRate}%</strong></span>
                          <span>XP: <strong className="text-amber-400">{lrn.xpTotal}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Right: Selected Learner Detail & Open AI Diagnostic Report */}
            <div className="lg:col-span-8 space-y-8 pl-0 lg:pl-4">
              {selectedLearner ? (
                <>
                  {/* Clean Learner Header (No surrounding box) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-white">{selectedLearner.displayName}</h1>
                        <span className="font-mono text-xs text-slate-500">({selectedLearner.userId})</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Last active: {new Date(selectedLearner.lastActiveAt).toLocaleTimeString()}
                        </span>
                        <span>·</span>
                        <span>Streak: <strong className="text-white">{selectedLearner.streakDays}d</strong></span>
                        <span>·</span>
                        <span>Balance: <strong className="text-amber-300">{selectedLearner.candyBalance} 🍬</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isLoadingSummary}
                        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-slate-200 disabled:opacity-50 transition cursor-pointer shadow-sm"
                      >
                        {isLoadingSummary ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Run AI Diagnostic</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mentor Engagement Track Selector (1-Click switch to inspect what is happening in each mentoring process) */}
                  <div className="space-y-2 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Mentoring Tracks & In-Progress Engagements
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Select a mentor to inspect their specific guidance & diagnostic trail
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(learnerDetail?.engagedMentors && learnerDetail.engagedMentors.length > 0
                        ? learnerDetail.engagedMentors
                        : MENTORS.map((m) => ({
                            id: m.id,
                            name: m.name,
                            roleTitle: m.roleTitle,
                            subject: m.subject,
                            shortTag: m.shortTag,
                            accentColor: m.accentColor,
                            secondaryColor: m.secondaryColor,
                            studentLevel: selectedLearner.mentorLevels[m.id] || 'unassessed',
                            submissionCount: 0,
                            correctCount: 0,
                            accuracyRate: null,
                            logCount: 0,
                          }))
                      ).map((mTrack) => {
                        const isCurrentTrack = mTrack.id === activeMentorTrackId;
                        const isStudentActiveMentor = mTrack.id === (selectedLearner.activeMentorId || 'cs-professor');

                        return (
                          <button
                            key={mTrack.id}
                            onClick={() => setActiveMentorTrackId(mTrack.id)}
                            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition text-left cursor-pointer border ${
                              isCurrentTrack
                                ? 'bg-white/[0.08] border-white/20 text-white shadow-sm'
                                : 'bg-transparent border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: mTrack.accentColor }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${isCurrentTrack ? 'text-white' : 'text-slate-300'}`}>
                                  {mTrack.name}
                                </span>
                                {isStudentActiveMentor && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span className="uppercase font-medium text-slate-400">{mTrack.studentLevel}</span>
                                <span>·</span>
                                <span>{mTrack.subject}</span>
                                {mTrack.submissionCount > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="text-emerald-400">{mTrack.submissionCount} quizzes</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Open Diagnostic Report Canvas (Borderless, typographic document style) */}
                  {learnerDetail?.diagnosticReport ? (
                    <div className="space-y-6 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: currentTrackMentorObj.accentColor }}
                          />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                            {currentTrackMentorObj.name} · Diagnostic Briefing
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                            {currentTrackMentorObj.roleTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {learnerDetail.diagnosticReport.confidenceScore && (
                            <span className="text-xs text-slate-500">
                              Diagnostic Confidence: <strong className="text-sky-400">{learnerDetail.diagnosticReport.confidenceScore}%</strong>
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setProfileViewMentorId(currentTrackMentorObj.id);
                              setActiveTab('mentors');
                            }}
                            className="text-xs text-sky-400 hover:text-sky-300 font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Profile & Specs</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 1. Mastery Overview */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          Conceptual Mastery & Competency Profile
                        </h4>
                        <p className="text-sm text-slate-200 leading-relaxed font-normal">
                          {learnerDetail.diagnosticReport.masterySummary}
                        </p>
                      </div>


                      {/* 2. Weaknesses & Learning Habits (Clean Side-by-Side) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Identified Misconceptions & Weaknesses</span>
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {learnerDetail.diagnosticReport.identifiedWeaknesses.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-rose-400 font-bold shrink-0">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            <span>Inquiry & Learning Habits</span>
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {learnerDetail.diagnosticReport.learningHabits}
                          </p>
                        </div>
                      </div>

                      {/* 3. Actionable Next Steps & Recommended Curriculum */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Actionable Pedagogical Interventions</span>
                          </h4>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {learnerDetail.diagnosticReport.recommendedNextSteps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Recommended Subsequent Modules</span>
                          </h4>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {learnerDetail.diagnosticReport.suggestedTopics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-300"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-white/[0.06]">
                        <span>
                          Generated: {new Date(learnerDetail.diagnosticReport.generatedAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setActiveTab('prompts');
                            setTargetStudentForDirective(selectedLearner.userId);
                          }}
                          className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                        >
                          <span>Tune custom directive for this student</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-3">
                      <Brain className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-500">
                        No diagnostic briefing generated yet. Click <strong>Run AI Diagnostic</strong> above.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-24 text-center text-xs text-slate-500">
                  Select a learner from the left directory.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Submissions & Inquiry Trace */}
        {/* ========================================================================= */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {/* Filter toolbar (Clean borderless) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setSubmissionTab('quizzes')}
                  className={`text-xs font-semibold tracking-wide transition ${
                    submissionTab === 'quizzes' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Quiz Submissions ({filteredSubmissions.length})
                </button>
                <button
                  onClick={() => setSubmissionTab('dialogue')}
                  className={`text-xs font-semibold tracking-wide transition ${
                    submissionTab === 'dialogue' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Inquiry & Dialogue Trace ({learnerDetail?.sessionLogs.length || 0})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                {/* Mentor Track Quick Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Track:</span>
                  <div className="flex items-center gap-1.5">
                    {MENTORS.map((m) => {
                      const isCurrent = m.id === activeMentorTrackId;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setActiveMentorTrackId(m.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-white/[0.12] text-white font-medium border border-white/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.accentColor }} />
                          <span>{m.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submissionTab === 'quizzes' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Result:</span>
                    <select
                      value={submissionsFilter}
                      onChange={(e) => setSubmissionsFilter(e.target.value as any)}
                      className="bg-transparent border-b border-white/[0.1] text-xs text-slate-300 py-1 px-2 focus:outline-none focus:border-sky-400"
                    >
                      <option value="all" className="bg-slate-900">All submissions</option>
                      <option value="correct" className="bg-slate-900">Passed only</option>
                      <option value="incorrect" className="bg-slate-900">Failed only</option>
                    </select>
                  </div>
                )}
              </div>
            </div>


            {/* Quiz Submissions Feed (Clean borderless list) */}
            {submissionTab === 'quizzes' && (
              <div className="divide-y divide-white/[0.06]">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((sub) => {
                    const subMentor = MENTORS.find((m) => m.id === sub.mentorId);
                    return (
                      <div key={sub.id} className="py-6 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                                sub.isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {sub.isCorrect ? 'PASS' : 'FAIL'}
                            </span>
                            {subMentor && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subMentor.accentColor }} />
                                <span>{subMentor.name}</span>
                              </span>
                            )}
                            <span className="font-mono text-slate-500 text-[11px]">#{sub.channelSlug || 'general'}</span>
                            {sub.candyReward > 0 && (
                              <span className="text-amber-300 font-medium text-[11px]">+{sub.candyReward} 🍬</span>
                            )}
                          </div>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>

                        <h4 className="text-sm font-medium text-slate-100 leading-snug">
                          {sub.questionText}
                        </h4>

                        {/* Options comparison */}
                        <div className="space-y-1.5 pt-1">
                          {sub.options.map((opt, optIdx) => {
                            const isStudentChoice = optIdx === sub.selectedOptionIndex;
                            const isCorrectChoice = optIdx === sub.correctOptionIndex;

                            let textClass = 'text-slate-500';
                            if (isCorrectChoice) textClass = 'text-emerald-300 font-medium';
                            if (isStudentChoice && !sub.isCorrect) textClass = 'text-rose-400 font-medium';

                            return (
                              <div key={optIdx} className={`text-xs flex items-start gap-2 py-1 ${textClass}`}>
                                <span className="font-mono text-[10px] opacity-70 shrink-0">[{optIdx + 1}]</span>
                                <span className="flex-1">{opt}</span>
                                {isStudentChoice && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-300 shrink-0">
                                    Selected
                                  </span>
                                )}
                                {isCorrectChoice && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {sub.explanation && (
                          <div className="text-xs text-slate-400 pl-3 border-l border-white/[0.1] pt-1 mt-2">
                            <span className="text-slate-500 mr-1.5">Pedagogical Explanation:</span>
                            {sub.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center text-xs text-slate-500">
                    No submissions matching the current filter.
                  </div>
                )}
              </div>
            )}

            {/* Inquiries & Dialogue Feed */}
            {submissionTab === 'dialogue' && (
              <div className="divide-y divide-white/[0.06]">
                {learnerDetail?.sessionLogs && learnerDetail.sessionLogs.length > 0 ? (
                  learnerDetail.sessionLogs.map((log) => {
                    const isUser = log.role === 'user';
                    const logMentor = MENTORS.find((m) => m.id === log.mentorId);

                    return (
                      <div key={log.id} className="py-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isUser ? 'text-sky-400' : 'text-slate-300'
                              }`}
                            >
                              {isUser ? 'Learner Inquiry' : logMentor?.name || 'Mentor Response'}
                            </span>
                            {logMentor && (
                              <span className="text-[10px] text-slate-500">
                                · {logMentor.shortTag}
                              </span>
                            )}
                            {log.studentIntent && (
                              <span className="text-[10px] text-slate-500">
                                #{log.studentIntent}
                              </span>
                            )}
                            {log.scene3dTitle && (
                              <span className="text-[10px] text-emerald-400">
                                · 3D Scene: {log.scene3dTitle}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-600">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-3 border-l border-white/[0.08]">
                          {log.text}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center text-xs text-slate-500">
                    No dialogue logs recorded yet for this mentor track.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Prompt Engineering & Knowledge Base */}
        {/* ========================================================================= */}
        {activeTab === 'prompts' && (
          <div className="space-y-8">
            {/* Mentor Selector Horizontal Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target AI Mentor</h3>
                <p className="text-xs text-slate-500">Select mentor to adjust system persona and grounding knowledge</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {MENTORS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMentorId(m.id)}
                    className={`text-xs px-3 py-1.5 rounded-full transition ${
                      selectedMentorId === m.id
                        ? 'bg-white text-black font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left: Persona & Directives Editor (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {currentMentorObj.name} System Persona & Diagnostic Rubric
                  </h4>
                  <button
                    onClick={handleSavePrompt}
                    disabled={isSavingPrompt}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full bg-white text-black hover:bg-slate-200 disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    {isSavingPrompt ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save & Apply</span>
                  </button>
                </div>

                {/* System Persona Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Global System Persona
                  </label>
                  <textarea
                    rows={4}
                    value={systemPersonaInput}
                    onChange={(e) => setSystemPersonaInput(e.target.value)}
                    placeholder="Define mentor role, communication style, and 3D spatial explanation principles..."
                    className="w-full bg-transparent border-b border-white/[0.1] py-2 text-xs text-slate-200 placeholder-slate-700 font-mono leading-relaxed focus:outline-none focus:border-sky-400 transition"
                  />
                </div>

                {/* Diagnostic Guidelines Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">
                    Mastery Calibration Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={diagnosticGuidelinesInput}
                    onChange={(e) => setDiagnosticGuidelinesInput(e.target.value)}
                    placeholder="Criteria for assessing beginner, intermediate, and advanced levels..."
                    className="w-full bg-transparent border-b border-white/[0.1] py-2 text-xs text-slate-200 placeholder-slate-700 font-mono leading-relaxed focus:outline-none focus:border-sky-400 transition"
                  />
                </div>

                {/* Student-specific Custom Directive */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        Learner-Specific Secret Directive
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Injected directly into the mentor agent only when interacting with this target student
                      </p>
                    </div>

                    <select
                      value={targetStudentForDirective}
                      onChange={(e) => setTargetStudentForDirective(e.target.value)}
                      className="bg-transparent border-b border-white/[0.1] text-xs text-slate-300 py-1 px-2 focus:outline-none focus:border-indigo-400"
                    >
                      {learners.map((lrn) => (
                        <option key={lrn.userId} value={lrn.userId} className="bg-slate-900">
                          {lrn.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    rows={3}
                    value={studentDirectiveInput}
                    onChange={(e) => setStudentDirectiveInput(e.target.value)}
                    placeholder={`e.g. "Focus on preventing dangling pointers and memory safety patterns. Ask thought-provoking architectural questions before giving away the answer."`}
                    className="w-full bg-transparent border-b border-white/[0.1] py-2 text-xs text-indigo-200 placeholder-slate-700 font-mono leading-relaxed focus:outline-none focus:border-indigo-400 transition"
                  />
                </div>
              </div>

              {/* Right: Knowledge Base & References (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Grounding Knowledge Base
                    </h4>
                    <p className="text-xs text-slate-500">Authoritative reference materials grounded in Gemini</p>
                  </div>

                  <button
                    onClick={() => setShowAddRefModal(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Index Doc</span>
                  </button>
                </div>

                {/* References Feed */}
                <div className="divide-y divide-white/[0.06] max-h-[600px] overflow-y-auto pr-1">
                  {references.length > 0 ? (
                    references.map((ref) => (
                      <div key={ref.id} className="py-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {ref.category}
                            </span>
                            <h5 className="text-xs font-semibold text-slate-200 mt-0.5">
                              {ref.title}
                            </h5>
                          </div>
                          <button
                            onClick={() => handleDeleteReference(ref.id)}
                            title="Remove"
                            className="text-slate-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed font-mono">
                          {ref.content}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ref.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] text-slate-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No grounding reference documents indexed for this mentor yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Mentor Profiles & Agent Specs */}
        {/* ========================================================================= */}
        {activeTab === 'mentors' && (
          <div className="space-y-10">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Autonomous Mentor Roster & Agent Specifications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect persona definitions, pedagogical styles, 3D spatial scenes, and starter prompts for all 8 specialized mentors.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/mentor/${profileViewMentorId}`}
                  target="_blank"
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Launch Live Studio</span>
                </Link>
                <button
                  onClick={() => {
                    setSelectedMentorId(profileViewMentorId);
                    setActiveTab('prompts');
                  }}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-slate-200 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-800" />
                  <span>Tune Prompts & Directives</span>
                </button>
              </div>
            </div>

            {/* Mentor Horizontal Selector Carousel / Pill Bar */}
            <div className="flex flex-wrap gap-2.5 pb-2">
              {MENTORS.map((m) => {
                const isSelected = m.id === profileViewMentorId;
                // Count active learners on this mentor
                const activeLearnersCount = learners.filter(
                  (l) => (l.activeMentorId || 'cs-professor') === m.id
                ).length;

                return (
                  <button
                    key={m.id}
                    onClick={() => setProfileViewMentorId(m.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/20 text-white shadow-sm'
                        : 'bg-transparent border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.accentColor }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {m.name}
                        </span>
                        {activeLearnersCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                            {activeLearnersCount} {activeLearnersCount === 1 ? 'scholar' : 'scholars'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                        {m.shortTag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Selected Mentor Detailed Profile Inspector */}
            {(() => {
              const currentMentor = MENTORS.find((m) => m.id === profileViewMentorId) || MENTORS[0];
              const mentorLearners = learners.filter(
                (l) => (l.activeMentorId || 'cs-professor') === currentMentor.id
              );

              return (
                <div className="space-y-10">
                  {/* Hero Identity Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-white/[0.06]">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: currentMentor.accentColor }}
                        />
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {currentMentor.name}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-medium">
                          {currentMentor.roleTitle}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {currentMentor.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                          <span>Curriculum Domain:</span>
                          <span className="text-slate-200 font-medium">{currentMentor.subject}</span>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentMentor.accentColor }} />
                          <span>Primary Accent:</span>
                          <code className="text-slate-300 font-mono text-[11px]">{currentMentor.accentColor}</code>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentMentor.secondaryColor }} />
                          <span>Secondary Accent:</span>
                          <code className="text-slate-300 font-mono text-[11px]">{currentMentor.secondaryColor}</code>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rive File:</span>
                          <code className="text-slate-300 font-mono text-[11px]">{currentMentor.rivFile}</code>
                        </div>
                      </div>
                    </div>

                    {/* Quick Active Student Summary */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Assigned Scholars ({mentorLearners.length})
                      </span>
                      {mentorLearners.length > 0 ? (
                        <div className="space-y-2">
                          {mentorLearners.map((lrn) => (
                            <div
                              key={lrn.userId}
                              onClick={() => {
                                setSelectedLearnerId(lrn.userId);
                                setActiveMentorTrackId(currentMentor.id);
                                setActiveTab('learners');
                              }}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white">{lrn.displayName}</span>
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {lrn.mentorLevels[currentMentor.id] || 'unassessed'}
                                </span>
                              </div>
                              <span className="text-[11px] text-sky-400 hover:underline">
                                Inspect →
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No students are currently taking this mentor as their active lead.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* System Persona & Pedagogical Philosophy */}
                  <div className="space-y-3 pb-8 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        System Persona & Pedagogical Philosophy
                      </span>
                      <button
                        onClick={() => {
                          setSelectedMentorId(currentMentor.id);
                          setActiveTab('prompts');
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-medium transition"
                      >
                        Edit Persona in Prompt Studio →
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                        {currentMentor.systemPersona}
                      </p>
                    </div>
                  </div>

                  {/* Starter Prompts & Socratic Templates */}
                  <div className="space-y-3 pb-8 border-b border-white/[0.06]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Curated Socratic Inquiry Prompts ({currentMentor.starterPrompts.length})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentMentor.starterPrompts.map((prompt, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3"
                        >
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-400 shrink-0">
                            #{idx + 1}
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3D Spatial Scene Topology & Interactive Specification */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Default 3D Interactive Topology & Spatial Nodes
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Mode: {currentMentor.defaultScene3d.mode} · Camera: [{currentMentor.defaultScene3d.cameraPosition?.join(', ')}]
                      </span>
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1">
                          {currentMentor.defaultScene3d.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {currentMentor.defaultScene3d.conceptSummary}
                        </p>
                      </div>

                      {currentMentor.defaultScene3d.interactiveControlsHint && (
                        <p className="text-[11px] text-sky-400/90 font-medium">
                          ✦ {currentMentor.defaultScene3d.interactiveControlsHint}
                        </p>
                      )}

                      {/* Nodes List */}
                      {currentMentor.defaultScene3d.nodes && currentMentor.defaultScene3d.nodes.length > 0 && (
                        <div className="pt-3 border-t border-white/[0.05] space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Spatial Nodes ({currentMentor.defaultScene3d.nodes.length})
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {currentMentor.defaultScene3d.nodes.map((node) => (
                              <div
                                key={node.id}
                                className="p-2.5 rounded-lg bg-white/[0.03] space-y-1 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: node.color }}
                                    />
                                    <span className="font-semibold text-white text-[11px]">
                                      {node.label || node.id}
                                    </span>
                                  </div>
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 font-mono">
                                    {node.shape}
                                  </span>
                                </div>
                                {node.tooltip && (
                                  <p className="text-[10px] text-slate-400 line-clamp-2">
                                    {node.tooltip}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Index Reference Modal */}
      {showAddRefModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-950 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white">Index Grounding Document</h3>
              <button
                onClick={() => setShowAddRefModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReference} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newRefTitle}
                  onChange={(e) => setNewRefTitle(e.target.value)}
                  placeholder="e.g. 64-Byte Cache Line Prefetching & Spatial Locality Guide"
                  className="w-full bg-transparent border-b border-white/[0.1] py-1.5 text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newRefCategory}
                    onChange={(e) => setNewRefCategory(e.target.value as any)}
                    className="w-full bg-transparent border-b border-white/[0.1] py-1.5 text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="architecture_guide" className="bg-slate-900">Architecture Guide</option>
                    <option value="textbook" className="bg-slate-900">Textbook / Theory</option>
                    <option value="paper" className="bg-slate-900">Research Paper</option>
                    <option value="cheat_sheet" className="bg-slate-900">Cheat Sheet</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newRefTags}
                    onChange={(e) => setNewRefTags(e.target.value)}
                    placeholder="Cache, Memory, Prefetch"
                    className="w-full bg-transparent border-b border-white/[0.1] py-1.5 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Content (Markdown / Text)</label>
                <textarea
                  rows={8}
                  required
                  value={newRefContent}
                  onChange={(e) => setNewRefContent(e.target.value)}
                  placeholder="Paste official documentation, system specifications, or instructional guides..."
                  className="w-full bg-transparent border-b border-white/[0.1] py-1.5 text-white font-mono leading-relaxed focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRefModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition"
                >
                  Index Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

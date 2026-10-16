# MENTORS — Interactive 3D & Rive AI Mentor Learning Platform

An adaptive AI learning platform built with **Next.js 15**, **React 19**, **Rive (`@rive-app/react-canvas`)**, **Three.js (`@react-three/fiber` / `@react-three/drei`)**, **Google GenAI SDK (`@google/genai` Interactions API — `gemini-4-argon`)**, and **Google Cloud Firestore**.

🔗 **Live Demo (Google Cloud Run)**: [https://mentors-platform-1001204402150.asia-northeast3.run.app](https://mentors-platform-1001204402150.asia-northeast3.run.app)

---

## Key Features & Architecture (Tracks A – D)

### Track A — Apple Watch Honeycomb Home & Expressive Rive (`.riv`) Avatar Engine
- **3D Mentos-Flip Honeycomb Launcher (`/`)**: Interactive hexagonal bubble cloud inspired by the Apple Watch launcher with cursor-proximity magnification, radial neighbor displacement, and smooth 3D Mentos-disc flip animations.
- **High-Performance Rive Character Engine**:
  - Local WASM runtime preloading (`/riv/rive.wasm`) with `immutable` caching.
  - Shared in-memory `ArrayBuffer` cache and request deduplication across 60+ concurrent mentor bubbles.
  - Real-time state machine transitions (`idle`, `thinking`, `talking`, `happy`, `sad`) driven by mentor conversation and quiz events.
- **Custom Mentor Builder**: Create personalized AI mentors with custom subjects, personas, accent colors, and `.riv` character files.

### Track B — Slack-Style Mentor Learning Studio & Adaptive Learning Materials (`/mentor/[id]`, `/room`)
- **Multi-Mentor Workspace & Curriculum Channels**: Switch seamlessly between specialized AI mentors (CS Professor, Vibe Coding, Basic Spanish, Dating Coach, Korean History, Algo Coach, AI Companion, Astro Guide) and structured course channels (`#course-1` to `#course-4`).
- **Proactive Mentor Nudges**: Mentors speak first upon entering a course channel and trigger contextual nudges (3D node point-outs, Socratic quizzes, and real-world tips).
- **Adaptive Learning Material Hub**:
  - Automatically diagnoses learner proficiency (`unassessed`, `beginner`, `intermediate`, `advanced`).
  - Generates interactive HTML/JS mini-previews inline inside chat messages (`3d_preview`, `mini_game`, `small_test`, `image_explanation`) and organizes them in a filterable right-hand collection sidebar.

### Track C — Gemini Interactions API (`gemini-4-argon`), 3D Spatial Viewer & Candy Economy
- **Gemini `gemini-4-argon` Agent (`/api/mentor/chat`, `/api/mentor/proactive-nudge`)**: Powered by the official `@google/genai` SDK (`ai.interactions.create`) with structured JSON outputs for mentor replies, learner level assessment, 3D scene specifications, and adaptive quizzes.
- **Interactive 3D Spatial Viewer (`Argon3DViewer`)**: Real-time Three.js canvas rendering dynamic 3D nodes, animated data packets, labels, orbit controls, and camera presets synchronized with each course topic.
- **Gamified Candy (`🍬`) Economy & Reward Shop**: Earn Candy by chatting with mentors and mastering quizzes, then unlock avatar skins, aura effects, and studio themes in the Candy Shop.

### Track D — Admin Analytics Dashboard & Cloud Firestore Persistence (`/admin`)
- **Learner Analytics & AI Diagnostic Reports (`/admin`, `/api/admin/learners`, `/api/admin/summary`)**: Track active learners, channel-level conversation histories, quiz accuracy, Candy balances, and AI-synthesized pedagogical summaries.
- **Hybrid Cloud Persistence (`src/lib/admin/adminStore.ts`)**: Persists learner profiles, chat logs, and quiz attempts in **Google Cloud Firestore** in production with an automatic local JSON fallback (`.data/admin-store.json`) for zero-config local development.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, Standalone Output), React 19, TypeScript 5.7
- **Styling & Motion**: Tailwind CSS 4, Framer Motion 12, Lucide Icons
- **2D / 3D Graphics**: Rive (`@rive-app/react-canvas`), Three.js (`@react-three/fiber`, `@react-three/drei`)
- **AI & Backend**: Google GenAI SDK (`@google/genai`), Next.js Route Handlers
- **Database & Cloud**: Google Cloud Firestore, Google Cloud Run, Docker (multi-stage build)

---

## Getting Started (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
USE_FIRESTORE=true
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Home (Honeycomb Launcher)**: `http://localhost:3000/`
- **Mentor Studio**: `http://localhost:3000/mentor/cs-professor`
- **Standalone Room Sandbox**: `http://localhost:3000/room`
- **Interactive Track Lab**: `http://localhost:3000/lab`
- **Admin Dashboard**: `http://localhost:3000/admin`

### 4. Run Verification & Type Checks
```bash
# TypeScript validation
npm run typecheck

# Run automated multi-track verification suite (Tracks A, B, C, D)
npm run test:tracks
```

---

## Deployment to Google Cloud Run

Make sure you have the [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk) installed and authenticated, then run:

```bash
npm run deploy:gcp
```

This executes `scripts/deploy-gcp.sh`, which builds the production container image via Cloud Build using the multi-stage `Dockerfile` and deploys it to Google Cloud Run (`asia-northeast3`).

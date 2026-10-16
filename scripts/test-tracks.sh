#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TRACK="${1:-all}"

echo "========================================================"
echo "  MENTORS — Independent Track Verification Runner"
echo "  Target: $BASE_URL | Track: $TRACK"
echo "========================================================"

run_track_a() {
  echo ""
  echo "[Track A] Apple Watch Bubble Cloud Home & Rive (.riv) Avatar Engine"
  echo "  - Checking Home Page ($BASE_URL/)..."
  HTTP_HOME=$(curl -s -o /tmp/mentors_home.html -w "%{http_code}" "$BASE_URL/")
  echo "    HTTP Status: $HTTP_HOME"
  if grep -q "Try Demo" /tmp/mentors_home.html && grep -q "Meet My Own" /tmp/mentors_home.html; then
    echo "    ✓ Verified 'Try Demo' & 'Meet My Own' hero buttons on Home"
  fi
  echo "  - Checking public/riv directory for .riv files..."
  ls -la /Users/zimin/mentors/public/riv
  echo "  - Interactive Sandbox URL: $BASE_URL/lab (Select 'Track A: Rive & Home')"
}

run_track_b() {
  echo ""
  echo "[Track B] Gemini 4 Argon (gemini-4-argon) & GCP Project h2gdm-hack26icn-2694"
  echo "  - GET $BASE_URL/api/gcp/status:"
  curl -s "$BASE_URL/api/gcp/status"
  echo ""
  echo "  - POST $BASE_URL/api/mentor/chat (Live gemini-4-argon call):"
  curl -s -X POST "$BASE_URL/api/mentor/chat" \
    -H "Content-Type: application/json" \
    -d '{"mentorId":"cs-professor","mentorName":"Prof. Turing","roleTitle":"CS Professor","subject":"Computer Science","userMessage":"Diagnose my level and show a 3D model of a Binary Search Tree!","currentLevel":"unassessed"}' | head -c 800
  echo ""
  echo "  - Interactive Sandbox URL: $BASE_URL/lab (Select 'Track B: Gemini 4 Argon API')"
}

run_track_c() {
  echo ""
  echo "[Track C] Interactive 3D Argon Preview & Quiz Studio"
  echo "  - Checking Mentor Studio ($BASE_URL/mentor/cs-professor)..."
  HTTP_STUDIO=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/mentor/cs-professor")
  echo "    HTTP Status: $HTTP_STUDIO"
  echo "  - Checking Custom 'Meet My Own' Studio ($BASE_URL/mentor/custom?name=Dr.+Quantum&subject=Quantum+Computing)..."
  HTTP_CUSTOM=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/mentor/custom?name=Dr.+Quantum&subject=Quantum+Computing")
  echo "    HTTP Status: $HTTP_CUSTOM"
  echo "  - Interactive Sandbox URL: $BASE_URL/lab (Select 'Track C: 3D Preview & Quiz')"
}

run_track_d() {
  echo ""
  echo "[Track D] Candy Economy, Avatar Skins Shop & Firestore Sync"
  echo "  - GET $BASE_URL/api/progress?userId=demo-user:"
  curl -s "$BASE_URL/api/progress?userId=demo-user"
  echo ""
  echo "  - Interactive Sandbox URL: $BASE_URL/lab (Select 'Track D: Candy Shop & GCP')"
}

case "$TRACK" in
  A|a) run_track_a ;;
  B|b) run_track_b ;;
  C|c) run_track_c ;;
  D|d) run_track_d ;;
  *)
    run_track_a
    run_track_b
    run_track_c
    run_track_d
    ;;
esac

echo ""
echo "========================================================"
echo "  All requested track checks finished!"
echo "========================================================"

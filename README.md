# Mentors Platform (3D Interactive AI Mentor Studio)

Next.js 15 + React 19 + Three.js (React Three Fiber) + Google GenAI (`gemini-4-argon` Interactions API) + Cloud Firestore 기반의 인터랙티브 3D AI 멘토 스튜디오 플랫폼입니다.

## 주요 기능 (Tracks A ~ D)

- **Track A (Front-end Studio & 2-Way Mentor Switch)**: 좌측 내비게이션과 하단 비교 위젯(`MentorCompareSelector`)이 양방향 동기화되는 멘토 스튜디오 UI 및 사탕(Candy) 보상 시스템
- **Track B (Gemini Interactions API)**: `@google/genai` SDK(`ai.interactions.create`) 및 JSON Schema 구조화 응답을 활용한 멘토별 맞춤 피드백, 3D 씬 생성, 퀴즈 출제 (`/api/mentor/interact`)
- **Track C (Interactive 3D Studio & Quiz Drawer)**: Three.js / `@react-three/fiber` 기반 실시간 3D 노드 뷰어(`Argon3DViewer`), 카메라 프리셋, 풀스크린 모드 및 사탕 적립 퀴즈 드로어(`QuizDrawer`)
- **Track D (Admin Studio & Cloud Firestore)**: 멘토 페르소나 CRUD, 기본 3D 씬/질문 편집, 실시간 API Playground 테스트 및 Cloud Firestore 영구 저장 (`/admin`, `/api/admin/mentors`)

## 로컬 실행 방법

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정 (`.env.example`을 복사하여 `.env.local` 생성):
   ```bash
   cp .env.example .env.local
   # .env.local 파일에 GEMINI_API_KEY 설정
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

4. 전체 트랙 통합 테스트 실행:
   ```bash
   npm run test:tracks
   ```

## GCP Cloud Run 배포

Google Cloud SDK(`gcloud`)가 설치 및 인증된 상태에서 아래 명령어로 Cloud Run에 원클릭 배포할 수 있습니다:

```bash
npm run deploy:gcp
```

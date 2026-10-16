# Rive (`.riv`) Profile Assets Directory

이 폴더(`/Users/zimin/mentors/public/riv`)에 멘토 에이전트용 `.riv` 파일들을 넣어주세요!

## 파일 네이밍 안내
- **`default-mentor.riv`** (또는 **`mentor.riv`**): 기본 공통 멘토 아바타 파일 (모든 멘토에 기본 적용 가능)
- 멘토별 개별 `.riv` 파일을 사용하려면 아래 파일명으로 넣으면 자동 매핑됩니다:
  - `cs-professor.riv` — CS Professor (컴퓨터 사이언스)
  - `physics-lab.riv` — Quantum Physicist (물리학 & 역학)
  - `bio-mentor.riv` — Molecular Biologist (생명과학 & 화학)
  - `algo-coach.riv` — Algorithm Coach (자료구조 & 알고리즘)
  - `math-wizard.riv` — Linear Algebra Wizard (선형대수 & 기하학)
  - `arch-sensei.riv` — Cloud Architect (시스템 & 클라우드 아키텍처)
  - `astro-guide.riv` — Astrophysics Guide (천체물리 & 우주과학)

## 지원하는 5가지 Rive 상태 (States)
런타임 래퍼(`RiveAvatar.tsx`)가 아래 5가지 상태를 State Machine Input(Boolean/Trigger/Number) 및 Animation 이름으로 모두 자동 인식합니다:
1. `idle` — 기본 대기 모션 (애플워치 홈 화면 및 기본 상태)
2. `happy` — 퀴즈 정답 / Candy 보상 획득 / 칭찬 모션
3. `sad` — 퀴즈 오답 / 격려 및 재도전 안내 모션
4. `thinking` — Gemini 4 Argon이 수준 진단 또는 3D 모델을 생성 중일 때의 모션
5. `talking` — 멘토가 설명/피드백을 발화 중일 때의 모션

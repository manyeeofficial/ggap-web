# GGAP Web

Next.js 15 App Router 기반 프론트엔드

## 기술 스택

- **Next.js** 15 / **React** 18.3 / **TypeScript** 5
- **Tailwind CSS** 4 + **shadcn/ui** (Radix UI)
- **Framer Motion** — 애니메이션
- **Axios** — API 클라이언트
- **React Hook Form** — 폼 관리
- **Recharts** — 차트
- **Sonner** — 토스트 알림

## 디렉토리 구조

```
src/
├── app/                   # Next.js App Router (페이지/레이아웃)
│   ├── components/        # 공통 컴포넌트
│   │   └── ui/            # shadcn/ui 컴포넌트
│   ├── studio/            # 스튜디오 기능
│   ├── playground/        # 무료 플레이그라운드
│   └── ...                # 각 라우트 page.tsx
└── lib/
    ├── api/               # API 클라이언트 (axios 래퍼)
    ├── types/             # TypeScript 타입 정의
    └── store/             # Zustand 상태 관리
```

## 주요 라우트

### 핵심

| 경로 | 설명 |
|---|---|
| `/` | 홈 (최근 분석 / 랭킹) |
| `/camera` | 사진 촬영 (미러/플래시/갤러리 업로드) |
| `/analysis-loading` | 피부 분석 진행 중 |
| `/analysis-result` | 피부 분석 결과 |
| `/history` | 분석 이력 (탭: 피부/관상/스튜디오) |
| `/my-skin` | 내 피부 정보 |
| `/onboarding` | 최초 가입 튜토리얼 |

### 스튜디오

| 경로 | 설명 |
|---|---|
| `/studio` | 스튜디오 메인 |
| `/studio/face-reading` | 관상보기 |
| `/studio/face-reading/loading` | 관상 분석 로딩 |
| `/studio/face-reading/result` | 관상 결과 |
| `/studio/age-simulation` | 나이 시뮬레이션 |
| `/studio/age-simulation/loading` | 나이 시뮬레이션 로딩 |
| `/studio/age-simulation/result` | 나이 시뮬레이션 결과 |
| `/studio/mbti-match` | MBTI 매칭 |
| `/studio/mbti-match/result` | MBTI 매칭 결과 |

### 플레이그라운드 (무료 체험)

| 경로 | 설명 |
|---|---|
| `/playground/face-reading` | 관상보기 무료 체험 |

### 설정 / 계정

| 경로 | 설명 |
|---|---|
| `/settings` | 설정 (프로필 / 계정 / 알림 / 약관) |
| `/profile-edit` | 프로필 편집 |
| `/skin-profile-edit` | 피부 프로필 편집 |
| `/auth/kakao` | 카카오 OAuth 콜백 |
| `/auth/naver` | 네이버 OAuth 콜백 |

## 환경 변수

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_BASE_URL=https://ggap.ai
NEXT_PUBLIC_APPLE_CLIENT_ID=your-apple-client-id
PROFILE=local
NAME=얼굴값
```

## 실행

```bash
npm install

# 개발 서버
npm run dev

# Turbopack 사용 (로컬 환경변수)
npm run serve

# 빌드
npm run build:local       # 로컬
npm run build:production  # 프로덕션

npm run start
```

기본 포트: **3000**

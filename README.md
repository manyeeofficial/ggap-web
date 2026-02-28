# GGAP Web

Next.js 15 App Router 기반 프론트엔드

## 기술 스택

- **Next.js** 15 / **React** 18.3 / **TypeScript** 5
- **Tailwind CSS** 4 + **shadcn/ui** (Radix UI)
- **Axios** — API 클라이언트
- **React Hook Form** — 폼 관리
- **Recharts** — 차트
- **Sonner** — 토스트 알림

## 디렉토리 구조

```
src/
├── app/                   # Next.js App Router (페이지/레이아웃)
│   ├── components/ui/     # shadcn/ui 컴포넌트
│   └── ...                # 각 라우트 page.tsx
└── lib/
    ├── api/               # API 클라이언트 (axios 래퍼)
    ├── types/             # TypeScript 타입 정의
    └── store/             # Context API 상태 관리
```

## 주요 라우트

| 경로 | 설명 |
|---|---|
| `/` | 홈 (최근 분석 / 랭킹) |
| `/camera` | 사진 촬영 |
| `/analysis-loading` | 분석 진행 중 |
| `/analysis-result` | 분석 결과 |
| `/history` | 분석 이력 |
| `/my-skin` | 내 피부 정보 |
| `/login`, `/register` | 인증 |
| `/mypage`, `/settings` | 마이페이지 / 설정 |

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

# Web — Next.js 15 App Router

TypeScript / React 18.3 / Tailwind v4 / Radix UI 기반 모바일 우선 프론트엔드.

> **영역별 작업 가이드**: [docs/README.md](docs/README.md) 가 메인 에이전트 라우터입니다.
> API 연동이 있으면 [docs/api-layer.md](docs/api-layer.md) → 해당 `docs/{area}.md`(서브 에이전트 문서) 순으로 읽으세요.

## 디렉토리

```
web/src/
├── app/                    # Next.js App Router
│   ├── components/         # 공통 컴포넌트
│   │   └── ui/             # shadcn/ui (Radix)
│   ├── studio/             # 유료 AI 기능 (관상/나이/MBTI)
│   ├── playground/         # 무료 체험 페이지
│   ├── camera/             # 사진 촬영 / 업로드
│   ├── loading/            # 통합 로딩 라우트 (/loading?type=...)
│   ├── analysis-result/    # 피부 분석 결과
│   ├── history/            # 분석 이력 (탭별)
│   └── ...                 # 각 라우트 page.tsx
├── lib/
│   ├── api/                # axios 래퍼 + 기능별 API 모듈
│   ├── types/              # 도메인 타입
│   └── store/              # Zustand 스토어
├── content/                # 정적 콘텐츠 (legal 등)
└── styles/                 # 글로벌 스타일
```

`@/*` 는 `src/*` 의 alias (`tsconfig.json` paths).

## 라우트 / 페이지 구조

- 모든 기능은 `entry → loading → result` 의 3페이지 패턴:
  - `/studio/{feature}/page.tsx` — 입력/CTA
  - `/loading?type={feature}&id=...` — 통합 로딩 라우트 (`src/app/loading/page.tsx`)
  - `/studio/{feature}/result/page.tsx` — 결과
- `app/components/BottomNavWrapper.tsx` — 5개 탭 하단 네비 (홈/이력/스튜디오/...)
- `app/components/AuthGuard.tsx` — 인증 필요 페이지 가드. `PUBLIC_PATHS` 에 비회원 접근 가능 경로 추가.

## API 호출 패턴

- `lib/api/client.ts` — 단일 axios 인스턴스. JWT 쿠키 자동 첨부, 만료 시 refresh, 401 재시도.
- 기능별 모듈: `lib/api/{feature}-api.ts` 에 `{feature}Api = { ... }` 객체 export.
- 새 API 모듈/타입 추가 시 **반드시 `lib/api/index.ts` 와 `lib/types/index.ts` 의 re-export 에 추가**.
- 비회원 API 패턴은 `client.ts` 의 `PUBLIC_API_PATTERNS` 배열에 등록 → 자동으로 인증 우회.
- BASE_URL: `process.env.NEXT_PUBLIC_API_URL` (없으면 `http://localhost:8080`).

## 인증

- Access/Refresh 토큰은 쿠키 (`Authorization`, `Refresh-token`) 로 보관.
- `withCredentials: true` 로 모든 요청 전송.
- `client.ts` 의 request interceptor 가 만료 30초 전부터 자동 refresh.
- 로그아웃 시 `deleteCookies()` 호출. `ggap.ai` 도메인 + 도메인 미지정 둘 다 삭제.

## 비회원-우선 플로우 (피부 분석)

- `/camera`, `/loading`, `/analysis-result` 는 `AuthGuard` PUBLIC_PATHS 에 포함.
- 미로그인 상태에서 `analyzeAnonymous()` → 응답의 `token` 을 `sessionStorage` 에 저장.
- 결과 페이지는 `?token=` URL 쿼리로 `getByIdWithToken(id, token)` 호출.
- 로그인 후 `claimAnalysis(id, token)` 로 본인에게 연결.

## 상태 관리

- 전역 상태는 `lib/store/` 의 Zustand 스토어 (`useMemberStore`, `useSkinProfileStore`).
- 페이지 간 일회성 데이터는 `sessionStorage` 사용.
- 폼은 `react-hook-form`.

## UI / 스타일

- Tailwind v4. shadcn/ui 컴포넌트는 `app/components/ui/` 에 위치 — 직접 수정 가능.
- 섹션 구분: `border-b border-gray-100`.
- 섹션 라벨: `text-xs font-semibold text-gray-400 uppercase tracking-wide`.
- 한국어 UI 가 기본. 다국어 처리 코드 추가 시 `lib/types/common.types.ts` 의 `Language` 와 정합.
- 애니메이션: Framer Motion (`motion` 패키지).
- 모바일 우선 — 모든 페이지가 모바일 viewport (~390px) 에서 정상 렌더되어야 함.

## 이미지 처리

- HEIC 입력은 클라이언트에서 `heic2any` 로 JPEG 변환 후 업로드 (`skin-analysis-api.ts` 의 `convertHeicToJpeg`).
- 결과 공유는 `html2canvas` 로 캡처.

## Next.js 설정 (`next.config.ts`)

- `reactStrictMode: true`
- `images.remotePatterns` 는 HTTPS 모든 호스트 허용 (S3, Gemini 생성 이미지 대응).
- 빌드 단계에서 ESLint/TypeScript 에러를 무시 (`ignoreDuringBuilds`, `ignoreBuildErrors`) — CI 에서 별도로 막지 않으므로 PR 전 로컬에서 `tsc` 수동 확인 권장.
- `optimizePackageImports: ['lucide-react', 'recharts']`.

## 스크립트

```bash
npm run dev                # next dev
npm run serve              # PROFILE=local + turbopack
npm run build              # production 빌드
npm run build:dev          # dev 환경 빌드
npm run build:production   # prod 환경 빌드
npm run lint               # next lint
```

## 작업 시 주의

- 새 기능 추가 시 `lib/api/{feature}-api.ts` + `lib/types/{feature}.types.ts` + 두 `index.ts` 갱신을 **세트로** 처리.
- 비회원 접근 가능 페이지를 추가하면 `AuthGuard.PUBLIC_PATHS` + (필요 시) `client.ts` 의 `PUBLIC_API_PATTERNS` 양쪽 모두 수정.
- 새 라우트 추가 시 `BottomNav` 노출 여부 검토.
- **문서 동반 갱신**: 영역 코드를 바꾸면 같은 작업에서 [docs/{area}.md](docs/) 도 함께 수정한다. API 연동이 바뀌면 [docs/api-layer.md](docs/api-layer.md) 와 라우터도 갱신.
- 코멘트/UI 문자열은 한국어.
- 과한 추상화 금지. 동일 패턴이 3번 이상 반복될 때만 컴포넌트 추출.

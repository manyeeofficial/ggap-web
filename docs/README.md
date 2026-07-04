# 웹 문서 — 메인 에이전트 라우터

> **역할**: 이 문서는 `web` 모듈에서 작업을 시작하는 **메인(오케스트레이터) 에이전트**용 라우터입니다.
> 요청을 받으면 ① 아래 영역 맵에서 해당 영역을 찾아 ② [api-layer.md](./api-layer.md)(데이터 연동 규칙)를 먼저 확인하고 ③ 해당 **서브 에이전트 문서**를 열어 작업하세요.
> 코드 전반 규칙은 루트 [CLAUDE.md](../CLAUDE.md) 참조.

## 사용법 (에이전트 흐름)

```
요청 → [영역 맵에서 영역 식별] → api-layer.md 확인(API 연동 시) → {area}.md 정독 → 코드 수정
```

- **API 연동이 있으면 먼저 읽을 것**: [api-layer.md](./api-layer.md) — axios 클라이언트, 토큰 자동 갱신, 공개 엔드포인트 등록(`PUBLIC_API_PATTERNS`), `lib/api`·`lib/types` 이중 re-export 규칙이 전부 여기 있음.
- 새 페이지를 비회원 접근 가능하게 하려면 `AuthGuard.PUBLIC_PATHS` + (필요 시) `PUBLIC_API_PATTERNS` 양쪽 수정 → [member-auth.md](./member-auth.md), [api-layer.md](./api-layer.md).
- 스튜디오 기능은 **entry → loading → result** 3페이지 패턴을 공유 → [studio-features.md](./studio-features.md).

## 영역 맵

| 영역 | 문서 | 주요 라우트 | 언제 읽나 |
|---|---|---|---|
| 피부 분석 플로우 | [skin-analysis-flow.md](./skin-analysis-flow.md) | `/camera`, `/loading?type=skin-analysis`, `/analysis-result` | 촬영·업로드(HEIC)·폴링·비회원 token 플로우 작업 |
| 스튜디오 기능 | [studio-features.md](./studio-features.md) | `/studio`, `/studio/{feature}` | 관상·나이·MBTI 페이지 작업 |
| 낯빛코드(페이스코드) | [face-code.md](./face-code.md) | `lib/face-reading`, 관상 결과 상단 | 관상 점수 재활용 "얼굴 MBTI" 12유형 레이어 작업 (호출 0) |
| 홈 | [home.md](./home.md) | `/` | 홈 구성, 랭킹 위젯, 트렌딩 상품 작업 |
| 분석 이력 | [history.md](./history.md) | `/history` | 탭별 이력(피부/관상/스튜디오) 작업 |
| 회원·인증 | [member-auth.md](./member-auth.md) | `/auth/*`, `/mypage/apple-callback` | 로그인·소셜·세션·AuthGuard·member store 작업 |
| API 레이어 | [api-layer.md](./api-layer.md) | `lib/api`, `lib/types` | **API 추가/수정 시 필독.** 클라이언트·토큰·공개 패턴 |
| UI 컴포넌트 | [ui-components.md](./ui-components.md) | `app/components`, `app/components/ui` | shadcn/ui, BottomNav, Tailwind 컨벤션 작업 |

## 디렉토리 구조 한눈에

```
web/src/
├── app/                    # App Router (라우트별 page.tsx)
│   ├── components/ (ui/)    # 공통 컴포넌트 + shadcn/ui(편집 가능)
│   ├── studio/              # 유료 AI 기능 (entry→result)
│   ├── loading/             # 통합 로딩 라우트 (/loading?type=...)
│   ├── camera/ analysis-*/  # 피부 분석 플로우
│   └── ...
└── lib/{api,types,store}/   # axios 래퍼 · 타입 · Zustand 스토어
```

## 로딩 공통 컴포넌트

- `app/studio/components/StudioLoadingPage.tsx`(`StudioLoadingPage` + `StudioLoadingConfig`)가 **모든 기능의 로딩 UI와 폴링 로직을 통합**한다.
  - 통합 라우트 `loading/page.tsx` (`/loading?type=...`): 피부 분석(initFn 방식) + 스튜디오·놀이터 5종(URL `?id=` 방식) 모두 처리
  - config 상세: `app/studio/components/loadingConfigs.tsx`
- 완료 시 `router.replace(resultPath)` 로 이동 → 히스토리에서 로딩 페이지 제거 → 뒤로가기 시 entry로 자연스럽게 복귀
- 결과 페이지 헤더 뒤로가기 버튼: 피부 분석 결과 → `/`, 스튜디오 기능 결과 → `/studio`

## PRD 연계

각 기능의 제품 기획(PRD)은 루트 `docs/features/{feature}.md` 에 있고, 해당 영역 문서 상단/하단에 링크되어 있음. PRD = "무엇을/왜", 이 문서들 = "어느 파일을/어떻게".

## 문서 관리 규칙

이 디렉토리(엔지니어링 문서)를 건강하게 유지하기 위한 규칙. 기획은 루트 `docs/` 와 분리해 운영한다.

1. **한 사실은 한 곳에** — `CLAUDE.md`=규칙, 이 `README.md`=라우터, `{area}.md`=상세, [api-layer.md](./api-layer.md)=API 공통, 루트 `docs/`=기획. 중복 금지, `[링크]` 로만 연결한다.
2. **코드는 복붙 말고 가리키기** — 긴 코드 블록 대신 `파일:줄` 포인터 + "왜". 변하기 쉬운 전체 목록보다 안정적인 구조·규칙·함정을 우선 기록.
3. **변경과 문서를 같은 작업에서** — 영역 코드를 바꾸면 해당 `{area}.md` 도 같은 커밋에서 갱신 (루트 [CLAUDE.md](../CLAUDE.md) 규칙).
4. **현황 동기화** — 라우트 추가/삭제는 라우터의 맵·"현재 비활성 주의" 절에 즉시 반영.
5. **주기적 청소** — 마일스톤마다 이 라우터 기준으로 죽은 링크·낡은 설명을 점검.

> **새 영역 추가 시**: ① `{area}.md` 를 기존 문서 템플릿(범위/라우트/핵심 파일/데이터 흐름/작업 레시피/주의/관련 문서)에 맞춰 작성 → ② 이 README 의 영역 맵 표에 행 추가 → ③ PRD 가 있으면 링크 연결.

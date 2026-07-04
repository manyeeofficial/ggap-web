# 홈 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **홈 페이지** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **PRD**: 없음
> **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md), API 레이어 [api-layer.md](./api-layer.md)

## 범위

- 담당 라우트/디렉토리: `app/page.tsx`, `app/components/BottomNavWrapper.tsx`, `app/components/TrendingProductsWidget.tsx`, `app/components/AuthGuard.tsx`
- 한 줄 요약: 앱의 진입점. Hero CTA → 랭킹 위젯 → 추천 상품 → 최근 분석 목록으로 구성되며, 비로그인 상태에서도 셀카 분석을 바로 시작할 수 있다.

## 라우트 / 페이지

| 경로 | 파일 | 설명 |
|---|---|---|
| `/` | `app/page.tsx` | 홈 메인 페이지 (단일 파일) |

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/page.tsx` | 전체 홈 구성. Hero, 촬영 가이드, 스튜디오 배너, 랭킹 위젯, 추천 상품, 최근 분석 섹션 포함 |
| `app/components/BottomNavWrapper.tsx` | 5탭 하단 네비게이션 (홈/스튜디오/내 스킨/기록/설정). `bottomNavPages` 배열에 있는 경로에서만 노출. 스크롤 다운 시 자동 숨김 |
| `app/components/TrendingProductsWidget.tsx` | 트렌딩 상품 가로 스크롤 위젯. `productApi.getTrending()` 호출 (비회원 포함 공개 API) |
| `app/components/AuthGuard.tsx` | `PUBLIC_PATHS` 관리. `/` 포함 → 홈은 비로그인 접근 가능 |
| `app/components/SocialLoginSheet.tsx` | 로그인 유도 바텀시트. 홈에서 랭킹/최근분석 잠금 오버레이의 "로그인하기" 버튼에서 사용 |

## 홈 구성 (위에서 아래 순서)

1. **Hero 배너** (`bg-gradient-to-br from-indigo-600 to-purple-700`): LIVE 뱃지 + 서비스 이용자 카운트 + "셀카 촬영하기" CTA. 비로그인 시 "로그인 없이 바로 시작" 말풍선 노출.
2. **촬영 가이드**: 3가지 팁 (정면/자연광/안경 제거).
3. **스튜디오 배너**: `/studio` 이동 버튼. 관상·MBTI 매칭·나이 시뮬 라벨 표시.
4. **랭킹 위젯** (`나의 랭킹`): 로그인 상태에서 `rankingApi.getMyRanking()` 호출 → 전체 / 동성·또래 상위 X% 카드 2개 표시. 비로그인 시 블러 + 잠금 오버레이.
5. **트렌딩 상품** (`TrendingProductsWidget`): `productApi.getTrending()` — 공개 API. 가로 스크롤, 어필리에이트 링크.
6. **최근 분석** (`최근 분석`): 로그인 상태에서 `skinAnalysisApi.getList(0, 3)` + 이전 분석 대비 얼굴값 변화(▲▼). 비로그인 시 블러 + 잠금 오버레이.

## 데이터 흐름 (API 연동)

1. `statsApi.getStats()` — 서비스 총 분석 건수 (공개). 카운트업 애니메이션 후 7초마다 +1 자동 증가.
2. `rankingApi.getMyRanking()` → `GET /ranking/me` — 로그인 회원만 호출. `RankingResult.overall.topPercent` 등 표시.
3. `skinAnalysisApi.getList(0, 3)` → `GET /skin-analysis?page=0&size=3` — 로그인 회원만. `status === 'COMPLETED'` 필터링 후 최대 3개.
4. `productApi.getTrending()` — 비회원 포함 공개. `TrendingProductsWidget` 내부에서 호출.

## BottomNavWrapper 상세

- 5탭: 홈(`/`) / 스튜디오(`/studio`) / 내 스킨(`/my-skin`) / 기록(`/history`) / 설정(`/settings`)
- 노출 조건 (`bottomNavPages`): `'/', '/studio', '/my-skin', '/history', '/settings', '/analysis-result'` — 이 경로들에서만 하단 탭 표시.
- 스크롤 방향 감지: `data-scroll-dir` 속성 + `translate-y-full` 클래스로 스크롤 다운 시 숨김.
- 최대 너비 `max-w-[430px]` 중앙 정렬 — 모바일 우선 레이아웃.

## 작업 레시피

- **Hero 문구/카운트 오프셋 수정**: `app/page.tsx` 상단 `COUNT_OFFSET`, `COUNT_DAILY_RATE` 상수.
- **랭킹 위젯 표시 항목 변경**: `app/page.tsx` 내 `ranking.overall`, `ranking.byGenderAge ?? ranking.byGender ?? ranking.byAge` 로직 수정.
- **홈에 새 섹션 추가**: `app/page.tsx`에 직접 섹션 추가. 섹션 구분선은 `border-b border-gray-100`, 섹션 라벨은 `text-sm font-semibold text-gray-400 uppercase tracking-wide` 사용.
- **하단 탭 노출 경로 추가**: `BottomNavWrapper.tsx`의 `bottomNavPages` 배열에 경로 추가.
- **새 탭 추가**: `BottomNavWrapper.tsx`의 `tabs` 배열 수정.

## 주의사항

- `handleAnalysisStart()`는 로그인 체크 없이 `/camera`로 바로 이동한다 (비회원-우선 플로우). 로그인 분기를 추가하지 말 것.
- 랭킹 위젯의 `formatPercent()`는 1% 미만이면 소수점 1자리, 이상이면 정수로 표시한다.
- 최근 분석 목록의 얼굴값 변화(`change`)는 배열 index 기반으로 이전 항목과 비교한다. `getList`는 최신순 정렬을 가정한다.
- `TrendingProductsWidget`은 상품이 0개이면 아무것도 렌더하지 않는다 (`return null`).

## 관련 문서

- [skin-analysis-flow.md](./skin-analysis-flow.md) — 촬영 → 분석 플로우 상세
- [studio-features.md](./studio-features.md) — 스튜디오 기능 상세
- `lib/api/ranking-api.ts` — 랭킹 API
- `lib/api/stats-api.ts` — 서비스 통계 API
- `lib/api/product-api.ts` — 트렌딩 상품 API

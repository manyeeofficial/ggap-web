# 기록 (History) — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **분석 히스토리 페이지** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **PRD**: 없음
> **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md), API 레이어 [api-layer.md](./api-layer.md)

## 범위

- 담당 라우트/디렉토리: `app/history/page.tsx`
- 한 줄 요약: 회원의 모든 분석 이력을 5개 탭으로 분류하여 표시. 탭별로 독립적인 API 호출 + 목록 렌더링.

## 라우트 / 페이지

| 경로 | 파일 | 설명 |
|---|---|---|
| `/history` | `app/history/page.tsx` | 5탭 기록 페이지. 탭 전환 시 해당 탭 컴포넌트가 마운트되어 API 호출 |

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/history/page.tsx` | 전체 히스토리 페이지 단일 파일. 5개 탭 컴포넌트(`SkinAnalysisTab`, `FaceReadingTab`, `FaceCodeTab`, `MbtiMatchTab`, `AgeSimulationTab`) + 공통 유틸(`formatDate`, `getMonthGroup`, `LoadingSkeleton`, `EmptyState`, `DeleteMenu`) 포함 |

## 탭 구성

| 탭 ID | 탭 라벨 | 컴포넌트 | API 모듈 | 상세 결과 이동 경로 |
|---|---|---|---|---|
| `skin` | 피부 분석 | `SkinAnalysisTab` | `skinAnalysisApi.getList()` | `/analysis-result?id={id}` |
| `face-reading` | 관상 | `FaceReadingTab` | `faceReadingApi.getList()` | `/studio/face-reading/result?id={id}` |
| `face-code` | 낯빛코드 | `FaceCodeTab` | `faceCodeApi.getList()` | `/studio/face-code/result?id={id}` |
| `mbti-match` | MBTI x 얼굴 | `MbtiMatchTab` | `mbtiMatchApi.getList()` | `/studio/mbti-match/result?id={id}` |
| `age-simulation` | 나이 시뮬 | `AgeSimulationTab` | `ageSimulationApi.getList()` | `/studio/age-simulation/result?id={id}` |

## 탭별 데이터 흐름

### 피부 분석 탭 (`SkinAnalysisTab`)

1. `skinAnalysisApi.getList()` → `GET /skin-analysis?page=0&size=20`
2. `status === 'COMPLETED'` 필터링
3. `getMonthGroup(createdAt)` 로 월별 그룹핑 (`이번 달` / `지난 달` / `YYYY년 M월`)
4. 항목 클릭 → `/analysis-result?id={id}`
5. 삭제: `skinAnalysisApi.delete(id)` → `DELETE /skin-analysis/{id}`

### 관상 탭 (`FaceReadingTab`)

1. `faceReadingApi.getList()` → `GET /face-reading`
2. `status === 'COMPLETED'` 필터링
3. 항목에 `shareCaption` 우선 표시, 없으면 `FACE_READING_TYPE_LABEL[overallType]`
4. 항목 클릭 → `/studio/face-reading/result?id={id}`
5. 삭제: `faceReadingApi.delete(id)` → `DELETE /face-reading/{id}`

### 낯빛코드 탭 (`FaceCodeTab`)

1. `faceCodeApi.getList()` → `GET /face-code`
2. `status === 'COMPLETED'` 필터링
3. `faceCode` 코드값(예: '차진또') + `meta.nickname` 표시
4. 항목 클릭 → `/studio/face-code/result?id={id}`
5. 삭제: `faceCodeApi.delete(id)` → `DELETE /face-code/{id}`

### MBTI x 얼굴 탭 (`MbtiMatchTab`)

1. `mbtiMatchApi.getList()` → `GET /mbti-match`
2. `status === 'COMPLETED'` 필터링
3. `mbti` + `matchLevel` → `MATCH_LEVEL_LABEL` + `overallMatchRate` 표시
4. 항목 클릭 → `/studio/mbti-match/result?id={id}`
5. 삭제: `mbtiMatchApi.delete(id)` → `DELETE /mbti-match/{id}`

### 나이 시뮬레이션 탭 (`AgeSimulationTab`)

1. `ageSimulationApi.getList()` → `GET /age-simulation`
2. `status === 'COMPLETED'` 필터링
3. `targetAge`세 시뮬레이션 + `wittyOneLiner` 표시
4. 항목 클릭 → `/studio/age-simulation/result?id={id}`
5. 삭제: `ageSimulationApi.delete(id)` → `DELETE /age-simulation/{id}`

## 공통 UI 패턴

- **썸네일**: 60×60 `rounded-2xl`. 이미지 URL 없으면 그라디언트 + 이모지 fallback.
- **삭제 메뉴**: 각 항목 우상단 `MoreVertical` 버튼 → `DropdownMenu` → "삭제" (rose 색상). 클릭 전파 차단 `e.stopPropagation()`.
- **인증 오류**: `UnauthenticatedError` 인스턴스이면 toast 생략 (이미 다른 곳에서 처리).
- **빈 상태** (`EmptyState`): emoji + 제목 + 설명 + CTA 버튼. 탭별로 이동 경로가 다름.
- **월별 그룹** (피부 분석만): `getMonthGroup()` 기준 — 이번 달 / 지난 달 / `YYYY년 M월`.

## 작업 레시피

- **새 탭 추가**: `TAB_LABELS` 배열에 `{ id, label }` 항목 추가 → 해당 탭 컴포넌트 작성 → `{activeTab === 'new-tab' && <NewTab />}` 추가.
- **항목 삭제 기능 추가**: 각 탭 컴포넌트의 `handleDelete` 함수 패턴 참고 (낙관적 UI 업데이트 + toast).
- **`DeleteMenu`는 모듈 스코프에 정의**: 컴포넌트 내부에 정의하면 리렌더 시 리마운트 발생. 반드시 최상위 스코프에 유지.
- **날짜 포맷 변경**: `formatDate()` / `getMonthGroup()` 함수 수정. 두 함수 모두 `history/page.tsx` 상단에 있음.

## 주의사항

- 탭 전환 시마다 컴포넌트가 마운트되어 API를 다시 호출한다. 별도 캐싱 없음.
- 피부 분석 탭의 얼굴값 변화(`change`) 계산은 배열 index 기반 (인접 항목 비교). `getList()`가 최신순 정렬을 반환한다고 가정.
- `UnauthenticatedError`는 `lib/api/client.ts`에서 import. 인증 오류를 구분하기 위해 반드시 이 타입으로 체크할 것.
- `history/page.tsx`는 단일 파일이 길다. 수정 시 목표 탭의 컴포넌트 함수를 정확히 찾아 수정.
- 탭 바는 `overflow-x-auto scrollbar-none`으로 가로 스크롤 처리. 탭 라벨이 길면 줄임 표기 사용 가능(예: "나이 시뮬").

## 관련 문서

- [skin-analysis-flow.md](./skin-analysis-flow.md) — 피부 분석 결과 페이지 상세
- [studio-features.md](./studio-features.md) — 각 스튜디오 기능 result 페이지 상세
- [face-code.md](./face-code.md) — 낯빛코드 상세
- `lib/api/face-reading-api.ts`, `lib/api/face-code-api.ts`, `lib/api/mbti-match-api.ts`, `lib/api/age-simulation-api.ts`

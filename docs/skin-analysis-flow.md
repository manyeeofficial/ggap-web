# 피부 분석 플로우 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **피부 분석 전체 플로우** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **PRD**: [../../docs/features/skin-analysis.md](../../docs/features/skin-analysis.md)
> **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md), API 레이어 [api-layer.md](./api-layer.md)

## 범위

- 담당 라우트/디렉토리: `app/camera/`, `app/loading/` (통합 로딩), `app/analysis-result/`
- 한 줄 요약: 셀카 촬영 → 비동기 분석 → 결과 표시. 비회원도 로그인 없이 전 과정 이용 가능.

## 라우트 / 페이지

| 경로 | 파일 | 설명 |
|---|---|---|
| `/camera` | `app/camera/page.tsx` | 카메라 스트림 + 갤러리 업로드. `?returnTo=` 쿼리로 스튜디오 기능 재사용 가능 |
| `/loading?type=skin-analysis` | `app/loading/page.tsx` | 통합 로딩 라우트. 피부 분석은 `SkinAnalysisLoading` 서브컴포넌트가 업로드+폴링+진행 애니메이션 처리 |
| `/analysis-result` | `app/analysis-result/page.tsx` (Shell) + `AnalysisResultContent.tsx` | 분석 결과 표시. `?id=&token=` 쿼리 지원 |

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/camera/page.tsx` | 카메라 스트림, 미러링, 플래시, 캡처, HEIC→JPEG 변환, `sessionStorage` 저장 |
| `app/loading/page.tsx` | 통합 로딩 라우트. `?type=skin-analysis` 시 `SkinAnalysisLoading`이 `capturedImage` 읽기·로그인 여부 분기·initFn 구성 후 `StudioLoadingPage`에 위임 |
| `app/studio/components/loadingConfigs.tsx` | 스튜디오/놀이터 5개 기능의 정적 config 맵 |
| `app/analysis-result/AnalysisResultContent.tsx` | `?id`, `?token` 파라미터 읽기, 결과 렌더, 비회원 블러/잠금 오버레이, SocialLoginSheet |
| `lib/api/skin-analysis-api.ts` | `skinAnalysisApi` 객체 — 아래 데이터 흐름 참고 |
| `lib/types/skin-analysis.types.ts` | `SkinAnalysis`, `AnonymousSkinAnalysis`, `SkinAnalysisStatus`, `PersonalColor` 등 |
| `app/components/AuthGuard.tsx` | `PUBLIC_PATHS`에 `/camera`, `/loading`, `/analysis-result` 포함 → 비회원 접근 허용 |

## 데이터 흐름 (API 연동)

### 비회원-우선 플로우

1. `/camera`: 캡처/업로드 시 `sessionStorage.setItem('capturedImage', dataUrl)` → `/analysis-loading` 이동
2. `/loading?type=skin-analysis`:
   - `useMemberStore` 로 로그인 여부 확인
   - 로그인 상태: `skinAnalysisApi.analyze(file)` → `POST /skin-analysis`
   - 비로그인 상태: `skinAnalysisApi.analyzeAnonymous(file)` → `POST /skin-analysis/anonymous`
   - `StudioLoadingConfig.initFn` 에서 upload 처리 후 `{ id, token? }` 반환
   - 2,500ms 간격으로 `skinAnalysisApi.getStatus(id)` 폴링 (`GET /skin-analysis/{id}/status`)
   - `COMPLETED` → `router.replace('/analysis-result?id={id}&token={token}')` 이동 (히스토리에서 로딩 페이지 제거)
3. `/analysis-result`:
   - `token` 존재 시 `skinAnalysisApi.getByIdWithToken(id, token)` → `GET /skin-analysis/{id}?token=`
   - `token` 없을 시 `skinAnalysisApi.getById(id)` → `GET /skin-analysis/{id}`
   - 비회원(`isAnonymous=true`)이면 상세 탭 블러 + 로그인 유도 배너 표시
   - 로그인 성공 후 `skinAnalysisApi.claimAnalysis(id, token)` → `POST /skin-analysis/{id}/claim?token=`

### HEIC 변환

- `camera/page.tsx`: 파일 선택 시 HEIC/HEIF이면 `heic2any` 동적 import → JPEG 변환
- `skin-analysis-api.ts`: `convertHeicToJpeg()` 내부 유틸 — 확장자 `.heic`인 경우에만 변환

### 진행 바 애니메이션

- `app/studio/components/StudioLoadingPage.tsx`의 공통 로직 사용 (`requestAnimationFrame` 기반 지수 수렴 `MAX=88` + 랜덤 점프)
- 4개 단계 아이콘+텍스트: 이미지 업로드 중 / 피부 특징 분석 중 / 피부 타입 판별 중 / 결과 정리 중
- 4초마다 `tips` 배열 순환. `initFn` 없이 upload가 진행되는 동안에도 애니메이션이 먼저 시작되어 자연스러운 UX 제공

## 작업 레시피

- **결과 페이지에 새 섹션 추가**: `AnalysisResultContent.tsx`의 `TabsContent value="analysis"` 또는 `"details"` 수정. `SkinAnalysis` 타입에 필드 추가 시 `skin-analysis.types.ts`도 갱신.
- **비회원 잠금 범위 변경**: `AnalysisResultContent.tsx` 내 `isAnonymous` 분기 조건 수정. 블러는 `blur-md pointer-events-none` 클래스로 처리.
- **폴링 간격 변경**: `loading/page.tsx` 의 `SkinAnalysisLoading` 내 `config.pollInterval` 값 (현재 `2500`ms). 공통 컴포넌트가 이 값을 사용.
- **카메라 기능 추가**: `camera/page.tsx` 단일 파일에 모든 카메라 로직 포함.
- **비회원 → 회원 연결 흐름 수정**: `pendingAnalysisClaim` localStorage key + `claimAnalysis()` API 연동 확인.

## 주의사항

- `/camera`는 `?returnTo=` 쿼리를 받으면 `sessionStorage.setItem('faceReadingImage', ...)` 키로 이미지를 저장하고 `returnTo` 경로로 이동한다. 피부 분석 플로우와 키가 다르므로(`capturedImage` vs `faceReadingImage`) 혼동 주의.
- `AuthGuard.PUBLIC_PATHS`와 `client.ts`의 `PUBLIC_API_PATTERNS` 양쪽이 맞아야 한다. 비회원 API 패턴이 누락되면 401이 발생한다.
- 비회원 응답(`AnonymousSkinAnalysis`)은 `token` 필드가 있고, 회원 응답(`SkinAnalysis`)에는 없다. `analysis-loading` 의 `initFn` 에서 `'token' in result` 체크로 분기해 `{ id, token? }` 반환.
- 분석 당 하루 5회 제한 — 초과 시 백엔드 429. 프론트에서 `err.response?.data?.message` 를 toast로 표시.

## 관련 문서

- `lib/api/skin-analysis-api.ts` — API 함수 전체 목록
- `lib/types/skin-analysis.types.ts` — 도메인 타입
- `app/components/AuthGuard.tsx` — PUBLIC_PATHS 관리
- `app/components/SocialLoginSheet.tsx` — 비회원 로그인 유도 바텀시트

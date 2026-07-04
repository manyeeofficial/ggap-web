# 스튜디오 기능 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **스튜디오 AI 기능** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **PRD**: 없음 (각 기능 PRD는 아래 관련 문서 참고)
> **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md), API 레이어 [api-layer.md](./api-layer.md)

## 범위

- 담당 라우트/디렉토리: `app/studio/`
- 한 줄 요약: 로그인 필수의 유료 AI 기능 허브. 각 기능은 entry → loading → result 3페이지 패턴으로 구성.

## 라우트 / 페이지

| 경로 | 파일 | 설명 |
|---|---|---|
| `/studio` | `app/studio/page.tsx` | 기능 카드 허브. 비로그인 시 `SocialLoginSheet` 자동 노출 |
| `/studio/face-reading` | `app/studio/face-reading/page.tsx` | 관상보기 entry. 최근 분석 사진 재사용 또는 신규 촬영/업로드 |
| `/loading?type=face-reading&id=` | `app/loading/page.tsx` | 통합 로딩 라우트 — face-reading 설정 참조 |
| `/studio/face-reading/result` | `app/studio/face-reading/result/page.tsx` | 관상 결과. 초년/중년/말년/총운 탭, 인생 그래프(recharts LineChart), 오행 분석 |
| `/studio/age-simulation` | `app/studio/age-simulation/page.tsx` | 나이 시뮬레이션 entry. 목표 나이 선택 |
| `/loading?type=age-simulation&id=` | `app/loading/page.tsx` | 통합 로딩 라우트 — age-simulation 설정 참조 |
| `/studio/age-simulation/result` | `app/studio/age-simulation/result/page.tsx` | 나이 시뮬 결과 (S3 생성 이미지) |
| `/studio/mbti-match` | `app/studio/mbti-match/page.tsx` | MBTI 매칭 entry. MBTI 4자리 입력 |
| `/loading?type=mbti-match&id=` | `app/loading/page.tsx` | 통합 로딩 라우트 — mbti-match 설정 참조 |
| `/studio/mbti-match/result` | `app/studio/mbti-match/result/page.tsx` | MBTI 매칭 결과 |

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/studio/page.tsx` | 허브 카드 목록. `features` 배열로 노출 카드 정의 |
| `app/studio/components/StudioLoadingPage.tsx` | 공용 로딩 컴포넌트. `StudioLoadingConfig` 인터페이스로 설정 주입 |
| `app/studio/components/loadingConfigs.tsx` | 스튜디오 4종 + 놀이터 1종 정적 config 맵 (`LOADING_CONFIGS`) |
| `app/loading/page.tsx` | 통합 로딩 라우트. `?type=` 파라미터로 config 분기 |
| `app/studio/face-reading/page.tsx` | 생년월일 선택 단계(`BirthdateStep`) 포함. 카메라 `returnTo=/studio/face-reading` |
| `app/studio/face-reading/result/page.tsx` | `recharts LineChart` 인생 그래프, 오행(OhaengData) 섹션, 부위별 ScoreBar |
| `lib/api/face-reading-api.ts` | `faceReadingApi` — create/getStatus/getById/getList/delete |

## 기능 → 라우트 → API 모듈 매핑

| 기능 | entry 경로 | loading 경로 | result 경로 | lib/api 모듈 | 활성 여부 |
|---|---|---|---|---|---|
| 관상보기 | `/studio/face-reading` | `/loading?type=face-reading&id=` | `/studio/face-reading/result` | `face-reading-api.ts` → `faceReadingApi` | 활성 |
| 낯빛코드 | `/studio/face-code` | `/loading?type=face-code&id=` | `/studio/face-code/result` | `face-code-api.ts` → `faceCodeApi` | 활성 ([face-code.md](./face-code.md)) |
| MBTI 매칭 | `/studio/mbti-match` | `/loading?type=mbti-match&id=` | `/studio/mbti-match/result` | `mbti-match-api.ts` → `mbtiMatchApi` | 활성 |
| 나이 시뮬레이션 | `/studio/age-simulation` | `/loading?type=age-simulation&id=` | `/studio/age-simulation/result` | `age-simulation-api.ts` → `ageSimulationApi` | 활성 |

## entry → loading → result 패턴

모든 스튜디오 기능은 다음 3단계를 따른다.

1. **entry** (`/studio/{feature}/page.tsx`): 사진 선택 또는 옵션 입력 → API 생성 요청 → 응답의 `id`를 URL 쿼리로 통합 로딩 페이지 이동 (`router.push('/loading?type={feature}&id={id}')`)
2. **loading** (`/loading?type={feature}&id={id}` — `app/loading/page.tsx`): `StudioLoadingPage` 컴포넌트 + `loadingConfigs.tsx`의 config로 폴링 + 애니메이션 처리. 2,000ms 간격 폴링. `COMPLETED` → `router.replace(resultPath)` 로 result 이동 (히스토리에서 로딩 페이지 제거, 뒤로가기 시 entry로 이동), `FAILED` → entry 이동.
3. **result** (`/studio/{feature}/result/page.tsx`): `?id=` 쿼리로 API 데이터 로드 → 결과 렌더링. 헤더 뒤로가기 버튼은 `/studio`로 이동.

### 통합 로딩 라우트

`app/loading/page.tsx` (`/loading?type=...`) 가 모든 기능의 로딩 UI를 단일 라우트에서 처리한다. `?type=` 파라미터로 `loadingConfigs.tsx`의 `LOADING_CONFIGS` 맵에서 config를 조회하고, `skin-analysis`는 회원 상태 의존 initFn이 필요해 별도 서브컴포넌트(`SkinAnalysisLoading`)로 분기한다. 새 기능 추가 시 `loadingConfigs.tsx`에 항목을 추가하고 entry 페이지에서 `/loading?type={key}&id={id}`로 이동한다.

### `StudioLoadingConfig` 주요 필드

- `gradient`: 배경 그라디언트 클래스
- `steps`: 4개 단계 아이콘 + 텍스트
- `tips`: 팁 문자열 배열 (4초 로테이션)
- `discoveries`: "방금 발견했어요" 카드 텍스트 배열
- `showFaceScan`: true이면 얼굴 스캔 SVG 비주얼 사용
- `progressMode`: `'fast'`(기본) / `'slow'`(이미지 생성 기능용)
- `pollFn`: `(id: number) => Promise<{ status; errorMessage? }>` — 기능별 상태 조회 함수
- `resultPath`: `(id: number, token?: string) => string` — 완료 시 이동할 URL (`router.replace` 로 이동해 히스토리에서 로딩 페이지 제거)
- `initFn` (선택): `() => Promise<{ id: number; token?: string }>` — URL `?id=` 없이 마운트 시 직접 API 호출로 ID를 획득하는 경우. 피부 분석 로딩(`analysis-loading`)에서 사용. 에러 시 initFn 내부에서 toast + router.replace 처리 후 throw.
- `pollInterval` (선택): 폴링 간격(ms), 기본 2000. 피부 분석은 2500.

## 작업 레시피

- **새 스튜디오 기능 추가**:
  1. `lib/api/{feature}-api.ts` + `lib/types/{feature}.types.ts` 생성 후 양쪽 `index.ts` 등록
  2. `app/studio/{feature}/` 아래 `page.tsx` / `result/page.tsx` 생성 (loading 폴더는 불필요)
  3. `app/studio/components/loadingConfigs.tsx`의 `LOADING_CONFIGS`에 항목 추가
  4. entry page에서 `router.push('/loading?type={key}&id=${result.id}')` 로 이동
  5. `studio/page.tsx` `features` 배열에 카드 추가
- **관상 결과 섹션 수정**: `face-reading/result/page.tsx`. 오행 데이터는 `result.ohaengData` 필드. 결과 최상단의 **낯빛코드 카드**는 별도 레이어 → [face-code.md](./face-code.md).
- **로딩 메시지/팁 수정**: `studio/components/loadingConfigs.tsx`의 `LOADING_CONFIGS[key].tips` 또는 `steps` 배열.

## 주의사항

- 스튜디오 모든 기능은 **로그인 필수**. `studio/page.tsx`에서 `!member` 이면 `SocialLoginSheet` 오픈. `AuthGuard.PUBLIC_PATHS`에 `/studio` 는 포함되어 있으나, entry 페이지 자체가 로그인 체크를 한다.
- 관상보기 entry는 생년월일 입력 단계(`BirthdateStep`)가 있다. 회원에게 이미 `birthdate`가 저장되어 있으면 이 단계를 건너뛴다.
- 관상보기 `/camera?returnTo=/studio/face-reading` 로 이동하면 이미지가 `sessionStorage.setItem('faceReadingImage', ...)` 키로 저장된다. 피부 분석의 `capturedImage`와 다른 키임을 주의.
- 크레딧 부족 시 403 응답 → `'크레딧이 부족합니다'` toast.
- `loadingConfigs.tsx`의 `LOADING_CONFIGS`에 없는 type이 오면 `null` 렌더 (빈 화면). 새 기능 추가 시 반드시 항목을 추가할 것.

## 관련 문서

- `app/studio/components/StudioLoadingPage.tsx` — 공용 로딩 컴포넌트 인터페이스
- `app/studio/components/loadingConfigs.tsx` — 스튜디오/놀이터 기능별 LOADING_CONFIGS
- `app/loading/page.tsx` — 통합 로딩 라우트
- PRD: `../../docs/features/face-reading.md`
- PRD: `../../docs/features/age-simulation.md`
- PRD: `../../docs/features/mbti-match.md`

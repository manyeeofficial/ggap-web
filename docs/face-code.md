# 낯빛코드 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **낯빛코드(face-code)** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **PRD**: [../../docs/features/face-code.md](../../docs/features/face-code.md)
> **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md), 관련 [studio-features.md](./studio-features.md), [api-layer.md](./api-layer.md)

## 범위
- 담당: `app/studio/face-code/**`, `lib/face-code/`, `lib/api/face-code-api.ts`, `lib/types/face-code.types.ts`
- 한 줄 요약: 얼굴 인상을 3축 12유형 코드로 푸는 **독립 스튜디오 콘텐츠**. 백엔드 `/face-code` 가 산출·저장하고, 프론트는 응답을 렌더(운세 미노출).

## 산출 위치 — 백엔드 canonical
- 코드/메타/축점수는 **백엔드가 산출·저장**(서버 [face-code.md](../../server/docs/face-code.md)). 프론트는 `/face-code` 응답(`faceCode`·`meta`·`axes`·`lowConfidence`)을 **그대로 렌더**(재산출 없음).
- `lib/face-code/faceCode.ts` 의 `deriveFaceCode`/`parseFaceCode`/`FACE_CODE_META` 는 **관상 결과 뱃지(코드 문자열만 받는 경우)** 와 레거시 fallback 전용. 독립 결과 페이지는 사용하지 않는다.
- ⚠️ `deriveFaceCode`(TS) ↔ `FaceCodeCalculator`(Kotlin, canonical) 동일 알고리즘 유지(드리프트 금지).

## 핵심 파일
| 파일 | 역할 |
|---|---|
| `lib/types/face-code.types.ts` | API 응답 타입 (`FaceCodeAnalysis`, `FaceCodeMeta`, `FaceCodeAxes`) |
| `lib/api/face-code-api.ts` | `faceCodeApi` (create/getStatus/getById/getList/delete) |
| `lib/face-code/faceCode.ts` | 표시 헬퍼 `gradientForCode`·`characterFor` + (관상용) `deriveFaceCode`/`FACE_CODE_META` |
| `app/studio/face-code/page.tsx` | entry — 사진 선택(최근분석/카메라/업로드) → `faceCodeApi.create` |
| `app/studio/face-code/result/page.tsx` | 결과 — 뱃지+코드해독+성격프로필+궁합+관상 CTA |
| `app/studio/face-code/components/FaceCodeBadge.tsx` | 코드 뱃지(캐릭터 이모지+코드+별명+3축) |
| `app/studio/[feature]/loading/page.tsx` | `CONFIGS['face-code']` (공용 로딩, 백트래킹으로 `/studio/face-code/loading` 매칭) |
| `app/studio/page.tsx` | 스튜디오 허브 "낯빛코드" 카드 |

## 데이터 흐름
1. entry에서 사진 선택 → `faceCodeApi.create({ skinAnalysisId? | image })` → `/studio/face-code/loading?id=` 이동
2. 로딩 페이지가 `faceCodeApi.getStatus(id)` 폴링 → COMPLETED 시 `/studio/face-code/result?id=` 이동
3. 결과 페이지가 `faceCodeApi.getById(id)` → `meta`/`axes` 를 `FaceCodeBadge` 등으로 렌더
4. 카메라 경유 시 `returnTo=/studio/face-code` → camera가 `faceCodeImage` key 로 저장 → entry가 읽어 `create({image})`

## 작업 레시피
- **유형 문구 수정**: 백엔드 `FaceCode` enum(정본). 프론트 `FACE_CODE_META` 는 관상 뱃지용 보조 — 두 곳 일치 유지.
- **캐릭터(이모지→일러스트)**: `lib/face-code/faceCode.ts` 의 `CHARACTER`/`characterFor`. 정식 SVG 도입 시 여기 교체.
- **그라데이션**: `gradientFor`/`gradientForCode`.
- **로딩 문구**: `[feature]/loading` `CONFIGS['face-code']`.
- **공유 카드**: `result/page.tsx` 의 `drawFaceCodeShareCard`(Canvas) — 캐릭터/그라데이션은 `characterFor`·`gradientHexFor`. 정식 일러스트 도입 시 캐릭터 렌더만 교체. 운세 미노출.
- **MBTI 연동**: mbti-match 결과에 "겉(낯빛코드) vs 속(MBTI)" 카드(`app/studio/mbti-match/result/page.tsx`, `parseFaceCode`로 별명·키워드 + 서버 `outerVsInnerNote`). 백엔드가 관상 점수로 코드 산출·해설 생성 → 서버 [face-code.md](../../server/docs/face-code.md).

## 주의사항
- 독립 콘텐츠 — 결과에 **운세(삼정/시기운/오행) 미노출**. 그 콘텐츠는 관상보기 소관.
- `FaceCodeAnalysis`(API)와 `lib/face-code/faceCode.ts`의 `FaceCode`(클라 union 타입)는 **다른 타입**. 한 파일에서 동시에 import하지 말 것(이름 혼동 방지 — API는 `FaceCodeAnalysis`).
- 면책: "실제 성격검사가 아니라 얼굴이 말하는 인상" 톤 유지.
- 스튜디오 진입은 로그인 필요(허브에서 게이팅).

## 관련 문서
- 서버 [face-code.md](../../server/docs/face-code.md) — `/face-code` API·산출·저장
- [studio-features.md](./studio-features.md) — 스튜디오 공통 패턴
- [api-layer.md](./api-layer.md) — API 클라이언트·index 등록 규칙

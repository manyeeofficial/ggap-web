# API 레이어 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **API 호출 / 타입** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md)

## 범위
- 담당 디렉토리: `src/lib/api/`, `src/lib/types/`
- 한 줄 요약: 단일 axios 인스턴스(`client.ts`) 위에 기능별 API 객체를 얹고, 두 `index.ts`로 전체를 재내보내는 구조.

## 핵심 파일
| 파일 | 역할 |
|---|---|
| `lib/api/client.ts` | axios 인스턴스, JWT 쿠키 첨부, 토큰 만료 사전 감지, 401 refresh, `PUBLIC_API_PATTERNS`, `deleteCookies()`, `UnauthenticatedError` |
| `lib/api/index.ts` | 모든 API 모듈의 단일 재내보내기 진입점 |
| `lib/api/{feature}-api.ts` | 기능별 API 객체 (`memberApi`, `rankingApi`, `skinAnalysisApi` 등) |
| `lib/types/index.ts` | 모든 타입 파일의 단일 재내보내기 진입점 |
| `lib/types/{feature}.types.ts` | 기능별 Request/Response 타입 |
| `lib/types/common.types.ts` | `ApiResponse<T>`, `Language` 등 공용 타입 |

## 동작

### axios 인스턴스 (`apiClient` / `axiosInstance`)
- `baseURL`: `process.env.NEXT_PUBLIC_API_URL` (기본값 `http://localhost:8080`)
- `withCredentials: true` — 모든 요청에 쿠키 전송
- `Content-Type: application/json` 기본 헤더

### Request interceptor — 토큰 첨부
1. `Authorization` 쿠키(access token)와 `Refresh-token` 쿠키가 **둘 다 없고**, 요청 URL이 `PUBLIC_API_PATTERNS`에 없으면 → `redirectToLogin()`을 호출하고 `UnauthenticatedError`를 reject.
2. access token이 존재하면 (만료 여부 무관) `Authorization: Bearer {token}` 헤더 첨부.
3. 만료 기준: `exp * 1000 < Date.now() + 30_000` (만료 30초 전부터 만료 처리).

### Response interceptor — 401 자동 refresh
- 서버가 401을 반환하고 `_retry` 플래그가 없으면 `handleTokenRefresh()` 호출.
- `Refresh-token` 쿠키를 `Refresh-Token` 헤더로 `POST /member/refresh-token`에 전송.
- 응답의 `accessToken`을 받아 대기 중인 요청(subscriber 패턴)에 모두 재시도.
- refresh 실패 시 `deleteCookies()` → `window.location.href = '/'`.
- 동시에 여러 요청이 만료 토큰을 만났을 때 refresh가 한 번만 실행되도록 `isRefreshing` + `refreshSubscribers` 큐로 직렬화.

### 로그아웃 / 쿠키 삭제 (`deleteCookies`)
```ts
import { deleteCookies } from '@/lib/api/client'
deleteCookies()
```
`ggap.ai` 도메인 지정 쿠키와 도메인 미지정 쿠키를 모두 삭제함.

### PUBLIC_API_PATTERNS (인증 우회 목록)
| 패턴 | 메서드 | 용도 |
|---|---|---|
| `/member` | GET | 로그인 여부 확인 |
| `/member` | POST | 회원가입 |
| `/member/login` | — | 로그인 |
| `/member/refresh-token` | — | 토큰 갱신 |
| `/member/check-duplicate` | GET | 중복 확인 |
| `/member/verification-code*` | — | 전화번호 인증 |
| `/apple-auth/*` | — | Apple 인증 |
| `/kakao-auth/*` | — | Kakao 인증 |
| `/naver-auth/*` | — | Naver 인증 |
| `/stats` | GET | 서비스 통계 |
| `/products/trending` | GET | 트렌딩 상품 |
| `/skin-analysis/anonymous` | POST | 비회원 분석 생성 |
| `/skin-analysis/{id}/status` | GET | 분석 상태 폴링 |
| `/skin-analysis/{id}` | GET | 분석 결과 조회 (token 파라미터 비회원 접근) |

### API 모듈 작성 패턴
```ts
// lib/api/my-feature-api.ts
import { axiosInstance } from './client'
import type { MyFeatureResult, MyFeatureRequest } from '@/lib/types'

export const myFeatureApi = {
  async create(data: MyFeatureRequest): Promise<MyFeatureResult> {
    const response = await axiosInstance.post<MyFeatureResult>('/my-feature', data)
    return response.data
  },
  async getById(id: number): Promise<MyFeatureResult> {
    const response = await axiosInstance.get<MyFeatureResult>(`/my-feature/${id}`)
    return response.data
  },
}
```

## 작업 레시피

### 새 API 모듈 추가 (4단계, 반드시 세트로)
1. `lib/types/my-feature.types.ts` — Request/Response 인터페이스 작성
2. `lib/types/index.ts` — `export * from './my-feature.types'` 추가
3. `lib/api/my-feature-api.ts` — `myFeatureApi = { ... }` 객체 작성
4. `lib/api/index.ts` — `export * from './my-feature-api'` 추가

단계 2·4를 빠뜨리면 `@/lib/api` / `@/lib/types` 임포트가 해당 심볼을 찾지 못함.

### 공개(비인증) 엔드포인트 등록
`lib/api/client.ts`의 `PUBLIC_API_PATTERNS` 배열에 항목 추가:
```ts
{ url: /^\/my-feature\/public$/, method: 'post' },
```
`method` 생략 시 모든 메서드에 적용. 패턴은 `config.url` (baseURL 제거 후 경로)에 매칭됨.

### 파일 업로드 (multipart)
```ts
const formData = new FormData()
formData.append('image', file)
await axiosInstance.patch('/member/profile-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
```

### UnauthenticatedError 처리
```ts
import { UnauthenticatedError } from '@/lib/api/client'
try {
  await myFeatureApi.create(data)
} catch (e) {
  if (e instanceof UnauthenticatedError) { /* 이미 리다이렉트됨 */ }
}
```

## 주의사항
- `axiosInstance`를 직접 import해서 쓰되, `apiClient.client`도 동일 인스턴스임.
- BASE_URL은 `.env.local`의 `NEXT_PUBLIC_API_URL`로 제어. 없으면 `http://localhost:8080`.
- SSR(서버 컴포넌트)에서는 `document`/`window` 접근 불가 → `getCookie` 함수가 `typeof document === 'undefined'` 가드 포함. 서버 컴포넌트에서 직접 호출하지 말 것.
- 401 응답이 `/member` GET + 500이면 Refresh-token 쿠키만 삭제하는 특수 처리가 있음 (부패된 refresh token 정리).
- HEIC 변환(`heic2any`), html2canvas 등 유틸은 `skin-analysis-api.ts` 내부에 있음 — 별도 유틸 파일로 분리하지 말 것.

## 관련 문서
- [member-auth.md](./member-auth.md) — 인증 흐름, PUBLIC_PATHS
- [ui-components.md](./ui-components.md) — UI 컴포넌트
- [skin-analysis-flow.md](./skin-analysis-flow.md) — 피부 분석 전체 흐름

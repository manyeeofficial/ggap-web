# 회원/인증 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **회원가입·로그인·인증 가드** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md)

## 범위
- 담당 디렉토리: `app/auth/`, `app/mypage/apple-callback/`, `app/components/AuthGuard.tsx`, `app/components/SocialLoginSheet.tsx`, `lib/store/member-store.tsx`, `lib/api/member-api.ts`, `lib/types/member.types.ts`
- 한 줄 요약: 쿠키 기반 JWT 세션 + 소셜(카카오/네이버/애플) OAuth. `AuthGuard`가 비공개 경로를 지키고, `useMemberStore`가 전역 회원 상태를 보유.

## 핵심 파일
| 파일 | 역할 |
|---|---|
| `app/components/AuthGuard.tsx` | 경로별 인증 가드, `PUBLIC_PATHS` 목록 |
| `app/components/SocialLoginSheet.tsx` | 카카오/네이버 로그인 바텀 시트 |
| `app/auth/kakao/page.tsx` | 카카오 OAuth callback + 신규 회원가입 폼 |
| `app/auth/naver/page.tsx` | 네이버 OAuth callback + 신규 회원가입 폼 |
| `app/mypage/apple-callback/page.tsx` | Apple OAuth callback + 신규 회원가입 폼 |
| `lib/store/member-store.tsx` | `MemberProvider` + `useMemberStore` (React Context) |
| `lib/api/member-api.ts` | `memberApi` — 소셜 로그인 URL, callback, 회원 CRUD |
| `lib/types/member.types.ts` | `Member`, `SocialCallbackResponse`, `AppleAuthSession` 등 |
| `lib/api/client.ts` | `deleteCookies()`, 쿠키 이름: `Authorization`, `Refresh-token` |

## 인증 흐름

### 쿠키 세션
- 서버가 로그인 성공 시 `Authorization`(access, ~15분)과 `Refresh-token`(~14일) 쿠키를 Set-Cookie로 내려보냄.
- 클라이언트는 `withCredentials: true`로 모든 요청에 쿠키를 첨부.
- 로그아웃/탈퇴 시 `deleteCookies()`로 두 쿠키 삭제 (도메인 지정 + 미지정 쌍으로 삭제).

### 카카오 / 네이버 로그인 흐름
```
사용자 "카카오 로그인" 탭
  → SocialLoginSheet: memberApi.getKakaoSigninUrl()
  → window.location.href = authUrl  (카카오 서버로 이동)
  → 카카오 인증 완료 후 /auth/kakao?code=XXX 로 리다이렉트
  → KakaoCallbackPage:
      memberApi.kakaoCallback(code)
        requiresPhoneNumber=false → fetchMember() → 홈('/')
        requiresPhoneNumber=true  → 회원가입 폼 렌더
          memberApi.kakaoCompleteSignup({tempToken, phoneNumber, ...})
          → fetchMember() → 홈('/')
```
- 네이버는 동일 구조, `state` 파라미터 추가 (`naverCallback(code, state)`).
- callback 페이지는 `useRef(hasProcessed)`로 StrictMode 이중 실행 방지.

### Apple 로그인 흐름
```
사용자 "Apple 로그인" 탭
  → memberApi.getAppleSigninUrl() → window.location.href = authUrl
  → Apple 서버 인증 → 서버가 /mypage/apple-callback?session=XXX 로 리다이렉트
  → AppleCallbackPage:
      memberApi.getAppleAuthSession(sessionId)
        requiresPhoneNumber=false → 쿠키 직접 세팅 → fetchMember() → 홈('/')
        requiresPhoneNumber=true  → 회원가입 폼
          memberApi.completeAppleSignup({tempToken, phoneNumber})
          → fetchMember() → 홈('/')
```
- Apple은 서버 사이드 redirect이므로 callback 페이지가 `/mypage/apple-callback`에 위치.
- 기존 회원인 경우 서버가 세션에 `accessToken`/`refreshToken`을 포함해 반환하고, 클라이언트가 `setCookie`로 직접 세팅.

### 비회원-우선 분석 후 로그인 (claimPendingAnalysis)
카카오/네이버 callback에서 로그인 성공 직후 `localStorage.pendingAnalysisClaim`을 확인:
```ts
const { id, token } = JSON.parse(localStorage.getItem('pendingAnalysisClaim'))
await skinAnalysisApi.claimAnalysis(id, token)
// → /analysis-result?id={id} 로 이동
```
비회원 분석을 마친 뒤 로그인하면 자동으로 본인 계정에 귀속.

## AuthGuard

### PUBLIC_PATHS (인증 없이 접근 가능한 경로)
```ts
const PUBLIC_PATHS = [
  '/',
  '/onboarding',
  '/mypage/apple-callback',
  '/auth/naver',
  '/auth/kakao',
  '/terms',
  '/privacy',
  '/camera',
  '/analysis-loading',
  '/analysis-result',
  '/studio',
  '/my-skin',
]
```
`pathname === path` 또는 `pathname.startsWith(path + '/')` 중 하나라도 일치하면 공개 경로.

### 동작
1. 공개 경로 → 즉시 children 렌더 (`authorized` 상태 불필요).
2. access token 유효 → `authorized = true`.
3. access token 없거나 만료 → refresh token으로 `POST /member/refresh-token` 시도.
   - 성공 → `authorized = true`.
   - 실패 → `deleteCookies()` → `router.replace('/')`.
4. `authorized = false`이면 `null` 반환 (빈 화면).

### useMemberStore
```ts
const { member, isLoaded, fetchMember, updateMember, clearMember } = useMemberStore()
```
| 필드/메서드 | 설명 |
|---|---|
| `member: Member \| null` | 현재 로그인 회원 정보 (null = 비로그인 또는 아직 미조회) |
| `isLoaded: boolean` | `fetchMember()`가 최소 1회 완료됐는지 여부 |
| `fetchMember()` | `GET /member` 호출 → member 세팅. 실패해도 `isLoaded = true`로 세팅. |
| `updateMember(data)` | 서버 왕복 없이 로컬 상태만 갱신 |
| `clearMember()` | 로그아웃 시 상태 초기화 |

`MemberProvider`는 `app/layout.tsx`에서 앱 전체를 감싸고 있음.

비로그인 감지:
```ts
const { member, isLoaded } = useMemberStore()
if (isLoaded && !member) { /* 비회원 */ }
```

## 작업 레시피

### 페이지 공개(비인증)로 전환
1. `app/components/AuthGuard.tsx`의 `PUBLIC_PATHS` 배열에 경로 추가.
2. 해당 경로에서 인증 없이 호출하는 API가 있다면 `lib/api/client.ts`의 `PUBLIC_API_PATTERNS`에도 등록 ([api-layer.md](./api-layer.md) 참고).

### 새 소셜 로그인 추가
1. `lib/api/member-api.ts`에 `getXxxSigninUrl()`, `xxxCallback()`, `xxxCompleteSignup()` 추가.
2. `app/auth/xxx/page.tsx` 콜백 페이지 생성 (카카오 페이지 복사 기준).
3. `AuthGuard.PUBLIC_PATHS`에 `/auth/xxx` 추가.
4. `PUBLIC_API_PATTERNS`에 `/xxx-auth/*` 패턴 추가.
5. `SocialLoginSheet`에 버튼 추가.

### 로그아웃 구현
```ts
import { memberApi } from '@/lib/api'
import { deleteCookies } from '@/lib/api/client'
import { useMemberStore } from '@/lib/store/member-store'

const { clearMember } = useMemberStore()
await memberApi.logout()   // 서버 쿠키 만료
deleteCookies()            // 클라이언트 쿠키 삭제
clearMember()              // 전역 상태 초기화
router.replace('/')
```

### 회원 정보 사용
```ts
const { member } = useMemberStore()
// member?.nickname, member?.gender, member?.birthYear, member?.mbti
```
`gender`가 필요하면 store에서 가져옴 — JWT에는 포함되지 않으므로 `AuthenticationFacade.getGender()`는 없음.

## 주의사항
- `AuthGuard`의 토큰 검증(`isTokenExpired`)과 `client.ts`의 동일 함수는 로직이 동일하지만 **별개로 선언**되어 있음. 변경 시 양쪽 모두 수정.
- Apple callback은 서버 리다이렉트 특성상 `?session=` 파라미터를 `useSearchParams`로 읽음 — `Suspense` 필수.
- `Refresh-token` 헤더 이름이 대소문자 구분: `Refresh-Token` (Pascal-Case). 서버와 맞춰야 함.
- `PUBLIC_PATHS` 매칭은 `startsWith`이므로 `/studio`를 넣으면 `/studio/face-reading` 등 하위 경로도 모두 공개됨.

## 관련 문서
- [api-layer.md](./api-layer.md) — PUBLIC_API_PATTERNS, axios 인스턴스
- [ui-components.md](./ui-components.md) — SocialLoginSheet에서 사용하는 Drawer 등
- [skin-analysis-flow.md](./skin-analysis-flow.md) — 비회원 분석 → 로그인 귀속 흐름

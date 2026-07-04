# ㅇㄱㄱ (얼굴값) Web — 개발 가이드라인

## 일반 원칙

- 모바일 퍼스트. 모든 UI는 375px 기준으로 설계하고 데스크톱은 max-w-md 중앙 정렬로 처리
- 한국어 UX 텍스트. 버튼/레이블/토스트 등 모든 사용자 노출 텍스트는 한국어
- 절대 포지션 최소화. 레이아웃은 flexbox/grid 우선, 오버레이 등 꼭 필요한 경우에만 absolute 사용
- 컴포넌트 파일 크기 300줄 이내 유지. 로직이 복잡해지면 커스텀 훅으로 분리

## 스타일

- **Tailwind CSS 4** 사용. 인라인 `style=` 최소화
- **shadcn/ui** 컴포넌트를 기본으로 사용하고, 커스터마이즈가 필요하면 래핑
- 그라디언트 배경: `bg-gradient-to-b from-indigo-600 to-violet-700` 계열 (기능별 색상 변경)
- 반투명 카드: `bg-white/10 backdrop-blur-sm rounded-2xl`
- 로딩/결과 화면은 `fixed inset-0` 전체화면 레이아웃

## 애니메이션

- **Framer Motion** (`motion/react` 패키지) 사용
- 페이드+슬라이드 진입: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
- 탭/스텝 전환에는 `AnimatePresence mode="wait"` 사용
- 스피너 대신 스캔 라인, 펄스 등 의미 있는 애니메이션 선호

## 폼 & 입력

- **React Hook Form** + **zod** 조합 사용
- 에러 메시지는 필드 바로 아래에 `text-red-400 text-xs`로 표시
- 제출 버튼은 로딩 중 `disabled` 처리

## API 호출

- `src/lib/api/` 하위의 API 클라이언트 함수를 통해서만 호출
- 에러 처리는 `toast.error()`로 사용자에게 노출, console.error는 개발용으로만
- 폴링이 필요한 경우 `setInterval` + cleanup(`clearInterval`)으로 메모리 누수 방지

## 상태 관리

- 서버 상태(API 데이터): 컴포넌트 로컬 state + API 훅
- 전역 상태: **Zustand** (`src/lib/store/`)
- sessionStorage: 페이지 간 임시 데이터 전달 (이미지 URL 등), 사용 후 즉시 제거

## 카메라

- `getUserMedia` 제약에 width/height 명시하지 않음 — 모바일 세로 방향 자동 처리
- 캡처 후 `canvas.toDataURL('image/jpeg', 0.9)` 로 JPEG 변환
- HEIC 파일은 `heic2any`로 JPEG 변환 후 처리

## 로딩 페이지

- 스튜디오/플레이그라운드의 모든 로딩 페이지는 `StudioLoadingPage` 컴포넌트 사용
- 얼굴 분석 기능(`showFaceScan: true`)에는 SVG 페이스 스캔 애니메이션 표시
- 이미지 생성 기능(나이 시뮬레이션)은 `progressMode: 'slow'` 설정
- `discoveries` 배열로 "방금 발견했어요" 카드 콘텐츠 정의

## 인증

- 소셜 로그인(카카오/네이버/애플)만 지원. 이메일/비밀번호 로그인 없음
- 보호 라우트는 `AuthGuard` 컴포넌트로 처리
- JWT는 쿠키로 관리 (Authorization / Refresh-token)

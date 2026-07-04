# UI 컴포넌트 — 웹 서브 에이전트 가이드

> **역할**: `web` 모듈에서 **UI / 레이아웃 / 스타일** 작업을 맡은 서브 에이전트용 문서.
> **라우터**: [README.md](./README.md)  |  **상위 규칙**: 루트 [CLAUDE.md](../CLAUDE.md)

## 범위
- 담당 디렉토리: `app/components/ui/` (shadcn/ui), `app/components/` (공통 컴포넌트)
- 한 줄 요약: Radix UI 기반 shadcn/ui 컴포넌트를 인-레포로 직접 수정하며, Tailwind v4 + Framer Motion으로 모바일 우선(~390px) UI를 구성.

## 핵심 파일
| 파일 | 역할 |
|---|---|
| `app/components/ui/` | shadcn/ui 컴포넌트 디렉토리 (직접 수정 가능) |
| `app/components/BottomNavWrapper.tsx` | 5탭 하단 네비 + 스크롤 방향 감지 hide/show + footer |
| `app/components/AuthGuard.tsx` | 인증 가드 (경로 공개 여부 판단) — [member-auth.md](./member-auth.md) 참고 |
| `app/components/SocialLoginSheet.tsx` | 카카오/네이버 로그인 바텀 시트 (Drawer 기반) |
| `app/components/LegalHeader.tsx` | 약관 페이지용 헤더 |
| `app/components/LegalPage.tsx` | 약관/개인정보 페이지 레이아웃 |
| `app/components/TrendingProductsWidget.tsx` | 홈 트렌딩 상품 위젯 |
| `app/components/ui/utils.ts` | `cn()` — clsx + tailwind-merge 헬퍼 |
| `app/components/ui/use-mobile.ts` | `useIsMobile()` 훅 |

## 컴포넌트 목록

### `app/components/ui/` — shadcn/ui (알파벳 순)
| 파일 | 컴포넌트 |
|---|---|
| `accordion.tsx` | Accordion, AccordionItem, AccordionTrigger, AccordionContent |
| `alert-dialog.tsx` | AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel … |
| `alert.tsx` | Alert, AlertTitle, AlertDescription |
| `aspect-ratio.tsx` | AspectRatio |
| `avatar.tsx` | Avatar, AvatarImage, AvatarFallback |
| `badge.tsx` | Badge |
| `breadcrumb.tsx` | Breadcrumb, BreadcrumbItem, BreadcrumbLink … |
| `button.tsx` | Button (variant: default/destructive/outline/secondary/ghost/link) |
| `calendar.tsx` | Calendar |
| `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `carousel.tsx` | Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext |
| `chart.tsx` | ChartContainer, ChartTooltip, ChartTooltipContent … |
| `checkbox.tsx` | Checkbox |
| `collapsible.tsx` | Collapsible, CollapsibleTrigger, CollapsibleContent |
| `command.tsx` | Command, CommandInput, CommandList, CommandItem … |
| `context-menu.tsx` | ContextMenu, ContextMenuTrigger, ContextMenuContent … |
| `dialog.tsx` | Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle … |
| `drawer.tsx` | Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle … |
| `dropdown-menu.tsx` | DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem … |
| `form.tsx` | Form, FormField, FormItem, FormLabel, FormControl, FormMessage (react-hook-form 연동) |
| `hover-card.tsx` | HoverCard, HoverCardTrigger, HoverCardContent |
| `input-otp.tsx` | InputOTP, InputOTPGroup, InputOTPSlot |
| `input.tsx` | Input |
| `label.tsx` | Label |
| `menubar.tsx` | Menubar, MenubarMenu, MenubarTrigger, MenubarContent … |
| `navigation-menu.tsx` | NavigationMenu, NavigationMenuList, NavigationMenuItem … |
| `pagination.tsx` | Pagination, PaginationContent, PaginationItem, PaginationLink … |
| `popover.tsx` | Popover, PopoverTrigger, PopoverContent |
| `progress.tsx` | Progress |
| `radio-group.tsx` | RadioGroup, RadioGroupItem |
| `resizable.tsx` | ResizablePanelGroup, ResizablePanel, ResizableHandle |
| `scroll-area.tsx` | ScrollArea, ScrollBar |
| `select.tsx` | Select, SelectTrigger, SelectContent, SelectItem … |
| `separator.tsx` | Separator |
| `sheet.tsx` | Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle … |
| `sidebar.tsx` | Sidebar 관련 컴포넌트 모음 |
| `skeleton.tsx` | Skeleton |
| `slider.tsx` | Slider |
| `sonner.tsx` | Toaster (sonner 래퍼) — toast 사용 시 import는 `sonner` 패키지에서 직접 |
| `switch.tsx` | Switch |
| `table.tsx` | Table, TableHeader, TableBody, TableRow, TableHead, TableCell … |
| `tabs.tsx` | Tabs, TabsList, TabsTrigger, TabsContent |
| `textarea.tsx` | Textarea |
| `toggle-group.tsx` | ToggleGroup, ToggleGroupItem |
| `toggle.tsx` | Toggle |
| `tooltip.tsx` | Tooltip, TooltipTrigger, TooltipContent, TooltipProvider |

> shadcn/ui 컴포넌트는 **인-레포 소스**이므로 `npx shadcn add`로 추가하거나 파일을 직접 편집할 수 있음. npm 패키지가 아님.

## BottomNavWrapper

5개 탭 정의:
| 탭 | 경로 | 아이콘 |
|---|---|---|
| 홈 | `/` | Camera |
| 스튜디오 | `/studio` | Sparkles |
| 내 스킨 | `/my-skin` | Droplets |
| 기록 | `/history` | History |
| 설정 | `/settings` | Settings |

BottomNav가 표시되는 경로(`bottomNavPages`): `/`, `/studio`, `/my-skin`, `/history`, `/settings`, `/analysis-result`.

- 최대 너비 `max-w-[430px] mx-auto`로 중앙 정렬.
- 스크롤 내릴 때(40px 이상) `translate-y-full`로 숨김, 올릴 때 다시 표시.
- BottomNav 표시 경로에서는 스크롤 컨테이너에 `pb-20` 자동 적용.
- 하단 footer(사업자 정보)는 BottomNavWrapper 내부에 항상 포함.

새 경로에서 BottomNav를 표시하려면 `bottomNavPages` 배열에 추가.

## Tailwind 규칙 (v4)

### 섹션 구분선
```html
<div class="border-b border-gray-100"> ... </div>
```

### 섹션 라벨
```html
<p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">라벨</p>
```

### 모바일 우선 컨테이너
```html
<div class="max-w-[390px] mx-auto px-5"> ... </div>
```
(BottomNavWrapper 자체는 `max-w-[430px]`을 사용)

### 활성 탭 / 강조 색상
- 활성 색상: `text-indigo-600`, `bg-indigo-600`
- 비활성 아이콘: `text-gray-400`

### cn() 유틸
```ts
import { cn } from '@/app/components/ui/utils'
cn('base-class', condition && 'conditional-class', 'other-class')
```

## 애니메이션 (Framer Motion)

패키지명: `motion` (Framer Motion v11+).

```ts
import { motion } from 'motion/react'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  ...
</motion.div>
```

페이지 진입 애니메이션, 로딩 스켈레톤 페이드인, 결과 카드 슬라이드업 등에 사용.

## Toast (sonner)

`app/components/ui/sonner.tsx`의 `<Toaster />`가 `app/layout.tsx`에 마운트되어 있음.

```ts
import { toast } from 'sonner'

toast.success('저장되었습니다.')
toast.error('오류가 발생했습니다.')
toast('일반 메시지')
```

`sonner` 패키지에서 직접 import — `@/app/components/ui/sonner`에서 import하지 말 것.

## 작업 레시피

### 새 공통 컴포넌트 추가
1. `app/components/{ComponentName}.tsx` 생성.
2. 인증이 필요한 컴포넌트라면 `useMemberStore`로 회원 상태 참조.
3. 동일 패턴 3회 이상 반복 시에만 추출할 것 (과도한 추상화 금지).

### shadcn/ui 컴포넌트 커스터마이징
- `app/components/ui/{component}.tsx`를 직접 편집.
- variant 추가: `button.tsx`의 `buttonVariants` (cva 기반)에 variant 항목 추가.

### BottomNav에 새 탭 추가
1. `app/components/BottomNavWrapper.tsx`의 `tabs` 배열에 항목 추가.
2. `bottomNavPages` 배열에 해당 경로 추가.
3. 새 경로가 공개 경로이면 `AuthGuard.PUBLIC_PATHS`에도 추가.

### 스켈레톤 로딩
```tsx
import { Skeleton } from '@/app/components/ui/skeleton'
<Skeleton className="h-4 w-full rounded-md" />
```

## 주의사항
- Tailwind v4 사용 중 — v3 방식의 `tailwind.config.js`가 없고, CSS 변수로 테마를 제어함. `@apply` 등 사용 시 v4 문서 기준으로 작성.
- `Drawer` (바텀 시트)와 `Sheet` (사이드 패널)는 별개 컴포넌트. 모바일 바텀 시트에는 `Drawer` 사용 (`SocialLoginSheet` 참고).
- 이미지는 `next/image`를 사용. `next.config.ts`에서 HTTPS 모든 호스트 허용 설정되어 있음.
- 모든 UI 문자열은 한국어. 다국어 처리가 필요하면 `lib/types/common.types.ts`의 `Language` 타입과 정합.

## 관련 문서
- [api-layer.md](./api-layer.md) — API 호출 패턴
- [member-auth.md](./member-auth.md) — AuthGuard, SocialLoginSheet
- [studio-features.md](./studio-features.md) — 스튜디오 기능 페이지 구조

'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ScanFace, Shield, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { skinAnalysisApi } from '@/lib/api'
import { useMemberStore } from '@/lib/store/member-store'
import { StudioLoadingPage, type StudioLoadingConfig } from '@/app/studio/components/StudioLoadingPage'
import { LOADING_CONFIGS } from '@/app/studio/components/loadingConfigs'

/** dataUrl → File 변환 유틸 */
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mime })
}

/**
 * 피부 분석 전용 로딩 컴포넌트.
 * 회원 상태를 확인한 뒤 initFn(이미지 업로드 + 분석 시작)을 구성한다.
 * isLoaded 전까지는 배경만 표시해 레이아웃 이동을 방지한다.
 */
function SkinAnalysisLoading() {
  const router = useRouter()
  const { member, isLoaded, fetchMember } = useMemberStore()

  useEffect(() => {
    if (!isLoaded) fetchMember()
  }, [isLoaded, fetchMember])

  // 회원 정보 로드 전까지 배경 유지
  if (!isLoaded) {
    return <div className="fixed inset-0 bg-gradient-to-b from-indigo-600 to-violet-700" />
  }

  // member는 isLoaded 이후 확정된 값이므로 클로저로 안전하게 캡처
  const initFn = async (): Promise<{ id: number; token?: string }> => {
    const imageData = sessionStorage.getItem('capturedImage')
    if (!imageData) {
      toast.error('촬영된 이미지가 없습니다.')
      router.replace('/camera')
      throw new Error('no image')
    }
    const file = dataUrlToFile(imageData, 'skin-analysis.jpg')
    sessionStorage.removeItem('capturedImage')

    try {
      const result = member
        ? await skinAnalysisApi.analyze(file)
        : await skinAnalysisApi.analyzeAnonymous(file)
      const token = 'token' in result && result.token ? result.token : undefined
      return { id: result.id, token }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || '이미지 업로드에 실패했습니다.')
      router.replace('/camera')
      throw err
    }
  }

  const config: StudioLoadingConfig = {
    gradient: 'bg-gradient-to-b from-indigo-600 to-violet-700',
    steps: [
      { icon: ScanFace, text: '이미지 업로드 중...' },
      { icon: Shield, text: '피부 특징 분석 중...' },
      { icon: Sparkles, text: '피부 타입 판별 중...' },
      { icon: CheckCircle2, text: '결과 정리 중...' },
    ],
    tips: [
      '클렌징 후 3분 이내에 보습제를 바르면 수분 증발을 막을 수 있어요',
      '자외선 차단제는 실내에서도 매일 바르는 습관이 중요해요',
      '충분한 수면이 피부 재생 호르몬 분비를 도와줘요',
      '하루 2리터 수분 섭취가 피부 탄력 유지의 기본이에요',
      '비타민 C 성분이 피부 콜라겐 합성과 미백에 도움을 줘요',
      '스트레스는 활성산소를 늘려 피부 노화를 가속화해요',
    ],
    subtitle: '피부를 분석하고 있어요',
    estimatedTime: '15-30초',
    showFaceScan: true,
    pollFn: (id) => skinAnalysisApi.getStatus(id),
    resultPath: (id, token) =>
      token ? `/analysis-result?id=${id}&token=${token}` : `/analysis-result?id=${id}`,
    entryPath: '/camera',
    initFn,
    pollInterval: 2500,
  }

  return <StudioLoadingPage config={config} />
}

/** ?type= 파라미터를 읽어 알맞은 로딩 UI를 렌더링한다. */
function LoadingContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  // 피부 분석: 회원 상태 의존 initFn 필요 → 별도 컴포넌트로 분리
  if (type === 'skin-analysis') {
    return <SkinAnalysisLoading />
  }

  // 스튜디오/놀이터 기능: 정적 config 조회
  const config = type ? LOADING_CONFIGS[type] : null
  if (!config) return null

  return <StudioLoadingPage config={config} />
}

/**
 * 통합 로딩 라우트 — `/loading?type=...`
 *
 * type 키:
 *  - skin-analysis       : 피부 분석 (initFn 모드, 비회원 지원)
 *  - face-reading        : 스튜디오 관상보기 (URL ?id= 모드)
 *  - face-code           : 스튜디오 낯빛코드 (URL ?id= 모드)
 *  - mbti-match          : 스튜디오 MBTI 매칭 (URL ?id= 모드)
 *  - age-simulation      : 스튜디오 나이 시뮬레이션 (URL ?id= 모드)
 *  - playground-face-reading : 놀이터 관상 체험 (URL ?id= 모드)
 */
export default function LoadingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-b from-indigo-600 to-violet-700" />}>
      <LoadingContent />
    </Suspense>
  )
}

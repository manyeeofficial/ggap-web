'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { X, FlipHorizontal, Zap, ZapOff, Camera as CameraIcon, ImagePlus, RotateCcw, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'

type CameraState = 'loading' | 'ready' | 'denied' | 'unsupported'

function CameraContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraState, setCameraState] = useState<CameraState>('loading')
  const [mirrored, setMirrored] = useState(true)
  const [flashOn, setFlashOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setCameraState('loading')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unsupported')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 1720 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // 플래시(토치) 지원 여부 확인
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.()
        if (capabilities && 'torch' in capabilities) {
          setTorchSupported(true)
        }
      }

      setCameraState('ready')
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied')
      } else {
        setCameraState('unsupported')
      }
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => stopStream()
  }, [startCamera, stopStream])

  const toggleFlash = async () => {
    if (!streamRef.current) return
    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (!videoTrack) return

    const newFlashState = !flashOn
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashState } as any],
      })
      setFlashOn(newFlashState)
    } catch {
      toast.error('플래시를 제어할 수 없습니다.')
    }
  }

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (mirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(dataUrl)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')

    if (!isHeic && !file.type.startsWith('image/')) {
      toast.error('이미지 파일만 선택할 수 있습니다.')
      return
    }

    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = ''

    let imageFile: File | Blob = file

    if (isHeic) {
      try {
        const heic2any = (await import('heic2any')).default
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        imageFile = Array.isArray(converted) ? converted[0] : converted
      } catch {
        toast.error('HEIC 파일 변환에 실패했습니다.')
        return
      }
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCapturedImage(reader.result as string)
    }
    reader.readAsDataURL(imageFile)
  }

  const handleRetake = () => {
    setCapturedImage(null)
  }

  const handleAnalyze = () => {
    if (!capturedImage) return
    try {
      if (returnTo) {
        // returnTo 경로로 이미지 전달 (sessionStorage key: returnTo 경로 기반)
        sessionStorage.setItem('faceReadingImage', capturedImage)
        router.push(returnTo)
      } else {
        sessionStorage.setItem('capturedImage', capturedImage)
        router.push('/analysis-loading')
      }
    } catch {
      toast.error('이미지 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 미리보기 화면
  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="relative w-full h-full flex flex-col">
          {/* 미리보기 이미지 */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={capturedImage}
              alt="촬영된 사진"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* 하단 버튼 */}
          <div className="p-6 pb-12 flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-14 bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={handleRetake}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              다시 촬영
            </Button>
            <Button
              className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleAnalyze}
            >
              분석하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 카메라 권한 거부 / 미지원 화면
  if (cameraState === 'denied' || cameraState === 'unsupported') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Top Controls */}
        <div className="p-6 flex items-center">
          <button
            onClick={() => router.push('/')}
            className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <CameraIcon className="w-12 h-12 text-white/60" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-3">
              {cameraState === 'denied' ? '카메라 접근 권한이 필요합니다' : '카메라를 사용할 수 없습니다'}
            </h2>
            <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto">
              {cameraState === 'denied'
                ? '브라우저 설정에서 카메라 접근을 허용해주세요. 또는 갤러리에서 사진을 업로드할 수 있습니다.'
                : '이 브라우저에서는 카메라를 지원하지 않습니다. 갤러리에서 사진을 업로드해주세요.'}
            </p>
            <div className="space-y-3">
              <Button
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-5 h-5 mr-2" />
                갤러리에서 사진 선택
              </Button>
              {cameraState === 'denied' && (
                <Button
                  variant="outline"
                  className="w-full h-14 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={startCamera}
                >
                  카메라 다시 시도
                </Button>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    )
  }

  // 카메라 화면
  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full">
        {/* 카메라 스트림 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
        />

        {/* 캡처용 숨겨진 캔버스 */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-3">
            {torchSupported && (
              <button
                onClick={toggleFlash}
                className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
              >
                {flashOn ? <Zap className="w-6 h-6 text-yellow-400" /> : <ZapOff className="w-6 h-6 text-white" />}
              </button>
            )}
            <button
              onClick={() => setMirrored(!mirrored)}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                mirrored ? 'bg-white/30' : 'bg-black/50'
              }`}
            >
              <FlipHorizontal className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-40 left-0 right-0 px-6">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white text-sm text-center">정면을 바라보고, 충분한 조명을 확보해주세요</p>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
          <div className="flex items-center justify-center gap-8">
            {/* 갤러리 버튼 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center"
            >
              <ImagePlus className="w-6 h-6 text-white" />
            </button>

            {/* 캡처 버튼 */}
            <motion.button
              onClick={handleCapture}
              disabled={cameraState !== 'ready'}
              whileTap={{ scale: 0.9 }}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                cameraState === 'ready'
                  ? 'bg-white/30 backdrop-blur-sm'
                  : 'bg-gray-500/30 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-indigo-600" />
              </div>
            </motion.button>

            {/* 빈 공간 (레이아웃 균형) */}
            <div className="w-14 h-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CameraPage() {
  return (
    <Suspense>
      <CameraContent />
    </Suspense>
  )
}

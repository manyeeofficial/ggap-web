'use client'

import type { FaceCodeMeta, FaceCodeAxes } from '@/lib/types'
import { gradientForCode, characterFor } from '@/lib/face-code/faceCode'

/**
 * 낯빛코드 결과 뱃지 — 서버 응답(meta+axes)을 그대로 렌더한다.
 * 캐릭터는 코드별 이모지 플레이스홀더(정식 일러스트는 별도 자산 작업).
 */
export function FaceCodeBadge({
  meta,
  axes,
  lowConfidence,
}: {
  meta: FaceCodeMeta
  axes?: FaceCodeAxes
  lowConfidence?: boolean
}) {
  const gradient = gradientForCode(meta.code)
  const axisList = axes ? [axes.temp, axes.mood, axes.def] : []

  return (
    <div className={`rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
      <div className="flex flex-col items-center text-center">
        <div className="text-6xl mb-2 drop-shadow">{characterFor(meta.code)}</div>
        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-[0.25em]">낯빛코드</p>
        <h2 className="text-4xl font-black tracking-tight mt-1">{meta.code}</h2>
        <p className="text-white font-bold text-base mt-2">{meta.nickname}</p>
        <p className="text-white/75 text-sm mt-1">“{meta.catchphrase}”</p>
      </div>

      {axisList.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-5">
          {axisList.map((a) => (
            <div key={a.letter} className="bg-white/15 rounded-2xl px-2 py-2.5 text-center">
              <p className="text-lg font-black leading-tight">{a.letter}</p>
              <p className="text-white/80 text-[11px] font-medium">{a.keyword}</p>
            </div>
          ))}
        </div>
      )}

      {lowConfidence && (
        <p className="text-white/60 text-[11px] text-center mt-3">
          경계값이 있어 다른 유형과 비슷할 수 있어요
        </p>
      )}
    </div>
  )
}

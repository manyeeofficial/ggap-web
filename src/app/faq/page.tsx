'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion'

const faqData = [
  {
    category: '분석 관련',
    items: [
      {
        question: '얼굴 분석은 어떻게 진행되나요?',
        answer: '스마트폰 카메라로 정면 셀카를 촬영하면 AI가 자동으로 피부 상태를 분석합니다. 약 10-30초 정도 소요됩니다.',
      },
      {
        question: '정확한 분석을 위한 촬영 팁이 있나요?',
        answer: '충분한 조명이 있는 곳에서 정면을 바라보고 촬영해주세요. 안경과 마스크는 벗은 상태가 좋으며, 화장을 지운 맨얼굴 상태를 권장합니다.',
      },
      {
        question: '분석 결과는 얼마나 정확한가요?',
        answer: 'Gemini Vision AI를 사용하여 높은 정확도로 분석하지만, 의료 진단이 아닌 뷰티 추천 목적입니다. 심각한 피부 문제는 전문의와 상담하세요.',
      },
    ],
  },
  {
    category: '구독 및 결제',
    items: [
      {
        question: '무료 체험은 몇 번 가능한가요?',
        answer: '회원가입 후 3회까지 무료로 분석을 이용할 수 있습니다.',
      },
      {
        question: '구독을 취소하면 어떻게 되나요?',
        answer: '구독을 취소해도 현재 결제 기간이 끝날 때까지는 프리미엄 기능을 이용할 수 있습니다. 환불은 약관에 따라 처리됩니다.',
      },
      {
        question: '결제 수단은 무엇을 지원하나요?',
        answer: '신용카드, Apple Pay, Google Pay 등 다양한 결제 수단을 지원합니다.',
      },
    ],
  },
  {
    category: '계정 관리',
    items: [
      {
        question: '비밀번호를 잊어버렸어요',
        answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하여 가입한 이메일로 재설정 링크를 받을 수 있습니다.',
      },
      {
        question: '회원 탈퇴하면 데이터는 어떻게 되나요?',
        answer: '회원 탈퇴 시 모든 분석 기록과 개인 정보가 즉시 삭제됩니다. 이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.',
      },
    ],
  },
  {
    category: '추천 제품',
    items: [
      {
        question: '추천 제품은 어떻게 선정되나요?',
        answer: 'AI 분석 결과를 바탕으로 피부 타입과 고민에 맞는 제품을 추천합니다. 성분, 리뷰, 효과 등을 종합적으로 고려합니다.',
      },
      {
        question: '제품 구매는 어떻게 하나요?',
        answer: '추천 제품 카드의 "구매하기" 버튼을 클릭하면 제휴 쇼핑몰로 이동합니다.',
      },
    ],
  },
]

export default function FAQPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="relative flex items-center justify-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">FAQ</h1>
        </div>
      </div>

      <div className="pb-8">
        {faqData.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mt-6">
            <div className="px-5 pb-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {category.category}
              </span>
            </div>
            <div className="border-t border-gray-100">
              <Accordion type="single" collapsible>
                {category.items.map((item, itemIndex) => (
                  <AccordionItem
                    key={itemIndex}
                    value={`item-${categoryIndex}-${itemIndex}`}
                    className="border-b border-gray-100"
                  >
                    <AccordionTrigger className="px-5 py-4 text-sm font-medium text-left hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { productApi } from '@/lib/api'
import { Skeleton } from '@/app/components/ui/skeleton'
import type { TrendingProduct } from '@/lib/types'

const CATEGORY_LABEL: Record<string, string> = {
  CLEANSER: '클렌저',
  TONER: '토너',
  ESSENCE: '에센스',
  SERUM: '세럼',
  AMPOULE: '앰플',
  EYE_CREAM: '아이크림',
  MOISTURIZER: '모이스처라이저',
  SUNSCREEN: '선크림',
  MASK: '마스크',
  SPOT_TREATMENT: '스팟케어',
  OTHER: '기타',
}

export default function TrendingProductsWidget() {
  const [products, setProducts] = useState<TrendingProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productApi
      .getTrending()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && products.length === 0) return null

  return (
    <div className="py-5 border-b border-gray-100">
      <div className="px-5 mb-3">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">얼굴값 TOP 추천 아이템</p>
        <p className="text-xs text-gray-400 mt-0.5">얼굴값 상위 20% 유저들이 관심 갖는 스킨케어</p>
      </div>

      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36">
                <Skeleton className="w-36 h-36 rounded-2xl mb-2" />
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : products.map((product) => (
              <a
                key={product.id}
                href={product.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-36 group"
              >
                {/* 상품 이미지 */}
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-gray-100 mb-2">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center text-2xl">
                      🧴
                    </div>
                  )}
                </div>

                {/* 카테고리 */}
                <p className="text-xs text-gray-400 mb-0.5">
                  {CATEGORY_LABEL[product.category] ?? product.category}
                </p>

                {/* 브랜드 */}
                <p className="text-xs font-semibold text-gray-500 truncate">{product.brandName}</p>

                {/* 상품명 */}
                <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mt-0.5">
                  {product.name}
                </p>

                {/* 가격 */}
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {product.discountRate != null && product.discountRate > 0 && (
                    <span className="text-xs font-bold text-rose-500">{product.discountRate}%</span>
                  )}
                  <span className="text-sm font-bold text-gray-900">
                    {product.price.toLocaleString()}원
                  </span>
                  {product.originalPrice != null && product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {product.originalPrice.toLocaleString()}원
                    </span>
                  )}
                </div>
              </a>
            ))}
      </div>
    </div>
  )
}

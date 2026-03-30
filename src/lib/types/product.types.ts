export type ProductCategory =
  | 'CLEANSER'
  | 'TONER'
  | 'ESSENCE'
  | 'SERUM'
  | 'AMPOULE'
  | 'EYE_CREAM'
  | 'MOISTURIZER'
  | 'SUNSCREEN'
  | 'MASK'
  | 'SPOT_TREATMENT'
  | 'OTHER'

export interface TrendingProduct {
  id: number
  name: string
  brandName: string
  category: ProductCategory
  imageUrl: string | null
  price: number
  originalPrice: number | null
  discountRate: number | null
  affiliateLink: string
}

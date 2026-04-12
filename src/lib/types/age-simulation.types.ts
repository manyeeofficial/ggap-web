export interface AgeSimulation {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  targetAge?: number
  sourceImageUrl?: string
  generatedImageUrl?: string
  unchangedFeatures: string[]
  changedFeatures: string[]
  story?: string
  skincareTip?: string
  wittyOneLiner?: string
  createdAt?: string
}

export interface AgeSimulationStatus {
  id: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
}

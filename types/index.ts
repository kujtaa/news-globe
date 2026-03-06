export type SourceType = 'newsapi' | 'rss' | 'gdelt'

export type SourceCategory =
  | 'general'
  | 'politics'
  | 'technology'
  | 'business'
  | 'science'
  | 'sports'
  | 'entertainment'
  | 'health'

export interface NewsSource {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  url: string
  rssUrl?: string
  newsApiId?: string
  type: SourceType
  category: SourceCategory
  articleCount: number
  language: string
  description?: string
}

export interface Article {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: NewsSource
  imageUrl?: string
  relevanceScore?: number
}

export interface SourcesResponse {
  sources: NewsSource[]
  totalCount: number
  cachedAt: string
}

export interface ArticlesResponse {
  articles: Article[]
  sourceId: string
  totalResults: number
  page: number
  hasMore: boolean
}

export interface SearchResponse {
  articles: Article[]
  sources: NewsSource[]
  query: string
  totalResults: number
}

export interface GlobePoint {
  id: string
  lat: number
  lng: number
  altitude: number
  color: string
  radius: number
  source: NewsSource
  isSelected: boolean
  isHovered: boolean
}

export interface GlobeStore {
  selectedSource: NewsSource | null
  hoveredSource: NewsSource | null
  searchQuery: string
  activeCategory: SourceCategory | 'all'
  highlightedSourceIds: string[]
  isPanelOpen: boolean
  globeRotating: boolean
  selectedCountry: string | null
  flyToCountry: string | null

  setSelectedSource: (source: NewsSource | null) => void
  setHoveredSource: (source: NewsSource | null) => void
  setSearchQuery: (query: string) => void
  setActiveCategory: (category: SourceCategory | 'all') => void
  setHighlightedSourceIds: (ids: string[]) => void
  setSelectedCountry: (country: string | null) => void
  setFlyToCountry: (country: string | null) => void
  setIsPanelOpen: (open: boolean) => void
  setGlobeRotating: (rotating: boolean) => void
}

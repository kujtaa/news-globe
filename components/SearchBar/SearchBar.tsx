'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useGlobeStore } from '@/store/globeStore'
import { useSearch } from '@/hooks/useNews'
import type { SourceCategory } from '@/types'

// Maps lowercase country name aliases → ISO 2-letter code
const COUNTRY_ALIASES: Record<string, string> = {
  'us': 'US', 'usa': 'US', 'united states': 'US', 'america': 'US',
  'uk': 'GB', 'gb': 'GB', 'united kingdom': 'GB', 'britain': 'GB', 'england': 'GB',
  'france': 'FR', 'germany': 'DE', 'deutschland': 'DE',
  'japan': 'JP', 'china': 'CN', 'india': 'IN',
  'brazil': 'BR', 'australia': 'AU', 'canada': 'CA', 'russia': 'RU',
  'south africa': 'ZA', 'qatar': 'QA', 'hong kong': 'HK',
  'south korea': 'KR', 'korea': 'KR', 'mexico': 'MX', 'argentina': 'AR',
  'nigeria': 'NG', 'egypt': 'EG', 'saudi arabia': 'SA',
  'italy': 'IT', 'spain': 'ES', 'turkey': 'TR', 'sweden': 'SE',
  'netherlands': 'NL', 'holland': 'NL', 'switzerland': 'CH', 'poland': 'PL',
  'ukraine': 'UA', 'israel': 'IL', 'pakistan': 'PK', 'denmark': 'DK',
  'norway': 'NO', 'finland': 'FI', 'belgium': 'BE', 'ireland': 'IE',
  'austria': 'AT', 'greece': 'GR', 'portugal': 'PT',
  'czech republic': 'CZ', 'czechia': 'CZ', 'romania': 'RO', 'hungary': 'HU',
  'bulgaria': 'BG', 'croatia': 'HR', 'serbia': 'RS', 'slovakia': 'SK',
  'albania': 'AL', 'bosnia': 'BA', 'bosnia and herzegovina': 'BA',
  'montenegro': 'ME', 'north macedonia': 'MK', 'macedonia': 'MK',
  'kosovo': 'XK', 'slovenia': 'SI',
}

const COUNTRY_DISPLAY: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', FR: 'France', DE: 'Germany',
  JP: 'Japan', CN: 'China', IN: 'India', BR: 'Brazil', AU: 'Australia',
  CA: 'Canada', RU: 'Russia', ZA: 'South Africa', QA: 'Qatar', HK: 'Hong Kong',
  KR: 'South Korea', MX: 'Mexico', AR: 'Argentina', NG: 'Nigeria', EG: 'Egypt',
  SA: 'Saudi Arabia', IT: 'Italy', ES: 'Spain', TR: 'Turkey', SE: 'Sweden',
  NL: 'Netherlands', CH: 'Switzerland', PL: 'Poland', UA: 'Ukraine', IL: 'Israel',
  PK: 'Pakistan', DK: 'Denmark', NO: 'Norway', FI: 'Finland', BE: 'Belgium',
  IE: 'Ireland', AT: 'Austria', GR: 'Greece', PT: 'Portugal', CZ: 'Czechia',
  RO: 'Romania', HU: 'Hungary', BG: 'Bulgaria', HR: 'Croatia', RS: 'Serbia',
  SK: 'Slovakia', AL: 'Albania', BA: 'Bosnia', ME: 'Montenegro', MK: 'North Macedonia',
  XK: 'Kosovo', SI: 'Slovenia',
}

const CATEGORIES: { label: string; value: SourceCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Politics', value: 'politics' },
  { label: 'Tech', value: 'technology' },
  { label: 'Business', value: 'business' },
  { label: 'Science', value: 'science' },
  { label: 'Sports', value: 'sports' },
]

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SearchBar() {
  const [inputValue, setInputValue] = useState('')
  const {
    setSearchQuery,
    setHighlightedSourceIds,
    activeCategory,
    setActiveCategory,
    setFlyToCountry,
    isPanelOpen,
  } = useGlobeStore()

  const debouncedQuery = useDebounce(inputValue, 500)

  const { data, isLoading } = useSearch(debouncedQuery)

  // Detect if input matches a country name
  const matchedCountryCode = COUNTRY_ALIASES[debouncedQuery.trim().toLowerCase()] ?? null

  // Auto-fly when a country name is typed directly (e.g. "uk", "france")
  useEffect(() => {
    if (matchedCountryCode) {
      setFlyToCountry(matchedCountryCode)
      setInputValue('')
      setHighlightedSourceIds([])
    }
  }, [matchedCountryCode])

  // Sync debounced query to store
  useEffect(() => {
    setSearchQuery(debouncedQuery)
  }, [debouncedQuery, setSearchQuery])

  // Highlight sources on the globe when search results arrive
  useEffect(() => {
    if (data?.sources) {
      setHighlightedSourceIds(data.sources.map((s) => s.id))
    } else if (!debouncedQuery) {
      setHighlightedSourceIds([])
    }
  }, [data, debouncedQuery, setHighlightedSourceIds])

  // Group search results by country, sorted by article count
  const countryResults = useMemo(() => {
    if (!data?.sources || data.sources.length === 0) return []
    const map = new Map<string, { code: string; name: string; count: number }>()
    for (const s of data.sources) {
      const code = s.country.toUpperCase()
      const existing = map.get(code)
      if (existing) {
        existing.count += s.articleCount ?? 0
      } else {
        map.set(code, {
          code,
          name: COUNTRY_DISPLAY[code] ?? code,
          count: s.articleCount ?? 0,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [data?.sources])

  const clearSearch = useCallback(() => {
    setInputValue('')
    setHighlightedSourceIds([])
  }, [setHighlightedSourceIds])

  const jumpToCountry = useCallback((code: string) => {
    setFlyToCountry(code)
    // Keep inputValue and highlighted IDs so the search query stays active
    // and the panel shows filtered articles
  }, [setFlyToCountry])

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xl">
      {/* Search input */}
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
          ) : (
            '🔍'
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search news topics, e.g. Trump, climate, AI..."
          className="
            w-full pl-9 pr-10 py-3 sm:py-2.5 rounded-full
            bg-black/60 backdrop-blur-md
            border border-white/20 hover:border-white/40 focus:border-cyan-400/70
            text-white text-sm placeholder:text-gray-500
            outline-none transition-colors
          "
        />
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-all
              ${
                activeCategory === cat.value
                  ? 'bg-cyan-400 text-black'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Keyword search country results — hide when panel is open */}
      {debouncedQuery.length >= 2 && data && !isPanelOpen && (
        <div className="w-full">
          {countryResults.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/70 backdrop-blur-md overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  <span className="text-yellow-400 font-medium">{data.totalResults}</span>{' '}
                  articles about{' '}
                  <span className="text-white font-medium">&ldquo;{data.query}&rdquo;</span>
                  {' '}across{' '}
                  <span className="text-cyan-400 font-medium">{countryResults.length}</span>{' '}
                  {countryResults.length === 1 ? 'country' : 'countries'}
                </span>
              </div>
              {/* Country list */}
              <div className="max-h-44 sm:max-h-60 overflow-y-auto divide-y divide-white/5">
                {countryResults.map(({ code, name, count }) => (
                  <button
                    key={code}
                    onClick={() => jumpToCountry(code)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left group"
                  >
                    <img
                      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                      alt=""
                      className="w-6 h-auto rounded-sm opacity-90 shrink-0"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                    <span className="flex-1 text-sm text-gray-200 group-hover:text-white transition-colors">
                      {name}
                    </span>
                    <span className="text-xs text-cyan-400 font-medium shrink-0">
                      {count} {count === 1 ? 'article' : 'articles'}
                    </span>
                    <span className="text-gray-600 group-hover:text-cyan-400 transition-colors text-xs shrink-0">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Server-side only — GDELT DOC API (free, no key required)
import type { Article, NewsSource } from '@/types'
import { NEWS_SOURCES, COUNTRY_CENTROIDS } from './sources'

const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc'

function articleId(url: string): string {
  return Buffer.from(url).toString('base64').replace(/[=+/]/g, '').slice(0, 32)
}

// Extract domain from URL and try to match a known source
function matchSourceByDomain(sourceUrl: string): NewsSource | null {
  try {
    const domain = new URL(sourceUrl).hostname.replace(/^www\./, '')
    return (
      NEWS_SOURCES.find((s) => {
        try {
          return new URL(s.url).hostname.replace(/^www\./, '') === domain
        } catch {
          return false
        }
      }) ?? null
    )
  } catch {
    return null
  }
}

function buildFallbackSource(sourceUrl: string, sourceName: string): NewsSource {
  const coords = { lat: 20 + Math.random() * 40, lng: -30 + Math.random() * 120 }
  return {
    id: `gdelt-${Buffer.from(sourceUrl).toString('base64').slice(0, 8)}`,
    name: sourceName || sourceUrl,
    country: 'UN',
    lat: coords.lat,
    lng: coords.lng,
    url: sourceUrl,
    type: 'gdelt',
    category: 'general',
    articleCount: 0,
    language: 'en',
  }
}

export async function searchGDELT(
  query: string,
  maxRecords = 25
): Promise<Article[]> {
  const params = new URLSearchParams({
    query: query,
    mode: 'ArtList',
    maxrecords: String(maxRecords),
    format: 'json',
    sort: 'DateDesc',
  })

  const url = `${GDELT_BASE}?${params}`

  const res = await fetch(url, { next: { revalidate: 120 } })
  if (!res.ok) {
    console.error(`GDELT search failed: ${res.status}`)
    return []
  }

  const data = await res.json()
  const items = data.articles ?? []

  return items.map((item: any): Article => {
    const matchedSource = matchSourceByDomain(item.url ?? '')
    const source =
      matchedSource ?? buildFallbackSource(item.url ?? '', item.domain ?? '')

    return {
      id: articleId(item.url ?? item.title ?? Math.random().toString()),
      title: item.title ?? 'Untitled',
      description: item.seendatetime
        ? `Published: ${item.seendatetime}`
        : '',
      url: item.url ?? '#',
      publishedAt: item.seendatetime
        ? new Date(
            item.seendatetime.replace(
              /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
              '$1-$2-$3T$4:$5:$6Z'
            )
          ).toISOString()
        : new Date().toISOString(),
      source,
      imageUrl: undefined,
    }
  })
}

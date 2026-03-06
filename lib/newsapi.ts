// Server-side only — never import this in client components
import type { Article, NewsSource } from '@/types'
import { getSourceByNewsApiId, COUNTRY_CENTROIDS, NEWS_SOURCES } from './sources'

const NEWSAPI_BASE = 'https://newsapi.org/v2'

function getApiKey(): string {
  const key = process.env.NEWSAPI_KEY
  if (!key) throw new Error('NEWSAPI_KEY environment variable is not set')
  return key
}

interface NewsAPIRawArticle {
  source: { id: string | null; name: string }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
}

function articleId(url: string): string {
  return Buffer.from(url).toString('base64').replace(/[=+/]/g, '').slice(0, 32)
}

export async function fetchNewsApiSources(): Promise<NewsSource[]> {
  const url = `${NEWSAPI_BASE}/sources?apiKey=${getApiKey()}&language=en`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`NewsAPI sources failed: ${res.status}`)

  const data = await res.json()
  const apiSources = data.sources ?? []

  return apiSources
    .map((s: any): NewsSource | null => {
      const registered = getSourceByNewsApiId(s.id)
      if (registered) return registered

      const coords = COUNTRY_CENTROIDS[s.country?.toUpperCase()]
      if (!coords) return null

      return {
        id: s.id,
        name: s.name,
        country: s.country?.toUpperCase() ?? 'US',
        lat: coords.lat + (Math.random() - 0.5) * 2,
        lng: coords.lng + (Math.random() - 0.5) * 2,
        url: s.url,
        newsApiId: s.id,
        type: 'newsapi',
        category: s.category ?? 'general',
        articleCount: 0,
        language: s.language ?? 'en',
        description: s.description,
      }
    })
    .filter((s: NewsSource | null): s is NewsSource => s !== null)
}

export async function fetchArticlesForSource(
  sourceId: string,
  page = 1,
  pageSize = 20
): Promise<{ articles: Article[]; totalResults: number }> {
  const params = new URLSearchParams({
    apiKey: getApiKey(),
    sources: sourceId,
    page: String(page),
    pageSize: String(pageSize),
    sortBy: 'publishedAt',
  })

  const res = await fetch(`${NEWSAPI_BASE}/everything?${params}`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`NewsAPI articles failed: ${res.status}`)

  const data = await res.json()
  const registeredSource = getSourceByNewsApiId(sourceId)

  const articles: Article[] = (data.articles ?? []).map(
    (a: NewsAPIRawArticle): Article => ({
      id: articleId(a.url),
      title: a.title,
      description: a.description ?? '',
      url: a.url,
      publishedAt: a.publishedAt,
      imageUrl: a.urlToImage ?? undefined,
      source: registeredSource ?? {
        id: a.source.id ?? 'unknown',
        name: a.source.name,
        country: 'US',
        lat: 0,
        lng: 0,
        url: '',
        type: 'newsapi',
        category: 'general',
        articleCount: 0,
        language: 'en',
      },
    })
  )

  return { articles, totalResults: data.totalResults ?? 0 }
}

export async function searchNewsApi(
  query: string,
  page = 1,
  pageSize = 30
): Promise<{ articles: Article[]; totalResults: number }> {
  const params = new URLSearchParams({
    apiKey: getApiKey(),
    q: query,
    page: String(page),
    pageSize: String(pageSize),
    sortBy: 'publishedAt',
    language: 'en',
  })

  const res = await fetch(`${NEWSAPI_BASE}/everything?${params}`, {
    next: { revalidate: 120 },
  })
  if (!res.ok) throw new Error(`NewsAPI search failed: ${res.status}`)

  const data = await res.json()

  const articles: Article[] = (data.articles ?? []).map(
    (a: NewsAPIRawArticle): Article => {
      const registeredSource = a.source.id
        ? getSourceByNewsApiId(a.source.id)
        : undefined

      const source: NewsSource = registeredSource ?? {
        id: a.source.id ?? 'unknown',
        name: a.source.name,
        country: 'US',
        lat: 38.9 + (Math.random() - 0.5) * 10,
        lng: -77.0 + (Math.random() - 0.5) * 10,
        url: '',
        type: 'newsapi',
        category: 'general',
        articleCount: 0,
        language: 'en',
      }

      return {
        id: articleId(a.url),
        title: a.title,
        description: a.description ?? '',
        url: a.url,
        publishedAt: a.publishedAt,
        imageUrl: a.urlToImage ?? undefined,
        source,
      }
    }
  )

  return { articles, totalResults: data.totalResults ?? 0 }
}

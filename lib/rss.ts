// Server-side only — rss-parser runs in Node.js environment
import Parser from 'rss-parser'
import type { Article, NewsSource } from '@/types'
import { NEWS_SOURCES, getSourceById } from './sources'

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'NewsGlobe/1.0 (+https://newsglobe.app)' },
})

function articleId(url: string): string {
  return Buffer.from(url).toString('base64').replace(/[=+/]/g, '').slice(0, 32)
}

export async function fetchRSSArticles(
  sourceId: string,
  limit = 20
): Promise<Article[]> {
  const source = getSourceById(sourceId)
  if (!source?.rssUrl) return []

  try {
    // Try a fetch with browser-like headers first (many sites block non-browser UAs)
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      Accept:
        'application/rss+xml, application/xml;q=0.9, text/html;q=0.8, */*;q=0.5',
      Referer: source.url || 'https://www.google.com',
    }

    try {
      const res = await fetch(source.rssUrl, { headers, method: 'GET' })
      if (!res.ok) throw new Error(`status ${res.status}`)

      const text = await res.text()
      const feed = await parser.parseString(text)
      return (feed.items ?? [])
        .slice(0, limit)
        .map((item): Article => ({
          id: articleId(item.link ?? item.title ?? Math.random().toString()),
          title: item.title ?? 'Untitled',
          description: item.contentSnippet ?? item.summary ?? '',
          url: item.link ?? '#',
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          imageUrl:
            (item as any).enclosure?.url ??
            (item as any)['media:content']?.$.url ??
            undefined,
          source,
        }))
    } catch (fetchErr) {
      // If fetch attempt failed (403, network, etc), fall back to parser.parseURL
      console.warn(
        `Fetch-based RSS attempt failed for ${sourceId} (${source.rssUrl}):`,
        fetchErr
      )
      const feed = await parser.parseURL(source.rssUrl)
      return (feed.items ?? [])
        .slice(0, limit)
        .map((item): Article => ({
          id: articleId(item.link ?? item.title ?? Math.random().toString()),
          title: item.title ?? 'Untitled',
          description: item.contentSnippet ?? item.summary ?? '',
          url: item.link ?? '#',
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          imageUrl:
            (item as any).enclosure?.url ??
            (item as any)['media:content']?.$.url ??
            undefined,
          source,
        }))
    }
  } catch (err) {
    console.error(`RSS fetch failed for ${sourceId} (${source.rssUrl}):`, err)
    return []
  }
}

export async function fetchAllRSSArticles(limit = 5): Promise<Article[]> {
  const rssSources = NEWS_SOURCES.filter((s) => s.rssUrl)
  const results = await Promise.allSettled(
    rssSources.map((s) => fetchRSSArticles(s.id, limit))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<Article[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
}

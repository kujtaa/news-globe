import { NextResponse } from 'next/server'
import { NEWS_SOURCES } from '@/lib/sources'
import type { SourcesResponse } from '@/types'

// Try to enrich with NewsAPI sources, fall back to our curated list
export async function GET() {
  try {
    let sources = [...NEWS_SOURCES]

    // Optionally merge with NewsAPI sources if key is set
    if (process.env.NEWSAPI_KEY) {
      try {
        const { fetchNewsApiSources } = await import('@/lib/newsapi')
        const apiSources = await fetchNewsApiSources()
        // Merge: keep our curated entries, add new ones from NewsAPI
        const existingIds = new Set(sources.map((s) => s.id))
        const newSources = apiSources.filter((s) => !existingIds.has(s.id))
        sources = [...sources, ...newSources]
      } catch (err) {
        console.warn('NewsAPI sources fetch failed, using curated list:', err)
      }
    }

    const response: SourcesResponse = {
      sources,
      totalCount: sources.length,
      cachedAt: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (error) {
    console.error('Sources API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}

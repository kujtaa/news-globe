import { NextResponse } from 'next/server'
import { getSourceById } from '@/lib/sources'
import type { ArticlesResponse } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceId = searchParams.get('sourceId')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), 50)

  if (!sourceId) {
    return NextResponse.json({ error: 'sourceId is required' }, { status: 400 })
  }

  const source = getSourceById(sourceId)
  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  }

  try {
    let articles: import('@/types').Article[] = []
    let totalResults = 0

    if (source.rssUrl) {
      // Prefer RSS — no rate limits
      const { fetchRSSArticles } = await import('@/lib/rss')
      articles = await fetchRSSArticles(sourceId, pageSize)
      totalResults = articles.length
    } else if (source.newsApiId && process.env.NEWSAPI_KEY) {
      const { fetchArticlesForSource } = await import('@/lib/newsapi')
      const result = await fetchArticlesForSource(source.newsApiId, page, pageSize)
      articles = result.articles
      totalResults = result.totalResults
    }

    const response: ArticlesResponse = {
      articles,
      sourceId,
      totalResults,
      page,
      hasMore: page * pageSize < totalResults,
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error(`Articles API error for ${sourceId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

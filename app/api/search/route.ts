import { NextResponse } from 'next/server'
import type { SearchResponse, Article, NewsSource } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    // Run NewsAPI and GDELT searches in parallel
    const [newsApiResult, gdeltResult] = await Promise.allSettled([
      process.env.NEWSAPI_KEY
        ? import('@/lib/newsapi').then((m) => m.searchNewsApi(query))
        : Promise.resolve({ articles: [], totalResults: 0 }),
      import('@/lib/gdelt').then((m) => m.searchGDELT(query)),
    ])

    const newsApiArticles =
      newsApiResult.status === 'fulfilled' ? newsApiResult.value.articles : []
    const gdeltArticles =
      gdeltResult.status === 'fulfilled' ? gdeltResult.value : []

    // Merge and deduplicate by URL
    const seen = new Set<string>()
    const allArticles: Article[] = []

    for (const article of [...newsApiArticles, ...gdeltArticles]) {
      if (!seen.has(article.url)) {
        seen.add(article.url)
        allArticles.push(article)
      }
    }

    // Collect unique sources that have matching articles
    const sourceMap = new Map<string, NewsSource>()
    for (const article of allArticles) {
      if (article.source.lat !== 0 || article.source.lng !== 0) {
        if (!sourceMap.has(article.source.id)) {
          sourceMap.set(article.source.id, {
            ...article.source,
            articleCount: 0,
          })
        }
        const s = sourceMap.get(article.source.id)!
        s.articleCount += 1
      }
    }

    const response: SearchResponse = {
      articles: allArticles.slice(0, 100),
      sources: Array.from(sourceMap.values()),
      query,
      totalResults: allArticles.length,
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

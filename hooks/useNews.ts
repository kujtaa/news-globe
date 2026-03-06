'use client'

import { useQuery } from '@tanstack/react-query'
import type { SourcesResponse, ArticlesResponse, SearchResponse } from '@/types'

export function useSources() {
  return useQuery<SourcesResponse>({
    queryKey: ['sources'],
    queryFn: () => fetch('/api/sources').then((r) => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useArticles(sourceId: string | null, page = 1) {
  return useQuery<ArticlesResponse>({
    queryKey: ['articles', sourceId, page],
    queryFn: () =>
      fetch(`/api/articles?sourceId=${sourceId}&page=${page}`).then((r) =>
        r.json()
      ),
    enabled: !!sourceId,
    staleTime: 1000 * 60 * 5, // 5 min
  })
}

export function useSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ['search', query],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 min
  })
}

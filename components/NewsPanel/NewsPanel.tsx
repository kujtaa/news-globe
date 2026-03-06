'use client'

import { useEffect } from 'react'
import { useGlobeStore } from '@/store/globeStore'
import { useArticles, useSources, useSearch } from '@/hooks/useNews'
import SourceInfo from './SourceInfo'
import ArticleCard from './ArticleCard'

export default function NewsPanel() {
  const {
    selectedSource,
    selectedCountry,
    isPanelOpen,
    setIsPanelOpen,
    setSelectedSource,
    setSelectedCountry,
    searchQuery,
  } = useGlobeStore()

  const { data: allSourcesResp } = useSources()
  const { data: searchData } = useSearch(searchQuery)

  // Only fetch all articles when there's no active search query
  const { data, isLoading, isError } = useArticles(
    isPanelOpen && selectedSource && !searchQuery ? selectedSource.id : null
  )

  // When a search query is active, derive articles + sources from cached search results
  const searchArticles = searchQuery && searchData && selectedSource
    ? searchData.articles.filter((a) => a.source.id === selectedSource.id)
    : null

  const searchSourcesForCountry = searchQuery && searchData && selectedCountry
    ? (allSourcesResp?.sources ?? []).filter(
        (s) => s.country === selectedCountry && searchData.sources.some((ss) => ss.id === s.id)
      )
    : null

  // Close with Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPanelOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setIsPanelOpen])

  // If no selection (neither country nor source), don't show panel
  if (!selectedSource && !selectedCountry) return null

  return (
    <>
      {/* Backdrop */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed z-20
          bg-black/90 backdrop-blur-md border-white/10
          flex flex-col shadow-2xl
          transition-transform duration-300 ease-out
          bottom-0 left-0 right-0 h-[78vh] rounded-t-2xl border-t
          sm:bottom-auto sm:left-auto sm:top-0 sm:right-0 sm:h-full sm:w-[360px] sm:rounded-none sm:border-t-0 sm:border-l
          ${isPanelOpen
            ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0'
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'}
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsPanelOpen(false)
            setSelectedSource(null)
          }}
          className="absolute top-3 right-3 z-30 text-gray-400 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close panel"
        >
          ✕
        </button>

        {/* Header: either country or source */}
        {selectedCountry && !selectedSource && (
          <div className="p-3 pr-10 border-b border-white/10">
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-sm text-gray-400 hover:text-white mb-2"
            >
              ← Back to globe
            </button>
            <h3 className="text-lg font-semibold truncate">{selectedCountry}</h3>
            <p className="text-xs text-gray-400">Sources for this country</p>
          </div>
        )}

        {selectedSource && (
          <SourceInfo
            source={selectedSource}
            articleCount={selectedSource.articleCount || undefined}
          />
        )}

        {/* Articles or sources list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isError && (
            <p className="text-sm text-red-400 text-center mt-8">
              Failed to load articles. Try again later.
            </p>
          )}

          {/* When a country is selected but no specific source, list sources */}
          {selectedCountry && !selectedSource && (
            <div className="space-y-2">
              {(searchSourcesForCountry ?? allSourcesResp?.sources.filter((s) => s.country === selectedCountry) ?? [])
                .map((s) => {
                  const matchCount = searchData?.sources.find((ss) => ss.id === s.id)?.articleCount
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSource(s)}
                      className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.language} · {s.category}</div>
                        </div>
                        <div className="text-xs text-cyan-400 shrink-0">
                          {matchCount != null ? `${matchCount} matching →` : 'View →'}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          )}

          {!selectedCountry && selectedSource && (
            <>
              {searchQuery ? (
                // Show only articles matching the search query
                searchArticles && searchArticles.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-8">
                    No matching articles in this source.
                  </p>
                ) : (
                  searchArticles?.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))
                )
              ) : (
                // No active search — show all RSS articles
                <>
                  {isLoading && (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 rounded-lg bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  )}
                  {!isLoading && !isError && data?.articles?.length === 0 && (
                    <p className="text-sm text-gray-500 text-center mt-8">
                      No articles available for this source.
                    </p>
                  )}
                  {data?.articles?.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {selectedSource && selectedSource.url && (
          <div className="p-3 border-t border-white/10 text-center">
            <a
              href={selectedSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              View full website →
            </a>
          </div>
        )}
      </div>
    </>
  )
}

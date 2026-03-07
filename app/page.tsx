'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useSources } from '@/hooks/useNews'
import { useGlobeStore } from '@/store/globeStore'
import SearchBar from '@/components/SearchBar/SearchBar'
import NewsPanel from '@/components/NewsPanel/NewsPanel'
import SourcesFooter from '@/components/SourcesFooter/SourcesFooter'

// Globe.gl requires WebGL — must be loaded client-side only
const GlobeViewer = dynamic(() => import('@/components/Globe/GlobeViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Loading globe...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const { data: sourcesData, isLoading } = useSources()
  const { activeCategory, highlightedSourceIds, setGlobeRotating } = useGlobeStore()

  // Filter by active category
  const filteredSources = useMemo(() => {
    const all = sourcesData?.sources ?? []
    if (activeCategory === 'all') return all
    return all.filter((s) => s.category === activeCategory)
  }, [sourcesData, activeCategory])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Full-screen globe — z-0 + isolate creates a stacking context so globe.gl's
          internal HTML elements (flag markers) can't bleed above the panel (z-20) */}
      <div className="absolute inset-0 z-0 isolate">
        {!isLoading && filteredSources.length > 0 && (
          <GlobeViewer
            sources={filteredSources}
            highlightedIds={highlightedSourceIds}
          />
        )}
      </div>

      {/* Top UI overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 sm:pt-6 px-4 pointer-events-none">
        {/* Title */}
        <div className="mb-3 sm:mb-4 text-center pointer-events-none">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            News Globe
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {sourcesData
              ? `${sourcesData.totalCount} sources worldwide`
              : 'Loading sources...'}
          </p>
        </div>

        {/* Search bar — re-enable pointer events */}
        <div className="pointer-events-auto w-full max-w-xl">
          <SearchBar />
        </div>
      </div>

      {/* Bottom legend — hidden on mobile to reduce clutter */}
      <div className="hidden sm:flex absolute bottom-4 left-4 z-10 flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          News source
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
          Matches search
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          Selected
        </div>
      </div>

      {/* Controls hint — desktop */}
      <div className="hidden sm:block absolute bottom-16 right-4 z-10 text-xs text-gray-500 text-right pointer-events-none">
        <p>Drag to rotate · Scroll to zoom</p>
        <p>Click a dot to read articles</p>
      </div>

      {/* Controls hint — mobile */}
      <div className="sm:hidden absolute bottom-16 right-4 z-10 text-xs text-gray-500 text-right pointer-events-none">
        <p>Drag to rotate · Pinch to zoom</p>
        <p>Tap a dot to read articles</p>
      </div>

      {/* Sources footer — bottom-right */}
      <SourcesFooter />

      {/* Resume rotation button */}
      <button
        className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-gray-300 backdrop-blur-sm transition-all"
        onClick={() => setGlobeRotating(true)}
      >
        ↺ Resume rotation
      </button>

      {/* News panel (slides in from right) */}
      <NewsPanel />
    </main>
  )
}

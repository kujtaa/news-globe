import { create } from 'zustand'
import type { GlobeStore, NewsSource, SourceCategory } from '@/types'

export const useGlobeStore = create<GlobeStore>((set) => ({
  selectedSource: null,
  selectedCountry: null,
  hoveredSource: null,
  searchQuery: '',
  activeCategory: 'all',
  highlightedSourceIds: [],
  isPanelOpen: false,
  globeRotating: true,
  flyToCountry: null,

  setSelectedSource: (source) =>
    set({ selectedSource: source, selectedCountry: null, isPanelOpen: source !== null }),
  setSelectedCountry: (country) =>
    set({ selectedCountry: country, selectedSource: null, isPanelOpen: country !== null }),
  setHoveredSource: (source) => set({ hoveredSource: source }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setHighlightedSourceIds: (ids) => set({ highlightedSourceIds: ids }),
  setFlyToCountry: (country) => set({ flyToCountry: country }),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
  setGlobeRotating: (rotating) => set({ globeRotating: rotating }),
}))

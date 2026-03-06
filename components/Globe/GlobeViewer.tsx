'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'

const FLAG_BASE = 'https://flagcdn.com/w40'
import type { NewsSource } from '@/types'
import { useGlobeStore } from '@/store/globeStore'
import { COUNTRY_CENTROIDS } from '@/lib/sources'

interface Props {
  sources: NewsSource[]
  highlightedIds?: string[]
}

export default function GlobeViewer({ sources, highlightedIds = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs so flag builder always reads the latest state without stale closures
  const selectedCountryRef = useRef<string | null | undefined>(null)
  const highlightSetRef = useRef<Set<string>>(new Set())
  const flagPointsRef = useRef<any[]>([])

  const {
    selectedSource,
    selectedCountry,
    setSelectedSource,
    setSelectedCountry,
    setHoveredSource,
    globeRotating,
    setGlobeRotating,
    flyToCountry,
    setFlyToCountry,
  } = useGlobeStore()

  const highlightSet = new Set(highlightedIds)

  // Keep refs in sync so flag elements always reflect latest state
  useEffect(() => { selectedCountryRef.current = selectedCountry }, [selectedCountry])
  useEffect(() => { highlightSetRef.current = new Set(highlightedIds) }, [highlightedIds])

  const renderFlags = useCallback((pts: any[]) => {
    if (!globeRef.current) return
    flagPointsRef.current = pts
    globeRef.current
      .htmlElementsData(pts)
      .htmlElement((d: any) => {
        const isSelected = d.country === selectedCountryRef.current
        const isHl = d.sources?.some((s: NewsSource) => highlightSetRef.current.has(s.id))
        const border = isSelected ? '#ff6b35' : isHl ? '#ffd700' : 'rgba(0,212,255,0.75)'
        const shadow = isSelected
          ? '0 0 8px #ff6b35, 0 0 16px rgba(255,107,53,0.5)'
          : isHl
          ? '0 0 6px #ffd700'
          : '0 1px 4px rgba(0,0,0,0.6)'
        const code = d.country.toLowerCase()
        const el = document.createElement('div')
        el.style.cssText = 'pointer-events:none;'
        el.innerHTML = `<img
          src="${FLAG_BASE}/${code}.png"
          style="width:22px;height:auto;border-radius:2px;border:2px solid ${border};box-shadow:${shadow};display:block;"
          onerror="this.style.display='none'"
        />`
        return el
      })
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.025)
  }, [])

  // Group sources by country for country-dots
  const countryPoints = useMemo(() => {
    const map = new Map<string, { country: string; lat: number; lng: number; sources: NewsSource[] }>()
    for (const s of sources) {
      const c = s.country.toUpperCase()
      if (!map.has(c)) {
        const centroid = COUNTRY_CENTROIDS[c]
        map.set(c, {
          country: c,
          lat: centroid ? centroid.lat : s.lat,
          lng: centroid ? centroid.lng : s.lng,
          sources: [s],
        })
      } else {
        map.get(c)!.sources.push(s)
      }
    }
    return Array.from(map.values())
  }, [sources])

  const getPointColor = useCallback(
    (d: any) => {
      if (d.country && d.country === selectedCountry) return '#ff6b35'
      const source: NewsSource | undefined = d.source ?? d.sources?.[0]
      if (!source) return '#00d4ff'
      if (source.id === selectedSource?.id) return '#ff6b35'
      // If this is a country-point, check if any of its sources are highlighted
      if (d.sources && d.sources.some((s: NewsSource) => highlightSet.has(s.id))) return '#ffd700'
      if (highlightSet.has(source.id)) return '#ffd700'
      return '#00d4ff'
    },
    [selectedSource, selectedCountry, highlightedIds]
  )

  const getPointRadius = useCallback(
    (d: any) => {
      // Determine total article count for this point (single source or aggregated country)
      let total = 0
      if (d.source) total = d.source.articleCount ?? 0
      else if (d.sources) total = d.sources.reduce((acc: number, s: NewsSource) => acc + (s.articleCount || 0), 0)
      // Fallback to number of sources if counts are zero
      if (total === 0 && d.sources) total = d.sources.length

      const base = Math.max(0.35, Math.sqrt(Math.max(total, 1)) * 0.08) * 1.5
      return base
    },
    [selectedSource, highlightedIds]
  )

  useEffect(() => {
    if (!containerRef.current) return

    let globe: any

    const initGlobe = async () => {
      const GlobeModule = await import('globe.gl')
      const Globe = GlobeModule.default

      // Show one point per country. If search is active (highlightedIds), only include countries that have highlighted sources
      const points = countryPoints
        .filter((c) => {
          if (!highlightedIds || highlightedIds.length === 0) return true
          return c.sources.some((s) => highlightSet.has(s.id))
        })
        .map((c) => ({
          id: `country-${c.country}`,
          lat: c.lat,
          lng: c.lng,
          country: c.country,
          sources: c.sources,
        }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      globe = (Globe as any)()(containerRef.current!)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(points)
        .pointLat('lat')
        .pointLng('lng')
        .pointAltitude(0.015)
        .pointRadius(getPointRadius)
        .pointColor(getPointColor)
        .pointLabel((d: any) => {
          const country = d.country
          const count = d.sources?.length ?? 0
          return `
            <div style="
              background: rgba(0,0,0,0.85);
              color: #fff;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 13px;
              font-family: sans-serif;
              border: 1px solid rgba(0,212,255,0.4);
              pointer-events: none;
            ">
              <strong>${country}</strong><br/>
              <span style="color:#aaa;font-size:11px">${count} source(s)</span>
            </div>
          `
        })
        .onPointClick((d: any) => {
          // Select the country and open panel showing its sources
          setSelectedCountry(d.country)
          setGlobeRotating(false)
          globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 1000)
        })
        .onPointHover((d: any) => {
          // Show first source on hover for quick preview
          setHoveredSource(d?.sources?.[0] ?? null)
          if (containerRef.current) {
            containerRef.current.style.cursor = d ? 'pointer' : 'default'
          }
        })
        .width(containerRef.current!.clientWidth)
        .height(containerRef.current!.clientHeight)

      globeRef.current = globe
      renderFlags(points)

      // Start auto-rotation
      const controls = globe.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
      controls.enableDamping = true
    }

    initGlobe()

    const handleResize = () => {
      if (globeRef.current && containerRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (globeRef.current) {
        globeRef.current._destructor?.()
      }
    }
  }, []) // init once

  // Update point colors/sizes and flags reactively
  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.pointRadius(getPointRadius).pointColor(getPointColor)
    renderFlags(flagPointsRef.current)
  }, [selectedSource, selectedCountry, highlightedIds])

  // Update sources data and flags when sources list changes
  useEffect(() => {
    if (!globeRef.current) return
    const points = countryPoints
      .map((c) => ({ id: `country-${c.country}`, lat: c.lat, lng: c.lng, country: c.country, sources: c.sources }))
    globeRef.current.pointsData(points)
    renderFlags(points)
  }, [countryPoints])

  // Toggle auto-rotation
  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    if (controls) controls.autoRotate = globeRotating
  }, [globeRotating])

  // Fly to a country when requested from search
  useEffect(() => {
    if (!flyToCountry || !globeRef.current) return
    const centroid = COUNTRY_CENTROIDS[flyToCountry]
    if (!centroid) return
    setGlobeRotating(false)
    globeRef.current.pointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 1.5 }, 1000)
    setTimeout(() => {
      setSelectedCountry(flyToCountry)
      setFlyToCountry(null)
    }, 1000)
  }, [flyToCountry])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onMouseDown={() => setGlobeRotating(false)}
    />
  )
}

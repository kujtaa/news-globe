'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useSources } from '@/hooks/useNews'
import type { SourceCategory } from '@/types'

const CATEGORY_LABELS: Record<SourceCategory | 'all', string> = {
  all: 'All Categories',
  general: 'General',
  politics: 'Politics',
  technology: 'Technology',
  business: 'Business',
  science: 'Science',
  sports: 'Sports',
  entertainment: 'Entertainment',
  health: 'Health',
}

export default function SourcesFooter() {
  const { data } = useSources()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SourceCategory | 'all'>('all')
  const [showSuggest, setShowSuggest] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', country: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const sources = data?.sources ?? []

  const filtered = useMemo(() => {
    let list = sources
    if (categoryFilter !== 'all') {
      list = list.filter((s) => s.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          (s.description ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [sources, search, categoryFilter])

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Focus search when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [isOpen])

  function handleSuggestSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subject = `Source request: ${form.name}`
    const body = [
      `Source name: ${form.name}`,
      `URL: ${form.url}`,
      `Country: ${form.country || '—'}`,
      `Notes: ${form.notes || '—'}`,
    ].join('\n')
    window.location.href = `mailto:info@newsatlas.live?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSubmitted(true)
  }

  return (
    <div ref={panelRef} className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {isOpen && (
        <div className="w-72 sm:w-80 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">
              News Sources
              <span className="ml-2 text-xs font-normal text-gray-400">
                {sources.length} total
              </span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Filters */}
          <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sources..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as SourceCategory | 'all')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
            >
              {(Object.keys(CATEGORY_LABELS) as Array<SourceCategory | 'all'>).map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900">
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Source list */}
          <div className="overflow-y-auto max-h-60 px-3 pb-2 space-y-0.5 scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-6">No sources found</p>
            ) : (
              filtered.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-base leading-none shrink-0">
                    {countryFlag(source.country)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">{source.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{source.country} · {source.category}</p>
                  </div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      aria-label={`Visit ${source.name}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Suggest button */}
          <div className="border-t border-white/10 px-3 py-2.5">
            <button
              onClick={() => { setShowSuggest(true); setSubmitted(false) }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors py-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Suggest a source
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-white/10 hover:border-cyan-500/40 hover:bg-gray-800/90 backdrop-blur-sm transition-all text-xs text-gray-300 hover:text-white shadow-lg"
      >
        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h2" />
        </svg>
        Sources
        {sources.length > 0 && (
          <span className="bg-white/10 text-gray-400 rounded-full px-1.5 py-0.5 text-[10px] leading-none">
            {sources.length}
          </span>
        )}
      </button>

      {/* Suggest modal */}
      {showSuggest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Suggest a Source</h2>
              <button
                onClick={() => setShowSuggest(false)}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className="px-5 py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-white font-medium">Thanks for the suggestion!</p>
                <p className="text-xs text-gray-400">Your email client should have opened. We'll review your suggestion shortly.</p>
                <button
                  onClick={() => setShowSuggest(false)}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSuggestSubmit} className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Source name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Der Spiegel"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">RSS / Website URL *</label>
                  <input
                    required
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://example.com/feed"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="e.g. Germany"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Why should we add this source?"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSuggest(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs text-black font-semibold transition-colors"
                  >
                    Send suggestion
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 text-center">
                  Opens your email client · info@newsatlas.live
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐'
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

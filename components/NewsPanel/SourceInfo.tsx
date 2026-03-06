'use client'

import type { NewsSource } from '@/types'

const FLAG_BASE = 'https://flagcdn.com/24x18'

interface Props {
  source: NewsSource
  articleCount?: number
}

export default function SourceInfo({ source, articleCount }: Props) {
  const flagUrl = source.country !== 'UN'
    ? `${FLAG_BASE}/${source.country.toLowerCase()}.png`
    : null

  return (
    <div className="p-4 border-b border-white/10">
      {/* pr-8 leaves room for the absolute close button (top-3 right-3) */}
      <div className="flex items-center gap-3 pr-8">
        {flagUrl && (
          <img
            src={flagUrl}
            alt={source.country}
            className="h-5 rounded-sm opacity-90 shrink-0"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">
            {source.name}
          </h2>
          <p className="text-xs text-gray-400">
            {source.country} · {source.category}
            {source.language !== 'en' && ` · ${source.language}`}
          </p>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0"
        >
          Visit ↗
        </a>
      </div>
      {source.description && (
        <p className="mt-2 text-xs text-gray-400 leading-relaxed">
          {source.description}
        </p>
      )}
      {articleCount !== undefined && articleCount > 0 && (
        <p className="mt-1 text-xs text-yellow-400">
          {articleCount} article{articleCount !== 1 ? 's' : ''} match your search
        </p>
      )}
    </div>
  )
}

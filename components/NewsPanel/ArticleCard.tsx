'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Article } from '@/types'

interface Props {
  article: Article
}

async function translateText(text: string, sourceLang: string): Promise<string> {
  const langpair = `${sourceLang}|en`
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`
  )
  const data = await res.json()
  return data?.responseData?.translatedText ?? text
}

export default function ArticleCard({ article }: Props) {
  const [translated, setTranslated] = useState<{ title: string; description: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const lang = article.source?.language ?? 'en'
  const isEnglish = lang === 'en'

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    } catch {
      return ''
    }
  })()

  const handleTranslate = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (translated) {
      setTranslated(null)
      return
    }

    setLoading(true)
    try {
      const [title, description] = await Promise.all([
        translateText(article.title, lang),
        article.description ? translateText(article.description, lang) : Promise.resolve(''),
      ])
      setTranslated({ title, description })
    } catch {
      // silently fail — keep original text
    } finally {
      setLoading(false)
    }
  }, [translated, article, lang])

  const displayTitle = translated?.title ?? article.title
  const displayDescription = translated?.description ?? article.description

  return (
    <div className="rounded-lg border border-white/10 hover:border-cyan-400/40 hover:bg-white/5 transition-all duration-200 overflow-hidden">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block p-3"
      >
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-32 object-cover rounded-md mb-2 opacity-80 group-hover:opacity-100 transition-opacity"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        )}
        <h3 className="text-sm font-medium text-white leading-snug line-clamp-3 group-hover:text-cyan-300 transition-colors">
          {displayTitle}
        </h3>
        {displayDescription && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">
            {displayDescription}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">{timeAgo}</p>
      </a>

      {!isEnglish && (
        <div className="px-3 pb-2">
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-3 h-3 border border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
            ) : (
              <span>🌐</span>
            )}
            {loading ? 'Translating...' : translated ? 'Show original' : `Translate to English`}
          </button>
        </div>
      )}
    </div>
  )
}

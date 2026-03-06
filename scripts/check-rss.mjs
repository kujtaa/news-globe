/**
 * RSS Checker — tests every rssUrl in lib/sources.ts
 * using the same fetch strategy as lib/rss.ts
 *
 * Run: node scripts/check-rss.mjs
 * Options:
 *   --concurrency=10   parallel requests (default 8)
 *   --timeout=12000    ms per request (default 10000)
 *   --failed-only      print only broken sources
 */
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const Parser = require('rss-parser')

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const CONCURRENCY = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] ?? '8')
const TIMEOUT_MS  = parseInt(args.find(a => a.startsWith('--timeout='))?.split('=')[1]     ?? '10000')
const FAILED_ONLY = args.includes('--failed-only')

// ── Extract sources from sources.ts via regex ─────────────────────────────────
const srcFile = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../lib/sources.ts'),
  'utf8'
)

function extractField(block, field) {
  const m = block.match(new RegExp(`${field}:\\s*['"]([^'"]+)['"]`))
  return m?.[1] ?? null
}

// Split on object literal boundaries that contain rssUrl
const sources = []
const blocks = srcFile.split(/(?=\s*\{)/)
for (const block of blocks) {
  const rssUrl = extractField(block, 'rssUrl')
  if (!rssUrl) continue
  const id      = extractField(block, 'id')
  const name    = extractField(block, 'name')
  const country = extractField(block, 'country')
  if (id && rssUrl) sources.push({ id, name: name ?? id, country: country ?? '??', rssUrl })
}

console.log(`\n🔍  Checking ${sources.length} RSS sources  (concurrency=${CONCURRENCY}, timeout=${TIMEOUT_MS}ms)\n`)

// ── Check a single source ─────────────────────────────────────────────────────
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15'

const parser = new Parser({ timeout: TIMEOUT_MS, headers: { 'User-Agent': BROWSER_UA } })

async function checkSource(src) {
  const start = Date.now()
  const result = { ...src, ok: false, articleCount: 0, error: null, ms: 0, contentType: '' }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(src.rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
        Referer: 'https://www.google.com',
      },
    })
    clearTimeout(timer)

    result.contentType = res.headers.get('content-type') ?? ''
    result.httpStatus  = res.status

    if (!res.ok) {
      result.error = `HTTP ${res.status}`
      result.ms = Date.now() - start
      return result
    }

    const text = await res.text()
    const snippet = text.slice(0, 500).toLowerCase()

    // Is this actually a feed?
    const looksLikeFeed =
      snippet.includes('<?xml') ||
      snippet.includes('<rss') ||
      snippet.includes('<feed') ||
      result.contentType.includes('xml')

    if (!looksLikeFeed) {
      result.error = `Not a feed (got ${result.contentType || 'text/html'})`
      result.ms = Date.now() - start
      return result
    }

    const feed = await parser.parseString(text)
    result.articleCount = feed.items?.length ?? 0
    result.feedTitle    = feed.title ?? ''

    if (result.articleCount === 0) {
      result.error = 'Parsed OK but 0 articles'
    } else {
      result.ok = true
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      result.error = `Timeout (>${TIMEOUT_MS}ms)`
    } else {
      result.error = err.message?.slice(0, 120) ?? String(err)
    }
  }

  result.ms = Date.now() - start
  return result
}

// ── Concurrency pool ──────────────────────────────────────────────────────────
async function runPool(items, fn, concurrency) {
  const results = []
  const queue   = [...items]
  let done = 0

  async function worker() {
    while (queue.length) {
      const item = queue.shift()
      const r = await fn(item)
      results.push(r)
      done++
      const pct  = Math.round((done / items.length) * 100)
      const bar  = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░')
      process.stdout.write(`\r  [${bar}] ${pct}%  (${done}/${items.length})  `)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  process.stdout.write('\r' + ' '.repeat(60) + '\r')
  return results
}

// ── Run & report ──────────────────────────────────────────────────────────────
const results = await runPool(sources, checkSource, CONCURRENCY)

const ok      = results.filter(r => r.ok)
const warn    = results.filter(r => !r.ok && r.articleCount === 0 && r.error?.includes('0 articles'))
const failed  = results.filter(r => !r.ok && !warn.includes(r))

// Sort failed by country for easy scanning
failed.sort((a, b) => a.country.localeCompare(b.country))

const COL = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
}

function row(r, color, tag) {
  const articles = r.articleCount > 0 ? `${r.articleCount} articles` : ''
  const ms       = `${r.ms}ms`
  const err      = r.error ? ` — ${r.error}` : ''
  console.log(
    `  ${color}${tag}${COL.reset}  [${COL.bold}${r.country}${COL.reset}] ${r.name.padEnd(36)} ${COL.dim}${r.rssUrl.slice(0, 60).padEnd(60)}${COL.reset}  ${COL.dim}${ms.padStart(6)}${COL.reset}  ${COL.green}${articles}${COL.reset}${COL.yellow}${err}${COL.reset}`
  )
}

if (!FAILED_ONLY) {
  console.log(`${COL.bold}${COL.green}✅  OK  (${ok.length})${COL.reset}`)
  ok.forEach(r => row(r, COL.green, '✅'))

  if (warn.length) {
    console.log(`\n${COL.bold}${COL.yellow}⚠️   EMPTY  (${warn.length})${COL.reset}`)
    warn.forEach(r => row(r, COL.yellow, '⚠️ '))
  }
}

console.log(`\n${COL.bold}${COL.red}❌  FAILED  (${failed.length})${COL.reset}`)
failed.forEach(r => row(r, COL.red, '❌'))

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`
${COL.bold}━━━  Summary  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COL.reset}
  ${COL.green}✅  Working   ${COL.bold}${ok.length}${COL.reset}
  ${COL.yellow}⚠️   Empty     ${COL.bold}${warn.length}${COL.reset}
  ${COL.red}❌  Broken    ${COL.bold}${failed.length}${COL.reset}
  ${COL.dim}    Total     ${sources.length}${COL.reset}

  Run with ${COL.cyan}--failed-only${COL.reset} to see only broken sources.
`)

// ── Export broken list as JSON for easy fixing ────────────────────────────────
const broken = [...warn, ...failed].map(r => ({
  id: r.id, name: r.name, country: r.country, rssUrl: r.rssUrl, error: r.error,
}))
fs.writeFileSync('scripts/rss-broken.json', JSON.stringify(broken, null, 2))
console.log(`  Broken list written to ${COL.cyan}scripts/rss-broken.json${COL.reset}\n`)

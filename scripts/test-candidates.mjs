import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Parser = require('rss-parser')
const parser = new Parser({ timeout: 8000 })
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15'

const candidates = [
  // Reuters
  { id: 'reuters', url: 'https://feeds.reuters.com/reuters/worldNews' },
  // AP
  { id: 'ap', url: 'https://apnews.com/rss' },
  { id: 'ap', url: 'https://apnews.com/feed' },
  { id: 'ap', url: 'https://feeds.apnews.com/rss/APTopNews' },
  // Politico
  { id: 'politico', url: 'https://rss.politico.com/politics-news.xml' },
  { id: 'politico', url: 'https://www.politico.com/rss/congress.xml' },
  // NHK World
  { id: 'nhk', url: 'https://www3.nhk.or.jp/nhkworld/en/news/feeds/all.xml' },
  { id: 'nhk', url: 'https://www3.nhk.or.jp/nhkworld/en/feeds/rss/' },
  // SWI swissinfo
  { id: 'swissinfo', url: 'https://www.swissinfo.ch/eng/rss' },
  { id: 'swissinfo', url: 'https://www.swissinfo.ch/eng/feed/rss' },
  { id: 'swissinfo', url: 'https://www.swissinfo.ch/service/rss/full' },
  // Publico PT
  { id: 'publico', url: 'https://www.publico.pt/rss' },
  { id: 'publico', url: 'https://feeds.publico.pt/publico/rss' },
  // Hurriyet
  { id: 'hurriyet', url: 'https://www.hurriyetdailynews.com/rss/home' },
  { id: 'hurriyet', url: 'https://www.hurriyetdailynews.com/rss/world' },
  // Tirana Times
  { id: 'tirana-times', url: 'https://www.tiranatimes.com/feed/' },
  { id: 'tirana-times', url: 'https://www.tiranatimes.com/?feed=rss2' },
  // Exit Albania
  { id: 'exit-al', url: 'https://exit.al/feed/' },
  // Albanian Daily News
  { id: 'adn', url: 'https://www.albaniandailynews.com/feed/' },
  // Klix BA
  { id: 'klix', url: 'https://www.klix.ba/rss/vijesti' },
  // Avaz BA
  { id: 'avaz', url: 'https://avaz.ba/feed/' },
  // Oslobodjenje BA
  { id: 'oslo', url: 'https://www.oslobodjenje.ba/feed/' },
  { id: 'oslo', url: 'https://oslobodjenje.ba/rss' },
  // Capital BG
  { id: 'capital-bg', url: 'https://www.capital.bg/rss/news/' },
  // Novinite BG
  { id: 'novinite', url: 'https://www.novinite.com/feed/' },
  // BTA BG
  { id: 'bta', url: 'https://bta.bg/en/rss' },
  { id: 'bta', url: 'https://www.bta.bg/en/feed' },
  // Kathimerini GR
  { id: 'kath', url: 'https://www.ekathimerini.com/rss/news' },
  // HRT HR
  { id: 'hrt', url: 'https://vijesti.hrt.hr/feed/' },
  { id: 'hrt', url: 'https://www.hrt.hr/rss/vijesti' },
  // Irish Examiner
  { id: 'irish-ex', url: 'https://www.irishexaminer.com/rss/' },
  { id: 'irish-ex', url: 'https://www.irishexaminer.com/feed/' },
  // Pobjeda ME
  { id: 'pobjeda', url: 'https://www.pobjeda.me/rss' },
  // RTCG ME
  { id: 'rtcg', url: 'https://rtcg.me/feed/' },
  { id: 'rtcg', url: 'https://www.rtcg.me/feed/' },
  // MKD.mk
  { id: 'mkd', url: 'https://www.mkd.mk/feed' },
  // Sitel MK
  { id: 'sitel', url: 'https://www.sitel.com.mk/rss' },
  { id: 'sitel', url: 'https://sitel.com.mk/feed/' },
  // Blic RS
  { id: 'blic', url: 'https://www.blic.rs/rss/vesti' },
  { id: 'blic', url: 'https://www.blic.rs/feed' },
  // RTS RS
  { id: 'rts', url: 'https://www.rts.rs/page/stories/sr/rss.html' },
  // B92 RS
  { id: 'b92', url: 'https://www.b92.net/rss/' },
  { id: 'b92', url: 'https://www.b92.net/info/rss.php' },
  // Siol SI
  { id: 'siol', url: 'https://www.siol.net/feed' },
  // RTV Slovenia
  { id: 'rtvslo', url: 'https://www.rtvslo.si/rss/prispevki' },
  { id: 'rtvslo', url: 'https://www.rtvslo.si/rss/slovenija' },
  // The Times London
  { id: 'times-london', url: 'https://www.thetimes.com/rss' },
  // KosovaPress
  { id: 'kosovapress', url: 'https://kosovapress.com/feed/' },
  { id: 'kosovapress', url: 'https://kosovapress.com/rss/' },
  // Denmark replacement: DR
  { id: 'dr-dk', url: 'https://www.dr.dk/nyheder/service/feeds/allenyheder' },
  // Norway replacement: NRK
  { id: 'nrk-no', url: 'https://www.nrk.no/toppsaker.rss' },
  // Sweden replacement: SVT
  { id: 'svt-se', url: 'https://www.svt.se/nyheter/rss.xml' },
  { id: 'svt-se', url: 'https://feeds.svt.se/svt/nyheter' },
]

async function check(c) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(c.url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'application/rss+xml,application/xml,*/*' } })
    clearTimeout(t)
    const status = res.status
    if (!res.ok) return { ...c, status, ok: false }
    const text = await res.text()
    const isXml = text.slice(0, 500).toLowerCase().includes('<?xml') || text.includes('<rss') || text.includes('<feed')
    if (!isXml) return { ...c, status, ok: false, reason: 'not-xml' }
    const feed = await parser.parseString(text)
    return { ...c, ok: (feed.items?.length ?? 0) > 0, count: feed.items?.length ?? 0, status }
  } catch(e) {
    return { ...c, ok: false, reason: e.message?.slice(0, 60) }
  }
}

const results = await Promise.all(candidates.map(check))
results.filter(r => r.ok).forEach(r => console.log('OK  ', r.id.padEnd(16), r.count, r.url))
results.filter(r => !r.ok).forEach(r => console.log('FAIL', r.id.padEnd(16), r.status ?? '', r.reason ?? '', r.url))

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const Parser = require('rss-parser')
const parser = new Parser({ timeout: 10000 })
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15'

// Candidate sources for countries currently missing from the globe
const candidates = [
  // ── AR Argentina ──────────────────────────────────────────────────
  { country: 'AR', name: 'Infobae', url: 'https://www.infobae.com/feeds/rss/' },
  { country: 'AR', name: 'La Nacion', url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/' },
  { country: 'AR', name: 'Clarin', url: 'https://www.clarin.com/rss/lo-ultimo/' },
  { country: 'AR', name: 'Buenos Aires Herald', url: 'https://buenosairesherald.com/feed' },

  // ── CZ Czechia ────────────────────────────────────────────────────
  { country: 'CZ', name: 'Czech Radio', url: 'https://english.radio.cz/rss/cesky-rozhlas-radio-prague-international-all-sections' },
  { country: 'CZ', name: 'Prague Morning', url: 'https://praguemorning.cz/feed/' },
  { country: 'CZ', name: 'Expats CZ', url: 'https://www.expats.cz/rss/news/' },
  { country: 'CZ', name: 'Czech Radio Int', url: 'https://english.radio.cz/feed' },

  // ── EG Egypt ──────────────────────────────────────────────────────
  { country: 'EG', name: 'Egypt Independent', url: 'https://egyptindependent.com/feed/' },
  { country: 'EG', name: 'Al-Ahram Weekly', url: 'https://english.ahram.org.eg/NewsContentP/rss.aspx' },
  { country: 'EG', name: 'Mada Masr', url: 'https://www.madamasr.com/en/feed/' },
  { country: 'EG', name: 'Daily News Egypt', url: 'https://dailynewsegypt.com/feed/' },

  // ── FI Finland ────────────────────────────────────────────────────
  { country: 'FI', name: 'Yle News', url: 'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss' },
  { country: 'FI', name: 'Helsinki Times', url: 'https://www.helsinkitimes.fi/rss.xml' },
  { country: 'FI', name: 'Yle English', url: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_NEWS' },

  // ── HU Hungary ────────────────────────────────────────────────────
  { country: 'HU', name: 'Hungary Today', url: 'https://hungarytoday.hu/feed/' },
  { country: 'HU', name: 'Budapest Business Journal', url: 'https://bbj.hu/rss' },
  { country: 'HU', name: 'Daily News Hungary', url: 'https://dailynewshungary.com/feed/' },

  // ── IL Israel ─────────────────────────────────────────────────────
  { country: 'IL', name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx' },
  { country: 'IL', name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/' },
  { country: 'IL', name: 'Haaretz', url: 'https://www.haaretz.com/cmlink/1.628752' },
  { country: 'IL', name: 'Ynet News', url: 'https://www.ynet.co.il/Integration/StoryRss2.xml' },

  // ── KR South Korea ────────────────────────────────────────────────
  { country: 'KR', name: 'Korea Herald', url: 'https://www.koreaherald.com/rss_3_0.php' },
  { country: 'KR', name: 'Yonhap News', url: 'https://en.yna.co.kr/RSS/news.xml' },
  { country: 'KR', name: 'Korea Times', url: 'https://www.koreatimes.co.kr/www/rss/rss.xml' },
  { country: 'KR', name: 'Korea JoongAng Daily', url: 'https://koreajoongangdaily.joins.com/rss/rss.xml' },

  // ── MX Mexico ─────────────────────────────────────────────────────
  { country: 'MX', name: 'Mexico News Daily', url: 'https://mexiconewsdaily.com/feed/' },
  { country: 'MX', name: 'El Universal', url: 'https://www.eluniversal.com.mx/rss.xml' },
  { country: 'MX', name: 'Milenio', url: 'https://www.milenio.com/rss' },

  // ── NG Nigeria ────────────────────────────────────────────────────
  { country: 'NG', name: 'Punch Nigeria', url: 'https://punchng.com/feed/' },
  { country: 'NG', name: 'Vanguard Nigeria', url: 'https://www.vanguardngr.com/feed/' },
  { country: 'NG', name: 'This Day Live', url: 'https://www.thisdaylive.com/feed/' },
  { country: 'NG', name: 'Daily Post Nigeria', url: 'https://dailypost.ng/feed/' },

  // ── PK Pakistan ───────────────────────────────────────────────────
  { country: 'PK', name: 'Dawn', url: 'https://www.dawn.com/feeds/home' },
  { country: 'PK', name: 'The News International', url: 'https://www.thenews.com.pk/rss/1/1' },
  { country: 'PK', name: 'Geo News', url: 'https://www.geo.tv/rss/1/1' },
  { country: 'PK', name: 'Express Tribune', url: 'https://tribune.com.pk/feed/all' },

  // ── PL Poland ─────────────────────────────────────────────────────
  { country: 'PL', name: 'Notes from Poland', url: 'https://notesfrompoland.com/feed/' },
  { country: 'PL', name: 'Poland In', url: 'https://polandin.com/feed' },
  { country: 'PL', name: 'TVN24', url: 'https://tvn24.pl/najnowsze.xml' },
  { country: 'PL', name: 'Polskie Radio', url: 'https://www.polskieradio.pl/rss/17' },

  // ── SA Saudi Arabia ───────────────────────────────────────────────
  { country: 'SA', name: 'Arab News', url: 'https://www.arabnews.com/rss.xml' },
  { country: 'SA', name: 'Saudi Gazette', url: 'https://saudigazette.com.sa/rss' },
  { country: 'SA', name: 'Saudi Gazette feed', url: 'https://saudigazette.com.sa/feed' },

  // ── SK Slovakia ───────────────────────────────────────────────────
  { country: 'SK', name: 'Slovak Spectator', url: 'https://spectator.sme.sk/rss/title.rss' },
  { country: 'SK', name: 'TASR News', url: 'https://www.tasr.sk/rss/tasr.rss' },
  { country: 'SK', name: 'Slovak Spectator feed', url: 'https://spectator.sme.sk/rss/latest.rss' },

  // ── UA Ukraine ────────────────────────────────────────────────────
  { country: 'UA', name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed/' },
  { country: 'UA', name: 'Ukrainska Pravda', url: 'https://www.pravda.com.ua/rss/' },
  { country: 'UA', name: 'Ukrinform', url: 'https://www.ukrinform.net/rss/block-lastnews' },
  { country: 'UA', name: 'Kyiv Post', url: 'https://www.kyivpost.com/feed' },

  // ── NEW COUNTRIES ─────────────────────────────────────────────────

  // AE UAE
  { country: 'AE', name: 'Gulf News', url: 'https://gulfnews.com/rss' },
  { country: 'AE', name: 'The National', url: 'https://www.thenationalnews.com/rss' },
  { country: 'AE', name: 'Khaleej Times', url: 'https://www.khaleejtimes.com/rss' },

  // BD Bangladesh
  { country: 'BD', name: 'Daily Star Bangladesh', url: 'https://www.thedailystar.net/feed/all' },
  { country: 'BD', name: 'bdnews24', url: 'https://bdnews24.com/feed/' },

  // CH Chile
  { country: 'CL', name: 'Santiago Times', url: 'https://santiagotimes.cl/feed/' },
  { country: 'CL', name: 'La Tercera', url: 'https://www.latercera.com/feed/' },

  // CO Colombia
  { country: 'CO', name: 'Colombia Reports', url: 'https://colombiareports.com/feed/' },
  { country: 'CO', name: 'El Espectador', url: 'https://www.elespectador.com/arc/outboundfeeds/rss/' },

  // GH Ghana
  { country: 'GH', name: 'Ghana Web', url: 'https://www.ghanaweb.com/GhanaHomePage/NewsArchive/rss.php' },
  { country: 'GH', name: 'Graphic Online', url: 'https://www.graphic.com.gh/feed' },
  { country: 'GH', name: 'Joy Online', url: 'https://www.myjoyonline.com/feed/' },

  // ID Indonesia
  { country: 'ID', name: 'Jakarta Post', url: 'https://www.thejakartapost.com/feed' },
  { country: 'ID', name: 'Kompas English', url: 'https://english.kompas.com/rss/7/1' },
  { country: 'ID', name: 'Tempo English', url: 'https://en.tempo.co/rss/latest' },

  // KE Kenya
  { country: 'KE', name: 'Daily Nation Kenya', url: 'https://nation.africa/kenya/rss' },
  { country: 'KE', name: 'The Standard Kenya', url: 'https://www.standardmedia.co.ke/rss/news' },
  { country: 'KE', name: 'Business Daily Africa', url: 'https://www.businessdailyafrica.com/rss' },

  // LB Lebanon
  { country: 'LB', name: "L'Orient Today", url: 'https://today.lorientlejour.com/rss' },
  { country: 'LB', name: 'The961', url: 'https://www.the961.com/feed/' },

  // MA Morocco
  { country: 'MA', name: 'Morocco World News', url: 'https://www.moroccoworldnews.com/feed/' },
  { country: 'MA', name: 'Hespress English', url: 'https://en.hespress.com/feed' },

  // MM Myanmar
  { country: 'MM', name: 'Irrawaddy', url: 'https://www.irrawaddy.com/feed' },

  // MY Malaysia
  { country: 'MY', name: 'Malay Mail', url: 'https://www.malaymail.com/feed' },
  { country: 'MY', name: 'The Star Malaysia', url: 'https://www.thestar.com.my/rss/News/Nation/' },
  { country: 'MY', name: 'Free Malaysia Today', url: 'https://www.freemalaysiatoday.com/feed/' },

  // NP Nepal
  { country: 'NP', name: 'Kathmandu Post', url: 'https://kathmandupost.com/rss' },
  { country: 'NP', name: 'My Republica', url: 'https://myrepublica.nagariknetwork.com/feed' },

  // NZ New Zealand
  { country: 'NZ', name: 'RNZ News', url: 'https://www.rnz.co.nz/rss/news.xml' },
  { country: 'NZ', name: 'NZ Herald', url: 'https://www.nzherald.co.nz/arc/outboundfeeds/rss/' },
  { country: 'NZ', name: 'Stuff NZ', url: 'https://www.stuff.co.nz/rss' },

  // PE Peru
  { country: 'PE', name: 'Andina Peru', url: 'https://andina.pe/inglés/rss.aspx' },
  { country: 'PE', name: 'Peru Reports', url: 'https://perureports.com/feed/' },

  // PH Philippines
  { country: 'PH', name: 'Inquirer', url: 'https://newsinfo.inquirer.net/feed' },
  { country: 'PH', name: 'Rappler', url: 'https://www.rappler.com/feed/' },
  { country: 'PH', name: 'Philippine Star', url: 'https://www.philstar.com/rss/headlines' },

  // SG Singapore
  { country: 'SG', name: 'Channel NewsAsia', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml' },
  { country: 'SG', name: 'Straits Times', url: 'https://www.straitstimes.com/news/singapore/rss.xml' },
  { country: 'SG', name: 'Today Singapore', url: 'https://www.todayonline.com/rss.xml' },

  // TH Thailand
  { country: 'TH', name: 'Bangkok Post', url: 'https://www.bangkokpost.com/rss/data/topstories.xml' },
  { country: 'TH', name: 'Thai PBS World', url: 'https://www.thaipbsworld.com/feed/' },
  { country: 'TH', name: 'Khaosod English', url: 'https://www.khaosodenglish.com/feed/' },

  // TZ Tanzania
  { country: 'TZ', name: 'The Citizen Tanzania', url: 'https://www.thecitizen.co.tz/feed' },
  { country: 'TZ', name: 'IPP Media', url: 'https://www.ippmedia.com/feed' },

  // VN Vietnam
  { country: 'VN', name: 'Vietnam News', url: 'https://vietnamnews.vn/rss/home.rss' },
  { country: 'VN', name: 'VnExpress', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss' },
  { country: 'VN', name: 'Tuoi Tre News', url: 'https://tuoitrenews.vn/rss/ttnews-latest.rss' },

  // IS Iceland
  { country: 'IS', name: 'Iceland Monitor', url: 'https://icelandmonitor.mbl.is/rss/' },
  { country: 'IS', name: 'Iceland Review', url: 'https://www.icelandreview.com/feed/' },
  { country: 'IS', name: 'RUV English', url: 'https://www.ruv.is/rss/english' },

  // ET Ethiopia
  { country: 'ET', name: 'Addis Standard', url: 'https://addisstandard.com/feed/' },
  { country: 'ET', name: 'The Reporter Ethiopia', url: 'https://www.thereporterethiopia.com/feed/' },

  // IR Iran
  { country: 'IR', name: 'Tehran Times', url: 'https://www.tehrantimes.com/rss' },
  { country: 'IR', name: 'Press TV', url: 'https://www.presstv.ir/homepagerss.aspx' },
  { country: 'IR', name: 'Financial Tribune', url: 'https://financialtribune.com/rss.xml' },

  // LK Sri Lanka
  { country: 'LK', name: 'Daily Mirror LK', url: 'https://www.dailymirror.lk/rss' },
  { country: 'LK', name: 'Colombo Gazette', url: 'https://colombogazette.com/feed/' },

  // KZ Kazakhstan
  { country: 'KZ', name: 'Astana Times', url: 'https://astanatimes.com/feed/' },
  { country: 'KZ', name: 'The Nur-Sultan Times', url: 'https://thenurasultantimes.com/feed' },

  // AM Armenia
  { country: 'AM', name: 'ArmeniaNow', url: 'https://armenianow.com/feed' },
  { country: 'AM', name: 'Asbarez', url: 'https://asbarez.com/feed/' },

  // GE Georgia
  { country: 'GE', name: 'Civil Georgia', url: 'https://civil.ge/feed' },
  { country: 'GE', name: 'Georgia Today', url: 'https://georgiatoday.ge/feed/' },

  // AZ Azerbaijan
  { country: 'AZ', name: 'Azernews', url: 'https://www.azernews.az/rss' },
  { country: 'AZ', name: 'Azerbaijan State News', url: 'https://azertag.az/rss' },

  // UZ Uzbekistan
  { country: 'UZ', name: 'Gazeta.uz English', url: 'https://www.gazeta.uz/en/rss/' },
  { country: 'UZ', name: 'Kun.uz English', url: 'https://kun.uz/en/rss' },

  // JO Jordan
  { country: 'JO', name: 'Jordan Times', url: 'https://www.jordantimes.com/rss.xml' },
  { country: 'JO', name: 'The Jordan Times', url: 'https://www.jordantimes.com/feed' },

  // LV Latvia
  { country: 'LV', name: 'Baltic Times LV', url: 'https://www.baltictimes.com/rss/latvia' },
  { country: 'LV', name: 'Public Broadcasting Latvia', url: 'https://eng.lsm.lv/rss.xml' },

  // LT Lithuania
  { country: 'LT', name: 'Baltic Times LT', url: 'https://www.baltictimes.com/rss/lithuania' },
  { country: 'LT', name: 'Delfi English', url: 'https://en.delfi.lt/rss.xml' },
  { country: 'LT', name: 'LRT English', url: 'https://www.lrt.lt/mediateka/rss/en' },

  // EE Estonia
  { country: 'EE', name: 'Baltic Times EE', url: 'https://www.baltictimes.com/rss/estonia' },
  { country: 'EE', name: 'ERR News', url: 'https://feeds.err.ee/en/news' },

  // BY Belarus
  { country: 'BY', name: 'Zerkalo.io', url: 'https://news.zerkalo.io/feed' },
  { country: 'BY', name: 'Belarus News', url: 'https://belnews.by/feed' },
]

async function check(c) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 10000)
    const res = await fetch(c.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml,application/atom+xml,application/xml,*/*' },
    })
    clearTimeout(t)
    const status = res.status
    if (!res.ok) return { ...c, status, ok: false }
    const text = await res.text()
    const isXml = text.slice(0, 500).toLowerCase().match(/(<\?xml|<rss|<feed)/)
    if (!isXml) return { ...c, status, ok: false, reason: 'not-xml' }
    const feed = await parser.parseString(text)
    const count = feed.items?.length ?? 0
    return { ...c, ok: count > 0, count, status }
  } catch (e) {
    if (e.name === 'AbortError') return { ...c, ok: false, reason: 'timeout' }
    return { ...c, ok: false, reason: e.message?.slice(0, 60) }
  }
}

// Run in parallel batches
const BATCH = 15
const results = []
for (let i = 0; i < candidates.length; i += BATCH) {
  const batch = candidates.slice(i, i + BATCH)
  const res = await Promise.all(batch.map(check))
  results.push(...res)
  process.stdout.write(`\r  ${Math.min(i + BATCH, candidates.length)}/${candidates.length} checked...`)
}
console.log('\n')

const ok = results.filter(r => r.ok)
const fail = results.filter(r => !r.ok)

// Print results grouped by country
const byCountry = {}
for (const r of ok) {
  if (!byCountry[r.country]) byCountry[r.country] = []
  byCountry[r.country].push(r)
}

console.log('=== WORKING SOURCES ===')
for (const [cc, sources] of Object.entries(byCountry).sort()) {
  for (const s of sources) {
    console.log(`${cc}  ${s.name.padEnd(30)} ${s.count} articles  ${s.url}`)
  }
}

console.log('\n=== FAILED ===')
for (const r of fail) {
  console.log(`${r.country}  ${r.name.padEnd(30)} ${r.status ?? ''} ${r.reason ?? ''}  ${r.url}`)
}

console.log(`\nTotal working: ${ok.length}/${results.length}`)

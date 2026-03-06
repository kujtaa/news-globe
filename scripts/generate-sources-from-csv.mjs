import fs from 'fs';
import path from 'path';
// lightweight CSV parse to avoid external deps
const csvPath = process.argv[2] || path.resolve('Downloads/europe_rss_feeds.csv');
const outPath = path.resolve('scripts/new_entries.ts');
const srcPath = path.resolve('lib/sources.ts');

const text = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(h => h.replace(/^\"|\"$/g,'').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.replace(/^\"|\"$/g,'').trim());
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = cols[j] || '';
    rows.push(obj);
  }
  return rows;
}

const records = parseCSV(text);
const src = fs.readFileSync(srcPath, 'utf8');

// Extract existing rss URLs
const existing = new Set();
const re = /rssUrl:\s*'([^']+)'/g;
let m;
while ((m = re.exec(src)) !== null) existing.add(m[1].trim());

// Extract COUNTRY_CENTROIDS
const centroids = {};
const ccMatch = src.match(/export const COUNTRY_CENTROIDS[\s\S]*?=\s*\{([\s\S]*?)\n\}/);
if (ccMatch) {
  const body = ccMatch[1];
  const lineRe = /([A-Z]{2}):\s*\{\s*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)\s*\},?/g;
  while ((m = lineRe.exec(body)) !== null) {
    centroids[m[1]] = { lat: Number(m[2]), lng: Number(m[3]) };
  }
}

// simple country name -> ISO mapping for common names in CSV
const countryMap = {
  'United Kingdom': 'GB',
  'Ireland': 'IE',
  'France': 'FR',
  'Germany': 'DE',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Luxembourg': 'LU',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Iceland': 'IS',
  'Spain': 'ES',
  'Portugal': 'PT',
  'Italy': 'IT',
  'Greece': 'GR',
  'Cyprus': 'CY',
  'Malta': 'MT',
  'Andorra': 'AD',
  'Monaco': 'MC',
  'San Marino': 'SM',
  'Vatican City / Holy See': 'VA',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Slovakia': 'SK',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Moldova': 'MD',
  'Ukraine': 'UA',
  'Belarus': 'BY',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Serbia': 'RS',
  'Croatia': 'HR',
  'Bosnia and Herzegovina': 'BA',
  'Montenegro': 'ME',
  'North Macedonia': 'MK',
  'Kosovo': 'XK',
  'Kosovo': 'XK',
  'Albania': 'AL',
  'Georgia': 'GE',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Faroe Islands': 'FO',
  'Greenland': 'GL',
  'Pan-European Sources': 'EU',
  'Baltic Regional': 'LT',
  'Nordic Regional': 'NO',
  'Caucasus Regional': 'GE',
  'Southeastern Europe Regional': 'RS',
};

const langByCountry = {
  GB: 'en', IE: 'en', FR: 'fr', DE: 'de', NL: 'nl', BE: 'nl', LU: 'fr', CH: 'de', AT: 'de', SE: 'sv', NO: 'no', DK: 'da', FI: 'fi', IS: 'is', ES: 'es', PT: 'pt', IT: 'it', GR: 'el', CY: 'el', MT: 'en', AD: 'ca', MC: 'fr', SM: 'it', VA: 'it', PL: 'pl', CZ: 'cs', SK: 'sk', HU: 'hu', RO: 'ro', BG: 'bg', MD: 'ro', UA: 'uk', BY: 'be', EE: 'et', LV: 'lv', LT: 'lt', RS: 'sr', HR: 'hr', BA: 'bs', ME: 'sr', MK: 'mk', XK: 'sq', AL: 'sq', GE: 'ka', AM: 'hy', AZ: 'az', FO: 'fo', GL: 'kl', EU: 'en'
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

let count = 0;
let out = '// GENERATED ENTRIES FROM CSV - add manually if needed\n\n';
for (const r of records) {
  const countryName = r['Country / Region'].trim();
  const sourceName = r['Source Name'].trim();
  const rss = r['RSS Feed URL'].trim();
  if (!rss) continue;
  if (existing.has(rss)) continue;
  const code = countryMap[countryName] || countryName.substring(0,2).toUpperCase();
  const centroid = centroids[code] || { lat: 0, lng: 0 };
  const lang = langByCountry[code] || 'en';
  const id = slugify(sourceName) + (code ? '-' + code.toLowerCase() : '');
  out += `  {
    id: '${id}',
    name: '${sourceName.replace("'","\\'")}',
    country: '${code}',
    lat: ${centroid.lat},
    lng: ${centroid.lng},
    url: '${(r['Website']||'').replace("'","\\'") || ''}',
    rssUrl: '${rss}',
    type: 'rss',
    category: 'general',
    articleCount: 0,
    language: '${lang}',
    description: '${sourceName} (imported)'
  },\n`;
  count++;
}

fs.writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${count} generated entries to ${outPath}`);

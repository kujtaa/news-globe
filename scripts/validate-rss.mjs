import fs from 'fs';
import { setTimeout } from 'timers/promises';

const file = 'lib/sources.ts';
const txt = fs.readFileSync(file, 'utf8');
const re = /rssUrl:\s*'([^']+)'/g;
const urls = new Set();
let m;
while ((m = re.exec(txt)) !== null) urls.add(m[1]);

console.log(`Found ${urls.size} rssUrl entries. Validating...`);

async function check(url) {
  try {
    const controller = new AbortController();
    const id = setTimeout(15000).then(() => controller.abort());
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'news-globe-rss-validator/1.0' } });
    clearTimeout(id);
    const ct = res.headers.get('content-type') || '';
    const status = res.status;
    const okStatus = status >= 200 && status < 400;
    // read a small prefix
    const body = await res.text();
    const snippet = body.slice(0, 2000).toLowerCase();
    const looksLikeFeed = ct.includes('xml') || snippet.includes('<rss') || snippet.includes('<feed') || snippet.includes('<?xml');
    return { url, status, okStatus, contentType: ct, looksLikeFeed };
  } catch (err) {
    return { url, error: String(err) };
  }
}

(async () => {
  const arr = Array.from(urls).sort();
  for (const url of arr) {
    process.stdout.write(url + ' ... ');
    const r = await check(url);
    if (r.error) {
      console.log('FAIL -', r.error);
    } else {
      if (r.okStatus && r.looksLikeFeed) console.log('OK', r.status, r.contentType);
      else if (r.okStatus) console.log('WARN (not clearly RSS)', r.status, r.contentType);
      else console.log('FAIL (status)', r.status, r.contentType);
    }
  }
})();

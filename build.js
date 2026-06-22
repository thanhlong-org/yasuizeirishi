/*
 * build.js — inject shared partials into each HTML page.
 * Run:  node build.js   (or: npm run build)
 *
 * Edit the shared header/footer/CTA ONLY in partials/*.html, then re-run.
 * Each page marks where a partial goes with:   <!-- @include NAME -->
 * After building, the injected block is wrapped between
 *   <!-- @include NAME -->  ...content...  <!-- @end NAME -->
 * so re-running replaces the block in place (safe to run any number of times).
 *
 * Path tokens inside partials:
 *   {{base}} = relative prefix to repo root  (assets, sub-pages)
 *   {{home}} = link back to the top page      (nav anchors)
 * When ported to WordPress: partials/*.html → header.php / footer.php,
 *   <!-- @include header --> → <?php get_header(); ?>, etc.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, 'partials');
const NAMES = ['header', 'service', 'case', 'cta', 'footer'];

// Each page + its path tokens.
const PAGES = [
  { file: 'index.html',          base: '',    home: '' },
  { file: 'features/index.html', base: '../', home: '../index.html' },
  { file: 'company/index.html',  base: '../', home: '../index.html' },
  { file: 'message/index.html',  base: '../', home: '../index.html' },
  { file: 'office/index.html',   base: '../', home: '../index.html' },
  { file: 'infomation/index.html', base: '../', home: '../index.html' },
  { file: 'infomation/year-end/index.html', base: '../../', home: '../../index.html' },
  { file: 'contact/index.html',  base: '../', home: '../index.html' },
  { file: 'contact/confirm/index.html', base: '../../', home: '../../index.html' },
  { file: 'contact/complete/index.html', base: '../../', home: '../../index.html' },
  { file: 'case/index.html',     base: '../', home: '../index.html' },
  { file: 'service/index.html',  base: '../', home: '../index.html' },
  { file: 'privacy/index.html',  base: '../', home: '../index.html' },
  { file: 'advisory/index.html', base: '../', home: '../index.html' },
  { file: 'case/detail/index.html', base: '../../', home: '../../index.html' },
];

const cache = {};
function partial(name) {
  if (!(name in cache)) {
    cache[name] = fs.readFileSync(path.join(PARTIALS_DIR, name + '.html'), 'utf8').replace(/\r?\n$/, '');
  }
  return cache[name];
}

function inject(html, name, tokens) {
  const body = partial(name)
    .replace(/\{\{base\}\}/g, tokens.base)
    .replace(/\{\{home\}\}/g, tokens.home);
  const re = new RegExp('<!-- @include ' + name + ' -->(?:[\\s\\S]*?<!-- @end ' + name + ' -->)?', 'g');
  let count = 0;
  const out = html.replace(re, () => {
    count++;
    return '<!-- @include ' + name + ' -->\n' + body + '\n<!-- @end ' + name + ' -->';
  });
  return { html: out, count };
}

let grandTotal = 0;
for (const page of PAGES) {
  const fp = path.join(ROOT, page.file);
  if (!fs.existsSync(fp)) { console.warn('  skip (not found): ' + page.file); continue; }
  let html = fs.readFileSync(fp, 'utf8');
  const parts = [];
  for (const name of NAMES) {
    const r = inject(html, name, page);
    html = r.html;
    grandTotal += r.count;
    parts.push(name + ' ×' + r.count + (r.count === 0 ? ' (no placeholder!)' : ''));
  }
  fs.writeFileSync(fp, html);
  console.log('  ' + page.file.padEnd(22) + '<-  ' + parts.join(',  '));
}
console.log('Done. ' + grandTotal + ' partial block(s) injected.');

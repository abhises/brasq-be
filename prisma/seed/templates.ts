/* Turns the ported design data into HTML posts that use the bq-* classes from brasq-fe/public/brasq.css. */
import { authors, cats, G, info, vortaX } from './data.js';

// ---------------------------------------------------------------- helpers
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const usd = (n: number) => '$' + n.toLocaleString('en-US');
const sc = (n: number) => n.toFixed(1);
export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nb = (s: unknown) => esc(s).replace(/ /g, '&nbsp;');

export const authorSlug = (key: string) => slug(authors[key].name);
export const authorUrl = (key: string) => '/author/' + authorSlug(key);
export const amazon = (q: string) => 'https://www.amazon.com/s?k=' + encodeURIComponent(q);

export type Pick = { id: string; name: string; score: number; price: number; verdict: string; pros: string[]; cons: string[]; label: string; guide: any };
const LABELS = ['Our pick', 'Budget pick', 'Upgrade'];
export const products: Record<string, Pick> = {};
export const catById: Record<string, any> = Object.fromEntries(cats.map((c: any) => [c.id, c]));
for (const g of G as any[]) {
  g.pickObjs = g.picks.map((p: any[], i: number) => {
    const o: Pick = { id: slug(p[0]), name: p[0], score: p[1], price: p[2], verdict: p[3], pros: p[4], cons: p[5], label: LABELS[i], guide: g };
    if (!products[o.id]) products[o.id] = o;
    return o;
  });
}

// ---------------------------------------------------------------- photos (same Unsplash picks as the prototype)
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=70&auto=format&fit=crop`;
const L: Record<string, string> = {
  V1: U('1765970101654-337b573142fb'), V2: U('1758273705627-937374bfa978'), V3: U('1758523670739-0d26a3ee976d'), V4: U('1527515637462-cff94eecc1ac'),
  V5: U('1527515673510-8aa78ce21f9b'), V6: U('1722710070534-e31f0290d8de'), V7: U('1686178827149-6d55c72d81df'),
  R1: U('1653990480360-31a12ce9723e'), R2: U('1647940990395-967898eb0d65'), R3: U('1762859731349-c9ff2808b672'), R4: U('1558317374-067fb5f30001'),
  D1: U('1600322305530-45714a0bc945'),
  C1: U('1583165278997-0250ea5d72e2'), C3: U('1558416165-5fb04b79b0e7'), C4: U('1608354580875-30bd4168b351'), C5: U('1524686788093-aa1f9c0f7c4f'),
  C6: U('1539021897569-06e9fa3c6bb9'), C9: U('1553787499-4036afbbcd8d'),
  B1: U('1635594202056-9ea3b497e5c0'), B2: U('1647376036543-f9f543601a1d'), B4: U('1688384452844-8364c3e2fc28'), B6: U('1759176171441-7afca44a5558'),
  B7: U('1688384452551-5cacc39946e0'), B8: U('1583535045024-e2479a694777'),
  sarah: U('1494790108377-be9c29b29330'), lauren: U('1627161683077-e34782c24d81'), thomas: U('1507003211169-0a1dd7228f2d'),
  jake: U('1500648767791-00dcc994a43e'), ryan: U('1560250097-0b93528c311a'),
};
const GP: Record<string, (string | null)[]> = { 'stick-vacuums': ['V1', 'V2', 'V4'], 'robot-vacuums': ['R1', 'R3', 'R2'], 'coffee-makers': ['C1', 'C9', 'C6'], mattresses: ['B1', 'B4', 'B2'], 'pet-feeders': ['D1', 'D1', null] };
const PP: Record<string, string[]> = { 'vorta-s9': ['V6', 'V3', 'V4', 'V2'], 'kleen-air-300': ['V5'], 'northwind-x2': ['V7'], 'robomop-p7': ['R1'], 'clean-bot-mini': ['R4'], 'robomop-p9-ultra': ['R2'], 'bonaro-one': ['C4'], 'caffino-basic': ['C5'], 'bonaro-barista': ['C3'], 'dreamr-hybrid': ['B6'], 'slumbr-foam': ['B7'], 'dreamr-hybrid-plus': ['B8'] };
const POOL: Record<string, string[]> = { kitchen: ['C1', 'C9', 'C6', 'C4', 'C5', 'C3'], cleaning: ['V2', 'V4', 'R1', 'R3', 'V5', 'R2'], sleep: ['B1', 'B4', 'B2', 'B6', 'B7', 'B8'], pets: ['D1', 'R3', 'V2'], _: ['V3', 'B2', 'C6', 'V4', 'B4', 'C9', 'D1', 'B1'] };
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const poolPick = (cat: string, key: string, off: number) => { const p = POOL[cat] || POOL._; return L[p[(hash(key) + off) % p.length]]; };

/** kind: 0 = card, 1 = hero, 2 = test setup */
export function guidePhoto(g: any, kind: 0 | 1 | 2) {
  const k = GP[g.id]?.[kind];
  return k ? L[k] : poolPick(g.cat, g.id, kind);
}
/** n: 0 = main photo, 1..3 = gallery */
export function productPhoto(p: Pick, n = 0) {
  const a = PP[p.id];
  if (a) return L[a[n] || a[0]];
  const k = p.guide.pickObjs.findIndex((o: Pick) => o.id === p.id);
  return poolPick(p.guide.cat, p.id, n + k + 3);
}
export const authorPhoto = (key: string) => L[key];
export const testHousePhoto = L.V3;

const img = (src: string, alt: string, cls = '') => `<div class="bq-photo ${cls}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></div>`;
const avatar = (key: string) => `<div class="bq-avatar"><img src="${esc(authorPhoto(key))}" alt="${esc(authors[key].name)}" loading="lazy"></div>`;

/** Auto-link product names in body text to Amazon (as the prototype did). */
const LINKED: [string, string][] = [['Vorta S9', 'Vorta S9 stick vacuum'], ['Kleen Air 300', 'Kleen Air 300 stick vacuum'], ['Northwind X2', 'Northwind X2 stick vacuum']];
function rich(str: string) {
  const s = String(str || '');
  const hits: { s: number; e: number; href: string }[] = [];
  for (const [p, q] of LINKED) { const i = s.indexOf(p); if (i >= 0 && !hits.some((x) => i < x.e && i + p.length > x.s)) hits.push({ s: i, e: i + p.length, href: amazon(q) }); }
  hits.sort((a, b) => a.s - b.s);
  let out = '', c = 0;
  for (const x of hits.slice(0, 2)) {
    out += esc(s.slice(c, x.s)) + `<a class="bq-aff" href="${esc(x.href)}" target="_blank" rel="sponsored nofollow noopener">${esc(s.slice(x.s, x.e))}</a>`;
    c = x.e;
  }
  return out + esc(s.slice(c));
}

const shopBtn = (p: Pick) => `<a class="bq-shop" href="${esc(amazon(p.name))}" rel="sponsored nofollow" target="_blank">Check price on Amazon</a>`;
const buyBtn = (p: Pick, text = 'Check price at Amazon') => `<a class="bq-btn bq-btn--buy" href="${esc(amazon(p.name))}" rel="sponsored nofollow" target="_blank">${esc(text)}</a>`;

function pickCard(p: Pick) {
  return `<div class="bq-pick">
  <a class="bq-photo bq-pick__media" href="/review/${p.id}"><img src="${esc(productPhoto(p))}" alt="${esc(p.name)}" loading="lazy"></a>
  <div class="bq-pick__body">
    <div class="bq-pick__top"><span class="bq-tag bq-tag--dark bq-tag--sm">${esc(p.label)}</span><span class="bq-score">Test score <strong>${sc(p.score)}</strong></span></div>
    <h3 class="bq-pick__name"><a href="/review/${p.id}">${esc(p.name)}</a></h3>
    <p class="bq-pick__text">${esc(p.verdict)}</p>
    <div class="bq-shops">${shopBtn(p)}</div>
    <a class="bq-link-strong" href="/review/${p.id}">Read the full review</a>
  </div>
</div>`;
}

const faqHtml = (faq: [string, string][]) => `<section id="g-faq" class="bq-faq">
  <h2 class="bq-h2">Frequently asked questions</h2>
${faq.map(([q, a]) => `  <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
</section>`;

const sourcesHtml = (id: string, sources: string[], changes: [string, string][]) => `<section id="${id}" class="bq-sources">
  <div><strong class="bq-eyebrow bq-eyebrow--ink">Sources</strong><ul>${sources.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
  <div><strong class="bq-eyebrow bq-eyebrow--ink">Changelog</strong><ul class="bq-changelog">${changes.map(([d, t]) => `<li><time>${esc(d)}</time><span>${esc(t)}</span></li>`).join('')}</ul></div>
</section>`;

const toc = (title: string, items: [string, string][]) => {
  const links = items.map(([l, id]) => `<a href="#${id}">${esc(l)}</a>`).join('\n    ');
  return {
    aside: `<aside class="bq-toc">\n    <div class="bq-toc__title">${esc(title)}</div>\n    ${links}\n  </aside>`,
    mobile: `<details class="bq-toc-mobile"><summary>${esc(title)}</summary><nav>${links}</nav></details>`,
  };
};

// ---------------------------------------------------------------- guide
export function guideHtml(g: any) {
  const F = g.full;
  const a = authors[g.author];
  const cat = catById[g.cat];
  const picks: Pick[] = g.pickObjs;
  const trust = `${a.trust} For this guide we tested ${g.count} models over ${g.weeks} weeks in our test house. ${g.bought || 'We bought most models ourselves; loaned units were returned after testing.'} Manufacturers don’t see our conclusions before publication.`;
  const head = g.head || ['Model', 'Rank', 'Test score', 'Price from'];
  const rows: string[][] = g.rows || picks.map((p) => [p.name, p.label, sc(p.score), usd(p.price)]);
  const tableNote = g.tableNote || 'Test score based on our fixed weighting scheme. Price from: lowest price on September 30, 2026.';
  const sources = g.sources || [`Test protocol for ${g.short.toLowerCase()}, BrasQ (2026)`, 'Manufacturer specifications and manuals'];
  const changes = g.changes || [[g.updated, 'Prices and availability checked.'], [g.published, `First version published after testing ${g.count} models.`]];

  const items: [string, string][] = [
    ...(F ? [['The short answer', 'g-summary']] as [string, string][] : []),
    ['Our picks at a glance', 'g-picks'],
    ...(F ? [['Compare side by side', 'g-compare']] as [string, string][] : []),
    ['Why you can trust us', 'g-trust'], ['Who is this for?', 'g-who'], ['How we tested', 'g-how'], ['Test results compared', 'g-table'],
    ...(F ? [['Our picks in depth', 'g-deep'], ['Results by test', 'g-results'], ['What to look for', 'g-buy'], ['How much to spend', 'g-tiers'], ['Stick, canister or robot?', 'g-vs'], ['Maintenance', 'g-care'], ['Not recommended', 'g-skip'], ['What we’re testing now', 'g-next'], ['Durability and repair', 'g-durable'], ['Glossary', 'g-gloss']] as [string, string][] : []),
    ['FAQ', 'g-faq'], ['Sources and changelog', 'g-sources'],
  ];
  const t = toc('In this guide', items);

  const s: string[] = [];
  if (F) {
    s.push(`<section id="g-summary" class="bq-summary">
  <h2 class="bq-h2 bq-h2--sm">The short answer</h2>
  <ol>${F.summary.map((x: string) => `<li><span>${esc(x)}</span></li>`).join('')}</ol>
</section>`);
  }
  s.push(`<section id="g-picks" class="bq-section">
  <h2 class="bq-h2">Our picks at a glance</h2>
${picks.map(pickCard).join('\n')}
  <p class="bq-note">Prices checked September 30, 2026 at 9:00 a.m. ET. Prices may change.</p>
</section>`);

  if (F) s.push(compareHtml(g));

  s.push(`<section id="g-trust" class="bq-trust">
  <h2>Why you can trust us</h2>
  <p>${esc(trust)}</p>
  <nav><a href="/editorial-guidelines">Editorial guidelines</a><a href="/how-we-make-money">How we make money</a><a href="/corrections-policy">Report a correction</a></nav>
</section>`);
  s.push(`<section id="g-who" class="bq-section"><h2 class="bq-h2">Who is this for?</h2><p class="bq-p">${esc(g.forWho)}</p></section>`);
  s.push(`<section id="g-how" class="bq-section">
  <h2 class="bq-h2">How we tested</h2>
  <p class="bq-p">${esc(g.howTested)}</p>
  ${img(guidePhoto(g, 2), 'Test setup: ' + g.ph, 'bq-photo--169')}
  <p class="bq-caption">${esc(g.howCaption || 'Test setup in our test house in Columbus. Photo: BrasQ')}</p>
  <a class="bq-link-strong" href="/how-we-test">Our full test method</a>
</section>`);
  s.push(`<section id="g-table" class="bq-section">
  <h2 class="bq-h2">Test results compared</h2>
  <div class="bq-table-wrap"><table class="bq-table bq-table--mono">
    <thead><tr>${head.map((h: string) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
  <p class="bq-note">${esc(tableNote)}</p>
</section>`);

  if (F) {
    s.push(`<section id="g-deep" class="bq-section" style="gap:28px">
  <h2 class="bq-h2">Our picks in depth</h2>
${F.deep.map((d: any) => deepHtml(d, F)).join('\n')}
</section>`);
    const top = picks[0].name;
    s.push(`<section id="g-results" class="bq-section" style="gap:28px">
  <div class="bq-stack-sm"><h2 class="bq-h2">Results by test</h2><p class="bq-p">The comparison table above shows averages. Below you can see how the five top-scoring models did in each test. Our top pick is highlighted in orange.</p></div>
${F.bars.map((b: any) => `  <div class="bq-bars">
    <h3 class="bq-h3">${esc(b.h)}</h3>
    <p class="bq-small">${esc(b.note)}</p>
${b.rows.map((x: any[]) => `    <div class="bq-bar${x[0] === top ? ' bq-bar--hl' : ''}"><span>${esc(x[0])}</span><span class="bq-bar__track"><span style="width:${x[2]}%"></span></span><span>${esc(x[1])}</span></div>`).join('\n')}
  </div>`).join('\n')}
</section>`);
    s.push(`<section id="g-buy" class="bq-section" style="gap:28px">
  <div class="bq-stack-sm"><h2 class="bq-h2">What to look for when buying a stick vacuum</h2><p class="bq-p">${esc(F.buyIntro)}</p></div>
${F.buying.map((b: any) => `  <div class="bq-stack-sm" style="gap:12px">
    <h3 class="bq-h3">${esc(b.h)}</h3>
${b.p.map((t: string) => `    <p class="bq-p">${rich(t)}</p>`).join('\n')}
${b.tip ? `    <p class="bq-tip"><strong>Our tip:</strong> ${esc(b.tip)}</p>` : ''}
  </div>`).join('\n')}
</section>`);
    s.push(`<section id="g-tiers" class="bq-section">
  <h2 class="bq-h2">How much should you spend?</h2>
  <div class="bq-grid bq-grid--3">
${F.tiers.map((x: string[]) => `    <div class="bq-card"><strong class="bq-card__title">${esc(x[0])}</strong><p style="flex:1">${esc(x[1])}</p><span class="bq-eyebrow" style="text-transform:none;letter-spacing:0;font-size:13px">${esc(x[2])}</span></div>`).join('\n')}
  </div>
</section>`);
    s.push(`<section class="bq-alert">
  <div>
    <span class="bq-eyebrow">Price alert</span>
    <h2>Get a heads-up when our picks drop in price</h2>
    <p>Plus our latest test results every Friday. One email a week, unsubscribe in one click.</p>
  </div>
  <form class="bq-form" data-bq-subscribe data-source="price-alert:${g.id}">
    <input type="email" name="email" aria-label="Email address" placeholder="you@email.com" required>
    <button type="submit">Turn on price alert</button>
  </form>
</section>`);
    s.push(`<section id="g-vs" class="bq-section">
  <h2 class="bq-h2">Stick vacuum, canister vacuum or robot?</h2>
  <div class="bq-table-wrap"><table class="bq-table">
    <thead><tr>${F.vsHead.map((x: string) => `<th>${esc(x)}</th>`).join('')}</tr></thead>
    <tbody>${F.vsRows.map((r: string[]) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
  <p class="bq-p">${esc(F.vsNote)}</p>
</section>`);
    s.push(`<section id="g-care" class="bq-section">
  <h2 class="bq-h2">How to make your stick vacuum last longer</h2>
  <ol class="bq-numbered">${F.care.map((c: string[]) => `<li><div><strong>${esc(c[0])}</strong><p>${esc(c[1])}</p></div></li>`).join('')}</ol>
</section>`);
    s.push(`<section id="g-skip" class="bq-section">
  <h2 class="bq-h2">Tested but not recommended</h2>
  <div class="bq-rows bq-skip">${F.skip.map((x: string[]) => `<div><div class="bq-skip__head"><strong>${esc(x[0])}</strong><span>Test score ${esc(x[1])}</span></div><p>${esc(x[2])}</p></div>`).join('')}</div>
  <p class="bq-small">${esc(F.skipNote)}</p>
</section>`);
    s.push(`<section id="g-next" class="bq-section">
  <h2 class="bq-h2">What we're testing now</h2>
  <p class="bq-p">These models are in our test house or launching soon. As soon as we're done, we'll update this guide.</p>
  <div class="bq-grid bq-grid--3">${F.next.map((n: string[]) => `<div class="bq-card bq-card--dashed"><span class="bq-status">${esc(n[1])}</span><strong style="font-size:18px;font-weight:900">${esc(n[0])}</strong><p>${esc(n[2])}</p></div>`).join('')}</div>
</section>`);
    s.push(`<section id="g-durable" class="bq-section" style="gap:14px">
  <h2 class="bq-h2">Durability, warranty and repair</h2>
${F.durable.map((x: string) => `  <p class="bq-p">${rich(x)}</p>`).join('\n')}
</section>`);
    s.push(`<section id="g-situations" class="bq-section">
  <h2 class="bq-h2">Which stick vacuum fits your situation?</h2>
  <div class="bq-grid bq-grid--2">${F.situations.map((x: string[]) => `<div class="bq-ruled"><strong>${esc(x[0])}</strong><p>${rich(x[1])}</p></div>`).join('')}</div>
</section>`);
    s.push(`<section id="g-specs" class="bq-section" style="gap:14px">
  <h2 class="bq-h2">What the numbers on the box mean</h2>
  <p class="bq-p">${esc(F.specsIntro)}</p>
  <div class="bq-rows bq-defs">${F.specsExplained.map((x: string[]) => `<div><strong class="bq-mono">${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('')}</div>
</section>`);
    s.push(`<section id="g-mistakes" class="bq-section">
  <h2 class="bq-h2">Six mistakes that cost you battery life and suction</h2>
  <ol class="bq-numbered bq-numbered--boxed">${F.mistakes.map((x: string[]) => `<li><div><strong>${esc(x[0])}</strong><p>${rich(x[1])}</p></div></li>`).join('')}</ol>
</section>`);
    s.push(`<section id="g-verdict" class="bq-verdict">
  <h2 class="bq-h2">Our final verdict</h2>
${F.verdict.map((x: string) => `  <p class="bq-p">${rich(x)}</p>`).join('\n')}
</section>`);
    s.push(`<section id="g-picks-end" class="bq-section">
  <h2 class="bq-h2">Our picks at a glance</h2>
${picks.map(pickCard).join('\n')}
  <p class="bq-note">Prices checked September 30, 2026 at 9:00 a.m. ET. Prices may change.</p>
</section>`);
    s.push(`<section id="g-gloss" class="bq-section" style="gap:12px">
  <h2 class="bq-h2">Glossary</h2>
  <div class="bq-rows bq-defs">${F.gloss.map((x: string[]) => `<div><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('')}</div>
</section>`);
  }
  if (g.faq.length) s.push(faqHtml(g.faq));
  if (F) {
    const related = (G as any[]).filter((x) => x.id !== g.id).sort((x, y) => Number(y.cat === g.cat) - Number(x.cat === g.cat)).slice(0, 3);
    s.push(`<section class="bq-section">
  <h2 class="bq-h2 bq-h2--sm">Read next</h2>
  <div class="bq-related">${related.map((x) => `<a href="/guide/${x.id}">${img(guidePhoto(x, 0), x.title, 'bq-photo--32')}<span class="bq-eyebrow">${esc(catById[x.cat].name)}</span><strong>${esc(x.title)}</strong></a>`).join('')}</div>
</section>`);
  }
  s.push(sourcesHtml('g-sources', sources, changes));
  s.push(`<section class="bq-authorbox">
  ${avatar(g.author)}
  <div>
    <div class="bq-eyebrow" style="color:var(--muted);letter-spacing:0.1em">About the author</div>
    <strong>${esc(a.name)}</strong>
    <p>${esc(a.bio)}</p>
    <a class="bq-link-strong" href="${authorUrl(g.author)}">Profile and all articles</a>
  </div>
</section>`);

  return `<article class="bq-article">
<nav class="bq-crumbs"><a href="/">Home</a><a href="/category/${cat.id}">${esc(cat.name)}</a><span>${esc(g.short)}</span></nav>
<div class="bq-guide-top">
  <header class="bq-guide-head">
    <span class="bq-tag">Buying guide</span>
    <h1 class="bq-h1">${esc(g.title)}</h1>
    <p class="bq-lead">${esc(g.intro)}</p>
    <div class="bq-meta">
      <div class="bq-meta__author">${avatar(g.author)}<div>Tested and written by<br><a href="${authorUrl(g.author)}">${esc(a.name)}</a></div></div>
      <div>Reviewed by<br><a href="${authorUrl('ryan')}">Ryan Mitchell</a>, editor-in-chief</div>
      <div>Updated<br><strong>${nb(g.updated)}</strong></div>
      <div>Test period<br><strong>${g.weeks}&nbsp;weeks · ${g.count}&nbsp;models</strong></div>
    </div>
    <p class="bq-disclosure">We choose products independently. We may earn a commission through links on this page; your price stays the same. <a href="/how-we-make-money">Affiliate policy</a></p>
  </header>
  ${img(guidePhoto(g, 1), 'All tested ' + g.ph, 'bq-guide-hero')}
</div>
<div class="bq-layout">
  ${t.aside}
  <div class="bq-content">
${t.mobile}
${s.join('\n\n')}
  </div>
</div>
</article>`;
}

function compareHtml(g: any) {
  const F = g.full;
  const cols = F.compare.cols.map((c: any) => {
    const p = products[c.pid];
    const n = Math.round(c.stars);
    const d = F.deep.find((x: any) => x.pid === c.pid);
    return { ...c, p, rating: String(c.stars), stars: '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n), bestFor: d ? 'Choose this if ' + d.bestFor : '' };
  });
  const hl = (c: any) => (c.hl ? ' class="bq-hl"' : '');
  const num = (v: string) => { const m = String(v).match(/[0-9]+(\.[0-9]+)?/g); return m ? parseFloat(m[m.length - 1]) : NaN; };
  const head = cols.map((c: any) => `<th${hl(c)}>
        <div class="bq-cmp__label">${c.hl ? 'Our pick' : esc(c.p.label)}</div>
        <div class="bq-cmp__head">
          <a class="bq-photo bq-photo--43" href="/review/${c.p.id}"><img src="${esc(productPhoto(c.p))}" alt="${esc(c.p.name)}" loading="lazy"></a>
          <a class="bq-cmp__name" href="/review/${c.p.id}">${esc(c.p.name)}</a>
          <div class="bq-cmp__stars"><span>${c.stars}</span><strong>${c.rating}</strong><span>(${esc(c.reviews)})</span></div>
          <span class="bq-score">Test score <strong>${sc(c.p.score)}</strong></span>
          <div class="bq-cmp__price"><strong>${usd(c.p.price)}</strong>${c.was ? `<s>${usd(c.was)}</s><span class="bq-off">-${Math.round((1 - c.p.price / c.was) * 100)}%</span>` : ''}</div>
          <a class="bq-btn bq-btn--buy bq-btn--sm" style="text-align:center" href="${esc(amazon(c.p.name))}" rel="sponsored nofollow" target="_blank">View at Amazon</a>
        </div>
      </th>`).join('');
  const groups = F.compare.groups.map((gr: any) => {
    const rows = gr.rows.map((row: any[]) => {
      const vals = row[1].map((v: string) => (v[0] === 'b' ? v.slice(1).split(':')[0] : v));
      let win = -1;
      if (row[2] !== undefined) {
        const ns = vals.map(num);
        const best = row[2] === 0 || row[2] === 1 || row[0].indexOf('Hair') === 0 ? Math.min(...ns) : Math.max(...ns);
        if (!isNaN(best)) win = ns.indexOf(best);
      }
      const cells = row[1].map((v: string, i: number) => {
        let inner: string;
        if (v === 'y') inner = '<span class="bq-yes" aria-label="Yes">✓</span>';
        else if (v === 'n') inner = '<span class="bq-no" aria-label="No">✕</span>';
        else if (v[0] === 'b') { const [val, pct] = v.slice(1).split(':'); inner = `<div class="bq-minibar"><span><span style="width:${pct}%"></span></span><span>${esc(val)}</span></div>`; }
        else inner = `<span class="bq-cell-v">${esc(v)}</span>`;
        return `<td${hl(cols[i])}>${inner}${i === win ? '<span class="bq-best">Best</span>' : ''}</td>`;
      }).join('');
      return `<tr><td>${esc(row[0])}</td>${cells}</tr>`;
    }).join('\n      ');
    return `<tr class="bq-cmp__group"><th colspan="${cols.length + 1}">${esc(gr.h)}</th></tr>\n      ${rows}`;
  }).join('\n      ');
  const final = cols.map((c: any) => `<td${hl(c)}><div class="bq-stack-sm" style="gap:12px"><span style="font-size:14px;line-height:1.5">${esc(c.bestFor)}</span><a class="bq-btn bq-btn--buy bq-btn--sm" style="text-align:center" href="${esc(amazon(c.p.name))}" rel="sponsored nofollow" target="_blank">${usd(c.p.price)} at Amazon</a><a href="/review/${c.p.id}" style="font-size:13px;font-weight:700">Read the review</a></div></td>`).join('');
  return `<section id="g-compare" class="bq-section">
  <div class="bq-stack-sm"><h2 class="bq-h2">Compare our picks side by side</h2><p class="bq-p">All measurements from our test house in one place. Customer ratings are the average across major US retailers as of September 30, 2026.</p></div>
  <div class="bq-table-wrap"><table class="bq-cmp">
    <thead><tr><th>${g.count}&nbsp;models tested</th>${head}</tr></thead>
    <tbody>
      ${groups}
      <tr class="bq-cmp__final"><td>Best for</td>${final}</tr>
    </tbody>
  </table></div>
  <p class="bq-note">"Best" marks the top measurement in each row. Prices checked September 30, 2026 at 9:00 a.m. ET.</p>
</section>`;
}

function deepHtml(d: any, F: any) {
  const p = products[d.pid];
  const scores = (F.scores?.[d.pid] || []) as [string, number][];
  return `  <div class="bq-deep">
    <div class="bq-row"><span class="bq-tag bq-tag--dark bq-tag--sm">${esc(p.label)}</span><span class="bq-score">Test score <strong>${sc(p.score)}</strong></span><span class="bq-price-from">from <strong>${usd(p.price)}</strong></span></div>
    <h3 class="bq-deep__name">${esc(p.name)}</h3>
    <div class="bq-deep__cols">
      <div class="bq-deep__text">
${d.body.map((t: string) => `        <p class="bq-p">${rich(t)}</p>`).join('\n')}
      </div>
      <div class="bq-deep__side">
        ${img(productPhoto(p, 1), p.name + ' in use', 'bq-photo--1')}
        <div class="bq-box"><div class="bq-box__head">Measured</div>${d.specs.map((s: string[]) => `<div class="bq-kv"><span>${esc(s[0])}</span><strong>${esc(s[1])}</strong></div>`).join('')}</div>
        <div class="bq-box bq-scorebox"><strong>Score breakdown</strong>${scores.map(([k, v]) => `<div class="bq-meter"><div><span>${esc(k)}</span><strong>${sc(v)}</strong></div><div class="bq-meter__track"><span style="width:${v * 10}%"></span></div></div>`).join('')}</div>
      </div>
    </div>
    <div class="bq-proscons">
      <div class="bq-pros"><strong>Pros</strong><ul>${p.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="bq-cons"><strong>Cons</strong><ul>${p.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <p class="bq-choose"><strong>Choose this if</strong> ${esc(d.bestFor)}</p>
    <div class="bq-row" style="gap:12px 20px">${buyBtn(p)}<a class="bq-link-strong" href="/review/${p.id}">Read the full review</a></div>
  </div>`;
}

export function guideJsonLd(g: any, siteUrl: string) {
  const a = authors[g.author];
  const cat = catById[g.cat];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [['Home', siteUrl + '/'], [cat.name, `${siteUrl}/category/${cat.id}`], [g.short, `${siteUrl}/guide/${g.id}`]].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) },
      { '@type': 'Article', headline: g.title, description: g.intro, datePublished: new Date(g.published).toISOString().slice(0, 10), dateModified: new Date(g.updated).toISOString().slice(0, 10), author: { '@type': 'Person', name: a.name, url: siteUrl + authorUrl(g.author) }, reviewedBy: { '@type': 'Person', name: 'Ryan Mitchell' }, publisher: { '@type': 'Organization', name: 'BrasQ' } },
      { '@type': 'ItemList', name: g.title, itemListElement: g.pickObjs.map((p: Pick, i: number) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: p.name, offers: { '@type': 'Offer', price: p.price, priceCurrency: 'USD', availability: 'https://schema.org/InStock' }, review: { '@type': 'Review', author: { '@type': 'Person', name: a.name }, reviewRating: { '@type': 'Rating', ratingValue: p.score, bestRating: 10 } } } })) },
      ...(g.faq.length ? [{ '@type': 'FAQPage', mainEntity: g.faq.map((f: string[]) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }] : []),
    ],
  }, null, 2);
}

// ---------------------------------------------------------------- review
export function reviewHtml(p: Pick) {
  const g = p.guide;
  const a = authors[g.author];
  const cat = catById[g.cat];
  const x: any = p.id === 'vorta-s9' ? vortaX : {};
  const offs = [0.3, -0.1, 0.1, -0.5];
  const hist = [1.12, 1.1, 1.06, 1.08, 1.03, 1];
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const caps = [p.name + ' front view', p.name + ' in use in the test house', p.name + ' control details', p.name + ' next to the competition'];
  const shots = caps.map((_, i) => productPhoto(p, i));
  const others = (g.pickObjs as Pick[]).filter((o) => o.id !== p.id);
  const related = (G as any[]).filter((r) => r.id !== g.id && r.cat === g.cat).concat((G as any[]).filter((r) => r.cat !== g.cat)).slice(0, 2);
  const specs = x.specs || [{ k: 'Price from', v: usd(p.price) }, { k: 'Test score', v: sc(p.score) + ' out of 10' }, { k: 'Rank in our test', v: p.label }, { k: 'Tested in', v: g.title }, { k: 'Models compared', v: String(g.count) }, { k: 'Test period', v: g.weeks + ' weeks' }];
  const compareRows = [{ name: 'Test score', cells: g.pickObjs.map((o: Pick) => sc(o.score)) }, { name: 'Price from', cells: g.pickObjs.map((o: Pick) => usd(o.price)) }, { name: 'Rank', cells: g.pickObjs.map((o: Pick) => o.label) }].concat(x.compareRows || []);
  const faq: [string, string][] = x.faq || g.faq;
  const sources = x.sources || ['BrasQ in-house measurements (2026)', 'Manufacturer specifications and manual'];
  const changes = x.changes || [[g.updated, 'Prices checked and review updated.'], [g.published, 'Review published.']];

  const items: [string, string][] = [['Our verdict', 'p-verdict'], ['Pros and cons', 'p-proscons']];
  if (x.forWho) items.push(['Who it’s for', 'p-for']);
  if (x.results) items.push(['Test results', 'p-results']);
  if (x.designText) items.push(['Design and use', 'p-design']);
  if (x.longterm) items.push(['Long-term test', 'p-long']);
  items.push(['Specifications', 'p-specs'], ['Comparison', 'p-compare'], ['Alternatives', 'p-alts']);
  if (x.qa) items.push(['Reader questions', 'p-qa']);
  items.push(['FAQ', 'p-faq']);
  const t = toc('In this review', items);

  const s: string[] = [];
  s.push(`<section id="p-verdict" class="bq-quote"><strong>Our verdict</strong><p>${esc(x.verdictLong || p.verdict)}</p></section>`);
  s.push(`<section id="p-proscons" class="bq-pc2">
  <div><strong>Pros</strong><ul>${p.pros.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>
  <div><strong>Cons</strong><ul>${p.cons.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>
</section>`);
  if (x.forWho) s.push(`<section id="p-for" class="bq-fit">
  <div><strong>Good for</strong><ul>${x.forWho.map((v: string) => `<li>${esc(v)}</li>`).join('')}</ul></div>
  <div><strong>Less suited for</strong><ul>${x.notFor.map((v: string) => `<li>${esc(v)}</li>`).join('')}</ul></div>
</section>`);
  if (x.results) s.push(`<section id="p-results" class="bq-section">
  <h2 class="bq-h2">Test results</h2>
  <p class="bq-small" style="font-size:15px">Compared with the average of all ${g.count} models tested.</p>
${x.results.map((r: any) => `  <div class="bq-result"><div class="bq-result__head"><strong>${esc(r.label)}</strong><span><strong>${esc(r.v)}</strong> <small>· avg. ${esc(r.avg)}</small></span></div><span class="bq-result__you"><span style="width:${r.pct}"></span></span><span class="bq-result__avg"><span style="width:${r.avgPct}"></span></span></div>`).join('\n')}
  <div class="bq-legend"><span><i></i>${esc(p.name)}</span><span><i></i>Average</span></div>
</section>`);
  if (x.designText) s.push(`<section id="p-design" class="bq-section">
  <h2 class="bq-h2">Design and use</h2>
  <p class="bq-p">${esc(x.designText)}</p>
  <div class="bq-video">video: ${esc(p.name)} in use (1:42)</div>
  <p class="bq-caption">Video: ${esc(a.name)} shows how the ${esc(p.name)} performs in our test house.</p>
</section>`);
  if (x.longterm) s.push(`<section id="p-long" class="bq-section">
  <h2 class="bq-h2">Long-term test</h2>
  <div class="bq-timeline">${x.longterm.map((l: any) => `<div><time>${esc(l.d)}</time><span>${esc(l.t)}</span></div>`).join('')}</div>
</section>`);
  s.push(`<section id="p-specs" class="bq-section">
  <h2 class="bq-h2">Specifications</h2>
  <div class="bq-specs">${specs.map((v: any) => `<div><span>${esc(v.k)}</span><strong>${esc(v.v)}</strong></div>`).join('')}</div>
</section>`);
  s.push(`<section id="p-compare" class="bq-section">
  <h2 class="bq-h2">How it compares</h2>
  <div class="bq-table-wrap"><table class="bq-table bq-table--mono" style="min-width:480px">
    <thead><tr><th></th>${g.pickObjs.map((o: Pick) => `<th>${esc(o.name)}</th>`).join('')}</tr></thead>
    <tbody>${compareRows.map((r: any) => `<tr><td style="font-weight:400;color:var(--muted)">${esc(r.name)}</td>${r.cells.map((c: string) => `<td style="font-weight:600">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
</section>`);
  s.push(`<section id="p-alts" class="bq-section">
  <h2 class="bq-h2">Alternatives</h2>
  <div class="bq-grid">${others.map((o) => `<a class="bq-card bq-card--link" href="/review/${o.id}"><span class="bq-eyebrow">${esc(o.label)} · ${sc(o.score)}</span><strong style="font-size:20px;font-weight:900">${esc(o.name)}</strong><span style="font-size:14px;line-height:1.5;color:var(--text-2)">${esc(o.verdict)}</span><span class="bq-link-strong">From ${usd(o.price)} · Read review</span></a>`).join('')}</div>
</section>`);
  if (x.qa) s.push(`<section id="p-qa" class="bq-section">
  <h2 class="bq-h2">Reader questions</h2>
${x.qa.map((q: any) => `  <div class="bq-qa"><span>${esc(q.who)}</span><strong>${esc(q.q)}</strong><div><span>${esc(q.a)}</span><small>Answered by ${esc(a.name)}</small></div></div>`).join('\n')}
  <a class="bq-link-strong" href="/contact">Ask a question</a>
</section>`);
  s.push(faqHtml(faq).replace('id="g-faq"', 'id="p-faq"'));
  s.push(`<section class="bq-helpful" data-bq-helpful>
  <strong>Was this review helpful?</strong>
  <div><button type="button" data-vote="yes">Yes</button><button type="button" data-vote="no">No</button></div>
</section>`);
  s.push(sourcesHtml('p-sources', sources, changes));
  s.push(`<section class="bq-grid bq-grid--2" style="gap:16px">
  <a class="bq-person" href="${authorUrl(g.author)}">${avatar(g.author)}<div><span class="bq-eyebrow" style="color:var(--muted)">Tested by</span><strong>${esc(a.name)}</strong><span>${esc(a.short)}</span></div></a>
  <a class="bq-person" href="${authorUrl('ryan')}">${avatar('ryan')}<div><span class="bq-eyebrow" style="color:var(--muted)">Reviewed by</span><strong>Ryan Mitchell</strong><span>Editor-in-chief. Checks facts, measurements and sources.</span></div></a>
</section>`);
  s.push(`<section class="bq-stack" style="gap:14px">
  <h2 class="bq-h2 bq-h2--sm">Related buying guides</h2>
  <a href="/guide/${g.id}" style="font-size:16px;font-weight:700">${esc(g.title)}</a>
${related.map((r) => `  <a href="/guide/${r.id}" style="font-size:16px;font-weight:700">${esc(r.title)}</a>`).join('\n')}
</section>`);

  return `<article class="bq-article bq-has-mobile-buy">
<nav class="bq-crumbs"><a href="/">Home</a><a href="/category/${cat.id}">${esc(cat.name)}</a><a href="/guide/${g.id}">${esc(g.short)}</a><span>${esc(p.name)}</span></nav>
<div class="bq-review-top">
  <div class="bq-gallery" data-bq-gallery>
    <div class="bq-photo bq-gallery__main"><img src="${esc(shots[0])}" alt="${esc(caps[0])}"></div>
    <div class="bq-gallery__thumbs">${shots.map((src, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="${esc(caps[i])}" data-src="${esc(src)}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>
  </div>
  <div>
    <span class="bq-tag bq-tag--dark">Review · ${esc(p.label)} · ${esc(g.short)}</span>
    <h1 class="bq-h1" style="font-size:clamp(36px,5vw,58px)">${esc(p.name)}&nbsp;review</h1>
    <p class="bq-lead" style="font-size:18px">${esc(x.subtitle || p.verdict)}</p>
    <div class="bq-scoreline">
      <div class="bq-bigscore"><strong>${sc(p.score)}</strong><span>out of 10</span></div>
      <div class="bq-subscores">${g.criteria.map((c: string, i: number) => { const v = Math.min(10, Math.max(0, p.score + offs[i])); return `<div class="bq-subscore"><span>${esc(c)}</span><span class="bq-subscore__track"><span style="width:${Math.round(v * 10)}%"></span></span><span>${sc(v)}</span></div>`; }).join('')}</div>
    </div>
    <div class="bq-shops">${shopBtn(p)}<span class="bq-note">Prices checked September 30, 2026. We may earn a commission. <a href="/how-we-make-money" style="color:var(--muted-2)">Learn more</a></span></div>
    <div class="bq-pricehist">
      <div class="bq-pricehist__head"><strong>6-month price history</strong><span>Lowest price: <strong>${usd(p.price)}</strong></span></div>
      <div class="bq-pricehist__bars">${hist.map((h) => `<div><span>${usd(Math.round(p.price * h))}</span><span style="height:${Math.round((h / 1.12) * 70)}%"></span></div>`).join('')}</div>
      <div class="bq-pricehist__months">${months.map((m) => `<span>${m}</span>`).join('')}</div>
    </div>
  </div>
</div>
<div class="bq-review-meta">
  <div>Tested by<br><a href="${authorUrl(g.author)}">${esc(a.name)}</a></div>
  <div>Reviewed by<br><a href="${authorUrl('ryan')}">Ryan Mitchell</a></div>
  <div>In use since<br><strong>${esc(x.since || g.published)}</strong></div>
  <div>Purchase<br><strong>${esc(x.bought || 'Bought ourselves')}</strong></div>
  <div>Updated<br><strong>${esc(g.updated)}</strong></div>
  <div>Reading time<br><strong>${esc(x.readTime || '5 minutes')}</strong></div>
</div>
<div class="bq-layout">
  ${t.aside}
  <div class="bq-content">
${t.mobile}
${s.join('\n\n')}
  </div>
</div>
<div class="bq-mobile-buy"><span><strong>${esc(p.name)}</strong><small>from ${usd(p.price)} at Amazon</small></span><a href="${esc(amazon(p.name))}" rel="sponsored nofollow" target="_blank">Check price</a></div>
</article>`;
}

// ---------------------------------------------------------------- pages
export const infoSlugs: Record<string, string> = {
  guidelines: 'editorial-guidelines', money: 'how-we-make-money', corrections: 'corrections-policy',
  privacy: 'privacy', terms: 'terms', contact: 'contact',
};

export function infoHtml(key: string) {
  const i = (info as any)[key];
  const links = Object.keys(info).map((k) => `<a href="/${infoSlugs[k]}">${esc((info as any)[k].title)}</a>`).join('');
  return `<div class="bq-info">
<div class="bq-info__main">
  <nav class="bq-crumbs"><a href="/">Home</a><span>${esc(i.title)}</span></nav>
  <h1 class="bq-h1" style="font-size:clamp(36px,5.6vw,60px)">${esc(i.title)}</h1>
  <p class="bq-lead">${esc(i.lead)}</p>
${i.sections.map((x: string[]) => `  <section><h2>${esc(x[0])}</h2><p>${esc(x[1])}</p></section>`).join('\n')}
  <p class="bq-note" style="font-size:13px">Last updated: September 1, 2026</p>
</div>
<aside class="bq-info__aside">
  <strong class="bq-eyebrow bq-eyebrow--ink">Transparency</strong>
  ${links}<a href="/how-we-test">How we test</a><a href="/team">The editorial team</a>
</aside>
</div>`;
}

export function dealsHtml(deals: [string, number][]) {
  const cards = deals.map(([pid, was]) => {
    const p = products[pid];
    return `  <div class="bq-deal">
    <a class="bq-photo bq-photo--43" href="/review/${p.id}"><img src="${esc(productPhoto(p))}" alt="${esc(p.name)}" loading="lazy"><span class="bq-deal__pct">-${Math.round((1 - p.price / was) * 100)}%</span></a>
    <div class="bq-deal__body">
      <span class="bq-eyebrow" style="letter-spacing:0.06em">${esc(p.label)} · ${esc(p.guide.short)}</span>
      <a class="bq-deal__name" href="/review/${p.id}">${esc(p.name)}</a>
      <div class="bq-deal__price"><strong>${usd(p.price)}</strong><s>${usd(was)}</s></div>
      <span style="font-size:13px;color:var(--text-2)">Lowest price in 90 days at Amazon</span>
      <div class="bq-deal__actions"><a class="bq-btn bq-btn--buy bq-btn--sm" href="${esc(amazon(p.name))}" rel="sponsored nofollow" target="_blank">Go to Amazon</a><a class="bq-btn bq-btn--outline" style="padding:9px 14px;font-size:14px" href="/review/${p.id}">Review</a></div>
    </div>
  </div>`;
  }).join('\n');
  return `<div class="bq-page" style="padding-top:36px;gap:32px">
<div class="bq-stack" style="gap:14px;max-width:760px">
  <span class="bq-tag bq-tag--yellow">Checked September 30, 2026</span>
  <h1 class="bq-h1 bq-h1--xl">Deals</h1>
  <p class="bq-lead" style="font-size:18px">We only show deals on products we've tested and recommend ourselves. We compare against the price over the past 90 days, not the list price.</p>
</div>
<div class="bq-deals">
${cards}
</div>
</div>`;
}

export function methodHtml() {
  const steps = [['01', 'We buy it ourselves', 'We buy most products in stores, just like you.'], ['02', 'We use it for weeks', 'Every product becomes part of daily life in our test house.'], ['03', 'We measure', 'Fixed test protocols per category, so results are comparable.'], ['04', 'We keep testing', 'We keep using our picks longer to spot wear and failures.']];
  const weights = [['Cleaning performance', 40], ['Battery & runtime', 20], ['Ease of use', 20], ['Noise', 10], ['Maintenance', 10]];
  const principles = [
    ['How we make money', 'When you click a store button and buy something, that retailer pays us a small commission. We don’t run manufacturer ads.', '/how-we-make-money'],
    ['Editorial and business kept separate', 'Testers don’t know how much commission a retailer pays. The editorial team decides which retailers we show, based on price and service.', '/editorial-guidelines'],
    ['Fixing mistakes', 'If something is wrong, we correct it within two business days and note it at the bottom of the article.', '/corrections-policy'],
  ];
  const team = ['ryan', 'sarah', 'thomas', 'lauren', 'jake'];
  return `<section class="bq-container" style="padding-top:44px;padding-bottom:52px;display:flex;flex-wrap:wrap;gap:32px 48px;align-items:center">
  <div style="flex:2 1 520px;min-width:0;display:flex;flex-direction:column;gap:18px">
    <span class="bq-tag">About us</span>
    <h1 class="bq-h1" style="font-size:clamp(38px,6vw,76px);line-height:0.96;letter-spacing:-0.04em;max-width:960px">How we test, and how we make our money</h1>
    <p class="bq-lead" style="max-width:720px">BrasQ was founded in 2019 by journalist Ryan Mitchell. We want you to know what to buy in five minutes, and to be able to check why we say so.</p>
  </div>
  <div class="bq-photo bq-photo--43" style="flex:1 1 300px;max-width:440px;width:100%"><img src="${esc(testHousePhoto)}" alt="Our test house in Columbus"></div>
</section>
<section class="bq-band-dark">
  <div class="bq-container bq-block">
    <h2 class="bq-h2" style="font-size:clamp(28px,4vw,36px)">Our test method in four steps</h2>
    <div class="bq-steps-dark">${steps.map((s) => `<div><span>${s[0]}</span><strong>${esc(s[1])}</strong><span>${esc(s[2])}</span></div>`).join('')}</div>
  </div>
</section>
<section class="bq-container bq-block" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:40px">
  <div class="bq-stack" style="gap:14px"><h2 class="bq-h2">How a test score is built</h2><p class="bq-p" style="font-size:16px;color:var(--text-2)">Every category has a fixed weighting scheme that we set and publish in advance. Below is the scheme for vacuums.</p></div>
  <div class="bq-bars" style="gap:12px">${weights.map(([l, w]) => `<div class="bq-bar bq-bar--hl" style="grid-template-columns:minmax(0,150px) 1fr 44px"><span>${esc(l)}</span><span class="bq-bar__track" style="height:12px"><span style="width:${w}%"></span></span><span>${w}%</span></div>`).join('')}</div>
</section>
<section class="bq-band-yellow">
  <div class="bq-container bq-block" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:32px">
${principles.map((p) => `    <div class="bq-stack-sm" style="border-top:3px solid var(--ink);padding-top:16px"><h3 class="bq-h3" style="font-size:22px">${esc(p[0])}</h3><p style="margin:0;font-size:15px;line-height:1.6">${esc(p[1])}</p><a class="bq-link-strong" style="text-decoration-color:var(--ink)" href="${p[2]}">Read more</a></div>`).join('\n')}
  </div>
</section>
<section class="bq-container bq-block" style="gap:24px;padding-bottom:64px">
  <div class="bq-section-head"><h2 class="bq-h2">The editorial team</h2><a class="bq-link-strong" href="/team">All profiles →</a></div>
  <div class="bq-team" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:24px">${team.map((k) => `<a href="${authorUrl(k)}">${img(authorPhoto(k), authors[k].name, 'bq-photo--1')}<strong style="font-size:17px;font-weight:800">${esc(authors[k].name)}</strong><span class="bq-role">${esc(authors[k].role)}</span></a>`).join('')}</div>
  <p class="bq-small">Spotted something wrong? Read our <a href="/corrections-policy">corrections policy</a>.</p>
</section>`;
}

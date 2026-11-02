/*
 * Sample content for the "comparison" and "informational" post types, rendered with the bq-* classes
 * (see brasq-fe/CONTENT_GUIDE.md → "Comparison" and "Informational").
 *
 * A comparison takes 2, 3 or 4 products. The head-to-head table, row winners and "Rows won" tally are worked out
 * from the shared test results per category, so the same template works for any number of products.
 */
import { authors, G } from './data.js';
import { amazon, authorPhoto, authorUrl, catById, esc, guidePhoto, libPhoto, productPhoto, products, usd, type Pick } from './templates.js';
import { batteryInfoRow } from './info-battery.js';

const sc = (n: number) => n.toFixed(1);
const nb = (s: unknown) => esc(s).replace(/ /g, '&nbsp;');
const pad = (i: number) => String(i + 1).padStart(2, '0');
const avatar = (key: string) => `<div class="bq-avatar"><img src="${esc(authorPhoto(key))}" alt="${esc(authors[key].name)}" loading="lazy"></div>`;
const guideOf = (id: string) => (G as any[]).find((g) => g.id === id);

// ---------------------------------------------------------------- products
/** A product in a comparison: a reviewed product from the seed, or an extra one that only lives in comparisons. */
type Item = { id: string; name: string; score: number; price: number; verdict: string; href: string; readLabel: string; photo: string };

const EXTRA: Record<string, Item> = {
  'sweepa-r5': { id: 'sweepa-r5', name: 'Sweepa R5', score: 8.1, price: 349, verdict: 'A solid lidar robot with a bagless base, but only average on pet hair.', href: '/guide/robot-vacuums', readLabel: 'See it in our buying guide', photo: libPhoto('R3') },
};
function item(id: string): Item {
  if (EXTRA[id]) return EXTRA[id];
  const p: Pick | undefined = products[id];
  if (!p) throw new Error(`Unknown product "${id}" in comparison seed`);
  return { id, name: p.name, score: p.score, price: p.price, verdict: p.verdict, href: `/review/${id}`, readLabel: 'Read the full review', photo: productPhoto(p) };
}

// ---------------------------------------------------------------- shared test results per category
type Row = { label: string; unit: string; vals: Record<string, number | string>; fmt?: (x: any) => string; better?: 'high' | 'low' };
type Lib = {
  guide: string; noun: string; how: string[]; rows: Row[];
  buyIf: Record<string, string[]>; skipIf: Record<string, string[]>;
  faq: [string, string][]; sources: string[];
};
const pct = (x: number) => x + '%';
const mins = (x: number) => (x >= 60 ? Math.floor(x / 60) + (x % 60 === 30 ? '½' : '') + ' h' + (x % 60 && x % 60 !== 30 ? ' ' + (x % 60) + ' min' : '') : x + ' min');
const P7 = 'robomop-p7', MINI = 'clean-bot-mini', P9 = 'robomop-p9-ultra', SW = 'sweepa-r5';
const VS = 'vorta-s9', KA = 'kleen-air-300', NW = 'northwind-x2';
const r4 = (a: any, b: any, c: any, d: any) => ({ [P7]: a, [MINI]: b, [P9]: c, [SW]: d });
const s3 = (a: any, b: any, c: any) => ({ [VS]: a, [KA]: b, [NW]: c });

const LIBS: Record<string, Lib> = {
  robot: {
    guide: 'robot-vacuums', noun: 'robots',
    how: [
      'Every robot cleaned the ground floor of our test house in Columbus 20 times over five weeks: oak in the kitchen, a low-pile rug in the living room and tile in the hall. Our cat and dog supplied hair every day, and before each measured run we added a fixed hair mix so every robot faced the same amount.',
      'We weighed what each robot collected, counted every time it needed rescuing, and measured runtime and noise ourselves. We bought every robot at retail price; no manufacturer saw this comparison before publication.',
    ],
    rows: [
      { label: 'Price', unit: 'lowest at time of writing', vals: r4(499, 229, 899, 349), fmt: usd, better: 'low' },
      { label: 'Test score', unit: 'out of 10', vals: r4(8.9, 7.8, 9.3, 8.1), fmt: sc, better: 'high' },
      { label: 'Pet hair', unit: '% collected', vals: r4(94, 78, 92, 85), fmt: pct, better: 'high' },
      { label: 'Pickup, hardwood', unit: '% of test dirt', vals: r4(97, 90, 98, 95), fmt: pct, better: 'high' },
      { label: 'Got stuck', unit: 'times in 20 runs', vals: r4(2, 9, 1, 5), fmt: (x) => x + '×', better: 'low' },
      { label: 'Runtime', unit: 'standard mode', vals: r4(150, 90, 180, 120), fmt: mins, better: 'high' },
      { label: 'Noise', unit: 'dB at 1 meter', vals: r4(65, 62, 66, 67), fmt: (x) => x + ' dB', better: 'low' },
      { label: 'Height', unit: 'fits under furniture', vals: r4(3.8, 2.9, 4.1, 3.7), fmt: (x) => x + ' in', better: 'low' },
      { label: 'Running cost', unit: 'parts per year', vals: r4(45, 15, 120, 30), fmt: usd, better: 'low' },
      { label: 'Mopping', unit: '', vals: r4('No', 'No', 'Spinning pads', 'Drag pad') },
      { label: 'Base', unit: '', vals: r4('Bagged, self-empty', 'None', 'Bagged + pad washing', 'Bagless, self-empty') },
    ],
    buyIf: { [P7]: ['You have pets that shed', 'You want a robot that rarely needs rescuing'], [MINI]: ['You live in a small apartment', 'You want the lowest price and running cost'], [P9]: ['You want vacuuming and real mopping in one', 'Your floors are often cluttered'], [SW]: ['You want a mapping robot under $400', 'You don’t want to buy bags'] },
    skipIf: { [P7]: ['You want it to mop', 'You have little space for the base station'], [MINI]: ['You want to clean one room at a time', 'Cables or socks end up on your floor'], [P9]: ['You mind $120 a year in parts', 'Your home is mostly carpet'], [SW]: ['You have a long-haired pet', 'Cables are often on your floor'] },
    faq: [
      ['Is a more expensive robot vacuum cleaner?', 'Only up to a point. In our test, pickup barely improved above $500. The extra money buys mopping, obstacle avoidance and a station that does more of the maintenance.'],
      ['Do I need a self-emptying base?', 'With pets, yes: without one you empty a small bin after almost every run. In an apartment without pets you can do without.'],
      ['Do any of them need a subscription?', 'No. Mapping, scheduling and room cleaning are free in all of the apps.'],
    ],
    sources: ['BrasQ robot vacuum test protocol (2026)', 'IEC 62929: Cleaning robots for household use, methods for measuring performance', 'Manufacturer manuals and spec sheets'],
  },
  stick: {
    guide: 'stick-vacuums', noun: 'vacuums',
    how: [
      'Each vacuum picked up three standardized dirt mixes on hardwood, low-pile and high-pile carpet in our test house, and we weighed what it collected after every run.',
      'We measured runtime from a full charge on the standard setting, weighed each vacuum ready to use and recorded noise at one meter. For the hair test we vacuumed a rug with long human hair every day for a week without clearing the brush, then counted the wrapped strands.',
    ],
    rows: [
      { label: 'Price', unit: 'lowest at time of writing', vals: s3(339, 169, 549), fmt: usd, better: 'low' },
      { label: 'Test score', unit: 'out of 10', vals: s3(9.1, 8.2, 9.4), fmt: sc, better: 'high' },
      { label: 'Pickup, hardwood', unit: '% of test dirt', vals: s3(98, 93, 99), fmt: pct, better: 'high' },
      { label: 'Pickup, high-pile carpet', unit: '% of test dirt', vals: s3(92, 78, 97), fmt: pct, better: 'high' },
      { label: 'Hair on the brush', unit: 'strands after a week', vals: s3(14, 22, 0), fmt: String, better: 'low' },
      { label: 'Runtime', unit: 'standard setting', vals: s3(48, 35, 60), fmt: mins, better: 'high' },
      { label: 'Weight', unit: 'ready to use', vals: s3(5.7, 4.9, 6.6), fmt: (x) => x + ' lb', better: 'low' },
      { label: 'Noise', unit: 'dB at 1 meter', vals: s3(69, 72, 70), fmt: (x) => x + ' dB', better: 'low' },
      { label: 'Battery', unit: '', vals: s3('Screw-in', 'Click-in, $49 spare', 'Click-in, $89 spare') },
    ],
    buyIf: { [VS]: ['You want one vacuum for a whole house', 'You have mostly hard floors and low-pile rugs'], [KA]: ['You live in an apartment with hard floors', 'You want the lightest vacuum'], [NW]: ['You have deep carpet or shag rugs', 'Someone in the house has long hair'] },
    skipIf: { [VS]: ['You have a lot of shag carpet', 'You don’t want to drill for the wall mount'], [KA]: ['You have a lot of carpet', 'Your home is larger than about 900 sq ft'], [NW]: ['Your floors are mostly hard', 'You want to keep the price under $400'] },
    faq: [
      ['Is the Northwind worth $210 more?', 'Only for deep carpet or long hair. On hard floors and low-pile rugs we measured almost no difference.'],
      ['Can I buy a spare battery?', 'For the Northwind, yes: it clicks out. The Vorta’s battery is screwed in, so a spare is less practical.'],
    ],
    sources: ['BrasQ stick vacuum test protocol (2026)', 'IEC 62885-4: Cordless dry vacuum cleaners, methods for measuring performance', 'Manufacturer manuals and spec sheets'],
  },
};

// ---------------------------------------------------------------- comparison posts
type Comparison = {
  slug: string; lib: string; cat: string; author: string; ids: string[]; tags: string[];
  title: string; excerpt: string; intro: string; updated: string; published: string; weeks: number;
  summary: string[]; verdict: string;
};

export const COMPARISONS: Comparison[] = [
  { slug: 'robomop-p7-vs-robomop-p9-ultra', lib: 'robot', cat: 'cleaning', author: 'sarah', ids: [P7, P9], tags: ['Best for pets', 'Vacuum and mop'], weeks: 5, updated: 'October 14, 2026', published: 'September 22, 2026',
    title: 'Robomop P7 vs Robomop P9 Ultra: is the $400 upgrade worth it?',
    excerpt: 'Both handled pet hair well in our test. The P9 Ultra adds real mopping and better obstacle avoidance; the P7 costs $400 less.',
    intro: 'We ran both robots side by side for five weeks in a home with a cat and a dog. Both handled pet hair well; the P9 Ultra adds real mopping and better obstacle avoidance, and the P7 costs $400 less.',
    summary: ['Buy the Robomop P7 if you only need vacuuming. It collected slightly more pet hair than the P9 Ultra and costs $400 less.', 'Buy the P9 Ultra if your floors need mopping. Its spinning pads were the only ones in our test that removed dried coffee.', 'The P9 Ultra is better at avoiding cables and pet bowls: it got stuck once in 20 runs, the P7 twice.', 'Budget for running costs: the P9 Ultra needs about $120 a year in parts, almost three times the P7.'],
    verdict: 'If you just want clean, hair-free floors, the Robomop P7 does that for $400 less. Pay for the P9 Ultra only if you want the robot to mop as well.' },
  { slug: 'robot-vacuum-picks-compared', lib: 'robot', cat: 'cleaning', author: 'sarah', ids: [P7, MINI, P9], tags: ['Our pick', 'Budget pick', 'Upgrade'], weeks: 5, updated: 'October 14, 2026', published: 'September 22, 2026',
    title: 'Robomop P7 vs Clean Bot Mini vs Robomop P9 Ultra: our three robot picks compared',
    excerpt: 'Our three robot vacuum picks side by side, with every test result, so you can see exactly where the extra money goes.',
    intro: 'Our buying guide recommends three robots for three kinds of home. Here they are side by side, with every test result, so you can see exactly where the extra money goes.',
    summary: ['The Robomop P7 is the best robot for most homes with pets: the most hair collected and only two rescues in 20 runs.', 'The Clean Bot Mini costs $229 and is fine for a small, tidy apartment, but it drives randomly and can’t clean one room at a time.', 'The Robomop P9 Ultra is the only one that really mops, and the best at avoiding obstacles.', 'Pickup barely improves above $500. You pay for mopping, maps and fewer rescues.'],
    verdict: 'Start with the Robomop P7: it’s the best value for a home with pets. Go down to the Clean Bot Mini for a small apartment, or up to the P9 Ultra if you want mopping too.' },
  { slug: 'robot-vacuums-under-900-compared', lib: 'robot', cat: 'cleaning', author: 'sarah', ids: [P7, P9, SW, MINI], tags: ['Best for pets', 'Vacuum and mop', 'Best mid-range', 'Budget pick'], weeks: 5, updated: 'October 14, 2026', published: 'October 14, 2026',
    title: 'Four robot vacuums from $229 to $899, compared',
    excerpt: 'Four robots side by side for five weeks in a home with a cat and a dog. Price predicted how much they could do, not how clean they got the floor.',
    intro: 'We ran four robots side by side for five weeks in a home with a cat and a dog. Price predicted how much they could do, not how clean they got the floor.',
    summary: ['The Robomop P7 is the best robot for most homes with pets.', 'The P9 Ultra is the only real mopping robot here, and the best at avoiding obstacles.', 'The Sweepa R5 is a good mid-range choice at $349, with a real map and a bagless base, but only average on hair.', 'The Clean Bot Mini is for small, tidy apartments only.'],
    verdict: 'Buy the Robomop P7 if you have pets, the P9 Ultra if you want mopping, and the Sweepa R5 if you want a mapping robot for less. The Clean Bot Mini only makes sense in a small apartment with a tidy floor.' },
  { slug: 'vorta-s9-vs-northwind-x2', lib: 'stick', cat: 'cleaning', author: 'sarah', ids: [VS, NW], tags: ['Our pick', 'Upgrade'], weeks: 6, updated: 'October 3, 2026', published: 'August 18, 2026',
    title: 'Vorta S9 vs Northwind X2: which stick vacuum should you buy?',
    excerpt: 'Our top pick and our upgrade pick side by side. The Northwind wins on deep carpet and long hair; the Vorta does nearly as well for $210 less.',
    intro: 'Our top pick and our upgrade pick, tested side by side for six weeks. The Northwind wins on deep carpet and long hair; the Vorta does nearly as well for $210 less.',
    summary: ['Most homes should buy the Vorta S9. On hard floors and low-pile rugs it cleans as well as the Northwind for $210 less.', 'The Northwind X2 is worth it for deep carpet (97% pickup against 92%) or long hair: its brush stayed clean all week.', 'The Northwind runs 12 minutes longer and its battery clicks out, so a spare is easy.', 'The Vorta is almost a pound lighter, which you notice on the stairs.'],
    verdict: 'Buy the Vorta S9 unless you have deep carpet or long hair in the house. If you do, the Northwind X2 is the best stick vacuum we have tested.' },
];

const COUNT_WORD: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four' };

export function comparisonHtml(c: Comparison) {
  const L = LIBS[c.lib], g = guideOf(L.guide), cat = catById[c.cat], a = authors[c.author];
  const items = c.ids.map(item), n = items.length;

  // head-to-head: mark the best value in each row (no winner when all are equal)
  const wins = items.map(() => 0);
  const rows = L.rows.map((r) => {
    const vals = c.ids.map((id) => r.vals[id]);
    let best = vals.map(() => false);
    if (r.better) {
      const nums = vals as number[];
      const target = r.better === 'high' ? Math.max(...nums) : Math.min(...nums);
      best = nums.map((x) => x === target);
      if (best.every(Boolean)) best = best.map(() => false);
    }
    best.forEach((b, i) => { if (b) wins[i]++; });
    const cells = vals.map((x, i) => best[i]
      ? `<td class="bq-win">${esc(r.fmt ? r.fmt(x) : x)} <span class="bq-win__mark">✓ Best</span></td>`
      : `<td>${esc(r.fmt ? r.fmt(x) : x)}</td>`).join('');
    return `      <tr><th>${esc(r.label)}${r.unit ? `<span>${esc(r.unit)}</span>` : ''}</th>${cells}</tr>`;
  });
  const tested = L.rows.filter((r) => r.better).length;

  const shop = (p: Item) => esc(amazon(p.name));
  const card = (p: Item, i: number) => `    <div class="bq-prod">
      <div class="bq-prod__tag${i === 0 ? ' bq-prod__tag--hl' : ''}">${esc(c.tags[i])}</div>
      <a class="bq-photo bq-photo--1" href="${p.href}"><img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy"></a>
      <div class="bq-prod__body">
        <a class="bq-prod__name" href="${p.href}">${esc(p.name)}</a>
        <div class="bq-prod__score"><span class="bq-score">Test score <strong>${sc(p.score)}</strong></span><span>Best in ${wins[i]} of ${tested} tests</span></div>
        <p class="bq-prod__text">${esc(p.verdict)}</p>
        <a class="bq-btn bq-btn--black" href="${shop(p)}" rel="sponsored nofollow" target="_blank">${usd(p.price)} at Amazon</a>
        <a class="bq-link-strong" href="${p.href}">${esc(p.readLabel)}</a>
      </div>
    </div>`;

  const which = items.map((p, i) => `  <div class="bq-which">
    <div class="bq-which__head"><a class="bq-prod__name" href="${p.href}">${esc(p.name)}</a><span class="bq-tag bq-tag--sm${i === 0 ? '' : ' bq-tag--dark'}">${esc(c.tags[i])}</span></div>
    <div class="bq-buyskip">
      <div class="bq-buyskip__yes"><strong>Buy it if</strong><ul>${(L.buyIf[p.id] ?? []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="bq-buyskip__no"><strong>Skip it if</strong><ul>${(L.skipIf[p.id] ?? []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <a class="bq-btn bq-btn--black" href="${shop(p)}" rel="sponsored nofollow" target="_blank">${usd(p.price)} at Amazon</a>
  </div>`).join('\n');

  const top = items[0];
  return `<article class="bq-article bq-compare">
<nav class="bq-crumbs"><a href="/">Home</a><a href="/category/${cat.id}">${esc(cat.name)}</a><a href="/guide/${g.id}">${esc(g.short)}</a><span>Comparison</span></nav>
<div class="bq-guide-top">
  <header class="bq-guide-head">
    <span class="bq-tag">Comparison · ${n}&nbsp;products</span>
    <h1 class="bq-h1">${esc(c.title)}</h1>
    <p class="bq-lead">${esc(c.intro)}</p>
    <div class="bq-meta">
      <div class="bq-meta__author">${avatar(c.author)}<div>Tested and written by<br><a href="${authorUrl(c.author)}">${esc(a.name)}</a></div></div>
      <div>Reviewed by<br><a href="${authorUrl('ryan')}">Ryan Mitchell</a>, editor-in-chief</div>
      <div>Updated<br><strong>${nb(c.updated)}</strong></div>
      <div>Test period<br><strong>${c.weeks}&nbsp;weeks · ${n}&nbsp;models</strong></div>
    </div>
    <p class="bq-disclosure">We choose products independently. We may earn a commission through links on this page; your price stays the same. <a href="/how-we-make-money">Affiliate policy</a></p>
  </header>
  <div class="bq-photo bq-guide-hero"><img src="${esc(guidePhoto(g, 1))}" alt="The ${esc(L.noun)} side by side in our test house" loading="lazy"></div>
</div>

<section id="c-lineup" class="bq-section">
  <div class="bq-lineup-head"><h2 class="bq-h2">The ${COUNT_WORD[n]} ${esc(L.noun)}</h2><span class="bq-note">Prices checked ${esc(c.updated)}</span></div>
  <div class="bq-lineup bq-lineup--${n}">
${items.map(card).join('\n')}
${n === 2 ? '    <div class="bq-vs" aria-hidden="true">vs</div>\n' : ''}  </div>
</section>

<div class="bq-compare__body">
<section id="c-summary" class="bq-summary">
  <h2 class="bq-h2 bq-h2--sm">The short answer</h2>
  <ol>${c.summary.map((x) => `<li><span>${esc(x)}</span></li>`).join('')}</ol>
</section>

<section id="c-how" class="bq-section">
  <h2 class="bq-h2">How we compared them</h2>
${L.how.map((p) => `  <p class="bq-p">${esc(p)}</p>`).join('\n')}
</section>
</div>

<section id="c-h2h" class="bq-section">
  <div class="bq-compare__body"><h2 class="bq-h2">Head to head</h2><p class="bq-p">The better result in each row is marked. All figures are our own measurements unless noted.</p></div>
  <div class="bq-table-wrap"><table class="bq-h2h">
    <thead><tr><th>Test</th>${items.map((p) => `<th><a href="${p.href}">${esc(p.name)}</a></th>`).join('')}</tr></thead>
    <tbody>
${rows.join('\n')}
      <tr class="bq-h2h__tally"><th>Rows won</th>${wins.map((w) => `<td>${w}</td>`).join('')}</tr>
    </tbody>
  </table></div>
</section>

<div class="bq-compare__body">
<section id="c-which" class="bq-section">
  <h2 class="bq-h2">Which one should you buy?</h2>
${which}
</section>

<section id="c-verdict" class="bq-verdict bq-verdict--dark">
  <span class="bq-eyebrow">Our verdict</span>
  <p>${esc(c.verdict)}</p>
  <div class="bq-verdict__actions"><a class="bq-btn bq-btn--buy" href="${shop(top)}" rel="sponsored nofollow" target="_blank">${esc(top.name)}: ${usd(top.price)} at Amazon</a><a href="/guide/${g.id}">See all ${esc(g.short.toLowerCase())} we tested</a></div>
</section>

<section id="c-faq" class="bq-faq">
  <h2 class="bq-h2">Frequently asked questions</h2>
${L.faq.map(([q, ans]) => `  <details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('\n')}
</section>

<section class="bq-sources">
  <div><strong class="bq-eyebrow bq-eyebrow--ink">Sources</strong><ul>${L.sources.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div><strong class="bq-eyebrow bq-eyebrow--ink">Changelog</strong><ul class="bq-changelog"><li><time>${esc(c.updated)}</time><span>Prices checked and results updated.</span></li>${c.published !== c.updated ? `<li><time>${esc(c.published)}</time><span>First published.</span></li>` : ''}</ul></div>
</section>

<section class="bq-authorbox">${avatar(c.author)}
  <div><strong>${esc(a.name)}</strong><p>${esc(a.bio)}</p><a class="bq-link-strong" href="${authorUrl(c.author)}">Profile and all articles</a></div>
</section>
</div>
</article>`;
}


// ---------------------------------------------------------------- informational posts
type Section = { id: string; h: string; p?: string[]; steps?: [string, string][]; table?: { head: string[]; rows: string[][]; note?: string }; cards?: [string, string][]; callout?: { k: string; h: string; t: string } };
type Explainer = {
  slug: string; cat: string; author: string; guide: string; updated: string; published: string; basedOn: string; photo: string;
  title: string; excerpt: string; take: string[]; sections: Section[]; myths: [string, string][]; gloss: [string, string][];
  faq: [string, string][]; nextLine: string; next: ['guide' | 'comparison' | 'review', string][]; sources: string[];
};

export const EXPLAINERS: Explainer[] = [
  { slug: 'how-robot-vacuums-work', cat: 'cleaning', author: 'sarah', guide: 'robot-vacuums', updated: 'October 20, 2026', published: 'June 4, 2026', basedOn: '60+ robots tested since 2021', photo: 'R3',
    title: 'How does a robot vacuum work? Navigation, suction and bases explained',
    excerpt: 'After testing more than 60 robot vacuums, we know which parts decide how clean your floor gets and which are marketing.',
    take: ['The software matters as much as the motor: route planning decides how much floor a robot covers.', 'Lidar robots map accurately, even in the dark. Camera robots are better at avoiding cables, socks and pet waste.', 'The suction number on the box says little about pickup. Brush design and airflow matter more.', 'A self-emptying base turns a daily chore into a monthly one.', 'Robot mopping wipes dust and footprints; only spinning pads touch dried spills.'],
    sections: [
      { id: 'i-parts', h: 'What’s inside a robot vacuum', p: ['A robot vacuum works like a small regular vacuum: a motor creates airflow, a brush loosens dirt, and a filter keeps dust in the bin. What makes it a robot is everything around that.'],
        cards: [['Lidar or camera', 'Measures the room and builds the map. The round bump on top of most robots is a spinning laser.'], ['Cliff sensors', 'Infrared sensors underneath that stop the robot at the top of the stairs.'], ['Side brush', 'Sweeps dirt out of corners and along baseboards into the robot’s path.'], ['Main brush', 'Lifts dirt out of carpet and into the suction channel.'], ['Bin and filter', 'Hold the dirt until the base empties the robot.'], ['Battery', 'Good for 1½ to 3 hours, and replaceable on most models.']] },
      { id: 'i-run', h: 'One cleaning run, step by step', p: ['This is what a typical lidar robot with a self-emptying base does from the moment you press start.'],
        steps: [['Finds itself', 'It spins its lidar and matches what it sees to the stored map, so it knows which room it’s in.'], ['Plans the route', 'The software splits the floor into rooms and picks an order.'], ['Cleans the edges', 'In each room it follows the walls first, with the side brush sweeping the corners.'], ['Fills the room in rows', 'Then it drives back and forth in overlapping lines, like mowing a lawn.'], ['Boosts on carpet', 'Sensors underneath detect carpet and raise suction automatically.'], ['Recharges if needed', 'On a low battery it returns to charge, then resumes where it stopped.'], ['Empties itself', 'Back on the base, a second motor sucks the bin empty in about ten seconds.']] },
      { id: 'i-nav', h: 'How a robot finds its way', p: ['How a robot sees your home decides whether it cleans in neat rows or bounces around at random, and whether it gets stuck on a phone cable.'],
        table: { head: ['Navigation', 'How it works', 'Works in the dark', 'Avoids cables', 'Typical price'], rows: [['Bump and go', 'Drives until it hits something, then turns.', 'Yes', 'No', '$100–250'], ['Camera', 'Recognizes rooms and objects.', 'Needs light', 'Best', '$300–600'], ['Lidar', 'A spinning laser measures every wall.', 'Yes', 'Large items only', '$180–400'], ['Lidar + camera', 'Lidar for the map, a camera for objects.', 'Mostly', 'Good', '$350–900']], note: 'Typical US prices for each navigation type, October 2026.' } },
      { id: 'i-suction', h: 'Suction, brushes and airflow', p: ['What lifts dirt is airflow: how much air moves through the brush opening, and how well the robot seals against the floor.', 'The brush does the other half of the work. On carpet it lifts the pile so sand comes loose; on hard floors it mostly sweeps.'],
        callout: { k: 'What the box doesn’t tell you', h: 'The pascal number barely predicts pickup', t: 'Across 38 robots we tested, carpet pickup rose from 89% to 92% between the lowest and highest suction groups. A robot rated at 2,700 Pa beat several rated at 8,000 Pa.' } },
      { id: 'i-base', h: 'Self-emptying bases: bagged or bagless?', p: ['Without a base, a robot’s bin holds one or two runs of dirt, and most owners stop emptying it within weeks. A base sucks the dirt out after each run and holds weeks of it.'],
        cards: [['Bagged base', 'Dust stays sealed when you empty it, which is better for allergies. Bags cost $20 to $60 a year.'], ['Bagless base', 'No bags to buy and a clear bin, but a small dust cloud when you empty it.']] },
    ],
    myths: [['More pascals means cleaner floors.', 'Across 38 robots, pickup barely changed above 3,000 Pa.'], ['A robot replaces a regular vacuum.', 'It handles daily upkeep, not stairs, sofas or deep carpet.'], ['Robots spread pet mess around.', 'Camera robots recognized fake pet waste in 9 of 10 runs in our test.'], ['The app needs a subscription.', 'None of the major brands charge for mapping or scheduling.']],
    gloss: [['Lidar', 'A spinning laser that measures distances to build a map.'], ['Line laser', 'A flat beam at the front that detects low objects like cables.'], ['No-go zone', 'An area on the map the robot won’t enter.'], ['Recharge and resume', 'The robot charges mid-clean, then continues where it stopped.']],
    faq: [['How long does a robot take to clean a home?', 'About an hour per 800 sq ft of mixed floors in standard mode.'], ['Can a robot vacuum go up stairs?', 'No. Cliff sensors stop it at the top; you carry it up, or buy a second robot.'], ['Why does my robot clean worse than when it was new?', 'Almost always a clogged filter or a brush wrapped in hair. Clean both, and replace the filter every three months.']],
    nextLine: 'This article explains how the parts work. To see which robots do it best, start with our tests.',
    next: [['guide', 'robot-vacuums'], ['comparison', 'robot-vacuum-picks-compared'], ['review', P7]],
    sources: ['BrasQ robot vacuum test data, 2021–2026 (63 robots)', 'IEC 62929: Cleaning robots for household use, methods for measuring performance', 'Manufacturer manuals and spec sheets'] },
  { slug: 'how-to-descale-a-coffee-maker', cat: 'kitchen', author: 'thomas', guide: 'coffee-makers', updated: 'September 8, 2026', published: 'May 12, 2026', basedOn: '12 machines descaled in our test kitchen', photo: 'C1',
    title: 'How to descale a coffee maker, and how often you really need to',
    excerpt: 'Scale makes coffee taste flat and slowly ruins the heater. How to remove it, how often to do it for your water, and why vinegar is a bad idea.',
    take: ['Hard water means descaling every one to two months; soft water every four to six.', 'Use the descaler your manufacturer recommends. Vinegar can damage seals and is hard to rinse out.', 'A full descale takes about 30 minutes, most of it waiting.', 'A water filter in the tank halves how often you need to descale.'],
    sections: [
      { id: 'i-why', h: 'Why scale matters', p: ['Tap water contains calcium and magnesium. When it heats up, those minerals settle as a white crust on the heater and in the pipes.', 'Scale insulates the heater, so the water doesn’t get hot enough and your coffee tastes flat. Eventually it blocks the flow completely.'] },
      { id: 'i-often', h: 'How often to descale', p: ['It depends on your water hardness. Your water company publishes it, or a $5 test strip tells you in seconds.'],
        table: { head: ['Water hardness', 'Grains per gallon', 'Descale every', 'With a filter'], rows: [['Soft', 'Under 3.5', '4–6 months', '6–12 months'], ['Moderate', '3.5–7', '2–3 months', '4–6 months'], ['Hard', '7–10.5', '1–2 months', '3–4 months'], ['Very hard', 'Over 10.5', 'Monthly', '2 months']], note: 'Based on about two cups a day.' } },
      { id: 'i-steps', h: 'Step by step', steps: [['Empty and rinse', 'Empty the drip tray, grounds container and water tank.'], ['Mix the descaler', 'Dissolve the descaler in the tank with the amount of water on the label.'], ['Start the program', 'Most bean-to-cup machines have a descale program; it pauses so you can empty the tray.'], ['Rinse twice', 'Fill the tank with fresh water and run the rinse at least twice.'], ['Reset the reminder', 'Most machines count down to the next descale; reset it in the menu.']] },
      { id: 'i-vinegar', h: 'Vinegar or descaler?', p: ['Vinegar works on a simple drip coffee maker, but it’s a weak acid, so it needs more time, and the smell lingers for several brews.'],
        callout: { k: 'From our test kitchen', h: 'Don’t use vinegar in an espresso machine', t: 'Two of the machines we tested warn against vinegar in the manual, because it can attack rubber seals. Using it can void the warranty.' } },
    ],
    myths: [['Bottled water means you never need to descale.', 'Mineral water contains minerals too. Only filtered or soft water slows scale down.'], ['Descaling and cleaning are the same.', 'Descaling removes minerals; cleaning removes coffee oils. You need both.']],
    gloss: [['Scale', 'Mineral deposits left by heated hard water.'], ['Citric acid', 'A common descaler ingredient, gentle on seals.']],
    faq: [['What happens if I never descale?', 'The coffee gets cooler and weaker, and eventually the machine stops pumping water.'], ['Can I descale with lemon juice?', 'It works, but bottled citric acid is cheaper and has no pulp to clog the pipes.']],
    nextLine: 'Some machines make descaling much easier than others. See how they compared in our tests.',
    next: [['guide', 'coffee-makers'], ['review', 'bonaro-one']],
    sources: ['BrasQ bean-to-cup test protocol (2026)', 'US Geological Survey: Hardness of water', 'Manufacturer manuals'] },
];

const words = (x: Explainer) => [x.title, x.excerpt, ...x.take, ...x.sections.flatMap((s) => [s.h, ...(s.p ?? []), ...(s.steps ?? []).flat(), ...(s.cards ?? []).flat(), ...(s.table?.rows.flat() ?? []), ...(s.callout ? [s.callout.h, s.callout.t] : [])]), ...x.myths.flat(), ...x.gloss.flat(), ...x.faq.flat()].join(' ').split(/\s+/).length;

function nextCard([kind, id]: Explainer['next'][number]) {
  if (kind === 'guide') { const g = guideOf(id); return { k: 'Buying guide', t: g.title, d: `${g.count} models tested over ${g.weeks} weeks.`, href: `/guide/${id}` }; }
  if (kind === 'comparison') { const c = COMPARISONS.find((x) => x.slug === id)!; return { k: 'Comparison', t: c.title, d: `${c.ids.length} products side by side.`, href: `/compare/${id}` }; }
  const p = item(id); return { k: 'Review', t: `${p.name} review`, d: p.verdict, href: p.href };
}

function sectionHtml(s: Section) {
  const out: string[] = [`<section id="${s.id}" class="bq-section">`, `  <h2 class="bq-h2">${esc(s.h)}</h2>`];
  for (const p of s.p ?? []) out.push(`  <p class="bq-p">${esc(p)}</p>`);
  if (s.steps) out.push(`  <ol class="bq-nsteps bq-nsteps--titled">${s.steps.map(([h, t]) => `<li><div><strong>${esc(h)}</strong><p>${esc(t)}</p></div></li>`).join('')}</ol>`);
  if (s.table) out.push(`  <div class="bq-table-wrap"><table class="bq-table">
    <thead><tr>${s.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>${s.table.note ? `\n  <p class="bq-note">${esc(s.table.note)}</p>` : ''}`);
  if (s.cards) out.push(`  <div class="bq-grid bq-grid--3">${s.cards.map(([k, v]) => `<div class="bq-card"><strong class="bq-card__title">${esc(k)}</strong><p>${esc(v)}</p></div>`).join('')}</div>`);
  if (s.callout) out.push(`  <aside class="bq-callout"><span class="bq-eyebrow">${esc(s.callout.k)}</span><strong>${esc(s.callout.h)}</strong><p>${esc(s.callout.t)}</p></aside>`);
  out.push('</section>');
  return out.join('\n');
}

export function informationalHtml(x: Explainer) {
  const cat = catById[x.cat], g = guideOf(x.guide), a = authors[x.author];
  const items: [string, string][] = [['Key takeaways', 'i-takeaways'], ...x.sections.map((s) => [s.h, s.id] as [string, string]),
    ...(x.myths.length ? [['Myths', 'i-myths']] as [string, string][] : []), ['Ready to choose one?', 'i-next'],
    ...(x.gloss.length ? [['Terms explained', 'i-glossary']] as [string, string][] : []), ['FAQ', 'i-faq']];
  const links = items.map(([l, id]) => `<a href="#${id}">${esc(l)}</a>`).join('\n    ');
  const minutes = Math.max(1, Math.round(words(x) / 230));

  return `<article class="bq-article bq-infopost">
<nav class="bq-crumbs"><a href="/">Home</a><a href="/category/${cat.id}">${esc(cat.name)}</a><a href="/guide/${g.id}">${esc(g.short)}</a><span>Explained</span></nav>
<div class="bq-guide-top">
  <header class="bq-guide-head">
    <div class="bq-tagline"><span class="bq-tag bq-tag--dark">Explained</span><span>${minutes} min read</span></div>
    <h1 class="bq-h1">${esc(x.title)}</h1>
    <p class="bq-lead">${esc(x.excerpt)}</p>
    <div class="bq-meta">
      <div class="bq-meta__author">${avatar(x.author)}<div>Written by<br><a href="${authorUrl(x.author)}">${esc(a.name)}</a></div></div>
      <div>Reviewed by<br><a href="${authorUrl('ryan')}">Ryan Mitchell</a>, editor-in-chief</div>
      <div>Updated<br><strong>${nb(x.updated)}</strong></div>
      <div>Based on<br><strong>${esc(x.basedOn)}</strong></div>
    </div>
    <div class="bq-disclosure-row">
      <p class="bq-disclosure">This article explains a topic and doesn’t rank products. It links to our tests, and we may earn a commission through those links. <a href="/how-we-make-money">Affiliate policy</a></p>
      <button type="button" class="bq-btn-outline-sm" data-bq-copy>Copy link</button>
    </div>
  </header>
  <figure class="bq-hero-fig"><div class="bq-photo"><img src="${esc(libPhoto(x.photo))}" alt="${esc(x.title)}" loading="lazy"></div></figure>
</div>
<div class="bq-layout">
  <aside class="bq-toc" data-bq-spy>
    <div class="bq-toc__title">In this article</div>
    ${links}
    <a class="bq-toc__top" href="#">Back to top ↑</a>
  </aside>
  <div class="bq-content">
<details class="bq-toc-mobile"><summary>In this article</summary><nav>${links}</nav></details>

<section id="i-takeaways" class="bq-summary">
  <h2 class="bq-h2 bq-h2--sm">Key takeaways</h2>
  <ol>${x.take.map((t) => `<li><span>${esc(t)}</span></li>`).join('')}</ol>
</section>

${x.sections.map(sectionHtml).join('\n\n')}
${x.myths.length ? `
<section id="i-myths" class="bq-section">
  <h2 class="bq-h2">Myths, checked</h2>
  <div class="bq-claims">${x.myths.map(([m, f]) => `<div class="bq-claim"><div><span class="bq-verdict-tag">Myth</span><strong>${esc(m)}</strong></div><p>${esc(f)}</p></div>`).join('')}</div>
</section>` : ''}

<section id="i-next" class="bq-next">
  <span class="bq-eyebrow">Ready to choose one?</span>
  <p>${esc(x.nextLine)}</p>
  <div class="bq-next__links">${x.next.map(nextCard).map((n) => `<a href="${n.href}"><span class="bq-eyebrow">${esc(n.k)}</span><strong>${esc(n.t)}</strong><span>${esc(n.d)}</span></a>`).join('')}</div>
</section>
${x.gloss.length ? `
<section id="i-glossary" class="bq-section">
  <h2 class="bq-h2">Terms explained</h2>
  <div class="bq-rows bq-defs">${x.gloss.map(([k, v]) => `<div><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('')}</div>
</section>` : ''}

<section id="i-faq" class="bq-faq">
  <h2 class="bq-h2">Frequently asked questions</h2>
${x.faq.map(([q, ans]) => `  <details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('\n')}
</section>

<section class="bq-helpful" data-bq-helpful><strong>Was this article helpful?</strong><div><button type="button" data-vote="yes">Yes</button><button type="button" data-vote="no">No</button></div></section>

<section class="bq-about">${avatar(x.author)}
  <div><span class="bq-eyebrow">About the author</span><a class="bq-about__name" href="${authorUrl(x.author)}">${esc(a.name)}</a><p>${esc(a.bio)}</p></div>
</section>

<div class="bq-history bq-history--dated"><strong>Update history</strong><ul><li><time>${esc(x.updated)}</time><span>Checked and updated.</span></li><li><time>${esc(x.published)}</time><span>First published.</span></li></ul></div>
<div class="bq-history"><strong>Sources</strong><ul>${x.sources.map((src) => `<li>${esc(src)}</li>`).join('')}</ul></div>
  </div>
</div>
</article>`;
}

// ---------------------------------------------------------------- rows for the database
const day = (s: string) => new Date(s + ' 12:00 UTC');

/** Post rows (without category/author ids, which the caller resolves from the slugs). */
export function postTypeRows() {
  return [
    ...COMPARISONS.map((c) => ({
      type: 'comparison' as const, slug: c.slug, title: c.title, excerpt: c.excerpt, html: comparisonHtml(c), css: '',
      coverImage: guidePhoto(guideOf(LIBS[c.lib].guide), 1), seoTitle: `${c.title} | BrasQ`, seoDescription: c.intro,
      testedCount: c.ids.length, testWeeks: c.weeks, topPick: item(c.ids[0]).name,
      catSlug: c.cat, authorKey: c.author,
      publishedAt: day(c.published), createdAt: day(c.published), updatedAt: day(c.updated),
    })),
    ...EXPLAINERS.map((x) => ({
      type: 'informational' as const, slug: x.slug, title: x.title, excerpt: x.excerpt, html: informationalHtml(x), css: '',
      coverImage: libPhoto(x.photo), seoTitle: `${x.title} | BrasQ`, seoDescription: x.excerpt,
      testedCount: null, testWeeks: null, topPick: null,
      catSlug: x.cat, authorKey: x.author,
      publishedAt: day(x.published), createdAt: day(x.published), updatedAt: day(x.updated),
    })),
    batteryInfoRow(),
  ];
}

import { prisma, type Prisma } from '../../db.js';
import type { Builtin } from './builtins.js';

/**
 * Front-page section types. They load live data (latest posts, categories, testers) when the page is rendered,
 * which is why the front page is rendered on request instead of being stored as HTML.
 */
const TYPE_LABEL: Record<string, string> = { guide: 'Buying guide', review: 'Review', comparison: 'Comparison', informational: 'Explained', page: 'Page' };
const PREFIX: Record<string, string> = { guide: '/guide/', review: '/review/', comparison: '/compare/', informational: '/explained/' };
const url = (p: { type: string; slug: string }) => (PREFIX[p.type] ?? '/') + p.slug;
const longDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const published = { status: 'published' as const };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type PostWithRefs = Prisma.PostGetPayload<{ include: { category: true; author: true } }>;
const card = (p: PostWithRefs) => ({
  url: url(p), title: p.title, excerpt: p.excerpt, image: p.coverImage ?? '', typeLabel: TYPE_LABEL[p.type] ?? p.type,
  category: p.category?.name ?? '', tested: p.testedCount ?? '', meta: `${p.author ? `By ${p.author.name} · ` : ''}${longDate(p.updatedAt)}`,
});

const TYPE_TOGGLES: [string, string][] = [['guides', 'guide'], ['reviews', 'review'], ['comparisons', 'comparison'], ['explainers', 'informational']];

export const HOME_BUILTINS: Builtin[] = [
  {
    key: 'home-hero', name: 'Hero', group: 'Front page', version: 1, scope: 'home',
    description: 'Big feature at the top: the newest guide marked “Home page hero”, or a post you pick.',
    fields: [
      { key: 'source', label: 'Show', type: 'select', options: ['Newest featured guide', 'A post I pick'], default: 'Newest featured guide' },
      { key: 'post', label: 'Post', type: 'post', help: 'Used when “A post I pick” is selected.' },
      { key: 'buttonText', label: 'Button text', type: 'text', default: 'Read the buying guide' },
      { key: 'showReview', label: 'Show the top pick’s review button', type: 'toggle', default: true },
    ],
    load: async (d) => {
      const include = { category: true, author: true } as const;
      const picked = d.source === 'A post I pick' && d.post ? await prisma.post.findFirst({ where: { id: (d.post as { id: string }).id, ...published }, include }) : null;
      const p = picked ?? await prisma.post.findFirst({ where: { ...published, type: 'guide', featured: true }, include, orderBy: { updatedAt: 'desc' } });
      d.hero = p ? {
        ...card(p), catUrl: p.category ? `/category/${p.category.slug}` : '', tag: `${TYPE_LABEL[p.type] ?? p.type}${p.category ? ` · ${p.category.name}` : ''}`,
        author: p.author ? { name: p.author.name, url: `/author/${p.author.slug}`, avatar: p.author.avatarUrl ?? '', role: p.author.role.toLowerCase() } : null,
        updated: longDate(p.updatedAt), topPick: p.topPick ?? '', reviewUrl: p.topPick ? `/review/${slugify(p.topPick)}` : '',
      } : null;
    },
    template: `{{#hero}}<section class="bq-container bq-hero">
  <div class="bq-hero__text">
    {{#catUrl}}<a href="{{catUrl}}" class="bq-tag">{{tag}}</a>{{/catUrl}}
    <h1 class="bq-h1 bq-hero__title"><a href="{{url}}">{{title}}</a></h1>
    <p class="bq-lead" style="font-size:18px">{{excerpt}}</p>
    {{#author}}<div class="bq-hero__byline"><div class="bq-avatar">{{#avatar}}<img src="{{avatar}}" alt="{{name}}">{{/avatar}}</div><div><a href="{{url}}">{{name}}</a>,&nbsp;{{role}}<br>Updated&nbsp;{{updated}}</div></div>{{/author}}
    <div class="bq-row"><a href="{{url}}" class="bq-btn bq-btn--dark">{{buttonText}}</a>{{#showReview}}{{#topPick}}<a href="{{reviewUrl}}" class="bq-btn bq-btn--outline">{{topPick}} review</a>{{/topPick}}{{/showReview}}</div>
  </div>
  <a href="{{url}}" style="display:block"><div class="bq-photo bq-photo--43">{{#image}}<img src="{{image}}" alt="{{title}}">{{/image}}{{#tested}}<div class="bq-hero__count"><span>Tested</span><strong>{{tested}}</strong></div>{{/tested}}</div></a>
</section>{{/hero}}`,
    sample: { source: 'Newest featured guide', buttonText: 'Read the buying guide', showReview: true },
  },
  {
    key: 'home-facts', name: 'Facts bar', group: 'Front page', version: 1, scope: 'home',
    description: 'Band with three or four big numbers.',
    fields: [
      { key: 'style', label: 'Style', type: 'select', options: ['Dark', 'Light'], default: 'Dark' },
      { key: 'items', label: 'Facts', type: 'list', itemLabel: '{{value}} {{label}}', fields: [{ key: 'value', label: 'Number', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }] },
    ],
    prepare: (d) => { d.dark = d.style !== 'Light'; },
    template: `{{#dark}}<section class="bq-band-dark"><div class="bq-container bq-facts">{{#items}}<div><strong>{{value}}</strong><span>{{label}}</span></div>{{/items}}</div></section>{{/dark}}{{^dark}}<section class="bq-container"><div class="bq-facts bq-facts--light">{{#items}}<div><strong>{{value}}</strong><span>{{label}}</span></div>{{/items}}</div></section>{{/dark}}`,
    sample: { style: 'Dark', items: [{ value: '1,240', label: 'products tested since 2019' }, { value: '5', label: 'staff testers and editors, all named' }, { value: '0', label: 'paid placements in our guides' }, { value: '4× a year', label: 'we re-check every buying guide' }] },
  },
  {
    key: 'home-posts', name: 'Post grid', group: 'Front page', version: 1, scope: 'home',
    description: 'Cards for the latest posts, posts you pick, or the newest posts in one category.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Latest buying guides' },
      { key: 'linkText', label: 'Link text', type: 'text', default: 'All buying guides →' },
      { key: 'linkUrl', label: 'Link', type: 'link', default: '/search' },
      { key: 'source', label: 'Posts', type: 'select', options: ['Latest', 'Hand-picked', 'Category'], default: 'Latest' },
      { key: 'guides', label: 'Include buying guides', type: 'toggle', default: true },
      { key: 'reviews', label: 'Include reviews', type: 'toggle', default: false },
      { key: 'comparisons', label: 'Include comparisons', type: 'toggle', default: false },
      { key: 'explainers', label: 'Include info posts', type: 'toggle', default: false },
      { key: 'category', label: 'Category slug', type: 'text', placeholder: 'cleaning', help: 'Used when Posts is “Category”.' },
      { key: 'count', label: 'Number of posts', type: 'number', default: '6' },
      { key: 'skipHero', label: 'Leave out the post shown in the hero', type: 'toggle', default: true },
      { key: 'posts', label: 'Hand-picked posts', type: 'list', itemLabel: 'Post {{@number}}', help: 'Used when Posts is “Hand-picked”.', fields: [{ key: 'post', label: 'Post', type: 'post' }] },
    ],
    load: async (d) => {
      const include = { category: true, author: true } as const;
      const take = Math.min(24, Math.max(1, parseInt(String(d.count), 10) || 6));
      let rows: PostWithRefs[];
      if (d.source === 'Hand-picked') {
        const ids = ((d.posts as { post: { id: string } | null }[]) ?? []).map((x) => x.post?.id).filter(Boolean) as string[];
        const found = await prisma.post.findMany({ where: { id: { in: ids }, ...published }, include });
        rows = ids.map((id) => found.find((p) => p.id === id)).filter(Boolean) as PostWithRefs[];
      } else {
        const types = TYPE_TOGGLES.filter(([k]) => d[k] === true).map(([, t]) => t) as Prisma.PostWhereInput['type'][];
        const where: Prisma.PostWhereInput = { ...published, type: { in: (types.length ? types : ['guide']) as never } };
        if (d.source === 'Category' && d.category) where.category = { slug: String(d.category) };
        if (d.skipHero) where.featured = false;
        rows = await prisma.post.findMany({ where, include, orderBy: { publishedAt: 'desc' }, take });
      }
      d.cards = rows.map(card);
    },
    template: `<section class="bq-container bq-block">
  <div class="bq-section-head"><h2 class="bq-h2">{{heading}}</h2>{{#linkUrl}}<a href="{{linkUrl}}" class="bq-link-strong">{{linkText}}</a>{{/linkUrl}}</div>
  <div class="bq-cards">{{#cards}}<a href="{{url}}" class="bq-gcard"><div class="bq-photo bq-photo--32">{{#image}}<img src="{{image}}" alt="{{title}}" loading="lazy">{{/image}}{{#tested}}<span class="bq-photo-badge">{{tested}}&nbsp;tested</span>{{/tested}}</div><div class="bq-eyebrow">{{#category}}{{category}}{{/category}}{{^category}}{{typeLabel}}{{/category}}</div><div class="bq-gcard__title">{{title}}</div><div class="bq-gcard__meta">{{meta}}</div></a>{{/cards}}</div>
</section>`,
    sample: { heading: 'Latest buying guides', linkText: 'All buying guides →', linkUrl: '/search', source: 'Latest', guides: true, count: '3', skipHero: true },
  },
  {
    key: 'home-categories', name: 'Categories', group: 'Front page', version: 1, scope: 'home',
    description: 'All categories as buttons, with their number of guides.',
    fields: [{ key: 'heading', label: 'Heading', type: 'text', default: 'Categories' }],
    load: async (d) => {
      const cats = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { posts: { where: { ...published, type: 'guide' } } } } } });
      d.cats = cats.map((c) => ({ name: c.name, url: `/category/${c.slug}`, count: `${c._count.posts} ${c._count.posts === 1 ? 'guide' : 'guides'}` }));
    },
    template: `<section class="bq-container" style="padding-bottom:52px;display:flex;flex-direction:column;gap:20px"><h2 class="bq-h2 bq-h2--rule">{{heading}}</h2><div class="bq-catgrid">{{#cats}}<a href="{{url}}">{{name}}<span>{{count}}</span></a>{{/cats}}</div></section>`,
    sample: { heading: 'Categories' },
  },
  {
    key: 'home-howtest', name: 'How we test band', group: 'Front page', version: 1, scope: 'home',
    description: 'Yellow band with a heading, text, a button and numbered steps.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', default: 'How we test' },
      { key: 'heading', label: 'Heading', type: 'text', default: 'Tested in an ordinary American home' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'buttonText', label: 'Button text', type: 'text', default: 'Read our test method' },
      { key: 'buttonUrl', label: 'Button link', type: 'link', default: '/how-we-test' },
      { key: 'steps', label: 'Steps', type: 'list', itemLabel: '{{title}}', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'text' }] },
    ],
    template: `<section class="bq-band-yellow"><div class="bq-container bq-block" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:36px">
  <div style="display:flex;flex-direction:column;gap:16px"><span class="bq-eyebrow bq-eyebrow--ink">{{eyebrow}}</span><h2 class="bq-h2" style="font-size:clamp(30px,4vw,40px);line-height:1;letter-spacing:-0.035em">{{heading}}</h2><p style="font-size:17px;line-height:1.6;margin:0">{{text}}</p>{{#buttonUrl}}<a href="{{buttonUrl}}" class="bq-btn bq-btn--dark" style="align-self:flex-start">{{buttonText}}</a>{{/buttonUrl}}</div>
  <ol class="bq-steps">{{#steps}}<li><span>{{@n}}</span><span><strong>{{title}}</strong>{{text}}</span></li>{{/steps}}</ol>
</div></section>`,
    sample: {
      eyebrow: 'How we test', heading: 'Tested in an ordinary American home', buttonText: 'Read our test method', buttonUrl: '/how-we-test',
      text: 'No lab, just a house in Columbus, Ohio, with hardwood floors, shag carpet, a staircase and a cat. We buy most products ourselves, use them for weeks and publish our measurements.',
      steps: [{ title: 'We buy it ourselves', text: 'We buy most products in stores, just like you.' }, { title: 'We use it for weeks', text: 'Every product becomes part of daily life in our test house.' }, { title: 'We measure', text: 'Fixed test protocols per category, so results are comparable.' }, { title: 'We keep testing', text: 'We keep using our picks longer to spot wear and failures.' }],
    },
  },
  {
    key: 'home-testers', name: 'Testers', group: 'Front page', version: 1, scope: 'home',
    description: 'The authors marked “Show on home”, with photo, role and short bio.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'Our testers' },
      { key: 'linkText', label: 'Link text', type: 'text', default: 'Full editorial team →' },
      { key: 'linkUrl', label: 'Link', type: 'link', default: '/team' },
    ],
    load: async (d) => {
      const authors = await prisma.author.findMany({ where: { showOnHome: true }, orderBy: { sortOrder: 'asc' } });
      d.testers = authors.map((a) => ({ name: a.name, url: `/author/${a.slug}`, avatar: a.avatarUrl ?? '', role: a.role, short: a.short }));
    },
    template: `<section class="bq-container bq-block" style="gap:24px"><div class="bq-section-head"><h2 class="bq-h2">{{heading}}</h2>{{#linkUrl}}<a href="{{linkUrl}}" class="bq-link-strong">{{linkText}}</a>{{/linkUrl}}</div><div class="bq-testers">{{#testers}}<a href="{{url}}" class="bq-tester"><div class="bq-avatar" style="width:72px;height:72px">{{#avatar}}<img src="{{avatar}}" alt="{{name}}" loading="lazy">{{/avatar}}</div><div><strong>{{name}}</strong><span class="bq-role">{{role}}</span><span>{{short}}</span></div></a>{{/testers}}</div></section>`,
    sample: { heading: 'Our testers', linkText: 'Full editorial team →', linkUrl: '/team' },
  },
  {
    key: 'home-newsletter', name: 'Newsletter band', group: 'Front page', version: 1, scope: 'home',
    description: 'Dark signup band. Addresses go to Subscribers.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', default: 'One email a week with our latest test results' },
      { key: 'text', label: 'Text', type: 'text', default: 'Plus deals we’ve checked ourselves. Unsubscribe anytime.' },
      { key: 'button', label: 'Button text', type: 'text', default: 'Subscribe' },
    ],
    template: `<section class="bq-container" style="padding-bottom:60px"><div class="bq-newsband"><div style="display:flex;flex-direction:column;gap:6px;max-width:520px"><h2>{{heading}}</h2><p>{{text}}</p></div><form class="bq-form" data-bq-subscribe data-source="home"><input type="email" name="email" aria-label="Email address" placeholder="you@email.com" required><button type="submit">{{button}}</button></form></div></section>`,
    sample: { heading: 'One email a week with our latest test results', text: 'Plus deals we’ve checked ourselves. Unsubscribe anytime.', button: 'Subscribe' },
  },
];

/** The front page as it was hard-coded before sections: used to start the front-page editor. */
export const DEFAULT_HOME = {
  layout: 'raw' as const,
  items: [
    { type: 'home-hero', data: { source: 'Newest featured guide', buttonText: 'Read the buying guide', showReview: true } },
    { type: 'home-facts', data: HOME_BUILTINS[1].sample },
    { type: 'home-posts', data: { ...HOME_BUILTINS[2].sample, count: '6' } },
    { type: 'home-categories', data: { heading: 'Categories' } },
    { type: 'home-howtest', data: HOME_BUILTINS[4].sample },
    { type: 'home-testers', data: HOME_BUILTINS[5].sample },
    { type: 'home-newsletter', data: HOME_BUILTINS[6].sample },
  ].map((s, i) => ({ id: `home-${i + 1}`, ...s })),
};

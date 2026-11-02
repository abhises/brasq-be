import { parse, type HTMLElement } from 'node-html-parser';
import type { SectionsDoc } from './render.js';

/**
 * Turns a post's hand-written / generated HTML into sections. Blocks with a matching built-in section type become
 * real form sections (header, short answer, picks, text, table, stats, FAQ, author box, sources); everything else is
 * kept exactly as it is in a Custom HTML section, so the page looks the same.
 */
type Item = SectionsDoc['items'][number];
export type ConvertProduct = { id: string; name: string; score: string; image: string; summary: string; url: string; shopUrl: string; shopName: string };
export type ConvertContext = {
  post: { title: string; excerpt: string; coverImage: string | null; authorBio?: string };
  /** catalog products by review URL (/review/<slug>) */
  products: Map<string, ConvertProduct>;
};

let seq = 0;
const id = () => `c${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const els = (el: HTMLElement) => el.childNodes.filter((n): n is HTMLElement => (n as HTMLElement).tagName !== undefined);
const has = (el: HTMLElement, cls: string) => el.classList?.contains(cls);
const txt = (el: HTMLElement | null | undefined) => (el?.text ?? '').replace(/\s+/g, ' ').trim();
const inner = (el: HTMLElement | null | undefined) => (el?.innerHTML ?? '').trim();
const isTag = (el: HTMLElement, tag: string) => el.tagName?.toLowerCase() === tag;
const custom = (el: HTMLElement | string, tocTitle = '', placement?: Item['placement']): Item =>

  ({ id: id(), type: 'custom-html', data: { html: typeof el === 'string' ? el : el.outerHTML, tocTitle }, ...(placement ? { placement } : {}) });

/** Only these children, in any order/count. */
const only = (el: HTMLElement, ok: (c: HTMLElement) => boolean) => els(el).every(ok);

function header(crumbs: HTMLElement | undefined, top: HTMLElement, ctx: ConvertContext): Item | null {
  const head = top.querySelector('header.bq-guide-head');
  const photo = els(top).find((c) => has(c, 'bq-guide-hero') && has(c, 'bq-photo'));
  if (!crumbs || !head || !photo || els(top).length !== 2) return null;
  const parts = els(head);
  const tag = parts[0], h1 = head.querySelector('h1.bq-h1'), lead = head.querySelector('p.bq-lead'), meta = head.querySelector('.bq-meta');
  if (!tag || !has(tag, 'bq-tag') || !h1 || txt(h1) !== ctx.post.title || !meta) return null;
  if (!parts.every((c) => c === tag || c === h1 || c === lead || c === meta || has(c, 'bq-disclosure') || has(c, 'bq-disclosure-row'))) return null;
  const metaDivs = els(meta);
  const author = metaDivs.find((d) => has(d, 'bq-meta__author'));
  const bylineEl = author ? els(author)[1] : null;
  const byline = bylineEl ? txt(bylineEl).replace(txt(bylineEl.querySelector('a')), '').trim() : '';
  const extra = metaDivs.find((d) => !has(d, 'bq-meta__author') && !/^(Reviewed by|Updated)/.test(txt(d)));
  const crumbLinks = crumbs.querySelectorAll('a');
  const parent = crumbLinks.length >= 3 ? crumbLinks[crumbLinks.length - 1] : null;
  const img = photo.querySelector('img')?.getAttribute('src') ?? '';
  return {
    id: id(), type: 'post-header', data: {
      style: 'Guide', tag: txt(tag), crumb: txt(crumbs.querySelector('span:last-child')), byline: byline || 'Written by',
      lead: txt(lead) === ctx.post.excerpt ? '' : txt(lead),
      parentName: parent ? txt(parent) : '', parentUrl: parent?.getAttribute('href') ?? '',
      extraLabel: extra ? txt(extra).replace(txt(extra.querySelector('strong')), '').trim() : '',
      extraValue: extra ? txt(extra.querySelector('strong')) : '',
      showReviewer: metaDivs.some((d) => /^Reviewed by/.test(txt(d))),
      copyLink: !!head.querySelector('[data-bq-copy]'),
      image: img === ctx.post.coverImage ? '' : img, caption: '',
    },
  };
}

function summary(el: HTMLElement): Item | null {
  const h2 = el.querySelector('h2'), ol = el.querySelector('ol');
  if (!h2 || !ol || !only(el, (c) => c === h2 || c === ol)) return null;
  const items = els(ol).map((li) => ({ text: inner(li.querySelector('span') ?? li) }));
  return { id: id(), type: 'short-answer', data: { heading: txt(h2), items } };
}

function faq(el: HTMLElement): Item | null {
  const h2 = el.querySelector('h2');
  const ds = els(el).filter((c) => isTag(c, 'details'));
  if (!h2 || !only(el, (c) => c === h2 || isTag(c, 'details'))) return null;
  return { id: id(), type: 'faq', data: { heading: txt(h2), items: ds.map((d) => ({ q: txt(d.querySelector('summary')), a: els(d).filter((c) => !isTag(c, 'summary')).map((c) => (isTag(c, 'p') ? inner(c) : c.outerHTML)).join('\n\n') })) } };
}

function picks(el: HTMLElement, ctx: ConvertContext): Item | null {
  const h2 = els(el)[0];
  const cards = els(el).filter((c) => has(c, 'bq-pick'));
  const note = els(el).find((c) => has(c, 'bq-note'));
  if (!h2 || !isTag(h2, 'h2') || !cards.length || !only(el, (c) => c === h2 || c === note || has(c, 'bq-pick'))) return null;
  const out = [];
  let linkText = '';
  for (const card of cards) {
    const body = card.querySelector('.bq-pick__body');
    if (!body) return null;
    const nameEl = body.querySelector('.bq-pick__name');
    const shop = body.querySelector('a.bq-shop');
    const review = body.querySelector('a.bq-link-strong');
    if (review) linkText = txt(review);
    const reviewUrl = nameEl?.querySelector('a')?.getAttribute('href') ?? card.querySelector('a.bq-pick__media')?.getAttribute('href') ?? '';
    const v = {
      label: txt(body.querySelector('.bq-tag')), name: txt(nameEl), score: txt(body.querySelector('.bq-score strong')),
      text: inner(body.querySelector('.bq-pick__text')), image: card.querySelector('.bq-pick__media img')?.getAttribute('src') ?? '',
      shopName: shop ? txt(shop).replace(/^Check price (on|at)\s+/i, '') : '', shopUrl: shop?.getAttribute('href') ?? '', reviewUrl,
    };
    if (body.querySelectorAll('a.bq-shop').length > 1) return null; // several shops: keep as HTML
    const p = ctx.products.get(reviewUrl);
    // values that match the catalog are left empty, so the catalog stays the single source
    out.push(p ? {
      label: v.label, product: p.id,
      name: v.name === p.name ? '' : v.name, score: v.score === p.score ? '' : v.score, text: v.text === p.summary ? '' : v.text,
      image: v.image === p.image ? '' : v.image, shopName: v.shopName === p.shopName ? '' : v.shopName,
      shopUrl: v.shopUrl === p.shopUrl ? '' : v.shopUrl, reviewUrl: v.reviewUrl === p.url ? '' : v.reviewUrl,
    } : v);
  }
  return { id: id(), type: 'picks', data: { heading: txt(h2), picks: out, note: txt(note), reviewLinkText: linkText } };
}

function textSection(el: HTMLElement): Item | null {
  const kids = els(el);
  const h2 = kids[0];
  if (!h2 || !isTag(h2, 'h2') || !has(h2, 'bq-h2') || [...h2.classList.values()].length > 1) return null;
  const rest = kids.slice(1);
  const paras = rest.filter((c) => isTag(c, 'p') && has(c, 'bq-p'));
  const photo = rest.find((c) => has(c, 'bq-photo') && has(c, 'bq-photo--169'));
  const caption = rest.find((c) => isTag(c, 'p') && has(c, 'bq-caption'));
  if (!paras.length || !rest.every((c) => paras.includes(c) || c === photo || c === caption)) return null;
  if (photo && rest.indexOf(photo) < rest.indexOf(paras[paras.length - 1])) return null;
  return { id: id(), type: 'text', data: { heading: txt(h2), body: paras.map(inner).join('\n\n'), image: photo?.querySelector('img')?.getAttribute('src') ?? '', caption: txt(caption) } };
}

function table(el: HTMLElement): Item | null {
  const kids = els(el);
  const h2 = kids[0], wrap = kids[1], note = kids[2];
  if (!h2 || !isTag(h2, 'h2') || !wrap || !has(wrap, 'bq-table-wrap') || kids.length > 3 || (note && !has(note, 'bq-note'))) return null;
  const t = wrap.querySelector('table.bq-table');
  if (!t) return null;
  const cell = (c: HTMLElement) => (c.childNodes.some((n) => n.nodeType === 1) ? null : txt(c));
  const head = t.querySelectorAll('thead th').map(cell);
  const rows = t.querySelectorAll('tbody tr').map((r) => r.querySelectorAll('td').map(cell));
  const all = [...head, ...rows.flat()];
  if (all.some((c) => c === null || c.includes('|') || /\*$/.test(c))) return null;
  return { id: id(), type: 'table', data: { heading: txt(h2), intro: '', head: head.join(' | '), rows: rows.map((r) => ({ cells: r.join(' | ') })), note: txt(note), mono: has(t, 'bq-table--mono') } };
}

function sources(el: HTMLElement): Item | null {
  const cols = els(el);
  if (cols.length !== 2) return null;
  const src = cols[0].querySelectorAll('ul li').map((li) => ({ text: txt(li) }));
  const changes = cols[1].querySelectorAll('ul.bq-changelog li').map((li) => ({ date: txt(li.querySelector('time')), text: txt(li.querySelector('span')) }));
  if (!/Sources/i.test(txt(cols[0].querySelector('strong'))) || !changes.length) return null;
  return { id: id(), type: 'sources', data: { style: 'Two columns', sources: src, changes } };
}

function authorBox(el: HTMLElement, ctx: ConvertContext, look: 'Box' | 'Plain'): Item | null {
  const p = el.querySelector('p');
  const label = look === 'Box' ? txt(el.querySelector('.bq-eyebrow')) : txt(el.querySelector('.bq-eyebrow'));
  const bio = inner(p);
  return { id: id(), type: 'author-box', data: { style: look, label: label || 'About the author', customBio: ctx.post.authorBio && txt(p) === ctx.post.authorBio.trim() ? '' : bio } };
}

function stats(el: HTMLElement): Item | null {
  const items = els(el).map((d) => ({ value: inner(d.querySelector('strong')).replace(/&nbsp;/g, ' '), label: txt(d.querySelector('span')) }));
  return items.every((i) => i.value) ? { id: id(), type: 'stats', data: { items } } : null;
}

function history(dated: HTMLElement | null, plain: HTMLElement | null): Item {
  return { id: id(), type: 'sources', data: {
    style: 'List',
    changes: dated ? dated.querySelectorAll('li').map((li) => ({ date: txt(li.querySelector('time')), text: txt(li.querySelector('span')) })) : [],
    sources: plain ? plain.querySelectorAll('li').map((li) => ({ text: txt(li) })) : [],
  } };
}

function body(el: HTMLElement, ctx: ConvertContext, toc: Map<string, string>): Item {
  const tocTitle = toc.get(el.id) ?? '';
  const tryIt = (): Item | null => {
    if (has(el, 'bq-summary')) return summary(el);
    if (has(el, 'bq-faq')) return faq(el);
    if (has(el, 'bq-sources')) return sources(el);
    if (has(el, 'bq-authorbox')) return authorBox(el, ctx, 'Box');
    if (has(el, 'bq-about')) return authorBox(el, ctx, 'Plain');
    if (has(el, 'bq-stats')) return stats(el);
    if (isTag(el, 'section') && has(el, 'bq-section') && [...el.classList.values()].length === 1 && !el.getAttribute('style')) {
      if (el.querySelector('.bq-pick')) return picks(el, ctx);
      if (el.querySelector('table')) return table(el);
      return textSection(el);
    }
    return null;
  };
  const item = tryIt();
  if (!item) return custom(el, tocTitle);
  // keep the original table-of-contents name for sections whose heading differs
  return item;
}

export function convertHtml(html: string, ctx: ConvertContext): SectionsDoc | null {
  const art = parse(html).querySelector('article.bq-article');
  if (!art) return null;
  const className = [...art.classList.values()].filter((c) => c !== 'bq-article').join(' ') || undefined;
  const kids = els(art);
  const layout = kids.find((c) => has(c, 'bq-layout'));
  const items: Item[] = [];

  const before = layout ? kids.slice(0, kids.indexOf(layout)) : kids.slice(0, 2);
  const crumbs = before.find((c) => has(c, 'bq-crumbs'));
  const top = before.find((c) => has(c, 'bq-guide-top'));
  const h = before.length === 2 && crumbs && top ? header(crumbs, top, ctx) : null;
  if (h) items.push(h);
  else if (before.length) items.push(custom(before.map((c) => c.outerHTML).join('\n'), '', 'top'));

  if (layout) {
    const toc = new Map(layout.querySelectorAll('aside.bq-toc a')
      .filter((a) => !a.classList.contains('bq-toc__top') && (a.getAttribute('href') ?? '').length > 1)
      .map((a) => [(a.getAttribute('href') ?? '').replace(/^#/, ''), txt(a)] as [string, string]));
    const content = els(layout).find((c) => has(c, 'bq-content'));
    if (!content) return null;
    const blocks = els(content).filter((c) => !has(c, 'bq-toc-mobile'));
    const label = (item: Item, ...ids: string[]) => {
      if (item.type === 'custom-html') return item;
      const hit = ids.find((x) => toc.has(x));
      return { ...item, tocLabel: hit ? toc.get(hit)! : '' };
    };
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (has(b, 'bq-history')) { // dated history + sources list -> one Sources section
        const dated = has(b, 'bq-history--dated') ? b : null;
        const next = blocks[i + 1];
        const plain = dated && next && has(next, 'bq-history') && !has(next, 'bq-history--dated') ? next : (!dated ? b : null);
        if (dated && plain) i++;
        items.push(label(history(dated, plain), dated?.id ?? '', plain?.id ?? ''));
        continue;
      }
      items.push(label(body(b, ctx, toc), b.id));
    }
    const after = kids.slice(kids.indexOf(layout) + 1);
    for (const a of after) items.push(custom(a, '', 'bottom'));
  } else {
    for (const b of kids.slice(before.length)) items.push(custom(b));
  }
  const tocTitle = layout ? txt(layout.querySelector('aside.bq-toc .bq-toc__title')) : '';
  return {
    layout: layout ? 'toc' : 'wide', ...(className ? { className } : {}),
    ...(tocTitle ? { tocTitle, backToTop: !!layout?.querySelector('aside.bq-toc .bq-toc__top') } : {}), items,
  };
}

/** Visible text of the article body without whitespace, for checking that a conversion kept every character. */
export function bodyText(html: string) {
  const root = parse(html);
  root.querySelectorAll('aside.bq-toc, details.bq-toc-mobile, script, style').forEach((n) => n.remove());
  // whitespace between elements depends on how the HTML was formatted, not on what readers see
  return root.text.replace(/\s+/g, '');
}

/*
 * Info post: "How long does a cordless vacuum battery last?" — the reference design for the informational post type.
 * Hand-written HTML (rather than generated) so it doubles as a copy-paste example of every info-post component.
 */
import { authors, G } from './data.js';
import { amazon, authorPhoto, authorUrl, esc, guidePhoto, libPhoto, productPhoto, products, usd } from './templates.js';

const VS = products['vorta-s9'], NW = products['northwind-x2'], KA = products['kleen-air-300'];
const stickGuide = (G as any[]).find((g) => g.id === 'stick-vacuums');
const pct = (battery: number, vacuum: number) => Math.round((battery / vacuum) * 100) + '%';

export const BATTERY_SLUG = 'how-long-does-a-cordless-vacuum-battery-last';

const TOC: [string, string][] = [
  ['The short answer', 'i-summary'], ['Why batteries lose runtime', 'i-why'], ['Battery specs explained', 'i-specs'],
  ['What we measured', 'i-measured'], ['Estimate your battery life', 'i-estimate'], ['Signs of a worn battery', 'i-signs'],
  ['Test your own battery', 'i-test'], ['Make it last longer', 'i-longer'], ['Battery myths', 'i-myths'],
  ['Replace or buy new?', 'i-replace'], ['How to replace it', 'i-howto'], ['Original or third-party', 'i-thirdparty'],
  ['Swappable models', 'i-swappable'], ['Storage and recycling', 'i-storage'], ['FAQ', 'i-faq'],
];
const tocLinks = TOC.map(([l, id]) => `<a href="#${id}">${esc(l)}</a>`).join('\n    ');

const FAQ: [string, string][] = [
  ['How many years does a cordless vacuum battery last?', 'Three to five years for most households that vacuum three or four times a week. Daily use in a large home, especially on max mode, can wear a battery out in one to two years.'],
  ['How many charge cycles does a vacuum battery last?', 'In our test, 560 to 780 full cycles before runtime dropped below 70% of new. Most manufacturers rate their batteries for 500 to 800 cycles.'],
  ['Can I leave my vacuum on the charger all the time?', 'Yes. Every vacuum we tested stops charging at 100%. Only for storage of a month or longer is it better to take it off the dock at about half charge.'],
  ['Is a battery covered by the warranty?', 'Usually for one or two years, often shorter than the warranty on the motor. Check the manual: some brands only cover a battery that has lost more than 30% of its capacity.'],
  ['Are third-party batteries safe?', 'Most are, but quality varies. Buy one with a UL or ETL mark on the battery itself and at least a one-year warranty, and stop using any battery that gets hot or swells.'],
  ['Why does my vacuum stop even though the battery shows charge?', 'Worn cells can’t hold their voltage under load, so the vacuum cuts out to protect them. It’s a typical sign of an aging battery, and of cells that are no longer balanced.'],
  ['Does a bigger battery mean a longer life?', 'Not by itself, but a bigger battery goes through fewer full cycles for the same amount of cleaning, so in practice it often lasts longer.'],
  ['How do I recycle an old battery?', 'Take it to a hardware store, home improvement chain or electronics retailer; most accept them for free. Tape over the contacts first and never put it in the trash or curbside bin.'],
];

const a = authors.sarah;

export function batteryInfoHtml() {
  const prow = (eyebrow: string, p: typeof VS, text: string) => `      <div class="bq-prow">
        <a class="bq-photo" href="/review/${p.id}"><img src="${esc(productPhoto(p))}" alt="${esc(p.name)}" loading="lazy"></a>
        <div class="bq-prow__body"><span class="bq-eyebrow">${esc(eyebrow)}</span><a class="bq-prow__name" href="/review/${p.id}">${esc(p.name)}</a><p>${esc(text)}</p></div>
        <a class="bq-btn bq-btn--black" href="${esc(amazon(p.name))}" rel="sponsored nofollow" target="_blank">${usd(p.price)} from Amazon</a>
      </div>`;

  return `<article class="bq-article bq-infopost">
<nav class="bq-crumbs"><a href="/">Home</a><a href="/category/cleaning">Cleaning</a><a href="/guide/stick-vacuums">Stick vacuums</a><span>Battery life</span></nav>
<div class="bq-guide-top">
  <header class="bq-guide-head">
    <div class="bq-tagline"><span class="bq-tag bq-tag--dark">Explained</span><span>19 min read</span></div>
    <h1 class="bq-h1">How long does a cordless vacuum battery last?</h1>
    <p class="bq-lead">Three to five years for most people. We ran three stick vacuums through 800 charge cycles to see how fast runtime drops, and what you can do to slow it down.</p>
    <div class="bq-meta">
      <div class="bq-meta__author"><div class="bq-avatar"><img src="${esc(authorPhoto('sarah'))}" alt="${esc(a.name)}" loading="lazy"></div><div>Written by<br><a href="${authorUrl('sarah')}">${esc(a.name)}</a></div></div>
      <div>Reviewed by<br><a href="${authorUrl('ryan')}">Ryan Mitchell</a>, editor-in-chief</div>
      <div>Updated<br><strong>October&nbsp;14,&nbsp;2026</strong></div>
      <div>Based on<br><strong>14 months of testing</strong></div>
    </div>
    <div class="bq-disclosure-row">
      <p class="bq-disclosure">We choose products independently. We may earn a commission through links on this page; your price stays the same. <a href="/how-we-make-money">Affiliate policy</a></p>
      <button type="button" class="bq-btn-outline-sm" data-bq-copy>Copy link</button>
    </div>
  </header>
  <figure class="bq-hero-fig">
    <div class="bq-photo"><img src="${esc(libPhoto('V3'))}" alt="Stick vacuum batteries on the charging rack in our test house" loading="lazy"></div>
    <figcaption>Our charging rack in the Columbus test house. Each battery ran a full cycle every 2.5 hours for 14 months.</figcaption>
  </figure>
</div>
<div class="bq-layout">
  <aside class="bq-toc" data-bq-spy>
    <div class="bq-toc__title">In this article</div>
    ${tocLinks}
    <a class="bq-toc__top" href="#">Back to top ↑</a>
  </aside>
  <div class="bq-content">
<details class="bq-toc-mobile"><summary>In this article</summary><nav>${TOC.map(([l, id]) => `<a href="#${id}">${esc(l)}</a>`).join('')}</nav></details>

<section id="i-summary" class="bq-summary">
  <h2 class="bq-h2 bq-h2--sm">The short answer</h2>
  <ol>
    <li><span>A cordless vacuum battery lasts three to five years with normal use, or roughly 500 to 800 charge cycles.</span></li>
    <li><span>Runtime drops slowly. After 500 cycles our test models still ran about 75% as long as when new.</span></li>
    <li><span>Heat is the biggest enemy. Charge and store the vacuum indoors, away from radiators and direct sun.</span></li>
    <li><span>Above $400 you mainly pay for a display, extra attachments and a second battery. Suction barely improves.</span></li>
    <li><span>Choose a model with a battery you can replace yourself. The battery lasts three to five years; the rest of the vacuum often lasts much longer.</span></li>
  </ol>
</section>

<div class="bq-stats">
  <div><strong>800</strong><span>charge cycles per vacuum in our test</span></div>
  <div><strong>14&nbsp;mo</strong><span>of continuous testing</span></div>
  <div><strong>75%</strong><span>runtime left after 500 cycles</span></div>
  <div><strong>$59–119</strong><span>for a new original battery</span></div>
</div>

<section id="i-why" class="bq-section">
  <h2 class="bq-h2">Why cordless vacuum batteries lose runtime</h2>
  <p class="bq-p">Every cordless vacuum on the market runs on lithium-ion cells, the same basic chemistry as the battery in your phone or laptop. Inside the battery pack of a typical stick vacuum sit six to eight cylindrical cells, wired together to produce between 21.6 and 29.6 volts. Each time you charge and drain those cells, a small amount of their capacity is lost for good. That loss is unavoidable, but how quickly it happens depends a lot on how you use and store the vacuum.</p>
  <p class="bq-p">The battery doesn’t die overnight. You notice it as a vacuum that used to do the whole house on one charge and now stops halfway up the stairs. Most manufacturers consider a battery worn out once it holds less than 70% of its original capacity, and that is also the threshold we use in this article.</p>
  <div class="bq-def"><span class="bq-eyebrow">Definition</span><p><strong>Charge cycle:</strong> one full cycle is using 100% of the battery’s capacity, in one go or spread over several sessions. Running the vacuum down to 50% twice and recharging each time counts as one cycle, not two.</p></div>
  <h3 class="bq-h3">Heat</h3>
  <p class="bq-p">Heat is the single biggest factor in battery aging. Above roughly 95°F, the chemical reactions that wear down the cells speed up noticeably. A vacuum generates heat while it runs, and charging adds more. That’s why charging a battery straight after a long session on max mode is harder on it than letting it cool for half an hour first. Storing the vacuum in a hot garage, a sunny utility room or next to a radiator has the same effect, even when you’re not using it.</p>
  <h3 class="bq-h3">Deep discharges</h3>
  <p class="bq-p">Running a lithium-ion battery all the way to empty puts extra stress on the cells. Vacuums protect against true zero with a cut-off circuit, but regularly running until the motor stops still wears the battery faster than recharging at 20 or 30%. In our test, the battery we drained to cut-off every cycle lost capacity about 15% faster than one we recharged at 20%.</p>
  <h3 class="bq-h3">High current</h3>
  <p class="bq-p">Max or boost mode draws about three times as much current as the standard setting. That drains the battery faster, so you go through more cycles, and it also heats the cells. If you use max mode for every clean, expect the battery to wear out about a year sooner than if you save it for rugs and stairs.</p>
  <h3 class="bq-h3">Time</h3>
  <p class="bq-p">Even a battery that’s never used ages. This is called calendar aging, and it’s mostly driven by temperature and charge level. A battery stored fully charged in a warm room loses about 4% of its capacity a year without being used at all. Stored at half charge at room temperature, that drops to about 2%.</p>
</section>

<section id="i-specs" class="bq-section">
  <h2 class="bq-h2">Battery specs explained</h2>
  <p class="bq-p">The spec sheet on a vacuum box usually lists three or four battery numbers. They tell you more about runtime than about lifespan, but they’re useful when you compare models or shop for a replacement.</p>
  <div class="bq-table-wrap"><table class="bq-table">
    <thead><tr><th>Spec</th><th>Typical range</th><th>What it tells you</th></tr></thead>
    <tbody>
      <tr><td>Voltage (V)</td><td class="bq-mono">18–29.6 V</td><td>Mostly determines power. Higher voltage lets the motor spin faster with less current, which is easier on the cells. A replacement must match exactly.</td></tr>
      <tr><td>Capacity (mAh)</td><td class="bq-mono">2,000–4,000</td><td>How much charge the battery stores. Only comparable between batteries with the same voltage.</td></tr>
      <tr><td>Energy (Wh)</td><td class="bq-mono">40–100 Wh</td><td>Voltage times capacity. The best single number for comparing runtime across brands.</td></tr>
      <tr><td>Cell count</td><td class="bq-mono">5–8 cells</td><td>More cells usually means more capacity and a heavier handle. Not always listed.</td></tr>
      <tr><td>Charge time</td><td class="bq-mono">2–5 hours</td><td>Fast charging is convenient but produces more heat. Most vacuums charge at a gentle rate.</td></tr>
    </tbody>
  </table></div>
  <p class="bq-p">Watt-hours is the most honest number for comparing models, because it combines voltage and capacity. To calculate it, multiply volts by amp-hours: a 25.2 V battery with 2,500 mAh (2.5 Ah) holds 63 Wh. A battery with more watt-hours doesn’t automatically last more years, but it does go through fewer full cycles for the same amount of cleaning, which slows down wear.</p>
</section>

<section id="i-measured" class="bq-section">
  <h2 class="bq-h2">What we measured in 14 months of testing</h2>
  <p class="bq-p">We bought three stick vacuums at retail: the <a class="bq-plink" href="/review/vorta-s9">Vorta S9</a>, the <a class="bq-plink" href="/review/northwind-x2">Northwind X2</a> and the <a class="bq-plink" href="/review/kleen-air-300">Kleen Air 300</a>. A timer-controlled rig ran each one on the standard setting until the cut-off, let the battery cool for 30 minutes and recharged it on the original charger. The rig ran around the clock from August 2025 to October 2026, in a room kept at 70°F.</p>
  <p class="bq-p">Every 100 cycles, we took the vacuums off the rig and measured runtime by hand on hardwood with the floor head attached, the same way we test new vacuums for our buying guides. One full cycle a day comes to roughly 365 cycles a year, so 800 cycles equals more than two years of daily use.</p>
  <figure class="bq-chart">
    <div class="bq-chart__head"><strong>Runtime after charge cycles, Vorta S9</strong><span>minutes, standard setting</span></div>
    <div class="bq-bars">
      <div class="bq-bar"><span>New</span><span class="bq-bar__track"><span style="width:100%"></span></span><span>48 min</span></div>
      <div class="bq-bar"><span>100 cycles</span><span class="bq-bar__track"><span style="width:98%"></span></span><span>47 min</span></div>
      <div class="bq-bar"><span>200 cycles</span><span class="bq-bar__track"><span style="width:94%"></span></span><span>45 min</span></div>
      <div class="bq-bar"><span>300 cycles</span><span class="bq-bar__track"><span style="width:88%"></span></span><span>42 min</span></div>
      <div class="bq-bar"><span>500 cycles</span><span class="bq-bar__track"><span style="width:77%"></span></span><span>37 min</span></div>
      <div class="bq-bar bq-bar--hl"><span>800 cycles</span><span class="bq-bar__track"><span style="width:65%"></span></span><span>31 min</span></div>
    </div>
    <figcaption>Orange marks the point where the battery dropped below 70% of its starting runtime.</figcaption>
  </figure>
  <p class="bq-p">The curve was surprisingly flat for the first 300 cycles. All three vacuums lost less than 15% of their runtime in that period. After that the decline sped up, and between cycles 500 and 800 the batteries lost capacity about twice as fast as in the first year. This matches what battery researchers describe as the “knee” in lithium-ion aging: a slow, steady phase followed by faster wear once the cells are past their prime.</p>
  <div class="bq-table-wrap"><table class="bq-table">
    <thead><tr><th>Model</th><th>New</th><th>300 cycles</th><th>500 cycles</th><th>800 cycles</th><th>Below 70% at</th></tr></thead>
    <tbody>
      <tr><td>Vorta S9</td><td>48</td><td>42</td><td>37</td><td>31</td><td class="bq-mono">~720 cycles</td></tr>
      <tr><td>Northwind X2</td><td>62</td><td>55</td><td>48</td><td>41</td><td class="bq-mono">~780 cycles</td></tr>
      <tr><td>Kleen Air 300</td><td>35</td><td>30</td><td>25</td><td>21</td><td class="bq-mono">~560 cycles</td></tr>
    </tbody>
  </table></div>
  <p class="bq-note">Runtime in minutes on the standard setting with the floor head on hardwood, averaged over two runs.</p>
  <p class="bq-p">After 500 cycles, the <a class="bq-plink" href="/review/vorta-s9">Vorta S9</a> still ran for 37 minutes, enough for a 1,300 sq ft home. That’s about a year and a half of daily use, or three to five years for most households, who vacuum three or four times a week. The <a class="bq-plink" href="/review/northwind-x2">Northwind X2</a> held up best in absolute terms thanks to its larger battery, while the budget <a class="bq-plink" href="/review/kleen-air-300">Kleen Air 300</a> crossed the 70% line first, at around 560 cycles.</p>
  <blockquote class="bq-pull"><p>“None of the batteries failed suddenly. They just slowly got shorter, which is why most people only notice once it’s already annoying.”</p><cite>Sarah Miller, senior tester at BrasQ</cite></blockquote>
</section>

<section id="i-estimate" class="bq-section">
  <h2 class="bq-h2">How long will your battery last?</h2>
  <p class="bq-p">Battery life in years depends mostly on how many full cycles you use per week. A small apartment cleaned twice a week might use one cycle a week; a large house with pets, vacuumed daily, can easily use ten. Use the estimate below, based on our test results with an average battery, to see where you land.</p>
  <div class="bq-estimator" data-bq-estimator data-budget="650" data-cap="7">
    <div class="bq-estimator__head">Battery life estimate</div>
    <div class="bq-estimator__body">
      <div class="bq-estimator__field"><strong>Home size</strong>
        <div data-factor-group><button type="button" data-factor="0.4" aria-pressed="false">Apartment</button><button type="button" data-factor="0.7" aria-pressed="true">Up to 1,800 sq ft</button><button type="button" data-factor="1" aria-pressed="false">Larger home</button></div>
      </div>
      <label class="bq-estimator__field"><strong>Cleans per week: <span data-out="range">4</span></strong><input type="range" min="1" max="14" step="1" value="4" data-range></label>
      <div class="bq-estimator__field"><strong>Max mode</strong>
        <div data-factor-group><button type="button" data-factor="1" aria-pressed="true">Only for rugs</button><button type="button" data-factor="1.7" aria-pressed="false">Most of the time</button></div>
      </div>
      <div class="bq-estimator__result">
        <div><span>Estimated battery life</span><strong data-out="result">4.5 years</strong></div>
        <div><span>Full cycles per year</span><strong class="bq-mono" data-out="perYear">146</strong></div>
      </div>
      <p class="bq-estimator__note">Until the battery holds 70% of its original runtime, based on 650 cycles. Calendar aging caps real-world life at about seven years.</p>
    </div>
  </div>
  <div class="bq-table-wrap"><table class="bq-table">
    <thead><tr><th>Household</th><th>Cycles a week</th><th>Expected life</th></tr></thead>
    <tbody>
      <tr><td>Apartment, cleaned twice a week</td><td class="bq-mono">0.8</td><td class="bq-mono">7+ years</td></tr>
      <tr><td>Average home, three or four times a week</td><td class="bq-mono">2.5</td><td class="bq-mono">5 years</td></tr>
      <tr><td>Larger home with pets, daily</td><td class="bq-mono">7</td><td class="bq-mono">1.8 years</td></tr>
      <tr><td>Large home, daily on max mode</td><td class="bq-mono">12</td><td class="bq-mono">1 year</td></tr>
    </tbody>
  </table></div>
</section>

<section id="i-signs" class="bq-section">
  <h2 class="bq-h2">Signs your battery is wearing out</h2>
  <p class="bq-p">Because the decline is gradual, it’s easy to miss. If you recognize two or more of these, it’s worth timing a full charge and comparing it to the runtime in the manual.</p>
  <ul class="bq-arrows">
    <li><span><strong>It stops before the job is done.</strong> If a full charge no longer covers the rooms it used to, capacity has dropped. This is the most reliable sign.</span></li>
    <li><span><strong>Max mode drains it in minutes.</strong> Worn cells struggle to deliver high current, so boost mode is the first thing to suffer. A battery that ran eight minutes on max when new might drop to three.</span></li>
    <li><span><strong>It charges suspiciously fast.</strong> A battery that holds less fills up sooner. If charging used to take four hours and now takes two, that’s not a better charger.</span></li>
    <li><span><strong>The charge indicator jumps.</strong> The display goes from three bars to one in a few minutes, or the vacuum cuts out while it still shows charge left. The cells are no longer balanced.</span></li>
    <li><span><strong>Power pulses or drops.</strong> The motor speeds up and slows down even on a flat floor. The battery can’t hold its voltage under load.</span></li>
    <li><span><strong>The battery gets hot or swells.</strong> Stop using it and contact the manufacturer. This is rare, but a safety issue.</span></li>
  </ul>
  <div class="bq-warn"><span class="bq-eyebrow">Safety warning</span><p>A swollen, cracked or very hot battery is a fire risk. Stop using it, unplug the charger and store the battery outside on a non-flammable surface until you can recycle it. Don’t try to open or repair it.</p></div>
</section>

<section id="i-test" class="bq-section">
  <h2 class="bq-h2">How to test your own battery at home</h2>
  <p class="bq-p">You don’t need special equipment. A phone timer and 15 minutes of attention are enough to find out roughly how much capacity your battery has left.</p>
  <ol class="bq-nsteps">
    <li><span>Charge the battery fully and let it rest for an hour so it’s at room temperature.</span></li>
    <li><span>Attach the floor head, select the standard (not eco or max) setting and start a timer.</span></li>
    <li><span>Vacuum normally on hard floors, or hold the vacuum still with the head on a hard surface, until it cuts out.</span></li>
    <li><span>Divide your time by the runtime in the manual. Below 0.7 means the battery has less than 70% of its capacity left and is due for replacement.</span></li>
  </ol>
</section>

<section id="i-longer" class="bq-section">
  <h2 class="bq-h2">How to make your battery last longer</h2>
  <p class="bq-p">None of these habits take extra time. Together, they can add one to two years to the life of a battery, based on the difference between our best- and worst-treated test batteries.</p>
  <ol class="bq-nsteps bq-nsteps--titled">
    <li><div><strong>Don’t run it down to zero</strong><p>Recharge when you’re done cleaning, not when the vacuum stops. Deep discharges wear the cells fastest.</p></div></li>
    <li><div><strong>Let it cool before charging</strong><p>After a long session, especially on max mode, wait 20 to 30 minutes before you put it on the charger. Most vacuums delay charging when hot, but not all.</p></div></li>
    <li><div><strong>Charge at room temperature</strong><p>A garage in summer or winter shortens battery life. Between 50 and 80°F is ideal. Below freezing, don’t charge at all.</p></div></li>
    <li><div><strong>Use max mode only where needed</strong><p>Boost draws three times the current. Save it for rugs, stairs and the car.</p></div></li>
    <li><div><strong>Use eco mode for hard floors</strong><p>On hardwood and tile, eco picks up almost as much as standard in our tests and uses far less energy per square foot.</p></div></li>
    <li><div><strong>Clean the filter and brush roll</strong><p>A clogged filter or a brush roll wrapped in hair makes the motor work harder and drains the battery faster. Rinse the filter monthly and cut hair off the brush every few weeks.</p></div></li>
    <li><div><strong>Use the original charger</strong><p>Cheap replacement chargers often lack the temperature monitoring of the original, and may charge at the wrong voltage.</p></div></li>
    <li><div><strong>Store it half charged when you’re away</strong><p>Leaving it full on the dock for a month-long trip ages the battery more than storing it at about 50%.</p></div></li>
  </ol>
  <p class="bq-tip"><strong>Our tip:</strong> use the eco setting for everyday cleaning. In our test it added 40% runtime per charge, so you charge less often and the battery ages more slowly.</p>
</section>

<section id="i-myths" class="bq-section">
  <h2 class="bq-h2">Battery myths, checked</h2>
  <p class="bq-p">A lot of battery advice comes from the era of nickel-cadmium batteries, which behaved very differently. Here’s what still applies to the lithium-ion batteries in today’s vacuums.</p>
  <div class="bq-claims">
    <div class="bq-claim"><div><span class="bq-verdict-tag">Myth</span><strong>You have to drain the battery fully before charging.</strong></div><p>This was true for old nickel-cadmium batteries, which suffered from a “memory effect.” Lithium-ion batteries don’t, and full discharges actually wear them faster.</p></div>
    <div class="bq-claim"><div><span class="bq-verdict-tag">Myth</span><strong>Leaving it on the dock overcharges the battery.</strong></div><p>Every vacuum we’ve tested stops charging at 100%. Leaving it docked between cleans is fine. The only exception is long storage, where half charge is better.</p></div>
    <div class="bq-claim"><div><span class="bq-verdict-tag bq-verdict-tag--true">True</span><strong>Heat shortens battery life.</strong></div><p>This is the most important factor of all. A battery kept at 95°F ages about twice as fast as one kept at 70°F.</p></div>
    <div class="bq-claim"><div><span class="bq-verdict-tag bq-verdict-tag--partly">Partly true</span><strong>A bigger battery lasts more years.</strong></div><p>Not by itself, but a bigger battery goes through fewer full cycles for the same cleaning, so in practice it often does last longer.</p></div>
    <div class="bq-claim"><div><span class="bq-verdict-tag">Myth</span><strong>Putting a battery in the freezer revives it.</strong></div><p>Cold doesn’t restore lost capacity, and condensation can damage the cells and electronics. Don’t try it.</p></div>
  </div>
</section>

<section id="i-replace" class="bq-section">
  <h2 class="bq-h2">Replace the battery or buy a new vacuum?</h2>
  <p class="bq-p">If the motor still runs well, replace the battery. A new one costs a third to half the price of a new vacuum, and in our experience the motor, brush roll and housing of a decent stick vacuum easily last seven to ten years. That only works if the battery clicks out; on some budget models it’s glued or screwed inside the handle, and you’ll need to send the vacuum in for service.</p>
  <div class="bq-table-wrap"><table class="bq-table">
    <thead><tr><th>Model</th><th>Swappable</th><th>New battery</th><th>New vacuum</th><th>Battery as % of vacuum</th></tr></thead>
    <tbody>
      <tr><td>Vorta S9</td><td class="bq-mono">Yes, one click</td><td>$79</td><td>${usd(VS.price)}</td><td>${pct(79, VS.price)}</td></tr>
      <tr><td>Northwind X2</td><td class="bq-mono">Yes, one click</td><td>$119</td><td>${usd(NW.price)}</td><td>${pct(119, NW.price)}</td></tr>
      <tr><td>Kleen Air 300</td><td class="bq-mono">Yes, one click</td><td>$59</td><td>${usd(KA.price)}</td><td>${pct(59, KA.price)}</td></tr>
      <tr><td>Brisa Lite</td><td class="bq-mono">No, screwed in</td><td class="bq-mono">$95 service</td><td>$149</td><td>64%</td></tr>
    </tbody>
  </table></div>
  <p class="bq-note">Manufacturer battery prices, checked October 14, 2026.</p>
  <h3 class="bq-h3">When buying new makes more sense</h3>
  <p class="bq-p">Replacing the battery is not always the smart move. If your vacuum is more than six years old, it may also need a new filter, brush roll and possibly a new charger soon, and those parts add up. Older models also tend to be heavier and less efficient than what you can buy today for the same money. In those cases, a new mid-range vacuum like the ones in our <a href="/guide/stick-vacuums">stick vacuum buying guide</a> is usually the better buy.</p>
  <div class="bq-twobox">
    <div><span class="bq-eyebrow bq-eyebrow--yes">Replace the battery if</span><ul><li class="bq-plus">The vacuum is less than six years old</li><li class="bq-plus">Suction is still strong when the battery is charged</li><li class="bq-plus">The battery clicks out or is held by a few screws</li><li class="bq-plus">The battery costs less than 40% of a new vacuum</li></ul></div>
    <div><span class="bq-eyebrow bq-eyebrow--no">Buy a new vacuum if</span><ul><li class="bq-minus">The motor is noisy, smells or cuts out on a full battery</li><li class="bq-minus">The battery is glued in or needs a paid repair</li><li class="bq-minus">Parts are no longer sold for your model</li><li class="bq-minus">You’ve outgrown the runtime, even when new</li></ul></div>
  </div>
</section>

<section id="i-howto" class="bq-section">
  <h2 class="bq-h2">How to replace a stick vacuum battery</h2>
  <div class="bq-howto-meta"><span><strong>Time:</strong> 5 to 10 minutes</span><span><strong>Difficulty:</strong> easy</span><span><strong>Tools:</strong> none, or a Phillips #1 screwdriver</span></div>
  <p class="bq-p">On most current models, replacing the battery is as easy as changing the batteries in a remote. Older or budget models may have two or three screws holding the pack in place. These steps work for every swappable model we’ve tested.</p>
  <ol class="bq-nsteps bq-nsteps--titled">
    <li><div><strong>Find the right battery</strong><p>Look up the model number on the sticker under the dust bin or on the old battery itself. Match voltage exactly; capacity may be higher.</p></div></li>
    <li><div><strong>Switch off and empty the bin</strong><p>Make sure the vacuum is off and unplugged from the dock. Empty the dust bin so nothing falls into the handle.</p></div></li>
    <li><div><strong>Release the old battery</strong><p>Press the release button, usually below or behind the handle, and slide the battery out. On screw-in models, remove the two or three screws first.</p></div></li>
    <li><div><strong>Check the contacts</strong><p>Wipe the metal contacts in the handle with a dry cloth. Dust or corrosion there can cause the vacuum to cut out.</p></div></li>
    <li><div><strong>Insert the new battery</strong><p>Slide it in until it clicks. On screw-in models, don’t over-tighten the screws; the housing is plastic.</p></div></li>
    <li><div><strong>Charge it fully before first use</strong><p>New batteries ship at 30 to 50% charge. A full first charge lets the battery management system calibrate the charge indicator.</p></div></li>
  </ol>
  <div class="bq-photo bq-photo--169"><img src="${esc(libPhoto('V6'))}" alt="Releasing the battery from the handle of the Vorta S9" loading="lazy"></div>
  <p class="bq-caption">On the Vorta S9, the release button sits under the handle. Press and slide the battery down.</p>
</section>

<section id="i-thirdparty" class="bq-section">
  <h2 class="bq-h2">Original or third-party battery?</h2>
  <p class="bq-p">Search for a replacement battery and you’ll find third-party options for half the price of the original. We bought two for each model in our test and ran them through the same cycle test. The results were mixed: one brand matched the original for about 300 cycles before falling off faster, while the other started at only 85% of the original runtime and lost capacity steadily from there. On average, the third-party batteries lasted 30% fewer cycles.</p>
  <div class="bq-twobox">
    <div><strong>Original</strong><ul><li class="bq-plus">Matches the original runtime</li><li class="bq-plus">Tested together with the vacuum</li><li class="bq-plus">Doesn’t affect your warranty</li><li class="bq-minus">Costs about twice as much</li></ul></div>
    <div><strong>Third-party</strong><ul><li class="bq-plus">Often half the price</li><li class="bq-plus">Available for older models</li><li class="bq-minus">Lasted 30% fewer cycles in our test</li><li class="bq-minus">May void the manufacturer’s warranty</li></ul></div>
  </div>
  <p class="bq-p">If you do buy third-party, look for a UL or ETL certification mark on the battery itself, not just in the listing, and buy from a seller that offers at least a one-year warranty. Avoid listings that claim a much higher capacity than the original at a lower price; in our experience those numbers are rarely accurate.</p>
</section>

<section id="i-swappable" class="bq-section">
  <h2 class="bq-h2">Vacuums with a battery you can swap yourself</h2>
  <p class="bq-p">All three are in our <a href="/guide/stick-vacuums">stick vacuum buying guide</a>. Each has a battery that releases with one button, so you can replace it in seconds or buy a second one for larger homes.</p>
  <div class="bq-prows">
${prow('Our top pick', VS, '48 minutes of runtime and a battery that clicks out from the handle.')}
${prow('Best budget pick', KA, 'The cheapest replacement battery we found, at $59.')}
${prow('For larger homes', NW, 'The longest runtime in our test: 62 minutes, and a spare battery swaps in mid-clean.')}
  </div>
  <p class="bq-note">Prices checked October 14, 2026 at 9:00 a.m. ET. Prices may change.</p>
</section>

<section id="i-storage" class="bq-section">
  <h2 class="bq-h2">Storage, travel and recycling</h2>
  <h3 class="bq-h3">Storing the vacuum for a long time</h3>
  <p class="bq-p">If you won’t use the vacuum for a month or more, for example in a vacation home or during a long trip, charge or run the battery to about half, take it off the dock and store it somewhere cool and dry. A closet in the house is better than the garage or attic. Check it every three months and top it up to half if it has dropped below 20%. A lithium-ion battery that sits empty for too long can drop into deep discharge, after which some chargers will refuse to charge it.</p>
  <h3 class="bq-h3">Moving house</h3>
  <p class="bq-p">Remove the battery before you pack the vacuum, and keep it in the car with you instead of in a moving truck, where temperatures in summer can exceed 130°F. Tape over the contacts if the battery isn’t in its own case.</p>
  <h3 class="bq-h3">Recycling an old battery</h3>
  <p class="bq-p">Lithium-ion batteries should never go in the trash or curbside recycling bin. Damaged batteries are a leading cause of fires in garbage trucks and sorting facilities. Most hardware stores, home improvement chains and electronics retailers accept them for free. Cover the metal contacts with tape before you drop the battery off, and put a swollen or damaged battery in a sealed plastic bag first.</p>
</section>

<section id="i-faq" class="bq-faq">
  <h2 class="bq-h2">Frequently asked questions</h2>
${FAQ.map(([q, ans]) => `  <details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('\n')}
</section>

<section class="bq-helpful" data-bq-helpful><strong>Was this article helpful?</strong><div><button type="button" data-vote="yes">Yes</button><button type="button" data-vote="no">No</button></div></section>

<section class="bq-about">
  <div class="bq-avatar"><img src="${esc(authorPhoto('sarah'))}" alt="${esc(a.name)}" loading="lazy"></div>
  <div><span class="bq-eyebrow">About the author</span><a class="bq-about__name" href="${authorUrl('sarah')}">${esc(a.name)}</a><p>Sarah has tested vacuums and cleaning products for BrasQ since 2021 and has run more than 140 vacuums through our test house. She designed the long-term battery test in this article.</p></div>
</section>

<div class="bq-history bq-history--dated"><strong>Update history</strong><ul>
  <li><time>Oct 14, 2026</time><span>Added results after 800 cycles and the third-party battery test.</span></li>
  <li><time>Jun 3, 2026</time><span>Added results after 500 cycles and updated battery prices.</span></li>
  <li><time>Mar 2, 2026</time><span>First published with results after 300 cycles.</span></li>
</ul></div>

<div class="bq-history"><strong>Sources</strong><ul>
  <li>Long-term battery test, BrasQ (August 2025 to October 2026)</li>
  <li>IEC 62885-4: Performance measurement of cordless vacuum cleaners</li>
  <li>Battery University: How to prolong lithium-based batteries</li>
  <li>U.S. EPA: Used lithium-ion batteries, recycling guidance</li>
</ul></div>
  </div>
</div>

<section class="bq-keep">
  <h2 class="bq-h2 bq-h2--rule" style="font-size:36px">Keep reading</h2>
  <div class="bq-keep__grid">
    <a href="/guide/stick-vacuums"><div class="bq-photo"><img src="${esc(guidePhoto(stickGuide, 0))}" alt="" loading="lazy"></div><span class="bq-eyebrow">Buying guide</span><strong>${esc(stickGuide.title)}</strong></a>
    <a href="/compare/vorta-s9-vs-northwind-x2"><div class="bq-photo"><img src="${esc(productPhoto(NW))}" alt="" loading="lazy"></div><span class="bq-eyebrow">Comparison</span><strong>Vorta S9 vs Northwind X2: which stick vacuum should you buy?</strong></a>
    <a href="/explained/how-robot-vacuums-work"><div class="bq-photo"><img src="${esc(libPhoto('R3'))}" alt="" loading="lazy"></div><span class="bq-eyebrow">Explained</span><strong>How does a robot vacuum work?</strong></a>
  </div>
</section>
</article>`;
}

export function batteryInfoRow() {
  const day = (s: string) => new Date(s + ' 12:00 UTC');
  return {
    type: 'informational' as const, slug: BATTERY_SLUG,
    title: 'How long does a cordless vacuum battery last?',
    excerpt: 'Three to five years for most people. We ran three stick vacuums through 800 charge cycles to see how fast runtime drops, and what you can do to slow it down.',
    html: batteryInfoHtml(), css: '',
    coverImage: libPhoto('V3'),
    seoTitle: 'How long does a cordless vacuum battery last? We tested 800 cycles | BrasQ',
    seoDescription: 'Three to five years for most people. Our 14-month test of three stick vacuums shows how fast runtime drops, the signs of a worn battery and how to make it last longer.',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Article', headline: 'How long does a cordless vacuum battery last?', author: { '@type': 'Person', name: 'Sarah Miller' }, reviewedBy: { '@type': 'Person', name: 'Ryan Mitchell' }, datePublished: '2026-03-02', dateModified: '2026-10-14', publisher: { '@type': 'Organization', name: 'BrasQ' } },
        { '@type': 'HowTo', name: 'How to replace a stick vacuum battery', totalTime: 'PT10M', step: ['Find the right battery', 'Switch off and empty the bin', 'Release the old battery', 'Check the contacts', 'Insert the new battery', 'Charge it fully before first use'].map((t, i) => ({ '@type': 'HowToStep', position: i + 1, name: t })) },
        { '@type': 'FAQPage', mainEntity: FAQ.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })) },
      ],
    }),
    testedCount: null, testWeeks: null, topPick: null,
    catSlug: 'cleaning', authorKey: 'sarah',
    publishedAt: day('March 2, 2026'), createdAt: day('March 2, 2026'), updatedAt: day('October 14, 2026'),
  };
}

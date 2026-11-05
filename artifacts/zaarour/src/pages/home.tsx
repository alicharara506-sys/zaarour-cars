import { useMemo } from 'react';
import { Link } from 'wouter';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Hero } from '@/components/site/hero';
import { CarCard, CarCardSkeleton } from '@/components/site/car-card';
import { Counter, Eyebrow, Reveal } from '@/components/site/motion';
import { FaqList } from '@/components/site/faq';
import { useMakes, usePublicCars, useSettings } from '@/hooks/use-dealer';
import { useSeo, faqLd } from '@/lib/seo';
import { faqs } from '@/data/faqs';
import { waLink } from '@/lib/format';
import { logWhatsAppClick } from '@/lib/data';

function BrandStrip() {
  const { data: makes } = useMakes();
  const list = makes ?? [];
  if (!list.length) return null;
  const loop = [...list, ...list, ...list, ...list];
  return (
    <section aria-label="Brands we carry" className="relative overflow-hidden border-y border-border py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background" />
      <div className="flex w-max animate-marquee items-center gap-16 hover:[animation-play-state:paused]">
        {loop.map((m, i) => (
          <Link key={i} href={'/cars?make=' + encodeURIComponent(m.name)} className="flex items-center gap-3 text-foreground/45 transition hover:text-gold" aria-label={'View ' + m.name + ' cars'}>
            {m.logo ? <img src={m.logo} alt={m.name + ' logo'} loading="lazy" className="h-8 w-auto opacity-70 grayscale" /> : null}
            <span className="font-wide text-sm whitespace-nowrap">{m.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  const { cars, isLoading } = usePublicCars();
  const featured = cars.filter((c) => c.featured);
  const [ref, api] = useEmblaCarousel({ align: 'start', dragFree: true });
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10" aria-labelledby="featured-title">
      <div className="mb-10 flex items-end justify-between gap-6">
        <Reveal><Eyebrow>Featured on the floor</Eyebrow><h2 id="featured-title" className="mt-4 font-display text-5xl md:text-7xl">The <span className="italic text-gold">spotlight</span> cars</h2></Reveal>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => api?.scrollPrev()} aria-label="Previous featured cars" data-testid="button-featured-prev" className="flex h-12 w-12 items-center justify-center border border-border transition hover:border-[hsl(var(--gold))]"><ArrowLeft className="h-4 w-4" /></button>
          <button onClick={() => api?.scrollNext()} aria-label="Next featured cars" data-testid="button-featured-next" className="flex h-12 w-12 items-center justify-center border border-border transition hover:border-[hsl(var(--gold))]"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="overflow-hidden">
        <div className="-ml-5 flex touch-pan-y">
          {(isLoading ? Array.from({ length: 3 }) : featured).map((c, i) => (
            <div key={i} className="min-w-0 flex-[0_0_88%] pl-5 sm:flex-[0_0_55%] lg:flex-[0_0_36%]">
              {c ? <CarCard car={c as (typeof featured)[number]} /> : <CarCardSkeleton />}
            </div>
          ))}
        </div>
      </div>
      {!isLoading && !featured.length && <p className="text-muted-foreground">No featured cars right now. <Link href="/cars" className="text-gold underline">See full inventory</Link>.</p>}
    </section>
  );
}

const PRINCIPLES = [
  ['The price is the price.', 'Every car carries its price in US dollars, written in plain text on the listing. No "call for price".'],
  ['Every spec, on the page.', 'Engine, horsepower, drivetrain, colours, mileage in kilometres, condition — before you ever pick up the phone.'],
  ['One channel. WhatsApp.', 'Each car has a button that opens WhatsApp with that exact car already in the message. You talk to the showroom, not a bot.'],
  ['New and pre-owned, one roof.', 'Zero-kilometre cars beside carefully chosen pre-owned ones, for buyers from Beirut to the Mount Lebanon hills.'],
];

function Why() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-[hsl(30_8%_6%)] py-24" aria-labelledby="why-title">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <Eyebrow>Why Zaarour</Eyebrow>
          <h2 id="why-title" className="mt-4 font-display text-5xl leading-[0.95] md:text-7xl">A showroom that <span className="italic metal-gold">shows</span> everything.</h2>
          <p className="mt-6 max-w-md text-muted-foreground">Buying a car in Lebanon should not require decoding. These are the rules this site is built on.</p>
        </Reveal>
        <ol className="divide-y divide-border border-y border-border">
          {PRINCIPLES.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.06}>
              <li className="group grid grid-cols-[4rem_1fr] gap-4 py-9 md:grid-cols-[6rem_1fr]">
                <span className="font-mono text-4xl text-[hsl(var(--gold)/.35)] transition-colors group-hover:text-gold md:text-5xl">0{i + 1}</span>
                <div><h3 className="font-display text-3xl md:text-4xl">{t}</h3><p className="mt-3 max-w-lg text-muted-foreground">{d}</p></div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Stats() {
  const { cars } = usePublicCars();
  const { data: makes } = useMakes();
  const stock = cars.filter((c) => !c.sold);
  const stats = [
    { v: stock.length, label: 'Cars in stock now' },
    { v: new Set(stock.map((c) => c.make)).size || makes?.length || 0, label: 'Brands on the floor' },
    { v: stock.filter((c) => c.newArrival).length, label: 'Fresh arrivals' },
    { v: stock.length ? Math.min(...stock.map((c) => c.price)) : 0, label: 'Starting price (USD)', prefix: '$' },
  ];
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10" aria-label="Live inventory figures">
      <Reveal><Eyebrow>Live from the inventory</Eyebrow></Reveal>
      <div className="mt-8 grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="bg-background p-6 md:p-10">
            <p className="font-mono text-4xl metal-silver md:text-6xl" data-testid={'stat-' + i}><Counter value={s.v} prefix={s.prefix} /></p>
            <p className="mt-3 font-wide text-[0.55rem] text-muted-foreground">{s.label}</p>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Figures are calculated from the current listings on this site.</p>
    </section>
  );
}

function Latest() {
  const { cars, isLoading } = usePublicCars();
  const latest = useMemo(() => [...cars].sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || b.year - a.year).slice(0, 6), [cars]);
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-24 md:px-10" aria-labelledby="latest-title">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <Reveal><Eyebrow>Latest arrivals</Eyebrow><h2 id="latest-title" className="mt-4 font-display text-5xl md:text-7xl">Just rolled <span className="italic text-silver">in</span></h2></Reveal>
        <Link href="/cars" className="btn-ghost" data-testid="link-latest-all">All inventory <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />) : latest.map((c, i) => <Reveal key={c.id} delay={(i % 3) * 0.08}><CarCard car={c} /></Reveal>)}
      </div>
    </section>
  );
}

/** DEMO testimonials — placeholders only. Replace with real, permissioned client reviews. */
const DEMO_TESTIMONIALS = [
  { quote: 'Sample review: the price on the website was the price we discussed. Replace this with a real client quote.', who: 'Demo client', where: 'Beirut' },
  { quote: 'Sample review: I sent one WhatsApp message from the car page and had the details I needed. Placeholder text.', who: 'Demo client', where: 'Mount Lebanon' },
  { quote: 'Sample review: every spec was listed, so the visit was about the drive, not the paperwork. Placeholder text.', who: 'Demo client', where: 'Moawad' },
];

function Testimonials() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-24 md:px-10" aria-labelledby="voices-title">
      <Reveal><Eyebrow>Client voices</Eyebrow><h2 id="voices-title" className="mt-4 font-display text-5xl md:text-6xl">What buyers say</h2>
        <p className="mt-3 inline-block border border-[hsl(var(--gold)/.4)] px-3 py-1 font-wide text-[0.5rem] text-gold">Demo content — sample testimonials, not real reviews</p></Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        {DEMO_TESTIMONIALS.map((t, i) => (
          <Reveal key={i} delay={i * 0.08} className={i === 0 ? 'md:row-span-2' : ''}>
            <figure className={'h-full border border-border bg-card p-8 ' + (i === 0 ? 'md:p-12' : '')}>
              <span className="font-display text-7xl leading-none text-gold">&ldquo;</span>
              <blockquote className={'font-display leading-snug ' + (i === 0 ? 'text-3xl md:text-4xl' : 'text-2xl')}>{t.quote}</blockquote>
              <figcaption className="mt-6 font-wide text-[0.55rem] text-muted-foreground">{t.who} · {t.where}</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ContactCta() {
  const s = useSettings();
  return (
    <section className="relative mx-5 overflow-hidden border border-[hsl(var(--gold)/.3)] md:mx-10">
      <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=60" alt="Sports car at dusk" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="relative max-w-2xl px-6 py-20 md:px-14 md:py-28">
        <Eyebrow>Talk to the showroom</Eyebrow>
        <h2 className="mt-4 font-display text-5xl leading-[0.95] md:text-7xl">Found the one? <span className="italic metal-gold">Say so.</span></h2>
        <p className="mt-5 text-foreground/75">Message ZAAROUR on WhatsApp or send a note through the contact page. We are in Moawad and talk with buyers across Lebanon.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={waLink(s.whatsapp, 'Hello ZAAROUR')} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)} className="btn-gold" data-testid="link-cta-whatsapp"><SiWhatsapp className="h-4 w-4" /> WhatsApp</a>
          <Link href="/contact" className="btn-ghost" data-testid="link-cta-contact">Contact page</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useSeo({
    title: 'ZAAROUR | Premium New & Used Cars in Moawad, Lebanon | Prices in USD',
    description: 'ZAAROUR is a premium new and used car dealership in Moawad, Lebanon, serving Beirut and Mount Lebanon. Browse Mercedes-Benz, BMW, Audi, Toyota, Range Rover and more with USD prices and mileage in km.',
    path: '/', ld: [faqLd(faqs)],
  });
  return (
    <>
      <Hero />
      <BrandStrip />
      <Featured />
      <Why />
      <Stats />
      <Latest />
      <Testimonials />
      <section className="mx-auto max-w-[1400px] px-5 pb-24 md:px-10" aria-labelledby="faq-title">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal><Eyebrow>Straight answers</Eyebrow><h2 id="faq-title" className="mt-4 font-display text-5xl md:text-6xl">Buyer questions</h2></Reveal>
          <FaqList />
        </div>
      </section>
      <ContactCta />
    </>
  );
}

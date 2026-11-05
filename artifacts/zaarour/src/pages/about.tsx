import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Eyebrow, Reveal } from '@/components/site/motion';
import { useSeo, breadcrumbLd } from '@/lib/seo';

export default function About() {
  useSeo({
    title: 'About ZAAROUR | Premium Car Dealership in Moawad, Lebanon',
    description: 'ZAAROUR is a premium new and used car dealership in Moawad, Lebanon, selling cars priced in US dollars to buyers across Beirut, Mount Lebanon and the rest of Lebanon.',
    path: '/about', ld: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])],
  });
  return (
    <div className="pt-28 md:pt-36">
      <section className="mx-auto max-w-[1400px] px-5 md:px-10">
        <Reveal><Eyebrow>About Zaarour</Eyebrow>
          <h1 className="mt-5 max-w-5xl font-display text-6xl leading-[0.9] md:text-[7.5rem]">A dealership in <span className="italic metal-gold">Moawad</span>, built for the whole of Lebanon.</h1></Reveal>
      </section>
      <Reveal className="relative mx-5 mt-16 overflow-hidden md:mx-10">
        <img src="https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=2000&q=65" alt="Sports car in low showroom light" loading="lazy" className="h-[46vh] w-full object-cover md:h-[70vh]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
      </Reveal>
      <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 md:px-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal><h2 className="font-display text-4xl md:text-5xl">Who we are</h2></Reveal>
        <Reveal delay={0.08} className="space-y-6 text-lg leading-relaxed text-foreground/80">
          <p>ZAAROUR is a car dealership based in Moawad, Lebanon. It sells new cars and pre-owned cars from premium and dependable brands — Mercedes-Benz, BMW, Audi, Toyota, Land Rover, Porsche, Lexus and others as stock changes.</p>
          <p>Buyers come to ZAAROUR from Beirut, Mount Lebanon and across the country. Every car on this website is priced in US dollars, with mileage in kilometres, year, condition and a full specification written in plain text.</p>
          <p>Conversations happen on WhatsApp. Each car page has a button that opens a chat with the exact car, price and mileage already in the message, so nothing gets lost between the listing and the showroom.</p>
          {/* Owner note: add the founding story, years in business and team here once confirmed — nothing invented. */}
        </Reveal>
      </section>
      <section className="border-y border-border bg-[hsl(30_8%_6%)]">
        <div className="mx-auto grid max-w-[1400px] gap-px px-5 md:grid-cols-3 md:px-10">
          {[['What we sell', 'New and used cars: sedans, SUVs, coupes and 4x4s.'], ['Where', 'Moawad, Lebanon. Serving Beirut, Mount Lebanon and nationwide buyers.'], ['How we price', 'In US dollars, displayed on every listing.']].map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08} className="py-12 md:px-8 md:first:pl-0">
              <p className="font-wide text-[0.55rem] text-gold">{t}</p><p className="mt-4 font-display text-3xl leading-tight">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1400px] px-5 py-24 text-center md:px-10">
        <Reveal><h2 className="font-display text-5xl md:text-7xl">See what is on the floor <span className="italic text-silver">today</span>.</h2>
          <Link href="/cars" className="btn-gold mt-10" data-testid="link-about-inventory">Browse inventory <ArrowRight className="h-4 w-4" /></Link></Reveal>
      </section>
    </div>
  );
}

import { useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, MessageSquare, Phone } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Gallery } from '@/components/site/gallery';
import { CarCard } from '@/components/site/car-card';
import { Eyebrow, Reveal } from '@/components/site/motion';
import { usePublicCars, useSettings } from '@/hooks/use-dealer';
import { carTitle, carWaMessage, km, usd, waLink } from '@/lib/format';
import { logWhatsAppClick } from '@/lib/data';
import { useSeo, carLd, breadcrumbLd, SITE_URL } from '@/lib/seo';

export default function CarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { cars, isLoading, isError, refetch } = usePublicCars();
  const s = useSettings();
  const car = cars.find((c) => c.slug === slug);
  const related = useMemo(() => {
    if (!car) return [];
    return cars.filter((c) => c.id !== car.id).map((c) => ({ c, score: (c.make === car.make ? 3 : 0) + (c.bodyType === car.bodyType ? 2 : 0) + (Math.abs(c.price - car.price) < car.price * 0.3 ? 1 : 0) - (c.sold ? 2 : 0) }))
      .sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.c);
  }, [cars, car]);
  const title = car ? carTitle(car) + ' for Sale in Lebanon | ' + usd(car.price) + ' | Zaarour' : isLoading ? 'Loading car | Zaarour' : 'Car not found | Zaarour';
  useSeo({
    title,
    description: car ? carTitle(car) + ' ' + car.trim + ', ' + (car.condition === 'new' ? 'new' : 'used') + ', ' + km(car.mileage) + ', ' + car.fuelType + ', ' + car.transmission + '. Price ' + usd(car.price) + ' USD at ZAAROUR, Moawad, Lebanon.' : 'Car listing at ZAAROUR, Moawad, Lebanon.',
    path: '/cars/' + slug, image: car?.images[0], type: 'product',
    ld: car ? [carLd(car), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Inventory', path: '/cars' }, { name: carTitle(car), path: '/cars/' + car.slug }])] : [],
  });
  if (isLoading) return <div className="mx-auto max-w-[1400px] px-5 pt-32 md:px-10"><div className="aspect-[16/10] animate-pulse bg-muted lg:w-2/3" /><div className="mt-6 h-10 w-1/2 animate-pulse bg-muted" /></div>;
  if (isError) return <div className="px-5 pt-40 text-center"><p>Could not load this car.</p><button onClick={() => refetch()} className="btn-ghost mt-4">Retry</button></div>;
  if (!car) return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-40 text-center">
      <p className="font-wide text-[0.6rem] text-gold">Not on the floor</p>
      <h1 className="mt-4 font-display text-5xl">This car is no longer listed.</h1>
      <Link href="/cars" className="btn-gold mt-8">Browse inventory</Link>
    </div>
  );
  const url = SITE_URL + '/cars/' + car.slug;
  const specs: [string, string][] = [
    ['Price', usd(car.price) + ' USD'], ['Mileage', km(car.mileage)], ['Year', String(car.year)], ['Make', car.make], ['Model', car.model], ['Trim', car.trim || '—'],
    ['Condition', car.condition === 'new' ? 'New' : 'Used'], ['Exterior colour', car.exteriorColor], ['Interior colour', car.interiorColor], ['Fuel type', car.fuelType],
    ['Transmission', car.transmission], ['Engine', car.engine], ['Horsepower', car.horsepower ? car.horsepower + ' hp' : '—'], ['Drivetrain', car.drivetrain], ['Body type', car.bodyType],
    ...(car.vin ? [['VIN', car.vin] as [string, string]] : []),
  ];
  const wa = () => logWhatsAppClick(car.slug);
  return (
    <article className="mx-auto max-w-[1400px] px-5 pb-10 pt-24 md:px-10 md:pt-32">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-wide text-[0.5rem] text-muted-foreground">
        <Link href="/cars" className="flex items-center gap-1 hover:text-gold"><ArrowLeft className="h-3 w-3" /> Inventory</Link> / <span>{car.make}</span> / <span className="text-gold">{car.model}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr]">
        <div><Gallery images={car.images} alt={carTitle(car) + ' ' + car.trim} /></div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-wide text-[0.55rem] text-muted-foreground">{car.year} · {car.condition === 'new' ? 'New' : 'Pre-owned'} · {car.bodyType}</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] md:text-6xl">{car.year} {car.make} {car.model} <span className="italic text-silver">{car.trim}</span></h1>
          <div className="mt-6 flex items-end gap-4 border-y border-border py-5">
            <p className="font-mono text-5xl font-medium metal-gold" data-testid="text-car-price">{usd(car.price)}</p>
            <p className="pb-1.5 font-wide text-[0.5rem] text-muted-foreground">USD · {km(car.mileage)}</p>
          </div>
          {car.sold && <p className="mt-4 border border-[hsl(var(--gold))] px-4 py-3 font-wide text-[0.6rem] text-gold" data-testid="status-sold">Sold — ask us about similar cars</p>}
          <div className="mt-6 grid gap-3">
            <a href={waLink(s.whatsapp, carWaMessage(car, url))} target="_blank" rel="noopener noreferrer" onClick={wa} className="btn-gold justify-center" data-testid="link-car-whatsapp"><SiWhatsapp className="h-4 w-4" /> Contact via WhatsApp</a>
            <div className="grid grid-cols-2 gap-3">
              <a href={'tel:' + s.phone.replace(/\s/g, '')} className="btn-ghost justify-center" data-testid="link-car-call"><Phone className="h-4 w-4 text-gold" /> Call</a>
              <Link href={'/contact?car=' + car.slug} className="btn-ghost justify-center" data-testid="link-car-enquire"><MessageSquare className="h-4 w-4 text-gold" /> Enquire</Link>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{car.description}</p>
        </div>
      </div>
      <div className="mt-20 grid gap-14 lg:grid-cols-[1.45fr_1fr]">
        <Reveal>
          <Eyebrow>Full specification</Eyebrow>
          <dl className="mt-6 grid border-t border-border sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border py-4 sm:odd:pr-6 sm:even:pl-6">
                <dt className="font-wide text-[0.52rem] text-muted-foreground">{k}</dt><dd className="text-right font-mono text-sm" data-testid={'spec-' + k.toLowerCase().replace(/\s/g, '-')}>{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={0.1}>
          <Eyebrow>Features</Eyebrow>
          <ul className="mt-6 space-y-3">
            {car.features.length ? car.features.map((x) => <li key={x} className="flex gap-3 text-foreground/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{x}</li>) : <li className="text-muted-foreground">Ask on WhatsApp for the full equipment list.</li>}
          </ul>
        </Reveal>
      </div>
      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="similar-title">
          <Reveal><Eyebrow>You may also like</Eyebrow><h2 id="similar-title" className="mt-4 font-display text-5xl">Similar cars</h2></Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((c) => <CarCard key={c.id} car={c} />)}</div>
        </section>
      )}
    </article>
  );
}

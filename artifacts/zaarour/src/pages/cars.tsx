import { useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { SlidersHorizontal, X, Search, RotateCcw } from 'lucide-react';
import { CarCard, CarCardSkeleton } from '@/components/site/car-card';
import { Eyebrow, Reveal } from '@/components/site/motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMakes, usePublicCars } from '@/hooks/use-dealer';
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS, type Car } from '@/data/cars';
import { useSeo, breadcrumbLd } from '@/lib/seo';

const SORTS: Record<string, { label: string; fn: (a: Car, b: Car) => number }> = {
  newest: { label: 'Newest', fn: (a, b) => b.year - a.year || Number(b.newArrival) - Number(a.newArrival) },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  mileage: { label: 'Lowest mileage', fn: (a, b) => a.mileage - b.mileage },
};
const KEYS = ['q', 'make', 'model', 'minYear', 'maxYear', 'minPrice', 'maxPrice', 'minKm', 'maxKm', 'fuel', 'trans', 'body', 'condition', 'sort'] as const;
type Key = (typeof KEYS)[number];

function useFilters() {
  const search = useSearch();
  const [, nav] = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const get = (k: Key) => params.get(k) ?? '';
  const set = (patch: Partial<Record<Key, string>>) => {
    const p = new URLSearchParams(search);
    Object.entries(patch).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k); });
    if (patch.make !== undefined) p.delete('model');
    nav('/cars' + (p.toString() ? '?' + p : ''), { replace: true });
  };
  const clear = () => nav('/cars', { replace: true });
  return { get, set, clear, params };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

function Filters({ f, cars }: { f: ReturnType<typeof useFilters>; cars: Car[] }) {
  const { data: makes } = useMakes();
  const make = f.get('make');
  const models = [...new Set(cars.filter((c) => !make || c.make === make).map((c) => c.model))].sort();
  const years = [...new Set(cars.map((c) => c.year))].sort((a, b) => b - a);
  const makeNames = [...new Set([...(makes ?? []).map((m) => m.name), ...cars.map((c) => c.make)])].sort();
  const sel = (k: Key, opts: string[], any: string, id: string) => (
    <select className="field" value={f.get(k)} onChange={(e) => f.set({ [k]: e.target.value })} data-testid={'select-' + id}>
      <option value="">{any}</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  const num = (k: Key, ph: string, id: string) => (
    <input type="number" inputMode="numeric" min={0} className="field font-mono" placeholder={ph} value={f.get(k)} onChange={(e) => f.set({ [k]: e.target.value })} data-testid={'input-' + id} />
  );
  return (
    <div className="space-y-5">
      <Field label="Condition">
        <div className="grid grid-cols-3 gap-px border border-input bg-input">
          {[['', 'All'], ['new', 'New'], ['used', 'Used']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => f.set({ condition: v })} data-testid={'button-condition-' + (v || 'all')} aria-pressed={f.get('condition') === v}
              className={'py-2.5 font-wide text-[0.55rem] transition ' + (f.get('condition') === v ? 'bg-[hsl(var(--gold))] text-primary-foreground' : 'bg-muted hover:text-gold')}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label="Make">{sel('make', makeNames, 'Any make', 'make')}</Field>
      <Field label="Model">{sel('model', models, 'Any model', 'model')}</Field>
      <Field label="Year range"><div className="grid grid-cols-2 gap-2">{sel('minYear', years.map(String), 'From', 'min-year')}{sel('maxYear', years.map(String), 'To', 'max-year')}</div></Field>
      <Field label="Price range (USD)"><div className="grid grid-cols-2 gap-2">{num('minPrice', 'Min $', 'min-price')}{num('maxPrice', 'Max $', 'max-price')}</div></Field>
      <Field label="Mileage range (km)"><div className="grid grid-cols-2 gap-2">{num('minKm', 'Min km', 'min-km')}{num('maxKm', 'Max km', 'max-km')}</div></Field>
      <Field label="Fuel type">{sel('fuel', FUEL_TYPES, 'Any fuel', 'fuel')}</Field>
      <Field label="Transmission">{sel('trans', TRANSMISSIONS, 'Any transmission', 'transmission')}</Field>
      <Field label="Body type">{sel('body', BODY_TYPES, 'Any body', 'body')}</Field>
      <button type="button" onClick={f.clear} className="flex w-full items-center justify-center gap-2 border border-border py-3 font-wide text-[0.55rem] transition hover:border-[hsl(var(--gold))] hover:text-gold" data-testid="button-clear-filters">
        <RotateCcw className="h-3.5 w-3.5" /> Reset filters</button>
    </div>
  );
}

export default function CarsPage() {
  const f = useFilters();
  const { cars, isLoading, isError, refetch } = usePublicCars();
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState(f.get('q'));
  const sort = f.get('sort') || 'newest';
  const results = useMemo(() => {
    const n = (k: Key) => (f.get(k) ? Number(f.get(k)) : null);
    const term = f.get('q').toLowerCase().trim();
    return cars.filter((c) => {
      if (term && !`${c.year} ${c.make} ${c.model} ${c.trim} ${c.bodyType} ${c.fuelType} ${c.exteriorColor} ${c.features.join(' ')}`.toLowerCase().includes(term)) return false;
      if (f.get('make') && c.make !== f.get('make')) return false;
      if (f.get('model') && c.model !== f.get('model')) return false;
      if (f.get('fuel') && c.fuelType !== f.get('fuel')) return false;
      if (f.get('trans') && c.transmission !== f.get('trans')) return false;
      if (f.get('body') && c.bodyType !== f.get('body')) return false;
      if (f.get('condition') && c.condition !== f.get('condition')) return false;
      const ck = (v: number, lo: number | null, hi: number | null) => (lo === null || v >= lo) && (hi === null || v <= hi);
      return ck(c.year, n('minYear'), n('maxYear')) && ck(c.price, n('minPrice'), n('maxPrice')) && ck(c.mileage, n('minKm'), n('maxKm'));
    }).sort((a, b) => Number(a.sold) - Number(b.sold) || (SORTS[sort] ?? SORTS.newest).fn(a, b));
  }, [cars, f, sort]);
  const active = KEYS.filter((k) => k !== 'sort' && k !== 'q' && f.get(k));
  useSeo({
    title: 'Cars for Sale in Lebanon | New & Used Inventory in USD | ZAAROUR',
    description: 'Browse new and used cars for sale at ZAAROUR in Moawad, Lebanon. Filter by make, model, year, USD price, mileage in km, fuel, transmission, body type and condition.',
    path: '/cars', ld: [breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Inventory', path: '/cars' }])],
  });
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-28 md:px-10 md:pt-36">
      <nav aria-label="Breadcrumb" className="mb-6 font-wide text-[0.5rem] text-muted-foreground"><Link href="/" className="hover:text-gold">Home</Link> / <span className="text-gold">Inventory</span></nav>
      <Reveal>
        <Eyebrow>Inventory · Prices in USD</Eyebrow>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] md:text-8xl">Cars for sale <span className="italic metal-silver">in Lebanon</span></h1>
      </Reveal>
      <form onSubmit={(e) => { e.preventDefault(); f.set({ q }); }} role="search" className="mt-10 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => f.set({ q })} placeholder="Search make, model, colour, feature..." aria-label="Search inventory" className="field h-14 pl-11 text-base" data-testid="input-search" />
        </div>
        <div className="flex gap-3">
          <select value={sort} onChange={(e) => f.set({ sort: e.target.value })} aria-label="Sort cars" className="field h-14 md:w-60" data-testid="select-sort">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button type="button" onClick={() => setSheet(true)} className="flex h-14 items-center gap-2 border border-input px-5 font-wide text-[0.55rem] lg:hidden" data-testid="button-open-filters">
            <SlidersHorizontal className="h-4 w-4 text-gold" /> Filters{active.length ? ' (' + active.length + ')' : ''}</button>
        </div>
      </form>
      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {active.map((k) => (
            <button key={k} onClick={() => f.set({ [k]: '' })} className="flex items-center gap-1.5 border border-[hsl(var(--gold)/.4)] px-3 py-1.5 text-xs text-gold transition hover:bg-[hsl(var(--gold)/.1)]" data-testid={'chip-' + k}>
              {k}: {f.get(k)} <X className="h-3 w-3" /></button>
          ))}
        </div>
      )}
      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters"><div className="sticky top-28"><Filters f={f} cars={cars} /></div></aside>
        <section aria-label="Results">
          <p className="mb-5 font-mono text-xs text-muted-foreground" data-testid="text-result-count">{isLoading ? 'Loading inventory...' : results.length + ' ' + (results.length === 1 ? 'car' : 'cars') + ' found'}</p>
          {isError ? (
            <div className="border border-destructive/40 p-10 text-center"><p>Inventory could not be loaded.</p><button onClick={() => refetch()} className="btn-ghost mt-4" data-testid="button-retry">Retry</button></div>
          ) : isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center border border-dashed border-border px-6 py-20 text-center">
              <p className="font-display text-4xl">Nothing on the floor matches <span className="italic text-gold">that</span>.</p>
              <p className="mt-3 max-w-md text-muted-foreground">Loosen a filter, or tell us on WhatsApp what you are looking for — new stock arrives regularly.</p>
              <button onClick={() => { setQ(''); f.clear(); }} className="btn-gold mt-8" data-testid="button-empty-reset">Reset filters</button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{results.map((c, i) => <Reveal key={c.id} delay={(i % 3) * 0.06}><CarCard car={c} priority={i < 3} /></Reveal>)}</div>
          )}
        </section>
      </div>
      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto border-border bg-background">
          <SheetHeader><SheetTitle className="font-display text-3xl font-normal">Filters</SheetTitle></SheetHeader>
          <div className="mt-6"><Filters f={f} cars={cars} /></div>
          <button onClick={() => setSheet(false)} className="btn-gold mt-6 w-full justify-center" data-testid="button-apply-filters">Show {results.length} cars</button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

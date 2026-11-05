import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Move3d, Search } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { useSettings, useMakes } from '@/hooks/use-dealer';
import { waLink } from '@/lib/format';
import { logWhatsAppClick } from '@/lib/data';
import { BODY_TYPES } from '@/data/cars';

const HeroScene = lazy(() => import('./hero-scene'));
const HERO_PHOTO = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=2000&q=70';

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Decide whether this device should get the WebGL scene. */
function canRun3D() {
  if (typeof window === 'undefined') return false;
  if (!window.matchMedia('(min-width: 900px) and (pointer: fine)').matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 4) < 4 || (nav.deviceMemory ?? 8) < 4) return false;
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function QuickSearch() {
  const [, nav] = useLocation();
  const { data: makes } = useMakes();
  const [q, setQ] = useState(''); const [make, setMake] = useState(''); const [body, setBody] = useState(''); const [max, setMax] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q) p.set('q', q); if (make) p.set('make', make); if (body) p.set('body', body); if (max) p.set('maxPrice', max);
    nav('/cars' + (p.toString() ? '?' + p : ''));
  };
  return (
    <form onSubmit={submit} role="search" aria-label="Quick inventory search" className="grid gap-px overflow-hidden border border-white/10 bg-white/10 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
      <label className="bg-background/75 px-4 py-3"><span className="label">Search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="G63, hybrid, white..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-quick-search" /></label>
      <label className="bg-background/75 px-4 py-3"><span className="label">Make</span>
        <select value={make} onChange={(e) => setMake(e.target.value)} className="w-full bg-transparent text-sm outline-none" data-testid="select-quick-make">
          <option value="">Any make</option>{(makes ?? []).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}</select></label>
      <label className="bg-background/75 px-4 py-3"><span className="label">Body</span>
        <select value={body} onChange={(e) => setBody(e.target.value)} className="w-full bg-transparent text-sm outline-none" data-testid="select-quick-body">
          <option value="">Any body</option>{BODY_TYPES.map((b) => <option key={b}>{b}</option>)}</select></label>
      <label className="bg-background/75 px-4 py-3"><span className="label">Max price</span>
        <select value={max} onChange={(e) => setMax(e.target.value)} className="w-full bg-transparent text-sm outline-none" data-testid="select-quick-price">
          <option value="">No limit</option>{[35000, 50000, 75000, 100000, 150000].map((v) => <option key={v} value={v}>Up to ${v.toLocaleString('en-US')}</option>)}</select></label>
      <button type="submit" className="flex items-center justify-center gap-2 bg-[linear-gradient(110deg,#a8833f,#e7cf95_45%,#b48c48)] px-7 py-4 font-wide text-[0.6rem] text-primary-foreground transition hover:brightness-110 sm:col-span-2 lg:col-span-1" data-testid="button-quick-search">
        <Search className="h-4 w-4" /> Search</button>
    </form>
  );
}

export function Hero() {
  const s = useSettings();
  const reduce = !!useReducedMotion();
  const [want3D, setWant3D] = useState(false);
  const [ready, setReady] = useState(false);
  const { scrollY } = useScroll();
  const photoY = useTransform(scrollY, [0, 800], [0, 160]);
  const textY = useTransform(scrollY, [0, 600], [0, -60]);
  useEffect(() => {
    if (!canRun3D()) return;
    // Load the 3D chunk only after first paint/idle so it never blocks LCP.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => setWant3D(true);
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(go, { timeout: 2500 }); return () => (window as unknown as { cancelIdleCallback: (n: number) => void }).cancelIdleCallback(id); }
    const t = setTimeout(go, 1200); return () => clearTimeout(t);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const words = ['Luxury,', 'priced', 'in', 'plain', 'dollars.'];
  return (
    <section className="relative min-h-[100dvh] overflow-hidden" aria-labelledby="hero-title">
      {/* Photographic fallback (always rendered first; covered by 3D when ready) */}
      <motion.div style={reduce ? undefined : { y: photoY }} className={'absolute inset-0 transition-opacity duration-[1.5s] ' + (ready ? 'opacity-0' : 'opacity-100')}>
        <img src={HERO_PHOTO} alt="Black luxury sedan under showroom lights" fetchPriority="high" className="h-full w-full object-cover animate-kenburns" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,hsl(30_9%_5%)_15%,hsl(30_9%_5%/.55)_55%,hsl(30_9%_5%/.2))]" />
        <div className="absolute inset-0 overflow-hidden"><div className="absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-sweep" /></div>
      </motion.div>
      {want3D && (
        <div className={'absolute inset-0 transition-opacity duration-[1.5s] ' + (ready ? 'opacity-100' : 'opacity-0')}>
          <SceneBoundary onError={() => setReady(false)}>
            <Suspense fallback={null}><HeroScene onReady={onReady} reduceMotion={reduce} /></Suspense>
          </SceneBoundary>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[hsl(30_9%_5%)] via-[hsl(30_9%_5%/.7)] to-transparent" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background to-transparent" />

      <motion.div style={reduce ? undefined : { y: textY }} className="pointer-events-none relative z-10 mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-end px-5 pb-10 pt-28 md:px-10 md:pb-14">
        <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="font-wide text-[0.6rem] text-gold">Moawad · Beirut · Mount Lebanon</motion.p>
        <h1 id="hero-title" className="mt-5 max-w-4xl font-display text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.88] tracking-[-0.02em]">
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
              <motion.span className={'inline-block pr-[0.22em] ' + (i === 0 ? 'italic metal-gold' : i > 2 ? 'metal-silver' : '')} initial={reduce ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}>{w}</motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-6 max-w-md text-base leading-relaxed text-foreground/75">
          ZAAROUR is a new and pre-owned premium car dealership in Moawad, Lebanon. Every listing shows its full specification, mileage in kilometres, and a price in US dollars.
        </motion.p>
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }} className="pointer-events-auto mt-8 flex flex-wrap gap-3">
          <Link href="/cars" className="btn-gold" data-testid="link-hero-inventory">Browse inventory <ArrowRight className="h-4 w-4" /></Link>
          <a href={waLink(s.whatsapp, 'Hello ZAAROUR, I would like to ask about your cars.')} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)} className="btn-ghost" data-testid="link-hero-whatsapp">
            <SiWhatsapp className="h-4 w-4 text-gold" /> WhatsApp us</a>
        </motion.div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="pointer-events-auto mt-12"><QuickSearch /></motion.div>
        {ready && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-muted-foreground">
            <span className="flex items-center gap-2 font-wide text-[0.5rem] text-gold"><Move3d className="h-4 w-4" /> Drag to orbit · arrow keys rotate</span>
            <span className="pointer-events-auto">Interactive concept car — "ToyCar" by Guido Odendahl / Eric Chadwick, <a className="underline hover:text-gold" href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar" target="_blank" rel="noopener noreferrer">Khronos glTF samples</a>, CC0. Not an inventory vehicle.</span>
          </div>
        )}
      </motion.div>
    </section>
  );
}

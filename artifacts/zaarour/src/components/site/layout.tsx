import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X, MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';
import { SiWhatsapp, SiFacebook, SiInstagram, SiTiktok, SiX } from 'react-icons/si';
import { Logo } from './logo';
import { useSettings } from '@/hooks/use-dealer';
import { waLink } from '@/lib/format';
import { logWhatsAppClick } from '@/lib/data';
import { useSiteSchema } from '@/lib/seo';
import { isPlaceholderNumber } from '@/lib/settings';

const NAV = [
  { href: '/', label: 'Showroom' },
  { href: '/cars', label: 'Inventory' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function Header() {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const s = useSettings();
  useEffect(() => { const f = () => setScrolled(window.scrollY > 24); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => setOpen(false), [loc]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);
  const active = (h: string) => (h === '/' ? loc === '/' : loc.startsWith(h));
  return (
    <header className={'fixed inset-x-0 top-0 z-50 transition-all duration-500 ' + (scrolled || open ? 'border-b border-border bg-background/80 backdrop-blur-xl' : 'bg-transparent')}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:h-20 md:px-10">
        <Link href="/" aria-label="ZAAROUR home" data-testid="link-home"><Logo /></Link>
        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} data-testid={'link-nav-' + n.label.toLowerCase()} className={'group relative font-wide text-[0.6rem] transition-colors ' + (active(n.href) ? 'text-gold' : 'text-foreground/70 hover:text-foreground')}>
              {n.label}
              <span className={'absolute -bottom-2 left-0 h-px bg-[hsl(var(--gold))] transition-all duration-500 ' + (active(n.href) ? 'w-full' : 'w-0 group-hover:w-full')} />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href={waLink(s.whatsapp, 'Hello ZAAROUR')} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)} data-testid="link-header-whatsapp"
            className="hidden items-center gap-2 border border-[hsl(var(--gold)/.4)] px-4 py-2.5 font-wide text-[0.55rem] text-gold transition hover:bg-[hsl(var(--gold)/.1)] lg:inline-flex">
            <SiWhatsapp className="h-3.5 w-3.5" /> WhatsApp
          </a>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} data-testid="button-menu" className="flex h-11 w-11 items-center justify-center md:hidden">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav aria-label="Mobile" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}
            className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background px-6 pb-10 pt-8 md:hidden">
            <ul className="space-y-1">
              {NAV.map((n, i) => (
                <motion.li key={n.href} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i + 0.05 }}>
                  <Link href={n.href} data-testid={'link-mobile-' + n.label.toLowerCase()} className="flex items-baseline justify-between border-b border-border py-5">
                    <span className={'font-display text-5xl ' + (active(n.href) ? 'italic text-gold' : '')}>{n.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <a href={waLink(s.whatsapp, 'Hello ZAAROUR')} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)} className="btn-gold mt-10 w-full justify-center" data-testid="link-mobile-whatsapp">
              <SiWhatsapp className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <p className="mt-6 font-wide text-[0.55rem] text-muted-foreground">Zaarour — Moawad, Lebanon</p>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const s = useSettings();
  // Social links are placeholders ('#') until replaced in admin Settings.
  const socials = [
    { key: 'facebook', label: 'Facebook', Icon: SiFacebook, href: s.socials.facebook },
    { key: 'instagram', label: 'Instagram', Icon: SiInstagram, href: s.socials.instagram },
    { key: 'tiktok', label: 'TikTok', Icon: SiTiktok, href: s.socials.tiktok },
    { key: 'x', label: 'X (Twitter)', Icon: SiX, href: s.socials.x },
  ];
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-[hsl(30_9%_4%)]">
      <div aria-hidden className="pointer-events-none absolute -bottom-10 left-0 right-0 select-none text-center font-wide text-[18vw] leading-none text-white/[0.025]">ZAAROUR</div>
      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-12 md:px-10">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">New and pre-owned premium cars with prices in plain US dollars. Serving buyers across Beirut and Mount Lebanon from Moawad.</p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ key, label, Icon, href }) => (
              <a key={key} href={href || '#'} aria-label={label + (href === '#' ? ' (link coming soon)' : '')} data-testid={'link-social-' + key}
                {...(href && href !== '#' ? { target: '_blank', rel: 'noopener noreferrer' } : { onClick: (e: React.MouseEvent) => e.preventDefault() })}
                className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition hover:border-[hsl(var(--gold))] hover:text-gold">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <h2 className="label">Explore</h2>
          <ul className="space-y-2.5 text-sm">
            {[...NAV, { href: '/cars?condition=new', label: 'New cars' }, { href: '/cars?condition=used', label: 'Pre-owned' }].map((n) => (
              <li key={n.href}><Link href={n.href} className="text-foreground/75 transition hover:text-gold">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="label">Visit & talk</h2>
          <ul className="space-y-3 text-sm text-foreground/80">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={'tel:' + s.phone.replace(/\s/g, '')} className="font-mono hover:text-gold">{s.phone}</a>{isPlaceholderNumber(s.phone) && <span className="text-xs text-muted-foreground">(placeholder)</span>}</li>
            <li className="flex gap-3"><SiWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)} className="font-mono hover:text-gold">{s.whatsapp}</a></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="label">Hours</h2>
          <p className="flex gap-3 text-sm text-foreground/80"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s.hours}</p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 font-wide text-[0.58rem] text-gold">Plan a visit <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
      <div className="relative border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:justify-between md:px-10">
          <p>Zaarour — Moawad, Lebanon. All prices in USD.</p>
          <p>© {new Date().getFullYear()} ZAAROUR · <Link href="/admin" className="hover:text-gold">Admin</Link></p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  const s = useSettings();
  const [loc] = useLocation();
  if (loc.startsWith('/admin')) return null;
  return (
    <a href={waLink(s.whatsapp, 'Hello ZAAROUR, I have a question.')} target="_blank" rel="noopener noreferrer" onClick={() => logWhatsAppClick(null)}
      aria-label="Chat with ZAAROUR on WhatsApp" data-testid="link-whatsapp-float"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e7cf95,#a8833f)] text-primary-foreground shadow-[0_10px_40px_hsl(41_60%_40%/.35)] transition-transform hover:scale-110 md:bottom-8 md:right-8">
      <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--gold)/.3)] [animation-duration:2.8s]" />
      <SiWhatsapp className="relative h-6 w-6" />
    </a>
  );
}

/** Brief logo intro, once per session. Never blocks longer than ~1.2s; skipped for reduced motion. */
function Intro() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined' || window.location.pathname !== '/' || window.innerWidth < 900) return false;
    try { return !sessionStorage.getItem('zaarour-intro'); } catch { return false; }
  });
  useEffect(() => {
    if (!show) return;
    if (reduce) { setShow(false); return; }
    sessionStorage.setItem('zaarour-intro', '1');
    const t = setTimeout(() => setShow(false), 1250);
    return () => clearTimeout(t);
  }, [show, reduce]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background"
          exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}>
          <div className="text-center">
            <motion.div initial={{ opacity: 0, letterSpacing: '0.8em' }} animate={{ opacity: 1, letterSpacing: '0.42em' }} transition={{ duration: 1 }} className="font-wide text-2xl metal-gold md:text-4xl">ZAAROUR</motion.div>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.1 }} className="hairline mx-auto mt-5 w-56 origin-left" />
            <p className="mt-4 font-wide text-[0.5rem] text-muted-foreground">Moawad · Lebanon</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const reduce = useReducedMotion();
  const s = useSettings();
  useSiteSchema(s);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [loc]);
  return (
    <div className="min-h-[100dvh]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-background focus:p-3">Skip to content</a>
      <Intro />
      <Header />
      <motion.main id="main" key={loc} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

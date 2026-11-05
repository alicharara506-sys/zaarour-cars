import { Link } from 'wouter';
import { useSeo } from '@/lib/seo';

export default function NotFound() {
  useSeo({ title: 'Page not found | ZAAROUR', description: 'This page does not exist.', path: '/404' });
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col items-center justify-center px-5 pt-24 text-center">
      <p className="font-mono text-8xl metal-gold">404</p>
      <h1 className="mt-6 font-display text-5xl">Wrong turn.</h1>
      <p className="mt-3 text-muted-foreground">This road doesn&rsquo;t lead to the showroom.</p>
      <div className="mt-8 flex gap-3"><Link href="/" className="btn-gold">Showroom</Link><Link href="/cars" className="btn-ghost">Inventory</Link></div>
    </div>
  );
}

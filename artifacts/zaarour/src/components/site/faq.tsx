import { useState } from 'react';
import { Plus } from 'lucide-react';
import { faqs } from '@/data/faqs';

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border border-y border-border">
      {faqs.map((f, i) => (
        <div key={i}>
          <h3>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={'faq-' + i} data-testid={'button-faq-' + i}
              className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-2xl transition hover:text-gold md:text-3xl">
              {f.q}<Plus className={'h-5 w-5 shrink-0 text-gold transition-transform duration-300 ' + (open === i ? 'rotate-45' : '')} />
            </button>
          </h3>
          <div id={'faq-' + i} className={'grid transition-all duration-500 ' + (open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
            <div className="overflow-hidden"><p className="max-w-2xl pb-6 text-muted-foreground">{f.a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

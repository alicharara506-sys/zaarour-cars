import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

/** Scroll reveal: fades/slides children in once. */
export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/** Counter that animates when scrolled into view. */
export function Counter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setN(value); return; }
    const c = animate(0, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, reduce]);
  return <span ref={ref}>{prefix}{new Intl.NumberFormat('en-US').format(n)}{suffix}</span>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={'flex items-center gap-3 font-wide text-[0.6rem] text-gold ' + className}>
      <span className="h-px w-8 bg-[hsl(var(--gold))]" />{children}
    </div>
  );
}

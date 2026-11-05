/** ZAAROUR wordmark: wide-set Michroma with a gold "speed line" Z. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={'inline-flex items-center gap-2.5 ' + className}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <defs><linearGradient id="zg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f2deaa" /><stop offset=".5" stopColor="#b48c48" /><stop offset="1" stopColor="#e9d29a" /></linearGradient></defs>
        <path d="M5 6h22L12 22h15v4H5l15-16H5z" fill="url(#zg)" />
        <path d="M2 14h7M1 18h5" stroke="#b48c48" strokeWidth="1.2" />
      </svg>
      <span className="font-wide text-[0.95rem] tracking-[0.32em] metal-silver">ZAAROUR</span>
    </span>
  );
}

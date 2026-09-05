import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/today" className="brand" aria-label="الطريق إلى برلين — الرئيسية">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 42 42" role="img">
          <path d="M6 32.5C12 30 13 21 20 19c7-2 7-9 16-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 6" />
          <path d="M27 8h10v12h-3v-3h-4v3h-3V8Z" fill="currentColor" />
          <path d="M7 29h5v7H7z" fill="currentColor" />
        </svg>
      </span>
      {!compact && <span><strong>الطريق إلى برلين</strong><small lang="de" dir="ltr">DER WEG NACH BERLIN</small></span>}
    </Link>
  );
}

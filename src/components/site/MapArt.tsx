/** Decorative street-map illustration used on the landing page (no map service). */
export function MapArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 200" role="img" aria-label="Ilustrasi peta" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="200" fill="#f6f4dc" />
      <path d="M0 150 C60 110 90 160 150 120 S250 60 320 90" stroke="#a9cdf7" strokeWidth="10" fill="none" />
      <path d="M40 0 C70 50 30 90 80 130 S120 200 110 200" stroke="#a9cdf7" strokeWidth="6" fill="none" />
      <rect x="18" y="20" width="48" height="34" rx="6" fill="#bfe8b5" />
      <rect x="230" y="130" width="60" height="40" rx="6" fill="#bfe8b5" />
      <rect x="170" y="20" width="40" height="28" rx="6" fill="#bfe8b5" />
      <path d="M0 70 L320 160" stroke="#f3e27a" strokeWidth="14" />
      <path d="M140 0 L190 200" stroke="#f3e27a" strokeWidth="12" />
      <path d="M260 0 L230 200" stroke="#f3e27a" strokeWidth="8" />
      <path d="M0 30 L320 20 M0 190 L320 175 M100 0 L60 200" stroke="#ffffff" strokeWidth="5" />
      <g transform="translate(176 72)">
        <path d="M0 26 C-14 10 -14 0 0 -4 C14 0 14 10 0 26z" fill="#ea7b25" />
        <circle cx="0" cy="6" r="4.5" fill="#fff" />
      </g>
    </svg>
  );
}

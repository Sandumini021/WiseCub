type CubMascotProps = {
  size?: number;
};

export function CubMascot({ size = 168 }: CubMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 180"
      role="img"
      aria-label="Cub the WiseCub companion"
    >
      <ellipse cx="80" cy="168" rx="42" ry="8" fill="#1b2744" opacity="0.18" />
      <circle cx="48" cy="42" r="16" fill="#c9844a" />
      <circle cx="112" cy="42" r="16" fill="#c9844a" />
      <circle cx="48" cy="42" r="8" fill="#5c3a1e" />
      <circle cx="112" cy="42" r="8" fill="#5c3a1e" />
      <circle cx="80" cy="78" r="46" fill="#e0a05a" />
      <ellipse cx="80" cy="92" rx="28" ry="22" fill="#f7d7b5" />
      <circle cx="64" cy="72" r="6" fill="#1b2744" />
      <circle cx="96" cy="72" r="6" fill="#1b2744" />
      <ellipse cx="80" cy="88" rx="8" ry="6" fill="#5c3a1e" />
      <path d="M70 100 Q80 110 90 100" fill="none" stroke="#5c3a1e" strokeWidth="3" />
      <path d="M42 108 Q80 128 118 108 L118 158 Q80 172 42 158 Z" fill="#1b2744" />
      <path d="M58 118 Q80 132 102 118 L98 150 Q80 158 62 150 Z" fill="#f5c400" />
      <circle cx="80" cy="136" r="7" fill="#1b2744" />
      <path d="M70 136 Q80 148 90 136" fill="#fff59a" />
    </svg>
  );
}

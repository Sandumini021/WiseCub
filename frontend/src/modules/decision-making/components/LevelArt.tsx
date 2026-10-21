import type { LevelIcon } from "../types/decisionMaking";

type LevelArtProps = {
  icon: LevelIcon;
  size?: number;
};

export function LevelArt({ icon, size = 88 }: LevelArtProps) {
  const common = { width: size, height: size, viewBox: "0 0 88 88", "aria-hidden": true as const };
  if (icon === "gift") {
    return (
      <svg {...common}>
        <rect x="18" y="38" width="52" height="36" rx="6" fill="#f5c400" />
        <rect x="40" y="38" width="8" height="36" fill="#c45f24" />
        <path d="M18 38h52v10H18z" fill="#e07a3d" />
        <path d="M44 24c-10 0-14 12-8 14h8" fill="#2f7d4a" />
        <path d="M44 24c10 0 14 12 8 14H44" fill="#0f6b5c" />
      </svg>
    );
  }
  if (icon === "loan") {
    return (
      <svg {...common}>
        <circle cx="32" cy="40" r="14" fill="#f7d7b5" />
        <circle cx="58" cy="44" r="14" fill="#e0a05a" />
        <rect x="22" y="60" width="46" height="10" rx="5" fill="#1b2744" />
      </svg>
    );
  }
  if (icon === "bnpl") {
    return (
      <svg {...common}>
        <rect x="16" y="28" width="56" height="36" rx="8" fill="#1b2744" />
        <rect x="16" y="34" width="56" height="8" fill="#f5c400" />
        <rect x="24" y="50" width="18" height="6" rx="2" fill="#fff" />
      </svg>
    );
  }
  if (icon === "festival") {
    return (
      <svg {...common}>
        <path d="M44 16 54 40H34z" fill="#e07a3d" />
        <rect x="41" y="40" width="6" height="28" fill="#5c3a1e" />
        <circle cx="28" cy="58" r="8" fill="#f5c400" />
        <circle cx="60" cy="58" r="8" fill="#2f7d4a" />
      </svg>
    );
  }
  if (icon === "phone") {
    return (
      <svg {...common}>
        <rect x="30" y="14" width="28" height="52" rx="6" fill="#1b2744" />
        <rect x="34" y="20" width="20" height="36" rx="2" fill="#7ec8ff" />
        <path d="M24 70 64 22" stroke="#c45f24" strokeWidth="5" />
        <circle cx="64" cy="70" r="8" fill="#f5c400" />
      </svg>
    );
  }
  if (icon === "salary") {
    return (
      <svg {...common}>
        <rect x="20" y="24" width="48" height="40" rx="6" fill="#2f7d4a" />
        <text x="44" y="50" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">
          Rs
        </text>
      </svg>
    );
  }
  if (icon === "family") {
    return (
      <svg {...common}>
        <circle cx="32" cy="34" r="10" fill="#e0a05a" />
        <circle cx="56" cy="32" r="12" fill="#c9844a" />
        <path d="M16 70c4-16 14-16 16-16s12 0 16 16" fill="#1b2744" />
        <path d="M40 70c4-18 16-18 18-18s14 2 16 18" fill="#1b2744" />
      </svg>
    );
  }
  if (icon === "surprise") {
    return (
      <svg {...common}>
        <circle cx="44" cy="44" r="22" fill="#fff4c2" stroke="#e6b325" strokeWidth="4" />
        <rect x="41" y="28" width="6" height="22" rx="2" fill="#1b2744" />
        <circle cx="44" cy="58" r="3.5" fill="#1b2744" />
      </svg>
    );
  }
  if (icon === "goal") {
    return (
      <svg {...common}>
        <circle cx="44" cy="44" r="22" fill="#e8eef8" />
        <circle cx="44" cy="44" r="14" fill="#fff" />
        <circle cx="44" cy="44" r="6" fill="#e07a3d" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M18 58 44 22 70 58Z" fill="#f5c400" />
      <circle cx="44" cy="48" r="8" fill="#1b2744" />
    </svg>
  );
}

import React from 'react';
import { CharacterEmotionalState, CharacterPhysicalCondition } from '../../types/emotion.types';

interface SquirrelCharacterSvgProps {
  condition: CharacterPhysicalCondition;
  emotion: CharacterEmotionalState;
  size?: number;
  className?: string;
}

export const SquirrelCharacterSvg: React.FC<SquirrelCharacterSvgProps> = ({
  condition,
  emotion,
  size = 200,
  className = '',
}) => {
  const isWorried = emotion === 'WORRIED' || condition === 'NEEDS_CARE' || condition === 'SHELTER_UNPREPARED';
  const isAnxious = emotion === 'ANXIOUS' || condition === 'SETBACK_WAITING' || condition === 'WEATHER_IMPACTED';
  const isTempted = emotion === 'TEMPTED';
  const isHopeful = emotion === 'HOPEFUL';
  const isRelieved = emotion === 'RELIEVED';
  const isConfident = emotion === 'CONFIDENT';
  const isSecure = emotion === 'HAPPY_AND_SECURE' || emotion === 'JOYFUL_HEALTHY' || condition === 'HEALTHY_ACTIVE' || condition === 'WINTER_READY';

  const hasScarf = isConfident || isSecure;
  const hasAcornBasket = isRelieved || isConfident || isSecure;
  const hasSnowHearth = isSecure;

  return (
    <div
      className={`squirrel-svg-stage ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={`Nutty the Squirrel in ${condition} condition and feeling ${emotion}`}
    >
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="squirrel-svg"
      >
        <defs>
          {/* Squirrel Body & Fur Gradients */}
          <radialGradient id="squirrelFur" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="squirrelBelly" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#fef3c7" />
          </radialGradient>
          <radialGradient id="squirrelTail" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
          <linearGradient id="acornCap" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="acornBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <style>
          {`
            .squirrel-tail { transform-origin: 170px 170px; animation: tailSway 3.5s ease-in-out infinite; }
            .squirrel-eye-sparkle { animation: eyeTwinkle 2.5s ease-in-out infinite; }
            .squirrel-ears { transform-origin: 120px 80px; }
            .breath-motion { animation: gentleBreath 3s ease-in-out infinite; transform-origin: 120px 150px; }
            @keyframes tailSway {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(${isSecure ? '7deg' : isAnxious ? '-4deg' : '4deg'}); }
            }
            @keyframes eyeTwinkle {
              0%, 90%, 100% { opacity: 1; }
              95% { opacity: 0.3; }
            }
            @keyframes gentleBreath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
          `}
        </style>

        {/* Ambient Ground Shadow */}
        <ellipse cx="120" cy="216" rx="65" ry="12" fill="#1e293b" opacity="0.15" />

        {/* Big Bushy Squirrel Tail (Behind body) */}
        <g className="squirrel-tail">
          <path
            d="M 140 185 C 190 190 230 155 220 95 C 210 40 150 15 130 50 C 115 75 140 95 155 105 C 180 120 185 155 145 180 Z"
            fill="url(#squirrelTail)"
          />
          {/* Tail Fur Texture Highlights */}
          <path
            d="M 145 170 C 180 175 210 145 205 95 C 195 55 155 35 140 55"
            stroke="#fef3c7"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
          />
        </g>

        {/* Winter Hearth Glow if secure */}
        {hasSnowHearth && (
          <g opacity="0.4" filter="url(#softGlow)">
            <circle cx="50" cy="180" r="28" fill="#f59e0b" />
            <circle cx="50" cy="180" r="14" fill="#ef4444" />
          </g>
        )}

        {/* Body Group (Gentle breathing motion) */}
        <g className="breath-motion">
          {/* Main Body */}
          <ellipse cx="120" cy="160" rx="42" ry="48" fill="url(#squirrelFur)" />
          {/* Fluffy Chest/Belly */}
          <ellipse cx="114" cy="165" rx="26" ry="34" fill="url(#squirrelBelly)" />

          {/* Left Foot */}
          <ellipse cx="88" cy="208" rx="14" ry="8" fill="#92400e" />
          {/* Right Foot */}
          <ellipse cx="146" cy="208" rx="14" ry="8" fill="#92400e" />

          {/* Squirrel Head */}
          <ellipse cx="118" cy="100" rx="36" ry="32" fill="url(#squirrelFur)" />
          {/* Snout/Muzzle */}
          <ellipse cx="108" cy="112" rx="18" ry="14" fill="url(#squirrelBelly)" />

          {/* Ears with Tufted Tips */}
          <g className="squirrel-ears">
            {/* Left Ear */}
            <path
              d={isWorried || isAnxious
                ? "M 92 84 C 80 82 72 95 86 100 Z"
                : "M 92 84 C 80 60 90 45 102 74 Z"}
              fill="url(#squirrelFur)"
            />
            {/* Left Ear Inner */}
            <path
              d={isWorried || isAnxious
                ? "M 90 86 C 82 85 78 94 86 98 Z"
                : "M 94 82 C 86 64 92 55 100 76 Z"}
              fill="#fbbf24"
              opacity="0.6"
            />
            {/* Right Ear */}
            <path
              d={isWorried || isAnxious
                ? "M 136 80 C 148 80 156 92 142 98 Z"
                : "M 136 80 C 148 55 138 42 126 72 Z"}
              fill="url(#squirrelFur)"
            />
            {/* Right Ear Inner */}
            <path
              d={isWorried || isAnxious
                ? "M 138 82 C 146 83 150 91 142 96 Z"
                : "M 134 78 C 142 59 136 50 128 73 Z"}
              fill="#fbbf24"
              opacity="0.6"
            />
          </g>

          {/* Cute Squirrel Nose */}
          <ellipse cx="104" cy="108" rx="4.5" ry="3.5" fill="#451a03" />

          {/* Mouth & Expression */}
          {isSecure ? (
            // Big Joyful Open Smile
            <path d="M 98 114 Q 106 126 116 114 Z" fill="#b91c1c" stroke="#451a03" strokeWidth="1.5" />
          ) : isConfident || isRelieved || isHopeful ? (
            // Cheerful Smile
            <path d="M 98 114 Q 106 122 114 114" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          ) : isTempted ? (
            // Quizzical Smirk looking at treat
            <path d="M 100 115 Q 108 120 115 113" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            // Worried / Anxious Frown
            <path d="M 98 118 Q 106 113 114 118" fill="none" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Whiskers */}
          <line x1="88" y1="110" x2="68" y2="108" stroke="#78350f" strokeWidth="1.2" opacity="0.6" />
          <line x1="88" y1="114" x2="70" y2="116" stroke="#78350f" strokeWidth="1.2" opacity="0.6" />
          <line x1="124" y1="110" x2="144" y2="108" stroke="#78350f" strokeWidth="1.2" opacity="0.6" />
          <line x1="124" y1="114" x2="142" y2="116" stroke="#78350f" strokeWidth="1.2" opacity="0.6" />

          {/* Eyes */}
          {isRelieved ? (
            // Content Closed Arc Eyes (^ ^)
            <g>
              <path d="M 90 98 Q 97 90 104 98" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
              <path d="M 116 98 Q 123 90 130 98" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : (
            // Open Expressive Eyes
            <g>
              {/* Left Eye */}
              <circle cx="96" cy="96" r="7" fill="#1e293b" />
              <circle cx="94" cy="94" r="2.5" fill="#ffffff" className="squirrel-eye-sparkle" />
              {/* Right Eye */}
              <circle cx="122" cy="96" r="7" fill="#1e293b" />
              <circle cx="120" cy="94" r="2.5" fill="#ffffff" className="squirrel-eye-sparkle" />
              {/* Worried Eyebrows */}
              {(isWorried || isAnxious) && (
                <g stroke="#78350f" strokeWidth="2" strokeLinecap="round">
                  <path d="M 90 87 Q 96 90 102 85" />
                  <path d="M 116 85 Q 122 90 128 87" />
                </g>
              )}
            </g>
          )}

          {/* Cozy Green Winter Scarf if Confident or Secure */}
          {hasScarf && (
            <g>
              <rect x="94" y="128" width="46" height="14" rx="7" fill="url(#scarfGrad)" />
              {/* Scarf Tails hanging down */}
              <path d="M 124 136 L 132 170 L 144 168 L 136 136 Z" fill="url(#scarfGrad)" />
              <line x1="132" y1="170" x2="144" y2="168" stroke="#fef08a" strokeWidth="3" />
            </g>
          )}

          {/* Front Paws */}
          {/* Left Arm / Paw holding Acorn or on chest */}
          <ellipse cx="90" cy="154" rx="9" ry="12" fill="#d97706" transform="rotate(-15 90 154)" />
          {/* Right Arm / Paw */}
          <ellipse cx="138" cy="154" rx="9" ry="12" fill="#d97706" transform="rotate(15 138 154)" />

          {/* Held Item: Acorn Basket or Big Golden Acorn */}
          {hasAcornBasket && (
            <g transform="translate(100, 150)">
              {/* Acorn Body */}
              <ellipse cx="14" cy="18" rx="10" ry="12" fill="url(#acornBody)" />
              {/* Acorn Cap */}
              <path d="M 4 14 C 4 7 24 7 24 14 Z" fill="url(#acornCap)" />
              <rect x="13" y="2" width="2.5" height="6" rx="1" fill="#451a03" />
              <circle cx="11" cy="15" r="2" fill="#fef3c7" opacity="0.6" />
            </g>
          )}

          {/* Temptation Candy if in Level 3 Tempted state */}
          {isTempted && (
            <g transform="translate(142, 140)">
              <line x1="0" y1="20" x2="10" y2="0" stroke="#f8fafc" strokeWidth="2.5" />
              <circle cx="10" cy="0" r="8" fill="#ef4444" />
              <path d="M 7 -3 Q 10 3 13 -3" stroke="#fef08a" strokeWidth="2" fill="none" />
            </g>
          )}

          {/* Shivering rain droplet if Anxious */}
          {isAnxious && (
            <g opacity="0.8">
              <path d="M 80 75 C 77 75 75 80 80 86 C 85 80 83 75 80 75 Z" fill="#38bdf8" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

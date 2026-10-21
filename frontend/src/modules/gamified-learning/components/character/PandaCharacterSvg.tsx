import React from 'react';
import { CharacterEmotionalState, CharacterPhysicalCondition } from '../../types/emotion.types';

interface PandaCharacterSvgProps {
  condition: CharacterPhysicalCondition;
  emotion: CharacterEmotionalState;
  size?: number;
  className?: string;
}

export const PandaCharacterSvg: React.FC<PandaCharacterSvgProps> = ({
  condition,
  emotion,
  size = 200,
  className = '',
}) => {
  const isExcited = emotion === 'EXCITED';
  const isWorried = emotion === 'WORRIED' || condition === 'NEEDS_CARE';
  const isConfused = emotion === 'CONFUSED';
  const isStressed = emotion === 'STRESSED' || condition === 'SETBACK_WAITING';
  const isHopeful = emotion === 'HOPEFUL';
  const isRelieved = emotion === 'RELIEVED';
  const isConfident = emotion === 'CONFIDENT';
  const isProud = emotion === 'PROUD_AND_HAPPY' || emotion === 'JOYFUL_HEALTHY' || condition === 'HEALTHY_ACTIVE';

  const hasTreasurerBadge = isConfident || isProud || isHopeful;
  const hasCharityChest = isProud;
  const hasConfetti = isProud || isExcited;

  return (
    <div
      className={`panda-svg-stage ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={`Bao Bao the Panda in ${condition} condition and feeling ${emotion}`}
    >
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="panda-svg"
      >
        <defs>
          {/* Panda Shading Gradients */}
          <radialGradient id="pandaFurWhite" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </radialGradient>
          <radialGradient id="pandaFurBlack" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="70%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </radialGradient>
          <radialGradient id="pandaBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="goldBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="charityChestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse cx="120" cy="216" rx="68" ry="14" fill="#000000" opacity="0.12" />

        {/* Celebration Confetti in Background when Proud or Excited */}
        {hasConfetti && (
          <g className="panda-confetti-layer">
            <circle cx="45" cy="40" r="3" fill="#ec4899" />
            <circle cx="195" cy="45" r="3.5" fill="#3b82f6" />
            <circle cx="35" cy="85" r="2.5" fill="#eab308" />
            <circle cx="205" cy="80" r="3" fill="#10b981" />
            <rect x="50" y="60" width="5" height="5" fill="#8b5cf6" transform="rotate(25 50 60)" />
            <rect x="180" y="65" width="6" height="6" fill="#f59e0b" transform="rotate(40 180 65)" />
            <polygon points="120,18 123,24 130,25 125,30 126,36 120,33 114,36 115,30 110,25 117,24" fill="#fbbf24" />
          </g>
        )}

        {/* Panda Body Group */}
        <g id="pandaBodyGroup">
          {/* Panda Left Ear */}
          <circle cx="68" cy="62" r="24" fill="url(#pandaFurBlack)" />
          <circle cx="70" cy="64" r="14" fill="#111827" opacity="0.4" />

          {/* Panda Right Ear */}
          <circle cx="172" cy="62" r="24" fill="url(#pandaFurBlack)" />
          <circle cx="170" cy="64" r="14" fill="#111827" opacity="0.4" />

          {/* White Head Base */}
          <ellipse cx="120" cy="116" rx="68" ry="60" fill="url(#pandaFurWhite)" />

          {/* Characteristic Black Eye Patches */}
          {/* Left Eye Patch */}
          <ellipse
            cx="92"
            cy="114"
            rx="18"
            ry="23"
            fill="url(#pandaFurBlack)"
            transform="rotate(-18 92 114)"
          />
          {/* Right Eye Patch */}
          <ellipse
            cx="148"
            cy="114"
            rx="18"
            ry="23"
            fill="url(#pandaFurBlack)"
            transform="rotate(18 148 114)"
          />

          {/* Eyes Expressions based on Emotion */}
          {isExcited && (
            <>
              {/* Starry Excited Eyes */}
              <circle cx="94" cy="112" r="7" fill="#ffffff" />
              <polygon points="94,107 96,111 100,112 96,113 94,117 92,113 88,112 92,111" fill="#fef08a" />
              <circle cx="146" cy="112" r="7" fill="#ffffff" />
              <polygon points="146,107 148,111 152,112 148,113 146,117 144,113 140,112 144,111" fill="#fef08a" />
            </>
          )}

          {isWorried && (
            <>
              {/* Drooping Worried Pupils */}
              <ellipse cx="94" cy="116" rx="5" ry="6" fill="#ffffff" />
              <circle cx="95" cy="117" r="3.5" fill="#111827" />
              <circle cx="93" cy="115" r="1.5" fill="#ffffff" />

              <ellipse cx="146" cy="116" rx="5" ry="6" fill="#ffffff" />
              <circle cx="145" cy="117" r="3.5" fill="#111827" />
              <circle cx="147" cy="115" r="1.5" fill="#ffffff" />
            </>
          )}

          {isConfused && (
            <>
              {/* Swirly / Questioning Eyes */}
              <circle cx="94" cy="112" r="6" fill="#ffffff" />
              <circle cx="95" cy="113" r="3" fill="#111827" />
              <path d="M 142 114 Q 146 108 150 114" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="175" y="80" fontSize="22" fontWeight="bold" fill="#3b82f6">?</text>
            </>
          )}

          {isStressed && (
            <>
              {/* Wide Stressed Eyes + Sweat Bead */}
              <circle cx="94" cy="113" r="6.5" fill="#ffffff" />
              <circle cx="94" cy="113" r="2.5" fill="#111827" />
              <circle cx="146" cy="113" r="6.5" fill="#ffffff" />
              <circle cx="146" cy="113" r="2.5" fill="#111827" />
              {/* Sweat drop on brow */}
              <path d="M 68 85 Q 64 92 68 96 Q 72 92 68 85" fill="#38bdf8" />
            </>
          )}

          {isHopeful && (
            <>
              {/* Sparkling Hopeful Eyes */}
              <circle cx="94" cy="111" r="6.5" fill="#ffffff" />
              <circle cx="95" cy="111" r="3.5" fill="#111827" />
              <circle cx="92" cy="109" r="2" fill="#ffffff" />
              <circle cx="146" cy="111" r="6.5" fill="#ffffff" />
              <circle cx="145" cy="111" r="3.5" fill="#111827" />
              <circle cx="148" cy="109" r="2" fill="#ffffff" />
            </>
          )}

          {isRelieved && (
            <>
              {/* Soft Smiling Crescent Eyes */}
              <path d="M 87 114 Q 93 108 99 114" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 141 114 Q 147 108 153 114" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}

          {isConfident && (
            <>
              {/* Bright Confident Eyes */}
              <circle cx="94" cy="111" r="6.5" fill="#ffffff" />
              <circle cx="94" cy="111" r="3.5" fill="#111827" />
              <circle cx="92" cy="109" r="2" fill="#ffffff" />
              <circle cx="146" cy="111" r="6.5" fill="#ffffff" />
              <circle cx="146" cy="111" r="3.5" fill="#111827" />
              <circle cx="148" cy="109" r="2" fill="#ffffff" />
            </>
          )}

          {isProud && (
            <>
              {/* Joyful Crescent Twinkle Eyes */}
              <path d="M 86 112 Q 93 104 100 112" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 140 112 Q 147 104 154 112" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <circle cx="102" cy="106" r="1.5" fill="#fef08a" />
              <circle cx="156" cy="106" r="1.5" fill="#fef08a" />
            </>
          )}

          {/* Cute Rosy Cheeks */}
          <circle cx="76" cy="130" r="12" fill="url(#pandaBlush)" />
          <circle cx="164" cy="130" r="12" fill="url(#pandaBlush)" />

          {/* Muzzle & Nose */}
          <ellipse cx="120" cy="134" rx="20" ry="14" fill="#ffffff" />
          <path
            d="M 113 128 C 113 125, 127 125, 127 128 C 127 133, 120 136, 120 136 C 120 136, 113 133, 113 128 Z"
            fill="#1f2937"
          />

          {/* Mouth depending on Emotion */}
          {isStressed ? (
            <path d="M 112 144 Q 116 141 120 144 Q 124 147 128 144" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : isWorried ? (
            <path d="M 113 146 Q 120 141 127 146" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : isExcited || isProud ? (
            <path d="M 111 140 Q 120 154 129 140 Z" fill="#ef4444" stroke="#374151" strokeWidth="2" />
          ) : (
            <path d="M 112 141 Q 120 149 128 141" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Torso & Shoulders */}
          <path
            d="M 68 165 C 68 145, 172 145, 172 165 C 185 185, 185 210, 168 214 C 145 218, 95 218, 72 214 C 55 210, 55 185, 68 165 Z"
            fill="url(#pandaFurBlack)"
          />
          {/* White Chest Patch */}
          <ellipse cx="120" cy="192" rx="38" ry="24" fill="url(#pandaFurWhite)" />

          {/* Front Paws */}
          <ellipse cx="80" cy="195" rx="14" ry="11" fill="#111827" />
          <ellipse cx="160" cy="195" rx="14" ry="11" fill="#111827" />

          {/* Student Treasurer Gold Badge */}
          {hasTreasurerBadge && (
            <g transform="translate(108, 172)">
              <circle cx="12" cy="12" r="10" fill="url(#goldBadgeGrad)" stroke="#b45309" strokeWidth="1.5" />
              <text x="12" y="15" fontSize="9" fontWeight="bold" fill="#78350f" textAnchor="middle">★</text>
            </g>
          )}

          {/* Charity Collection Box for Finale / Proud State */}
          {hasCharityChest && (
            <g transform="translate(86, 178)">
              {/* Gold Charity Box */}
              <rect x="0" y="0" width="68" height="34" rx="5" fill="url(#charityChestGrad)" stroke="#78350f" strokeWidth="2" />
              <rect x="6" y="5" width="56" height="5" rx="2.5" fill="#451a03" />
              <text x="34" y="24" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">📚 CHARITY</text>
              {/* Gold Coin Stacks spilling out */}
              <circle cx="12" cy="-4" r="5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="56" cy="-4" r="5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
              <circle cx="34" cy="-8" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              <text x="34" y="-6" fontSize="7" fontWeight="bold" fill="#713f12" textAnchor="middle">Rs</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

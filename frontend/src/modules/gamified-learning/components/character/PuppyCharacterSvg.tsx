import React from 'react';
import { CharacterEmotionalState, CharacterPhysicalCondition } from '../../types/emotion.types';

interface PuppyCharacterSvgProps {
  condition: CharacterPhysicalCondition;
  emotion: CharacterEmotionalState;
  size?: number;
  className?: string;
}

export const PuppyCharacterSvg: React.FC<PuppyCharacterSvgProps> = ({
  condition,
  emotion,
  size = 200,
  className = '',
}) => {
  // Determine facial expression and accessories based on condition & emotion
  const isSad = emotion === 'ANXIOUS' || emotion === 'WORRIED' || condition === 'NEEDS_CARE';
  const isHopeful = emotion === 'HOPEFUL' || emotion === 'VULNERABLE';
  const isHappy = emotion === 'CHEERFUL' || emotion === 'RELIEVED';
  const isCelebratory = emotion === 'JOYFUL_HEALTHY' || condition === 'HEALTHY_ACTIVE';
  const hasBandage = condition === 'NEEDS_CARE' || condition === 'WEAK_STABILIZED' || condition === 'SETBACK_WAITING';
  const hasClinicBlanket = condition === 'RECEIVING_TREATMENT';
  const hasHealedStar = condition === 'RECOVERING' || condition === 'HEALTHY_ACTIVE';
  const hasMedal = condition === 'HEALTHY_ACTIVE';

  return (
    <div
      className={`puppy-svg-stage ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={`Barnaby the Puppy in ${condition} condition and feeling ${emotion}`}
    >
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="puppy-svg"
      >
        <defs>
          <radialGradient id="puppyFur" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f7d08a" />
            <stop offset="70%" stopColor="#e3a857" />
            <stop offset="100%" stopColor="#c88b39" />
          </radialGradient>
          <radialGradient id="puppyEar" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#c88b39" />
            <stop offset="100%" stopColor="#9e6620" />
          </radialGradient>
          <linearGradient id="clinicBlanketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Shadow under character */}
        <ellipse cx="120" cy="210" rx="65" ry="14" fill="#000000" opacity="0.15" />

        {/* Celebration Sparkles / Confetti for Healthy Active State */}
        {isCelebratory && (
          <g className="celebration-sparkles">
            <circle cx="45" cy="55" r="4" fill="#f59e0b" />
            <circle cx="195" cy="50" r="4.5" fill="#10b981" />
            <path d="M 50 30 L 53 38 L 61 41 L 53 44 L 50 52 L 47 44 L 39 41 L 47 38 Z" fill="#fbbf24" />
            <path d="M 185 35 L 188 41 L 194 43 L 188 45 L 185 51 L 182 45 L 176 43 L 182 41 Z" fill="#38bdf8" />
            <circle cx="210" cy="110" r="3.5" fill="#f43f5e" />
          </g>
        )}

        {/* Puppy Body */}
        <g id="puppy-body" filter="url(#softGlow)">
          {/* Tail */}
          <path
            d={
              isCelebratory || isHappy
                ? "M 160 170 Q 195 150 190 125 Q 180 135 155 160 Z"
                : "M 160 175 Q 185 185 180 195 Q 170 190 155 175 Z"
            }
            fill="#c88b39"
            className={isCelebratory || isHappy ? "wagging-tail" : ""}
          />

          {/* Main Torso */}
          <ellipse cx="120" cy="165" rx="42" ry="40" fill="url(#puppyFur)" />

          {/* Cream Chest Patch */}
          <ellipse cx="120" cy="172" rx="24" ry="26" fill="#fff5e6" />

          {/* Back Paws */}
          <ellipse cx="85" cy="200" rx="14" ry="10" fill="#c88b39" />
          <ellipse cx="155" cy="200" rx="14" ry="10" fill="#c88b39" />

          {/* Front Left Paw */}
          <ellipse cx="102" cy="204" rx="12" ry="9" fill="#c88b39" />

          {/* Front Right Paw (Injured / Bandaged / Healed) */}
          {hasBandage ? (
            <g id="bandaged-paw">
              <ellipse cx="138" cy="202" rx="14" ry="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Medical cross / bandage wrap lines */}
              <line x1="130" y1="198" x2="146" y2="206" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="130" y1="206" x2="146" y2="198" stroke="#e2e8f0" strokeWidth="2" />
              <rect x="135" y="199" width="6" height="6" fill="#ef4444" rx="1" />
            </g>
          ) : (
            <g id="healthy-paw">
              <ellipse cx="138" cy="204" rx="12" ry="9" fill="#c88b39" />
              {hasHealedStar && (
                <circle cx="138" cy="202" r="3" fill="#10b981" />
              )}
            </g>
          )}

          {/* Clinic Blanket (for Receiving Treatment level) */}
          {hasClinicBlanket && (
            <g id="clinic-blanket">
              <path
                d="M 85 155 Q 120 145 155 155 L 158 190 Q 120 200 82 190 Z"
                fill="url(#clinicBlanketGrad)"
                opacity="0.95"
              />
              <circle cx="120" cy="172" r="6" fill="#ffffff" opacity="0.8" />
              <path d="M 118 169 L 122 169 L 122 175 L 118 175 Z" fill="#0f766e" />
            </g>
          )}

          {/* Puppy Collar with Medal */}
          <path d="M 96 136 Q 120 145 144 136" stroke="#e07a3d" strokeWidth="6" strokeLinecap="round" fill="none" />
          {hasMedal ? (
            <g id="rescue-gold-medal">
              <circle cx="120" cy="148" r="9" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
              <path d="M 120 142 L 122 146 L 126 147 L 123 150 L 124 154 L 120 152 L 116 154 L 117 150 L 114 147 L 118 146 Z" fill="#ffffff" />
            </g>
          ) : (
            <circle cx="120" cy="144" r="4.5" fill="#0f6b5c" />
          )}
        </g>

        {/* Puppy Head & Face */}
        <g id="puppy-head" filter="url(#softGlow)">
          {/* Left Ear */}
          <path
            d={
              isSad
                ? "M 82 85 Q 50 110 58 145 Q 75 140 85 105 Z" // Droopy sad ear
                : isCelebratory || isHappy
                ? "M 82 85 Q 52 70 60 115 Q 76 125 85 105 Z" // Perked up happy ear
                : "M 82 85 Q 55 95 62 130 Q 76 130 85 105 Z"
            }
            fill="url(#puppyEar)"
          />

          {/* Right Ear */}
          <path
            d={
              isSad
                ? "M 158 85 Q 190 110 182 145 Q 165 140 155 105 Z" // Droopy sad ear
                : isCelebratory || isHappy
                ? "M 158 85 Q 188 70 180 115 Q 164 125 155 105 Z" // Perked up happy ear
                : "M 158 85 Q 185 95 178 130 Q 164 130 155 105 Z"
            }
            fill="url(#puppyEar)"
          />

          {/* Head Base */}
          <ellipse cx="120" cy="95" rx="42" ry="38" fill="url(#puppyFur)" />

          {/* Forehead Mark */}
          <path d="M 115 62 Q 120 74 125 62 Z" fill="#fff5e6" />

          {/* Muzzle */}
          <ellipse cx="120" cy="108" rx="22" ry="17" fill="#fff5e6" />

          {/* Nose */}
          <path
            d="M 114 100 Q 120 98 126 100 Q 128 107 120 109 Q 112 107 114 100 Z"
            fill="#1f2937"
          />

          {/* Mouth */}
          {isCelebratory ? (
            // Big open happy smile with pink tongue
            <g id="happy-mouth">
              <path d="M 112 110 Q 120 124 128 110" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 115 116 Q 120 128 125 116 Z" fill="#f43f5e" />
            </g>
          ) : isHappy || isHopeful ? (
            // Gentle warm smile
            <path d="M 112 110 Q 120 117 128 110" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : isSad ? (
            // Quivering worried mouth
            <path d="M 113 115 Q 120 110 127 115" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            // Neutral mouth line
            <path d="M 114 112 Q 120 114 126 112" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Eyes */}
          {isSad ? (
            <g id="sad-eyes">
              {/* Left Eye */}
              <ellipse cx="102" cy="90" rx="5.5" ry="6.5" fill="#1f2937" />
              <circle cx="100" cy="88" r="2" fill="#ffffff" />
              <path d="M 96 82 Q 102 85 108 81" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Tear drop */}
              <circle cx="98" cy="98" r="1.5" fill="#38bdf8" />

              {/* Right Eye */}
              <ellipse cx="138" cy="90" rx="5.5" ry="6.5" fill="#1f2937" />
              <circle cx="136" cy="88" r="2" fill="#ffffff" />
              <path d="M 132 81 Q 138 85 144 82" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          ) : isCelebratory || isHappy ? (
            <g id="joyful-eyes">
              {/* Curved smiling eye arches */}
              <path d="M 96 89 Q 102 82 108 89" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 132 89 Q 138 82 144 89" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Sparkle highlights */}
              <circle cx="102" cy="81" r="1.5" fill="#f59e0b" />
              <circle cx="138" cy="81" r="1.5" fill="#f59e0b" />
              {/* Soft rosy cheeks */}
              <ellipse cx="90" cy="102" rx="6" ry="4" fill="#fb7185" opacity="0.5" />
              <ellipse cx="150" cy="102" rx="6" ry="4" fill="#fb7185" opacity="0.5" />
            </g>
          ) : (
            <g id="open-curious-eyes">
              {/* Left Eye */}
              <ellipse cx="102" cy="88" rx="6" ry="7" fill="#1f2937" />
              <circle cx="100" cy="86" r="2.5" fill="#ffffff" />
              <circle cx="104" cy="91" r="1" fill="#ffffff" />
              <path d="M 96 80 Q 102 78 108 81" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Right Eye */}
              <ellipse cx="138" cy="88" rx="6" ry="7" fill="#1f2937" />
              <circle cx="136" cy="86" r="2.5" fill="#ffffff" />
              <circle cx="140" cy="91" r="1" fill="#ffffff" />
              <path d="M 132 81 Q 138 78 144 80" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

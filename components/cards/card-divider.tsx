/**
 * Card Divider Component
 * ----------------------------------------------------------------------------
 * Renders a decorative divider for domain cards with gradient background
 * and type label text overlay.
 */

import React from 'react';
import Image from 'next/image';
import { getDomainTheme } from '@/lib/domain-colors';

interface CardDividerProps {
  domain?: string;
  subtype?: string;  // The card subtype (e.g., "ABILITY", "SPELL", etc.)
  size?: 'small' | 'large';
}

// Symmetrical hexagonal clip-path for the divider
const DIVIDER_CLIP_PATH = 'polygon(40% 10%, 60% 10%, 75% 60%, 70% 90%, 40% 90%, 30% 50%)';

export function CardDivider({ domain, subtype, size = 'small' }: CardDividerProps) {
  const theme = getDomainTheme(domain);
  const textColor = theme.textColor;

  // Size configurations - image needs to be taller to show decorative frame
  const dimensions = size === 'small'
    ? {
      containerHeight: 30,
      imageHeight: 58, // Taller to show gold frame decorations
      imageTop: -14,
      fontSize: '9px',
      letterSpacing: '1px',
      marginTop: -15 // Reduce (e.g., to 4) to move divider and text closer to the image
    }
    : {
      containerHeight: 40,
      imageHeight: 75, // Taller to show gold frame decorations
      imageTop: -18,
      fontSize: '12px',
      letterSpacing: '1.5px',
      marginTop: 12 // Reduce (e.g., to 6) to move divider and text closer to the image
    };

  return (
    <div className="relative w-full" style={{ height: dimensions.containerHeight, marginTop: dimensions.marginTop }}>
      {/* Gradient background with clip */}
      <div
        className="absolute w-full z-10"
        style={{
          height: dimensions.containerHeight * 0.7, // 30% shorter to look less "big"
          top: dimensions.containerHeight * 0.15,   // Centered vertically
          background: `linear-gradient(to right, ${theme.secondary}, ${theme.primary}, ${theme.accent})`,
          clipPath: DIVIDER_CLIP_PATH,
        }}
      />

      {/* Divider decoration image - must be taller to show gold frame */}
      <Image
        src="/assets/card/divider-domain.webp"
        alt=""
        width={340}
        height={dimensions.imageHeight}
        className="absolute z-20 w-full"
        style={{
          top: `${dimensions.imageTop}px`,
          height: `${dimensions.imageHeight}px`,
          objectFit: 'contain' // Use contain instead of cover to preserve decorations
        }}
      />

      {/* Type/subtype label text - only shows subtype */}
      {subtype && (
        <div
          className="absolute z-30 font-eveleth font-bold uppercase text-center w-full flex items-center justify-center"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            color: textColor,
            fontSize: dimensions.fontSize,
            letterSpacing: dimensions.letterSpacing,
          }}
        >
          {subtype}
        </div>
      )}
    </div>
  );
}

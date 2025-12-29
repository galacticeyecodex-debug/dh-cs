/**
 * Card Divider Component
 * ----------------------------------------------------------------------------
 * Renders a decorative divider for domain cards with gradient background
 * and type label text overlay (matching daggerheartbrews style).
 */

import React from 'react';
import Image from 'next/image';
import { getDomainTheme, getContrastColor } from '@/lib/domain-colors';

interface CardDividerProps {
  domain?: string;
  subtype?: string;  // The card subtype (e.g., "ABILITY", "SPELL", etc.)
  size?: 'small' | 'large';
}

export function CardDivider({ domain, subtype, size = 'small' }: CardDividerProps) {
  const theme = getDomainTheme(domain);
  const textColor = getContrastColor(theme.primary);

  // Size configurations - image needs to be taller to show decorative frame
  const dimensions = size === 'small'
    ? {
        containerHeight: 30,
        imageHeight: 58, // Taller to show gold frame decorations
        imageTop: -14,
        fontSize: '9px',
        letterSpacing: '1px',
        marginTop: 8
      }
    : {
        containerHeight: 40,
        imageHeight: 75, // Taller to show gold frame decorations
        imageTop: -18,
        fontSize: '12px',
        letterSpacing: '1.5px',
        marginTop: 12
      };

  return (
    <div className="relative w-full" style={{ height: dimensions.containerHeight, marginTop: dimensions.marginTop }}>
      {/* Gradient background with clip */}
      <div
        className="absolute w-full clip-card-divider z-10"
        style={{
          height: dimensions.containerHeight,
          top: 0,
          background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
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

      {/* Type/subtype label text - only shows subtype per daggerheartbrews */}
      {subtype && (
        <div
          className="absolute z-30 font-bold uppercase text-center w-full flex items-center justify-center"
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

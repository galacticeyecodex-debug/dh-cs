/**
 * Card Divider Component
 * ----------------------------------------------------------------------------
 * Renders a decorative divider for domain cards with gradient background
 * and domain label text overlay.
 */

import React from 'react';
import Image from 'next/image';
import { getDomainTheme, getContrastColor } from '@/lib/domain-colors';

interface CardDividerProps {
  domain?: string;
  type?: string;
  size?: 'small' | 'large';
}

export function CardDivider({ domain, type, size = 'small' }: CardDividerProps) {
  const theme = getDomainTheme(domain);
  const textColor = getContrastColor(theme.primary);

  // Size configurations
  const dimensions = size === 'small'
    ? { height: 30, fontSize: '9px', letterSpacing: '1px', marginTop: 8 }
    : { height: 40, fontSize: '12px', letterSpacing: '1.5px', marginTop: 12 };

  return (
    <div className="relative w-full" style={{ height: dimensions.height, marginTop: dimensions.marginTop }}>
      {/* Gradient background with clip */}
      <div
        className="absolute w-full clip-card-divider z-10"
        style={{
          height: dimensions.height,
          top: 0,
          background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
        }}
      />

      {/* Divider decoration image */}
      <Image
        src="/assets/card/divider-domain.webp"
        alt=""
        width={340}
        height={dimensions.height}
        className="absolute z-20 w-full object-cover"
        style={{ top: '-14px', height: dimensions.height }}
      />

      {/* Domain label text */}
      {domain && (
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
          {domain} {type && `- ${type}`}
        </div>
      )}
    </div>
  );
}

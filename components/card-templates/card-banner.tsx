/**
 * Card Banner Component
 * ----------------------------------------------------------------------------
 * Renders a decorative banner for domain cards using the daggerheartbrews
 * asset styling approach. Creates a layered effect with WebP decoration,
 * clipped color backgrounds, and centered content.
 */

import React from 'react';
import Image from 'next/image';
import { getDomainTheme, getContrastColor } from '@/lib/domain-colors';

interface CardBannerProps {
  domain?: string;
  level: number;
  size?: 'small' | 'large';
}

export function CardBanner({ domain, level, size = 'small' }: CardBannerProps) {
  const theme = getDomainTheme(domain);
  const textColor = getContrastColor(theme.primary);

  // Size configurations
  const dimensions = size === 'small'
    ? { width: 120, height: 63, fontSize: '14px' }
    : { width: 180, height: 95, fontSize: '24px' };

  return (
    <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
      {/* Banner decoration image */}
      <Image
        src="/assets/card/banner.webp"
        alt=""
        width={dimensions.width}
        height={dimensions.height}
        className="absolute z-50"
        style={{ top: '-4px', left: 0 }}
      />

      {/* Colored background layers with clip paths */}
      <div
        className="absolute clip-card-banner-fg z-20"
        style={{
          width: dimensions.width,
          height: dimensions.height - 4,
          backgroundColor: theme.primary,
          left: 0,
          top: 0,
        }}
      />
      <div
        className="absolute clip-card-banner-bg z-10"
        style={{
          width: dimensions.width,
          height: dimensions.height - 4,
          backgroundColor: theme.secondary,
          left: 0,
          top: 0,
        }}
      />

      {/* Level number centered */}
      <div
        className="absolute z-50 font-bold flex items-center justify-center"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          color: textColor,
          fontSize: dimensions.fontSize,
        }}
      >
        {level}
      </div>
    </div>
  );
}

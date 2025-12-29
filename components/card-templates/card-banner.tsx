/**
 * Card Banner Component
 * ----------------------------------------------------------------------------
 * Renders a decorative banner for domain cards using the daggerheartbrews
 * asset styling approach. Creates a layered effect with WebP decoration,
 * clipped color backgrounds, and centered content with domain icon.
 */

import React from 'react';
import Image from 'next/image';
import { getDomainTheme, getContrastColor } from '@/lib/domain-colors';
import {
  ArcanaDomainIcon,
  BladeDomainIcon,
  BoneDomainIcon,
  CodexDomainIcon,
  DreadDomainIcon,
  GraceDomainIcon,
  MidnightDomainIcon,
  SageDomainIcon,
  SplendorDomainIcon,
  ValorDomainIcon,
} from '@/components/icons';

// Get the domain icon component for a given domain
const getDomainIcon = (domain?: string) => {
  switch (domain?.toLowerCase()) {
    case 'arcana':
      return ArcanaDomainIcon;
    case 'blade':
      return BladeDomainIcon;
    case 'bone':
      return BoneDomainIcon;
    case 'codex':
      return CodexDomainIcon;
    case 'grace':
      return GraceDomainIcon;
    case 'midnight':
      return MidnightDomainIcon;
    case 'sage':
      return SageDomainIcon;
    case 'splendor':
      return SplendorDomainIcon;
    case 'valor':
      return ValorDomainIcon;
    case 'dread':
      return DreadDomainIcon;
    default:
      return null;
  }
};

interface CardBannerProps {
  domain?: string;
  level: number;
  size?: 'small' | 'large';
}

export function CardBanner({ domain, level, size = 'small' }: CardBannerProps) {
  const theme = getDomainTheme(domain);
  const textColor = getContrastColor(theme.primary);

  // Size configurations matching daggerheartbrews exactly
  // Full size (340px cards): banner 63x120px, clips 59x120px
  // Thumbnail (240px cards): scale by 240/340 = 0.706
  const dimensions = size === 'small'
    ? {
        bannerWidth: 44,    // 63 * 0.706
        bannerHeight: 85,   // 120 * 0.706
        clipWidth: 42,      // 59 * 0.706
        clipHeight: 85,     // 120 * 0.706
        clipOffset: 1,      // 2 * 0.706
        fontSize: '18px',   // 26 * 0.706
        textTop: '11px',    // 16 * 0.706
        iconTop: '38px',    // 54 * 0.706
        iconSize: '22px',   // 32 * 0.706
      }
    : {
        bannerWidth: 63,
        bannerHeight: 120,
        clipWidth: 59,
        clipHeight: 120,
        clipOffset: 2,
        fontSize: '26px',
        textTop: '16px',
        iconTop: '54px',
        iconSize: '32px',
      };

  const DomainIcon = getDomainIcon(domain);

  return (
    <div className="relative" style={{ width: dimensions.bannerWidth, height: dimensions.bannerHeight }}>
      {/* Banner decoration image - z-40 per daggerheartbrews */}
      <Image
        src="/assets/card/banner.webp"
        alt=""
        width={dimensions.bannerWidth}
        height={dimensions.bannerHeight}
        className="absolute z-40"
        style={{ top: 0, left: 0 }}
      />

      {/* Foreground clip (primary color) - z-30, narrower and offset */}
      <div
        className="clip-card-banner-fg absolute z-30"
        style={{
          top: 0,
          left: `${dimensions.clipOffset}px`,
          width: `${dimensions.clipWidth}px`,
          height: `${dimensions.clipHeight}px`,
          background: theme.primary,
        }}
      />

      {/* Background clip (secondary color) - z-20, narrower and offset */}
      <div
        className="clip-card-banner-bg absolute z-20"
        style={{
          top: 0,
          left: `${dimensions.clipOffset}px`,
          width: `${dimensions.clipWidth}px`,
          height: `${dimensions.clipHeight}px`,
          background: theme.secondary,
        }}
      />

      {/* Level number - centered horizontally at top per daggerheartbrews */}
      <div
        className="absolute z-50 font-bold"
        style={{
          top: dimensions.textTop,
          left: '50%',
          transform: 'translateX(-50%)',
          color: textColor,
          fontSize: dimensions.fontSize,
        }}
      >
        {level}
      </div>

      {/* Domain icon - centered below level number per daggerheartbrews */}
      {DomainIcon && (
        <div
          className="absolute z-50"
          style={{
            top: dimensions.iconTop,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <DomainIcon
            style={{
              height: dimensions.iconSize,
              width: dimensions.iconSize,
              color: textColor,
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Card Banner Component
 * ----------------------------------------------------------------------------
 * Renders a decorative banner for domain cards.
 */

import React from 'react';
import Image from 'next/image';
import { getDomainTheme } from '@/lib/domain-colors';
import {
  ArcanaDomainIcon,
  BladeDomainIcon,
  BloodDomainIcon,
  BoneDomainIcon,
  CodexDomainIcon,
  DreadDomainIcon,
  GraceDomainIcon,
  MidnightDomainIcon,
  SageDomainIcon,
  SplendorDomainIcon,
  ValorDomainIcon,
} from '@/components/domain-icons';

// Get the domain icon component for a given domain
const getDomainIcon = (domain?: string) => {
  switch (domain?.toLowerCase()) {
    case 'arcana':
      return ArcanaDomainIcon;
    case 'blade':
      return BladeDomainIcon;
    case 'blood':
      return BloodDomainIcon;
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

// Clip-path polygons for precise banner matching
const BANNER_CLIP_PATH = `polygon(
  2% 2%,
  11% 2%,
  11% 51%,
  17% 55%,
  18% 2%,
  82% 2%,
  83% 56%,
  88% 52%,
  88% 2%,
  98% 2%,
  99% 58%,
  81% 67%,
  81% 90%,
  69% 88%,
  65% 86%,
  57% 82%,
  49% 80%,
  41% 85%,
  31% 87%,
  25% 88%,
  18% 90%,
  18% 68%,
  2% 57%
)`; // Upper banner tails

const BANNER_BG_CLIP_PATH = `polygon(
  91% 98%,
  91% 0,
  8% 0%,
  9% 98%,
  29% 96%,
  39% 93%,
  45% 90%,
  47% 80%,
  46% 83%,
  46% 79%,
  53% 79%,
  53% 84%,
  53% 87%,
  56% 91%,
  60% 93%,
  75% 97%
)`; // Lower banner tails

export function CardBanner({ domain, level, size = 'small' }: CardBannerProps) {
  const theme = getDomainTheme(domain);
  const textColor = theme.textColor;

  // Size configurations matching official dimensions
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
      {/* Banner decoration image */}
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
        className="absolute z-30"
        style={{
          top: 0,
          left: `${dimensions.clipOffset}px`,
          width: `${dimensions.clipWidth}px`,
          height: `${dimensions.clipHeight}px`,
          background: `linear-gradient(to bottom, ${theme.primary} 10%, ${theme.secondary})`,
          clipPath: BANNER_CLIP_PATH,
        }}
      />

      {/* Background clip (secondary color) - z-20, narrower and offset */}
      <div
        className="absolute z-20"
        style={{
          top: 0,
          left: `${dimensions.clipOffset}px`,
          width: `${dimensions.clipWidth}px`,
          height: `${dimensions.clipHeight}px`,
          background: `linear-gradient(to bottom, transparent 30%, rgba(0, 0, 0, 0.6) 60%, transparent 100%), ${theme.primary}`,
          clipPath: BANNER_BG_CLIP_PATH,
        }}
      />
      {/* Level number - centered horizontally at top */}
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

      {/* Domain icon - centered below level number */}
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

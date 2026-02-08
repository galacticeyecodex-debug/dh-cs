/**
 * Domain Card Template
 * ----------------------------------------------------------------------------
 * Domain card rendering using art assets layout and assets.
 */

import React from 'react';
import Image from 'next/image';
import { MarkdownText } from '@/components/shared/markdown-text';
import { CardBanner } from './card-banner';
import { CardDivider } from './card-divider';
import { Z_INDEX } from '@/constants/z-index';

export interface DomainCardProps {
  name: string;
  domain?: string;
  tier: number;
  type?: string;
  description?: string;
  recallCost?: string | number;
  customImageUrl?: string;
  customImageType?: 'artwork' | 'full-card';
  /** Image position as percentages (0-100). x=50, y=0 means centered horizontally, top-aligned */
  customImagePosition?: { x: number; y: number };
  onClick?: () => void;
  size?: 'thumbnail' | 'full';
}

export function DomainCard({
  name,
  domain,
  tier,
  type,
  description,
  recallCost = '0',
  customImageUrl,
  customImageType = 'artwork',
  customImagePosition = { x: 50, y: 0 },
  onClick,
  size = 'thumbnail',
}: DomainCardProps) {
  const isFullCard = customImageUrl && customImageType === 'full-card';
  const isThumbnail = size === 'thumbnail';

  // If it's a full custom card, just show the image
  if (isFullCard) {
    return (
      <div
        className={`aspect-[2/3] rounded-lg overflow-hidden transition-all relative ${onClick ? 'hover:ring-2 hover:ring-dagger-gold cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <Image
          src={customImageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={isThumbnail ? "(max-width: 768px) 50vw, 33vw" : "400px"}
        />
      </div>
    );
  }

  // Fixed width: 340px for full, scaled proportionally for thumbnail
  const cardWidth = isThumbnail ? 240 : 340;
  const fontSize = isThumbnail ? 0.7 : 1; // Scale factor for text

  // Dynamic font size for longer descriptions to prevent clipping
  const descriptionBaseSize = (description?.length || 0) > 400 ? 12 : 14;

  return (
    <div
      // A thin gold border around the domain cards
      // 'isolate' creates a stacking context so internal z-indices don't leak out
      className={`relative isolate aspect-card overflow-hidden rounded-lg shadow-lg transition-shadow bg-white text-black border border-dagger-gold ${onClick ? 'cursor-pointer hover:shadow-2xl' : ''}`}
      style={{ width: cardWidth }}
      onClick={onClick}
    >
      {/* Banner - top left */}
      <div className="absolute" style={{ left: isThumbnail ? '5px' : '24px', top: '-4px', zIndex: Z_INDEX.CARD_DECORATION }}>
        <CardBanner domain={domain} level={tier} size={isThumbnail ? 'small' : 'large'} />
      </div>

      {/* Recall Cost Badge */}
      <div className="absolute" style={{ right: isThumbnail ? '14px' : '24px', top: isThumbnail ? '14px' : '24px', zIndex: Z_INDEX.CARD_DECORATION }}>
        <Image
          src="/assets/card/recall-cost-bg.webp"
          alt=""
          width={isThumbnail ? 28 : 32}
          height={isThumbnail ? 28 : 32}
        />
      </div>
      {/* Recall cost text - offset from center to account for lightning bolt */}
      <div
        className="absolute text-white font-eveleth font-bold"
        style={{
          right: isThumbnail ? '27px' : '40px',  // x-axis; left of center of badge
          top: isThumbnail ? '19.5px' : '29px',    // y-axis; center
          fontSize: `${isThumbnail ? 11 : 14}px`,
          zIndex: Z_INDEX.CARD_DECORATION,
        }}
      >
        {recallCost}
      </div>

      {/* Image area - optional custom artwork */}
      {customImageUrl && customImageType === 'artwork' ? (
        <div className="relative w-full overflow-hidden" style={{ height: isThumbnail ? '160px' : '230px' }}>
          <Image
            src={customImageUrl}
            alt={name}
            fill
            className="object-cover"
            style={{ objectPosition: `${customImagePosition.x}% ${customImagePosition.y}%` }}
            sizes={isThumbnail ? "(max-width: 768px) 50vw, 240px" : "340px"}
          />
        </div>
      ) : null}

      {/* Content section - positioned right at image border */}
      <div
        className="absolute flex flex-col items-center gap-0.5 bg-white w-full"
        style={{
          top: customImageUrl ? (isThumbnail ? '140px' : '230px') : (isThumbnail ? '125px' : '180px'),
          bottom: 0,
        }}
      >
        {/* Divider */}
        <div className="relative w-full">
          <CardDivider domain={domain} subtype={type} size={isThumbnail ? 'small' : 'large'} />
        </div>

        {/* Card Name */}
        <p
          className="font-eveleth font-bold text-center w-full uppercase"
          style={{
            zIndex: Z_INDEX.CARD_CONTENT,
            fontSize: `${16 * fontSize}px`,
            paddingLeft: `${16 * fontSize}px`,
            paddingRight: `${16 * fontSize}px`,
          }}
        >
          {name}
        </p>

        {/* Description */}
        <div
          className="w-full leading-none px-4 text-pretty overflow-hidden flex-1"
          style={{
            zIndex: Z_INDEX.CARD_CONTENT,
            fontSize: `${descriptionBaseSize * fontSize}px`,
          }}
        >
          {description ? (
            <MarkdownText>{description}</MarkdownText>
          ) : (
            <p className="italic text-gray-500">No description.</p>
          )}
        </div>
      </div>

    </div>
  );
}

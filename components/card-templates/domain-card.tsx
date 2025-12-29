/**
 * Domain Card Template
 * ----------------------------------------------------------------------------
 * Domain card rendering using art assets layout and assets.
 */

import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Swords } from 'lucide-react';
import { getDomainTheme } from '@/lib/domain-colors';
import { CardBanner } from './card-banner';
import { CardDivider } from './card-divider';

export interface DomainCardProps {
  name: string;
  domain?: string;
  tier: number;
  type?: string;
  description?: string;
  recallCost?: string | number;
  customImageUrl?: string;
  customImageType?: 'artwork' | 'full-card';
  hasPassiveModifiers?: boolean;
  hasCombatAbility?: boolean;
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
  hasPassiveModifiers,
  hasCombatAbility,
  onClick,
  size = 'thumbnail',
}: DomainCardProps) {
  const theme = getDomainTheme(domain);
  const isFullCard = customImageUrl && customImageType === 'full-card';
  const isThumbnail = size === 'thumbnail';

  // If it's a full custom card, just show the image
  if (isFullCard) {
    return (
      <div
        className="aspect-[2/3] rounded-lg overflow-hidden hover:ring-2 hover:ring-dagger-gold transition-all cursor-pointer relative"
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

  return (
    <div
      // A thin gold border around the domain cards
      className="relative aspect-card overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow bg-white text-black border border-dagger-gold"
      style={{ width: cardWidth }}
      onClick={onClick}
    >
      {/* Banner - top left */}
      <div className="absolute" style={{ left: isThumbnail ? '17px' : '24px', top: '-4px', zIndex: 40 }}>
        <CardBanner domain={domain} level={tier} size={isThumbnail ? 'small' : 'large'} />
      </div>

      {/* Recall Cost Badge */}
      <div className="absolute" style={{ right: isThumbnail ? '14px' : '24px', top: isThumbnail ? '14px' : '24px', zIndex: 40 }}>
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
          right: isThumbnail ? '27px' : '40px',  // At badge center (badge_right + badge_width/2)
          top: isThumbnail ? '19px' : '29px',    // 5px down from badge top
          fontSize: `${isThumbnail ? 11 : 14}px`,
          zIndex: 41,
        }}
      >
        {recallCost}
      </div>

      {/* Modifier and combat mechanic badge - top right below recall cost */}
      {(hasPassiveModifiers || hasCombatAbility) && (
        <div
          className="absolute flex flex-col items-center gap-1"
          style={{
            right: isThumbnail ? '14px' : '24px',
            top: isThumbnail ? '46px' : '60px',
            zIndex: 40,
          }}
        >
          {hasPassiveModifiers && (
            <div
              className="rounded-full px-1.5 py-0.5 flex items-center gap-0.5 border-2 shadow-lg"
              style={{
                backgroundColor: `${theme.primary}dd`,
                borderColor: theme.accent,
              }}
              title="Has passive modifiers"
            >
              <Sparkles size={isThumbnail ? 10 : 14} className="text-white" />
            </div>
          )}
          {hasCombatAbility && (
            <div
              className="rounded-full px-1.5 py-0.5 flex items-center gap-0.5 border-2 shadow-lg"
              style={{
                backgroundColor: `${theme.primary}dd`,
                borderColor: theme.accent,
              }}
              title="Has combat ability"
            >
              <Swords size={isThumbnail ? 10 : 14} className="text-white" />
            </div>
          )}
        </div>
      )}

      {/* Image area - optional custom artwork */}
      {customImageUrl && customImageType === 'artwork' ? (
        <div className="relative w-full overflow-hidden" style={{ height: isThumbnail ? '160px' : '230px' }}>
          <Image
            src={customImageUrl}
            alt={name}
            fill
            className="object-cover object-center-top"
            sizes={isThumbnail ? "(max-width: 768px) 50vw, 240px" : "340px"}
          />
        </div>
      ) : null}

      {/* Content section - positioned right at image border */}
      <div
        className="absolute flex flex-col items-center gap-1 bg-white w-full"
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
          className="font-eveleth font-bold text-center w-full z-20 uppercase"
          style={{
            fontSize: `${16 * fontSize}px`,
            paddingTop: `${2 * fontSize}px`,
            paddingLeft: `${16 * fontSize}px`,
            paddingRight: `${16 * fontSize}px`,
          }}
        >
          {name}
        </p>

        {/* Description */}
        <div
          className="w-full z-20 leading-tight px-4 text-pretty overflow-hidden flex-1"
          style={{
            fontSize: `${12 * fontSize}px`,
          }}
        >
          {description ? (
            <ReactMarkdown>{description}</ReactMarkdown>
          ) : (
            <p className="italic text-gray-500">No description.</p>
          )}
        </div>
      </div>

    </div>
  );
}

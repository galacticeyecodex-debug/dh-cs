/**
 * Domain Card Template
 * ----------------------------------------------------------------------------
 * Professional domain card rendering using daggerheartbrews layout and assets.
 * Matches the exact structure and styling of daggerheartbrews.com cards.
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

  // Professional card layout matching daggerheartbrews.com
  // Fixed width: 340px for full, scaled proportionally for thumbnail
  const cardWidth = isThumbnail ? 240 : 340;
  const fontSize = isThumbnail ? 0.7 : 1; // Scale factor for text

  return (
    <div
      className="relative aspect-card overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow bg-white text-black"
      style={{ width: cardWidth }}
      onClick={onClick}
    >
      {/* Banner - top left */}
      <div className="absolute" style={{ left: isThumbnail ? '17px' : '24px', top: '-4px', zIndex: 40 }}>
        <CardBanner domain={domain} level={tier} size={isThumbnail ? 'small' : 'large'} />
      </div>

      {/* Recall Cost Badge - top right */}
      <div className="absolute" style={{ right: isThumbnail ? '17px' : '24px', top: isThumbnail ? '17px' : '24px', zIndex: 40 }}>
        <div className="relative">
          <Image
            src="/assets/card/recall-cost-bg.webp"
            alt=""
            width={isThumbnail ? 24 : 32}
            height={isThumbnail ? 24 : 32}
          />
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-bold"
            style={{ fontSize: `${isThumbnail ? 10 : 14}px` }}
          >
            {recallCost}
          </div>
        </div>
      </div>

      {/* Mechanic Badges - top right below recall cost */}
      {(hasPassiveModifiers || hasCombatAbility) && (
        <div
          className="absolute flex flex-col items-center gap-1"
          style={{
            right: isThumbnail ? '17px' : '24px',
            top: isThumbnail ? '45px' : '60px',
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
        <div className="relative w-full overflow-hidden" style={{ height: isThumbnail ? '175px' : '250px' }}>
          <Image
            src={customImageUrl}
            alt={name}
            fill
            className="object-cover object-center-top"
            sizes={isThumbnail ? "(max-width: 768px) 50vw, 240px" : "340px"}
          />
        </div>
      ) : null}

      {/* Content section at bottom with white background */}
      <div
        className="absolute bottom-0 flex flex-col items-center gap-1 bg-white w-full"
        style={{
          minHeight: customImageUrl ? (isThumbnail ? '120px' : '170px') : (isThumbnail ? '160px' : '230px'),
          paddingBottom: isThumbnail ? '8px' : '12px',
        }}
      >
        {/* Divider */}
        <div className="relative w-full">
          <CardDivider domain={domain} subtype={type} size={isThumbnail ? 'small' : 'large'} />
        </div>

        {/* Card Name */}
        <p
          className="font-serif font-bold text-center w-full z-20"
          style={{
            fontSize: `${16 * fontSize}px`,
            paddingTop: `${16 * fontSize}px`,
            paddingLeft: `${24 * fontSize}px`,
            paddingRight: `${24 * fontSize}px`,
          }}
        >
          {name}
        </p>

        {/* Description */}
        <div
          className="w-full z-20 leading-tight px-6 text-pretty overflow-hidden"
          style={{
            fontSize: `${12 * fontSize}px`,
            maxHeight: customImageUrl ? (isThumbnail ? '60px' : '90px') : (isThumbnail ? '100px' : '150px'),
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

/**
 * Domain Card Template
 * ----------------------------------------------------------------------------
 * Professional domain card rendering using daggerheartbrews-inspired assets
 * and styling. Supports custom artwork backgrounds and full card images.
 */

import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Zap, Sparkles, Swords } from 'lucide-react';
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

  // Professional card with assets
  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-2xl"
      style={{
        aspectRatio: '2/3',
        backgroundColor: '#18181b',
        border: `2px solid ${theme.primary}`,
      }}
      onClick={onClick}
    >
      {/* Custom Artwork Background */}
      {customImageUrl && customImageType === 'artwork' && (
        <div className="absolute inset-0 z-0">
          <Image
            src={customImageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes={isThumbnail ? "(max-width: 768px) 50vw, 33vw" : "400px"}
          />
          {/* Gradient overlay for readability */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${theme.primary}dd 0%, ${theme.secondary}aa 50%, ${theme.secondary}ee 100%)`,
            }}
          />
        </div>
      )}

      {/* Subtle gradient background when no custom image */}
      {!customImageUrl && (
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          }}
        />
      )}

      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col p-3">
        {/* Top Section: Banner and Recall Cost */}
        <div className="flex justify-between items-start mb-2">
          {/* Level Banner */}
          <CardBanner domain={domain} level={tier} size={isThumbnail ? 'small' : 'large'} />

          {/* Recall Cost Badge */}
          <div className="relative">
            <Image
              src="/assets/card/recall-cost-bg.webp"
              alt=""
              width={isThumbnail ? 32 : 48}
              height={isThumbnail ? 32 : 48}
              className="relative"
            />
            <div
              className="absolute inset-0 flex items-center justify-center font-bold text-white"
              style={{ fontSize: isThumbnail ? '10px' : '14px' }}
            >
              {recallCost}
            </div>
            <Zap
              size={isThumbnail ? 10 : 14}
              className="absolute text-yellow-400"
              style={{ bottom: 2, right: 2 }}
            />
          </div>
        </div>

        {/* Domain Divider */}
        <CardDivider domain={domain} type={type} size={isThumbnail ? 'small' : 'large'} />

        {/* Card Name */}
        <div className="text-center mt-2 px-1">
          <h3
            className="font-serif font-bold text-white leading-tight drop-shadow-lg"
            style={{ fontSize: isThumbnail ? '14px' : '20px' }}
          >
            {name}
          </h3>
        </div>

        {/* Description */}
        <div
          className="flex-1 mt-2 overflow-hidden text-white leading-snug text-center px-1"
          style={{ fontSize: isThumbnail ? '9px' : '12px' }}
        >
          {description ? (
            <div className="prose prose-invert line-clamp-6 drop-shadow">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          ) : (
            <p className="italic text-gray-400">No description.</p>
          )}
        </div>

        {/* Mechanic Badges */}
        {(hasPassiveModifiers || hasCombatAbility) && (
          <div className="absolute top-20 right-2 flex flex-col items-center gap-1">
            {hasPassiveModifiers && (
              <div
                className="rounded-full px-2 py-1 flex items-center gap-1 border-2 shadow-lg"
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
                className="rounded-full px-2 py-1 flex items-center gap-1 border-2 shadow-lg"
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
      </div>
    </div>
  );
}

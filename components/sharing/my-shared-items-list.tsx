/**
 * MY SHARED ITEMS LIST
 * ----------------------------------------------------------------------------
 * Displays items that the current user has shared with others.
 * Users can manage their shares by unsharing items.
 */

'use client';

import { useEffect } from 'react';
import { Package, Trash2, Users, Calendar, Loader2 } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import type { SharedHomebrew } from '@/types/sharing';

interface MySharedItemsListProps {
  compact?: boolean;
}

export function MySharedItemsList({ compact = false }: MySharedItemsListProps) {
  const {
    sharedByMe,
    campaigns,
    fetchSharedByMe,
    unshareHomebrewItem,
  } = useCharacterStore();

  useEffect(() => {
    fetchSharedByMe();
  }, [fetchSharedByMe]);

  if (sharedByMe.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 mx-auto text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">
          You haven&apos;t shared any items yet.
        </p>
      </div>
    );
  }

  // Get campaign name helper
  const getCampaignName = (campaignId: string | null) => {
    if (!campaignId) return 'Unknown';
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || 'Unknown Campaign';
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {sharedByMe.map((item) => (
        <MySharedItemCard
          key={item.id}
          item={item}
          compact={compact}
          campaignName={getCampaignName(item.shared_with_campaign_id)}
          onUnshare={() => unshareHomebrewItem(item.id)}
        />
      ))}
    </div>
  );
}

interface MySharedItemCardProps {
  item: SharedHomebrew;
  compact: boolean;
  campaignName: string;
  onUnshare: () => void;
}

function MySharedItemCard({ item, compact, campaignName, onUnshare }: MySharedItemCardProps) {
  const snapshot = item.item_snapshot;

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-dagger-gold/20 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-dagger-gold font-bold text-xs">
              {snapshot.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white text-sm truncate">{snapshot.name}</p>
            <p className="text-xs text-gray-500 truncate">
              Shared with {campaignName}
            </p>
          </div>
        </div>
        <button
          onClick={onUnshare}
          className="p-1.5 text-red-400 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          title="Unshare"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-dagger-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-dagger-gold font-bold">
              {snapshot.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{snapshot.name}</h3>
            <p className="text-xs text-gray-400 capitalize">{snapshot.type}</p>
          </div>
        </div>
        <button
          onClick={onUnshare}
          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Trash2 size={14} />
          Unshare
        </button>
      </div>

      {/* Description */}
      {snapshot.description && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          {snapshot.description}
        </p>
      )}

      {/* Share Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>Shared with {campaignName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

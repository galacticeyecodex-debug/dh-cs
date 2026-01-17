/**
 * SHARED ITEMS LIST
 * ----------------------------------------------------------------------------
 * Displays items that have been shared with the current user or campaign.
 * Users can view item details and add shared items to their character's inventory.
 */

'use client';

import { useEffect } from 'react';
import { Package, Plus, User, MessageCircle, Calendar, Loader2 } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import type { EnrichedSharedHomebrew } from '@/types/sharing';

interface SharedItemsListProps {
  campaignId?: string;
  compact?: boolean;
}

export function SharedItemsList({ campaignId, compact = false }: SharedItemsListProps) {
  const {
    sharedWithMe,
    isLoadingSharing,
    fetchSharedWithMe,
    fetchSharedWithCampaign,
    addSharedToInventory,
    character,
  } = useCharacterStore();

  useEffect(() => {
    if (campaignId) {
      fetchSharedWithCampaign(campaignId);
    } else {
      fetchSharedWithMe();
    }
  }, [campaignId, fetchSharedWithCampaign, fetchSharedWithMe]);

  if (isLoadingSharing) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (sharedWithMe.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 mx-auto text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">
          {campaignId
            ? 'No items have been shared with this campaign yet.'
            : 'No items have been shared with you yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {sharedWithMe.map((item) => (
        <SharedItemCard
          key={item.id}
          item={item}
          compact={compact}
          canAdd={!!character}
          onAddToInventory={() => addSharedToInventory(item.id)}
        />
      ))}
    </div>
  );
}

interface SharedItemCardProps {
  item: EnrichedSharedHomebrew;
  compact: boolean;
  canAdd: boolean;
  onAddToInventory: () => void;
}

function SharedItemCard({ item, compact, canAdd, onAddToInventory }: SharedItemCardProps) {
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
            <p className="text-xs text-gray-500">
              from {item.sharer_username || 'Unknown'}
            </p>
          </div>
        </div>
        {canAdd && (
          <button
            onClick={onAddToInventory}
            className="p-1.5 text-green-400 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            title="Add to inventory"
          >
            <Plus size={16} />
          </button>
        )}
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
        {canAdd && (
          <button
            onClick={onAddToInventory}
            className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Description */}
      {snapshot.description && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          {snapshot.description}
        </p>
      )}

      {/* Sharer Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User size={12} />
          <span>Shared by {item.sharer_username || 'Unknown'}</span>
        </div>
        {item.campaign_name && (
          <div className="flex items-center gap-1">
            <Package size={12} />
            <span>{item.campaign_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Message */}
      {item.message && (
        <div className="mt-3 bg-black/20 rounded-lg p-2 flex items-start gap-2">
          <MessageCircle size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-400 italic">&quot;{item.message}&quot;</p>
        </div>
      )}
    </div>
  );
}

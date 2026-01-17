/**
 * SHARE HOMEBREW MODAL
 * ----------------------------------------------------------------------------
 * Modal dialog for sharing a homebrew item with campaigns. Users select which
 * campaign to share with and can add an optional message.
 *
 * Uses the fork/snapshot model - the item is copied at share time, not a
 * live reference. This prevents issues if the original item is later modified.
 */

'use client';

import { useState } from 'react';
import { X, Share2, Users } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';
import type { HomebrewItem } from '@/types/character';

interface ShareHomebrewModalProps {
  item: HomebrewItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareHomebrewModal({ item, isOpen, onClose }: ShareHomebrewModalProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const { campaigns, shareHomebrewItem } = useCharacterStore();

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!selectedCampaignId) return;

    setIsSharing(true);
    try {
      await shareHomebrewItem(
        item.id,
        { campaignId: selectedCampaignId },
        message || undefined
      );
      onClose();
    } finally {
      setIsSharing(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-dagger-panel border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 size={20} className="text-dagger-gold" />
            <h2 className="text-lg font-bold text-white">Share Homebrew</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Item Preview */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-dagger-gold/20 rounded-lg flex items-center justify-center">
                <span className="text-dagger-gold font-bold text-sm">
                  {item.type.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-xs text-gray-400 capitalize">{item.type}</p>
              </div>
            </div>
          </div>

          {/* Campaign Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Users size={14} />
              Share with Campaign
            </label>
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                You are not a member of any campaigns yet.
              </p>
            ) : (
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dagger-gold/50"
              >
                <option value="" className="bg-dagger-panel">
                  Select a campaign...
                </option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id} className="bg-dagger-panel">
                    {campaign.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note about this item..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dagger-gold/50 resize-none"
            />
          </div>

          {/* Info Note */}
          <p className="text-xs text-gray-500">
            Sharing creates a copy of the item. Future edits to your original won&apos;t affect the shared copy.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedCampaignId || isSharing}
            className="flex-1 px-4 py-2 bg-dagger-gold hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? 'Sharing...' : 'Share Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

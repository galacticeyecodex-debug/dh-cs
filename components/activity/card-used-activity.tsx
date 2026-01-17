'use client';

/**
 * Card Used Activity Component
 * ----------------------------------------------------------------------------
 * Displays when a card or item is used.
 */

import { CampaignActivity, CardUsedActivityData, ItemUsedActivityData } from '@/types/activity';
import { Sparkles, Package } from 'lucide-react';

interface CardUsedActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function CardUsedActivity({ activity, compact = false }: CardUsedActivityProps) {
    const isCard = activity.activity_type === 'card_used';
    const data = activity.data as CardUsedActivityData | ItemUsedActivityData;

    if (isCard) {
        const cardData = data as CardUsedActivityData;
        return (
            <div className="flex items-start gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <Sparkles size={14} className="text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">
                            {activity.character_name || 'Unknown'}
                        </span>
                        <span className="text-gray-400 text-sm">used</span>
                        <span className="font-medium text-cyan-400 text-sm">
                            {cardData.card_name}
                        </span>
                    </div>

                    {/* Card details */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">
                            {cardData.card_type}
                        </span>
                        {cardData.domain && (
                            <span className="text-xs text-gray-500">
                                • {cardData.domain}
                            </span>
                        )}
                        {cardData.cost_paid && !compact && (
                            <span className="text-xs text-gray-500">
                                {cardData.cost_paid.hope && `• Spent ${cardData.cost_paid.hope} Hope`}
                                {cardData.cost_paid.stress && `• +${cardData.cost_paid.stress} Stress`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Item used
    const itemData = data as ItemUsedActivityData;
    return (
        <div className="flex items-start gap-2">
            <div className="p-1.5 bg-green-500/20 rounded-lg">
                <Package size={14} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">
                        {activity.character_name || 'Unknown'}
                    </span>
                    <span className="text-gray-400 text-sm">used</span>
                    <span className="font-medium text-green-400 text-sm">
                        {itemData.item_name}
                    </span>
                </div>

                {/* Effect */}
                {itemData.effect && !compact && (
                    <p className="text-xs text-gray-500 mt-1">
                        {itemData.effect}
                    </p>
                )}
            </div>
        </div>
    );
}

export default CardUsedActivity;

'use client';

/**
 * Vital Change Activity Component
 * ----------------------------------------------------------------------------
 * Displays HP, stress, armor, or hope changes with visual indicators.
 */

import { CampaignActivity, VitalChangeActivityData } from '@/types/activity';
import { Heart, Brain, Shield, Sparkles, TrendingUp, TrendingDown, LucideIcon } from '@/lib/icon-utils';
import { useCharacterStore } from '@/store/character-store';
import { getIconByName, VitalId } from '@/lib/icon-utils';

interface VitalChangeActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}


export function VitalChangeActivity({ activity, compact = false }: VitalChangeActivityProps) {
    const data = activity.data as VitalChangeActivityData;
    const { vitalIcons } = useCharacterStore();

    // Map activity vital IDs to SettingsSlice vital IDs
    const vitalMap: Record<string, { id: VitalId, fallback: LucideIcon, label: string, color: string, bgColor: string }> = {
        hp: { id: 'hitPoints', fallback: Heart, label: 'HP', color: 'text-red-500', bgColor: 'bg-red-500/20' },
        stress: { id: 'stress', fallback: Brain, label: 'Stress', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
        armor: { id: 'armor', fallback: Shield, label: 'Armor', color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
        hope: { id: 'hope', fallback: Sparkles, label: 'Hope', color: 'text-amber-500', bgColor: 'bg-amber-500/20' },
    };

    const config = vitalMap[data.vital];
    if (!config) return null;

    const Icon = getIconByName(vitalIcons[config.id], config.fallback);

    // Get gain/lose text
    const textConfig: Record<string, { gain: string, lose: string }> = {
        hp: { gain: 'healed', lose: 'marked' },
        stress: { gain: 'gained', lose: 'cleared' },
        armor: { gain: 'repaired', lose: 'used' },
        hope: { gain: 'gained', lose: 'spent' },
    };
    const { gain: gainText, lose: loseText } = textConfig[data.vital] || { gain: 'changed', lose: 'changed' };

    // For HP: positive change = healing (good), negative = damage (bad)
    // For Stress: positive = gaining stress (bad), negative = clearing (good)
    // So we need to determine what action text to use based on vital type and direction
    const isPositive = data.change > 0;

    const actionText = isPositive ? gainText : loseText;

    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="flex items-start gap-2">
            <div className={`p-1.5 ${config.bgColor} rounded-lg`}>
                <Icon size={14} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">
                        {activity.character_name || 'Unknown'}
                    </span>
                    <span className="text-gray-400 text-sm">
                        {actionText} {Math.abs(data.change)} {config.label}
                    </span>
                </div>

                {/* Current status */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                        Now at {data.new_value}/{data.max_value}
                    </span>
                    <TrendIcon
                        size={12}
                        className={isPositive ? 'text-green-500' : 'text-red-500'}
                    />
                </div>

                {/* Cause */}
                {data.cause && !compact && (
                    <p className="text-xs text-gray-500 italic mt-1">
                        {data.cause}
                    </p>
                )}
            </div>
        </div>
    );
}

export default VitalChangeActivity;

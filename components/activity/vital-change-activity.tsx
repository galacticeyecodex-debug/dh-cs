'use client';

/**
 * Vital Change Activity Component
 * ----------------------------------------------------------------------------
 * Displays HP, stress, armor, or hope changes with visual indicators.
 */

import { CampaignActivity, VitalChangeActivityData } from '@/types/activity';
import { Heart, Brain, Shield, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface VitalChangeActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

const vitalConfig = {
    hp: {
        icon: Heart,
        label: 'HP',
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        gainText: 'healed',
        loseText: 'marked',
    },
    stress: {
        icon: Brain,
        label: 'Stress',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
        gainText: 'gained',
        loseText: 'cleared',
    },
    armor: {
        icon: Shield,
        label: 'Armor',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/20',
        gainText: 'repaired',
        loseText: 'used',
    },
    hope: {
        icon: Sparkles,
        label: 'Hope',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/20',
        gainText: 'gained',
        loseText: 'spent',
    },
};

export function VitalChangeActivity({ activity, compact = false }: VitalChangeActivityProps) {
    const data = activity.data as VitalChangeActivityData;
    const config = vitalConfig[data.vital];
    const Icon = config.icon;

    // For HP: positive change = healing (good), negative = damage (bad)
    // For Stress: positive = gaining stress (bad), negative = clearing (good)
    // So we need to determine what action text to use based on vital type and direction
    const isPositive = data.change > 0;

    let actionText: string;
    if (data.vital === 'hp') {
        actionText = isPositive ? config.gainText : config.loseText;
    } else if (data.vital === 'stress') {
        actionText = isPositive ? config.gainText : config.loseText;
    } else {
        actionText = isPositive ? config.gainText : config.loseText;
    }

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

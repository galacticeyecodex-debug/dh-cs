'use client';

/**
 * GM Vital Adjust Activity Component
 * ----------------------------------------------------------------------------
 * Displays when the GM adjusts a player's vitals.
 */

import { CampaignActivity, GmVitalAdjustActivityData } from '@/types/activity';
import { Wand2, Heart, Brain, Shield, Sparkles } from 'lucide-react';

interface GmVitalAdjustActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

const vitalIcons = {
    hp: Heart,
    stress: Brain,
    armor: Shield,
    hope: Sparkles,
};

const vitalColors = {
    hp: 'text-red-500',
    stress: 'text-yellow-500',
    armor: 'text-blue-500',
    hope: 'text-amber-500',
};

export function GmVitalAdjustActivity({ activity, compact = false }: GmVitalAdjustActivityProps) {
    const data = activity.data as GmVitalAdjustActivityData;
    const VitalIcon = vitalIcons[data.vital];
    const vitalColor = vitalColors[data.vital];

    const isPositive = data.change > 0;
    const actionText = isPositive ? 'added' : 'removed';

    return (
        <div className="flex items-start gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
                <Wand2 size={14} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-purple-400 text-sm">GM</span>
                    <span className="text-gray-400 text-sm">
                        {actionText} {Math.abs(data.change)}
                    </span>
                    <span className="flex items-center gap-1">
                        <VitalIcon size={12} className={vitalColor} />
                        <span className={`text-sm ${vitalColor}`}>
                            {data.vital.toUpperCase()}
                        </span>
                    </span>
                    <span className="text-gray-400 text-sm">
                        {isPositive ? 'to' : 'from'} {data.target_character_name}
                    </span>
                </div>

                {/* Current status */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                        {data.previous_value} → {data.new_value}
                    </span>
                </div>

                {/* Reason */}
                {data.reason && !compact && (
                    <p className="text-xs text-gray-500 italic mt-1">
                        Reason: {data.reason}
                    </p>
                )}
            </div>
        </div>
    );
}

export default GmVitalAdjustActivity;

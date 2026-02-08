'use client';

/**
 * Dice Roll Activity Component
 * ----------------------------------------------------------------------------
 * Displays dice roll results with die values, modifiers, and hope/fear indicator.
 */

import { CampaignActivity, DiceRollActivityData, GmRollActivityData } from '@/types/activity';
import { Dices, Eye, EyeOff } from '@/lib/icon-utils';

interface DiceRollActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function DiceRollActivity({ activity, compact = false }: DiceRollActivityProps) {
    const data = activity.data as DiceRollActivityData | GmRollActivityData;
    const isGmRoll = activity.activity_type === 'gm_roll';
    const isRevealed = isGmRoll ? (data as GmRollActivityData).revealed : true;
    const isPrivate = activity.is_private;

    // Roll type display names
    const rollTypeLabels: Record<string, string> = {
        attack: 'Attack',
        damage: 'Damage',
        trait: data.trait ? `${data.trait} Check` : 'Trait Check',
        spellcast: 'Spellcast',
        custom: 'Roll',
    };

    const rollLabel = rollTypeLabels[data.roll_type] || 'Roll';

    return (
        <div className="flex items-start gap-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                <Dices size={14} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">
                        {activity.character_name || (isGmRoll ? 'GM' : 'Unknown')}
                    </span>
                    <span className="text-gray-400 text-sm">{rollLabel}</span>
                    {isPrivate && (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                            <EyeOff size={10} />
                            Hidden
                        </span>
                    )}
                    {isGmRoll && isRevealed && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                            <Eye size={10} />
                            Revealed
                        </span>
                    )}
                </div>

                {/* Description */}
                {data.description && !compact && (
                    <p className="text-xs text-gray-500 mt-0.5">{data.description}</p>
                )}

                {/* Results */}
                <div className="flex items-center gap-3 mt-1">
                    {/* Total */}
                    <span className="text-2xl font-bold text-white tabular-nums">
                        {data.total}
                    </span>

                    {/* Dice breakdown */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="font-mono">
                            [{data.dice.join(', ')}]
                        </span>
                        {data.modifier !== 0 && (
                            <span className="text-gray-500">
                                {data.modifier > 0 ? '+' : ''}{data.modifier}
                            </span>
                        )}
                    </div>

                    {/* Hope/Fear indicator */}
                    {data.hope_fear && (
                        <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${data.hope_fear === 'hope'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                        >
                            {data.hope_fear.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DiceRollActivity;

'use client';

/**
 * GM ACTION ACTIVITY COMPONENT
 * ----------------------------------------------------------------------------
 * Renders GM Action Center activities in the activity feed:
 * - adversary_spotlighted: GM spotlighted an adversary
 * - adversary_feature_used: GM activated an adversary feature
 * - gm_fear_move: GM used a Fear move (narrative or SRD)
 */

import { CampaignActivity } from '@/types/activity';
import { AppIcons } from '@/lib/icon-utils';

interface GmActionActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function GmActionActivity({ activity, compact }: GmActionActivityProps) {
    const data = activity.data as unknown as Record<string, unknown>;

    switch (activity.activity_type) {
        case 'adversary_spotlighted':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-dagger-gold/20">
                        <AppIcons.combat.target size={compact ? 12 : 14} className="text-dagger-gold" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300">
                            GM spotlighted{' '}
                            <span className="font-bold text-dagger-gold">
                                {(data.adversary_label as string) || (data.adversary_name as string)}
                            </span>
                            {(data.fear_cost as number) > 0 && (
                                <span className="text-red-400 text-xs ml-1">
                                    (-{data.fear_cost as number} Fear)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            );

        case 'adversary_feature_used':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-orange-500/20">
                        <AppIcons.combat.attack size={compact ? 12 : 14} className="text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-bold text-white">
                                {(data.adversary_label as string) || (data.adversary_name as string)}
                            </span>
                            {' '}used{' '}
                            <span className="font-bold text-orange-300">{data.feature_name as string}</span>
                            {(data.fear_cost as number) > 0 && (
                                <span className="text-red-400 text-xs ml-1">
                                    (-{data.fear_cost as number} Fear)
                                </span>
                            )}
                            {(data.stress_cost as number) > 0 && (
                                <span className="text-purple-400 text-xs ml-1">
                                    (-{data.stress_cost as number} Stress)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            );

        case 'gm_fear_move':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-red-500/20">
                        <AppIcons.vitals.fear size={compact ? 12 : 14} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300">
                            GM used{' '}
                            <span className="font-bold text-red-300">{data.move_name as string}</span>
                            {(data.fear_cost as number) > 0 && (
                                <span className="text-red-400 text-xs ml-1">
                                    (-{data.fear_cost as number} Fear)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

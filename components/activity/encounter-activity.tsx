'use client';

/**
 * ENCOUNTER ACTIVITY COMPONENT
 * ----------------------------------------------------------------------------
 * Renders encounter-related activities in the activity feed:
 * - encounter_started / encounter_ended
 * - adversary_pinned / adversary_defeated / adversary_damaged
 * - npc_shared
 */

import { CampaignActivity } from '@/types/activity';
import { AppIcons } from '@/lib/icon-utils';

interface EncounterActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function EncounterActivity({ activity, compact }: EncounterActivityProps) {
    const data = activity.data as Record<string, unknown>;

    switch (activity.activity_type) {
        case 'encounter_started':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-red-500/20">
                        <AppIcons.combat.attack size={compact ? 12 : 14} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white">
                            <span className="font-bold text-red-300">Encounter Started</span>
                        </p>
                        <p className="text-xs text-gray-400">
                            {data.encounter_name as string}
                            {data.adversary_count ? ` (${data.adversary_count} adversaries)` : ''}
                        </p>
                    </div>
                </div>
            );

        case 'encounter_ended':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-green-500/20">
                        <AppIcons.combat.attack size={compact ? 12 : 14} className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white">
                            <span className="font-bold text-green-300">Encounter Ended</span>
                        </p>
                        <p className="text-xs text-gray-400">
                            {data.encounter_name as string}
                        </p>
                    </div>
                </div>
            );

        case 'adversary_pinned':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-orange-500/20">
                        <AppIcons.ui.add size={compact ? 12 : 14} className="text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-bold text-orange-300">{data.adversary_label as string || data.adversary_name as string}</span>
                            {' '}entered the encounter
                        </p>
                    </div>
                </div>
            );

        case 'adversary_defeated':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-red-500/20">
                        <AppIcons.vitals.fear size={compact ? 12 : 14} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white">
                            <span className="font-bold text-red-300">{data.adversary_label as string || data.adversary_name as string}</span>
                            {' '}<span className="text-gray-400">was defeated!</span>
                        </p>
                    </div>
                </div>
            );

        case 'adversary_damaged':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-orange-500/20">
                        <AppIcons.combat.attack size={compact ? 12 : 14} className="text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-bold text-white">{data.adversary_label as string || data.adversary_name as string}</span>
                            {' '}took <span className="text-orange-300 font-bold">{data.damage as number}</span> damage
                            {data.hp_remaining !== undefined && (
                                <span className="text-gray-500"> ({data.hp_remaining as number}/{data.hp_max as number} HP)</span>
                            )}
                        </p>
                    </div>
                </div>
            );

        case 'npc_shared':
            return (
                <div className="flex items-start gap-2">
                    <div className="p-1 rounded bg-pink-500/20">
                        <AppIcons.campaign.party size={compact ? 12 : 14} className="text-pink-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300">
                            GM shared <span className="font-bold text-pink-300">{data.npc_name as string}</span>
                            {' '}with {data.recipient_count as number} party member{(data.recipient_count as number) !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

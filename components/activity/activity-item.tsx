'use client';

/**
 * Activity Item Component
 * ----------------------------------------------------------------------------
 * Routes each activity to its specific display component based on activity_type.
 * Handles timestamp display and common layout.
 */

import { CampaignActivity } from '@/types/activity';
import { DiceRollActivity } from './dice-roll-activity';
import { VitalChangeActivity } from './vital-change-activity';
import { FearChangeActivity } from './fear-change-activity';
import { GmAnnouncementActivity } from './gm-announcement-activity';
import { GmVitalAdjustActivity } from './gm-vital-adjust-activity';
import { CardUsedActivity } from './card-used-activity';
import { EncounterActivity } from './encounter-activity';
import { GmActionActivity } from './gm-action-activity';
import { GenericActivity } from './generic-activity';

interface ActivityItemProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function ActivityItem({ activity, compact = false }: ActivityItemProps) {
    const timestamp = new Date(activity.created_at);
    const timeString = timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Show date if not today
    const isToday = new Date().toDateString() === timestamp.toDateString();
    const dateString = isToday ? null : timestamp.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    });

    const renderActivity = () => {
        switch (activity.activity_type) {
            case 'dice_roll':
            case 'gm_roll':
                return <DiceRollActivity activity={activity} compact={compact} />;
            case 'vital_change':
                return <VitalChangeActivity activity={activity} compact={compact} />;
            case 'fear_change':
                return <FearChangeActivity activity={activity} compact={compact} />;
            case 'gm_announcement':
                return <GmAnnouncementActivity activity={activity} compact={compact} />;
            case 'gm_vital_adjust':
                return <GmVitalAdjustActivity activity={activity} compact={compact} />;
            case 'card_used':
            case 'item_used':
                return <CardUsedActivity activity={activity} compact={compact} />;
            case 'encounter_started':
            case 'encounter_ended':
            case 'adversary_pinned':
            case 'adversary_defeated':
            case 'adversary_damaged':
            case 'npc_shared':
                return <EncounterActivity activity={activity} compact={compact} />;
            case 'adversary_spotlighted':
            case 'adversary_feature_used':
            case 'gm_fear_move':
                return <GmActionActivity activity={activity} compact={compact} />;
            case 'player_joined':
            case 'player_left':
            case 'character_switched':
            default:
                return <GenericActivity activity={activity} compact={compact} />;
        }
    };

    return (
        <div className="group bg-black/20 hover:bg-white/5 border border-white/5 rounded-lg p-3 transition-colors">
            <div className="flex items-start gap-3">
                {/* Timestamp */}
                <div className="flex flex-col items-end min-w-[50px]">
                    <span className="text-xs text-gray-500 tabular-nums">{timeString}</span>
                    {dateString && (
                        <span className="text-[10px] text-gray-600">{dateString}</span>
                    )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                    {renderActivity()}
                </div>
            </div>
        </div>
    );
}

export default ActivityItem;

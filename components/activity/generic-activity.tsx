'use client';

/**
 * Generic Activity Component
 * ----------------------------------------------------------------------------
 * Fallback display for activity types without specific renderers.
 * Handles player_joined, player_left, character_switched, and unknown types.
 */

import { CampaignActivity, PlayerJoinedActivityData, PlayerLeftActivityData, CharacterSwitchedActivityData } from '@/types/activity';
import { AppIcons } from '@/lib/icon-utils';

interface GenericActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

export function GenericActivity({ activity }: GenericActivityProps) {
    const getActivityContent = () => {
        switch (activity.activity_type) {
            case 'player_joined': {
                const data = activity.data as PlayerJoinedActivityData;
                return {
                    icon: AppIcons.campaign.invite,
                    iconBg: 'bg-green-500/20',
                    iconColor: 'text-green-400',
                    message: (
                        <>
                            <span className="font-medium text-green-400">{data.player_name}</span>
                            <span className="text-gray-400"> joined the campaign</span>
                            {data.character_name && (
                                <span className="text-gray-400"> as {data.character_name}</span>
                            )}
                        </>
                    ),
                };
            }
            case 'player_left': {
                const data = activity.data as PlayerLeftActivityData;
                return {
                    icon: AppIcons.campaign.kick,
                    iconBg: 'bg-red-500/20',
                    iconColor: 'text-red-400',
                    message: (
                        <>
                            <span className="font-medium text-red-400">{data.player_name}</span>
                            <span className="text-gray-400"> left the campaign</span>
                        </>
                    ),
                };
            }
            case 'character_switched': {
                const data = activity.data as CharacterSwitchedActivityData;
                return {
                    icon: AppIcons.system.sync,
                    iconBg: 'bg-purple-500/20',
                    iconColor: 'text-purple-400',
                    message: (
                        <>
                            <span className="font-medium text-white">{activity.character_name || 'Someone'}</span>
                            <span className="text-gray-400"> switched to </span>
                            <span className="font-medium text-purple-400">{data.new_character_name}</span>
                            {data.previous_character_name && (
                                <span className="text-gray-500 text-xs">
                                    {' '}(was {data.previous_character_name})
                                </span>
                            )}
                        </>
                    ),
                };
            }
            default:
                return {
                    icon: AppIcons.ui.stats,
                    iconBg: 'bg-gray-500/20',
                    iconColor: 'text-gray-400',
                    message: (
                        <span className="text-gray-400">
                            Unknown activity: {activity.activity_type}
                        </span>
                    ),
                };
        }
    };

    const { icon: Icon, iconBg, iconColor, message } = getActivityContent();

    return (
        <div className="flex items-start gap-2">
            <div className={`p-1.5 ${iconBg} rounded-lg`}>
                <Icon size={14} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm">{message}</div>
            </div>
        </div>
    );
}

export default GenericActivity;

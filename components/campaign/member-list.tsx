'use client';

import React from 'react';
import { EnrichedCampaignMember } from '@/types/campaign';
import { AppIcons } from '@/lib/icon-utils';
import { useCharacterStore } from '@/store/character-store';

interface MemberListProps {
    members: EnrichedCampaignMember[];
    campaignId: string;
    gmUserId: string;
    onAssignCharacter?: () => void;
}

export default function MemberList({ members, campaignId, gmUserId, onAssignCharacter }: MemberListProps) {
    const { user, kickMember } = useCharacterStore();

    const isCurrentUserGM = user?.id === gmUserId;

    const handleKick = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member from the campaign?')) {
            return;
        }

        try {
            await kickMember(memberId);
        } catch (error) {
            console.error('Failed to kick member:', error);
        }
    };

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Members ({members.length})</h3>
                {onAssignCharacter && (
                    <button
                        onClick={onAssignCharacter}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                        aria-label="Assign character"
                    >
                        <AppIcons.campaign.invite size={14} />
                        Assign
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {members.map((member) => {
                    const isGM = member.role === 'gm';
                    const isCurrentUser = member.user_id === user?.id;

                    return (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Role Icon */}
                                <div className={`p-2 rounded-lg ${isGM ? 'bg-dagger-gold/20' : 'bg-blue-500/20'}`}>
                                    {isGM ? (
                                        <AppIcons.campaign.gm size={18} className="text-dagger-gold" />
                                    ) : (
                                        <AppIcons.vitals.armor size={18} className="text-blue-400" />
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-white truncate">
                                            {member.profile?.username || 'Unknown User'}
                                            {isCurrentUser && (
                                                <span className="text-gray-500 text-sm ml-2">(You)</span>
                                            )}
                                        </p>
                                        {isGM && (
                                            <span className="px-2 py-0.5 bg-dagger-gold/20 text-dagger-gold text-xs font-bold rounded">
                                                GM
                                            </span>
                                        )}
                                    </div>

                                    {member.character ? (
                                        <p className="text-gray-400 text-sm truncate">
                                            {member.character.name} • Lv {member.character.level}
                                        </p>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">
                                            No character assigned
                                        </p>
                                    )}
                                </div>

                                {/* Actions (GM only, can't kick themselves) */}
                                {isCurrentUserGM && !isCurrentUser && (
                                    <button
                                        onClick={() => handleKick(member.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                                        title="Remove from campaign"
                                        aria-label={`Remove ${member.profile?.username} from campaign`}
                                    >
                                        <AppIcons.ui.close size={18} className="text-gray-400 group-hover:text-red-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {members.length === 0 && (
                    <div className="text-center py-8">
                        <AppIcons.campaign.player size={32} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-500 text-sm">No members yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}

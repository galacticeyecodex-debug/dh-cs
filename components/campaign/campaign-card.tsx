'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Campaign } from '@/types/campaign';
import { Users, Crown } from 'lucide-react';
import { useCharacterStore } from '@/store/character-store';

interface CampaignCardProps {
    campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
    const router = useRouter();
    const { user } = useCharacterStore();

    const isGM = campaign.gm_user_id === user?.id;

    return (
        <button
            onClick={() => router.push(`/app/campaign/${campaign.id}`)}
            className="bg-dagger-panel border border-white/10 rounded-xl p-6 hover:border-dagger-gold/50 transition-all text-left group"
            aria-label={`Open ${campaign.name} campaign`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-dagger-gold transition-colors">
                        {campaign.name}
                    </h3>
                    {campaign.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {campaign.description}
                        </p>
                    )}
                </div>
                {isGM && (
                    <div className="ml-2">
                        <div className="p-2 bg-dagger-gold/20 rounded-lg" title="You are the GM">
                            <Crown size={18} className="text-dagger-gold" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Users size={16} />
                    <span>Campaign</span>
                </div>
                <div className="text-gray-500 text-xs">
                    Fear: {campaign.fear_current}/{campaign.fear_max}
                </div>
            </div>
        </button>
    );
}

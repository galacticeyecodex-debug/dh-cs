'use client';

/**
 * DOWNTIME VIEW (PLACEHOLDER)
 * ----------------------------------------------------------------------------
 * Placeholder component for the Downtime view which will include:
 * - Rest type selection (Short/Long rest)
 * - Downtime moves panel (Tend to Wounds, Clear Stress, Repair Armor, Prepare)
 * - Project tracking with countdown clocks
 * - Study Token management (campaign-specific)
 * 
 * This is a Phase 3 feature - this placeholder is created in Phase 1 to
 * establish navigation structure.
 */

import React from 'react';
import { Moon, Clock, Hammer, BookOpen } from 'lucide-react';

export default function DowntimeView() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-dagger-gold/10">
                    <Moon size={28} className="text-dagger-gold" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white">Downtime</h1>
                    <p className="text-sm text-gray-400">Rest, recover, and work on projects</p>
                </div>
            </div>

            {/* Coming Soon Card */}
            <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dagger-gold/10">
                        <Clock size={32} className="text-dagger-gold" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Coming Soon</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        The Downtime view will allow you to manage rest periods, track long-term
                        projects, and handle campaign-specific activities like Study Tokens.
                    </p>
                </div>
            </div>

            {/* Feature Preview Cards */}
            <div className="grid gap-4">
                <FeaturePreviewCard
                    icon={Moon}
                    title="Rest Management"
                    description="Choose between Short and Long rests with different available moves"
                />
                <FeaturePreviewCard
                    icon={Hammer}
                    title="Project Tracking"
                    description="Track countdown clocks for crafting, research, and other long-term goals"
                />
                <FeaturePreviewCard
                    icon={BookOpen}
                    title="Campaign Activities"
                    description="Access campaign-specific activities like Study Tokens and Signature Spells"
                />
            </div>
        </div>
    );
}

function FeaturePreviewCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-xl">
            <div className="p-2 rounded-lg bg-white/5">
                <Icon size={20} className="text-gray-400" />
            </div>
            <div>
                <h3 className="font-medium text-white">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    );
}

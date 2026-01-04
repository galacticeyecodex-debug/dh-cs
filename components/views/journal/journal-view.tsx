'use client';

/**
 * JOURNAL VIEW (PLACEHOLDER)
 * ----------------------------------------------------------------------------
 * Placeholder component for the Journal view which will include:
 * - Relationships tab: NPC tracking with point-based progression
 * - Reputation tab: Campus-wide standing with tier effects
 * 
 * This is a Phase 4 feature - this placeholder is created in Phase 1 to
 * establish navigation structure.
 */

import React from 'react';
import { BookOpen, Users, Star, Heart } from 'lucide-react';

export default function JournalView() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-dagger-gold/10">
                    <BookOpen size={28} className="text-dagger-gold" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white">Journal</h1>
                    <p className="text-sm text-gray-400">Track relationships and reputation</p>
                </div>
            </div>

            {/* Coming Soon Card */}
            <div className="bg-dagger-panel border border-white/10 rounded-xl p-6">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dagger-gold/10">
                        <Heart size={32} className="text-dagger-gold" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Coming Soon</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        The Journal view will help you track NPC relationships, manage your
                        reputation, and keep notes on important story elements.
                    </p>
                </div>
            </div>

            {/* Feature Preview Cards */}
            <div className="grid gap-4">
                <FeaturePreviewCard
                    icon={Users}
                    title="Relationship Tracker"
                    description="Track NPCs with relationship points and tier progression (Friend, Ally, Rival)"
                />
                <FeaturePreviewCard
                    icon={Star}
                    title="Reputation System"
                    description="Monitor your standing with factions and communities with tier-based effects"
                />
                <FeaturePreviewCard
                    icon={BookOpen}
                    title="Story Notes"
                    description="Keep track of important events, discoveries, and campaign details"
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

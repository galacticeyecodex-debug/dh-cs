'use client';

/**
 * Activity Feed Component
 * ----------------------------------------------------------------------------
 * Displays a scrollable list of campaign activity with pagination.
 * Shows dice rolls, vital changes, announcements, and other game events.
 */

import { useEffect, useState, useCallback } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { ActivityItem } from './activity-item';
import { RefreshCw, Activity, ChevronDown } from '@/lib/icon-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFeedProps {
    campaignId: string;
    maxHeight?: string;
    compact?: boolean; // For sidebar placement
}

export function ActivityFeed({ campaignId, maxHeight = '600px', compact = false }: ActivityFeedProps) {
    const {
        activityFeed,
        isLoadingActivity,
        fetchActivityFeed,
        activityTotalCount
    } = useCharacterStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchActivityFeed(campaignId);
    }, [campaignId, fetchActivityFeed]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchActivityFeed(campaignId, 0);
        setIsRefreshing(false);
    }, [campaignId, fetchActivityFeed]);

    const handleLoadMore = useCallback(() => {
        fetchActivityFeed(campaignId, activityFeed.length);
    }, [campaignId, activityFeed.length, fetchActivityFeed]);

    const hasMore = activityFeed.length < activityTotalCount;

    return (
        <div
            className="flex flex-col bg-dagger-panel border border-white/10 rounded-xl overflow-hidden"
            style={{ maxHeight }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-purple-400" />
                    <h3 className="font-semibold text-white">
                        {compact ? 'Activity' : 'Activity Feed'}
                    </h3>
                    {activityTotalCount > 0 && (
                        <span className="text-xs text-gray-500">
                            ({activityTotalCount} events)
                        </span>
                    )}
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Refresh activity feed"
                >
                    <RefreshCw
                        size={16}
                        className={`text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                </button>
            </div>

            {/* Feed Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {activityFeed.length === 0 && !isLoadingActivity ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <Activity size={40} className="text-gray-600 mb-3" />
                        <p className="text-gray-400 text-sm">No activity yet</p>
                        <p className="text-gray-500 text-xs mt-1">
                            Roll dice, make changes, or wait for your GM!
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="p-3 space-y-2">
                            {activityFeed.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.02, duration: 0.2 }}
                                >
                                    <ActivityItem activity={activity} compact={compact} />
                                </motion.div>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingActivity}
                                    className="w-full py-2 px-4 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoadingActivity ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={14} />
                                            Load More ({activityTotalCount - activityFeed.length} remaining)
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

export default ActivityFeed;

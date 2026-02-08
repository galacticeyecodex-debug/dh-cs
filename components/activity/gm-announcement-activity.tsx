'use client';

/**
 * GM Announcement Activity Component
 * ----------------------------------------------------------------------------
 * Displays GM broadcast messages with importance indicators.
 */

import { CampaignActivity, GmAnnouncementActivityData } from '@/types/activity';
import { Megaphone, AlertTriangle, AlertCircle, Info } from '@/lib/icon-utils';

interface GmAnnouncementActivityProps {
    activity: CampaignActivity;
    compact?: boolean;
}

const importanceConfig = {
    normal: {
        icon: Info,
        borderColor: 'border-blue-500/50',
        bgColor: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
    },
    important: {
        icon: AlertCircle,
        borderColor: 'border-amber-500/50',
        bgColor: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
    },
    critical: {
        icon: AlertTriangle,
        borderColor: 'border-red-500/50',
        bgColor: 'bg-red-500/10',
        iconColor: 'text-red-400',
    },
};

export function GmAnnouncementActivity({ activity }: GmAnnouncementActivityProps) {
    const data = activity.data as GmAnnouncementActivityData;
    const importance = data.importance || 'normal';
    const config = importanceConfig[importance];
    const ImportanceIcon = config.icon;

    return (
        <div className="flex items-start gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Megaphone size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-400 text-sm">GM Announcement</span>
                    {importance !== 'normal' && (
                        <ImportanceIcon size={14} className={config.iconColor} />
                    )}
                </div>

                {/* Message */}
                <div className={`mt-2 p-2 rounded-lg border-l-2 ${config.borderColor} ${config.bgColor}`}>
                    <p className="text-sm text-gray-200">
                        {data.message}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default GmAnnouncementActivity;

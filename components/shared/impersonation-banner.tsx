/**
 * IMPERSONATION BANNER
 * ----------------------------------------------------------------------------
 * Persistent amber banner displayed at the top of the app when the GM is
 * viewing a player's character sheet via impersonation. Shows the character
 * and player name, and provides a "Return to GM Screen" button that calls
 * stopImpersonation() to restore the GM's original character.
 */

'use client';

import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import { useRouter } from 'next/navigation';

export default function ImpersonationBanner() {
    const { impersonation, stopImpersonation, activeCampaign } = useCharacterStore();
    const router = useRouter();

    if (!impersonation) return null;

    const handleReturn = async () => {
        await stopImpersonation();
        if (activeCampaign) {
            router.push(`/campaign/${activeCampaign.id}`);
        }
    };

    return (
        <div className="flex-shrink-0 bg-amber-500/15 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
                <AppIcons.campaign.impersonate size={16} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm text-amber-200 truncate">
                    Viewing <strong>{impersonation.characterName}</strong>
                    <span className="text-amber-400/70"> ({impersonation.playerName})</span>
                </span>
            </div>
            <button
                onClick={handleReturn}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
                Return to GM Screen
                <AppIcons.ui.chevronRight size={14} />
            </button>
        </div>
    );
}

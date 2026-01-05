/**
 * useTabPersistence Hook
 * ----------------------------------------------------------------------------
 * This hook handles restoring the user's last active tab from localStorage
 * AFTER hydration is complete. This prevents React hydration mismatches that
 * occur when the server-rendered HTML (which always uses 'character' as the
 * default tab) differs from the client's localStorage-persisted tab value.
 * 
 * Usage: Call this hook once in MobileLayout to enable tab persistence.
 */

import { useEffect } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { TabId, getValidTabs, getActiveTabStorageKey } from '@/store/slices/ui-slice';

export function useTabPersistence() {
    const setActiveTab = useCharacterStore((state) => state.setActiveTab);

    useEffect(() => {
        // Only run on client after hydration
        try {
            const stored = localStorage.getItem(getActiveTabStorageKey());
            const validTabs = getValidTabs();

            if (stored && validTabs.includes(stored as TabId)) {
                // Use a small delay to ensure hydration is fully complete
                // This also prevents a visual flash on the first render
                const timeoutId = setTimeout(() => {
                    setActiveTab(stored as TabId);
                }, 0);

                return () => clearTimeout(timeoutId);
            }
        } catch (error) {
            console.warn('Failed to restore active tab from localStorage:', error);
        }
    }, [setActiveTab]);
}

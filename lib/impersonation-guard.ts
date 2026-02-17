/**
 * Impersonation Guard
 * ----------------------------------------------------------------------------
 * Small utility that blocks DB-mutating store actions when the GM is
 * impersonating a player character. Returns `true` (blocked) when
 * impersonation is active, showing a toast notification to the user.
 */

import { toast } from 'sonner';

export function guardImpersonation(state: { impersonation: unknown }): boolean {
    if (state.impersonation) {
        toast.info('View-only while impersonating a character');
        return true;
    }
    return false;
}

/**
 * STATE HELPERS
 * ----------------------------------------------------------------------------
 * Utilities for managing optimistic UI updates.
 * 
 * FUNCTIONALITY:
 * - `withOptimisticUpdate`: Wraps async operations to apply local state changes immediately,
 *   rolling them back if the remote operation fails.
 * - Handles error toast notifications.
 * 
 * SHARED:
 * - Shared utility for consistent UX across both platforms.
 */

import { toast } from 'sonner';

type RollbackFn = () => void;

/**
 * Execute an optimistic update with automatic rollback on database error.
 *
 * Pattern:
 * 1. User action triggers optimistic state update
 * 2. Component re-renders immediately (good UX)
 * 3. Database operation runs in background
 * 4. If DB fails: rollback state and show error toast
 *
 * @param updateFn - Function that performs optimistic update and returns rollback function
 * @param dbOperation - Async function that performs DB operation
 * @param errorMessage - User-friendly error message for toast
 *
 * @example
 * ```typescript
 * await withOptimisticUpdate(
 *   () => {
 *     const previousHP = get().character.vitals.hit_points_current;
 *     set(s => ({
 *       character: s.character ? { ...s.character, vitals: { ...s.character.vitals, hit_points_current: newHP } } : null
 *     }));
 *     return () => {
 *       set(s => ({
 *         character: s.character ? { ...s.character, vitals: { ...s.character.vitals, hit_points_current: previousHP } } : null
 *       }));
 *     };
 *   },
 *   () => createClient().from('characters').update({ vitals: newVitals }).eq('id', characterId),
 *   'Failed to update HP'
 * );
 * ```
 */
export async function withOptimisticUpdate<T>(
  updateFn: () => RollbackFn,
  dbOperation: () => Promise<any>,
  errorMessage: string = 'Operation failed'
): Promise<{ success: boolean; data?: T }> {
  // 1. Perform optimistic update and get rollback function
  const rollback = updateFn();

  try {
    // 2. Attempt database operation
    const result = await dbOperation();

    // Check for Supabase-style error object if result is an object
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      throw result.error;
    }

    // 4. Success
    // If result has data property (Supabase style), return that, otherwise return result itself
    const data = result && typeof result === 'object' && 'data' in result ? result.data : result;
    return { success: true, data };

  } catch (error: any) {
    // 3. Handle error: rollback and notify user
    console.error('Database operation failed:', error);
    rollback();
    toast.error(errorMessage, {
      description: error.message || 'Please try again',
      duration: 5000,
    });
    return { success: false };
  }
}

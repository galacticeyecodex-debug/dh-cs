/**
 * State management helpers for optimistic updates with error recovery
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
  dbOperation: () => Promise<{ error: any; data?: T }>,
  errorMessage: string = 'Operation failed'
): Promise<{ success: boolean; data?: T }> {
  // 1. Perform optimistic update and get rollback function
  const rollback = updateFn();

  // 2. Attempt database operation
  const { error, data } = await dbOperation();

  // 3. Handle error: rollback and notify user
  if (error) {
    console.error('Database operation failed:', error);
    rollback();
    toast.error(errorMessage, {
      description: error.message || 'Please try again',
      duration: 5000,
    });
    return { success: false };
  }

  // 4. Success
  return { success: true, data };
}

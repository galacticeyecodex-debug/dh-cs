import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { withOptimisticUpdate } from '@/lib/state-helpers';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('withOptimisticUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success path', () => {
    it('should return success when database operation succeeds', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: null, data: { id: '123' } });

      const result = await withOptimisticUpdate(updateFn, dbOperation, 'Test error');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });

    it('should call updateFn immediately', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: null });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(updateFn).toHaveBeenCalledOnce();
    });

    it('should NOT call rollback on success', async () => {
      const rollback = vi.fn();
      const updateFn = vi.fn(() => rollback);
      const dbOperation = vi.fn().mockResolvedValue({ error: null });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(rollback).not.toHaveBeenCalled();
    });

    it('should NOT show error toast on success', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: null });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('error path', () => {
    it('should return failure when database operation fails', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('DB error') });

      const result = await withOptimisticUpdate(updateFn, dbOperation);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('should call rollback when database operation fails', async () => {
      const rollback = vi.fn();
      const updateFn = vi.fn(() => rollback);
      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('DB error') });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(rollback).toHaveBeenCalledOnce();
    });

    it('should show error toast with custom message on failure', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('Network error') });

      await withOptimisticUpdate(updateFn, dbOperation, 'Failed to save data');

      expect(toast.error).toHaveBeenCalledWith('Failed to save data', {
        description: 'Network error',
        duration: 5000,
      });
    });

    it('should show error toast with default message if error has no message', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: { code: 'ERR_CODE' } });

      await withOptimisticUpdate(updateFn, dbOperation, 'Operation failed');

      expect(toast.error).toHaveBeenCalledWith('Operation failed', {
        description: 'Please try again',
        duration: 5000,
      });
    });

    it('should use default error message if not provided', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('DB error') });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(toast.error).toHaveBeenCalledWith('Operation failed', expect.any(Object));
    });
  });

  describe('rollback closure', () => {
    it('should capture state in closure for rollback', async () => {
      let capturedState: string | null = null;
      const state = 'original-state';

      const updateFn = () => {
        capturedState = state;
        return () => {
          capturedState = 'rolled-back-state';
        };
      };

      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('DB error') });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(capturedState).toBe('rolled-back-state');
    });

    it('should rollback before showing error toast', async () => {
      let updateOrder: string[] = [];
      const rollback = () => {
        updateOrder.push('rollback');
      };
      const updateFn = vi.fn(() => rollback);
      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('DB error') });

      vi.mocked(toast.error).mockImplementationOnce(() => {
        updateOrder.push('toast');
      });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(updateOrder).toEqual(['rollback', 'toast']);
    });

    it('should rollback capture multiple state changes', async () => {
      let stateA = 'initial-a';
      let stateB = 'initial-b';

      const updateFn = () => {
        const prevA = stateA;
        const prevB = stateB;
        stateA = 'updated-a';
        stateB = 'updated-b';

        return () => {
          stateA = prevA;
          stateB = prevB;
        };
      };

      const dbOperation = vi.fn().mockResolvedValue({ error: new Error('DB error') });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(stateA).toBe('initial-a');
      expect(stateB).toBe('initial-b');
    });
  });

  describe('edge cases', () => {
    it('should handle empty error message object', async () => {
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: {} });

      await withOptimisticUpdate(updateFn, dbOperation, 'Test error');

      expect(toast.error).toHaveBeenCalledWith('Test error', {
        description: 'Please try again',
        duration: 5000,
      });
    });

    it('should handle null error (success case)', async () => {
      const rollback = vi.fn();
      const updateFn = vi.fn(() => rollback);
      const dbOperation = vi.fn().mockResolvedValue({ error: null, data: { success: true } });

      const result = await withOptimisticUpdate(updateFn, dbOperation);

      expect(rollback).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle false error (falsy but not null)', async () => {
      const rollback = vi.fn();
      const updateFn = vi.fn(() => rollback);
      const dbOperation = vi.fn().mockResolvedValue({ error: false, data: { success: true } });

      const result = await withOptimisticUpdate(updateFn, dbOperation);

      // false is falsy, so should be treated as success
      expect(rollback).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle 0 as error (falsy but not an error)', async () => {
      const rollback = vi.fn();
      const updateFn = vi.fn(() => rollback);
      const dbOperation = vi.fn().mockResolvedValue({ error: 0, data: null });

      const result = await withOptimisticUpdate(updateFn, dbOperation);

      // 0 is falsy, so should be treated as success
      expect(rollback).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle multiple calls with independent rollback closures', async () => {
      let states = [0, 0];

      const createUpdate = (index: number) => {
        return () => {
          const prev = states[index];
          states[index] = states[index] + 1;
          return () => {
            states[index] = prev;
          };
        };
      };

      // First call: succeeds
      const db1 = vi.fn().mockResolvedValue({ error: null });
      await withOptimisticUpdate(createUpdate(0), db1);
      expect(states[0]).toBe(1);

      // Second call: fails
      const db2 = vi.fn().mockResolvedValue({ error: new Error('Failed') });
      await withOptimisticUpdate(createUpdate(1), db2);

      // First state unchanged, second rolled back
      expect(states[0]).toBe(1);
      expect(states[1]).toBe(0);
    });
  });

  describe('console logging', () => {
    it('should log error to console on database failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('DB connection failed');
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Database operation failed:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should NOT log to console on success', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const updateFn = vi.fn(() => vi.fn());
      const dbOperation = vi.fn().mockResolvedValue({ error: null });

      await withOptimisticUpdate(updateFn, dbOperation);

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});

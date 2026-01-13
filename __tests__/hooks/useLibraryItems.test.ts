/**
 * USE LIBRARY ITEMS HOOK TESTS
 * ----------------------------------------------------------------------------
 * Tests for the centralized library fetching hook.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLibraryItems, LibraryPresets, clearLibraryCache } from '@/hooks/useLibraryItems';

// Mock the data service
vi.mock('@/lib/data-service', () => ({
    dataService: {
        library: {
            getByType: vi.fn(),
            getAll: vi.fn(),
        },
    },
}));

import { dataService } from '@/lib/data-service';

describe('useLibraryItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearLibraryCache();
    });

    describe('Basic Fetching', () => {
        it('should fetch items by type', async () => {
            const mockWeapons = [{ id: '1', name: 'Sword', type: 'weapon' }];
            const mockArmor = [{ id: '2', name: 'Shield', type: 'armor' }];

            (dataService.library.getByType as any)
                .mockResolvedValueOnce(mockWeapons)
                .mockResolvedValueOnce(mockArmor);

            const { result } = renderHook(() => useLibraryItems({
                types: ['weapon', 'armor'],
            }));

            // Initially loading
            expect(result.current.loading).toBe(true);
            expect(result.current.items).toEqual([]);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.items).toEqual([...mockWeapons, ...mockArmor]);
            expect(result.current.error).toBeNull();
            expect(dataService.library.getByType).toHaveBeenCalledTimes(2);
        });

        it('should fetch all items when fetchAll is true', async () => {
            const mockAll = [
                { id: '1', name: 'Sword', type: 'weapon' },
                { id: '2', name: 'Fireball', type: 'ability' },
            ];

            (dataService.library.getAll as any).mockResolvedValueOnce(mockAll);

            const { result } = renderHook(() => useLibraryItems({
                fetchAll: true,
            }));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.items).toEqual(mockAll);
            expect(dataService.library.getAll).toHaveBeenCalledTimes(1);
            expect(dataService.library.getByType).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle fetch errors gracefully', async () => {
            const mockError = new Error('Network error');
            (dataService.library.getByType as any).mockRejectedValueOnce(mockError);

            const { result } = renderHook(() => useLibraryItems({
                types: ['weapon'],
            }));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.error).toBe('Failed to load library data: Network error');
            expect(result.current.items).toEqual([]);
        });
    });

    describe('Options', () => {
        it('should pass includePlaytest option to data service', async () => {
            (dataService.library.getByType as any).mockResolvedValueOnce([]);

            renderHook(() => useLibraryItems({
                types: ['ability'],
                includePlaytest: true,
            }));

            await waitFor(() => {
                expect(dataService.library.getByType).toHaveBeenCalledWith('ability', { includePlaytest: true });
            });
        });

        it('should not fetch when enabled is false', async () => {
            const { result } = renderHook(() => useLibraryItems({
                types: ['weapon'],
                enabled: false,
            }));

            // Should not be loading since fetching is disabled
            expect(result.current.loading).toBe(false);
            expect(result.current.items).toEqual([]);
            expect(dataService.library.getByType).not.toHaveBeenCalled();
        });

        it('should not fetch when no types specified and fetchAll is false', async () => {
            const { result } = renderHook(() => useLibraryItems({
                types: [],
            }));

            expect(result.current.loading).toBe(false);
            expect(result.current.items).toEqual([]);
            expect(dataService.library.getByType).not.toHaveBeenCalled();
        });
    });

    describe('Presets', () => {
        it('should have correct INVENTORY preset', () => {
            expect(LibraryPresets.INVENTORY).toEqual(['weapon', 'armor', 'consumable', 'item']);
        });

        it('should have correct CARDS preset', () => {
            expect(LibraryPresets.CARDS).toEqual(['ability', 'spell', 'grimoire', 'domain']);
        });

        it('should have correct CHARACTER_CREATION preset', () => {
            expect(LibraryPresets.CHARACTER_CREATION).toEqual(['ancestry', 'community', 'class', 'subclass', 'domain']);
        });

        it('should have correct HERITAGE preset', () => {
            expect(LibraryPresets.HERITAGE).toEqual(['ancestry', 'community']);
        });
    });

    describe('Caching', () => {
        it('should use cached data when available and within cache time', async () => {
            const mockWeapons = [{ id: '1', name: 'Sword', type: 'weapon' }];
            (dataService.library.getByType as any).mockResolvedValue(mockWeapons);

            // First render - should fetch
            const { result: result1, unmount: unmount1 } = renderHook(() => useLibraryItems({
                types: ['weapon'],
                cacheTimeMs: 60000, // 1 minute cache
            }));

            await waitFor(() => {
                expect(result1.current.loading).toBe(false);
            });

            expect(dataService.library.getByType).toHaveBeenCalledTimes(1);
            unmount1();

            // Second render - should use cache
            const { result: result2 } = renderHook(() => useLibraryItems({
                types: ['weapon'],
                cacheTimeMs: 60000,
            }));

            // Should immediately have data from cache (not loading)
            await waitFor(() => {
                expect(result2.current.items).toEqual(mockWeapons);
            });

            // Should not have made another API call
            expect(dataService.library.getByType).toHaveBeenCalledTimes(1);
        });

        it('should refetch when cache is cleared', async () => {
            const mockWeapons = [{ id: '1', name: 'Sword', type: 'weapon' }];
            (dataService.library.getByType as any).mockResolvedValue(mockWeapons);

            // First render
            const { result: result1, unmount: unmount1 } = renderHook(() => useLibraryItems({
                types: ['weapon'],
                cacheTimeMs: 60000,
            }));

            await waitFor(() => {
                expect(result1.current.loading).toBe(false);
            });

            expect(dataService.library.getByType).toHaveBeenCalledTimes(1);
            unmount1();

            // Clear cache
            clearLibraryCache();

            // Second render - should refetch since cache was cleared
            const { result: result2 } = renderHook(() => useLibraryItems({
                types: ['weapon'],
                cacheTimeMs: 60000,
            }));

            await waitFor(() => {
                expect(result2.current.loading).toBe(false);
            });

            // Should have made another API call
            expect(dataService.library.getByType).toHaveBeenCalledTimes(2);
        });
    });

    describe('Refetch', () => {
        it('should provide a refetch function', async () => {
            const mockWeapons = [{ id: '1', name: 'Sword', type: 'weapon' }];
            (dataService.library.getByType as any).mockResolvedValue(mockWeapons);

            const { result } = renderHook(() => useLibraryItems({
                types: ['weapon'],
            }));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(typeof result.current.refetch).toBe('function');
            expect(dataService.library.getByType).toHaveBeenCalledTimes(1);

            // Manually refetch
            await result.current.refetch();

            expect(dataService.library.getByType).toHaveBeenCalledTimes(2);
        });
    });
});

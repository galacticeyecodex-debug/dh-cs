import React from 'react';
import { render, screen } from '@testing-library/react';
import CharacterVitalsBanner from '@/components/vitals/mini-vitals-banner';
import { useCharacterStore } from '@/store/character-store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the store
vi.mock('@/store/character-store');
vi.mock('@/lib/utils', async () => {
    const actual = await vi.importActual('@/lib/utils');
    return {
        ...actual as any,
        getClassBaseStat: vi.fn((char, stat) => {
            if (stat === 'hp') return 10;
            if (stat === 'evasion') return 10;
            if (stat === 'stress') return 6;
            return 0;
        }),
    };
});
vi.mock('@/lib/icon-utils', () => ({
    getIconByName: vi.fn(() => ({ className }: any) => <div data-testid="icon" className={className} />),
    AppIcons: {
        vitals: {
            evasion: 'evasion',
            armor: 'armor',
            hitPoints: 'hitPoints',
            stress: 'stress',
            hope: 'hope',
            fear: 'fear'
        }
    }
}));
vi.mock('@/lib/modifier-aggregator', () => ({
    getStatModifierTotal: vi.fn(() => 0),
    getStatModifiers: vi.fn(() => []),
}));

describe('CharacterVitalsBanner', () => {
    const mockUseCharacterStore = useCharacterStore as unknown as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays Armor as Marked/Total (Max - Current)', () => {
        mockUseCharacterStore.mockReturnValue({
            character: {
                id: '1',
                level: 1,
                vitals: {
                    hit_points_current: 9, // 1 Marked
                    armor_slots: 4, // 1 Marked
                    stress_current: 2,
                },
                hope: 3,
                character_inventory: [
                    {
                        location: 'equipped_armor',
                        library_item: {
                            data: {
                                base_score: 5 // Max Armor 5
                            }
                        }
                    }
                ],
                damage_thresholds: { minor: 1, major: 2, severe: 3 }
            },
            vitalIcons: {
                armor: 'shield',
                hitPoints: 'heart',
                stress: 'brain',
                hope: 'star',
                evasion: 'wind',
                fear: 'ghost',
            },
            activeCampaign: null,
            cardStates: {},
            updateVitals: vi.fn(),
            updateHope: vi.fn(),
            updateEvasion: vi.fn(),
            updateModifiers: vi.fn(),
        });

        render(<CharacterVitalsBanner />);

        // Armor: Max 5, Current 4 (Remaining).
        // Marked = 5 - 4 = 1.
        // Expect display to be "1" and "/5"
        const armorButton = screen.getByRole('button', { name: /Armor/i });
        expect(armorButton).toHaveTextContent('1');
        expect(armorButton).toHaveTextContent('/5');
    });

    it('displays Armor as 0 even when unarmored', () => {
        mockUseCharacterStore.mockReturnValue({
            character: {
                id: '1',
                level: 1,
                vitals: {
                    hit_points_current: 7,
                    armor_slots: 0,
                    stress_current: 0,
                },
                hope: 0,
                character_inventory: [], // No armor = 0 max armor
                damage_thresholds: { minor: 1, major: 1, severe: 2 }
            },
            vitalIcons: {
                armor: 'shield',
                hitPoints: 'heart',
                stress: 'brain',
                hope: 'star',
                evasion: 'wind',
                fear: 'ghost',
            },
            activeCampaign: null,
            cardStates: {},
            updateVitals: vi.fn(),
            updateHope: vi.fn(),
            updateEvasion: vi.fn(),
            updateModifiers: vi.fn(),
        });

        render(<CharacterVitalsBanner />);

        // Unarmored: Max 0, Current 0.
        const armorButton = screen.getByRole('button', { name: /Armor/i });
        expect(armorButton).toHaveTextContent('0');
        expect(armorButton).not.toHaveTextContent('/0'); // UI hides /0
        expect(screen.getByText(/NONE/i)).toBeInTheDocument(); // subLabel should be 'None'
    });

    it('displays HP as Marked/Total (Max - Current)', () => {
        mockUseCharacterStore.mockReturnValue({
            character: {
                id: '1',
                level: 1,
                vitals: {
                    hit_points_current: 7, // 3 Marked (10 - 7)
                    armor_slots: 5,
                    stress_current: 0,
                },
                hope: 0,
                character_inventory: [],
                damage_thresholds: { minor: 1, major: 1, severe: 2 }
            },
            vitalIcons: {
                armor: 'shield',
                hitPoints: 'heart',
                stress: 'brain',
                hope: 'star',
                evasion: 'wind',
                fear: 'ghost',
            },
            activeCampaign: null,
            cardStates: {},
            updateVitals: vi.fn(),
            updateHope: vi.fn(),
            updateEvasion: vi.fn(),
            updateModifiers: vi.fn(),
        });

        render(<CharacterVitalsBanner />);

        // HP: Max 10 (mocked), Current 7.
        // Marked = 10 - 7 = 3.
        const hpButton = screen.getByRole('button', { name: /Hit Points/i });
        expect(hpButton).toHaveTextContent('3');
        expect(hpButton).toHaveTextContent('/10');
    });
});

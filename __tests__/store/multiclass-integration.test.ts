
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore, Character } from '@/store/character-store';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock('@/lib/supabase/client', () => ({
  default: () => mockSupabase,
}));

// Mock Level Up Helpers
vi.mock('@/lib/level-up-helpers', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        // Ensure calculateTierAchievements behaves deterministically
        calculateTierAchievements: (level) => ({
            newExperienceValue: level === 5 ? 2 : null,
            proficiencyIncrease: level === 5 ? 1 : 0,
            shouldClearMarkedTraits: level === 5,
        }),
    };
});

describe('Multiclass Integration', () => {
    beforeEach(() => {
        useCharacterStore.setState({
            character: {
                id: 'char-123',
                user_id: 'user-123',
                name: 'Test Char',
                level: 4,
                class_id: 'Warrior',
                subclass_id: 'Guardian',
                stats: {},
                vitals: {},
                damage_thresholds: { minor: 1, major: 8, severe: 16 },
                proficiency: 1,
                evasion: 10,
                experiences: [],
                domains: ['Blade', 'Bone'],
                modifiers: {},
                gold: {},
                character_inventory: [],
                character_cards: [],
                marked_traits_jsonb: {},
                advancement_history_jsonb: {},
                subclass_progression: {},
            } as any,
        });
        vi.clearAllMocks();
    });

    it('should update multiclass fields and insert foundation card', async () => {
        // Mock library lookup for subclass/foundation card
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'library') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ 
                        data: { id: 'subclass-guardian', type: 'subclass', name: 'Guardian Subclass', data: {} }, 
                        error: null 
                    }),
                };
            }
            if (table === 'character_cards') {
                return {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ 
                        data: { id: 'card-uuid-1', card_id: 'subclass-guardian', location: 'feature' }, 
                        error: null 
                    }),
                };
            }
            // Default mock for other tables
            return {
                select: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
        });

        const options = {
            newLevel: 5,
            selectedAdvancements: ['multiclass'],
            selectedDomainCardIds: ['card-123'],
            multiclassId: 'Wizard',
            multiclassDomain: 'Codex',
            multiclassSubclassId: 'subclass-guardian',
            multiclassFoundationCardId: 'subclass-guardian', 
            traitIncrements: [],
            experienceIncrements: [],
            hpSlotsAdded: 0,
            stressSlotsAdded: 0,
        };

        await useCharacterStore.getState().levelUpCharacter(options);

        // Verify Store Update
        const character = useCharacterStore.getState().character;
        expect(character?.multiclass_id).toBe('Wizard');
        expect(character?.multiclass_subclass_id).toBe('subclass-guardian');
        expect(character?.multiclass_progression?.foundation_obtained).toBe(true);
        expect(character?.domains).toContain('Codex');

        // Verify Database Update for Character
        expect(mockSupabase.from).toHaveBeenCalledWith('characters');
        
        // Verify Character Card Insert
        // Check if `insert` was called on `character_cards` table
        // We can check the mock calls
        // Since we re-implemented the mock, we can just spy on it or trust the implementation logic check above
        
        // Check local state updated with new card
        const cards = useCharacterStore.getState().character?.character_cards;
        const foundationCard = cards?.find(c => c.card_id === 'subclass-guardian');
        expect(foundationCard).toBeDefined();
        expect(foundationCard?.location).toBe('feature');
    });
});

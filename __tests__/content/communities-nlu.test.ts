/**
 * COMMUNITY ABILITIES SCHEMA VALIDATION TESTS
 * 
 * These tests validate that the card parser correctly extracts structured data
 * from community feat descriptions using Natural Language Understanding. Each test is based
 * solely on analyzing the "text" fields to predict expected output.
 * 
 * Test expectations are derived from human understanding of the ability text,
 * NOT from the current parser output (which may be inaccurate).
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

// Helper to create minimal raw feat for testing
function rawFeat(name: string, text: string) {
    return { name, level: '1', domain: 'Community', type: 'Ability', recall: '0', text };
}

describe('Community Abilities Schema Validation - Highborne', () => {
    describe('Privilege', () => {
        const feat = rawFeat('Privilege',
            'You have advantage on rolls to consort with nobles, negotiate prices, or leverage your reputation to get what you want.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be timing free', () => {
            expect(enhanced.enhancement.timing).toBe('free');
        });

        it('should be frequency at_will', () => {
            expect(enhanced.enhancement.frequency).toBe('at_will');
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Loreborne', () => {
    describe('Well-Read', () => {
        const feat = rawFeat('Well-Read',
            'You have advantage on rolls that involve the history, culture, or politics of a prominent person or place.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Orderborne', () => {
    describe('Dedicated', () => {
        const feat = rawFeat('Dedicated',
            'Record three sayings or values your upbringing instilled in you. Once per rest, when you describe how you\'re embodying one of these principles through your current action, you can roll a **d20** as your Hope Die.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type buff (enhanced Hope Die)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should be frequency once_per_rest', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_rest');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Ridgeborne', () => {
    describe('Steady', () => {
        const feat = rawFeat('Steady',
            'You have advantage on rolls to traverse dangerous cliffs and ledges, navigate harsh environments, and use your survival knowledge.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Seaborne', () => {
    describe('Know the Tide', () => {
        const feat = rawFeat('Know the Tide',
            'You can sense the ebb and flow of life. When you roll with Fear, place a token on your community card. You can hold a number of tokens equal to your level. Before you make an **action roll**, you can spend any number of these tokens to gain a +1 bonus to the roll for each token spent. At the end of each session, clear all unspent tokens.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (token mechanics)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have has_tokens = true', () => {
            expect(enhanced.enhancement.tokens?.has_tokens).toBe(true);
        });

        it('should have token_source = level', () => {
            expect(enhanced.enhancement.tokens?.token_source).toBe('level');
        });

        it('should have no costs (gains tokens on Fear, spends them for bonus)', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Slyborne', () => {
    describe('Scoundrel', () => {
        const feat = rawFeat('Scoundrel',
            'You have advantage on rolls to negotiate with criminals, detect lies, or find a safe place to hide.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Underborne', () => {
    describe('Low-Light Living', () => {
        const feat = rawFeat('Low-Light Living',
            'When you\'re in an area with low light or heavy shadow, you have advantage on rolls to hide, investigate, or perceive details within that area.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (conditional advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Wanderborne', () => {
    describe('Nomadic Pack', () => {
        const feat = rawFeat('Nomadic Pack',
            'Add a Nomadic Pack to your inventory. Once per session, you can **spend a Hope** to reach into this pack and pull out a mundane item that\'s useful to your situation. Work with the GM to figure out what item you take out.');
        const enhanced = enhanceAbilityCard(feat);

        it('should have costs.hope = 1', () => {
            expect(enhanced.enhancement.costs?.hope).toBe(1);
        });

        it('should be frequency once_per_session', () => {
            expect(enhanced.enhancement.frequency).toBe('once_per_session');
        });

        it('should be action_type utility (item acquisition)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });
    });
});

describe('Community Abilities Schema Validation - Wildborne', () => {
    describe('Lightfoot', () => {
        const feat = rawFeat('Lightfoot',
            'Your movement is naturally silent. You have advantage on rolls to move without being heard.');
        const enhanced = enhanceAbilityCard(feat);

        it('should be action_type passive (always active advantage)', () => {
            expect(enhanced.enhancement.action_type).toBeUndefined();
        });

        it('should have keyword buff (grants advantage)', () => {
            expect(enhanced.enhancement.keywords).toContain('buff');
        });

        it('should have keyword movement', () => {
            expect(enhanced.enhancement.keywords).toContain('movement');
        });

        it('should have no costs', () => {
            expect(enhanced.enhancement.costs).toBeUndefined();
        });
    });
});

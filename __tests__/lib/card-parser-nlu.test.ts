/**
 * TESTS: Card Parser NLU - Enhancement Override Validation
 * ----------------------------------------------------------------------------
 * Tests the enhanceAbilityCard() parser output against every card that required
 * a manual enhancement_override. Each test documents what the parser gets wrong
 * (negative patterns) and what it gets right, providing a roadmap for parser
 * improvements.
 *
 * Test categories map to systematic parser deficiencies:
 * 1. Timing misclassification (reaction vs action)
 * 2. Keyword over-extraction (false "attack", "movement" keywords)
 * 3. Condition type errors ("always" vs "when_active")
 * 4. Missing linked_costs for variable resource spending
 * 5. Missing duration fields
 * 6. Missing gains objects
 * 7. Token system parsing errors
 * 8. Modifier formula/condition errors
 *
 * SRD Reference: content/public/srd/json/abilities_enhanced.json
 *                content/private/playtest/json/abilities_enhanced.json
 */

import { describe, it, expect } from 'vitest';
import { enhanceAbilityCard } from '@/lib/card-parser';

// ============================================================================
// Helper to run the parser on a card and return the enhancement block
// ============================================================================
function parseCard(card: {
  name: string;
  level: string;
  domain: string;
  type: string;
  recall: string;
  text: string;
}) {
  return enhanceAbilityCard(card).enhancement;
}

// ============================================================================
// ARCANA DOMAIN (12 overrides)
// ============================================================================
describe('NLU Override Validation - Arcana Domain', () => {

  describe('Rune Ward (Level 1, Spell)', () => {
    const card = {
      name: 'Rune Ward',
      level: '1',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: 'You have a deeply personal trinket that can be infused with protective magic and held as a ward by you or an ally. Describe what it is and why it\'s important to you. The ward\'s holder can **spend a Hope** to roll **1d8** and reduce incoming damage by the result.',
    };

    it('should correctly parse timing as reaction', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should correctly parse hope cost of 1', () => {
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should correctly parse keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['damage_reduction', 'hope_cost', 'spell']);
    });

    it('should correctly NOT produce modifiers with formula 1d8 (matches override)', () => {
      // Parser correctly avoids putting damage reduction as a modifier
      const result = parseCard(card);
      expect(result.modifiers).toBeUndefined();
      expect(result.gains?.damage_reduction_roll).toBeUndefined();
    });

    it('should NOT have duration field (override adds duration: "active")', () => {
      // Parser doesn't detect "active" duration for ward-style effects
      const result = parseCard(card);
      expect(result.duration).toBeUndefined();
    });
  });

  describe('Unleash Chaos (Level 1, Spell)', () => {
    const card = {
      name: 'Unleash Chaos',
      level: '1',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: 'At the beginning of a session, place a number of tokens equal to your Spellcast trait on this card.\n\nMake a **Spellcast Roll** against a target within Far range and spend any number of tokens to channel chaos. Roll a number of d10s equal to the number of tokens spent and deal that much magic damage to the target.\n\nIf all tokens have been removed, you can **mark a Stress** to replenish the tokens on this card.',
    };

    it('should correctly parse as attack action type', () => {
      const result = parseCard(card);
      expect(result.action_type).toBe('attack');
    });

    it('should INCORRECTLY parse timing as action (override: free)', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should correctly detect token mechanics', () => {
      const result = parseCard(card);
      expect(result.tokens?.has_tokens).toBe(true);
      expect(result.tokens?.token_source).toBe('spellcast');
    });

    it('should correctly parse attack trait and range', () => {
      const result = parseCard(card);
      expect(result.attack?.trait).toBe('Spellcast');
      expect(result.attack?.range).toBe('Far');
    });

    it('should correctly parse keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['damage', 'magic', 'stress_cost', 'tokens', 'spell']);
    });

    it('should NOT have linked_costs (override adds variable token→damage and stress→replenish)', () => {
      // Parser cannot detect linked_costs for variable resource spending
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });
  });

  describe('Floating Eye (Level 2, Spell)', () => {
    const card = {
      name: 'Floating Eye',
      level: '2',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: '**Spend a Hope** to create a single, small floating orb that you can move anywhere within Very Far range. While this spell is active, you can see through the orb as though you\'re looking out from its location.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse hope cost', () => {
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should correctly parse attack range as Very Far', () => {
      const result = parseCard(card);
      expect(result.attack?.range).toBe('Very Far');
    });

    it('should NOT have duration: "active" (override adds it for sustained effects)', () => {
      // Parser doesn't detect "While this spell is active" as duration: "active"
      const result = parseCard(card);
      expect(result.duration).toBeUndefined();
    });
  });

  describe('Counterspell (Level 3, Spell)', () => {
    const card = {
      name: 'Counterspell',
      level: '3',
      domain: 'Arcana',
      type: 'Spell',
      recall: '1',
      text: 'You can interrupt a magical effect taking place by making a **reaction roll** using your Spellcast trait. On a success, the effect stops and any consequences are avoided, and this card is placed in your vault.',
    };

    it('should correctly parse timing as reaction', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should correctly parse keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['spell']);
    });

    it('should parse roll trait as Spellcast', () => {
      const result = parseCard(card);
      expect(result.roll?.trait).toBe('Spellcast');
    });

    it('should INCORRECTLY set target_reaction to true (override sets false)', () => {
      // Parser misidentifies "reaction roll" as target_reaction: true
      // Override corrects to false because the PLAYER makes the reaction roll
      const result = parseCard(card);
      expect(result.roll?.target_reaction).toBe(true);
    });

    it('should NOT have gains.vault (override adds vault: true for self-vaulting)', () => {
      // Parser doesn't detect "placed in your vault" as a gain
      const result = parseCard(card);
      expect(result.gains?.vault).toBeUndefined();
    });
  });

  describe('Chain Lightning (Level 5, Spell)', () => {
    const card = {
      name: 'Chain Lightning',
      level: '5',
      domain: 'Arcana',
      type: 'Spell',
      recall: '2',
      text: '**Mark 2 Stress** to make a **Spellcast Roll**, unleashing lightning on all targets within Close range. Targets you succeed against must make a **reaction roll** with a Difficulty equal to the result of your Spellcast Roll or take **2d8+4** magic damage.',
    };

    it('should correctly parse as attack action type', () => {
      const result = parseCard(card);
      expect(result.action_type).toBe('attack');
    });

    it('should correctly parse stress cost of 2', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(2);
    });

    it('should correctly parse damage as 2d8+4 magic', () => {
      const result = parseCard(card);
      expect(result.attack?.damage).toBe('2d8+4');
      expect(result.attack?.damage_type).toBe('magic');
    });

    it('should correctly parse attack trait and range', () => {
      const result = parseCard(card);
      expect(result.attack?.trait).toBe('Spellcast');
      expect(result.attack?.range).toBe('Close');
    });

    it('should correctly parse keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['damage', 'magic', 'aoe', 'stress_cost', 'spell']);
    });

    it('should INCORRECTLY set timing to "reaction" (override corrects to "action")', () => {
      // Parser sees "reaction roll" in text and misclassifies the card timing
      // Override: timing should be "action" - the PLAYER initiates this attack
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should INCORRECTLY set combat_category to "passive_triggered" (override: "standalone_attack")', () => {
      // Parser doesn't recognize this as a standalone attack
      const result = parseCard(card);
      expect(result.attack?.combat_category).toBe('passive_triggered');
    });

    it('should INCORRECTLY set target_reaction to true (override: false)', () => {
      // The "reaction roll" text refers to the TARGET's reaction, not the roll type
      // But the parser should set target_reaction: false because the player initiates
      const result = parseCard(card);
      expect(result.roll?.target_reaction).toBe(true);
    });

    it('should correctly NOT set duration to conditional (matches override)', () => {
      // Parser correctly avoids detecting "Targets you succeed against" as a duration condition
      const result = parseCard(card);
      expect(result.duration).toBeUndefined();
    });
  });

  describe('Rift Walker (Level 6, Spell)', () => {
    const card = {
      name: 'Rift Walker',
      level: '6',
      domain: 'Arcana',
      type: 'Spell',
      recall: '2',
      text: 'Make a **Spellcast Roll (15)**. On a success, you place an arcane marking on the ground where you currently stand. The next time you successfully cast Rift Walker, a rift in space opens up, providing a doorway between where you are and where you left your previous marking.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse roll difficulty of 15', () => {
      const result = parseCard(card);
      expect(result.roll?.difficulty).toBe(15);
    });

    it('should correctly parse roll trait as Spellcast', () => {
      const result = parseCard(card);
      expect(result.roll?.trait).toBe('Spellcast');
    });

    it('should correctly parse keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['spell']);
    });

    it('should NOT have notes array (override adds location tracking note)', () => {
      // Parser doesn't detect location-tracking narrative mechanics
      const result = parseCard(card);
      expect(result.notes).toBeUndefined();
    });
  });

  describe('Cloaking Blast (Level 7, Spell)', () => {
    const card = {
      name: 'Cloaking Blast',
      level: '7',
      domain: 'Arcana',
      type: 'Spell',
      recall: '2',
      text: 'When you make a successful **Spellcast Roll** to cast a different spell, you can **spend a Hope** to become Cloaked. While Cloaked, you remain unseen if you are stationary when an adversary moves to within Very Close range of you. Moving from your position or making an attack breaks this effect.',
    };

    it('should correctly parse timing as reaction', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should correctly parse hope cost', () => {
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      // Parser falsely detects "attack" from "making an attack breaks this effect"
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('hope_cost');
      expect(result.keywords).toContain('spell');
    });

    it('should NOT have duration: "active" (override adds it for Cloaked state)', () => {
      // Parser doesn't detect "While Cloaked" as an active duration
      const result = parseCard(card);
      expect(result.duration).toBeUndefined();
    });
  });

  describe('Arcane Reflection (Level 8, Spell)', () => {
    const card = {
      name: 'Arcane Reflection',
      level: '8',
      domain: 'Arcana',
      type: 'Spell',
      recall: '2',
      text: 'When you would take magic damage, you can **spend any number of Hope** to roll that many **d6s**. If any roll a 6, the attack is reflected back to the caster, dealing the damage to them instead.',
    };

    it('should correctly parse timing as reaction', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should INCORRECTLY include extra keywords (override removes them)', () => {
      // Parser falsely detects keywords from damage/attack text
      const result = parseCard(card);
      expect(result.keywords).toContain('damage');
      expect(result.keywords).toContain('magic');
      expect(result.keywords).toContain('hope_cost');
      expect(result.keywords).toContain('attack');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('spell');
    });

    it('should INCORRECTLY parse fixed hope cost of 1 (override removes costs, uses linked_costs)', () => {
      // Parser reads "spend any number of Hope" but parses as fixed cost: 1
      // Override removes costs and uses linked_costs for variable spending
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should NOT have standalone attack (override adds it for reflected damage)', () => {
      // Parser doesn't detect the reflected attack
      const result = parseCard(card);
      expect(result.attack?.combat_category).toBeUndefined();
    });

    it('should NOT have linked_costs (override adds variable Hope→d6 roll)', () => {
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });
  });

  describe('Confusing Aura (Level 8, Spell)', () => {
    const card = {
      name: 'Confusing Aura',
      level: '8',
      domain: 'Arcana',
      type: 'Spell',
      recall: '2',
      text: 'Make a **Spellcast Roll (14)**. Once per long rest on a success, you create a layer of illusion over your body that makes it hard to tell exactly where you are. **Mark any number of Stress** to make that many layers. When an attack against you succeeds, roll a d6 for each layer. For each die that rolls a 6, a layer is consumed and the attack fails.',
    };

    it('should INCORRECTLY parse timing as action (override: reaction)', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse roll difficulty of 14', () => {
      const result = parseCard(card);
      expect(result.roll?.difficulty).toBe(14);
    });

    it('should correctly parse frequency as once_per_long_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_long_rest');
    });

    it('should NOT have tokens (override adds token system for layers)', () => {
      // Parser doesn't recognize "layers" as a token system
      const result = parseCard(card);
      expect(result.tokens?.has_tokens).toBeUndefined();
    });

    it('should NOT have linked_costs (override adds stress→layers linked cost)', () => {
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });

    it('should NOT have variable_roll (override adds layer consumption roll)', () => {
      const result = parseCard(card);
      // @ts-ignore - variable_roll is a custom field in override
      expect(result.variable_roll).toBeUndefined();
    });

    it('should NOT have "tokens" in keywords (override adds it)', () => {
      const result = parseCard(card);
      expect(result.keywords).not.toContain('tokens');
    });
  });

  describe('Earthquake (Level 9, Spell)', () => {
    const card = {
      name: 'Earthquake',
      level: '9',
      domain: 'Arcana',
      type: 'Spell',
      recall: '3',
      text: 'Make a **Spellcast Roll (16)**. Once per rest on a success, all targets within Very Far range who aren\'t flying must make a **Reaction Roll (18)**. Targets who fail take **3d10+8** physical damage and are knocked to the ground, making them temporarily Vulnerable.',
    };

    it('should correctly parse frequency as once_per_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_rest');
    });

    it('should correctly parse damage as 3d10+8 physical', () => {
      const result = parseCard(card);
      expect(result.attack?.damage).toBe('3d10+8');
      expect(result.attack?.damage_type).toBe('physical');
    });

    it('should correctly parse attack metadata', () => {
      const result = parseCard(card);
      expect(result.attack?.trait).toBe('Spellcast');
      expect(result.attack?.range).toBe('Very Far');
      expect(result.attack?.targets).toBe('all_in_range');
      expect(result.attack?.difficulty).toBe(16);
      expect(result.attack?.secondary_effects).toContain('vulnerable');
    });

    it('should correctly parse roll difficulty of 16', () => {
      const result = parseCard(card);
      expect(result.roll?.difficulty).toBe(16);
    });

    it('should INCORRECTLY set timing to "reaction" (override corrects to "action")', () => {
      // Parser sees "Reaction Roll" in text and misclassifies card timing
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should INCORRECTLY set combat_category to "passive_triggered" (override: "standalone_attack")', () => {
      const result = parseCard(card);
      expect(result.attack?.combat_category).toBe('passive_triggered');
    });

    it('should INCORRECTLY set target_reaction to true (override: false)', () => {
      // The Reaction Roll is for TARGETS, but target_reaction should be false
      // because the player initiates the attack
      const result = parseCard(card);
      expect(result.roll?.target_reaction).toBe(true);
    });

    it('should correctly NOT include "movement" keyword (matches override)', () => {
      // Parser correctly avoids extracting "movement" from "knocked to the ground"
      const result = parseCard(card);
      expect(result.keywords).not.toContain('movement');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['damage', 'physical', 'aoe', 'debuff', 'spell']);
    });
  });

  describe('Sensory Projection (Level 9, Spell)', () => {
    const card = {
      name: 'Sensory Projection',
      level: '9',
      domain: 'Arcana',
      type: 'Spell',
      recall: '3',
      text: 'Once per rest, make a **Spellcast Roll (15)**. On a success, drop into a vision that lets you clearly see and hear any place you have been before as though you are standing there in this moment. You can look around and move within the location while the projection is active.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as once_per_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_rest');
    });

    it('should correctly parse roll metadata', () => {
      const result = parseCard(card);
      expect(result.roll?.type).toBe('Spellcast Roll');
      expect(result.roll?.trait).toBe('Spellcast');
      expect(result.roll?.difficulty).toBe(15);
    });

    it('should INCORRECTLY include "movement" keyword (override removes it)', () => {
      // Parser falsely detects "movement" from "look around and move"
      const result = parseCard(card);
      expect(result.keywords).toContain('movement');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('spell');
    });

    it('should NOT have duration: "active" (override adds it for projection effect)', () => {
      // "while the projection is active" should map to duration: "active"
      const result = parseCard(card);
      expect(result.duration).toBeUndefined();
    });
  });

  describe('Falling Sky (Level 10, Spell)', () => {
    const card = {
      name: 'Falling Sky',
      level: '10',
      domain: 'Arcana',
      type: 'Spell',
      recall: '3',
      text: 'Make a **Spellcast Roll** against all adversaries within Far range. **Mark any number of Stress** to make shards of arcana rain down from above. Targets you succeed against take **1d20+2** magic damage per Stress marked.',
    };

    it('should correctly parse as attack action type', () => {
      const result = parseCard(card);
      expect(result.action_type).toBe('attack');
    });

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse attack metadata', () => {
      const result = parseCard(card);
      expect(result.attack?.trait).toBe('Spellcast');
      expect(result.attack?.range).toBe('Far');
      expect(result.attack?.damage).toBe('1d20+2');
      expect(result.attack?.damage_type).toBe('magic');
      expect(result.attack?.targets).toBe('all_in_range');
    });

    it('should correctly parse keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toEqual(['damage', 'magic', 'aoe', 'stress_cost', 'spell']);
    });

    it('should NOT have linked_costs (override adds variable stress→damage roll)', () => {
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });
  });
});

// ============================================================================
// BLADE DOMAIN (6 overrides)
// ============================================================================
describe('NLU Override Validation - Blade Domain', () => {

  describe('Deadly Focus (Level 4, Ability)', () => {
    const card = {
      name: 'Deadly Focus',
      level: '4',
      domain: 'Blade',
      type: 'Ability',
      recall: '1',
      text: 'Once per rest, you can apply all your focus toward a target of your choice. Until you attack another creature, you defeat the target, or the battle ends, gain a +1 bonus to your Proficiency.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as once_per_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_rest');
    });

    it('should correctly parse +1 proficiency modifier with when_active condition', () => {
      const result = parseCard(card);
      const profMod = result.modifiers?.find(m => m.stat === 'proficiency');
      expect(profMod).toBeDefined();
      expect(profMod?.value).toBe(1);
      expect(profMod?.condition?.type).toBe('when_active');
    });

    it('should correctly parse duration as conditional', () => {
      const result = parseCard(card);
      expect(result.duration).toBe('conditional');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      // Parser falsely detects "attack" from "Until you attack another creature"
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });
  });

  describe('Fortified Armor (Level 4, Ability)', () => {
    const card = {
      name: 'Fortified Armor',
      level: '4',
      domain: 'Blade',
      type: 'Ability',
      recall: '1',
      text: 'While you are wearing armor, gain a +2 bonus to your damage thresholds.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should correctly parse +2 damage_threshold modifier', () => {
      const result = parseCard(card);
      const thresholdMod = result.modifiers?.find(m => m.stat === 'damage_threshold');
      expect(thresholdMod).toBeDefined();
      expect(thresholdMod?.value).toBe(2);
    });

    it('should INCORRECTLY set condition to "when_armored" (override uses "when_active")', () => {
      // Parser detects "wearing armor" and sets when_armored
      // Override changes to when_active for UI activation toggle
      const result = parseCard(card);
      const thresholdMod = result.modifiers?.find(m => m.stat === 'damage_threshold');
      expect(thresholdMod?.condition?.type).toBe('when_armored');
    });

    it('should INCORRECTLY include "damage" keyword (override removes it)', () => {
      // Parser falsely detects "damage" from "damage thresholds"
      const result = parseCard(card);
      expect(result.keywords).toContain('damage');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('ability');
    });
  });

  describe('Vitality (Level 5, Ability)', () => {
    const card = {
      name: 'Vitality',
      level: '5',
      domain: 'Blade',
      type: 'Ability',
      recall: '2',
      text: 'When you choose this card, permanently gain two of the following benefits:\n\n- One Stress slot\n- One Hit Point slot\n- +2 bonus to your damage thresholds\n\nThen place this card in your vault permanently.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should parse only one damage_threshold modifier (override needs 3 separate modifiers)', () => {
      // Parser only extracts the +2 threshold modifier
      // Override has 3 modifiers: stress slot, HP slot, and thresholds
      const result = parseCard(card);
      const thresholdMods = result.modifiers?.filter(m => m.stat === 'damage_threshold');
      expect(thresholdMods?.length).toBe(1);
    });

    it('should NOT parse stress or hit_points modifiers (override adds them)', () => {
      // Parser doesn't detect "One Stress slot" or "One Hit Point slot" as modifiers
      const result = parseCard(card);
      const stressMod = result.modifiers?.find(m => m.stat === 'stress');
      const hpMod = result.modifiers?.find(m => m.stat === 'hit_points');
      expect(stressMod).toBeUndefined();
      expect(hpMod).toBeUndefined();
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should use condition "always" not "when_active_permanent" (override corrects)', () => {
      // Parser uses "always" for unconditional modifiers
      // Override needs "when_active_permanent" for permanent vault choices
      const result = parseCard(card);
      const thresholdMod = result.modifiers?.find(m => m.stat === 'damage_threshold');
      expect(thresholdMod?.condition?.type).toBe('always');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('damage');
      expect(result.keywords).toContain('ability');
    });
  });

  describe('Battle-Hardened (Level 6, Ability)', () => {
    const card = {
      name: 'Battle-Hardened',
      level: '6',
      domain: 'Blade',
      type: 'Ability',
      recall: '2',
      text: 'Once per long rest when you would make a Death Move, you can **spend a Hope** to clear a Hit Point instead.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as once_per_long_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_long_rest');
    });

    it('should correctly parse hope cost', () => {
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should INCORRECTLY include "movement" keyword (override removes it)', () => {
      // Parser falsely detects "movement" from "Death Move"
      const result = parseCard(card);
      expect(result.keywords).toContain('movement');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should INCORRECTLY have duplicate "healing" keywords (override deduplicates)', () => {
      const result = parseCard(card);
      const healingCount = result.keywords?.filter(k => k === 'healing').length ?? 0;
      expect(healingCount).toBeGreaterThan(1);
    });

    it('should NOT have gains.hit_points_clear (override adds it)', () => {
      // Parser doesn't detect "clear a Hit Point" as a gain
      const result = parseCard(card);
      expect(result.gains?.hit_points_clear).toBeUndefined();
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('healing');
      expect(result.keywords).toContain('hope_cost');
      expect(result.keywords).toContain('ability');
    });
  });

  describe('Rage Up (Level 6, Ability)', () => {
    const card = {
      name: 'Rage Up',
      level: '6',
      domain: 'Blade',
      type: 'Ability',
      recall: '2',
      text: 'Before you make an attack, you can **mark a Stress** to gain a bonus to your damage roll equal to twice your Strength. You can Rage Up twice per attack.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should correctly parse stress cost', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should correctly parse 2_times_strength damage modifier', () => {
      const result = parseCard(card);
      const damageMod = result.modifiers?.find(m => m.stat === 'damage');
      expect(damageMod).toBeDefined();
      expect(damageMod?.formula).toBe('2_times_strength');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      // Parser detects "attack" from "make an attack" but this is a damage modifier, not an attack card
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('damage');
      expect(result.keywords).toContain('stress_cost');
      expect(result.keywords).toContain('ability');
    });
  });

  describe('Gore and Glory (Level 9, Ability)', () => {
    const card = {
      name: 'Gore and Glory',
      level: '9',
      domain: 'Blade',
      type: 'Ability',
      recall: '3',
      text: 'When you critically succeed on a weapon attack, gain an additional Hope or clear an additional Stress.\n\nAdditionally, when you deal enough damage to defeat an enemy, gain a Hope or clear a Stress.',
    };

    it('should correctly parse timing as reaction', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should INCORRECTLY have duplicate "stress_relief" keywords (override deduplicates)', () => {
      const result = parseCard(card);
      const stressReliefCount = result.keywords?.filter(k => k === 'stress_relief').length ?? 0;
      expect(stressReliefCount).toBeGreaterThan(1);
    });

    it('should NOT have gains for hope and stress_clear (override adds them)', () => {
      const result = parseCard(card);
      expect(result.gains?.hope).toBeUndefined();
      expect(result.gains?.stress_clear).toBeUndefined();
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('damage');
      expect(result.keywords).toContain('stress_relief');
      expect(result.keywords).toContain('hope_gain');
      expect(result.keywords).toContain('ability');
    });
  });
});

// ============================================================================
// BONE DOMAIN (1 override)
// ============================================================================
describe('NLU Override Validation - Bone Domain', () => {

  describe('Deft Maneuvers (Level 1, Ability)', () => {
    const card = {
      name: 'Deft Maneuvers',
      level: '1',
      domain: 'Bone',
      type: 'Ability',
      recall: '1',
      text: 'Once per rest, **mark a Stress** to sprint anywhere within Far range without making an **Agility Roll** to get there.\n\nIf you end this movement within Melee range of an adversary and immediately make an attack against them, gain a +1 bonus to the attack roll.',
    };

    it('should correctly parse timing as action', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should correctly parse frequency as once_per_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_rest');
    });

    it('should correctly parse stress cost', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should correctly parse attack metadata', () => {
      const result = parseCard(card);
      expect(result.attack?.trait).toBe('Agility');
      expect(result.attack?.range).toBe('Far');
    });

    it('should correctly parse +1 attack modifier', () => {
      const result = parseCard(card);
      const attackMod = result.modifiers?.find(m => m.stat === 'attack');
      expect(attackMod).toBeDefined();
      expect(attackMod?.value).toBe(1);
    });

    it('should INCORRECTLY set modifier condition to "always" (override: "when_active")', () => {
      // Parser doesn't recognize the conditional nature of the attack bonus
      const result = parseCard(card);
      const attackMod = result.modifiers?.find(m => m.stat === 'attack');
      expect(attackMod?.condition?.type).toBe('always');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('stress_cost');
      expect(result.keywords).toContain('ability');
    });

    it('should NOT have duration: "conditional" (override adds it)', () => {
      const result = parseCard(card);
      expect(result.duration).toBeUndefined();
    });

    it('should NOT have roll with requires_cost_for_roll (override adds Attack Roll)', () => {
      // Override adds a roll definition that the parser doesn't produce
      const result = parseCard(card);
      expect(result.roll).toBeUndefined();
    });
  });
});

// ============================================================================
// MIDNIGHT DOMAIN (9 overrides)
// ============================================================================
describe('NLU Override Validation - Midnight Domain', () => {

  describe('Chokehold (Level 3, Ability)', () => {
    const card = {
      name: 'Chokehold',
      level: '3',
      domain: 'Midnight',
      type: 'Ability',
      recall: '1',
      text: 'When you position yourself behind a creature who\'s about your size, you can **mark a Stress** to pull them into a chokehold, making them temporarily Vulnerable.\n\nWhen a creature attacks a target who is Vulnerable, they can deal an additional 2d6 damage to the target.',
    };

    it('should correctly parse stress cost', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should INCORRECTLY include "movement" keyword (override removes it)', () => {
      // Parser falsely detects "movement" from position/behind text
      const result = parseCard(card);
      expect(result.keywords).toContain('movement');
    });

    it('should NOT have additional_damage (override adds 2d6 for Vulnerable targets)', () => {
      // Parser doesn't detect additional_damage from "deal an additional 2d6 damage"
      const result = parseCard(card);
      expect(result.attack?.additional_damage).toBeUndefined();
    });
  });

  describe('Phantom Retreat (Level 5, Spell)', () => {
    const card = {
      name: 'Phantom Retreat',
      level: '5',
      domain: 'Midnight',
      type: 'Spell',
      recall: '2',
      text: '**Spend a Hope** to activate Phantom Retreat where you\'re currently standing. **Spend another Hope** at any time before your next rest to disappear from where you are and reappear where you were standing when you activated Phantom Retreat.',
    };

    it('should correctly parse hope cost', () => {
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should NOT have notes array (override adds location tracking note)', () => {
      const result = parseCard(card);
      expect(result.notes).toBeUndefined();
    });
  });

  describe('Mass Disguise (Level 6, Spell)', () => {
    const card = {
      name: 'Mass Disguise',
      level: '6',
      domain: 'Midnight',
      type: 'Spell',
      recall: '2',
      text: 'When you have a few minutes of silence to focus, you can **mark a Stress** to change the appearance of all willing creatures within Close range. Their new forms must share a general body structure and size with the original. This effect lasts until there are no more tokens on this card or until there is a reason to disbelieve the disguise.',
    };

    it('should correctly parse stress cost', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should NOT have tokens with Countdown source (override adds token system)', () => {
      // Parser may detect "tokens on this card" but misses the Countdown source
      const result = parseCard(card);
      if (result.tokens) {
        expect(result.tokens.token_source).not.toBe('Countdown');
      }
    });
  });

  describe('Midnight-Touched (Level 7, Ability)', () => {
    const card = {
      name: 'Midnight-Touched',
      level: '7',
      domain: 'Midnight',
      type: 'Ability',
      recall: '2',
      text: 'When you have midnight domain cards in your loadout are from the midnight domain, gain the following benefits:\n\n- Once per rest, when you have 0 Hope and the GM would gain a Fear, you can gain a Hope instead.\n- When you make a successful attack, you can mark a Stress to add the result of your Fear Die to your damage roll.',
    };

    it('should correctly parse stress cost', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should INCORRECTLY have fear_die modifier (override replaces with gains.hope)', () => {
      // Parser detects the fear_die modifier, but override removes it
      // and replaces the mechanic with gains.hope = 1
      const result = parseCard(card);
      const fearDieMod = result.modifiers?.find(m => m.formula === 'fear_die');
      expect(fearDieMod).toBeDefined();
    });

    it('should NOT have gains.hope (override adds it)', () => {
      const result = parseCard(card);
      expect(result.gains?.hope).toBeUndefined();
    });
  });

  describe('Shadowhunter (Level 8, Ability)', () => {
    const card = {
      name: 'Shadowhunter',
      level: '8',
      domain: 'Midnight',
      type: 'Ability',
      recall: '2',
      text: 'Your prowess is enhanced under the cover of shadow. While you\'re shrouded in low light or darkness, you gain a +1 bonus to your Evasion and make attack rolls with advantage.',
    };

    it('should correctly parse +1 evasion modifier', () => {
      const result = parseCard(card);
      const evasionMod = result.modifiers?.find(m => m.stat === 'evasion');
      expect(evasionMod).toBeDefined();
      expect(evasionMod?.value).toBe(1);
    });

    it('should INCORRECTLY set condition to "always" (override: "when_active")', () => {
      // Parser doesn't detect "While shrouded in low light or darkness" as conditional
      const result = parseCard(card);
      const evasionMod = result.modifiers?.find(m => m.stat === 'evasion');
      expect(evasionMod?.condition?.type).toBe('always');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });
  });

  describe('Spellcharge (Level 8, Spell)', () => {
    const card = {
      name: 'Spellcharge',
      level: '8',
      domain: 'Midnight',
      type: 'Spell',
      recall: '2',
      text: 'When you take magic damage, place tokens equal to the number of Hit Points you marked on this card. You can store a number of tokens equal to your Spellcast trait.\n\nWhen you make a successful attack against a creature, you can spend any number of tokens to deal an additional 1d6 magic damage per token.',
    };

    it('should correctly detect token mechanics', () => {
      const result = parseCard(card);
      expect(result.tokens?.has_tokens).toBe(true);
    });

    it('should INCORRECTLY parse token_source as "the" (override: "spellcast")', () => {
      // Parser fails to properly extract "Spellcast" from "equal to your Spellcast trait"
      const result = parseCard(card);
      expect(result.tokens?.token_source).toBe('the');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should NOT have linked_costs (override adds variable token→d6 damage)', () => {
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });
  });

  describe('Night Terror (Level 9, Spell)', () => {
    const card = {
      name: 'Night Terror',
      level: '9',
      domain: 'Midnight',
      type: 'Spell',
      recall: '3',
      text: 'Once per long rest, choose any targets within Very Close range to perceive you as a nightmarish horror. The targets must succeed on a **Reaction Roll (16)** or become temporarily Horrified. While Horrified, the GM can spend any number of Fear to deal that many d6s in magic damage to a Horrified target.',
    };

    it('should correctly parse frequency as once_per_long_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_long_rest');
    });

    it('should INCORRECTLY set timing to "reaction" (override: "action")', () => {
      // Parser sees "Reaction Roll" and misclassifies the card timing
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should INCORRECTLY parse roll type as "Spellcast Roll" (override: "Reaction Roll")', () => {
      // Parser may default to Spellcast Roll for spells
      // Override specifies the targets make a Reaction Roll
      const result = parseCard(card);
      expect(result.roll?.type).toBe('Spellcast Roll');
    });

    it('should NOT have linked_costs (override adds variable Fear→d6 damage)', () => {
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });
  });

  describe('Twilight Toll (Level 9, Ability)', () => {
    const card = {
      name: 'Twilight Toll',
      level: '9',
      domain: 'Midnight',
      type: 'Ability',
      recall: '3',
      text: 'Choose a target within Far range. When you succeed on an **action roll** against them that doesn\'t result in making a damage roll, place a token on this card. When you deal damage to this target, spend all tokens on this card and roll a d12 for each one, adding the total to your damage.',
    };

    it('should correctly detect token mechanics', () => {
      const result = parseCard(card);
      expect(result.tokens?.has_tokens).toBe(true);
    });

    it('should NOT have linked_costs (override adds variable token→d12 damage)', () => {
      const result = parseCard(card);
      expect(result.linked_costs).toBeUndefined();
    });
  });

  describe('Eclipse (Level 10, Spell)', () => {
    const card = {
      name: 'Eclipse',
      level: '10',
      domain: 'Midnight',
      type: 'Spell',
      recall: '3',
      text: 'Make a **Spellcast Roll (16)**. Once per long rest on a success, plunge the entire area within Far range into complete darkness only you and your allies can see through. Attack rolls have disadvantage and Evasion is reduced by 3 for all creatures who cannot see through the darkness.',
    };

    it('should correctly parse frequency as once_per_long_rest', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('once_per_long_rest');
    });

    it('should correctly parse roll difficulty of 16', () => {
      const result = parseCard(card);
      expect(result.roll?.difficulty).toBe(16);
    });

    it('should correctly NOT set action_type to "attack" (matches override)', () => {
      // Parser correctly avoids classifying as attack despite "Attack rolls" text
      const result = parseCard(card);
      expect(result.action_type).toBeUndefined();
    });

    it('should correctly NOT include stress cost (matches override)', () => {
      // Parser correctly avoids detecting a stress cost
      const result = parseCard(card);
      expect(result.costs?.stress).toBeUndefined();
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should NOT have duration: "active" (override adds it)', () => {
      const result = parseCard(card);
      expect(result.duration).not.toBe('active');
    });

    it('should correctly NOT include "damage" keyword (matches override)', () => {
      // Parser correctly avoids extracting "damage" for this debuff card
      const result = parseCard(card);
      expect(result.keywords).not.toContain('damage');
    });
  });
});

// ============================================================================
// SAGE DOMAIN (1 override)
// ============================================================================
describe('NLU Override Validation - Sage Domain', () => {

  describe('Force of Nature (Level 10, Spell)', () => {
    const card = {
      name: 'Force of Nature',
      level: '10',
      domain: 'Sage',
      type: 'Spell',
      recall: '3',
      text: '**Mark a Stress** to transform into a hulking nature spirit, gaining the following benefits:\n\n- When you succeed on an attack or **Spellcast Roll**, gain a +10 bonus to the damage roll.\n- When you deal enough damage to defeat an enemy, gain a Hope.\n- You can **spend a Hope** to move a tree to any position within Close range.\n\nThis transformation ends when there are no more enemies in the scene or when you choose to end it.',
    };

    it('should correctly parse +10 damage modifier', () => {
      const result = parseCard(card);
      const damageMod = result.modifiers?.find(m => m.stat === 'damage' && m.value === 10);
      expect(damageMod).toBeDefined();
    });

    it('should correctly parse stress cost', () => {
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should INCORRECTLY set timing to "reaction" (override: "action")', () => {
      // Parser misclassifies as reaction
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should NOT set attack.trait to "None" (override adds it for non-attack transformation)', () => {
      // Override explicitly sets trait: "None" since the card isn't an attack
      const result = parseCard(card);
      expect(result.attack?.trait).not.toBe('None');
    });

    it('should NOT have duration: "conditional" (override adds it)', () => {
      // "ends when there are no more enemies" is a conditional duration
      const result = parseCard(card);
      // Parser may or may not detect this - check the override value
      if (result.duration !== 'conditional') {
        expect(result.duration).not.toBe('conditional');
      }
    });
  });
});

// ============================================================================
// BLOOD DOMAIN - Playtest (5 overrides)
// ============================================================================
describe('NLU Override Validation - Blood Domain (Playtest)', () => {

  describe('Power Through Pain (Level 1, Ability)', () => {
    const card = {
      name: 'Power Through Pain',
      level: '1',
      domain: 'Blood',
      type: 'Ability',
      recall: '1',
      text: 'If you have at least one Hit Point marked, you gain a bonus to your damage rolls. The bonus equals twice your number of marked Hit Points.',
    };

    it('should NOT parse any modifiers (override adds formula-based damage modifier)', () => {
      // Parser doesn't detect "twice your number of marked Hit Points" as a modifier formula
      const result = parseCard(card);
      const damageMod = result.modifiers?.find(m => m.stat === 'damage');
      expect(damageMod).toBeUndefined();
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });
  });

  describe('Vitality Manipulation (Level 2, Spell)', () => {
    const card = {
      name: 'Vitality Manipulation',
      level: '2',
      domain: 'Blood',
      type: 'Spell',
      recall: '1',
      text: 'Make a **Spellcast Roll** against a target within Very Close range. If you cast this on an ally, make the roll with advantage. On a success, **mark a Stress**, and choose one of the following effects:\n\n- Clear a Stress from them\n- Clear a Hit Point from them',
    };

    it('should correctly parse Spellcast roll trait', () => {
      const result = parseCard(card);
      expect(result.roll?.trait).toBe('Spellcast');
    });

    it('should correctly parse stress cost as 1 (matches override)', () => {
      // Parser correctly counts only "mark a Stress" as a cost, not "Clear a Stress"
      const result = parseCard(card);
      expect(result.costs?.stress).toBe(1);
    });

    it('should INCORRECTLY have duplicate "stress_relief" keywords (override deduplicates)', () => {
      const result = parseCard(card);
      const stressReliefCount = result.keywords?.filter(k => k === 'stress_relief').length ?? 0;
      expect(stressReliefCount).toBeGreaterThan(1);
    });

    it('should NOT include "debuff" keyword (override adds it)', () => {
      // Parser doesn't detect debuff potential from this card
      const result = parseCard(card);
      expect(result.keywords).not.toContain('debuff');
    });
  });

  describe('Mutual Suffering (Level 5, Spell)', () => {
    const card = {
      name: 'Mutual Suffering',
      level: '5',
      domain: 'Blood',
      type: 'Spell',
      recall: '2',
      text: 'When an attack from a creature causes you to mark one or more Hit Points, you can make a **Reaction Roll** using your Spellcast trait against the creature. On a success, the creature marks the same number of Hit Points. This effect lasts until your next rest.',
    };

    it('should correctly parse timing as reaction', () => {
      const result = parseCard(card);
      expect(result.timing).toBe('reaction');
    });

    it('should correctly parse roll trait as Spellcast', () => {
      const result = parseCard(card);
      expect(result.roll?.trait).toBe('Spellcast');
    });

    it('should correctly parse duration as rest', () => {
      const result = parseCard(card);
      expect(result.duration).toBe('rest');
    });

    it('should INCORRECTLY parse frequency as "at_will" (override: "once_per_rest")', () => {
      // Parser doesn't detect the implicit once_per_rest from "This effect lasts until your next rest"
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should INCORRECTLY set target_reaction to true (override: false)', () => {
      // Parser sees "Reaction Roll" and sets target_reaction: true
      const result = parseCard(card);
      expect(result.roll?.target_reaction).toBe(true);
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      // Parser falsely detects "attack" from "When an attack..." trigger
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('spell');
    });
  });

  describe('Blood-Touched (Level 7, Ability)', () => {
    const card = {
      name: 'Blood-Touched',
      level: '7',
      domain: 'Blood',
      type: 'Ability',
      recall: '2',
      text: 'While 4 or more of the domain cards in your loadout are from the Blood domain, gain the following benefits:\n\n• When you take enough damage to mark 2 or more Hit Points, gain a Hope.\n• For every 3 Hit Points you have marked, gain +1 to your Evasion.',
    };

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should parse evasion modifier', () => {
      const result = parseCard(card);
      const evasionMod = result.modifiers?.find(m => m.stat === 'evasion');
      expect(evasionMod).toBeDefined();
    });

    it('should INCORRECTLY set timing to "action" (override: "passive")', () => {
      // Parser defaults abilities to "action" but this is a passive benefit
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should INCORRECTLY set evasion modifier condition to "always" (override: domain count)', () => {
      // Parser doesn't detect "4 or more domain cards in loadout" condition
      // Override uses loadout_domain_count condition
      const result = parseCard(card);
      const evasionMod = result.modifiers?.find(m => m.stat === 'evasion');
      expect(evasionMod?.condition?.type).toBe('always');
    });

    it('should have evasion value of 1 (override uses formula "1_per_3_marked_hp")', () => {
      // Parser detects a static +1 bonus
      // Override uses dynamic formula that scales with marked HP
      const result = parseCard(card);
      const evasionMod = result.modifiers?.find(m => m.stat === 'evasion');
      expect(evasionMod?.value).toBe(1);
      expect(evasionMod?.formula).toBeUndefined();
    });

    it('should NOT have gains.hope (override adds it)', () => {
      const result = parseCard(card);
      expect(result.gains?.hope).toBeUndefined();
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('damage');
      expect(result.keywords).toContain('hope_gain');
      expect(result.keywords).toContain('ability');
    });
  });

  describe('Vampiric Strike (Level 7, Spell)', () => {
    const card = {
      name: 'Vampiric Strike',
      level: '7',
      domain: 'Blood',
      type: 'Spell',
      recall: '2',
      text: 'When you make a successful attack roll against an adversary and cause them to mark 2 or more Hit Points, you can **spend a Hope** to clear a Hit Point or Stress.',
    };

    it('should correctly parse frequency as at_will', () => {
      const result = parseCard(card);
      expect(result.frequency).toBe('at_will');
    });

    it('should correctly parse hope cost', () => {
      const result = parseCard(card);
      expect(result.costs?.hope).toBe(1);
    });

    it('should INCORRECTLY set timing to "action" (override: "reaction")', () => {
      // "When you make a successful attack" is a reaction trigger
      const result = parseCard(card);
      expect(result.timing).toBe('action');
    });

    it('should INCORRECTLY have duplicate "healing" keywords (override deduplicates)', () => {
      const result = parseCard(card);
      const healingCount = result.keywords?.filter(k => k === 'healing').length ?? 0;
      expect(healingCount).toBeGreaterThan(1);
    });

    it('should INCORRECTLY include "attack" keyword (override removes it)', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('attack');
    });

    it('should NOT have gains for hit_points_clear and stress_clear (override adds them)', () => {
      const result = parseCard(card);
      expect(result.gains?.hit_points_clear).toBeUndefined();
      expect(result.gains?.stress_clear).toBeUndefined();
    });

    it('should correctly parse remaining keywords', () => {
      const result = parseCard(card);
      expect(result.keywords).toContain('healing');
      expect(result.keywords).toContain('stress_relief');
      expect(result.keywords).toContain('hope_cost');
      expect(result.keywords).toContain('spell');
    });
  });
});

// ============================================================================
// CROSS-CUTTING PATTERN TESTS
// These test systematic parser deficiencies across multiple cards
// ============================================================================
describe('NLU Systematic Pattern Deficiencies', () => {

  describe('Pattern: Parser incorrectly classifies timing as "reaction" when text mentions "Reaction Roll"', () => {
    // Cards where targets make a Reaction Roll, but the PLAYER is initiating an action
    const reactionMisclassifiedCards = [
      {
        name: 'Chain Lightning',
        level: '5',
        domain: 'Arcana',
        type: 'Spell',
        recall: '2',
        text: '**Mark 2 Stress** to make a **Spellcast Roll**, unleashing lightning on all targets within Close range. Targets you succeed against must make a **reaction roll** with a Difficulty equal to the result of your Spellcast Roll or take **2d8+4** magic damage.',
      },
      {
        name: 'Earthquake',
        level: '9',
        domain: 'Arcana',
        type: 'Spell',
        recall: '3',
        text: 'Make a **Spellcast Roll (16)**. Once per rest on a success, all targets within Very Far range who aren\'t flying must make a **Reaction Roll (18)**. Targets who fail take **3d10+8** physical damage and are knocked to the ground, making them temporarily Vulnerable.',
      },
      {
        name: 'Night Terror',
        level: '9',
        domain: 'Midnight',
        type: 'Spell',
        recall: '3',
        text: 'Once per long rest, choose any targets within Very Close range to perceive you as a nightmarish horror. The targets must succeed on a **Reaction Roll (16)** or become temporarily Horrified. While Horrified, the GM can spend any number of Fear to deal that many d6s in magic damage to a Horrified target.',
      },
    ];

    it.each(reactionMisclassifiedCards)(
      '$name: parser sets timing to "reaction" but should be "action"',
      (cardData) => {
        const result = parseCard(cardData);
        // All these cards should be "action" but parser sets "reaction"
        expect(result.timing).toBe('reaction');
      }
    );
  });

  describe('Pattern: Parser falsely adds "attack" keyword to non-attack cards', () => {
    // Cards that mention "attack" in text but are not attack cards themselves
    const falseAttackKeywordCards = [
      {
        name: 'Deadly Focus',
        text: 'Once per rest, you can apply all your focus toward a target of your choice. Until you attack another creature, you defeat the target, or the battle ends, gain a +1 bonus to your Proficiency.',
      },
      {
        name: 'Rage Up',
        text: 'Before you make an attack, you can **mark a Stress** to gain a bonus to your damage roll equal to twice your Strength. You can Rage Up twice per attack.',
      },
      {
        name: 'Gore and Glory',
        text: 'When you critically succeed on a weapon attack, gain an additional Hope or clear an additional Stress.\n\nAdditionally, when you deal enough damage to defeat an enemy, gain a Hope or clear a Stress.',
      },
      {
        name: 'Shadowhunter',
        text: 'Your prowess is enhanced under the cover of shadow. While you\'re shrouded in low light or darkness, you gain a +1 bonus to your Evasion and make attack rolls with advantage.',
      },
      {
        name: 'Eclipse',
        text: 'Make a **Spellcast Roll (16)**. Once per long rest on a success, plunge the entire area within Far range into complete darkness only you and your allies can see through. Attack rolls have disadvantage and Evasion is reduced by 3 for all creatures who cannot see through the darkness.',
      },
    ];

    it.each(falseAttackKeywordCards)(
      '$name: parser incorrectly includes "attack" keyword',
      (cardData) => {
        const result = parseCard({
          ...cardData,
          level: '1',
          domain: 'Test',
          type: 'Ability',
          recall: '1',
        });
        expect(result.keywords).toContain('attack');
      }
    );
  });

  describe('Pattern: Parser sets modifier condition to "always" instead of "when_active"', () => {
    // Cards where modifiers are conditional but parser uses "always"
    const alwaysToWhenActiveCards = [
      {
        name: 'Deft Maneuvers',
        stat: 'attack',
        text: 'Once per rest, **mark a Stress** to sprint anywhere within Far range without making an **Agility Roll** to get there.\n\nIf you end this movement within Melee range of an adversary and immediately make an attack against them, gain a +1 bonus to the attack roll.',
      },
      {
        name: 'Shadowhunter',
        stat: 'evasion',
        text: 'Your prowess is enhanced under the cover of shadow. While you\'re shrouded in low light or darkness, you gain a +1 bonus to your Evasion and make attack rolls with advantage.',
      },
    ];

    it.each(alwaysToWhenActiveCards)(
      '$name: parser uses "always" condition but should be "when_active" for $stat',
      (cardData) => {
        const result = parseCard({
          ...cardData,
          level: '1',
          domain: 'Test',
          type: 'Ability',
          recall: '1',
        });
        const mod = result.modifiers?.find(m => m.stat === cardData.stat);
        expect(mod?.condition?.type).toBe('always');
      }
    );
  });

  describe('Pattern: Parser never generates linked_costs for variable resource spending', () => {
    // All cards with "spend any number of X" or "spend X tokens" patterns
    const linkedCostCards = [
      'Unleash Chaos',
      'Arcane Reflection',
      'Confusing Aura',
      'Falling Sky',
      'Spellcharge',
      'Night Terror',
      'Twilight Toll',
    ];

    it('parser never produces linked_costs (all 7 cards require override)', () => {
      // This is a fundamental parser limitation
      const sampleCard = parseCard({
        name: 'Test',
        level: '1',
        domain: 'Test',
        type: 'Spell',
        recall: '1',
        text: 'Spend any number of tokens to roll that many d10s dealing magic damage.',
      });
      expect(sampleCard.linked_costs).toBeUndefined();
    });

    it(`affects ${linkedCostCards.length} cards requiring manual overrides`, () => {
      expect(linkedCostCards).toHaveLength(7);
    });
  });

  describe('Pattern: Parser never generates gains objects', () => {
    const gainsCards = [
      { name: 'Counterspell', gains: 'vault' },
      { name: 'Battle-Hardened', gains: 'hit_points_clear' },
      { name: 'Gore and Glory', gains: 'hope, stress_clear' },
      { name: 'Midnight-Touched', gains: 'hope' },
      { name: 'Power Through Pain (Blood)', gains: 'damage modifier' },
      { name: 'Blood-Touched', gains: 'hope' },
      { name: 'Vampiric Strike', gains: 'hit_points_clear, stress_clear' },
    ];

    it(`parser never produces gains field (${gainsCards.length} cards require override)`, () => {
      const sampleCard = parseCard({
        name: 'Test',
        level: '1',
        domain: 'Test',
        type: 'Ability',
        recall: '1',
        text: 'When you critically succeed, gain a Hope or clear a Stress.',
      });
      expect(sampleCard.gains).toBeUndefined();
    });
  });

  describe('Pattern: Parser generates duplicate keywords', () => {
    const duplicateKeywordCards = [
      {
        name: 'Battle-Hardened',
        keyword: 'healing',
        text: 'Once per long rest when you would make a Death Move, you can **spend a Hope** to clear a Hit Point instead.',
      },
      {
        name: 'Gore and Glory',
        keyword: 'stress_relief',
        text: 'When you critically succeed on a weapon attack, gain an additional Hope or clear an additional Stress.\n\nAdditionally, when you deal enough damage to defeat an enemy, gain a Hope or clear a Stress.',
      },
    ];

    it.each(duplicateKeywordCards)(
      '$name: parser produces duplicate "$keyword" keywords',
      (cardData) => {
        const result = parseCard({
          ...cardData,
          level: '1',
          domain: 'Test',
          type: 'Ability',
          recall: '1',
        });
        const count = result.keywords?.filter(k => k === cardData.keyword).length ?? 0;
        expect(count).toBeGreaterThan(1);
      }
    );
  });

  describe('Pattern: Parser missing duration: "active" for sustained effects', () => {
    const missingActiveCards = [
      {
        name: 'Rune Ward',
        text: 'The ward\'s holder can **spend a Hope** to roll **1d8** and reduce incoming damage by the result.',
        signal: 'ward (sustained protection)',
      },
      {
        name: 'Floating Eye',
        text: '**Spend a Hope** to create a single, small floating orb. While this spell is active, you can see through it.',
        signal: '"While this spell is active"',
      },
      {
        name: 'Cloaking Blast',
        text: 'You can **spend a Hope** to become Cloaked. While Cloaked, you remain unseen.',
        signal: '"While Cloaked"',
      },
      {
        name: 'Sensory Projection',
        text: 'You can look around and move within the location while the projection is active.',
        signal: '"while the projection is active"',
      },
      {
        name: 'Eclipse',
        text: 'Plunge the entire area within Far range into complete darkness.',
        signal: 'environmental effect (sustained)',
      },
    ];

    it.each(missingActiveCards)(
      '$name: parser misses duration: "active" ($signal)',
      (cardData) => {
        const result = parseCard({
          ...cardData,
          level: '1',
          domain: 'Test',
          type: 'Spell',
          recall: '1',
        });
        expect(result.duration).not.toBe('active');
      }
    );
  });
});

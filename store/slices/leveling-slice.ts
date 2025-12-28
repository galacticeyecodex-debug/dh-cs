/**
 * Leveling Slice
 * ----------------------------------------------------------------------------
 * This slice encapsulates the complex logic required for character progression and
 * leveling up. It handles the application of new levels, including stat increases,
 * trait selection, proficiency bumps, and damage threshold recalculations according
 * to the game's rules. It also manages the "de-leveling" process, ensuring that
 * all changes can be accurately rolled back if a user lowers their level.
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import { CharacterCard, LibraryItem, AdvancementRecord } from '@/types/character';
import { CharacterStore } from '@/types/store';

export interface LevelingSlice {
  levelUpCharacter: (options: {
    newLevel: number;
    selectedAdvancements: string[];
    selectedDomainCardIds: string[];
    multiclassId?: string;
    multiclassDomain?: string;
    multiclassSubclassId?: string;
    multiclassFoundationCardId?: string;
    exchangeExistingCardId?: string;
    traitIncrements?: { trait: string; amount: number }[];
    experienceIncrements?: { experienceId: string; amount: number }[];
    hpSlotsAdded?: number;
    stressSlotsAdded?: number;
    companionTraining?: string;
  }) => Promise<void>;
  updateCharacterDetails: (updates: {
    name?: string;
    level?: number;
    ancestry?: string;
    community?: string;
    transformation?: string;
    spellcast_trait?: string;
  }) => Promise<void>;
  updateMarkedTraits: (markedTraits: Record<string, boolean>) => Promise<void>;
}

export const createLevelingSlice: StateCreator<CharacterStore, [], [], LevelingSlice> = (set, get) => ({
  levelUpCharacter: async (options) => {
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    // Import helper functions for leveling
    const {
      calculateTierAchievements,
      calculateNewDamageThresholds,
      addExperienceAtLevelUp,
    } = await import('@/lib/level-up-helpers');

    // Calculate automatic tier achievements
    const tierAchievements = calculateTierAchievements(options.newLevel);

    // Build updated character data
    const updatedCharacter = { ...state.character };
    updatedCharacter.level = options.newLevel;

    // Apply tier achievements
    if (tierAchievements.newExperienceValue !== null) {
      updatedCharacter.experiences = addExperienceAtLevelUp(
        updatedCharacter.experiences,
        options.newLevel,
        tierAchievements.newExperienceValue
      );

      // Companion gains an experience when player does (Beastbound Ranger rule)
      if (updatedCharacter.ranger_companion) {
        const newPlayerExp = updatedCharacter.experiences[updatedCharacter.experiences.length - 1];
        if (newPlayerExp) {
          updatedCharacter.ranger_companion.experiences.push({
            name: newPlayerExp.name,
            value: 2, // Companions always get +2
          });
        }
      }
    }

    // Update proficiency
    updatedCharacter.proficiency += tierAchievements.proficiencyIncrease;
    if (options.selectedAdvancements.includes('increase_proficiency')) {
      updatedCharacter.proficiency += 1;
    }

    // Apply damage threshold increases
    updatedCharacter.damage_thresholds = calculateNewDamageThresholds(
      updatedCharacter.damage_thresholds
    );

    // Apply trait increments (from "Increase Traits" advancement)
    if (options.traitIncrements && options.traitIncrements.length > 0) {
      const currentModifiers = { ...(updatedCharacter.modifiers || {}) };

      for (const increment of options.traitIncrements) {
        const trait = increment.trait;
        if (!currentModifiers[trait]) currentModifiers[trait] = [];

        currentModifiers[trait].push({
          id: crypto.randomUUID(),
          name: `Level ${options.newLevel} Advancement`,
          value: increment.amount,
          source: 'system'
        });
      }
      updatedCharacter.modifiers = currentModifiers;
    }

    // Apply experience increments (from "Increase Experience" advancement)
    if (options.experienceIncrements && options.experienceIncrements.length > 0) {
      for (const increment of options.experienceIncrements) {
        const expIndex = parseInt(increment.experienceId);
        if (expIndex >= 0 && expIndex < updatedCharacter.experiences.length) {
          updatedCharacter.experiences[expIndex] = {
            ...updatedCharacter.experiences[expIndex],
            value: updatedCharacter.experiences[expIndex].value + increment.amount,
          };
        }
      }
    }

    // Apply vital slot additions
    if (options.hpSlotsAdded && options.hpSlotsAdded > 0) {
      const currentModifiers = { ...(updatedCharacter.modifiers || {}) };
      if (!currentModifiers['hit_points']) currentModifiers['hit_points'] = [];

      currentModifiers['hit_points'].push({
        id: crypto.randomUUID(),
        name: `Level ${options.newLevel} Advancement`,
        value: options.hpSlotsAdded,
        source: 'system'
      });
      updatedCharacter.modifiers = currentModifiers;
    }

    if (options.stressSlotsAdded && options.stressSlotsAdded > 0) {
      const currentModifiers = { ...(updatedCharacter.modifiers || {}) };
      if (!currentModifiers['stress']) currentModifiers['stress'] = [];

      currentModifiers['stress'].push({
        id: crypto.randomUUID(),
        name: `Level ${options.newLevel} Advancement`,
        value: options.stressSlotsAdded,
        source: 'system'
      });
      updatedCharacter.modifiers = currentModifiers;
    }

    // Apply evasion increase if advancement selected
    if (options.selectedAdvancements.includes('increase_evasion')) {
      const currentModifiers = { ...(updatedCharacter.modifiers || {}) };
      if (!currentModifiers['evasion']) currentModifiers['evasion'] = [];

      currentModifiers['evasion'].push({
        id: crypto.randomUUID(),
        name: `Level ${options.newLevel} Advancement`,
        value: 1,
        source: 'system'
      });
      updatedCharacter.modifiers = currentModifiers;
    }

    // Apply multiclass if selected
    if (options.selectedAdvancements.includes('multiclass') && options.multiclassId && options.multiclassDomain) {
      updatedCharacter.multiclass_id = options.multiclassId;
      updatedCharacter.multiclass_subclass_id = options.multiclassSubclassId;
      updatedCharacter.multiclass_progression = {
        foundation_obtained: true,
        specialization_obtained: false,
        mastery_obtained: false,
      };
      // Add the new domain to the domains array
      if (!updatedCharacter.domains) {
        updatedCharacter.domains = [];
      }
      if (!updatedCharacter.domains.includes(options.multiclassDomain)) {
        updatedCharacter.domains = [...updatedCharacter.domains, options.multiclassDomain];
      }
    }

    // Track subclass progression
    if (options.selectedAdvancements.includes('subclass_card')) {
      const progression = updatedCharacter.subclass_progression || {
        foundation_obtained: false,
        specialization_obtained: false,
        mastery_obtained: false,
      };

      // Determine which card to mark as obtained
      if (!progression.foundation_obtained) {
        progression.foundation_obtained = true;
      } else if (!progression.specialization_obtained) {
        progression.specialization_obtained = true;
      } else if (!progression.mastery_obtained) {
        progression.mastery_obtained = true;
      }

      updatedCharacter.subclass_progression = progression;
    }

    // Build database update payload with complete advancement record
    const advancementRecord: AdvancementRecord = {
      advancements: options.selectedAdvancements,
      traitIncrements: options.traitIncrements,
      experienceIncrements: options.experienceIncrements,
      hpAdded: options.hpSlotsAdded,
      stressAdded: options.stressSlotsAdded,
      domainCardsSelected: options.selectedDomainCardIds,
    };

    const updatePayload: Record<string, any> = {
      level: options.newLevel,
      stats: updatedCharacter.stats,
      vitals: updatedCharacter.vitals,
      damage_thresholds: updatedCharacter.damage_thresholds,
      proficiency: updatedCharacter.proficiency,
      evasion: updatedCharacter.evasion,
      experiences: updatedCharacter.experiences,
      subclass_progression: updatedCharacter.subclass_progression,
      modifiers: updatedCharacter.modifiers,
      advancement_history_jsonb: {
        ...updatedCharacter.advancement_history_jsonb || {},
        [options.newLevel]: advancementRecord,
      },
    };

    // Add multiclass data if selected
    if (updatedCharacter.multiclass_id) {
      updatePayload.multiclass_id = updatedCharacter.multiclass_id;
      updatePayload.multiclass_subclass_id = updatedCharacter.multiclass_subclass_id;
      updatePayload.multiclass_progression = updatedCharacter.multiclass_progression;
      updatePayload.domains = updatedCharacter.domains;
    }

    // Handle Marked Traits (Clear if new tier, then mark new ones)
    let newMarkedTraits = { ...(updatedCharacter.marked_traits_jsonb || {}) };

    if (tierAchievements.shouldClearMarkedTraits) {
      newMarkedTraits = {};
    }

    if (options.traitIncrements) {
      options.traitIncrements.forEach((inc: any) => {
        newMarkedTraits[inc.trait] = true;
      });
    }

    updatePayload.marked_traits_jsonb = newMarkedTraits;

    // CRITICAL FIX: Update the local object with the new history and marked traits 
    // so the optimistic update (set) has the complete state.
    updatedCharacter.advancement_history_jsonb = updatePayload.advancement_history_jsonb;
    updatedCharacter.marked_traits_jsonb = updatePayload.marked_traits_jsonb;

    // Optimistic update
    await withOptimisticUpdate(
      () => {
        const previousCharacter = (get() as any).character;
        set((s: any) => ({
          character: s.character ? updatedCharacter : null,
        }));
        return () => {
          set((s: any) => ({
            character: previousCharacter,
          }));
        };
      },
      async () => dataService.character.update(characterId, updatePayload),
      'Failed to apply level up'
    );

    // Handle domain card exchange if selected
    if (options.exchangeExistingCardId) {
      try {
        await dataService.card.remove(options.exchangeExistingCardId);

        // Remove from local state
        set((s: any) => ({
          character: s.character ? {
            ...s.character,
            character_cards: (s.character.character_cards || []).filter(
              (c: any) => c.id !== options.exchangeExistingCardId
            )
          } : null
        }));
      } catch (err) {
        console.error('Failed to exchange domain card:', err);
      }
    }

    // After successful level up, add the selected domain cards to vault
    if (options.selectedDomainCardIds && options.selectedDomainCardIds.length > 0) {
      try {
        for (const cardId of options.selectedDomainCardIds) {
          // First check if the card exists in the library and get its data
          const libraryCard = await dataService.library.get(cardId);

          // Only insert if card exists in library
          if (libraryCard) {
            const newCard = await dataService.card.add(characterId, cardId, 'vault');

            if (newCard) {
              // Update local state to include the new card WITH library data
              const cardWithLibrary: CharacterCard = {
                ...newCard,
                library_item: libraryCard as LibraryItem,
              };

              set((s: any) => ({
                character: s.character ? {
                  ...s.character,
                  character_cards: [...(s.character.character_cards || []), cardWithLibrary],
                } : null,
              }));
            }
          } else {
            console.warn(`Domain card '${cardId}' not found in library. Card will not be added to vault.`);
          }
        }
      } catch (err) {
        console.error('Failed to add domain cards to vault:', err);
      }
    }

    // Insert multiclass foundation card if selected
    if (options.multiclassFoundationCardId) {
      try {
        // First check if the card exists in the library and get its data
        const libraryCard = await dataService.library.get(options.multiclassFoundationCardId);

        // Only insert if card exists in library
        if (libraryCard) {
            const newCard = await dataService.card.add(characterId, options.multiclassFoundationCardId, 'feature');

          if (newCard) {
            // Update local state to include the new foundation card WITH library data
            const cardWithLibrary: CharacterCard = {
              ...newCard,
              library_item: libraryCard as LibraryItem,
            };

            set((s: any) => ({
              character: s.character ? {
                ...s.character,
                character_cards: [...(s.character.character_cards || []), cardWithLibrary],
              } : null,
            }));
          }
        } else {
          console.warn(`Multiclass foundation card '${options.multiclassFoundationCardId}' not found in library.`);
        }
      } catch (err) {
        console.error('Failed to add multiclass foundation card:', err);
      }
    }

    // Apply companion training if selected (Beastbound Ranger)
    if (options.companionTraining && state.character.ranger_companion) {
      const companion = { ...state.character.ranger_companion };
      const levelUpOptions = { ...companion.level_up_options };
      const trainingKey = options.companionTraining as keyof typeof levelUpOptions;

      // Apply the training option
      if (typeof levelUpOptions[trainingKey] === 'number') {
        (levelUpOptions[trainingKey] as number) += 1;

        // Apply stat changes based on training
        if (trainingKey === 'resilient') {
          companion.stress_max = (companion.stress_max || 3) + 1;
        }
        // Note: light_in_the_dark is now boolean, handled below
      } else if (typeof levelUpOptions[trainingKey] === 'boolean') {
        (levelUpOptions[trainingKey] as boolean) = true;

        // Apply stat changes based on training
        if (trainingKey === 'armored') {
          companion.armor_slot = true;
        } else if (trainingKey === 'aware') {
          companion.evasion = (companion.evasion || 10) + 2;
        } else if (trainingKey === 'light_in_the_dark') {
          // Light in the Dark gives the PLAYER an extra hope slot via modifier
          const currentModifiers = { ...(updatedCharacter.modifiers || {}) };
          if (!currentModifiers.hope) currentModifiers.hope = [];

          currentModifiers.hope.push({
            id: `companion-light-in-the-dark-${Date.now()}`,
            name: 'Light in the Dark',
            value: 1,
            source: 'system' as const,
          });
          updatedCharacter.modifiers = currentModifiers;
        }
      }

      companion.level_up_options = levelUpOptions;

      // Update the companion in the database and local state
      try {
        const updateData: Record<string, any> = { ranger_companion: companion };

        // If Light in the Dark was selected, also update character modifiers
        if (trainingKey === 'light_in_the_dark' && updatedCharacter.modifiers) {
          updateData.modifiers = updatedCharacter.modifiers;
        }

        await dataService.character.update(characterId, updateData);
        set((s: any) => ({
          character: s.character ? {
            ...s.character,
            ranger_companion: companion,
            ...(updateData.modifiers ? { modifiers: updateData.modifiers } : {})
          } : null,
        }));
      } catch (err) {
        console.error('Failed to update companion training:', err);
      }
    }

    // After successful level up, recalculate derived stats
    if (state.recalculateDerivedStats) {
      await state.recalculateDerivedStats();
    }
  },

  updateCharacterDetails: async (updates) => {
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    // Handle de-leveling: rollback all advancement changes
    let updatePayload: Record<string, any> = { ...updates };
    let character = { ...state.character };

    if (updates.level !== undefined && updates.level < state.character.level) {
      const advancement_history = { ...state.character.advancement_history_jsonb || {} };
      const currentLevel = state.character.level;
      const newLevel = updates.level;

      // Clone modifiers to work on
      let updatedModifiers = { ...character.modifiers || {} };

      // Reverse all advancement changes for levels being removed
      for (let level = newLevel + 1; level <= currentLevel; level++) {
        const levelRecord = advancement_history[String(level)] as AdvancementRecord | undefined;

        // Reverse Tier Achievements (Proficiency +1 at Lvl 2, 5, 8)
        if (level === 2 || level === 5 || level === 8) {
          character.proficiency -= 1;
        }

        if (levelRecord) {
          // Remove System Modifiers created for this level advancement
          Object.keys(updatedModifiers).forEach(stat => {
            updatedModifiers[stat] = updatedModifiers[stat].filter((mod: any) =>
              mod.name !== `Level ${level} Advancement`
            );
          });

          // Reverse experience increments (still stored in array)
          if (levelRecord.experienceIncrements) {
            for (const increment of levelRecord.experienceIncrements) {
              const expIndex = parseInt(increment.experienceId);
              if (expIndex >= 0 && expIndex < character.experiences.length) {
                character.experiences[expIndex] = {
                  ...character.experiences[expIndex],
                  value: character.experiences[expIndex].value - increment.amount,
                };
              }
            }
          }

          // Reverse automatic new experience from Tier Achievements (Level 2, 5, 8)
          if (level === 2 || level === 5 || level === 8) {
            // Remove the last experience
            if (character.experiences.length > 0) {
              character.experiences.pop();
            }
          }

          // Reverse Proficiency Advancement (if chosen manually)
          for (const advancement of levelRecord.advancements) {
            if (advancement === 'increase_proficiency') {
              character.proficiency -= 1;
            }
          }

          // Delete domain card if one was selected at this level
          if (levelRecord.domainCardsSelected) {
            for (const cardId of levelRecord.domainCardsSelected) {
              const cardToRemove = character.character_cards?.find(
                (card: any) => card.card_id === cardId
              );
              if (cardToRemove) {
                await dataService.card.remove(cardToRemove.id);
                character.character_cards = character.character_cards?.filter(
                  (c: any) => c.id !== cardToRemove.id
                ) || [];
              }
            }
          } else if ((levelRecord as any).domainCardSelected) {
            // Legacy support for single card
            const cardToRemove = character.character_cards?.find(
              (card: any) => card.card_id === (levelRecord as any).domainCardSelected
            );
            if (cardToRemove) {
              await dataService.card.remove(cardToRemove.id);
              character.character_cards = character.character_cards?.filter(
                (c: any) => c.id !== cardToRemove.id
              ) || [];
            }
          }
        }

        // Remove the level from history
        delete advancement_history[String(level)];
      }

      // Recalculate damage thresholds based on equipped armor
      const { calculateDamageThresholdsForLevel } = await import('@/lib/level-up-helpers');
      const equippedArmor = character.character_inventory?.find((i: any) => i.location === 'equipped_armor');
      character.damage_thresholds = calculateDamageThresholdsForLevel(newLevel, equippedArmor);

      // Clear marked traits if de-leveling past a clearing tier (5, 8)
      let marked_traits = { ...state.character.marked_traits_jsonb || {} };
      if (newLevel < 5 && currentLevel >= 5) {
        marked_traits = {};
      }

      updatePayload.modifiers = updatedModifiers;
      updatePayload.advancement_history_jsonb = advancement_history;
      updatePayload.marked_traits_jsonb = marked_traits;
      updatePayload.stats = character.stats;
      updatePayload.vitals = character.vitals;
      updatePayload.evasion = character.evasion;
      updatePayload.proficiency = character.proficiency;
      updatePayload.experiences = character.experiences;
      updatePayload.damage_thresholds = character.damage_thresholds;
    }

    await withOptimisticUpdate(
      () => {
        const previousCharacter = { ...(get() as any).character! };
        set((s: any) => ({
          character: s.character ? { ...s.character, ...updatePayload } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? previousCharacter : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, updatePayload),
      'Failed to update character details'
    );

    // Recalculate if level changed
    if (updates.level !== undefined && state.recalculateDerivedStats) {
      await state.recalculateDerivedStats();
    }
  },

  updateMarkedTraits: async (markedTraits) => {
    const state = get() as any;
    if (!state.character) return;

    const characterId = state.character.id;

    await withOptimisticUpdate(
      () => {
        const previousMarkedTraits = { ...(get() as any).character!.marked_traits_jsonb };
        set((s: any) => ({
          character: s.character ? { ...s.character, marked_traits_jsonb: markedTraits } : null,
        }));
        return () => {
          set((s: any) => ({
            character: s.character ? { ...s.character, marked_traits_jsonb: previousMarkedTraits } : null,
          }));
        };
      },
      async () => dataService.character.update(characterId, { marked_traits_jsonb: markedTraits }),
      'Failed to update marked traits'
    );
  },
});

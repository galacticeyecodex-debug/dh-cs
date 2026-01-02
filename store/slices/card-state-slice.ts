/**
 * Card State Slice
 * ----------------------------------------------------------------------------
 * This slice manages the runtime state of domain cards, including:
 * - Token tracking for cards like Flight, Unleash Chaos
 * - Frequency usage (once per rest/session/long rest)
 * - Active state for persistent effects
 *
 * Card states are stored per card name and persist in the character's data.
 */

import { StateCreator } from 'zustand';
import { dataService } from '@/lib/data-service';
import { withOptimisticUpdate } from '@/lib/state-helpers';
import type { CharacterStore } from '@/types/store';
import type { Frequency } from '@/types/cards';

export interface CardState {
  current_tokens: number;
  used_this_rest: boolean;
  used_this_long_rest: boolean;
  used_this_session: boolean;
  is_active: boolean;
}

export interface CardStateSlice {
  cardStates: Record<string, CardState>;

  // Token management
  setCardTokens: (cardName: string, tokens: number) => Promise<void>;
  spendCardToken: (cardName: string, amount?: number) => void;
  gainCardToken: (cardName: string, amount?: number) => void;

  // Frequency tracking
  markCardUsed: (cardName: string, frequency: Frequency) => Promise<void>;
  resetCardUsed: (cardName: string, frequency: Frequency) => Promise<void>;
  resetAllCardsByFrequency: (frequency: Frequency) => Promise<void>;

  // Active state management
  toggleCardActive: (cardName: string) => Promise<void>;

  // State helpers
  initializeCardState: (cardName: string) => void;
}

const defaultCardState: CardState = {
  current_tokens: 0,
  used_this_rest: false,
  used_this_long_rest: false,
  used_this_session: false,
  is_active: false,
};

export const createCardStateSlice: StateCreator<CharacterStore, [], [], CardStateSlice> = (set, get) => ({
  cardStates: {},

  setCardTokens: async (cardName: string, tokens: number) => {
    const state = get() as CharacterStore;
    if (!state.character) return;

    const characterId = state.character.id;
    const currentCardStates = state.cardStates || {};
    const cardState = currentCardStates[cardName] || { ...defaultCardState };
    const newCardState = { ...cardState, current_tokens: Math.max(0, tokens) };
    const newCardStates = { ...currentCardStates, [cardName]: newCardState };

    await withOptimisticUpdate(
      () => {
        const previousStates = { ...((get() as CharacterStore).cardStates || {}) };
        set({ cardStates: newCardStates });
        return () => {
          set({ cardStates: previousStates });
        };
      },
      async () => dataService.character.update(characterId, { card_states: newCardStates }),
      'Failed to update card tokens'
    );
  },

  spendCardToken: (cardName: string, amount: number = 1) => {
    const state = get() as CharacterStore;
    const currentCardStates = state.cardStates || {};
    const cardState = currentCardStates[cardName] || { ...defaultCardState };
    const newTokens = Math.max(0, cardState.current_tokens - amount);
    const newCardState = { ...cardState, current_tokens: newTokens };
    const newCardStates = { ...currentCardStates, [cardName]: newCardState };
    set({ cardStates: newCardStates });
  },

  gainCardToken: (cardName: string, amount: number = 1) => {
    const state = get() as CharacterStore;
    const currentCardStates = state.cardStates || {};
    const cardState = currentCardStates[cardName] || { ...defaultCardState };
    const newTokens = cardState.current_tokens + amount;
    const newCardState = { ...cardState, current_tokens: newTokens };
    const newCardStates = { ...currentCardStates, [cardName]: newCardState };
    set({ cardStates: newCardStates });
  },

  markCardUsed: async (cardName: string, frequency: Frequency) => {
    const state = get() as CharacterStore;
    if (!state.character) return;

    const characterId = state.character.id;
    const currentCardStates = state.cardStates || {};
    const cardState = currentCardStates[cardName] || { ...defaultCardState };

    const updates: Partial<CardState> = {};
    switch (frequency) {
      case 'once_per_rest':
        updates.used_this_rest = true;
        break;
      case 'once_per_long_rest':
        updates.used_this_long_rest = true;
        break;
      case 'once_per_session':
        updates.used_this_session = true;
        break;
    }

    const newCardState = { ...cardState, ...updates };
    const newCardStates = { ...currentCardStates, [cardName]: newCardState };

    await withOptimisticUpdate(
      () => {
        const previousStates = { ...((get() as CharacterStore).cardStates || {}) };
        set({ cardStates: newCardStates });
        return () => {
          set({ cardStates: previousStates });
        };
      },
      async () => dataService.character.update(characterId, { card_states: newCardStates }),
      'Failed to mark card as used'
    );
  },

  resetCardUsed: async (cardName: string, frequency: Frequency) => {
    const state = get() as CharacterStore;
    if (!state.character) return;

    const characterId = state.character.id;
    const currentCardStates = state.cardStates || {};
    const cardState = currentCardStates[cardName] || { ...defaultCardState };

    const updates: Partial<CardState> = {};
    switch (frequency) {
      case 'once_per_rest':
        updates.used_this_rest = false;
        break;
      case 'once_per_long_rest':
        updates.used_this_long_rest = false;
        break;
      case 'once_per_session':
        updates.used_this_session = false;
        break;
    }

    const newCardState = { ...cardState, ...updates };
    const newCardStates = { ...currentCardStates, [cardName]: newCardState };

    await withOptimisticUpdate(
      () => {
        const previousStates = { ...((get() as CharacterStore).cardStates || {}) };
        set({ cardStates: newCardStates });
        return () => {
          set({ cardStates: previousStates });
        };
      },
      async () => dataService.character.update(characterId, { card_states: newCardStates }),
      'Failed to reset card usage'
    );
  },

  resetAllCardsByFrequency: async (frequency: Frequency) => {
    const state = get() as CharacterStore;
    if (!state.character) return;

    const characterId = state.character.id;
    const currentCardStates = state.cardStates || {};
    const newCardStates = { ...currentCardStates };

    for (const cardName of Object.keys(newCardStates)) {
      const cardState = newCardStates[cardName];
      switch (frequency) {
        case 'once_per_rest':
          newCardStates[cardName] = { ...cardState, used_this_rest: false };
          break;
        case 'once_per_long_rest':
          newCardStates[cardName] = { ...cardState, used_this_long_rest: false };
          break;
        case 'once_per_session':
          newCardStates[cardName] = { ...cardState, used_this_session: false };
          break;
      }
    }

    await withOptimisticUpdate(
      () => {
        const previousStates = { ...((get() as CharacterStore).cardStates || {}) };
        set({ cardStates: newCardStates });
        return () => {
          set({ cardStates: previousStates });
        };
      },
      async () => dataService.character.update(characterId, { card_states: newCardStates }),
      'Failed to reset card usage'
    );
  },

  initializeCardState: (cardName: string) => {
    const state = get() as CharacterStore;
    const currentCardStates = state.cardStates || {};
    if (!currentCardStates[cardName]) {
      const newCardStates = { ...currentCardStates, [cardName]: { ...defaultCardState } };
      set({ cardStates: newCardStates });
    }
  },

  toggleCardActive: async (cardName: string) => {
    const state = get() as CharacterStore;
    if (!state.character) return;

    const characterId = state.character.id;
    const currentCardStates = state.cardStates || {};
    const cardState = currentCardStates[cardName] || { ...defaultCardState };
    const newCardState = { ...cardState, is_active: !cardState.is_active };
    const newCardStates = { ...currentCardStates, [cardName]: newCardState };

    await withOptimisticUpdate(
      () => {
        const previousStates = { ...((get() as CharacterStore).cardStates || {}) };
        set({ cardStates: newCardStates });
        return () => {
          set({ cardStates: previousStates });
        };
      },
      async () => dataService.character.update(characterId, { card_states: newCardStates }),
      'Failed to toggle card active state'
    );
  },
});

/**
 * DICE OVERLAY COMPONENT TESTS
 * ----------------------------------------------------------------------------
 * Tests for the DiceOverlay component which provides 3D dice rolling via DiceBox.
 *
 * Testing Strategy:
 * - Unit tests mock DiceBox entirely to test component logic (state, UI, events)
 * - E2E tests (separate file) test actual dice rolling in a real browser
 *
 * Key Challenges:
 * - DiceBox uses Web Workers and OffscreenCanvas (can't be fully mocked in jsdom)
 * - Async initialization requires careful state management
 * - Uses data-testid attributes for reliable element selection
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import DiceOverlay from '@/components/dice/dice-overlay';
import { useCharacterStore } from '@/store/character-store';

// --- Types for cleaner typing ---
type MockedUseCharacterStore = Mock<() => ReturnType<typeof useCharacterStore>>;

// --- Mock Data ---
const mockSetLastRollResult = vi.fn();
const mockUpdateHope = vi.fn();
const mockCloseDiceOverlay = vi.fn();

const defaultMockCharacter = {
  experiences: [],
  hope: 10,
};

const defaultStoreState = {
  isDiceOverlayOpen: true,
  closeDiceOverlay: mockCloseDiceOverlay,
  setLastRollResult: mockSetLastRollResult,
  lastRollResult: null,
  activeRoll: null,
  character: defaultMockCharacter,
  updateHope: mockUpdateHope,
};

// --- Mocks ---

// Mock the character store
vi.mock('@/store/character-store', () => ({
  useCharacterStore: vi.fn(() => defaultStoreState),
}));

// Mock DiceBox with controllable initialization
// Use a proper class to avoid constructor issues
vi.mock('@3d-dice/dice-box', () => {
  class MockDiceBox {
    init() {
      // Return a promise that resolves after a microtask
      return Promise.resolve(true);
    }
    clear() {}
    roll(config: Array<{ sides: number; themeColor?: string }>) {
      // Return predictable mock results based on config
      return config.map((die, index) => {
        let value: number;

        // Use predictable values for testing
        if (die.sides === 12) {
          // D12 values based on themeColor
          if (die.themeColor === '#f6c928') value = 10; // Hope (gold)
          else if (die.themeColor === '#4a148c') value = 5; // Fear (purple)
          else if (die.themeColor === '#ffffff') value = 8; // Plus (white)
          else if (die.themeColor === '#000000') value = 3; // Minus (black)
          else value = 7; // Default/Extra (green)
        } else if (die.sides === 8) {
          value = index === 0 ? 6 : 7; // 2d8 returns [6, 7]
        } else if (die.sides === 20) {
          value = 15;
        } else if (die.sides === 6) {
          value = 4;
        } else if (die.sides === 4) {
          value = 3;
        } else if (die.sides === 10) {
          value = 8;
        } else {
          value = Math.ceil(die.sides / 2); // Predictable middle value
        }

        return { value, sides: die.sides };
      });
    }
    resize() {}
  }

  return { default: MockDiceBox };
});

// --- Test Setup ---

describe('DiceOverlay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store mock to default state
    (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => defaultStoreState);
  });

  describe('Rendering', () => {
    it('should render when overlay is open', async () => {
      render(<DiceOverlay />);

      // Wait for the component to initialize
      await waitFor(() => {
        expect(screen.getByTestId('modifier-control')).toBeInTheDocument();
      });

      expect(screen.getByTestId('roll-button')).toBeInTheDocument();
      expect(screen.getByTestId('dice-pool')).toBeInTheDocument();
      expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
    });

    it('should not render when overlay is closed', () => {
      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        isDiceOverlayOpen: false,
      }));

      render(<DiceOverlay />);

      // The component should not render any interactive elements when closed
      expect(screen.queryByTestId('roll-button')).not.toBeInTheDocument();
    });

    it('should render default hope and fear dice in the pool', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-pool')).toBeInTheDocument();
      });

      const dicePool = screen.getByTestId('dice-pool');

      // Check for hope and fear dice using data attributes
      const hopeDie = within(dicePool).queryByTestId(/die-button-hope/);
      const fearDie = within(dicePool).queryByTestId(/die-button-fear/);

      expect(hopeDie).toBeInTheDocument();
      expect(fearDie).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call closeDiceOverlay when close button is clicked', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockCloseDiceOverlay).toHaveBeenCalled();
    });
  });

  describe('Dice Picker', () => {
    it('should add dice to the pool when picker buttons are clicked', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });

      const dicePool = screen.getByTestId('dice-pool');
      const initialDiceCount = within(dicePool).queryAllByTestId(/^die-chip-/).length;

      // Click d8 picker
      const d8Picker = screen.getByTestId('add-d8');
      fireEvent.click(d8Picker);

      await waitFor(() => {
        const newDiceCount = within(dicePool).queryAllByTestId(/^die-chip-/).length;
        expect(newDiceCount).toBe(initialDiceCount + 1);
      });

      // Verify a d8 was added (defaults to 'plus' role)
      expect(within(dicePool).queryByTestId(/die-button-plus-d8/)).toBeInTheDocument();
    });

    it('should render all standard dice picker options', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });

      const diceSides = [4, 6, 8, 10, 12, 20];
      for (const sides of diceSides) {
        expect(screen.getByTestId(`add-d${sides}`)).toBeInTheDocument();
      }
    });
  });

  describe('Dice Role Cycling', () => {
    it('should cycle die role when clicked: plus -> minus -> hope -> fear -> plus', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });

      // Add a d6 die (defaults to 'plus')
      const d6Picker = screen.getByTestId('add-d6');
      fireEvent.click(d6Picker);

      const dicePool = screen.getByTestId('dice-pool');

      // Verify it starts as 'plus'
      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-plus-d6/)).toBeInTheDocument();
      });

      // Click to cycle to 'minus'
      let dieButton = within(dicePool).getByTestId(/die-button-plus-d6/);
      fireEvent.click(dieButton);

      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-minus-d6/)).toBeInTheDocument();
      });

      // Click to cycle to 'hope'
      dieButton = within(dicePool).getByTestId(/die-button-minus-d6/);
      fireEvent.click(dieButton);

      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-hope-d6/)).toBeInTheDocument();
      });

      // Click to cycle to 'fear'
      dieButton = within(dicePool).getByTestId(/die-button-hope-d6/);
      fireEvent.click(dieButton);

      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-fear-d6/)).toBeInTheDocument();
      });

      // Click to cycle back to 'plus'
      dieButton = within(dicePool).getByTestId(/die-button-fear-d6/);
      fireEvent.click(dieButton);

      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-plus-d6/)).toBeInTheDocument();
      });
    });
  });

  describe('Dice Removal', () => {
    it('should remove a die from the pool when remove button is clicked', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });

      // Add a d8 die
      const d8Picker = screen.getByTestId('add-d8');
      fireEvent.click(d8Picker);

      const dicePool = screen.getByTestId('dice-pool');

      // Wait for the die to appear
      await waitFor(() => {
        expect(within(dicePool).queryByTestId(/die-button-plus-d8/)).toBeInTheDocument();
      });

      // Get the die chip container and find its remove button
      const dieChips = within(dicePool).queryAllByTestId(/^die-chip-/);
      const d8Chip = dieChips.find(chip =>
        within(chip).queryByTestId(/die-button-plus-d8/) !== null
      );

      expect(d8Chip).toBeTruthy();

      // Find and click the remove button within this chip
      const removeButton = within(d8Chip!).getByLabelText(/Remove plus d8/);
      fireEvent.click(removeButton);

      // Verify the d8 was removed
      await waitFor(() => {
        expect(within(dicePool).queryByTestId(/die-button-plus-d8/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Modifier Controls', () => {
    it('should increase modifier when + button is clicked', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('modifier-control')).toBeInTheDocument();
      });

      const increaseButton = screen.getByTestId('modifier-increase');
      const modifierValue = screen.getByTestId('modifier-value');

      // Initial value should be +0
      expect(modifierValue).toHaveTextContent('+0');

      fireEvent.click(increaseButton);

      await waitFor(() => {
        expect(modifierValue).toHaveTextContent('+1');
      });
    });

    it('should decrease modifier when - button is clicked', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('modifier-control')).toBeInTheDocument();
      });

      const decreaseButton = screen.getByTestId('modifier-decrease');
      const modifierValue = screen.getByTestId('modifier-value');

      fireEvent.click(decreaseButton);

      await waitFor(() => {
        expect(modifierValue).toHaveTextContent('-1');
      });
    });
  });

  describe('Experiences Section', () => {
    it('should render experiences when character has them', async () => {
      const characterWithExperiences = {
        experiences: [
          { name: 'Nimble', value: 2 },
          { name: 'Strong', value: 3 },
        ],
        hope: 10,
      };

      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        character: characterWithExperiences,
      }));

      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('experiences-section')).toBeInTheDocument();
      });

      const experiencesList = screen.getByTestId('experiences-list');
      expect(within(experiencesList).getByTestId('experience-0')).toBeInTheDocument();
      expect(within(experiencesList).getByTestId('experience-1')).toBeInTheDocument();
    });

    it('should toggle experience selection and update hope cost', async () => {
      const characterWithExperiences = {
        experiences: [{ name: 'Nimble', value: 2 }],
        hope: 10,
      };

      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        character: characterWithExperiences,
      }));

      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('experiences-section')).toBeInTheDocument();
      });

      const experienceButton = screen.getByTestId('experience-0');

      // Initially not selected
      expect(experienceButton).toHaveAttribute('data-selected', 'false');

      // Click to select
      fireEvent.click(experienceButton);

      await waitFor(() => {
        expect(experienceButton).toHaveAttribute('data-selected', 'true');
      });

      // Click again to deselect
      fireEvent.click(experienceButton);

      await waitFor(() => {
        expect(experienceButton).toHaveAttribute('data-selected', 'false');
      });
    });
  });

  describe('Roll Button', () => {
    it('should be present and clickable', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('roll-button')).toBeInTheDocument();
      });

      const rollButton = screen.getByTestId('roll-button');
      expect(rollButton).toHaveTextContent('ROLL');

      // Should not throw when clicked
      expect(() => fireEvent.click(rollButton)).not.toThrow();
    });
  });

  describe('Damage Mode', () => {
    it('should initialize pool from dice notation for damage rolls', async () => {
      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        activeRoll: { label: 'Longsword', dice: '2d8+3', modifier: 0 },
      }));

      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-pool')).toBeInTheDocument();
      });

      const dicePool = screen.getByTestId('dice-pool');
      // 2d8 should produce 2 damage dice
      const damageChips = within(dicePool).getAllByTestId(/die-button-damage-d8/);
      expect(damageChips).toHaveLength(2);
    });

    it('should show dice builder (pool + picker) for damage rolls', async () => {
      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        activeRoll: { label: 'Fireball', dice: '3d6', modifier: 0 },
      }));

      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-pool')).toBeInTheDocument();
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });
    });

    it('should add dice with damage role in damage mode', async () => {
      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        activeRoll: { label: 'Attack', dice: '1d8', modifier: 0 },
      }));

      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-d6'));

      const dicePool = screen.getByTestId('dice-pool');
      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-damage-d6/)).toBeInTheDocument();
      });
    });

    it('should cycle damage -> plus -> minus in damage mode', async () => {
      (useCharacterStore as MockedUseCharacterStore).mockImplementation(() => ({
        ...defaultStoreState,
        activeRoll: { label: 'Attack', dice: '1d8', modifier: 0 },
      }));

      render(<DiceOverlay />);

      const dicePool = await waitFor(() => screen.getByTestId('dice-pool'));

      // Start as damage
      let dieButton = await waitFor(() => within(dicePool).getByTestId(/die-button-damage-d8/));
      fireEvent.click(dieButton);

      // Should cycle to plus
      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-plus-d8/)).toBeInTheDocument();
      });

      // Cycle to minus
      dieButton = within(dicePool).getByTestId(/die-button-plus-d8/);
      fireEvent.click(dieButton);

      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-minus-d8/)).toBeInTheDocument();
      });

      // Cycle back to damage
      dieButton = within(dicePool).getByTestId(/die-button-minus-d8/);
      fireEvent.click(dieButton);

      await waitFor(() => {
        expect(within(dicePool).getByTestId(/die-button-damage-d8/)).toBeInTheDocument();
      });
    });
  });

  // NOTE: Full roll integration tests are skipped in unit tests because DiceBox
  // requires real Web Workers and OffscreenCanvas. These are covered by E2E tests.
  // The tests below verify that the component correctly prepares roll configurations.

  describe('Roll Configuration (Unit)', () => {
    it('should have correct initial dice pool structure', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-pool')).toBeInTheDocument();
      });

      const dicePool = screen.getByTestId('dice-pool');

      // Default pool has hope and fear d12s
      expect(within(dicePool).getByTestId(/die-button-hope-d12/)).toBeInTheDocument();
      expect(within(dicePool).getByTestId(/die-button-fear-d12/)).toBeInTheDocument();
    });

    it('should build correct dice pool with added dice', async () => {
      render(<DiceOverlay />);

      await waitFor(() => {
        expect(screen.getByTestId('dice-picker')).toBeInTheDocument();
      });

      // Add a d8 and a d6
      fireEvent.click(screen.getByTestId('add-d8'));
      fireEvent.click(screen.getByTestId('add-d6'));

      const dicePool = screen.getByTestId('dice-pool');

      await waitFor(() => {
        // Should have: hope d12, fear d12, plus d8, plus d6
        expect(within(dicePool).getByTestId(/die-button-hope-d12/)).toBeInTheDocument();
        expect(within(dicePool).getByTestId(/die-button-fear-d12/)).toBeInTheDocument();
        expect(within(dicePool).getByTestId(/die-button-plus-d8/)).toBeInTheDocument();
        expect(within(dicePool).getByTestId(/die-button-plus-d6/)).toBeInTheDocument();
      });
    });
  });
});

/**
 * INTEGRATION TESTS FOR ROLL RESULTS
 * These tests are skipped in unit test environment because DiceBox requires:
 * - Web Workers (worker-src CSP)
 * - OffscreenCanvas
 * - Real async initialization
 *
 * See e2e/dice-overlay.spec.ts for full integration tests using Playwright.
 */
describe.skip('DiceOverlay Roll Integration (Requires Browser)', () => {
  it('should calculate duality roll correctly', async () => {
    // This test would verify:
    // - Correct total calculation: hope + fear + modifier + plusTotal - minusTotal
    // - Correct type determination (Hope/Fear/Critical)
    // - Proper call to setLastRollResult
  });

  it('should handle damage rolls correctly', async () => {
    // This test would verify:
    // - Parsing dice notation (e.g., "2d8+3")
    // - Correct damage total calculation
    // - Type set to 'Damage'
  });

  it('should update hope when experiences are used', async () => {
    // This test would verify:
    // - Hope decreases by number of selected experiences
    // - Experience modifiers are added to roll
  });
});

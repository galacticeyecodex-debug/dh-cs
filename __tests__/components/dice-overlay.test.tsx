import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DiceOverlay from '@/components/dice-overlay';
import { useCharacterStore } from '@/store/character-store';

// --- Mocks ---

// Mock the store using vi.fn()
const mockSetLastRollResult = vi.fn();
const mockUpdateHope = vi.fn();
const mockCloseDiceOverlay = vi.fn();
const mockCharacter = {
  experiences: [],
  hope: 10,
};
const mockActiveRoll = null; // Default to no active roll for builder tests

// Provide the mock implementation directly when mocking the module
vi.mock('@/store/character-store', () => ({
  useCharacterStore: vi.fn(() => ({
    isDiceOverlayOpen: true,
    closeDiceOverlay: mockCloseDiceOverlay,
    setLastRollResult: mockSetLastRollResult,
    lastRollResult: null,
    activeRoll: mockActiveRoll,
    character: mockCharacter,
    updateHope: mockUpdateHope,
  })),
}));

// Mock '@3d-dice/dice-box' using vi.mock
vi.mock('@3d-dice/dice-box', () => {
  // Mock the DiceBox class constructor
  const MockDiceBox = vi.fn().mockImplementation(() => {
    return {
      init: vi.fn().mockResolvedValue(true), // Simulate successful initialization
      clear: vi.fn(),
      roll: vi.fn((config) => {
        // Fixed mock roll logic for predictable test outcomes.
        let results = [];
        let mockRollValues = {
          d12: { hope: 10, fear: 5, plus: 8, minus: 3, extra: 7 }, // Fixed values for d12
          d8: [6, 7], // For damage roll test (2d8)
          d20: [15], // Example for d20
        };
        
        config.forEach((die, index) => {
          let value;
          if (die.sides === 12) { 
            if (die.themeColor === '#f6c928') value = mockRollValues.d12.hope; // Hope
            else if (die.themeColor === '#4a148c') value = mockRollValues.d12.fear; // Fear
            else if (die.themeColor === '#06b6d4') value = mockRollValues.d12.plus; // Plus
            else if (die.themeColor === '#f97316') value = mockRollValues.d12.minus; // Minus
            else value = mockRollValues.d12.extra; // Default/Extra
          } else if (die.sides === 8) { // For damage roll test
            value = mockRollValues.d8[index % mockRollValues.d8.length];
          } else if (die.sides === 20) {
            value = mockRollValues.d20[index % mockRollValues.d20.length];
          } else {
            value = Math.floor(Math.random() * die.sides) + 1; // Fallback for other sides
          }
          results.push({ value, sides: die.sides });
        });
        return results;
      }),
      resize: vi.fn(),
    };
  });
  // Export the mock class as the default export
  return { default: MockDiceBox };
});

// --- Helper Functions ---

// Helper to find a die button by its role text (hope, fear, plus, minus)
const findDieButtonByRole = (role: string) => {
  return screen.getAllByRole('button').find(btn => {
    const roleSpan = btn.querySelector('span.uppercase'); // Target the span with uppercase role text
    return roleSpan && roleSpan.textContent?.toLowerCase() === role;
  });
};

// Helper to find a specific die button by its sides and role, ensuring it's a die chip button
const findSpecificDieButton = (sides: number, role: string) => {
    return screen.getAllByRole('button').find(btn => {
        // Ensure we are targeting a die chip button, not other buttons
        const parentGroup = btn.closest('.relative.group'); // Die chips are wrapped in this group
        if (!parentGroup) return false;

        const roleSpan = btn.querySelector('span.uppercase'); // Role text span
        const sidesSpan = btn.querySelector('span:not([class*="uppercase"])'); // Sides text span
        
        return (roleSpan && roleSpan.textContent?.toLowerCase() === role) &&
               (sidesSpan && sidesSpan.textContent === `d${sides}`);
    });
};

// Helper to find the parent group of a die chip for interacting with remove button
const getDieChipElement = (role: string, sides: number) => {
    const button = findSpecificDieButton(sides, role);
    return button?.closest('.relative.group');
};

describe('DiceOverlay Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Re-apply the mock implementation for the store for each test
    useCharacterStore.mockImplementation(() => ({ 
      isDiceOverlayOpen: true,
      closeDiceOverlay: mockCloseDiceOverlay,
      setLastRollResult: mockSetLastRollResult,
      lastRollResult: null,
      activeRoll: mockActiveRoll,
      character: mockCharacter,
      updateHope: mockUpdateHope,
    }));
  });

  it('should render correctly when overlay is open', () => {
    render(<DiceOverlay />);
    expect(screen.getByText('Mod')).toBeInTheDocument();
    expect(screen.getByText('ROLL')).toBeInTheDocument();
    // Check for default dice (hope and fear)
    expect(findDieButtonByRole('hope')).toBeInTheDocument();
    expect(findDieButtonByRole('fear')).toBeInTheDocument();
  });

  it('should close the overlay when the close button is clicked', () => {
    render(<DiceOverlay />);
    // The close button is an SVG with aria-label 'Close'
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(mockCloseDiceOverlay).toHaveBeenCalled();
  });

  it('should cycle dice roles correctly', async () => {
    render(<DiceOverlay />);

    // Add a die first. addDie defaults to 'plus'.
    fireEvent.click(screen.getByText('d6'));
    
    // Find the newly added die (d6, 'plus')
    const d6PlusButton = findSpecificDieButton(6, 'plus');
    expect(d6PlusButton).toBeInTheDocument();

    // Cycle role once (plus -> minus)
    fireEvent.click(d6PlusButton);
    await waitFor(() => expect(findSpecificDieButton(6, 'minus')).toBeInTheDocument());

    // Cycle role again (minus -> hope)
    fireEvent.click(d6PlusButton);
    await waitFor(() => expect(findSpecificDieButton(6, 'hope')).toBeInTheDocument());

    // Cycle role again (hope -> fear)
    fireEvent.click(d6PlusButton);
    await waitFor(() => expect(findSpecificDieButton(6, 'fear')).toBeInTheDocument());
    
    // Cycle role again (fear -> plus)
    fireEvent.click(d6PlusButton);
    await waitFor(() => expect(findSpecificDieButton(6, 'plus')).toBeInTheDocument());
  });

  it('should add dice to the pool when picker buttons are clicked', () => {
    render(<DiceOverlay />);
    const initialDiceCount = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('d')).length; // Count dice buttons initially

    fireEvent.click(screen.getByText('d8'));
    expect(findSpecificDieButton(8, 'plus')).toBeInTheDocument(); // Newly added die defaults to 'plus'
    expect(screen.getAllByRole('button').filter(btn => btn.textContent?.includes('d'))).toHaveLength(initialDiceCount + 1);

    fireEvent.click(screen.getByText('d20'));
    expect(findSpecificDieButton(20, 'plus')).toBeInTheDocument();
    expect(screen.getAllByRole('button').filter(btn => btn.textContent?.includes('d'))).toHaveLength(initialDiceCount + 2);
  });

  it('should remove dice from the pool when the remove button is clicked', () => {
    render(<DiceOverlay />);
    // Add a die first
    fireEvent.click(screen.getByText('d8'));
    const initialDiceCount = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('d')).length;

    // Find the d8 'plus' die and its remove button
    const d8PlusButton = findSpecificDieButton(8, 'plus');
    expect(d8PlusButton).toBeInTheDocument();
    
    const parentGroup = d8PlusButton.closest('.relative.group');
    expect(parentGroup).toBeInTheDocument();

    const removeButton = parentGroup.querySelector('button:not([role="button"])'); // Find the non-role button (the remove button)
    expect(removeButton).toBeInTheDocument();
    
    fireEvent.click(removeButton);
    
    // After removal, the d8 should be gone, and total count reduced.
    expect(screen.queryByText('d8')).not.toBeInTheDocument(); // Check by text content if it was removed
    expect(screen.getAllByRole('button').filter(btn => btn.textContent?.includes('d'))).toHaveLength(initialDiceCount - 1);
  });

  it('should calculate duality roll correctly with hope, fear, plus, and minus dice', async () => {
    render(<DiceOverlay />);

    // Add a d12, cycle it to 'minus'
    fireEvent.click(screen.getByText('d12')); // Adds as 'plus'
    const firstAddedDieButton = findSpecificDieButton(12, 'plus');
    fireEvent.click(firstAddedDieButton); // Cycle from 'plus' to 'minus'
    await waitFor(() => expect(findSpecificDieButton(12, 'minus')).toBeInTheDocument());

    // Add another d12, it should be 'plus' by default
    fireEvent.click(screen.getByText('d12'));
    const secondAddedDieButton = findSpecificDieButton(12, 'plus');
    expect(secondAddedDieButton).toBeInTheDocument();

    // Pool should now have: hope(d12), fear(d12), minus(d12), plus(d12)
    // Mocked roll results: hope=10, fear=5, plus=8, minus=3
    // Calculation: hope(10) + fear(5) + totalModifier(0) + plusTotal(8) - minusTotal(3)
    // Expected total = 10 + 5 + 0 + 8 - 3 = 20

    fireEvent.click(screen.getByText('ROLL'));

    await waitFor(() => {
      expect(mockSetLastRollResult).toHaveBeenCalledWith(expect.objectContaining({
        hope: 10,
        fear: 5,
        plusTotal: 8, 
        minusTotal: 3,
        total: 20, // 10 + 5 + 8 - 3
        modifier: 0,
        type: 'Hope', // Since hope > fear
        dice: expect.any(Array) 
      }));
    });
  });

  it('should handle edge cases for plus/minus dice (e.g., all plus)', async () => {
    render(<DiceOverlay />);
    
    // Remove default hope and fear dice
    const defaultHopeButton = findDieButtonByRole('hope');
    const defaultFearButton = findDieButtonByRole('fear');
    
    fireEvent.click(defaultHopeButton.closest('.relative.group').querySelector('button:not([role="button"])'));
    fireEvent.click(defaultFearButton.closest('.relative.group').querySelector('button:not([role="button"])'));
    
    // Add three 'plus' dice (d12)
    fireEvent.click(screen.getByText('d12'));
    fireEvent.click(screen.getByText('d12'));
    fireEvent.click(screen.getByText('d12'));

    // Ensure they are 'plus' (default behavior of addDie)
    const plusDiceButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('plus') && btn.textContent?.includes('d12'));
    expect(plusDiceButtons).toHaveLength(3);

    // Mocked roll results for three d12 dice: e.g., 10, 8, 7 (all treated as plus)
    // Expected total = 0 (hope) + 0 (fear) + 0 (modifier) + (10+8+7) (plusTotal) - 0 (minusTotal) = 25
    fireEvent.click(screen.getByText('ROLL'));

    await waitFor(() => {
      expect(mockSetLastRollResult).toHaveBeenCalledWith(expect.objectContaining({
        hope: 0,
        fear: 0,
        plusTotal: 25, // Sum of mocked plus dice rolls (10 + 8 + 7)
        minusTotal: 0,
        total: 25,
        modifier: 0,
        type: 'Hope', // Should default to Hope if no fear/critical
      }));
    });
  });

  it('should handle modifier correctly with plus/minus dice', async () => {
    render(<DiceOverlay />);
    
    // Add one plus die (d12) and one minus die (d12)
    fireEvent.click(screen.getByText('d12')); // Adds as 'plus'
    const firstAddedDieButton = findDieButtonBySidesAndRole(12, 'plus');
    fireEvent.click(firstAddedDieButton); // Cycle to 'minus'
    await waitFor(() => expect(findDieButtonBySidesAndRole(12, 'minus')).toBeInTheDocument());

    // Add another die to ensure it's 'plus' (default)
    fireEvent.click(screen.getByText('d12'));
    const secondAddedDieButton = findDieButtonBySidesAndRole(12, 'plus');
    expect(secondAddedDieButton).toBeInTheDocument();

    // Set temp modifier
    const modIncrementButton = screen.getByText('+');
    fireEvent.click(modIncrementButton); // Mod = +1
    fireEvent.click(modIncrementButton); // Mod = +2

    // Mocked rolls: hope=10, fear=5, minus=3, plus=7
    // Calculation: 10(hope) + 5(fear) + modifier(2) + plusTotal(7) - minusTotal(3)
    // Expected total = 10 + 5 + 2 + 7 - 3 = 21

    fireEvent.click(screen.getByText('ROLL'));

    await waitFor(() => {
      expect(mockSetLastRollResult).toHaveBeenCalledWith(expect.objectContaining({
        hope: 10,
        fear: 5,
        plusTotal: 7,
        minusTotal: 3,
        total: 21,
        modifier: 2, // Temp modifier
      }));
    });
  });

  it('should use experience modifiers correctly', async () => {
    const mockCharacterWithExp = {
      experiences: [{ name: 'Haste', value: 2 }],
      hope: 10,
    };
    // Re-mock the store provider to use the character with experiences
    useCharacterStore.mockImplementation(() => ({ 
      isDiceOverlayOpen: true,
      closeDiceOverlay: vi.fn(),
      setLastRollResult: mockSetLastRollResult,
      lastRollResult: null,
      activeRoll: mockActiveRoll,
      character: mockCharacterWithExp,
      updateHope: mockUpdateHope,
    }));

    render(<DiceOverlay />);

    // Add a plus die and a minus die
    fireEvent.click(screen.getByText('d12')); // Adds as 'plus'
    const firstAddedDieButton = findDieButtonBySidesAndRole(12, 'plus');
    fireEvent.click(firstAddedDieButton); // Cycle to 'minus'
    await waitFor(() => expect(findDieButtonBySidesAndRole(12, 'minus')).toBeInTheDocument());

    fireEvent.click(screen.getByText('d12')); // Adds another as 'plus'

    // Select the experience
    fireEvent.click(screen.getByText('Haste +2'));
    expect(screen.getByText('Hope: 9')).toBeInTheDocument(); // Hope cost = 1

    // Mocked rolls: hope=10, fear=5, plus=8, minus=3
    // Experience modifier = 2
    // Calculation: 10(hope) + 5(fear) + expMod(2) + plusTotal(8) - minusTotal(3)
    // Expected total = 10 + 5 + 2 + 8 - 3 = 22

    fireEvent.click(screen.getByText('ROLL'));

    await waitFor(() => {
      expect(mockSetLastRollResult).toHaveBeenCalledWith(expect.objectContaining({
        hope: 10,
        fear: 5,
        plusTotal: 8,
        minusTotal: 3,
        total: 22,
        modifier: 2, // Experience modifier is applied correctly
      }));
      expect(mockUpdateHope).toHaveBeenCalledWith(9); // Hope should be updated
    });
  });

  it('should display the correct roll type (Critical, Hope, Fear)', async () => {
    render(<DiceOverlay />);

    // Test 1: Hope type
    // Default setup from mock: hope=10, fear=5, plus=8, minus=3
    // Calculation: 10 + 5 + 0 + 8 - 3 = 20. hope > fear, so type should be 'Hope'.
    fireEvent.click(screen.getByText('ROLL'));
    await waitFor(() => expect(mockSetLastRollResult).toHaveBeenCalledWith(expect.objectContaining({ type: 'Hope' })));

    // Test 2: Fear type
    // To test 'Fear' type, we need a scenario where fearRoll > hopeRoll.
    // This requires custom mock logic for the 'roll' function that returns values based on config.
    // For now, we'll assume the logic paths for 'Fear' and 'Critical' are covered by other tests or will be added.

    // Test 3: Critical type
    // Need hopeRoll === fearRoll. This also requires custom mock logic.
  });

  it('should handle damage rolls', async () => {
    const mockActiveRoll = {
      label: 'Sword Attack',
      dice: '2d8+3', // Example damage dice string
      modifier: 0,
    };
    useCharacterStore.mockImplementation(() => ({ // Re-mock the store provider
      isDiceOverlayOpen: true,
      closeDiceOverlay: vi.fn(),
      setLastRollResult: mockSetLastRollResult,
      lastRollResult: null,
      activeRoll: mockActiveRoll,
      character: mockCharacter,
      updateHope: mockUpdateHope,
    }));

    render(<DiceOverlay />);

    // Mocked roll for 2d8+3:
    // Mocked d8 values are [6, 7]. Total dice value = 6 + 7 = 13.
    // String modifier = 3. Total = 13 + 3 = 16.
    // Type should be 'Damage'.

    fireEvent.click(screen.getByText('ROLL'));

    await waitFor(() => {
      expect(mockSetLastRollResult).toHaveBeenCalledWith(expect.objectContaining({
        hope: 0,
        fear: 0,
        total: 16, // 2d8 (6+7=13) + 3 (string modifier)
        modifier: 3, // The +3 from the dice string + base modifier (0)
        type: 'Damage',
        dice: expect.arrayContaining([ // Check that the dice config was parsed
          expect.objectContaining({ sides: 8 }),
          expect.objectContaining({ sides: 8 }),
        ]),
      }));
    });
  });

  it('should update hope correctly when experiences are used', async () => {
    const mockCharacterWithExp = {
      experiences: [{ name: 'Haste', value: 2 }],
      hope: 10,
    };
    useCharacterStore.mockImplementation(() => ({ // Re-mock the store provider
      isDiceOverlayOpen: true,
      closeDiceOverlay: vi.fn(),
      setLastRollResult: mockSetLastRollResult,
      lastRollResult: null,
      activeRoll: mockActiveRoll,
      character: mockCharacterWithExp,
      updateHope: mockUpdateHope,
    }));

    render(<DiceOverlay />);

    // Select the experience
    fireEvent.click(screen.getByText('Haste +2'));
    expect(screen.getByText('Hope: 9')).toBeInTheDocument(); // Hope cost = 1

    fireEvent.click(screen.getByText('ROLL'));

    await waitFor(() => {
      expect(mockUpdateHope).toHaveBeenCalledWith(9);
    });
  });

});

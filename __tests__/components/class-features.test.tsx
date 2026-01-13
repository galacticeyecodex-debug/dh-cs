/**
 * CLASS FEATURES COMPONENTS TESTS
 * ----------------------------------------------------------------------------
 * Tests for the interactive class feature cards:
 * - SlayerDiceCard (Warrior)
 * - ElementalIncarnationCard (Druid)
 * - SorcererElementCard (Sorcerer)
 *
 * Testing Strategy:
 * - Mock useCharacterStore to provide prepareRoll function.
 * - Test rendering of initial states.
 * - Test user interactions (banking dice, spending dice, selecting elements).
 * - Verify callbacks are triggered correctly.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SlayerDiceCard from '@/components/views/character/class-features/warrior-slayer-dice-card';
import ElementalIncarnationCard from '@/components/views/character/subclass-features/druid-elemental-incarnation-card';
import SorcererElementCard from '@/components/views/character/subclass-features/sorcerer-element-card';
import { useCharacterStore } from '@/store/character-store';
import { toast } from 'sonner';

// --- Mocks ---

// Mock useCharacterStore
const mockPrepareRoll = vi.fn();
vi.mock('@/store/character-store', () => ({
  useCharacterStore: vi.fn(() => ({
    prepareRoll: mockPrepareRoll,
  })),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// --- SlayerDiceCard Tests ---

describe('SlayerDiceCard', () => {
  const defaultProps = {
    slayerDice: { dice: [], lastRolled: '' },
    proficiency: 3,
    description: 'Test Description',
    onUpdateSlayerDice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<SlayerDiceCard {...defaultProps} />);
    expect(screen.getByText('Slayer Dice')).toBeInTheDocument();
    expect(screen.getByText('0 / 3')).toBeInTheDocument(); // Pool count
  });

  it('should show info when info button is clicked', () => {
    render(<SlayerDiceCard {...defaultProps} />);
    const infoButton = screen.getByLabelText('Show slayer dice info');
    fireEvent.click(infoButton);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should allow banking a die when under capacity', () => {
    render(<SlayerDiceCard {...defaultProps} />);
    const bankButton = screen.getByText('Bank Die');
    fireEvent.click(bankButton);
    expect(defaultProps.onUpdateSlayerDice).toHaveBeenCalledWith(
      expect.objectContaining({
        dice: expect.arrayContaining([expect.objectContaining({ used: false })]),
      })
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('should not allow banking a die when at capacity', () => {
    const props = {
      ...defaultProps,
      slayerDice: {
        dice: [
            { id: '1', value: 0, used: false },
            { id: '2', value: 0, used: false },
            { id: '3', value: 0, used: false }
        ],
        lastRolled: ''
      },
    };
    render(<SlayerDiceCard {...props} />);
    const bankButton = screen.getByText('Bank Die');
    expect(bankButton).toBeDisabled();
    expect(defaultProps.onUpdateSlayerDice).not.toHaveBeenCalled();
  });

  it('should allow spending a die', () => {
    const props = {
      ...defaultProps,
      slayerDice: {
        dice: [{ id: '1', value: 0, used: false }],
        lastRolled: ''
      },
    };
    render(<SlayerDiceCard {...props} />);
    const spendButton = screen.getByText('Spend 1');
    fireEvent.click(spendButton);
    
    // Should call prepareRoll
    expect(mockPrepareRoll).toHaveBeenCalledWith('Slayer Dice', 0, '1d6');
    
    // Should update dice state
    expect(props.onUpdateSlayerDice).toHaveBeenCalledWith(
      expect.objectContaining({
        dice: expect.arrayContaining([expect.objectContaining({ id: '1', used: true })]),
      })
    );
  });

  it('should allow clearing dice (end session)', () => {
     const props = {
      ...defaultProps,
      slayerDice: {
        dice: [{ id: '1', value: 0, used: false }],
        lastRolled: ''
      },
    };
    render(<SlayerDiceCard {...props} />);
    const clearButton = screen.getByText(/End Session/);
    fireEvent.click(clearButton);
    
    expect(props.onUpdateSlayerDice).toHaveBeenCalledWith(
      expect.objectContaining({ dice: [] })
    );
    expect(toast.success).toHaveBeenCalled();
  });
});

// --- ElementalIncarnationCard Tests ---

describe('ElementalIncarnationCard', () => {
  const defaultProps = {
    incarnation: { is_active: false, selected_element: undefined },
    description: 'Test Description',
    onUpdateIncarnation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render element selection when not active', () => {
    render(<ElementalIncarnationCard {...defaultProps} />);
    expect(screen.getByText('Elemental Incarnation')).toBeInTheDocument();
    expect(screen.getByText('Mark a Stress to channel an element:')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Earth')).toBeInTheDocument();
  });

  it('should activate element when clicked', () => {
    render(<ElementalIncarnationCard {...defaultProps} />);
    const fireButton = screen.getByText('Fire').closest('button');
    fireEvent.click(fireButton!);
    
    expect(defaultProps.onUpdateIncarnation).toHaveBeenCalledWith({
      is_active: true,
      selected_element: 'fire',
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('should show active state when active', () => {
    const props = {
      ...defaultProps,
      incarnation: { is_active: true, selected_element: 'fire' as const },
    };
    render(<ElementalIncarnationCard {...props} />);
    
    expect(screen.getByText('Channeling Fire')).toBeInTheDocument();
    expect(screen.getByText('End Channeling')).toBeInTheDocument();
  });

  it('should allow ending channel', () => {
    const props = {
      ...defaultProps,
      incarnation: { is_active: true, selected_element: 'fire' as const },
    };
    render(<ElementalIncarnationCard {...props} />);
    
    const endButton = screen.getByText('End Channeling');
    fireEvent.click(endButton);
    
    expect(defaultProps.onUpdateIncarnation).toHaveBeenCalledWith({
      is_active: false,
      selected_element: undefined,
    });
    expect(toast.info).toHaveBeenCalled();
  });
});

// --- SorcererElementCard Tests ---

describe('SorcererElementCard', () => {
  const defaultProps = {
    element: undefined,
    description: 'Test Description',
    onUpdateElement: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render element selection when no element selected', () => {
    render(<SorcererElementCard {...defaultProps} />);
    expect(screen.getByText('Elementalist')).toBeInTheDocument();
    expect(screen.getByText('Choose your elemental origin:')).toBeInTheDocument();
    expect(screen.getByText('Air')).toBeInTheDocument();
  });

  it('should select element when clicked', () => {
    render(<SorcererElementCard {...defaultProps} />);
    const airButton = screen.getByText('Air').closest('button');
    fireEvent.click(airButton!);
    
    expect(defaultProps.onUpdateElement).toHaveBeenCalledWith('air');
    expect(toast.success).toHaveBeenCalled();
  });

  it('should show selected element state', () => {
    const props = {
      ...defaultProps,
      element: 'air' as const,
    };
    render(<SorcererElementCard {...props} />);
    
    // Note: The card logic shows "Elementalist" as header, but inside the selected view 
    // it shows the element name as title.
    // However, the test might fail if it finds multiple "Air".
    // Let's check for the text "Your chosen elemental origin" which is unique to selected view.
    expect(screen.getByText('Your chosen elemental origin')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('should allow changing element', () => {
    const props = {
      ...defaultProps,
      element: 'air' as const,
    };
    render(<SorcererElementCard {...props} />);
    
    const changeButton = screen.getByText('Change');
    fireEvent.click(changeButton);
    
    expect(screen.getByText('Choose your elemental origin:')).toBeInTheDocument();
  });
});

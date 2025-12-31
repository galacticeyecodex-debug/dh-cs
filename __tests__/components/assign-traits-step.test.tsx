import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AssignTraitsStep from '../../components/character-creation/assign-traits-step';
import { CharacterFormData } from '../../components/character-creation/types';

describe('AssignTraitsStep', () => {
  const mockSetFormData = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();
  const mockAssignTraitValue = vi.fn();

  const defaultProps = {
    formData: {
      stats: {
        agility: undefined,
        strength: undefined,
        finesse: undefined,
        instinct: undefined,
        presence: undefined,
        knowledge: undefined,
      }
    } as any,
    traitAssignmentPool: [2, 1, 1, 0, 0, -1],
    suggestedTraits: "0, -1, +1, 0, +2, +1",
    classSource: 'srd',
    assignTraitValue: mockAssignTraitValue,
    setFormData: mockSetFormData,
    onNext: mockOnNext,
    onBack: mockOnBack,
    isValid: false,
  };

  it('renders standard header: Step 5: Assign Traits', () => {
    render(<AssignTraitsStep {...defaultProps} />);
    expect(screen.getByText(/Step 5: Assign Traits/i)).toBeDefined();
  });

  it('starts with recommended traits auto-applied on mount', () => {
    render(<AssignTraitsStep {...defaultProps} />);
    // Since auto-apply triggers on mount, setFormData should have been called
    expect(mockSetFormData).toHaveBeenCalled();
  });

  it('renders trait cards for each core trait', () => {
    render(<AssignTraitsStep {...defaultProps} />);
    expect(screen.getByText('Agility')).toBeDefined();
    expect(screen.getByText('Strength')).toBeDefined();
    expect(screen.getByText('Finesse')).toBeDefined();
    expect(screen.getByText('Instinct')).toBeDefined();
    expect(screen.getByText('Presence')).toBeDefined();
    expect(screen.getByText('Knowledge')).toBeDefined();
  });

  it('greys out (disables) pool values taken by other stats', () => {
    const currentStats = {
      agility: 2,
      strength: 1,
      finesse: undefined,
      instinct: undefined,
      presence: undefined,
      knowledge: undefined,
    };

    const props = {
      ...defaultProps,
      formData: { stats: currentStats }
    };

    render(<AssignTraitsStep {...props} />);
    
    // Find all buttons with text "+2"
    // There should be 6 +2 buttons (one for each stat)
    // Agility has it selected. The others should have it disabled.
    const plusTwoButtons = screen.getAllByRole('button', { name: '+2' });
    
    // Agility is the first stat in STAT_ORDER
    // It should have the button enabled (and styled as selected)
    expect(plusTwoButtons[0]).not.toBeDisabled();
    
    // Others should have it disabled because Agility took the only +2 in the pool [2, 1, 1, 0, 0, -1]
    expect(plusTwoButtons[1]).toBeDisabled(); // Strength
    expect(plusTwoButtons[2]).toBeDisabled(); // Finesse
  });

  it('calls applySuggestions when "Reset to Recommended" is clicked', () => {
    // To see the button, stats must NOT match suggestions
    const mismatchedStats = {
      agility: -1, // differs from suggested 0
      strength: 0,
      finesse: 1,
      instinct: 0,
      presence: 2,
      knowledge: 1,
    };

    render(<AssignTraitsStep {...defaultProps} formData={{ stats: mismatchedStats }} />);
    
    const resetButton = screen.getByText('Reset to Recommended');
    fireEvent.click(resetButton);
    expect(mockSetFormData).toHaveBeenCalled();
  });
});
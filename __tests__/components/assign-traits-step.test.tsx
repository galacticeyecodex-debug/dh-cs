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

  it('starts with all traits as --- blanks', () => {
    render(<AssignTraitsStep {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    selects.forEach(select => {
      expect((select as HTMLSelectElement).value).toBe("");
      const selectedOption = within(select).getByRole('option', { name: '---' });
      expect((selectedOption as HTMLOptionElement).selected).toBe(true);
    });
  });

  it('renders "Use Recommended Assignments" button', () => {
    render(<AssignTraitsStep {...defaultProps} />);
    expect(screen.getByText('Use Recommended Assignments')).toBeDefined();
  });

  it('greys out (disables) slots taken by other stats', () => {
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
    
    const selects = screen.getAllByRole('combobox');
    const finesseSelect = selects[2];
    const options = within(finesseSelect).getAllByRole('option');
    
    // PoolVal indices: ---, +2, +1, +1, 0, 0, -1
    expect((options[1] as HTMLOptionElement).disabled).toBe(true); // +2 taken by Agility
    expect((options[2] as HTMLOptionElement).disabled).toBe(true); // first +1 taken by Strength
    expect((options[3] as HTMLOptionElement).disabled).toBe(false); // second +1 enabled
  });

  it('calls applySuggestions when recommended button is clicked', () => {
    render(<AssignTraitsStep {...defaultProps} />);
    const recButton = screen.getByText('Use Recommended Assignments');
    fireEvent.click(recButton);
    expect(mockSetFormData).toHaveBeenCalled();
  });
});
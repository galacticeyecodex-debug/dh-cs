/**
 * MODIFIER BUILDER TESTS
 * ----------------------------------------------------------------------------
 * Tests for the ModifierBuilder component used in homebrew item creation.
 *
 * FUNCTIONALITY TESTED:
 * - Adding new modifiers with different operators
 * - Editing existing modifiers
 * - Deleting modifiers
 * - Form validation (numeric values)
 * - Description generation preview
 * - Conditional modifiers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModifierBuilder from '@/components/views/inventory/modifier-builder';
import { Modifier } from '@/types/modifiers';

describe('ModifierBuilder', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    modifiers: [],
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Empty State', () => {
    it('should render empty state when no modifiers', () => {
      render(<ModifierBuilder {...defaultProps} />);
      expect(screen.getByText(/no modifiers yet/i)).toBeTruthy();
    });

    it('should show "Add Modifier" button', () => {
      render(<ModifierBuilder {...defaultProps} />);
      expect(screen.getByText('Add Manually')).toBeTruthy();
    });
  });

  describe('Adding Modifiers', () => {
    it('should show form when "Add Modifier" is clicked', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));
      expect(screen.getByText('New Modifier')).toBeTruthy();
      expect(screen.getByText('Target Stat')).toBeTruthy();
    });

    it('should add a modifier when form is submitted', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      // Fill form
      fireEvent.change(screen.getByLabelText(/target stat/i), { target: { value: 'strength' } });
      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText(/operator/i), { target: { value: 'add' } });

      // Submit
      fireEvent.click(screen.getByText('Add'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            target: 'strength',
            value: 2,
            operator: 'add',
            type: 'stat',
          }),
        ])
      );
    });

    it('should generate correct description for add operator', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/target stat/i), { target: { value: 'agility' } });
      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '3' } });
      fireEvent.change(screen.getByLabelText(/operator/i), { target: { value: 'add' } });

      // Check preview
      expect(screen.getByText('+3 to Agility')).toBeTruthy();
    });

    it('should support conditional modifiers', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/target stat/i), { target: { value: 'evasion' } });
      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '2' } });
      fireEvent.change(screen.getByPlaceholderText(/while unarmored/i), {
        target: { value: 'while unarmored' },
      });

      fireEvent.click(screen.getByText('Add'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            condition: 'while unarmored',
          }),
        ])
      );
    });

    it('should reject non-numeric values', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText('Add'));

      expect(alertSpy).toHaveBeenCalledWith('Value must be a number');
      expect(mockOnChange).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should support negative values', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '-2' } });
      fireEvent.click(screen.getByText('Add'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            value: -2,
          }),
        ])
      );
    });

    it('should close form when Cancel is clicked', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));
      expect(screen.getByText('New Modifier')).toBeTruthy();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('New Modifier')).toBeNull();
    });
  });

  describe('Displaying Modifiers', () => {
    const existingModifiers: Modifier[] = [
      {
        id: 'mod1',
        type: 'stat',
        target: 'strength',
        value: 2,
        operator: 'add',
        description: '+2 to Strength',
      },
      {
        id: 'mod2',
        type: 'stat',
        target: 'evasion',
        value: 1,
        operator: 'add',
        condition: 'while unarmored',
        description: '+1 to Evasion (while unarmored)',
      },
    ];

    it('should display existing modifiers', () => {
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);
      expect(screen.getByText('+2 to Strength')).toBeTruthy();
      expect(screen.getByText('+1 to Evasion (while unarmored)')).toBeTruthy();
    });

    it('should show modifier details', () => {
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);
      expect(screen.getByText(/strength • add • 2/i)).toBeTruthy();
    });
  });

  describe('Editing Modifiers', () => {
    const existingModifiers: Modifier[] = [
      {
        id: 'mod1',
        type: 'stat',
        target: 'strength',
        value: 2,
        operator: 'add',
        description: '+2 to Strength',
      },
    ];

    it('should populate form with modifier data when Edit is clicked', () => {
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);

      // Click the edit button directly
      const editButton = screen.getByTitle('Edit modifier');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Modifier')).toBeTruthy();
      expect(screen.getByLabelText(/target stat/i)).toHaveValue('strength');
      expect(screen.getByLabelText(/value/i)).toHaveValue(2);
    });

    it('should update modifier when Update is clicked', () => {
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);

      const editButton = screen.getByTitle('Edit modifier');
      fireEvent.click(editButton);

      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '5' } });
      fireEvent.click(screen.getByText('Update'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'mod1',
            value: 5,
          }),
        ])
      );
    });
  });

  describe('Deleting Modifiers', () => {
    const existingModifiers: Modifier[] = [
      {
        id: 'mod1',
        type: 'stat',
        target: 'strength',
        value: 2,
        operator: 'add',
        description: '+2 to Strength',
      },
      {
        id: 'mod2',
        type: 'stat',
        target: 'agility',
        value: 1,
        operator: 'add',
        description: '+1 to Agility',
      },
    ];

    it('should remove modifier when Delete is clicked', () => {
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);

      // Click the delete button for the first modifier
      const deleteButtons = screen.getAllByTitle('Delete modifier');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([existingModifiers[1]]);
    });
  });

  describe('Different Operators', () => {
    it('should generate correct description for subtract operator', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/operator/i), { target: { value: 'subtract' } });
      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '1' } });

      expect(screen.getByText(/-1 to Agility/)).toBeTruthy();
    });

    it('should generate correct description for multiply operator', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/operator/i), { target: { value: 'multiply' } });
      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '2' } });

      expect(screen.getByText(/×2 to Agility/)).toBeTruthy();
    });

    it('should generate correct description for set operator', () => {
      render(<ModifierBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Manually'));

      fireEvent.change(screen.getByLabelText(/operator/i), { target: { value: 'set' } });
      fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '10' } });

      expect(screen.getByText(/Set Agility to 10/)).toBeTruthy();
    });
  });
});

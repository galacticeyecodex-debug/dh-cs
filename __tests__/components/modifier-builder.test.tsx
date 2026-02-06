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
import userEvent from '@testing-library/user-event';
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

    it('should add a modifier with default values when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));

      // Fill value (use default target/operator which are already set)
      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, '2');

      // Submit
      await user.click(screen.getByText('Add'));

      // Should add with default target (agility) and operator (add)
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            target: 'agility', // default value
            value: 2,
            operator: 'add', // default value
            type: 'stat',
          }),
        ])
      );
    });

    it('should generate correct description for default add operator', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));

      // Fill value (defaults are agility + add)
      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, '3');

      // Check preview - default is Agility with Add
      expect(screen.getByText('+3 to Agility')).toBeTruthy();
    });

    it('should support conditional modifiers', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));

      // Fill value
      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, '2');

      // Add condition
      await user.type(screen.getByPlaceholderText(/while unarmored/i), 'while unarmored');

      await user.click(screen.getByText('Add'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            condition: 'while unarmored',
          }),
        ])
      );
    });

    it('should reject non-numeric values', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));

      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, 'invalid');
      await user.click(screen.getByText('Add'));

      expect(alertSpy).toHaveBeenCalledWith('Value must be a number');
      expect(mockOnChange).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should support negative values', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));

      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, '-2');
      await user.click(screen.getByText('Add'));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            value: -2,
          }),
        ])
      );
    });

    it('should close form when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));
      expect(screen.getByText('New Modifier')).toBeTruthy();

      await user.click(screen.getByText('Cancel'));
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

    it('should populate form with modifier data when Edit is clicked', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);

      // Click the edit button directly
      const editButton = screen.getByTitle('Edit modifier');
      await user.click(editButton);

      expect(screen.getByText('Edit Modifier')).toBeTruthy();
      // The Select shows the selected value text, not the value attribute
      expect(screen.getByRole('combobox', { name: /target stat/i })).toHaveTextContent('Strength');
      expect(screen.getByLabelText(/value/i)).toHaveValue(2);
    });

    it('should update modifier when Update is clicked', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder modifiers={existingModifiers} onChange={mockOnChange} />);

      const editButton = screen.getByTitle('Edit modifier');
      await user.click(editButton);

      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, '5');
      await user.click(screen.getByText('Update'));

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

  // Note: Tests for different operators are skipped because Radix UI Select
  // does not work properly in jsdom environment (missing pointer capture APIs).
  // The operator selection functionality should be tested via E2E/integration tests.
  describe('Different Operators', () => {
    it('should render operator select in form', async () => {
      const user = userEvent.setup();
      render(<ModifierBuilder {...defaultProps} />);
      await user.click(screen.getByText('Add Manually'));

      // Verify the operator combobox is present
      expect(screen.getByRole('combobox', { name: /operator/i })).toBeTruthy();
      expect(screen.getByText('Operator')).toBeTruthy();
    });
  });
});

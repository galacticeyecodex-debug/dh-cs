/**
 * CREATE HOMEBREW ITEM MODAL TESTS
 * ----------------------------------------------------------------------------
 * Tests for the CreateHomebrewItemModal component.
 *
 * FUNCTIONALITY TESTED:
 * - Form rendering and basic inputs
 * - Type selection and type-specific fields
 * - Validation (name required, damage format, etc.)
 * - Successful item creation
 * - Cancel behavior
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateHomebrewItemModal from '@/components/modals/create-homebrew-item-modal';

describe('CreateHomebrewItemModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(<CreateHomebrewItemModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Create Homebrew Item')).toBeNull();
    });

    it('should render when open', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      expect(screen.getByText('Create Homebrew Item')).toBeTruthy();
    });

    it('should show basic info fields', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      expect(screen.getByLabelText(/item name/i)).toBeTruthy();
      expect(screen.getByText(/item type/i)).toBeTruthy();
      expect(screen.getByLabelText(/description/i)).toBeTruthy();
    });

    it('should show all item type buttons', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      expect(screen.getByText('Weapon')).toBeTruthy();
      expect(screen.getByText('Armor')).toBeTruthy();
      expect(screen.getByText('Item')).toBeTruthy();
      expect(screen.getByText('Consumable')).toBeTruthy();
    });
  });

  describe('Item Type Selection', () => {
    it('should default to weapon type', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      const weaponButton = screen.getByText('Weapon');
      expect(weaponButton.className).toContain('bg-dagger-gold');
    });

    it('should show weapon fields when weapon is selected', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Weapon'));
      expect(screen.getByText('Weapon Properties')).toBeTruthy();
      expect(screen.getByLabelText(/^Damage$/)).toBeTruthy();
      expect(screen.getByLabelText(/burden/i)).toBeTruthy();
    });

    it('should show armor fields when armor is selected', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Armor'));
      expect(screen.getByText('Armor Properties')).toBeTruthy();
      expect(screen.getByLabelText(/armor score/i)).toBeTruthy();
      expect(screen.getByLabelText(/damage thresholds/i)).toBeTruthy();
    });

    it('should show consumable fields when consumable is selected', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Consumable'));
      expect(screen.getByText('Consumable Properties')).toBeTruthy();
      expect(screen.getByLabelText(/number of uses/i)).toBeTruthy();
    });

    it('should switch between types correctly', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Weapon'));
      expect(screen.getByText('Weapon Properties')).toBeTruthy();

      fireEvent.click(screen.getByText('Armor'));
      expect(screen.queryByText('Weapon Properties')).toBeNull();
      expect(screen.getByText('Armor Properties')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should show error when name is empty', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Create Item'));

      expect(screen.getByText('Validation Errors:')).toBeTruthy();
      expect(screen.getByText('Item name is required')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when name is too short', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'ab' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(screen.getByText(/at least 3 characters/i)).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate damage format for weapons', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Sword' } });
      fireEvent.change(screen.getByLabelText(/^Damage$/), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(screen.getByText(/damage must match/i)).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should accept valid damage formats', () => {
      const validFormats = ['1d8', '2d6', 'd10', '1d8+2', '2d6-1'];

      validFormats.forEach(format => {
        const { rerender } = render(<CreateHomebrewItemModal {...defaultProps} />);

        fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Sword' } });
        fireEvent.change(screen.getByLabelText(/^Damage$/), { target: { value: format } });
        fireEvent.click(screen.getByText('Create Item'));

        expect(screen.queryByText(/damage must match format/i)).toBeNull();
        expect(mockOnSave).toHaveBeenCalled();

        mockOnSave.mockClear();
        rerender(<div />); // Unmount to reset
      });
    });

    it('should validate armor score is positive', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Armor'));
      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Armor' } });
      fireEvent.change(screen.getByLabelText(/armor score/i), { target: { value: '-1' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(screen.getByText(/armor score must be a positive number/i)).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate thresholds format', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Armor'));
      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Armor' } });
      fireEvent.change(screen.getByLabelText(/damage thresholds/i), { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(screen.getByText(/thresholds must match format/i)).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should create weapon with valid data', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Flaming Sword' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A sword wreathed in flames' } });
      fireEvent.change(screen.getByLabelText(/^Damage$/), { target: { value: '1d8+2' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Flaming Sword',
          type: 'weapon',
          description: 'A sword wreathed in flames',
          data: expect.objectContaining({
            damage: '1d8+2',
            burden: 'One-Handed',
          }),
        })
      );
    });

    it('should create armor with valid data', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Armor'));
      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Dragon Scale Armor' } });
      fireEvent.change(screen.getByLabelText(/armor score/i), { target: { value: '3' } });
      fireEvent.change(screen.getByLabelText(/damage thresholds/i), { target: { value: '2/4' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Dragon Scale Armor',
          type: 'armor',
          data: expect.objectContaining({
            base_score: 3,
            base_thresholds: '2/4',
          }),
        })
      );
    });

    it('should create consumable with valid data', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Consumable'));
      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Healing Potion' } });
      fireEvent.change(screen.getByLabelText(/number of uses/i), { target: { value: '3' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Healing Potion',
          type: 'consumable',
          data: expect.objectContaining({
            uses: 3,
          }),
        })
      );
    });

    it('should trim whitespace from name and description', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: '  Test Item  ' } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Test desc  ' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Item',
          description: 'Test desc',
        })
      );
    });

    it('should reset form after successful save', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test Item' } });
      fireEvent.click(screen.getByText('Create Item'));

      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Cancel Behavior', () => {
    it('should call onClose when X button is clicked', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when cancelled', () => {
      const { rerender } = render(<CreateHomebrewItemModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Cancel'));

      rerender(<CreateHomebrewItemModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/item name/i)).toHaveValue('');
    });
  });

  describe('Modifier Integration', () => {
    it('should include modifiers section', () => {
      render(<CreateHomebrewItemModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /modifiers/i })).toBeTruthy();
    });
  });
});

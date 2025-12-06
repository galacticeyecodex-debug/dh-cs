import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancementHistory from '@/components/advancement-history';
import { AdvancementRecord } from '@/store/character-store';

describe('AdvancementHistory', () => {
  const mockAdvancementHistory: Record<string, AdvancementRecord> = {
    '2': {
      advancements: ['increase_traits', 'increase_evasion'],
      traitIncrements: [
        { trait: 'agility', amount: 1 },
        { trait: 'presence', amount: 1 },
      ],
      domainCardSelected: 'card-shield-bash',
    },
    '3': {
      advancements: ['add_hp', 'increase_experience'],
      hpAdded: 1,
      experienceIncrements: [
        { experienceId: '0', amount: 1 },
        { experienceId: '1', amount: 1 },
      ],
      domainCardSelected: 'card-counter',
    },
    '4': {
      advancements: ['increase_proficiency'],
      domainCardSelected: 'card-fireball',
    },
  };

  describe('basic rendering', () => {
    it('should render advancement history', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      expect(screen.getByText('Advancement History')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
      expect(screen.getByText('Level 4')).toBeInTheDocument();
    });

    it('should show empty state when no history', () => {
      render(<AdvancementHistory advancementHistory={{}} />);
      expect(screen.getByText(/no advancement history yet/i)).toBeInTheDocument();
    });

    it('should display advancement counts', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      const advancementCounts = screen.getAllByText(/\(\d+ advancements?\)/);
      expect(advancementCounts.length).toBeGreaterThan(0);
    });
  });

  describe('expansion/collapse', () => {
    it('should be collapsed by default', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      // Details should not be visible
      expect(screen.queryByText('Advancements Selected')).not.toBeInTheDocument();
    });

    it('should expand when clicked', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      const level2Button = screen.getByText('Level 2').closest('button');
      fireEvent.click(level2Button!);
      expect(screen.getByText('Advancements Selected')).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      const level2Button = screen.getByText('Level 2').closest('button');

      // Expand
      fireEvent.click(level2Button!);
      expect(screen.getByText('Advancements Selected')).toBeInTheDocument();

      // Collapse
      fireEvent.click(level2Button!);
      expect(screen.queryByText('Advancements Selected')).not.toBeInTheDocument();
    });

    it('should support multiple expanded levels', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);

      // Expand level 2
      fireEvent.click(screen.getByText('Level 2').closest('button')!);
      // Expand level 3
      fireEvent.click(screen.getByText('Level 3').closest('button')!);

      // Both should be visible
      const advancementHeaders = screen.getAllByText('Advancements Selected');
      expect(advancementHeaders).toHaveLength(2);
    });
  });

  describe('advancement details display', () => {
    it('should display advancement names', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      fireEvent.click(screen.getByText('Level 2').closest('button')!);

      expect(screen.getAllByText('Increase Traits').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Increase Evasion').length).toBeGreaterThan(0);
    });

    it('should display trait increments', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      fireEvent.click(screen.getByText('Level 2').closest('button')!);

      expect(screen.getByText('Traits Increased')).toBeInTheDocument();
      expect(screen.getByText(/Agility \+1/i)).toBeInTheDocument();
      expect(screen.getByText(/Presence \+1/i)).toBeInTheDocument();
    });

    it('should display HP added', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      fireEvent.click(screen.getByText('Level 3').closest('button')!);

      expect(screen.getByText('Hit Points Added')).toBeInTheDocument();
      expect(screen.getByText('+1 HP slots')).toBeInTheDocument();
    });

    it('should display experience increments', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      fireEvent.click(screen.getByText('Level 3').closest('button')!);

      expect(screen.getByText('Experiences Increased')).toBeInTheDocument();
    });

    it('should display domain card selected', () => {
      render(<AdvancementHistory advancementHistory={mockAdvancementHistory} />);
      fireEvent.click(screen.getByText('Level 2').closest('button')!);

      expect(screen.getByText('Domain Card Acquired')).toBeInTheDocument();
      expect(screen.getByText('card-shield-bash')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined history', () => {
      render(<AdvancementHistory advancementHistory={undefined as any} />);
      expect(screen.getByText(/no advancement history yet/i)).toBeInTheDocument();
    });

    it('should handle levels with only advancements', () => {
      const minimalHistory = {
        '2': {
          advancements: ['increase_evasion'],
          domainCardSelected: 'card-test',
        },
      };
      render(<AdvancementHistory advancementHistory={minimalHistory} />);
      fireEvent.click(screen.getByText('Level 2').closest('button')!);

      expect(screen.getAllByText('Increase Evasion').length).toBeGreaterThan(0);
      expect(screen.queryByText('Traits Increased')).not.toBeInTheDocument();
    });

    it('should sort levels numerically', () => {
      const unsortedHistory = {
        '10': { advancements: ['add_hp'], domainCardSelected: 'card-test' },
        '2': { advancements: ['add_stress'], domainCardSelected: 'card-test' },
        '5': { advancements: ['increase_evasion'], domainCardSelected: 'card-test' },
      };
      render(<AdvancementHistory advancementHistory={unsortedHistory} />);

      const levels = screen.getAllByText(/^Level \d+$/);
      expect(levels[0]).toHaveTextContent('Level 2');
      expect(levels[1]).toHaveTextContent('Level 5');
      expect(levels[2]).toHaveTextContent('Level 10');
    });
  });
});

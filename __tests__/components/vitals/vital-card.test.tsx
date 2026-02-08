import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VitalCard from '@/components/vitals/vital-card';
import { Heart } from '@/lib/icon-utils';

describe('VitalCard Visuals', () => {
    it('should apply strokeColor class to filled icons when provided', () => {
        render(
            <VitalCard
                label="Test Health"
                current={3}
                max={5}
                color="text-red-400"
                icon={Heart}
                trackType="mark-bad"
                strokeColor="stroke-red-900"
            />
        );

        const filledIcons = document.querySelectorAll('.stroke-red-900');
        expect(filledIcons.length).toBeGreaterThan(0);
    });

    it('should not apply strokeColor when not provided', () => {
        render(
            <VitalCard
                label="Test Health"
                current={3}
                max={5}
                color="text-red-400"
                icon={Heart}
                trackType="mark-bad"
            />
        );

        const filledIcons = document.querySelectorAll('.stroke-red-900');
        expect(filledIcons.length).toBe(0);
    });
});

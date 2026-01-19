/**
 * Format Utils Tests
 * Phase 9 Cleanup - Issue #67
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getInitials,
    formatShortDate,
    formatFullDate,
    formatRelativeDate,
} from '@/lib/format-utils';

describe('format-utils', () => {
    describe('getInitials', () => {
        it('returns first two characters in uppercase', () => {
            expect(getInitials('john')).toBe('JO');
            expect(getInitials('John Doe')).toBe('JO');
            expect(getInitials('jane')).toBe('JA');
        });

        it('handles short names', () => {
            expect(getInitials('A')).toBe('A');
            expect(getInitials('AB')).toBe('AB');
        });

        it('returns ? for null or undefined', () => {
            expect(getInitials(null)).toBe('?');
            expect(getInitials(undefined)).toBe('?');
        });

        it('returns ? for empty string', () => {
            expect(getInitials('')).toBe('?');
        });

        it('converts to uppercase correctly', () => {
            expect(getInitials('lowercase')).toBe('LO');
            expect(getInitials('MixedCase')).toBe('MI');
        });
    });

    describe('formatShortDate', () => {
        it('formats date as short month and year', () => {
            const result = formatShortDate('2025-01-15T12:00:00Z');
            // Result varies by locale, but should contain year
            expect(result).toContain('2025');
        });

        it('handles different months', () => {
            const january = formatShortDate('2025-01-01T00:00:00Z');
            const december = formatShortDate('2025-12-31T23:59:59Z');

            expect(january).not.toBe(december);
        });
    });

    describe('formatFullDate', () => {
        it('formats date with full month name', () => {
            const result = formatFullDate('2025-01-15T12:00:00Z');
            expect(result).toContain('2025');
            expect(result).toContain('15');
        });
    });

    describe('formatRelativeDate', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns "just now" for dates within the last minute', () => {
            const now = new Date('2025-01-19T12:00:00Z');
            vi.setSystemTime(now);

            const thirtySecondsAgo = new Date('2025-01-19T11:59:30Z').toISOString();
            expect(formatRelativeDate(thirtySecondsAgo)).toBe('just now');
        });

        it('returns minutes ago for dates within the last hour', () => {
            const now = new Date('2025-01-19T12:00:00Z');
            vi.setSystemTime(now);

            const thirtyMinutesAgo = new Date('2025-01-19T11:30:00Z').toISOString();
            expect(formatRelativeDate(thirtyMinutesAgo)).toBe('30 minutes ago');

            const oneMinuteAgo = new Date('2025-01-19T11:59:00Z').toISOString();
            expect(formatRelativeDate(oneMinuteAgo)).toBe('1 minute ago');
        });

        it('returns hours ago for dates within the last day', () => {
            const now = new Date('2025-01-19T12:00:00Z');
            vi.setSystemTime(now);

            const fiveHoursAgo = new Date('2025-01-19T07:00:00Z').toISOString();
            expect(formatRelativeDate(fiveHoursAgo)).toBe('5 hours ago');

            const oneHourAgo = new Date('2025-01-19T11:00:00Z').toISOString();
            expect(formatRelativeDate(oneHourAgo)).toBe('1 hour ago');
        });

        it('returns days ago for dates within the last week', () => {
            const now = new Date('2025-01-19T12:00:00Z');
            vi.setSystemTime(now);

            const threeDaysAgo = new Date('2025-01-16T12:00:00Z').toISOString();
            expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');

            const oneDayAgo = new Date('2025-01-18T12:00:00Z').toISOString();
            expect(formatRelativeDate(oneDayAgo)).toBe('1 day ago');
        });

        it('returns formatted date for older dates', () => {
            const now = new Date('2025-01-19T12:00:00Z');
            vi.setSystemTime(now);

            const twoWeeksAgo = new Date('2025-01-05T12:00:00Z').toISOString();
            const result = formatRelativeDate(twoWeeksAgo);

            // Should fall back to formatShortDate for dates > 7 days
            expect(result).toContain('2025');
        });
    });
});

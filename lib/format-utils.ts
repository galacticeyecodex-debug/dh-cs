/**
 * FORMAT UTILITIES
 * ----------------------------------------------------------------------------
 * Common formatting functions used across the application for consistent
 * display of user information, dates, and other formatted values.
 *
 * Used by:
 * - Friend card components (FriendCard, FriendRequestCard, OutgoingRequestCard)
 * - Share homebrew modal
 * - Other UI components needing consistent formatting
 */

/**
 * Get initials from a username or name string.
 * Returns the first two characters in uppercase, or '?' if no name provided.
 *
 * @example
 * getInitials('John Doe') // 'JO'
 * getInitials('jane') // 'JA'
 * getInitials(null) // '?'
 */
export function getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
}

/**
 * Format a date string as a short month and year.
 *
 * @example
 * formatShortDate('2025-01-15T12:00:00Z') // 'Jan 2025'
 */
export function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/**
 * Format a date string with full date and optional time.
 *
 * @example
 * formatFullDate('2025-01-15T12:00:00Z') // 'January 15, 2025'
 */
export function formatFullDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "just now").
 *
 * @example
 * formatRelativeDate('2025-01-17T12:00:00Z') // '2 days ago' (if today is Jan 19)
 */
export function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return formatShortDate(dateStr);
}

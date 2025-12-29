/**
 * DOMAIN COLOR SYSTEM
 * ----------------------------------------------------------------------------
 * Provides color theming for domain cards based on the 9 core Daggerheart domains.
 * Uses primary/secondary color pairs for card gradients and banners.
 */

export interface DomainTheme {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

export const DOMAIN_COLORS: Record<string, DomainTheme> = {
  arcana: {
    primary: '#8b5cf6', // Purple
    secondary: '#6366f1', // Indigo
    accent: '#a78bfa',
    gradient: 'from-purple-600 to-indigo-600',
  },
  blade: {
    primary: '#64748b', // Slate
    secondary: '#475569', // Dark slate
    accent: '#94a3b8',
    gradient: 'from-slate-500 to-slate-600',
  },
  bone: {
    primary: '#374151', // Gray
    secondary: '#1f2937', // Dark gray
    accent: '#6b7280',
    gradient: 'from-gray-700 to-gray-800',
  },
  codex: {
    primary: '#0891b2', // Cyan
    secondary: '#0e7490', // Dark cyan
    accent: '#06b6d4',
    gradient: 'from-cyan-600 to-cyan-700',
  },
  grace: {
    primary: '#fbbf24', // Amber/Gold
    secondary: '#f59e0b', // Orange
    accent: '#fcd34d',
    gradient: 'from-amber-400 to-orange-500',
  },
  midnight: {
    primary: '#312e81', // Deep indigo
    secondary: '#1e1b4b', // Very dark indigo
    accent: '#4c1d95',
    gradient: 'from-indigo-900 to-indigo-950',
  },
  sage: {
    primary: '#059669', // Emerald
    secondary: '#047857', // Dark emerald
    accent: '#10b981',
    gradient: 'from-emerald-600 to-emerald-700',
  },
  splendor: {
    primary: '#dc2626', // Red
    secondary: '#b91c1c', // Dark red
    accent: '#ef4444',
    gradient: 'from-red-600 to-red-700',
  },
  valor: {
    primary: '#ea580c', // Orange-red
    secondary: '#c2410c', // Dark orange
    accent: '#f97316',
    gradient: 'from-orange-600 to-orange-700',
  },
};

/**
 * Get theme colors for a domain (case-insensitive)
 */
export function getDomainTheme(domain?: string): DomainTheme {
  if (!domain) {
    return {
      primary: '#6b7280',
      secondary: '#4b5563',
      accent: '#9ca3af',
      gradient: 'from-gray-500 to-gray-600',
    };
  }

  const normalizedDomain = domain.toLowerCase();
  return DOMAIN_COLORS[normalizedDomain] || DOMAIN_COLORS.arcana;
}

/**
 * Calculate brightness of a hex color (0-255)
 * Used to determine if white or black text should be used
 */
export function getBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Get contrasting text color (white or black) for a background
 */
export function getContrastColor(hexColor: string): string {
  return getBrightness(hexColor) < 128 ? '#ffffff' : '#000000';
}

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
  textColor: string;
}

export const DOMAIN_COLORS: Record<string, DomainTheme> = {
  arcana: {
    primary: '#664295', // Purple
    secondary: '#4e3456',
    accent: '#8b5cf6',
    gradient: 'from-purple-800 to-indigo-900',
    textColor: '#ffffff',
  },
  blade: {
    primary: '#b93035', // Red
    secondary: '#af231c',
    accent: '#dc2626',
    gradient: 'from-red-700 to-red-800',
    textColor: '#ffffff',
  },
  blood: {
    primary: '#981B1D', // Dark Crimson
    secondary: '#580000',
    accent: '#ef4444',
    gradient: 'from-red-900 to-red-950',
    textColor: '#ffffff',
  },
  bone: {
    primary: '#c1c7cc', // Light Gray
    secondary: '#a4a9a8',
    accent: '#374151',
    gradient: 'from-gray-300 to-gray-400',
    textColor: '#000000',
  },
  codex: {
    primary: '#3370ab', // Blue
    secondary: '#24395d',
    accent: '#0891b2',
    gradient: 'from-blue-700 to-blue-800',
    textColor: '#ffffff',
  },
  grace: {
    primary: '#cb3b90', // Pink
    secondary: '#8d3965',
    accent: '#f472b6',
    gradient: 'from-pink-600 to-pink-700',
    textColor: '#ffffff',
  },
  midnight: {
    primary: '#2c2c2c', // Black
    secondary: '#1e201f',
    accent: '#4b5563',
    gradient: 'from-gray-800 to-black',
    textColor: '#ffffff',
  },
  sage: {
    primary: '#0e854d', // Green
    secondary: '#244e30',
    accent: '#059669',
    gradient: 'from-green-700 to-green-800',
    textColor: '#ffffff',
  },
  splendor: {
    primary: '#d1b447', // Gold
    secondary: '#b8a342',
    accent: '#fbbf24',
    gradient: 'from-yellow-600 to-yellow-700',
    textColor: '#000000',
  },
  valor: {
    primary: '#dc7a27', // Orange
    secondary: '#e2680e',
    accent: '#ea580c',
    gradient: 'from-orange-600 to-orange-700',
    textColor: '#ffffff',
  },
  dread: {
    primary: '#362b6c', // Dark Purple/Void
    secondary: '#2a2152',
    accent: '#4c1d95',
    gradient: 'from-indigo-900 to-purple-950',
    textColor: '#ffffff',
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
      textColor: '#ffffff',
    };
  }

  const normalizedDomain = domain.toLowerCase();
  return DOMAIN_COLORS[normalizedDomain] || DOMAIN_COLORS.arcana;
}

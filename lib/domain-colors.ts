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
    primary: 'var(--domain-arcana)',
    secondary: 'var(--domain-arcana-secondary)',
    accent: '#8b5cf6',
    gradient: 'from-purple-800 to-indigo-900',
    textColor: '#ffffff',
  },
  blade: {
    primary: 'var(--domain-blade)',
    secondary: 'var(--domain-blade-secondary)',
    accent: '#dc2626',
    gradient: 'from-red-700 to-red-800',
    textColor: '#ffffff',
  },
  blood: {
    primary: 'var(--domain-blood)',
    secondary: 'var(--domain-blood-secondary)',
    accent: '#ef4444',
    gradient: 'from-red-900 to-red-950',
    textColor: '#ffffff',
  },
  bone: {
    primary: 'var(--domain-bone)',
    secondary: 'var(--domain-bone-secondary)',
    accent: '#374151',
    gradient: 'from-gray-300 to-gray-400',
    textColor: '#000000',
  },
  codex: {
    primary: 'var(--domain-codex)',
    secondary: 'var(--domain-codex-secondary)',
    accent: '#0891b2',
    gradient: 'from-blue-700 to-blue-800',
    textColor: '#ffffff',
  },
  grace: {
    primary: 'var(--domain-grace)',
    secondary: 'var(--domain-grace-secondary)',
    accent: '#f472b6',
    gradient: 'from-pink-600 to-pink-700',
    textColor: '#ffffff',
  },
  midnight: {
    primary: 'var(--domain-midnight)',
    secondary: 'var(--domain-midnight-secondary)',
    accent: '#4b5563',
    gradient: 'from-gray-800 to-black',
    textColor: '#ffffff',
  },
  sage: {
    primary: 'var(--domain-sage)',
    secondary: 'var(--domain-sage-secondary)',
    accent: '#059669',
    gradient: 'from-green-700 to-green-800',
    textColor: '#ffffff',
  },
  splendor: {
    primary: 'var(--domain-splendor)',
    secondary: 'var(--domain-splendor-secondary)',
    accent: '#fbbf24',
    gradient: 'from-yellow-600 to-yellow-700',
    textColor: '#000000',
  },
  valor: {
    primary: 'var(--domain-valor)',
    secondary: 'var(--domain-valor-secondary)',
    accent: '#ea580c',
    gradient: 'from-orange-600 to-orange-700',
    textColor: '#ffffff',
  },
  dread: {
    primary: 'var(--domain-dread)',
    secondary: 'var(--domain-dread-secondary)',
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
  return DOMAIN_COLORS[normalizedDomain];
}

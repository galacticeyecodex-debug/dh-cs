'use client';

/**
 * ROOT LAYOUT CLIENT
 * ============================================================================
 * Client-side initialization for the Daggerheart Character Sheet application.
 *
 * This component:
 * - Initializes the modifier aggregator cache at app startup
 * - Provides the ToastProvider and other client-side infrastructure
 * - Wraps the entire app to ensure initialization happens first
 */

import { useModifierAggregatorInit } from '@/hooks/useModifierAggregatorInit';
import { ReactNode } from 'react';

interface RootLayoutClientProps {
  children: ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  // Initialize modifier aggregator on app startup
  useModifierAggregatorInit(false);

  return <>{children}</>;
}

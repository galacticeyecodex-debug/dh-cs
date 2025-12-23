/**
 * USEUSER HOOK (SHARED INTERFACE)
 * ----------------------------------------------------------------------------
 * A unified hook for accessing authentication state across both Web and Native apps.
 * 
 * ARCHITECTURE:
 * - This hook acts as a "Consumer" of the AuthService.
 * - It allows UI components to stay implementation-agnostic.
 * - Synced: This file is identical in both codebases.
 */

'use client';

import { useAuthService } from '@/lib/auth-service';

export default function useUser() {
  return useAuthService();
}
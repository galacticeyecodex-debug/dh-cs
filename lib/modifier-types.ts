/**
 * MODIFIER TYPE DEFINITIONS
 * ============================================================================
 * Type-safe definitions for modifier system with branded types and validation.
 *
 * This module provides:
 * - Branded ModifierId type for compile-time safety
 * - Type-safe modifier creation and validation
 * - Consistent modifier identification across the codebase
 * - Protection against ID collisions and misuse
 */

import type { CardModifier } from '@/types/cards';
import { validateModifierValue } from './modifier-validator';

/**
 * Branded type for modifier IDs.
 * Prevents accidentally using regular strings where modifier IDs are expected.
 * Example: createModifierId('equipment', 'sword-1', 'strength')
 *          → 'equipment-sword-1-strength' (as ModifierId type)
 */
export type ModifierId = string & { readonly __brand: 'ModifierId' };

/**
 * Branded type for modifier source IDs.
 * Identifies a unique item within a modifier source.
 * Example: 'sword-1', 'arcane-ward', 'custom-mod-1'
 */
export type SourceId = string & { readonly __brand: 'SourceId' };

/**
 * Comprehensive modifier source type (exhaustive list).
 * TypeScript enforces all sources are handled in switch statements.
 */
export const MODIFIER_SOURCES_BRANDED = [
  'equipment',
  'domain_card',
  'user',
  'ancestry',
  'community',
  'class',
  'subclass'
] as const;

export type ModifierSourceType = (typeof MODIFIER_SOURCES_BRANDED)[number];

/**
 * Type-safe modifier source object.
 * All fields validated and typed.
 */
export interface TypeSafeModifierSource {
  id: ModifierId;
  name: string;
  value: number; // Already validated by validateModifierValue
  source: ModifierSourceType;
  type: string;
  formula?: string;
  condition?: CardModifier['condition'];
}

/**
 * Create a type-safe modifier ID from components.
 * Ensures consistent ID format across codebase.
 *
 * @param source - The modifier source type
 * @param sourceId - Unique identifier within the source
 * @param stat - The stat being modified
 * @returns A branded ModifierId string
 *
 * @example
 * const id = createModifierId('equipment', 'primary-weapon', 'strength');
 * // Result: 'equipment-primary-weapon-strength' (as ModifierId)
 */
export function createModifierId(
  source: ModifierSourceType,
  sourceId: SourceId | string,
  stat: string
): ModifierId {
  if (!source || !sourceId || !stat) {
    throw new Error(
      `Invalid modifier ID components: source=${source}, sourceId=${sourceId}, stat=${stat}`
    );
  }

  const id = `${source}-${sourceId}-${stat}`;

  // Validate format: should be alphanumeric + hyphens
  if (!/^[a-z0-9_-]+$/.test(id)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[modifier-types] Modifier ID contains unusual characters: ${id}`);
    }
  }

  return id as ModifierId;
}

/**
 * Parse a modifier ID back into its components.
 * Useful for debugging and logging.
 *
 * @param id - The modifier ID to parse
 * @returns Object with source, sourceId, stat fields or null if invalid
 */
export function parseModifierId(
  id: ModifierId
): { source: ModifierSourceType; sourceId: string; stat: string } | null {
  const parts = id.split('-');

  // Modifier ID format: source-sourceId-stat
  // But sourceId can contain hyphens, so we split from the beginning
  // Valid sources: 'equipment', 'domain_card', 'user', 'ancestry', 'community', 'class', 'subclass'
  const validSources = new Set(MODIFIER_SOURCES_BRANDED);

  for (let i = 1; i < parts.length; i++) {
    const potentialSource = parts.slice(0, i).join('-');
    if (validSources.has(potentialSource as ModifierSourceType)) {
      return {
        source: potentialSource as ModifierSourceType,
        sourceId: parts.slice(i, -1).join('-'),
        stat: parts[parts.length - 1],
      };
    }
  }

  return null;
}

/**
 * Create a type-safe source ID.
 * Source IDs must be valid identifiers (alphanumeric, hyphens, underscores).
 *
 * @param id - The source ID string
 * @returns A branded SourceId string
 */
export function createSourceId(id: string): SourceId {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid source ID: ${id}`);
  }

  if (!/^[a-z0-9_-]+$/i.test(id)) {
    throw new Error(`Source ID contains invalid characters: ${id}. Use only alphanumeric, hyphens, and underscores.`);
  }

  return id as SourceId;
}

/**
 * Create a type-safe modifier source object with validation.
 * All values are validated before returning.
 *
 * @param params - Modifier source parameters
 * @returns Type-safe ModifierSource object
 */
export function createTypeSafeModifierSource(params: {
  id: ModifierId;
  name: string;
  value: unknown; // Will be validated
  source: ModifierSourceType;
  type: string;
  formula?: string;
  condition?: CardModifier['condition'];
}): TypeSafeModifierSource {
  return {
    ...params,
    value: validateModifierValue(params.value), // Ensure value is valid
  };
}

/**
 * Validate that a modifier source is type-safe.
 * Useful for runtime checks and data integrity verification.
 *
 * @param source - The modifier source to validate
 * @returns true if valid, false otherwise
 */
export function isTypeSafeModifierSource(source: unknown): source is TypeSafeModifierSource {
  if (!source || typeof source !== 'object') return false;

  const m = source as Record<string, unknown>;

  // Check required fields
  if (typeof m.id !== 'string') return false;
  if (typeof m.name !== 'string') return false;
  if (typeof m.value !== 'number' || !Number.isFinite(m.value)) return false;
  if (typeof m.source !== 'string') return false;
  if (typeof m.type !== 'string') return false;

  // Check value is in valid range
  if (m.value < -10 || m.value > 10) return false;

  // Check source is valid
  if (!MODIFIER_SOURCES_BRANDED.includes(m.source as ModifierSourceType)) return false;

  return true;
}

/**
 * Ensure a modifier ID is properly branded.
 * Useful after retrieving IDs from databases or APIs.
 *
 * @param id - The string to brand as ModifierId
 * @returns Branded ModifierId
 */
export function asModifierId(id: string): ModifierId {
  if (!id || typeof id !== 'string') {
    throw new Error(`Cannot create ModifierId from: ${id}`);
  }
  return id as ModifierId;
}

/**
 * Ensure a string is properly branded as SourceId.
 *
 * @param id - The string to brand as SourceId
 * @returns Branded SourceId
 */
export function asSourceId(id: string): SourceId {
  if (!id || typeof id !== 'string') {
    throw new Error(`Cannot create SourceId from: ${id}`);
  }
  return id as SourceId;
}

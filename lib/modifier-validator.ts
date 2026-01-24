/**
 * MODIFIER VALIDATOR
 * ============================================================================
 * Validates and sanitizes modifier values to ensure they're within acceptable ranges.
 *
 * This prevents invalid data corruption from:
 * - NaN, Infinity, or other non-finite numbers
 * - Excessively large modifiers that don't make sense in game context
 * - Silent data corruption from malformed data
 */

/**
 * Reasonable bounds for character modifiers.
 * A character with +10 to a stat is extremely powerful; -10 is crippled.
 * These bounds are configurable but should rarely need adjustment.
 */
export const MODIFIER_BOUNDS = {
  min: -10,
  max: 10,
} as const;

/**
 * Validate and clamp a modifier value to acceptable range.
 *
 * If the value is not a finite number, returns 0.
 * If the value exceeds bounds, clamps to MODIFIER_BOUNDS.
 *
 * @param value - The modifier value to validate
 * @returns A valid modifier value in range [min, max]
 */
export function validateModifierValue(value: unknown): number {
  // Check if it's not a number
  if (typeof value !== 'number') {
    return 0;
  }

  // Check if it's not finite (NaN, Infinity, etc)
  if (!Number.isFinite(value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[modifier-validator] Invalid modifier value: ${value}, using 0`);
    }
    return 0;
  }

  // Check bounds
  if (value < MODIFIER_BOUNDS.min) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[modifier-validator] Modifier value ${value} below minimum (${MODIFIER_BOUNDS.min}), clamping`
      );
    }
    return MODIFIER_BOUNDS.min;
  }

  if (value > MODIFIER_BOUNDS.max) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[modifier-validator] Modifier value ${value} exceeds maximum (${MODIFIER_BOUNDS.max}), clamping`
      );
    }
    return MODIFIER_BOUNDS.max;
  }

  return value;
}

/**
 * Validate a modifier object's value field.
 * Useful for validating structured modifiers.
 *
 * @param modifier - The modifier object to validate
 * @returns The modifier with validated value
 */
export function validateModifier<T extends { value: unknown }>(modifier: T): T {
  return {
    ...modifier,
    value: validateModifierValue(modifier.value),
  };
}

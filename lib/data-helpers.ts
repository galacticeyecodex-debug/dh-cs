import { Character } from '@/types/character';

/**
 * Helper to safely parse a JSON field that might already be an object or a string.
 */
function safeParse<T>(value: any, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return value as T;
    try {
        return JSON.parse(value) as T;
    } catch (e) {
        console.error('Failed to parse JSON field:', value, e);
        return fallback;
    }
}

/**
 * Hydrates a raw database character row into a fully typed Character object.
 * Handles parsing of JSON fields and setting default values.
 */
export function hydrateCharacter(charRaw: any): Character {
    if (!charRaw) return charRaw;

    // 1. Parse Vitals
    const rawVitals = safeParse(charRaw.vitals, {}) as any;
    const vitals = {
        hit_points_current: rawVitals.hit_points_current ?? rawVitals.hp_current ?? 0,
        hit_points_max: rawVitals.hit_points_max ?? rawVitals.hp_max ?? 6,
        stress_current: rawVitals.stress_current ?? 0,
        stress_max: rawVitals.stress_max ?? 6,
        armor_slots: rawVitals.armor_slots ?? rawVitals.armor_current ?? 0,
        armor_score: rawVitals.armor_score ?? rawVitals.armor_max ?? 0
    };

    // 2. Parse Experiences
    let experiences: any[] = [];
    const rawExperiences = safeParse(charRaw.experiences, []);
    if (Array.isArray(rawExperiences)) {
        // Handle legacy format (array of strings) vs new format (array of objects)
        experiences = rawExperiences.length > 0 && typeof rawExperiences[0] === 'string'
            ? rawExperiences.map((name: string) => ({ name, value: 2 }))
            : rawExperiences;
    }

    // 3. Parse Damage Thresholds
    let damage_thresholds;
    if (charRaw.damage_thresholds) {
        damage_thresholds = safeParse(charRaw.damage_thresholds, null);
    }

    if (!damage_thresholds) {
        // Default fallback if missing
        const level = charRaw.level || 1;
        damage_thresholds = { minor: 1, major: level, severe: level * 2 };
    }

    return {
        ...charRaw,
        stats: safeParse(charRaw.stats, {}),
        vitals,
        damage_thresholds,
        experiences,
        modifiers: safeParse(charRaw.modifiers, {}),
        gold: safeParse(charRaw.gold, { copper: 0, silver: 0, gold: 0 }),
        gallery_images: safeParse(charRaw.gallery_images, []),
        domains: safeParse(charRaw.domains, []),
        marked_traits_jsonb: safeParse(charRaw.marked_traits_jsonb, {}),
        advancement_history_jsonb: safeParse(charRaw.advancement_history_jsonb, {}),
        subclass_progression: safeParse(charRaw.subclass_progression, {}),
        multiclass_progression: safeParse(charRaw.multiclass_progression, {}),
    } as Character;
}

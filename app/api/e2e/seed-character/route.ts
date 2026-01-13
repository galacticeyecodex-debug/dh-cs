/**
 * E2E TEST CHARACTER SEED API
 * ----------------------------------------------------------------------------
 * Creates a test character for E2E testing. This ensures authenticated tests
 * have a character to work with.
 *
 * SECURITY:
 * - Only works in non-production environments
 * - Requires authenticated user
 * - Creates character owned by the authenticated user
 *
 * The character is a Level 3 Bard (Troubadour) with typical equipment and cards.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Test character data - a Level 3 Bard with equipment and domain cards
const TEST_CHARACTER = {
  name: 'Test Hero',
  level: 3,
  class_id: 'class-bard',
  subclass_id: 'subclass-troubadour',
  ancestry: 'Human',
  community: 'Highborne',
  stats: {
    agility: 0,
    strength: -1,
    finesse: 1,
    instinct: 0,
    presence: 2,
    knowledge: 1,
  },
  vitals: {
    hit_points_current: 7,
    hit_points_max: 7,
    stress_current: 1,
    stress_max: 6,
    armor_slots: 2,
    armor_score: 2,
  },
  damage_thresholds: {
    minor: 3,
    major: 7,
    severe: 13,
  },
  hope: 3,
  evasion: 11,
  proficiency: 2,
  experiences: [
    { name: 'Performance', modifier: 2 },
    { name: 'Persuasion', modifier: 1 },
    { name: 'Lore', modifier: 1 },
  ],
  domains: ['Grace', 'Codex'],
  gold: {
    handfuls: 5,
    bags: 1,
    chests: 0,
  },
  subclass_progression: {
    foundation: true,
    specialization: false,
    mastery: false,
  },
};

// Domain cards for the test character (from Grace and Codex domains)
const TEST_CARDS = [
  { card_id: 'ability-grace-deft-deceiver', location: 'loadout', sort_order: 0 },
  { card_id: 'ability-grace-inspirational-words', location: 'loadout', sort_order: 1 },
  { card_id: 'spell-arcana-rune-ward', location: 'loadout', sort_order: 2 },
  { card_id: 'ability-grace-soothing-speech', location: 'vault', sort_order: 3 },
];

// Inventory items for the test character
const TEST_INVENTORY = [
  {
    item_id: 'weapon-rapier',
    name: 'Rapier',
    description: 'A slender, sharply pointed sword used for thrusting attacks.',
    location: 'equipped_primary',
    quantity: 1,
  },
  {
    item_id: 'weapon-dagger',
    name: 'Dagger',
    description: 'A small blade useful for close encounters.',
    location: 'equipped_secondary',
    quantity: 1,
  },
  {
    item_id: 'armor-gambeson-armor',
    name: 'Gambeson Armor',
    description: 'Padded armor offering modest protection.',
    location: 'equipped_armor',
    quantity: 1,
  },
];

export async function POST() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'E2E seeding is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if test character already exists for this user
    const { data: existingCharacters } = await supabase
      .from('characters')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('name', TEST_CHARACTER.name);

    if (existingCharacters && existingCharacters.length > 0) {
      console.log(`Test character already exists for user ${user.email}`);
      return NextResponse.json({
        success: true,
        message: 'Test character already exists',
        character_id: existingCharacters[0].id,
      });
    }

    // Use the RPC function to create character with cards and inventory atomically
    const { data: characterId, error: createError } = await supabase.rpc(
      'create_complete_character',
      {
        p_character: TEST_CHARACTER,
        p_cards: TEST_CARDS,
        p_inventory: TEST_INVENTORY,
      }
    );

    if (createError) {
      console.error('Error creating test character:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    console.log(`Created test character ${characterId} for user ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Test character created',
      character_id: characterId,
    });
  } catch (error) {
    console.error('E2E seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clean up test character
export async function DELETE() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'E2E cleanup is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Delete test character
    const { error: deleteError } = await supabase
      .from('characters')
      .delete()
      .eq('user_id', user.id)
      .eq('name', TEST_CHARACTER.name);

    if (deleteError) {
      console.error('Error deleting test character:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test character deleted',
    });
  } catch (error) {
    console.error('E2E cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

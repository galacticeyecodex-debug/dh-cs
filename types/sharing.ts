/**
 * HOMEBREW SHARING TYPES
 * ----------------------------------------------------------------------------
 * Type definitions for the homebrew sharing system (Phase 6 of Issue #67).
 *
 * This system allows users to share their custom homebrew items with:
 * - Specific campaigns (all members can access)
 * - Direct user-to-user sharing (future Phase 7)
 *
 * Uses a fork/snapshot model - shared items are copies at time of share,
 * not live references to the original item.
 */

import { HomebrewItem, HomebrewItemData } from './character';

/**
 * Represents a shared homebrew item record in the database
 */
export interface SharedHomebrew {
  id: string;
  homebrew_item_id: string;
  shared_by: string; // User ID of the sharer
  shared_with_user_id: string | null; // For direct user sharing (Phase 7)
  shared_with_campaign_id: string | null; // For campaign sharing
  item_snapshot: HomebrewItemSnapshot; // Complete copy of item at share time
  message: string | null; // Optional message from sharer
  created_at: string;
}

/**
 * Snapshot of a homebrew item at the time of sharing
 * Contains all data needed to recreate the item
 */
export interface HomebrewItemSnapshot {
  type: 'weapon' | 'armor' | 'item' | 'consumable';
  name: string;
  description: string | null;
  data: HomebrewItemData;
}

/**
 * Insert data for creating a new shared homebrew record
 */
export interface SharedHomebrewInsert {
  homebrew_item_id: string;
  shared_by: string;
  shared_with_user_id?: string;
  shared_with_campaign_id?: string;
  item_snapshot: HomebrewItemSnapshot;
  message?: string;
}

/**
 * Enriched shared homebrew with additional context
 */
export interface EnrichedSharedHomebrew extends SharedHomebrew {
  sharer_username?: string;
  sharer_avatar_url?: string;
  campaign_name?: string;
}

/**
 * Target for sharing - either a user or a campaign (mutually exclusive)
 */
export interface ShareTarget {
  userId?: string;
  campaignId?: string;
}

/**
 * Result of listing shared items with pagination info
 */
export interface SharedHomebrewList {
  items: EnrichedSharedHomebrew[];
  total: number;
}

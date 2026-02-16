# Specification: Homebrew Item Sharing

## Overview
Allow users to share their custom homebrew items (weapons, armor, consumables, etc.) with other players in the same campaign. This enables a collaborative environment where GMs can provide custom loot and players can share their creations.

## Requirements
- **Database Schema Updates:** Add a mechanism to link homebrew items to campaigns or allow them to be "published" to a campaign library.
- **Sharing UI:** Add a "Share to Campaign" button in the Homebrew/Inventory view.
- **Campaign Library View:** A section within the campaign view where shared homebrew items can be browsed and "added" to a player's own character sheet.
- **Permissions:** Ensure only campaign members can see shared items and only the creator (or GM) can remove/edit the shared status.

## Technical Details
- **Tables:** `homebrew_items` (existing), potentially a new `campaign_homebrew` join table or a `campaign_id` column in `homebrew_items`.
- **Real-time:** Use Supabase real-time to notify campaign members when a new item is shared.
- **Service Layer:** Update `data-service.ts` to handle sharing logic.

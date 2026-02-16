# Implementation Plan: Homebrew Item Sharing

## Phase 1: Database and Service Layer
- [ ] Task: Update Database Schema for Sharing
    - [ ] Create `campaign_homebrew` table or update `homebrew_items` with `campaign_id`
    - [ ] Update RLS policies to allow campaign members to read shared items
- [ ] Task: Implement Sharing Logic in Data Service
    - [ ] Write tests for `shareItemToCampaign` and `unshareItemFromCampaign`
    - [ ] Implement service functions in `lib/data-service.ts`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database and Service Layer' (Protocol in workflow.md)

## Phase 2: UI Implementation
- [ ] Task: Add "Share" Button to Homebrew Cards
    - [ ] Write Vitest for `HomebrewCard` sharing interaction
    - [ ] Implement UI in `components/views/inventory/`
- [ ] Task: Create Campaign Library View
    - [ ] Write Vitest for `CampaignLibrary` component
    - [ ] Implement view to browse and import shared items
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)

## Phase 3: Real-time and Polish
- [ ] Task: Enable Real-time Notifications for Shared Items
    - [ ] Update `useCampaignRealtime` to handle homebrew updates
- [ ] Task: Final Polish and Mobile Optimization
    - [ ] Verify touch targets and responsive layout
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Real-time and Polish' (Protocol in workflow.md)

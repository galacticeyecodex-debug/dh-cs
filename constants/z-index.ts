/**
 * Z-INDEX CONSTANTS
 * ----------------------------------------------------------------------------
 * Centralized source of truth for all z-index values across the application.
 * This ensures consistent layering and prevents overlap issues.
 */

export const Z_INDEX = {
  // Base layers
  BASE: 0,
  
  // Decorative / Background elements
  DECORATIVE: 10,
  
  // Content controls / Floating buttons in views
  VIEW_CONTROLS: 30,
  
  // Main layout headers/footers
  HEADER: 40,
  VITAL_TRAY: 40,
  NAV_BAR: 50,
  
  // Specific UI elements within components
  CARD_CONTENT: 10,
  CARD_CONTROLS: 40,
  CARD_DECORATION: 40,
  
  // Component-specific overlays
  MODIFIER_SHEET: 60,
  
  // Overlay/Backdrop layers
  BACKDROP: 60,
  
  // Modals / Dialogs / Sheets
  MODAL: 70,
  DRAWER: 70,
  
  // Critical Overlays (above modals)
  TOOLTIP: 80,
  DICE_OVERLAY: 90,
  TOAST: 100,
} as const;

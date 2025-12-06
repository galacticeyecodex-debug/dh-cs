/**
 * Card Data Access Helpers
 *
 * Standardizes access to card properties across different data shapes.
 * Cards can have properties directly (card.level) or nested (card.data?.level).
 * These helpers handle both formats consistently.
 */

export interface CardLike {
  id?: string;
  name?: string;
  level?: number;
  description?: string;
  type?: string;
  domain?: string;
  recall_cost?: number;
  data?: {
    level?: number;
    description?: string;
    type?: string;
    domain?: string;
    recall_cost?: number;
    markdown?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Get the card's level
 * @param card - Card object with level property
 * @returns Card level (defaults to 1 if not found)
 */
export function getCardLevel(card: CardLike | null | undefined): number {
  if (!card) return 1;
  return card.data?.level ?? card.level ?? 1;
}

/**
 * Get the card's description
 * @param card - Card object with description property
 * @returns Card description (defaults to empty string if not found)
 */
export function getCardDescription(card: CardLike | null | undefined): string {
  if (!card) return '';
  return card.data?.description ?? card.data?.markdown ?? card.description ?? '';
}

/**
 * Get the card's type
 * @param card - Card object with type property
 * @returns Card type (defaults to empty string if not found)
 */
export function getCardType(card: CardLike | null | undefined): string {
  if (!card) return '';
  return card.data?.type ?? card.type ?? '';
}

/**
 * Get the card's domain
 * @param card - Card object with domain property
 * @returns Card domain (defaults to empty string if not found)
 */
export function getCardDomain(card: CardLike | null | undefined): string {
  if (!card) return '';
  return card.data?.domain ?? card.domain ?? '';
}

/**
 * Get the card's recall cost
 * @param card - Card object with recall_cost property
 * @returns Card recall cost (defaults to 0 if not found)
 */
export function getCardRecallCost(card: CardLike | null | undefined): number {
  if (!card) return 0;
  return card.data?.recall_cost ?? card.recall_cost ?? 0;
}

/**
 * Get the card's name
 * @param card - Card object with name property
 * @returns Card name (defaults to 'Unknown Card' if not found)
 */
export function getCardName(card: CardLike | null | undefined): string {
  if (!card) return 'Unknown Card';
  return card.data?.name ?? card.name ?? 'Unknown Card';
}

/**
 * Check if a card matches the given domain
 * @param card - Card object to check
 * @param domain - Domain to match against
 * @returns True if card belongs to the domain
 */
export function isCardInDomain(card: CardLike | null | undefined, domain: string): boolean {
  if (!card || !domain) return false;
  const cardDomain = getCardDomain(card);
  return cardDomain.trim().toLowerCase() === domain.trim().toLowerCase();
}

/**
 * Check if a card is available at a given level
 * @param card - Card object to check
 * @param characterLevel - Character's current level
 * @returns True if card level is at or below character level
 */
export function isCardAvailableAtLevel(card: CardLike | null | undefined, characterLevel: number): boolean {
  if (!card) return false;
  return getCardLevel(card) <= characterLevel;
}

/**
 * Filter cards by domain and level
 * @param cards - Array of card objects
 * @param domains - Array of domain names to filter by
 * @param maxLevel - Maximum card level to include
 * @returns Filtered array of cards
 */
export function filterCardsByDomainAndLevel(
  cards: CardLike[],
  domains: string[],
  maxLevel: number
): CardLike[] {
  return cards.filter(card => {
    const matchesDomain = domains.some(domain => isCardInDomain(card, domain));
    const matchesLevel = isCardAvailableAtLevel(card, maxLevel);
    return matchesDomain && matchesLevel;
  });
}

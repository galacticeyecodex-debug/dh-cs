/**
 * ICON UTILS
 * ----------------------------------------------------------------------------
 * Maps icon name strings to Lucide React component instances.
 * This allows storing icon preferences as strings in the database or store
 * while still using them as dynamic components.
 */

import {
    Heart,
    Flame,
    Zap,
    Droplet,
    Sparkles,
    Sun,
    Shield,
    BrickWall,
    Eye,
    Wind,
    Skull,
    Moon,
    type LucideIcon
} from 'lucide-react';

export type VitalId = 'hitPoints' | 'stress' | 'hope' | 'armor' | 'evasion' | 'fear';

export const ICON_MAP: Record<string, LucideIcon> = {
    'Heart': Heart,
    'Flame': Flame,
    'Zap': Zap,
    'Droplet': Droplet,
    'Sparkles': Sparkles,
    'Sun': Sun,
    'Shield': Shield,
    'BrickWall': BrickWall,
    'Eye': Eye,
    'Wind': Wind,
    'Skull': Skull,
    'Moon': Moon,
};

/**
 * Returns a LucideIcon component for a given name string.
 * Falls back to a default icon if not found.
 */
export function getIconByName(name: string, fallback: LucideIcon = Heart): LucideIcon {
    return ICON_MAP[name] || fallback;
}

export type VitalIconChoice = {
    id: string;
    name: string;
    icon: LucideIcon;
};

export const VITAL_ICON_OPTIONS: Record<string, VitalIconChoice[]> = {
    hitPoints: [
        { id: 'Heart', name: 'Heart', icon: Heart },
        { id: 'Flame', name: 'Flame', icon: Flame },
    ],
    stress: [
        { id: 'Zap', name: 'Zap', icon: Zap },
        { id: 'Droplet', name: 'Sweat', icon: Droplet },
    ],
    hope: [
        { id: 'Zap', name: 'Zap', icon: Zap },
        { id: 'Sparkles', name: 'Sparkles', icon: Sparkles },
    ],
    armor: [
        { id: 'Shield', name: 'Shield', icon: Shield },
        { id: 'BrickWall', name: 'Brick', icon: BrickWall },
    ],
    evasion: [
        { id: 'Eye', name: 'Awareness', icon: Eye },
        { id: 'Wind', name: 'Agility', icon: Wind },
    ],
    fear: [
        { id: 'Skull', name: 'Skull', icon: Skull },
        { id: 'Moon', name: 'Moon', icon: Moon },
    ],
};

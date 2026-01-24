/**
 * ICON UTILITIES
 * ----------------------------------------------------------------------------
 * Central icon registry and semantic mapping system for the application.
 * 
 * FUNCTIONALITY:
 * - Provides a single source of truth for all Lucide icons used (ICON_MAP).
 * - Defines semantic mappings (AppIcons) to decouple UI components from 
 *   specific icon implementations.
 * - Supports dynamic icon resolution based on user preferences (getIconByName).
 * - Harmonizes iconography across Character, GM, and Combat views.
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
    Settings,
    Crown,
    ArrowLeft,
    Activity,
    Map,
    Timer,
    Search,
    ChevronDown,
    ChevronUp,
    Target,
    Swords,
    X,
    RefreshCw,
    Info,
    StickyNote,
    TrendingUp,
    TrendingDown,
    Wand2,
    Brain,
    Megaphone,
    Bug,
    AlertCircle,
    Dices,
    Package,
    Plus,
    Gem,
    Backpack,
    FlaskConical,
    Sword,
    ArrowRightLeft,
    AlertTriangle,
    BookOpen,
    Lock,
    Check,
    Minus,
    ShieldOff,
    Users,
    Archive,
    Upload,
    Image as ImageIcon,
    LibraryBig,
    ScrollText,
    Dna,
    Star,
    CheckCircle2,
    Circle,
    RotateCcw,
    EyeOff,
    Footprints,
    PawPrint,
    Mountain,
    Droplets,
    Pencil,
    Trash2,
    LogOut,
    UserPlus,
    UserMinus,
    User,
    Grid,
    Book,
    Camera,
    Hash,
    Clock,
    Send,
    Layers,
    MoreHorizontal,
    Unlock,
    ChevronRight,
    type LucideIcon
} from 'lucide-react';

export type VitalId = 'hitPoints' | 'stress' | 'hope' | 'armor' | 'evasion' | 'fear';

/**
 * ICON_MAP
 * Central registry of all icons available for dynamic lookup.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
    // Vitals
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

    // UI Elements
    'Settings': Settings,
    'Trash': Trash2,
    'Pencil': Pencil,
    'Plus': Plus,
    'Minus': Minus,
    'Check': Check,
    'X': X,
    'Info': Info,
    'Search': Search,
    'ChevronDown': ChevronDown,
    'ChevronUp': ChevronUp,
    'ArrowLeft': ArrowLeft,
    'ArrowRightLeft': ArrowRightLeft,
    'Upload': Upload,
    'Image': ImageIcon,
    'Camera': Camera,
    'Grid': Grid,
    'Book': Book,
    'ScrollText': ScrollText,

    // Campaign & Social
    'Crown': Crown,
    'Users': Users,
    'User': User,
    'UserPlus': UserPlus,
    'LogOut': LogOut,
    'Map': Map,
    'Timer': Timer,
    'Megaphone': Megaphone,
    'StickyNote': StickyNote,
    'Send': Send,
    'UserMinus': UserMinus,
    'Unlock': Unlock,
    'Layers': Layers,
    'MoreHorizontal': MoreHorizontal,
    'ChevronRight': ChevronRight,

    // Combat & Action
    'Dices': Dices,
    'Swords': Swords,
    'Sword': Sword,
    'Target': Target,
    'Wand2': Wand2,
    'TrendingUp': TrendingUp,
    'TrendingDown': TrendingDown,

    // Inventory
    'Package': Package,
    'Gem': Gem,
    'Backpack': Backpack,
    'FlaskConical': FlaskConical,

    // Status & System
    'AlertCircle': AlertCircle,
    'AlertTriangle': AlertTriangle,
    'Bug': Bug,
    'Lock': Lock,
    'RefreshCw': RefreshCw,
    'Hash': Hash,
    'Clock': Clock,
    'RotateCcw': RotateCcw,
    'EyeOff': EyeOff,
};

/**
 * AppIcons
 * Semantic mapping for consistent icon usage across the app.
 */
export const AppIcons = {
    vitals: {
        hitPoints: Heart,
        stress: Zap,
        hope: Sparkles,
        armor: Shield,
        evasion: Eye,
        fear: Skull,
    },
    ui: {
        settings: Settings,
        delete: Trash2,
        edit: Pencil,
        add: Plus,
        remove: Minus,
        confirm: Check,
        close: X,
        info: Info,
        search: Search,
        expand: ChevronDown,
        collapse: ChevronUp,
        chevronRight: ChevronRight,
        back: ArrowLeft,
        swap: ArrowRightLeft,
        upload: Upload,
        image: ImageIcon,
        camera: Camera,
        dashboard: Grid,
        stats: User,
        lore: Book,
        notability: ScrollText,
        external: BookOpen,
        lock: Lock,
        visibility: Eye,
        visibilityOff: EyeOff,
        send: Send,
        playmat: Layers,
        more: MoreHorizontal,
        unlock: Unlock,
    },
    campaign: {
        gm: Crown,
        party: Users,
        player: User,
        companion: PawPrint,
        invite: UserPlus,
        kick: UserMinus,
        leave: LogOut,
        map: Map,
        timer: Timer,
        announce: Megaphone,
        note: StickyNote,
    },
    combat: {
        roll: Dices,
        navCombat: Swords,
        attack: Sword,
        weapon: Sword,
        target: Target,
        ability: Wand2,
        spellcast: Wand2,
        buff: TrendingUp,
        debuff: TrendingDown,
        proficiency: Star,
        activation: Zap,
        damage: Skull,
        duration: Clock,
    },
    inventory: {
        item: Package,
        valuable: Gem,
        gear: Backpack,
        consumable: FlaskConical,
    },
    system: {
        error: AlertCircle,
        warning: AlertTriangle,
        debug: Bug,
        secure: Lock,
        sync: RefreshCw,
        id: Hash,
    }
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

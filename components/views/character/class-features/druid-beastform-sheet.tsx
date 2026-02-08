'use client';

import React from 'react';
import { AppIcons } from '@/lib/icon-utils';
import { DruidBeastform } from '@/types/character';
import { toast } from 'sonner';
import clsx from 'clsx';
import { Z_INDEX } from '@/constants/z-index';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'; // Assuming this exists or using simple modal div if not
// Checking project structure: uses 'components/ui/sheet' or similar? 
// Project uses 'modals'. 'components/ui' might not exist or be Shadcn.
// I'll stick to a custom modal/sheet implementation similar to 'beastbound-companion-sheet.tsx' if possible, or a standard modal.
// 'beastbound-companion-sheet' uses a custom fixed overlay.
// I will implement a custom overlay here for consistency with the project style if I can't confirm 'Sheet'.
// I'll assume standard 'fixed inset-0' overlay.

// Hardcoded Beastform Data for now
const BEASTFORMS: Record<string, any[]> = {
    "1": [
        { name: "Agile Scout", trait: "Agility", bonus: "+1", evasion: "+2", attack: "Melee Agility d4 phy", benefits: ["deceive", "locate", "sneak"], feature: "Agile: Move Far silently. Fragile." },
        { name: "Household Friend", trait: "Instinct", bonus: "+1", evasion: "+2", attack: "Melee Instinct d6 phy", benefits: ["climb", "locate", "protect"], feature: "Companion: Help w/ d8. Fragile." },
        { name: "Nimble Grazer", trait: "Agility", bonus: "+1", evasion: "+3", attack: "Melee Agility d6 phy", benefits: ["leap", "sneak", "sprint"], feature: "Elusive Prey. Fragile." },
        { name: "Pack Predator", trait: "Strength", bonus: "+2", evasion: "+1", attack: "Melee Strength d8+2 phy", benefits: ["attack", "sprint", "track"], feature: "Pack Hunting." },
        { name: "Aquatic Scout", trait: "Agility", bonus: "+1", evasion: "+2", attack: "Melee Agility d4 phy", benefits: ["navigate", "sneak", "swim"], feature: "Aquatic. Fragile." },
        { name: "Stalking Arachnid", trait: "Finesse", bonus: "+1", evasion: "+2", attack: "Melee Finesse d6+1 phy", benefits: ["attack", "climb", "sneak"], feature: "Venomous Bite. Webslinger." },
        { name: "Mighty Strider", trait: "Agility", bonus: "+1", evasion: "+2", attack: "Melee Agility d8+1 phy", benefits: ["leap", "navigate", "sprint"], feature: "Carrier. Trample." }
    ],
    "2": [
        { name: "Armored Sentry", trait: "Strength", bonus: "+1", evasion: "+1", attack: "Melee Strength d8+2 phy", benefits: ["dig", "locate", "protect"], feature: "Armored Shell. Cannonball." },
        { name: "Powerful Beast", trait: "Strength", bonus: "+3", evasion: "+1", attack: "Melee Strength d10+4 phy", benefits: ["navigate", "protect", "scare"], feature: "Rampage. Thick Hide." },
        { name: "Striking Serpent", trait: "Finesse", bonus: "+1", evasion: "+2", attack: "Very Close Finesse d8+4 phy", benefits: ["climb", "deceive", "sprint"], feature: "Venomous Strike. Warning Hiss." },
        { name: "Pouncing Predator", trait: "Instinct", bonus: "+1", evasion: "+3", attack: "Melee Instinct d8+6 phy", benefits: ["attack", "climb", "sneak"], feature: "Fleet. Takedown." },
        { name: "Winged Beast", trait: "Finesse", bonus: "+1", evasion: "+3", attack: "Melee Finesse d4+2 phy", benefits: ["deceive", "locate", "scare"], feature: "Bird’s-Eye View. Hollow Bones." }
    ],
    "3": [
        { name: "Great Predator", trait: "Strength", bonus: "+2", evasion: "+2", attack: "Melee Strength d12+8 phy", benefits: ["attack", "sneak", "sprint"], feature: "Carrier. Vicious Maul." },
        { name: "Mighty Lizard", trait: "Instinct", bonus: "+2", evasion: "+1", attack: "Melee Instinct d10+7 phy", benefits: ["attack", "sneak", "track"], feature: "Physical Defense. Snapping Strike." },
        { name: "Great Winged Beast", trait: "Finesse", bonus: "+2", evasion: "+3", attack: "Melee Finesse d8+6 phy", benefits: ["deceive", "distract", "locate"], feature: "Bird’s-Eye View. Carrier." },
        { name: "Aquatic Predator", trait: "Agility", bonus: "+2", evasion: "+4", attack: "Melee Agility d10+6 phy", benefits: ["attack", "swim", "track"], feature: "Aquatic. Vicious Maul." },
        { name: "Legendary Beast", trait: "Any", bonus: "+1", evasion: "+2", attack: "Variable +6 Dmg", benefits: ["Previous Form"], feature: "Evolved: Larger version of Tier 1." }
    ],
    "4": [
        { name: "Massive Behemoth", trait: "Strength", bonus: "+3", evasion: "+1", attack: "Melee Strength d12+12 phy", benefits: ["locate", "protect", "scare", "sprint"], feature: "Carrier. Demolish. Undaunted." },
        { name: "Terrible Lizard", trait: "Strength", bonus: "+3", evasion: "+2", attack: "Melee Strength d12+10 phy", benefits: ["attack", "deceive", "scare", "track"], feature: "Devastating Strikes. Massive Stride." },
        { name: "Mythic Aerial Hunter", trait: "Finesse", bonus: "+3", evasion: "+4", attack: "Melee Finesse d10+11 phy", benefits: ["attack", "deceive", "locate", "navigate"], feature: "Carrier. Deadly Raptor." },
        { name: "Epic Aquatic Beast", trait: "Agility", bonus: "+3", evasion: "+3", attack: "Melee Agility d10+10 phy", benefits: ["locate", "protect", "scare", "track"], feature: "Ocean Master. Unyielding." },
        { name: "Mythic Beast", trait: "Any", bonus: "+2/3", evasion: "+3", attack: "Variable +9 Dmg", benefits: ["Previous Form"], feature: "Evolved: Larger version of T1/T2." }
    ]
    // Add Tier 3/4 if needed, focusing on 1/2 for typical usage
};

interface BeastformSheetProps {
    isOpen: boolean;
    onClose: () => void;
    beastform: DruidBeastform | undefined;
    characterLevel: number;
    onUpdateBeastform: (data: DruidBeastform) => void;
}

export default function BeastformSheet({
    isOpen,
    onClose,
    beastform,
    characterLevel,
    onUpdateBeastform,
}: BeastformSheetProps) {
    const [selectedTier, setSelectedTier] = React.useState<string>("1");
    const maxTier = characterLevel >= 8 ? 4 : characterLevel >= 5 ? 3 : characterLevel >= 2 ? 2 : 1;
    const tiers = Array.from({ length: maxTier }, (_, i) => (i + 1).toString());

    if (!isOpen) return null;

    // Logic to handle selection
    const handleSelect = (formName: string) => {
        onUpdateBeastform({ is_active: true, active_form: formName });
        toast.success(`Transformed into ${formName}!`);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 flex items-end sm:items-center justify-center pointer-events-none"
            style={{ zIndex: Z_INDEX.MODAL }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

            {/* Content */}
            <div className="bg-dagger-panel w-full sm:w-[500px] h-[85vh] sm:h-[80vh] rounded-t-xl sm:rounded-xl border border-white/10 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                            <AppIcons.ui.beastform size={20} className="text-green-400" /> Beastform Options
                        </h2>
                        <p className="text-xs text-gray-400">Choose a form to transform</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                        <AppIcons.ui.close size={20} />
                    </button>
                </div>

                {/* Tier Selection */}
                <div className="flex p-2 gap-2 overflow-x-auto border-b border-white/10">
                    {tiers.map(tier => (
                        <button
                            key={tier}
                            onClick={() => setSelectedTier(tier)}
                            className={clsx(
                                "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                                selectedTier === tier
                                    ? "bg-green-500 text-black"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            Tier {tier}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {BEASTFORMS[selectedTier]?.map((form, idx) => (
                        <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-3 hover:border-green-500/30 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-green-400">{form.name}</h3>
                                <button
                                    onClick={() => handleSelect(form.name)}
                                    className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded hover:bg-green-500 hover:text-black transition-colors"
                                >
                                    Transform
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-black/30 p-2 rounded flex items-center gap-2 border border-white/5">
                                    <AppIcons.combat.attack size={14} className="text-gray-500" />
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Attack</div>
                                        <div className="text-xs font-bold text-white">{form.attack}</div>
                                    </div>
                                </div>
                                <div className="bg-black/30 p-2 rounded flex items-center gap-2 border border-white/5">
                                    <AppIcons.ui.visibility size={14} className="text-gray-500" />
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase">Stats</div>
                                        <div className="text-xs font-bold text-white">Eva {form.evasion} • {form.trait} {form.bonus}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-300 leading-relaxed">
                                <strong className="text-gray-500">Feature:</strong> {form.feature}
                            </div>
                        </div>
                    )) || (
                            <div className="text-center text-gray-500 py-10">No forms data for this tier.</div>
                        )}
                </div>
            </div>
        </div>
    );
}

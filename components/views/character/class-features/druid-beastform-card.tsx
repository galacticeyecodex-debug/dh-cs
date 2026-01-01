'use client';

import React from 'react';
import { PawPrint, Info, X } from 'lucide-react';
import { DruidBeastform } from '@/types/character';
import { toast } from 'sonner';
import clsx from 'clsx';
import BeastformSheet from './druid-beastform-sheet';

interface BeastformCardProps {
    beastform: DruidBeastform | undefined;
    characterLevel: number;
    onUpdateBeastform: (data: DruidBeastform) => void;
}

export default function BeastformCard({
    beastform,
    characterLevel,
    onUpdateBeastform,
}: BeastformCardProps) {
    const [showSheet, setShowSheet] = React.useState(false);
    const isActive = beastform?.is_active || false;
    const activeForm = beastform?.active_form || 'Unknown Form';

    const handleDrop = () => {
        onUpdateBeastform({ is_active: false, active_form: '' });
        toast.success('Dropped out of Beastform.');
    };

    return (
        <>
            <div className={clsx(
                "bg-dagger-panel border rounded-xl p-4 relative overflow-hidden transition-colors",
                isActive ? "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "border-dagger-gold/30"
            )}>
                <div className={clsx("absolute top-0 left-0 w-1 h-full", isActive ? "bg-green-500" : "bg-dagger-gold")}></div>

                <div className="flex items-center justify-between mb-3">
                    <h4 className={clsx("font-serif font-bold flex items-center gap-2", isActive ? "text-green-400" : "text-gray-200")}>
                        <PawPrint size={14} /> Beastform
                    </h4>
                </div>

                {isActive ? (
                    <div className="space-y-3">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className="text-xs text-green-400 font-bold uppercase mb-1">Active Form</div>
                            <div className="text-lg font-serif font-bold text-white leading-tight">{activeForm}</div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSheet(true)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded transition-colors"
                            >
                                View Stats
                            </button>
                            <button
                                onClick={handleDrop}
                                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded transition-colors"
                            >
                                Drop Form
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowSheet(true)}
                        className="w-full py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <PawPrint size={16} /> Transform
                    </button>
                )}
            </div>

            <BeastformSheet
                isOpen={showSheet}
                onClose={() => setShowSheet(false)}
                beastform={beastform}
                characterLevel={characterLevel}
                onUpdateBeastform={onUpdateBeastform}
            />
        </>
    );
}

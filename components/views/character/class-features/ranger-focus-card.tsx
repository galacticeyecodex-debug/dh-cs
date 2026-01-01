'use client';

import ReactMarkdown from 'react-markdown';
import React from 'react';
import { Target, Info, X, Check } from 'lucide-react';
import { RangerFocus } from '@/types/character';
import { toast } from 'sonner';
import clsx from 'clsx';

interface RangerFocusCardProps {
    rangerFocus: RangerFocus | undefined;
    description: string;
    onUpdateRangerFocus: (data: RangerFocus) => void;
}

export default function RangerFocusCard({
    rangerFocus,
    description,
    onUpdateRangerFocus,
}: RangerFocusCardProps) {
    const [showInfo, setShowInfo] = React.useState(false);
    const [targetName, setTargetName] = React.useState(rangerFocus?.target_name || '');
    const isActive = rangerFocus?.is_active || false;

    // Sync prop changes to local state if external update happens (though simplistic)
    React.useEffect(() => {
        if (rangerFocus?.target_name) {
            setTargetName(rangerFocus.target_name);
        }
    }, [rangerFocus?.target_name]);

    const handleActivate = () => {
        if (!targetName.trim()) {
            toast.error('Enter a target name first.');
            return;
        }
        onUpdateRangerFocus({ is_active: true, target_name: targetName });
        toast.success('Ranger Focus active!');
    };

    const handleDeactivate = () => {
        onUpdateRangerFocus({ is_active: false, target_name: '' });
        setTargetName('');
        toast.info('Focus cleared.');
    };

    return (
        <div className={clsx(
            "bg-dagger-panel border rounded-xl p-4 relative overflow-hidden transition-colors",
            isActive ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-dagger-gold/30"
        )}>
            {/* Accent */}
            <div className={clsx("absolute top-0 left-0 w-1 h-full", isActive ? "bg-emerald-500" : "bg-dagger-gold")}></div>

            <div className="flex items-center justify-between mb-3">
                <h4 className={clsx("font-serif font-bold flex items-center gap-2", isActive ? "text-emerald-400" : "text-gray-200")}>
                    <Target size={14} /> Ranger&apos;s Focus
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <Info size={14} className="text-gray-400" />
                </button>
            </div>

            {showInfo && (
                <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-400 space-y-1">
                    <ReactMarkdown
                        components={{
                            strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        }}
                    >
                        {description}
                    </ReactMarkdown>
                </div>
            )}

            <div className="space-y-3">
                {!isActive ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={targetName}
                            onChange={(e) => setTargetName(e.target.value)}
                            placeholder="Target Name..."
                            className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                        <button
                            onClick={handleActivate}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                        >
                            <Check size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                        <div>
                            <div className="text-[10px] text-emerald-500 uppercase font-bold">Current Target</div>
                            <div className="text-sm font-bold text-white max-w-[150px] truncate">{rangerFocus?.target_name}</div>
                        </div>
                        <button
                            onClick={handleDeactivate}
                            className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                            title="Clear Focus"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

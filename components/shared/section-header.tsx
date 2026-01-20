import React from 'react';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    title: string | React.ReactNode;
    isVisible: boolean;
    onToggle: () => void;
    onManage?: () => void;
    manageLabel?: string;
    className?: string;
    manageIcon?: React.ReactNode;
}

export default function SectionHeader({
    title,
    isVisible,
    onToggle,
    onManage,
    manageLabel = 'Manage',
    className,
    manageIcon
}: SectionHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between", className)}>
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                {title}
            </h3>
            <div className="flex items-center gap-2">
                {onManage && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onManage();
                        }}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                        {manageIcon || <Settings size={12} />} {manageLabel}
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-colors px-1.5 py-0.5 rounded"
                    aria-label={isVisible ? typeof title === 'string' ? `Hide ${title}` : 'Hide section' : typeof title === 'string' ? `Show ${title}` : 'Show section'}
                >
                    {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                    {isVisible ? 'Hide' : 'Show'}
                </button>
            </div>
        </div>
    );
}

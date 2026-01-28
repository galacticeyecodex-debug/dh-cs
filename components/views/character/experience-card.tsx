'use client';

import React from 'react';
import clsx from 'clsx';
import { PANEL } from '@/lib/styles';

interface ExperienceCardProps {
    name: string;
    value: number;
    isFlat?: boolean;
    isNested?: boolean;
    className?: string;
}

const ExperienceCard = React.memo(function ExperienceCard({
    name,
    value,
    isFlat = false,
    isNested = false,
    className
}: ExperienceCardProps) {
    return (
        <div className={clsx(
            "relative flex rounded-lg overflow-hidden transition-colors group",
            isFlat ? "bg-transparent" : (isNested ? "bg-white/5 border-white/5" : PANEL.base),
            !isFlat && "border",
            "hover:border-white/20",
            className
        )}>
            <div className="flex-1 p-2 sm:p-3 flex items-center justify-start text-left">
                <span className="capitalize font-medium text-gray-300 group-hover:text-white transition-colors text-sm sm:text-base">
                    {name}
                </span>
            </div>
            <div className={clsx(
                "p-2 sm:p-3 min-w-[2.5rem] sm:min-w-[3rem] flex items-center justify-center font-bold text-lg sm:text-xl border-l text-white transition-colors",
                isFlat ? "border-transparent" : "border-white/5"
            )}>
                {value >= 0 ? `+${value}` : value}
            </div>
        </div>
    );
});

export default ExperienceCard;

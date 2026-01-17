'use client';

import { useCharacterStore } from '@/store/character-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Minus, Plus, Skull } from 'lucide-react';
import { toast } from 'sonner';

interface FearTrackerProps {
    campaignId: string;
    currentFear: number;
    maxFear: number;
}

export function FearTracker({ campaignId, currentFear, maxFear }: FearTrackerProps) {
    const { updateFear } = useCharacterStore();

    const handleFearChange = async (change: number) => {
        try {
            await updateFear(campaignId, change);
            const action = change > 0 ? 'gained' : 'spent';
            toast.success(`Fear ${action}: ${Math.abs(change)}`);
        } catch (error) {
            // Error toast already shown in store
        }
    };

    const percentage = maxFear > 0 ? (currentFear / maxFear) * 100 : 0;

    return (
        <Card className="p-6 bg-gradient-to-r from-red-950/20 to-purple-950/20 border-red-900/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Skull className="w-8 h-8 text-red-500" aria-hidden="true" />
                    <div>
                        <h2 className="text-xl font-bold">Fear</h2>
                        <p className="text-sm text-muted-foreground">
                            GM-controlled resource, visible to all players
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFearChange(-1)}
                        disabled={currentFear === 0}
                        aria-label="Spend 1 Fear"
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold min-w-[80px] text-center tabular-nums">
                        {currentFear}/{maxFear}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFearChange(1)}
                        disabled={currentFear >= maxFear}
                        aria-label="Gain 1 Fear"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-6 bg-background rounded-full overflow-hidden border border-border">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-purple-600 transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {currentFear > 0 && `${Math.round(percentage)}%`}
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFearChange(-5)}
                    disabled={currentFear < 5}
                    className="text-xs"
                >
                    -5
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFearChange(-3)}
                    disabled={currentFear < 3}
                    className="text-xs"
                >
                    -3
                </Button>
                <div className="flex-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFearChange(3)}
                    disabled={currentFear >= maxFear - 2}
                    className="text-xs"
                >
                    +3
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFearChange(5)}
                    disabled={currentFear >= maxFear - 4}
                    className="text-xs"
                >
                    +5
                </Button>
            </div>
        </Card>
    );
}

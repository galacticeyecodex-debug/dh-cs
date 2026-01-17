'use client';

/**
 * My Friend Code Component
 * Displays the user's friend code with copy functionality
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MyFriendCodeProps {
    code: string | null;
    onRefresh?: () => void;
}

export function MyFriendCode({ code, onRefresh }: MyFriendCodeProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!code) return;

        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success('Friend code copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    if (!code) {
        return (
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">Loading your friend code...</p>
            </div>
        );
    }

    // Format code with a dash in the middle for readability
    const formattedCode = code.length === 8
        ? `${code.slice(0, 4)}-${code.slice(4)}`
        : code;

    return (
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Your Friend Code
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                        {formattedCode}
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="h-9 w-9"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            className="h-9 w-9"
                            title="Generate new code"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Share this code with friends so they can add you.
            </p>
        </div>
    );
}

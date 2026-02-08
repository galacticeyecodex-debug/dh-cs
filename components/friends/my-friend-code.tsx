'use client';

/**
 * My Friend Code Component
 * Displays the user's friend code with copy functionality
 */

import { useState } from 'react';
import { Copy, Check, RefreshCw } from '@/lib/icon-utils';
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
            <div className="p-4 rounded-lg bg-white/5 border border-dashed border-white/10 text-center">
                <p className="text-sm text-gray-400">Loading your friend code...</p>
            </div>
        );
    }

    // Format code with a dash in the middle for readability
    const formattedCode = code.length === 8
        ? `${code.slice(0, 4)}-${code.slice(4)}`
        : code;

    return (
        <div className="p-4 rounded-lg bg-dagger-gold/10 border border-dagger-gold/30">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        Your Friend Code
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-dagger-gold">
                        {formattedCode}
                    </p>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={handleCopy}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Copy code"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-400" />
                        ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                        )}
                    </button>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            title="Generate new code"
                        >
                            <RefreshCw className="h-4 w-4 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                Share this code with friends so they can add you.
            </p>
        </div>
    );
}

'use client';

/**
 * PROMPT MODAL COMPONENT
 * ----------------------------------------------------------------------------
 * A styled modal component that replaces browser prompt() for collecting
 * user text input. Provides a consistent, mobile-friendly experience.
 * 
 * USAGE:
 * ```tsx
 * <PromptModal
 *   isOpen={showPrompt}
 *   onClose={() => setShowPrompt(false)}
 *   title="Add Reason"
 *   description="What caused this change?"
 *   placeholder="Enter reason..."
 *   onSubmit={(value) => handleSubmit(value)}
 * />
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    placeholder?: string;
    submitLabel?: string;
    cancelLabel?: string;
    onSubmit: (value: string) => void;
    /** Initial value for the input */
    defaultValue?: string;
    /** Whether to require non-empty input */
    required?: boolean;
}

export function PromptModal({
    isOpen,
    onClose,
    title,
    description,
    placeholder = "Enter value...",
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    onSubmit,
    defaultValue = "",
    required = true
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            // Small delay to ensure modal is rendered
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, defaultValue]);

    const handleSubmit = () => {
        if (required && !value.trim()) return;
        onSubmit(value.trim());
        setValue("");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                className="bg-dagger-panel border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Description */}
                {description && (
                    <p className="text-sm text-gray-400 mb-4">{description}</p>
                )}

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-dagger-gold focus:outline-none transition-colors"
                />

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={required && !value.trim()}
                        className="flex-1 py-2.5 bg-dagger-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PromptModal;

'use client';

/**
 * SRD INFO SHEET COMPONENT
 * ----------------------------------------------------------------------------
 * A bottom-sheet modal for displaying SRD (System Reference Document) rule content.
 *
 * FUNCTIONALITY:
 * - Fetches SRD rule content by key using the useSRDRule hook
 * - Displays formatted markdown content with proper styling
 * - Shows loading and error states
 * - Closes on backdrop click or handle drag
 * - Uses React Portal to render outside DOM hierarchy for consistent styling
 *
 * USAGE:
 * <SRDInfoSheet
 *   isOpen={showSheet}
 *   onClose={() => setShowSheet(false)}
 *   ruleKey="combat.attackRolls"
 * />
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2 } from '@/lib/icon-utils';
import { useSRDRule } from '@/hooks/useSRDRule';
import { MarkdownText } from '@/components/shared/markdown-text';
import { Z_INDEX } from '@/constants/z-index';

interface SRDInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ruleKey: string;
  title?: string; // Optional custom title to display instead of rule.title
}


export default function SRDInfoSheet({ isOpen, onClose, ruleKey, title }: SRDInfoSheetProps) {
  const { rule, loading, error } = useSRDRule(ruleKey);
  const [mounted, setMounted] = useState(false);

  // Portal needs to wait for client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or before hydration
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        style={{ zIndex: Z_INDEX.DRAWER }}
                      />
          
                      {/* Sheet */}
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col font-sans normal-case"
                        style={{ zIndex: Z_INDEX.DRAWER }}
                      >            {/* Handle */}
            <div className="flex justify-center p-3 cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-dagger-gold/10 rounded-lg">
                  <BookOpen size={20} className="text-dagger-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white">
                    {loading ? 'Loading...' : (title || rule?.title || 'Game Rules')}
                  </h2>
                  {rule?.source_file && (
                    <p className="text-xs text-gray-500 font-sans normal-case">
                      Source: {rule.source_file}
                      {rule.source_section && ` - ${rule.source_section}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 font-sans normal-case">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-dagger-gold" />
                </div>
              )}

              {error && (
                <div className="text-red-400 text-center py-8">
                  Failed to load rule content.
                </div>
              )}

              {!loading && !error && rule && (
                <div className="text-gray-300 leading-relaxed">
                  <MarkdownText>{rule.content}</MarkdownText>
                </div>
              )}

              {!loading && !error && !rule && (
                <div className="text-gray-500 text-center py-8 italic">
                  Rule content not found.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/20">
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

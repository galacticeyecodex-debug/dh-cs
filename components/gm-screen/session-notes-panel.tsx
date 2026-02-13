'use client';

/**
 * SESSION NOTES PANEL
 * ----------------------------------------------------------------------------
 * A slide-over panel for GM session notes. Quick capture during gameplay.
 */

import { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AppIcons } from '@/lib/icon-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Z_INDEX } from '@/constants/z-index';

interface SessionNotesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
}

export function SessionNotesPanel({ isOpen, onClose, campaignId }: SessionNotesPanelProps) {
    const { sessionNotes, addSessionNote, updateSessionNote, deleteSessionNote } = useCharacterStore();
    const [newNote, setNewNote] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleAdd = async () => {
        if (!newNote.trim()) return;
        await addSessionNote(campaignId, newNote.trim());
        setNewNote('');
    };

    const handleStartEdit = (id: string, content: string) => {
        setEditingId(id);
        setEditContent(content);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editContent.trim()) return;
        await updateSessionNote(campaignId, editingId, editContent.trim());
        setEditingId(null);
        setEditContent('');
    };

    const handleDelete = async (noteId: string) => {
        await deleteSessionNote(campaignId, noteId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60"
                        style={{ zIndex: Z_INDEX.MODAL }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-dagger-dark border-l border-white/10 shadow-2xl flex flex-col"
                        style={{ zIndex: Z_INDEX.MODAL + 1 }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <AppIcons.campaign.note size={20} className="text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-serif font-bold text-white">Session Notes</h2>
                                    <p className="text-xs text-gray-500">{sessionNotes.length} notes</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <AppIcons.ui.close size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* New Note Input */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex gap-2">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            handleAdd();
                                        }
                                    }}
                                    placeholder="Quick note... (Cmd+Enter to save)"
                                    rows={2}
                                    className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!newNote.trim()}
                                    className="px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg text-sm transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {sessionNotes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <AppIcons.campaign.note size={40} className="text-gray-600 mb-3" />
                                    <p className="text-gray-400 text-sm">No notes yet</p>
                                    <p className="text-gray-600 text-xs mt-1">Capture thoughts, NPC quotes, plot points...</p>
                                </div>
                            ) : (
                                sessionNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="bg-black/20 border border-white/5 rounded-lg p-3 group"
                                    >
                                        {editingId === note.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-black/30 border border-amber-500/30 rounded-lg text-white text-sm focus:outline-none resize-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="px-3 py-1 bg-amber-500 text-black font-bold rounded text-xs"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-3 py-1 bg-white/10 text-gray-300 rounded text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-600">
                                                        {new Date(note.created_at).toLocaleString([], {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleStartEdit(note.id, note.content)}
                                                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                                        >
                                                            <AppIcons.ui.edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(note.id)}
                                                            className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <AppIcons.ui.delete size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

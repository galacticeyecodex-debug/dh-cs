'use client';

import React, { useState } from 'react';
import { JournalNote, CreateNoteInput } from '@/types/journal';
import { Plus, Trash2, ArrowLeft, Save, FileText, Calendar } from '@/lib/icon-utils';
import clsx from 'clsx';

interface TextNotesPanelProps {
    notes: JournalNote[];
    onCreate: (input: CreateNoteInput) => void;
    onUpdate: (id: string, updates: Partial<CreateNoteInput>) => void;
    onDelete: (id: string) => void;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function TextNotesPanel({ notes, onCreate, onUpdate, onDelete }: TextNotesPanelProps) {
    const [mode, setMode] = useState<ViewMode>('list');
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateNoteInput>({ title: '', content: '' });

    const handleCreateStart = () => {
        setFormData({ title: '', content: '' });
        setMode('create');
    };

    const handleEditStart = (note: JournalNote) => {
        setFormData({ title: note.title, content: note.content });
        setSelectedNoteId(note.id);
        setMode('edit');
    };

    const handleBack = () => {
        setMode('list');
        setSelectedNoteId(null);
        setFormData({ title: '', content: '' });
    };

    const handleSave = () => {
        if (!formData.title.trim() && !formData.content.trim()) return;

        if (mode === 'create') {
            onCreate({
                title: formData.title || 'Untitled Note',
                content: formData.content
            });
        } else if (mode === 'edit' && selectedNoteId) {
            onUpdate(selectedNoteId, {
                title: formData.title || 'Untitled Note',
                content: formData.content
            });
        }
        handleBack();
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this note?')) {
            onDelete(id);
            if (selectedNoteId === id) {
                handleBack();
            }
        }
    };

    // Formatter for dates
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (mode === 'list') {
        const sortedNotes = [...notes].sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        return (
            <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">My Notes</h2>
                    <button
                        onClick={handleCreateStart}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-dagger-gold/10 text-dagger-gold hover:bg-dagger-gold/20 transition-colors"
                    >
                        <Plus size={16} />
                        New Note
                    </button>
                </div>

                {sortedNotes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No notes yet. Start writing!</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {sortedNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => handleEditStart(note)}
                                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-dagger-gold/50 transition-all cursor-pointer relative"
                            >
                                <div className="pr-8">
                                    <h3 className="font-medium text-white mb-2 truncate">
                                        {note.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-3 mb-3 h-[4.5em]">
                                        {note.content || <span className="italic opacity-50">No content</span>}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar size={12} />
                                        <span>{formatDate(note.updated_at)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, note.id)}
                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                    title="Delete Note"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl flex flex-col h-[600px] overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dagger-gold text-black font-semibold hover:bg-dagger-gold/90 transition-colors"
                >
                    <Save size={18} />
                    Save Note
                </button>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Note Title"
                    className="bg-transparent border-none text-2xl font-bold text-white placeholder-gray-500 focus:ring-0 px-0"
                />
                <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note here..."
                    className="flex-1 bg-transparent border-none text-gray-300 resize-none focus:ring-0 px-0 leading-relaxed text-lg"
                />
            </div>
        </div>
    );
}

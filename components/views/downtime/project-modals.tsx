'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle } from '@/lib/icon-utils';
import { clsx } from 'clsx';
import { Project, CreateProjectInput, ProjectType } from '@/types/downtime';
import { Z_INDEX } from '@/constants/z-index';

// ============================================================================
// SHARED MODAL COMPONENT
// ============================================================================

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: Z_INDEX.MODAL }}
        >
            <div className="w-full max-w-lg bg-dagger-panel border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-serif font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// PROJECT FORM MODAL (Create / Edit)
// ============================================================================

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProjectInput) => Promise<any>;
    initialData?: Project;
}

export function ProjectFormModal({ isOpen, onClose, onSubmit, initialData }: ProjectFormModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [clockSize, setClockSize] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || '');
                setClockSize(initialData.countdown_total);
            } else {
                setName('');
                setDescription('');
                setClockSize(4);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                name,
                description,
                countdown_total: clockSize,
                type: initialData?.type || 'generic',
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Project' : 'New Project'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Project Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Researching the Obelisk"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 focus:ring-1 focus:ring-dagger-gold/50"
                        autoFocus
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Description <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Details about what you are trying to achieve..."
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-dagger-gold/50 focus:ring-1 focus:ring-dagger-gold/50 resize-none"
                    />
                </div>

                {/* Clock Size Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Complexity (Clock Size)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[4, 6, 8, 12].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setClockSize(size)}
                                className={clsx(
                                    'flex flex-col items-center justify-center p-3 rounded-lg border transition-all',
                                    clockSize === size
                                        ? 'bg-dagger-gold/10 border-dagger-gold text-white shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                )}
                            >
                                <Clock size={20} className={clockSize === size ? 'text-dagger-gold' : 'text-gray-500'} />
                                <span className="font-bold mt-1">{size}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 mt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim() || isSubmitting}
                        className="px-6 py-2 rounded-lg bg-dagger-gold text-black font-semibold hover:bg-dagger-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Project'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ============================================================================
// WORK ON PROJECT MODAL (Selection)
// ============================================================================

interface WorkOnProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onSelect: (projectId: string) => void;
}

export function WorkOnProjectModal({ isOpen, onClose, projects, onSelect }: WorkOnProjectModalProps) {
    const activeProjects = projects.filter(p => !p.completed);

    const handleSelect = (id: string) => {
        onSelect(id);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Work on a Project"
        >
            <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                    Select a project to make progress on. This will mark 1 segment on the project&apos;s clock.
                </p>

                {activeProjects.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <AlertCircle className="mx-auto text-gray-500 mb-2" size={24} />
                        <p className="text-gray-400 font-medium">No active projects</p>
                        <p className="text-xs text-gray-600 mt-1">Create a new project first</p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {activeProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => handleSelect(project.id)}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                            >
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-dagger-gold transition-colors">
                                        {project.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: project.countdown_total }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        'w-2 h-2 rounded-full',
                                                        i < project.countdown_current
                                                            ? 'bg-dagger-gold/50'
                                                            : 'bg-white/10'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {project.countdown_current}/{project.countdown_total}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 rounded-full bg-dagger-gold/10 text-dagger-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Clock size={16} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

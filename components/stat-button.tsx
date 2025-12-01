'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import clsx from 'clsx';

interface StatButtonProps {
  label: string;
  value: number;
}

export default function StatButton({ label, value }: StatButtonProps) {
  const { prepareRoll } = useCharacterStore(); // Call from store directly
  
  return (
    <button 
      type="button"
      onClick={() => prepareRoll(label, value)}
      className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 flex items-center justify-between transition-colors group"
    >
      <span className="capitalize font-medium text-gray-300 group-hover:text-white">{label}</span>
      <span className="text-xl font-bold text-dagger-gold">{value >= 0 ? `+${value}` : value}</span>
    </button>
  );
}
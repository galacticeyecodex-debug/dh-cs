import React, { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import Image from 'next/image';
import { getSystemModifiers } from '@/lib/utils';
import StatButton from '@/components/stat-button';
import CommonVitalsDisplay from '@/components/common-vitals-display';
import ExperienceSheet from '../experience-sheet';
import { Settings, Grid, Book, Activity, Camera, Hash } from 'lucide-react';
import clsx from 'clsx';

export default function CharacterView() {
  const { character, updateModifiers, updateExperiences } = useCharacterStore();
  const [isExperienceSheetOpen, setIsExperienceSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'gallery' | 'lore'>('stats');

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  // Helper to calculate totals and combine modifiers for Traits
  const getStatDetails = (stat: string, base: number) => {
    const systemMods = getSystemModifiers(character, stat);
    const userMods = character.modifiers?.[stat] || [];
    const allMods = [...systemMods, ...userMods];
    const uniqueMods = Array.from(new Map(allMods.map(mod => [mod.id, mod])).values());
    const total = base + uniqueMods.reduce((acc, mod) => acc + mod.value, 0);
    return { total, allMods: uniqueMods };
  };

  return (
    <div className="pb-24">
      {/* Social Profile Header */}
      <div className="relative w-full h-48 bg-gray-900 overflow-hidden">
        {/* Banner Background (Blurred Character Image or Default Pattern) */}
        <div className="absolute inset-0 opacity-50">
           {character.image_url ? (
            <Image 
              src={character.image_url} 
              alt="Background" 
              fill
              className="object-cover blur-md scale-110" 
            />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black" />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dagger-dark via-transparent to-transparent" />
        
        {/* Profile Avatar & Basic Info */}
        <div className="absolute bottom-0 left-0 w-full p-4 flex items-end gap-4">
          <div className="w-24 h-24 bg-gray-800 rounded-full p-1 border-4 border-dagger-dark shadow-xl flex-shrink-0 relative group cursor-pointer">
             <div className="w-full h-full rounded-full overflow-hidden relative">
                {character.image_url ? (
                  <Image 
                    src={character.image_url} 
                    alt={character.name} 
                    width={96} 
                    height={96} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-dagger-gold text-black">
                    {character.name[0]}
                  </div>
                )}
             </div>
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
               <Camera className="text-white" size={20} />
             </div>
          </div>
          
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white drop-shadow-md">{character.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
               <span className="text-xs font-bold bg-white/20 text-white backdrop-blur-md px-2 py-0.5 rounded-full">
                 Lvl {character.level} {character.class_id}
               </span>
               <span className="text-xs bg-black/40 text-gray-300 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                 {character.ancestry}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Control (Sticky Tab Bar) */}
      <div className="sticky top-0 z-10 bg-dagger-dark/95 backdrop-blur border-b border-white/10 px-4 py-2 flex justify-between items-center shadow-sm">
        <div className="flex p-1 bg-white/5 rounded-lg w-full">
          <button 
            onClick={() => setActiveTab('stats')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'stats' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Activity size={14} /> Stats
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'gallery' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Grid size={14} /> Gallery
          </button>
          <button 
            onClick={() => setActiveTab('lore')}
            className={clsx(
              "flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              activeTab === 'lore' ? "bg-dagger-gold text-black shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Book size={14} /> Lore
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Vitals Grid */}
            <CommonVitalsDisplay character={character} />

            {/* Stats Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(character.stats).map(([key, value]) => {
                  const { total, allMods } = getStatDetails(key, value); 
                  return (
                    <StatButton 
                      key={key} 
                      label={key} 
                      value={total} 
                      baseValue={value}
                      modifiers={allMods}
                      onUpdateModifiers={(mods) => updateModifiers(key, mods)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Experiences Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Experiences</h3>
                <button 
                  onClick={() => setIsExperienceSheetOpen(true)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <Settings size={12} /> Manage
                </button>
              </div>
              
              <div className="space-y-2">
                {character.experiences && character.experiences.length > 0 ? (
                  character.experiences.map((exp, index) => (
                    <div key={index} className="flex bg-white/5 border border-white/5 rounded-lg overflow-hidden">
                      <div className="flex-1 p-3 flex items-center justify-start text-left">
                        <span className="capitalize font-medium text-gray-300">{exp.name}</span>
                      </div>
                      <div className="p-3 min-w-[3rem] flex items-center justify-center font-bold text-xl border-l border-white/5 text-white">
                        {exp.value >= 0 ? `+${exp.value}` : exp.value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div 
                    onClick={() => setIsExperienceSheetOpen(true)}
                    className="text-gray-500 text-sm italic p-4 border border-dashed border-white/10 rounded-lg text-center cursor-pointer hover:bg-white/5"
                  >
                    No experiences recorded. Tap to add.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 gap-2">
               <Camera size={32} />
               <p className="text-sm font-medium">No media uploaded yet.</p>
               <button className="mt-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
                 Upload Concept Art
               </button>
            </div>
            {/* Mock Masonry Layout */}
            <div className="columns-2 gap-4 space-y-4">
               <div className="bg-gray-800 rounded-lg aspect-[3/4] w-full flex items-center justify-center text-xs text-gray-600">Placeholder</div>
               <div className="bg-gray-800 rounded-lg aspect-square w-full flex items-center justify-center text-xs text-gray-600">Placeholder</div>
               <div className="bg-gray-800 rounded-lg aspect-video w-full flex items-center justify-center text-xs text-gray-600">Placeholder</div>
            </div>
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             {/* Story Highlights */}
             <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {[1,2,3].map(i => (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[4.5rem]">
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center text-gray-500">
                      <Hash size={20} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Highlight {i}</span>
                  </div>
                ))}
             </div>

             <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                   <h4 className="font-bold text-white mb-2">Background</h4>
                   <p className="text-sm text-gray-400 leading-relaxed">
                     No background story has been written yet. This section will contain the character's origin, beliefs, and pivotal moments.
                   </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                   <h4 className="font-bold text-white mb-2">Connections</h4>
                   <p className="text-sm text-gray-400 leading-relaxed">
                     List allies, rivals, and organizations here.
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>

      <ExperienceSheet
        isOpen={isExperienceSheetOpen}
        onClose={() => setIsExperienceSheetOpen(false)}
        experiences={character.experiences || []}
        onUpdateExperiences={updateExperiences}
      />
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterStore, CharacterCard, LibraryItem } from '@/store/character-store';
import { LibraryBig, ScrollText, Plus, Archive, X, ArrowRightLeft, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddItemModal from '@/components/add-item-modal';
import createClient from '@/lib/supabase/client';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

export default function PlaymatView() {
  const { character, moveCard, addCardToCollection } = useCharacterStore();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'loadout' | 'vault'>('loadout');
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CharacterCard | null>(null);
  const [allLibraryItems, setAllLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  useEffect(() => {
    const fetchAllLibraryItems = async () => {
      setLibraryLoading(true);
      const supabase = createClient();

      // Fetch card-related types
      const { data: abilitiesData } = await supabase.from('library').select('*').eq('type', 'ability');
      const { data: spellsData } = await supabase.from('library').select('*').eq('type', 'spell');
      const { data: grimoiresData } = await supabase.from('library').select('*').eq('type', 'grimoire');

      setAllLibraryItems([
        ...(abilitiesData || []),
        ...(spellsData || []),
        ...(grimoiresData || []),
      ]);
      setLibraryLoading(false);
    };

    fetchAllLibraryItems();
  }, []);

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Playmat...</div>
      </div>
    );
  }

  const loadoutCards = character.character_cards?.filter(card => card.location === 'loadout') || [];
  const vaultCards = character.character_cards?.filter(card => card.location === 'vault') || [];

  const handleAddCard = (item: LibraryItem) => {
    addCardToCollection(item);
  };

  const handleMoveCard = (cardId: string, destination: 'loadout' | 'vault') => {
    // Basic check for loadout limit
    if (destination === 'loadout' && loadoutCards.length >= 5) {
      alert("Loadout is full! Move a card to the Vault first.");
      return;
    }
    moveCard(cardId, destination);
  };

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setViewMode('loadout')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-colors",
              viewMode === 'loadout' ? "bg-dagger-gold text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <ScrollText size={16} /> Loadout
          </button>
          <button
            onClick={() => setViewMode('vault')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-colors",
              viewMode === 'vault' ? "bg-dagger-gold text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <Archive size={16} /> Vault
          </button>
        </div>

        <button 
          onClick={() => setIsAddCardModalOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-colors border border-white/10"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Card</span>
        </button>
      </div>
      
      {/* Loadout View */}
      {viewMode === 'loadout' && (
        <div className="grid grid-cols-2 gap-4">
          {loadoutCards.length > 0 ? (
            loadoutCards.map((charCard) => (
              <CardThumbnail 
                key={charCard.id} 
                charCard={charCard} 
                onClick={() => setSelectedCard(charCard)}
                actionLabel="To Vault"
                onAction={() => handleMoveCard(charCard.id, 'vault')}
              />
            ))
          ) : (
            <div className="aspect-[2/3] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-gray-600 col-span-2 p-4 text-center">
              <LibraryBig size={24} className="mb-2" />
              <span className="text-sm">No cards in Loadout.</span>
              <span className="text-xs">Add from Vault or create new!</span>
            </div>
          )}
          
          {/* Fill remaining slots up to 5 */}
          {Array.from({ length: Math.max(0, 5 - loadoutCards.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-[2/3] border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-gray-600">
              <span className="text-xs uppercase">Slot {loadoutCards.length + i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vault View */}
      {viewMode === 'vault' && (
        <div className="space-y-4">
          {vaultCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {vaultCards.map((charCard) => (
                <CardThumbnail 
                  key={charCard.id} 
                  charCard={charCard} 
                  onClick={() => setSelectedCard(charCard)}
                  actionLabel="To Loadout"
                  onAction={() => handleMoveCard(charCard.id, 'loadout')}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Your Vault is empty.
            </div>
          )}
        </div>
      )}

      {/* Add Card Modal */}
      <AddItemModal 
        isOpen={isAddCardModalOpen} 
        onClose={() => setIsAddCardModalOpen(false)} 
        onAddItem={handleAddCard}
        libraryItems={allLibraryItems}
        filterType="cards"
      />

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal 
          charCard={selectedCard} 
          onClose={() => setSelectedCard(null)} 
        />
      )}
    </div>
  );
}

function CardThumbnail({ charCard, onClick, actionLabel, onAction }: { charCard: CharacterCard, onClick: () => void, actionLabel?: string, onAction?: () => void }) {
  const { name, domain, tier, type, data } = charCard.library_item || { name: 'Unknown Card', domain: '', tier: 0, type: '', data: {} };
  // Ensure we check for recall in data, defaulting to '0' if not found or empty
  const recallCost = data?.recall || '0';

  return (
    <div className="group relative">
      <div 
        className="aspect-[2/3] bg-zinc-800 border border-white/10 rounded-lg p-2 flex flex-col overflow-hidden hover:border-dagger-gold transition-colors cursor-pointer relative"
        onClick={onClick}
      >
        {/* Top Header Section: Level & Recall Cost */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-start p-2 z-20 pointer-events-none">
          {/* Top Left: Level */}
          <div className="relative w-8 h-10 flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)', backgroundColor: 'black' }}>
            {tier}
          </div>
          
          {/* Top Right: Recall Cost */}
          <div className="relative w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {recallCost}
            <Zap size={8} className="absolute bottom-0.5 right-0.5 text-yellow-400" />
          </div>
        </div>

        {/* Domain & Type Banner (Top Center) */}
        <div className="mt-8 text-center z-10">
          <span className="uppercase font-bold text-[9px] bg-black/60 border border-white/10 text-white px-2 py-0.5 rounded-sm tracking-wider shadow-sm backdrop-blur-sm">
            {domain} {type}
          </span>
        </div>

        {/* Card Name */}
        <div className="text-center mt-1 px-1 z-10">
          <div className="font-serif font-bold text-white leading-tight text-sm">{name}</div>
        </div>

        {/* Full Description (Small Text) */}
        <div className="flex-1 mt-2 overflow-hidden text-[9px] text-gray-300 leading-snug text-center px-1">
           {data?.description ? (
            <p className="line-clamp-[8]">{data.description}</p>
          ) : data?.text ? (
            <div className="whitespace-pre-wrap line-clamp-[8]">{data.text}</div>
          ) : (
            <p className="italic text-gray-500">No description.</p>
          )}
        </div>

      </div>
      
      {actionLabel && onAction && (
        <button 
          onClick={(e) => { e.stopPropagation(); onAction(); }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/20 text-[10px] font-bold text-gray-300 px-2 py-1 rounded-full hover:bg-zinc-700 hover:text-white whitespace-nowrap shadow-md z-30 flex items-center gap-1"
        >
          <ArrowRightLeft size={10} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function CardDetailModal({ charCard, onClose }: { charCard: CharacterCard, onClose: () => void }) {
  const { name, domain, tier, type, data } = charCard.library_item || { name: 'Unknown', domain: '', tier: 0, type: '', data: {} };
  const recallCost = data?.recall || '0'; 

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-zinc-800 text-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Section */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-3 z-10">
          {/* Top Left: Level */}
          <div className="relative w-12 h-16 flex items-center justify-center text-white font-bold text-xl" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)', backgroundColor: 'black' }}>
            {tier}
          </div>
          
          {/* Top Right: Recall Cost */}
          <div className="relative w-10 h-10 rounded-full bg-black/90 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {recallCost}
            <Zap size={14} className="absolute bottom-1 right-1 text-yellow-400" />
          </div>

          {/* Close Button - repositioned */}
          <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white bg-black/50 rounded-full p-1">
            <X size={20} />
          </button>
        </div>

        {/* Card Type Banner */}
        <div className="mt-16 pt-2 pb-1 text-center z-10">
          <span className="uppercase font-bold text-xs bg-black/60 border border-white/10 text-white px-3 py-1 rounded-full tracking-wider shadow-sm">
            {domain} - {type}
          </span>
        </div>

        {/* Card Name */}
        <div className="text-center px-4 pt-2">
          <h2 className="text-3xl font-bold font-serif text-white">{name}</h2>
        </div>

        {/* Card Description */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-center">
          {data?.description || data?.text ? (
            <div className="prose prose-invert text-gray-300">
              <ReactMarkdown>
                {data.description || data.text}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="italic text-gray-500">No description available.</p>
          )}
          
          {/* Render specific fields based on card type if needed, e.g. Grimoire abilities */}
        </div>

        {/* Footer */}
        <div className="py-2 text-center text-xs text-gray-500">
          {/* Footer content removed */}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useCharacterStore } from '@/store/character-store';
import Image from 'next/image';
import { getSystemModifiers } from '@/lib/utils';
import StatButton from '@/components/stat-button';
import CommonVitalsDisplay from '@/components/common-vitals-display';
import ExperienceSheet from '../experience-sheet';
import LevelUpModal from '../level-up-modal';
import ManageCharacterModal from '../manage-character-modal';
import AdvancementHistory from '../advancement-history';
import { Settings, Grid, Book, Activity, Camera, Hash, Trash2, Eye, EyeOff, User, Image as ImageIcon, Zap } from 'lucide-react';
import clsx from 'clsx';
import { uploadCharacterImage } from '@/lib/supabase/storage';
import { toast } from 'sonner';
import createClient from '@/lib/supabase/client';

export default function CharacterView() {
  const { character, user, updateModifiers, updateExperiences, updateLore, updateGallery, updateImage, updateBackgroundImage, levelUpCharacter, updateCharacterDetails, updateMarkedTraits } = useCharacterStore();
  const [isExperienceSheetOpen, setIsExperienceSheetOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isLevelUpLoading, setIsLevelUpLoading] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isManageLoading, setIsManageLoading] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showTraits, setShowTraits] = useState(true);
  const [showExperiences, setShowExperiences] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'gallery' | 'lore'>('stats');
  const [isUploading, setIsUploading] = useState(false);
  const [domainCards, setDomainCards] = useState<any[]>([]);
  const [showAncestry, setShowAncestry] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);
  const [ancestryCard, setAncestryCard] = useState<any>(null);
  const [communityCard, setCommunityCard] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingField, setSavingField] = useState<string>('');
  const [savedField, setSavedField] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save handler for lore fields
  const handleLoreChange = (field: string, value: string) => {
    setSavingField(field);
    setSavedField('');

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateLore({ [field]: value } as any);
        setSavingField('');
        setSavedField(field);
        // Clear saved indicator after 2 seconds
        setTimeout(() => setSavedField(''), 2000);
      } catch (err) {
        setSavingField('');
        toast.error(`Failed to save ${field}`);
      }
    }, 800);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Fetch domain cards, ancestry, and community from library
  useEffect(() => {
    const fetchLibraryData = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('library')
        .select('*');

      if (!error && data) {
        // Parse cards
        const cards = data.map((lib: any) => ({
          id: lib.id,
          name: lib.name,
          domain: lib.domain,
          type: lib.data?.type || '',
          data: lib.data || {},
        }));

        // Filter domain cards
        const domainCardsList = cards.filter((c: any) => c.domain && c.type);
        setDomainCards(domainCardsList);

        // Find ancestry card
        if (character?.ancestry) {
          const ancestry = data.find((lib: any) => lib.name === character.ancestry);
          if (ancestry) {
            setAncestryCard({
              name: ancestry.name,
              description: ancestry.data?.description || ancestry.data?.markdown || '',
              features: ancestry.data?.features || [],
            });
          }
        }

        // Find community card
        if (character?.community) {
          const community = data.find((lib: any) => lib.name === character.community);
          if (community) {
            setCommunityCard({
              name: community.name,
              description: community.data?.description || community.data?.markdown || '',
              features: community.data?.features || [],
            });
          }
        }
      }
    };

    fetchLibraryData();
  }, [character?.ancestry, character?.community]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !character || !user) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const { url, error } = await uploadCharacterImage(user.id, file, character.id);

    if (url) {
      const currentGallery = character.gallery_images || [];
      await updateGallery([...currentGallery, url]);
      toast.success('Image uploaded successfully');
    } else {
      toast.error(error || 'Failed to upload image.');
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (urlToDelete: string) => {
    if (!character) return;
    if (confirm('Are you sure you want to delete this image?')) {
      const currentGallery = character.gallery_images || [];
      const updatedGallery = currentGallery.filter(url => url !== urlToDelete);
      await updateGallery(updatedGallery);
      // Note: We are strictly removing it from the gallery list.
      // Deleting the actual file from storage is optional/advanced as it might be used elsewhere.
    }
  };

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
      <div className="relative w-full h-48 md:h-64 bg-gray-900 overflow-hidden group/header">
        {/* Banner Background */}
        <div className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover/header:opacity-70">
          {character.background_image_url ? (
            <Image
              src={character.background_image_url}
              alt="Banner Background"
              fill
              className="object-cover"
            />
          ) : character.image_url ? (
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
        <div className="absolute inset-0 bg-gradient-to-t from-dagger-dark via-dagger-dark/40 to-transparent" />

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
           <button
            onClick={() => setIsManageOpen(true)}
            className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-md px-4 py-2 rounded-full transition-all flex items-center gap-2 border border-white/10 shadow-lg"
          >
            <Settings size={16} />
            <span className="text-sm font-bold hidden sm:inline">Manage</span>
          </button>
        </div>

        {/* Profile Avatar & Basic Info */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-800 rounded-2xl rotate-3 p-1 border-4 border-dagger-gold shadow-2xl flex-shrink-0 relative group cursor-pointer hover:rotate-0 transition-transform duration-300 overflow-hidden">
            <div className="w-full h-full rounded-xl overflow-hidden relative">
              {character.image_url ? (
                <Image
                  src={character.image_url}
                  alt={character.name || "Character Avatar"}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl font-bold bg-dagger-gold text-black">
                  {character.name[0]}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              {/* Hidden Overlay Button for clicking the avatar to upload */}
             <div 
              className="absolute inset-0 z-20" 
              onClick={() => fileInputRef.current?.click()}
             />
          </div>

          {/* Info Block */}
          <div className="mb-1 flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-lg leading-tight truncate">
              {character.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2">
              {/* Level & Class Badge */}
              <div className="flex items-center gap-2 text-dagger-gold font-bold text-sm md:text-lg uppercase tracking-wider drop-shadow-md bg-black/30 px-2 md:px-3 py-1 rounded-lg border border-dagger-gold/20 backdrop-blur-sm">
                <span>Lvl {character.level}</span>
                <span className="w-1 h-3 md:h-4 bg-dagger-gold/50 rounded-full" />
                <span>{character.class_id}</span>
              </div>

              {/* Heritage Info */}
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-200 font-medium drop-shadow-md hidden sm:flex">
                 {character.ancestry && (
                   <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
                      <User size={14} className="text-gray-400" />
                      {character.ancestry}
                   </div>
                 )}
                 {character.community && (
                   <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
                      <User size={14} className="text-gray-400" />
                      {character.community}
                   </div>
                 )}
              </div>
            </div>
          </div>



        </div> {/* Closes Profile Avatar & Basic Info */}
      </div> {/* Closes Social Profile Header */}
      
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Vitals</h3>
                <button
                  onClick={() => setShowVitals(!showVitals)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                >
                  {showVitals ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showVitals ? 'Hide' : 'Show'}
                </button>
              </div>
              {showVitals && <CommonVitalsDisplay character={character} />}
            </div>

                        {/* Stats Grid */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
                            <button 
                              onClick={() => setShowTraits(!showTraits)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                            >
                              {showTraits ? <EyeOff size={14} /> : <Eye size={14} />}
                              {showTraits ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          {showTraits && (
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(character.stats).map(([key, value]) => {
                                const { total, allMods } = getStatDetails(key, value);
                                const isMarked = character.marked_traits_jsonb?.[key] || false;

                                const toggleMark = () => {
                                  const newMarked = { ...(character.marked_traits_jsonb || {}) };
                                  if (isMarked) {
                                    delete newMarked[key];
                                  } else {
                                    newMarked[key] = true;
                                  }
                                  updateMarkedTraits(newMarked);
                                };

                                return (
                                  <div key={key} className="relative">
                                    <StatButton
                                      label={key}
                                      value={total}
                                      baseValue={value}
                                      modifiers={allMods}
                                      onUpdateModifiers={(mods) => updateModifiers(key, mods)}
                                    />
                                    <button
                                      onClick={toggleMark}
                                      className={`absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full transition-all border border-white ${
                                        isMarked
                                          ? 'bg-dagger-gold'
                                          : 'bg-transparent hover:bg-white/10'
                                      }`}
                                      title={isMarked ? 'Trait is marked (cannot be increased until tier clear)' : 'Mark trait as used'}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {/* Experiences Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Experiences</h3>
                              <button 
                                onClick={() => setIsExperienceSheetOpen(true)}
                                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                              >
                                <Settings size={12} /> Manage
                              </button>
                            </div>
                            <button 
                              onClick={() => setShowExperiences(!showExperiences)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                            >
                              {showExperiences ? <EyeOff size={14} /> : <Eye size={14} />}
                              {showExperiences ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          
                          {showExperiences && (                <div className="space-y-2">
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
              )}
            </div>

            {/* Ancestry Section */}
            {character.ancestry && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Ancestry</h3>
                  <button
                    onClick={() => setShowAncestry(!showAncestry)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                  >
                    {showAncestry ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showAncestry ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showAncestry && (
                  <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                    {ancestryCard ? (
                      <>
                        <h4 className="font-serif font-bold text-white mb-1">{ancestryCard.name}</h4>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">{ancestryCard.description}</p>
                        {ancestryCard.features?.map((feature: any, i: number) => (
                          <div key={i} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                            <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                              {feature.name}
                            </div>
                            <div className="text-sm text-gray-300 leading-relaxed">
                              {feature.text?.split('**').map((part: string, j: number) => 
                                j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-gray-400 italic text-sm">
                        {character.ancestry} details not found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Community Section */}
            {character.community && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Community</h3>
                  <button
                    onClick={() => setShowCommunity(!showCommunity)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                  >
                    {showCommunity ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showCommunity ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showCommunity && (
                  <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
                    {communityCard ? (
                      <>
                        <h4 className="font-serif font-bold text-white mb-1">{communityCard.name}</h4>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">{communityCard.description}</p>
                        {communityCard.features?.map((feature: any, i: number) => (
                          <div key={i} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                            <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                              {feature.name}
                            </div>
                            <div className="text-sm text-gray-300 leading-relaxed">
                              {feature.text?.split('**').map((part: string, j: number) => 
                                j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-gray-400 italic text-sm">
                        {character.community} details not found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Advancement History Section */}
            {character.advancement_history_jsonb && Object.keys(character.advancement_history_jsonb).length > 0 && (
              <div className="space-y-2">
                <AdvancementHistory advancementHistory={character.advancement_history_jsonb} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50"
              >
                <Camera size={16} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>

            {/* Masonry-ish Gallery Grid */}
            {character.gallery_images && character.gallery_images.length > 0 ? (
              <div className="columns-2 gap-4 space-y-4">
                {character.gallery_images.map((url, index) => (
                  <div key={index} className="relative group break-inside-avoid">
                    <div className="rounded-lg overflow-hidden bg-gray-800 shadow-lg">
                      <Image
                        src={url}
                        alt={`Concept Art ${index + 1}`}
                        width={400}
                        height={400}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2 transition-opacity">
                      <button
                        onClick={() => {
                          if (confirm('Set this image as your profile picture?')) {
                            updateImage(url);
                            toast.success('Profile picture updated');
                          }
                        }}
                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-dagger-gold hover:text-black transition-colors"
                        title="Set as Profile Picture"
                      >
                        <User size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Set this image as your background banner?')) {
                            updateBackgroundImage(url);
                            toast.success('Background updated');
                          }
                        }}
                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-dagger-gold hover:text-black transition-colors"
                        title="Set as Background"
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(url)}
                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors"
                        title="Delete Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-xs mt-4">
                No images uploaded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">Pronouns</h4>
                  {savingField === 'pronouns' && (
                    <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                  )}
                  {savedField === 'pronouns' && (
                    <span className="text-xs text-green-400">Saved</span>
                  )}
                </div>
                <input
                  className="w-full bg-transparent text-sm text-gray-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                  placeholder="e.g. They/Them"
                  defaultValue={character.pronouns || ''}
                  onChange={(e) => handleLoreChange('pronouns', e.target.value)}
                />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">Appearance</h4>
                  {savingField === 'appearance' && (
                    <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                  )}
                  {savedField === 'appearance' && (
                    <span className="text-xs text-green-400">Saved</span>
                  )}
                </div>
                <textarea
                  className="w-full bg-transparent text-sm text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                  rows={4}
                  placeholder="Describe your character's physical appearance..."
                  defaultValue={character.appearance || ''}
                  onChange={(e) => handleLoreChange('appearance', e.target.value)}
                />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">Background</h4>
                  {savingField === 'background' && (
                    <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                  )}
                  {savedField === 'background' && (
                    <span className="text-xs text-green-400">Saved</span>
                  )}
                </div>
                <textarea
                  className="w-full bg-transparent text-sm text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                  rows={6}
                  placeholder="Write your character's origin, beliefs, and pivotal moments..."
                  defaultValue={character.background || ''}
                  onChange={(e) => handleLoreChange('background', e.target.value)}
                />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">Connections</h4>
                  {savingField === 'connections' && (
                    <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
                  )}
                  {savedField === 'connections' && (
                    <span className="text-xs text-green-400">Saved</span>
                  )}
                </div>
                <textarea
                  className="w-full bg-transparent text-sm text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-dagger-gold rounded p-2"
                  rows={4}
                  placeholder="List allies, rivals, and organizations..."
                  defaultValue={character.connections || ''}
                  onChange={(e) => handleLoreChange('connections', e.target.value)}
                />
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

      <LevelUpModal
        isOpen={isLevelUpOpen}
        onClose={() => setIsLevelUpOpen(false)}
        currentLevel={character?.level || 1}
        currentDamageThresholds={character?.damage_thresholds || { minor: 1, major: 2, severe: 3 }}
        characterDomains={character?.domains || []}
        characterClassId={character?.class_id}
        characterCards={character?.character_cards || []}
        multiclassId={character?.multiclass_id}
        domainCards={domainCards}
        isLoading={isLevelUpLoading}
        onComplete={async (options) => {
          setIsLevelUpLoading(true);
          try {
            await levelUpCharacter(options);
            toast.success(`Level up to ${options.newLevel}!`);
            setIsLevelUpOpen(false);
          } catch (err) {
            console.error('Failed to level up:', err);
            toast.error('Failed to complete level up');
          } finally {
            setIsLevelUpLoading(false);
          }
        }}
      />

      <ManageCharacterModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        currentName={character?.name}
        currentLevel={character?.level || 1}
        currentAncestry={character?.ancestry}
        currentCommunity={character?.community}
        advancementHistory={character?.advancement_history_jsonb}
        isLoading={isManageLoading}
        onLevelUp={() => {
          setIsManageOpen(false);
          setIsLevelUpOpen(true);
        }}
        onUpdate={async (updates) => {
          setIsManageLoading(true);
          try {
            await updateCharacterDetails(updates);
            const changes = [];
            if (updates.name) changes.push(`name: ${updates.name}`);
            if (updates.level) {
              if (updates.level > character!.level) {
                changes.push(`leveled to ${updates.level}`);
              } else {
                changes.push(`de-leveled to ${updates.level}`);
              }
            }
            if (updates.ancestry) changes.push(`ancestry: ${updates.ancestry}`);
            if (updates.community) changes.push(`community: ${updates.community}`);
            toast.success(`Character updated: ${changes.join(', ')}`);
            setIsManageOpen(false);
          } catch (err) {
            console.error('Failed to update character:', err);
            toast.error('Failed to update character');
          } finally {
            setIsManageLoading(false);
          }
        }}
      />
    </div>
  );
}
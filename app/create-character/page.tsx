/**
 * CHARACTER CREATION PAGE
 * ----------------------------------------------------------------------------
 * This component handles the full wizard flow for creating a new character.
 * 
 * FUNCTIONALITY:
 * - Multi-step Form Wizard: Guides the user through 8-9 steps.
 * - SRD Integration: Fetches valid options from the database.
 * - Rules Enforcement: Validates choices based on Daggerheart rules.
 * - Dynamic Calculations: Computes starting Vitals, Evasion, and Loadout.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore, Character } from '@/store/character-store';
import { dataService } from '@/lib/data-service';
import useContentAccess from '@/hooks/useContentAccess';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { uploadCharacterAvatar } from '@/lib/storage-service';
import { calculateDamageThresholds } from '@/lib/gameLogic';
import { getTemplateForClass } from '@/lib/character-templates';
import { 
  BasicInfoStep, 
  HeritageStep, 
  ClassDomainsStep, 
  DomainCardsStep, 
  AssignTraitsStep, 
  ExperiencesStep, 
  CompanionStep, 
  EquipmentStep, 
  ConfirmCreateStep,
  CharacterFormData,
  LibraryData,
  LibraryLookupItem
} from '@/components/character-creation';

export default function CreateCharacterPage() {
  const router = useRouter();
  const { user, fetchCharacter } = useCharacterStore();
  const { includePlaytest, loading: contentAccessLoading } = useContentAccess();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CharacterFormData>>({
    name: '',
    image_url: '',
    stats: undefined,
    experiences: ['', ''],
    domains: ['', ''],
    selectedCards: [],
    selectedPrimaryWeaponId: null,
    selectedSecondaryWeaponId: null,
    selectedArmorId: null,
    selectedPotionType: null,
  });
  const [calculatedVitals, setCalculatedVitals] = useState({ hp: 0, stress: 0, armor: 0, evasion: 10 });
  const [startingItemsAndCards, setStartingItemsAndCards] = useState<{ cards: string[], weapons: string[], armor: string[], misc: string[], gold: { handfuls: number, bags: number, chests: number } }>({
    cards: [], weapons: [], armor: [], misc: [], gold: { handfuls: 0, bags: 0, chests: 0 }
  });

  const [libraryData, setLibraryData] = useState<LibraryData>({
    ancestries: [], communities: [], classes: [], subclasses: [], domains: [], weapons: [], armor: [], consumables: [], abilities: [], spells: [], grimoires: []
  });
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTemplateApplied, setIsTemplateApplied] = useState(false);
  const prevClassIdRef = useRef<string | null>(null);

  // Image Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initial trait assignment values as per Daggerheart rules
  const TRAIT_ASSIGNMENT_POOL = useMemo(() => [2, 1, 1, 0, 0, -1], []);
  const DISPLAY_TRAIT_POOL = useMemo(() => [2, 1, 1, -1], []);
  const [selectedTraitIndex, setSelectedTraitIndex] = useState<number | null>(null);

  const isTraitValueAssigned = useCallback((value: number): boolean => {
    const stats = formData.stats || {};
    const assignedValues = Object.values(stats);
    const countInStats = assignedValues.filter(v => v === value).length;
    const countInPool = DISPLAY_TRAIT_POOL.filter(v => v === value).length;
    return countInStats >= countInPool;
  }, [formData.stats, DISPLAY_TRAIT_POOL]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (contentAccessLoading) return;

    const fetchAllLibraryData = async () => {
      setLibraryLoading(true);
      setError(null);
      const contentOptions = { includePlaytest };

      try {
        const [ancestries, communities, classes, subclasses, domains, weapons, armor, consumables, abilities, spells, grimoires] = await Promise.all([
          dataService.library.getByType('ancestry', contentOptions),
          dataService.library.getByType('community', contentOptions),
          dataService.library.getByType('class', contentOptions),
          dataService.library.getByType('subclass', contentOptions),
          dataService.library.getByType('domain', contentOptions),
          dataService.library.getByType('weapon', contentOptions),
          dataService.library.getByType('armor', contentOptions),
          dataService.library.getByType('consumable', contentOptions),
          dataService.library.getByType('ability', contentOptions),
          dataService.library.getByType('spell', contentOptions),
          dataService.library.getByType('grimoire', contentOptions),
        ]);

        setLibraryData({ ancestries, communities, classes, subclasses, domains, weapons, armor, consumables, abilities, spells, grimoires });
      } catch (err) {
        setError("Failed to load game data: " + (err instanceof Error ? err.message : String(err)));
      }
      setLibraryLoading(false);
    };

    fetchAllLibraryData();
  }, [user, router, includePlaytest, contentAccessLoading]);

  useEffect(() => {
    if (formData.class_id && libraryData.classes.length > 0) {
      if (prevClassIdRef.current !== formData.class_id) {
        prevClassIdRef.current = formData.class_id;
        
        const selectedClass = libraryData.classes.find(c => c.id === formData.class_id);
        if (selectedClass) {
          setCalculatedVitals({
            hp: selectedClass.data.starting_hp || 5,
            stress: selectedClass.data.starting_stress || 6,
            armor: selectedClass.data.starting_armor_score || 0,
            evasion: 10
          });

          if (selectedClass.data.domains && selectedClass.data.domains.length >= 2) {
            setFormData(prev => {
              if (prev.domains?.[0] === selectedClass.data.domains[0] && prev.domains?.[1] === selectedClass.data.domains[1]) {
                return prev;
              }
              return {
                ...prev,
                domains: [selectedClass.data.domains[0], selectedClass.data.domains[1]],
                selectedCards: []
              };
            });
          }

          const initialMiscItems: string[] = [];
          if (selectedClass.data.class_items_raw) {
            if (selectedClass.data.class_items_raw.includes('Minor Health Potion')) initialMiscItems.push('consumable-minor-health-potion');
            else if (selectedClass.data.class_items_raw.includes('Minor Stamina Potion')) initialMiscItems.push('consumable-minor-stamina-potion');
            
            ['torch', '50 feet of rope', 'basic supplies'].forEach(itemName => {
              if (selectedClass.data.class_items_raw.toLowerCase().includes(itemName)) {
                initialMiscItems.push(`misc-${itemName.replace(/\s/g, '-')}`);
              }
            });
          }

          setStartingItemsAndCards({
            cards: [],
            weapons: [],
            armor: [],
            misc: initialMiscItems,
            gold: { handfuls: 1, bags: 0, chests: 0 }
          });
          
          if (!isTemplateApplied) {
            setFormData(prev => ({
              ...prev,
              selectedPrimaryWeaponId: null,
              selectedSecondaryWeaponId: null,
              selectedArmorId: null,
              // Clear stats when class changes
              stats: undefined
            }));
          } else {
            setIsTemplateApplied(false);
          }
        }
      }
    }
  }, [formData.class_id, libraryData.classes, isTemplateApplied]);

  const handleApplyTemplate = useCallback((classId: string, subclassId: string) => {
    const templateData = getTemplateForClass(classId, subclassId, libraryData);
    if (templateData) {
      setIsTemplateApplied(true);
      // We set the form data, which triggers the effect because class_id likely changes (or is set).
      // Even if class_id is same, other fields update. 
      // But effect only runs if class_id changes (due to our ref check) OR if isTemplateApplied changes?
      // Wait, isTemplateApplied is in dependency array.
      // So setting it true triggers effect. Ref matches (if class same). 
      // If class different, Ref differs.
      
      // If we select template for NEW class:
      // setIsTemplateApplied(true) -> Effect runs. prevClassIdRef != newClassId (NO, formData not updated yet).
      // setFormData(...) -> Effect runs. prevClassIdRef != newClassId.
      // Inside effect: isTemplateApplied is true. So we skip clearing. set false.
      
      setFormData(prev => ({ ...prev, ...templateData }));
    }
  }, [libraryData]);

  const handleDomainChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newDomains = [...(prev.domains || ['', ''])] as [string, string];
      newDomains[index] = value;
      return { ...prev, domains: newDomains, selectedCards: [] };
    });
  }, []);

  const handleCardSelection = useCallback((cardId: string) => {
    setFormData(prev => {
      const currentCards = prev.selectedCards || [];
      if (currentCards.includes(cardId)) {
        return { ...prev, selectedCards: currentCards.filter(id => id !== cardId) };
      } else if (currentCards.length < 2) {
        return { ...prev, selectedCards: [...currentCards, cardId] };
      }
      return prev;
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const assignTraitValue = useCallback((statName: keyof CharacterFormData['stats'], value: number | '') => {
    if (value === '') {
      setFormData(prev => ({ 
        ...prev, 
        stats: prev.stats ? { ...prev.stats, [statName]: 0 } : { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0, [statName]: 0 }
      }));
      setSelectedTraitIndex(null);
    } else {
      const val = value as number;
      const currentStats = formData.stats || { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };
      const assignedCount = Object.entries(currentStats).filter(([key, v]) => key !== statName && v === val).length;
      const poolCount = TRAIT_ASSIGNMENT_POOL.filter(v => v === val).length;

      if (assignedCount < poolCount) {
        setFormData(prev => ({
          ...prev,
          stats: { 
            ...(prev.stats || { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 }), 
            [statName]: val 
          }
        }));
        setSelectedTraitIndex(null);
      } else {
        setError(`All ${val >= 0 ? '+' : ''}${val} values assigned. Clear one first.`);
      }
    }
  }, [formData.stats, TRAIT_ASSIGNMENT_POOL]);

  const handleExperienceChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newExperiences = [...(prev.experiences || ['', ''])] as [string, string];
      newExperiences[index] = value;
      return { ...prev, experiences: newExperiences };
    });
  }, []);

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return setError('Please select an image file');
      if (file.size > 2 * 1024 * 1024) return setError('Image must be less than 2MB');
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  }, []);

  const validateStep = useCallback((step: number) => {
    const isBeastbond = formData.subclass_id && libraryData.subclasses.find(s => s.id === formData.subclass_id)?.name?.toLowerCase() === 'beastbound';
    switch (step) {
      case 1: return true; // Name is optional, defaults to "New Character"
      case 2: 
        if (formData.is_mixed_ancestry) {
          return !!formData.ancestry_id && !!formData.ancestry_id_2 && !!formData.community_id;
        }
        return !!formData.ancestry_id && !!formData.community_id;
      case 3: return !!formData.class_id && !!formData.subclass_id && !!formData.domains?.[0] && !!formData.domains?.[1];
      case 4: return (formData.selectedCards?.length || 0) === 2;
      case 5:
        const counts: { [key: number]: number } = {};
        TRAIT_ASSIGNMENT_POOL.forEach(val => counts[val] = (counts[val] || 0) + 1);
        Object.values(formData.stats || {}).forEach(val => counts[val]--);
        return Object.values(counts).every(c => c === 0);
      case 6: return !!formData.experiences?.every(e => e.trim().length > 0);
      case 7: return !isBeastbond || (!!formData.companion?.name && !!formData.companion?.animal_type && !!formData.companion?.attack_name && !!formData.companion?.experiences?.every(e => e.name.trim().length > 0));
      case 8: return !!formData.selectedPrimaryWeaponId && !!formData.selectedArmorId && !!formData.selectedPotionType;
      default: return true;
    }
  }, [formData, libraryData.subclasses, TRAIT_ASSIGNMENT_POOL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    let uploadedImageUrl: string | null = null;
    if (selectedImageFile) {
      setUploadingImage(true);
      const uploadResult = await uploadCharacterAvatar(user.id, selectedImageFile);
      setUploadingImage(false);
      if (uploadResult.error || !uploadResult.url) {
        setError("Failed to upload character image.");
        setIsSubmitting(false);
        return;
      }
      uploadedImageUrl = uploadResult.url;
    }

    try {
      const selectedAncestry = libraryData.ancestries.find(a => a.id === formData.ancestry_id);
      const selectedAncestry2 = formData.is_mixed_ancestry ? libraryData.ancestries.find(a => a.id === formData.ancestry_id_2) : null;
      
      const ancestryName = formData.is_mixed_ancestry
        ? (formData.mixed_ancestry_name || (selectedAncestry2 ? `${selectedAncestry?.name}-${selectedAncestry2?.name}` : selectedAncestry?.name))
        : selectedAncestry?.name;

      const ancestryFeatures = formData.is_mixed_ancestry
        ? [
            selectedAncestry?.data?.features?.[formData.ancestry_feat_index_1 ?? 0], 
            selectedAncestry2?.data?.features?.[formData.ancestry_feat_index_2 ?? 1]
          ]
        : selectedAncestry?.data?.features;

      const selectedCommunity = libraryData.communities.find(c => c.id === formData.community_id);
      const selectedClass = libraryData.classes.find(cl => cl.id === formData.class_id);
      const selectedSubclass = libraryData.subclasses.find(sc => sc.id === formData.subclass_id);
      const finalPrimaryWeapon = libraryData.weapons.find(w => w.id === formData.selectedPrimaryWeaponId);
      const finalSecondaryWeapon = libraryData.weapons.find(w => w.id === formData.selectedSecondaryWeaponId);
      const finalArmor = libraryData.armor.find(a => a.id === formData.selectedArmorId);

      const actualArmorScore = finalArmor?.data.base_score || 0;
      const damageThresholds = calculateDamageThresholds(1, finalArmor ? [{ library_item: finalArmor as any }] : [], []);

      const characterPayload = {
        character: {
          user_id: user.id,
          name: formData.name?.trim() || 'New Character',
          level: 1,
          ancestry: ancestryName,
          ancestry_features: ancestryFeatures,
          community: selectedCommunity?.name,
          class_id: selectedClass?.name,
          subclass_id: selectedSubclass?.name,
          domains: formData.domains as string[],
          stats: formData.stats as Character['stats'],
          vitals: {
            hit_points_max: calculatedVitals.hp,
            hit_points_current: calculatedVitals.hp,
            stress_max: calculatedVitals.stress,
            stress_current: 0,
            armor_score: actualArmorScore,
            armor_slots: actualArmorScore,
          },
          damage_thresholds: damageThresholds,
          hope: 2,
          fear: 0,
          evasion: calculatedVitals.evasion,
          proficiency: 1,
          experiences: formData.experiences!.map(name => ({ name, value: 2 })),
          gold: startingItemsAndCards.gold,
          image_url: uploadedImageUrl || formData.image_url,
          subclass_progression: { foundation_obtained: true, specialization_obtained: false, mastery_obtained: false },
          modifiers: {},
          ...(formData.companion && { ranger_companion: formData.companion })
        },
        cards: [
          ...formData.selectedCards!.map((id, i) => ({ card_id: id, location: 'loadout', sort_order: i })),
          { card_id: formData.subclass_id!, location: 'feature', sort_order: 0 }
        ],
        inventory: [
          ...(finalPrimaryWeapon ? [{ item_id: finalPrimaryWeapon.id, name: finalPrimaryWeapon.name, description: finalPrimaryWeapon.data.markdown || '', location: 'equipped_primary', quantity: 1 }] : []),
          ...(finalSecondaryWeapon ? [{ item_id: finalSecondaryWeapon.id, name: finalSecondaryWeapon.name, description: finalSecondaryWeapon.data.markdown || '', location: 'equipped_secondary', quantity: 1 }] : []),
          ...(finalArmor ? [{ item_id: finalArmor.id, name: finalArmor.name, description: finalArmor.data.markdown || '', location: 'equipped_armor', quantity: 1 }] : []),
          { 
            item_id: libraryData.consumables.find(c => c.name === (formData.selectedPotionType === 'health' ? 'Minor Health Potion' : 'Minor Stamina Potion'))?.id || null,
            name: formData.selectedPotionType === 'health' ? 'Minor Health Potion' : 'Minor Stamina Potion',
            description: '', location: 'backpack', quantity: 1 
          },
          ...['Torch', '50 Feet of Rope', 'Basic Supplies'].map(name => ({
            item_id: libraryData.consumables.find(c => c.name === name)?.id || null,
            name, description: '', location: 'backpack', quantity: 1
          }))
        ]
      };

      await dataService.character.create(characterPayload);
      await fetchCharacter(user.id);
      router.push('/client/characters');
    } catch (err) {
      setError("Error creating character: " + (err instanceof Error ? err.message : String(err)));
      setIsSubmitting(false);
    }
  };

  const isBeastbond = formData.subclass_id && libraryData.subclasses.find(s => s.id === formData.subclass_id)?.name?.toLowerCase() === 'beastbound';
  const totalSteps = isBeastbond ? 9 : 8;

  if (libraryLoading) return <div className="min-h-screen bg-dagger-dark flex items-center justify-center text-white">Loading data...</div>;

  return (
    <div className="min-h-[100dvh] bg-dagger-dark text-white p-4 flex items-center justify-center relative">
      <div className="max-w-md w-full bg-dagger-panel border border-white/10 rounded-xl shadow-lg p-6 space-y-6 relative">
        <button 
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to abort character creation? All progress will be lost.')) {
              router.push('/client/characters');
            }
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1"
          title="Abort creation"
        >
          <X size={20} />
        </button>

        <h1 className="text-2xl font-serif font-bold text-center text-dagger-gold">New Character</h1>
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={idx} className={clsx("w-6 h-2 rounded-full", idx + 1 === currentStep ? "bg-dagger-gold" : "bg-gray-700")} />
          ))}
        </div>
        {error && <div className="p-3 bg-red-800/50 border border-red-500 rounded text-red-300 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <BasicInfoStep 
              formData={formData} handleInputChange={handleInputChange} 
              imagePreview={imagePreview} selectedImageFile={selectedImageFile}
              handleImageFileChange={handleImageFileChange} setSelectedImageFile={setSelectedImageFile}
              setImagePreview={setImagePreview} onNext={() => setCurrentStep(2)} isValid={validateStep(1)}
              libraryData={libraryData}
              onApplyTemplate={handleApplyTemplate}
            />
          )}
          {currentStep === 2 && (
            <HeritageStep 
              formData={formData} libraryData={libraryData} handleInputChange={handleInputChange}
              setFormData={setFormData}
              onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} isValid={validateStep(2)}
            />
          )}
          {currentStep === 3 && (
            <ClassDomainsStep 
              formData={formData} libraryData={libraryData} handleInputChange={handleInputChange}
              handleDomainChange={handleDomainChange} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} isValid={validateStep(3)}
            />
          )}
          {currentStep === 4 && (
            <DomainCardsStep 
              formData={formData} libraryData={libraryData} handleCardSelection={handleCardSelection}
              onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} isValid={validateStep(4)}
            />
          )}
          {currentStep === 5 && (
            <AssignTraitsStep 
              formData={formData} traitAssignmentPool={TRAIT_ASSIGNMENT_POOL}
              suggestedTraits={
                libraryData.classes.find(c => c.id === formData.class_id)?.data?.suggested?.traits || 
                libraryData.classes.find(c => c.id === formData.class_id)?.data?.suggested_traits
              }
              classSource={libraryData.classes.find(c => c.id === formData.class_id)?.source}
              assignTraitValue={assignTraitValue} setFormData={setFormData}
              onNext={() => setCurrentStep(6)} onBack={() => setCurrentStep(4)} isValid={validateStep(5)}
            />
          )}
          {currentStep === 6 && (
            <ExperiencesStep 
              formData={formData} handleExperienceChange={handleExperienceChange}
              onNext={() => setCurrentStep(isBeastbond ? 7 : 8)} onBack={() => setCurrentStep(5)} isValid={validateStep(6)}
            />
          )}
          {currentStep === 7 && isBeastbond && (
            <CompanionStep 
              formData={formData} setFormData={setFormData}
              onNext={() => setCurrentStep(8)} onBack={() => setCurrentStep(6)} isValid={validateStep(7)}
            />
          )}
          {currentStep === 8 && (
            <EquipmentStep 
              formData={formData} libraryData={libraryData} setFormData={setFormData}
              onNext={() => setCurrentStep(9)} onBack={() => setCurrentStep(isBeastbond ? 7 : 6)} isValid={validateStep(8)}
            />
          )}
          {currentStep === 9 && (
            <ConfirmCreateStep 
              formData={formData} libraryData={libraryData} calculatedVitals={calculatedVitals}
              startingItemsAndCards={startingItemsAndCards} isSubmitting={isSubmitting}
              uploadingImage={uploadingImage} onBack={() => setCurrentStep(8)}
            />
          )}
        </form>
      </div>
    </div>
  );
}

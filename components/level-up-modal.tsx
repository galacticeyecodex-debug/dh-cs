import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  onComplete?: (options: any) => void;
}

export default function LevelUpModal({ isOpen, onClose, currentLevel, onComplete }: LevelUpModalProps) {
  const [step, setStep] = useState(1);
  const newLevel = currentLevel + 1;

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        newLevel,
        selectedAdvancements: [],
        selectedDomainCardId: '',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dagger-dark border border-dagger-gold/30 rounded-lg w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-dagger-gold/10 border-b border-dagger-gold/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-dagger-gold" />
            <h2 className="text-2xl font-bold text-white">Level Up to {newLevel}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="bg-black/20 px-6 py-3 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  s <= step ? 'bg-dagger-gold w-3' : 'bg-gray-600'
                }`}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Tier Achievements</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dagger-gold rounded-full" />
                  <span>✓ New Experience: +2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dagger-gold rounded-full" />
                  <span>✓ Proficiency: +1</span>
                </div>
                {newLevel === 5 || newLevel === 8 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-dagger-gold rounded-full" />
                    <span>✓ Clear Marked Traits</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Select Advancements</h3>
              <p className="text-gray-400 mb-4">Choose 2 advancement slots (some options cost 2 slots)</p>
              <div className="text-gray-400">
                Advancement options will appear here...
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Damage Thresholds</h3>
              <div className="space-y-2 text-gray-300">
                <p>Your damage thresholds will increase by +1:</p>
                <div className="pl-4 space-y-1">
                  <p>Minor: 1 → 2</p>
                  <p>Major: 2 → 3</p>
                  <p>Severe: 3 → 4</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Domain Card</h3>
              <p className="text-gray-400 mb-4">Select a new domain card at level {newLevel} or below</p>
              <div className="text-gray-400">
                Domain card selection will appear here...
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/20 border-t border-dagger-gold/20 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <span className="text-sm text-gray-400">
            Step {step} of 4
          </span>
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-4 py-2 rounded-lg bg-dagger-gold text-black font-bold hover:bg-dagger-gold/90 transition-colors"
            >
              Complete Level Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

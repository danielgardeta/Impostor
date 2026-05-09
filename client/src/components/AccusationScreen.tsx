import React, { useState } from 'react';
import { GameState } from '../types/game';

const CHAR_COLORS = [
  { bg: '#1a2a4a', text: '#93c5fd', border: '#2563eb' },
  { bg: '#2d1b69', text: '#c4b5fd', border: '#7c3aed' },
  { bg: '#0f3d2e', text: '#6ee7b7', border: '#059669' },
  { bg: '#3d1a0a', text: '#fcd34d', border: '#d97706' },
];

interface AccusationScreenProps {
  gameState: GameState;
  isLoading: boolean;
  error: string | null;
  onAccuse: (characterId: string) => Promise<void>;
  onBack: () => void;
  onClearError: () => void;
}

export function AccusationScreen({
  gameState,
  isLoading,
  error,
  onAccuse,
  onBack,
  onClearError,
}: AccusationScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { characters, budget, questionsUsed } = gameState;

  const selectedChar = selectedId ? characters.find(c => c.id === selectedId) : null;

  return (
    <div className="min-h-screen bg-noir-950 grid-overlay flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-px h-8 bg-accent mx-auto mb-4 opacity-60" />
          <div className="text-accent font-mono text-xs tracking-widest uppercase mb-3">
            Veredicto final
          </div>
          <h1 className="text-cream font-serif text-4xl mb-2">¿Quién es el topo?</h1>
          <p className="text-muted font-mono text-xs tracking-wide">
            {questionsUsed} preguntas usadas · {budget} restantes
          </p>
          <p className="text-cream/30 font-serif text-xs italic mt-2">
            Esta decisión es irreversible.
          </p>
        </div>

        {/* Characters */}
        <div className="space-y-2 mb-6">
          {characters.map((char, i) => {
            const color = CHAR_COLORS[i];
            const isSelected = selectedId === char.id;
            return (
              <button
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                className="w-full text-left p-4 border transition-all duration-200 rounded-sm hover:bg-noir-800/50"
                style={{
                  backgroundColor: isSelected ? color.bg : undefined,
                  borderColor: isSelected ? color.border : '#3a3a4e',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl font-mono flex-shrink-0"
                    style={{ backgroundColor: color.bg, color: color.text, border: `2px solid ${color.border}` }}
                  >
                    {char.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-lg" style={{ color: isSelected ? color.text : '#e8e6d9' }}>
                      {char.name}
                    </div>
                    <div className="text-muted text-xs font-mono">
                      {char.role} · {char.age} años
                    </div>
                    <div
                      className="text-xs font-serif italic mt-0.5 truncate"
                      style={{ color: isSelected ? color.text + 'aa' : '#6b6970' }}
                    >
                      {char.personality}
                    </div>
                  </div>
                  <div
                    className="text-xl flex-shrink-0 transition-all"
                    style={{ color: isSelected ? color.border : 'transparent' }}
                  >
                    ◉
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-accent/10 border border-accent/30 px-4 py-2 flex items-center justify-between rounded-sm">
            <span className="text-accent text-sm font-mono">{error}</span>
            <button onClick={onClearError} className="text-muted hover:text-cream text-xs font-mono ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => selectedId && onAccuse(selectedId)}
            disabled={!selectedId || isLoading}
            className="w-full py-4 font-mono text-sm tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedId ? '#c0392b' : '#111118',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: selectedId ? '#c0392b' : '#3a3a4e',
              color: '#e8e6d9',
            }}
          >
            {isLoading
              ? 'Procesando...'
              : selectedChar
              ? `Acusar a ${selectedChar.name.split(' ')[0]}`
              : 'Selecciona un sospechoso'}
          </button>

          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-full py-3 border border-noir-600 text-muted hover:text-cream hover:border-noir-400 font-mono text-xs tracking-widest uppercase transition-all"
          >
            ← Seguir investigando
          </button>
        </div>
      </div>
    </div>
  );
}

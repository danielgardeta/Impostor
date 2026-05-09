import React, { useState } from 'react';
import { Difficulty, Scenario } from '../types/game';

interface MainMenuProps {
  onStartDaily: () => void;
  onStartFree: (difficulty: Difficulty, scenario: Scenario) => void;
  isLoading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const difficulties: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'bisoño', label: 'Bisoño', desc: 'El topo comete errores evidentes' },
  { value: 'detective', label: 'Detective', desc: 'Inconsistencias si se presiona' },
  { value: 'inquisidor', label: 'Inquisidor', desc: 'Coartada sólida con fisuras ocultas' },
  { value: 'maestro', label: 'Maestro', desc: 'Solo un punto de ruptura exacto' },
];

const scenarios: { value: Scenario; label: string; icon: string }[] = [
  { value: 'oficina', label: 'Oficina', icon: '🏢' },
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'escuela', label: 'Escuela', icon: '🏫' },
  { value: 'viaje', label: 'Viaje', icon: '✈️' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'fiesta', label: 'Fiesta', icon: '🎭' },
];

export function MainMenu({ onStartDaily, onStartFree, isLoading, error, onClearError }: MainMenuProps) {
  const [showFreeConfig, setShowFreeConfig] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('detective');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('oficina');

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleFreeStart = () => {
    onStartFree(selectedDifficulty, selectedScenario);
    setShowFreeConfig(false);
  };

  return (
    <div className="min-h-screen bg-noir-950 grid-overlay flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Atmospheric background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-accent to-transparent opacity-60" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-accent to-transparent opacity-60" />
        <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-accent via-transparent to-transparent opacity-20" />
        <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-transparent via-transparent to-accent opacity-20" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-md w-full mx-auto text-center">
        {/* Logo */}
        <div className="mb-2">
          <div className="inline-block relative">
            <span className="text-8xl font-bold tracking-tighter text-cream font-serif" style={{ letterSpacing: '-0.05em' }}>
              MOLE
            </span>
            <span className="absolute -bottom-2 right-0 w-3 h-3 bg-accent rounded-full" />
          </div>
        </div>

        <p className="text-muted font-mono text-xs tracking-widest uppercase mb-1">
          Among Us meets Turing Test
        </p>

        <div className="w-16 h-px bg-accent mx-auto my-6 opacity-60" />

        <p className="text-cream/60 text-sm font-serif italic mb-8 leading-relaxed">
          Cuatro sospechosos. Doce preguntas. Uno miente.
          <br />
          Encuentra al topo antes de quedarte sin presupuesto.
        </p>

        {/* Mode buttons */}
        {!showFreeConfig ? (
          <div className="space-y-3">
            {/* Daily mode */}
            <button
              onClick={onStartDaily}
              disabled={isLoading}
              className="w-full group relative overflow-hidden"
            >
              <div className="noir-panel px-6 py-4 hover:border-gold transition-all duration-300 cursor-pointer group-hover:bg-noir-700">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-mono text-xs text-gold tracking-widest uppercase mb-1">
                      Modo Diario
                    </div>
                    <div className="text-cream font-serif text-lg">DIARIO</div>
                    <div className="text-muted text-xs font-mono mt-1 capitalize">{today}</div>
                  </div>
                  <div className="text-gold text-2xl opacity-80 group-hover:opacity-100 transition-opacity">
                    {isLoading ? '⏳' : '📅'}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500" />
            </button>

            {/* Free mode */}
            <button
              onClick={() => setShowFreeConfig(true)}
              disabled={isLoading}
              className="w-full group relative overflow-hidden"
            >
              <div className="noir-panel px-6 py-4 hover:border-cream/30 transition-all duration-300 cursor-pointer group-hover:bg-noir-700">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
                      Modo Libre
                    </div>
                    <div className="text-cream font-serif text-lg">LIBRE</div>
                    <div className="text-muted text-xs font-mono mt-1">Casos generados por IA</div>
                  </div>
                  <div className="text-cream/40 text-2xl group-hover:text-cream/80 transition-all">
                    ∞
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-cream/30 group-hover:w-full transition-all duration-500" />
            </button>

            {/* Duo mode (coming soon) */}
            <button disabled className="w-full opacity-30 cursor-not-allowed">
              <div className="noir-panel px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
                      Próximamente
                    </div>
                    <div className="text-cream/50 font-serif text-lg">DÚO</div>
                    <div className="text-muted text-xs font-mono mt-1">Cooperativo 2 jugadores</div>
                  </div>
                  <div className="text-muted text-2xl">🔒</div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Free mode configuration */
          <div className="noir-panel p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono text-gold text-xs tracking-widest uppercase">Configurar Partida Libre</h2>
              <button
                onClick={() => setShowFreeConfig(false)}
                className="text-muted hover:text-cream text-sm transition-colors font-mono"
              >
                ✕
              </button>
            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-3">
                Dificultad
              </label>
              <div className="grid grid-cols-2 gap-2">
                {difficulties.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDifficulty(d.value)}
                    className={`p-3 border text-left transition-all duration-200 ${
                      selectedDifficulty === d.value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-noir-500 hover:border-muted text-cream/70'
                    }`}
                  >
                    <div className="font-mono text-xs tracking-wide">{d.label}</div>
                    <div className="text-xs text-muted mt-1 font-serif">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario */}
            <div className="mb-6">
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-3">
                Escenario
              </label>
              <div className="grid grid-cols-3 gap-2">
                {scenarios.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedScenario(s.value)}
                    className={`p-3 border text-center transition-all duration-200 ${
                      selectedScenario === s.value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-noir-500 hover:border-muted text-cream/70'
                    }`}
                  >
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="font-mono text-xs">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFreeStart}
              disabled={isLoading}
              className="w-full noir-button-accent py-3 text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generando caso...' : 'Iniciar Interrogatorio'}
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-8 flex justify-center gap-8 text-center">
          <div>
            <div className="text-gold font-mono text-lg">—</div>
            <div className="text-muted text-xs font-mono tracking-wider uppercase">Racha</div>
          </div>
          <div className="w-px bg-noir-600" />
          <div>
            <div className="text-gold font-mono text-lg">—</div>
            <div className="text-muted text-xs font-mono tracking-wider uppercase">Ranking hoy</div>
          </div>
          <div className="w-px bg-noir-600" />
          <div>
            <div className="text-gold font-mono text-lg">12</div>
            <div className="text-muted text-xs font-mono tracking-wider uppercase">Preguntas</div>
          </div>
        </div>

        <div className="mt-8 text-muted text-xs font-mono">
          MOLE v1.0 — Powered by Claude
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="bg-noir-800 border border-accent/60 px-4 py-3 flex items-start gap-3">
            <span className="text-accent text-sm font-mono flex-1">{error}</span>
            <button
              onClick={onClearError}
              className="text-muted hover:text-cream font-mono text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-noir-950/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-gold font-mono text-sm tracking-widest uppercase animate-pulse mb-3">
              Generando caso...
            </div>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gold rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { GameState, RevealResult } from '../types/game';

const CHAR_COLORS = [
  { bg: '#1a2a4a', text: '#93c5fd', border: '#2563eb' },
  { bg: '#2d1b69', text: '#c4b5fd', border: '#7c3aed' },
  { bg: '#0f3d2e', text: '#6ee7b7', border: '#059669' },
  { bg: '#3d1a0a', text: '#fcd34d', border: '#d97706' },
];

interface RevealScreenProps {
  gameState: GameState;
  revealResult: RevealResult;
  onReturnToMenu: () => void;
}

export function RevealScreen({ gameState, revealResult, onReturnToMenu }: RevealScreenProps) {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [copied, setCopied] = useState(false);

  const { characters, title, mode, difficulty, questionsUsed, accusedId } = gameState;
  const { correct, moleId, score, lieRoadmap, revelationNarrative } = revealResult;

  const mole = characters.find(c => c.id === moleId);
  const moleIndex = characters.findIndex(c => c.id === moleId);
  const moleColor = CHAR_COLORS[moleIndex >= 0 ? moleIndex : 0];
  const accusedChar = accusedId ? characters.find(c => c.id === accusedId) : null;

  useEffect(() => {
    const t = setTimeout(() => setShowRoadmap(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const handleShare = () => {
    const BUDGET_MAX = 12;
    const diffEmoji: Record<string, string> = {
      bisoño: '🌱', detective: '🔍', inquisidor: '⚖️', maestro: '🃏',
    };

    const grid = Array.from({ length: BUDGET_MAX }, (_, i) => {
      if (i < questionsUsed) return correct ? '🟨' : '🟥';
      return '⬛';
    }).join('');

    const resultLine = correct
      ? `Encontré al topo en ${questionsUsed} preguntas. Puntuación: ${score}`
      : `No encontré al topo. Puntuación: ${score}`;

    const text = [
      `MOLE — ${title}`,
      `${diffEmoji[difficulty] || '🔍'} ${difficulty.toUpperCase()} ${correct ? '✅' : '❌'}`,
      '',
      grid,
      '',
      resultLine,
      '',
      'mole.game',
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-noir-950 vignette-red flex flex-col">
      {/* Hero */}
      <div className="relative px-4 py-12 text-center overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: correct
              ? 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 65%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(192,57,43,0.15) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 max-w-md mx-auto">
          {/* Status tag */}
          <div
            className="font-mono text-xs tracking-widest uppercase mb-3"
            style={{ color: correct ? '#c9a84c' : '#c0392b' }}
          >
            {correct ? '¡Caso resuelto!' : 'El topo escapó'}
          </div>

          {/* Main verdict */}
          <div
            className="font-serif text-6xl font-bold mb-5 animate-reveal"
            style={{
              color: correct ? '#c9a84c' : '#c0392b',
              textShadow: correct
                ? '0 0 40px rgba(201,168,76,0.35)'
                : '0 0 40px rgba(192,57,43,0.35)',
            }}
          >
            {correct ? 'RESUELTO' : 'FALLIDO'}
          </div>

          {/* Score */}
          <div className="text-muted font-mono text-xs tracking-widest uppercase mb-1">Puntuación</div>
          <div className="text-cream font-serif text-5xl mb-6">{score}</div>

          {/* Mole card */}
          <div className="bg-noir-800 border border-noir-600 p-4 rounded-sm animate-slide-up">
            <div className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
              El topo era...
            </div>
            <div className="flex items-center gap-4 justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl font-mono flex-shrink-0"
                style={{
                  backgroundColor: moleColor.bg,
                  color: moleColor.text,
                  border: `2px solid ${moleColor.border}`,
                }}
              >
                {mole?.avatar}
              </div>
              <div className="text-left">
                <div className="text-cream font-serif text-xl">{mole?.name}</div>
                <div className="text-muted font-mono text-xs">{mole?.role}</div>
              </div>
              <div className="text-accent text-2xl">●</div>
            </div>

            {!correct && accusedChar && (
              <div className="mt-3 pt-3 border-t border-noir-600 text-center">
                <span className="text-muted font-mono text-xs">
                  Acusaste a{' '}
                  <span className="text-cream">{accusedChar.name}</span> — inocente
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revelation content */}
      <div className="flex-1 px-4 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          {/* Narrative */}
          <div className="bg-noir-800 border border-noir-600 p-4 rounded-sm">
            <div className="text-gold font-mono text-xs tracking-widest uppercase mb-2">Crónica</div>
            <p className="text-cream/80 font-serif text-sm leading-relaxed italic">
              {revelationNarrative}
            </p>
          </div>

          {/* Lie roadmap (delayed reveal) */}
          {showRoadmap && (
            <div className="space-y-3 animate-fade-in">
              <div className="text-center">
                <span className="text-muted font-mono text-xs tracking-widest uppercase">
                  — Dosier confidencial del topo —
                </span>
              </div>

              <div className="bg-noir-800 border border-noir-600 p-4 rounded-sm">
                <div className="text-gold font-mono text-xs tracking-widest uppercase mb-2">
                  La verdad
                </div>
                <p className="text-cream/80 font-serif text-sm leading-relaxed">{lieRoadmap.truth}</p>
              </div>

              <div className="bg-noir-800 border p-4 rounded-sm" style={{ borderColor: 'rgba(192,57,43,0.4)' }}>
                <div className="text-accent font-mono text-xs tracking-widest uppercase mb-2">
                  Lo que ocultó
                </div>
                <p className="text-cream/80 font-serif text-sm leading-relaxed">{lieRoadmap.hiddenFact}</p>
              </div>

              <div className="bg-noir-800 border border-noir-600 p-4 rounded-sm">
                <div className="text-muted font-mono text-xs tracking-widest uppercase mb-2">
                  Su coartada falsa
                </div>
                <p className="text-cream/70 font-serif text-sm leading-relaxed italic">
                  "{lieRoadmap.falseNarrative}"
                </p>
              </div>

              <div className="bg-noir-800 border p-4 rounded-sm" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
                <div className="text-gold font-mono text-xs tracking-widest uppercase mb-2">
                  Punto de ruptura
                </div>
                <p className="text-cream/80 font-serif text-sm leading-relaxed">{lieRoadmap.breakingPoint}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <button
              onClick={handleShare}
              className="w-full py-3 border font-mono text-sm tracking-widest uppercase transition-all"
              style={{ borderColor: '#c9a84c', color: copied ? '#6b6970' : '#c9a84c' }}
            >
              {copied ? '¡Copiado al portapapeles!' : '↑ Compartir resultado'}
            </button>
            <button
              onClick={onReturnToMenu}
              className="w-full py-3 border border-noir-600 text-muted hover:text-cream hover:border-noir-400 font-mono text-xs tracking-widest uppercase transition-all"
            >
              ← Volver al menú
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GameState, Message } from '../types/game';

const CHAR_COLORS = [
  { bg: '#1a2a4a', text: '#93c5fd', border: '#2563eb' },
  { bg: '#2d1b69', text: '#c4b5fd', border: '#7c3aed' },
  { bg: '#0f3d2e', text: '#6ee7b7', border: '#059669' },
  { bg: '#3d1a0a', text: '#fcd34d', border: '#d97706' },
];

const BUDGET_MAX = 12;

type TargetMode = 'all' | 'single' | 'confront';

interface GameScreenProps {
  gameState: GameState;
  isLoading: boolean;
  error: string | null;
  onSendQuestion: (question: string, targetIds: string[] | 'all') => Promise<void>;
  onOpenAccusation: () => void;
  onClearError: () => void;
  onReturnToMenu: () => void;
}

interface Round {
  question: Message;
  answers: Message[];
  systemMsg?: Message;
}

export function GameScreen({
  gameState,
  isLoading,
  error,
  onSendQuestion,
  onOpenAccusation,
  onClearError,
  onReturnToMenu,
}: GameScreenProps) {
  const [question, setQuestion] = useState('');
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { characters, messages, budget, title, description, difficulty, mode } = gameState;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const charIndex = useMemo(
    () => new Map(characters.map((c, i) => [c.id, i])),
    [characters]
  );

  const toggleChar = useCallback(
    (charId: string) => {
      if (targetMode === 'single') {
        setSelectedIds([charId]);
      } else if (targetMode === 'confront') {
        setSelectedIds(prev => {
          if (prev.includes(charId)) return prev.filter(id => id !== charId);
          if (prev.length >= 2) return [prev[1], charId];
          return [...prev, charId];
        });
      }
    },
    [targetMode]
  );

  const handleTargetModeChange = (mode: TargetMode) => {
    setTargetMode(mode);
    setSelectedIds([]);
  };

  const questionCost = targetMode === 'all' ? 3 : targetMode === 'confront' ? 2 : 1;
  const hasEnoughBudget = budget >= questionCost;

  const canSend =
    question.trim().length > 0 &&
    !isLoading &&
    hasEnoughBudget &&
    (targetMode === 'all' ||
      (targetMode === 'single' && selectedIds.length === 1) ||
      (targetMode === 'confront' && selectedIds.length === 2));

  const handleSend = async () => {
    if (!canSend) return;
    const q = question.trim();
    setQuestion('');
    setSelectedIds([]);
    await onSendQuestion(q, targetMode === 'all' ? 'all' : selectedIds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const rounds = useMemo<Round[]>(() => {
    const result: Round[] = [];
    let current: Round | null = null;
    for (const msg of messages) {
      if (msg.type === 'question') {
        if (current) result.push(current);
        current = { question: msg, answers: [] };
      } else if (msg.type === 'answer' && current) {
        current.answers.push(msg);
      } else if (msg.type === 'system' && current) {
        current.systemMsg = msg;
      }
    }
    if (current) result.push(current);
    return result;
  }, [messages]);

  const difficultyLabels: Record<string, string> = {
    bisoño: 'BISOÑO',
    detective: 'DETECTIVE',
    inquisidor: 'INQUISIDOR',
    maestro: 'MAESTRO',
  };

  const pips = Array.from({ length: BUDGET_MAX }, (_, i) => {
    const used = BUDGET_MAX - budget;
    const isUsed = i < used;
    const isWarning = !isUsed && budget <= 4;
    return { isUsed, isWarning };
  });

  return (
    <div className="h-screen bg-noir-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-noir-900 border-b border-noir-600 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onReturnToMenu}
              className="text-muted hover:text-cream text-xs font-mono tracking-wider transition-colors flex-shrink-0"
            >
              ← Menú
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-gold font-mono text-xs tracking-widest">
                  {mode === 'daily' ? 'DIARIO' : 'LIBRE'}
                </span>
                <span className="text-noir-500 text-xs">·</span>
                <span className="text-muted font-mono text-xs">
                  {difficultyLabels[difficulty] || difficulty.toUpperCase()}
                </span>
              </div>
              <h1 className="text-cream font-serif text-base leading-tight truncate">{title}</h1>
            </div>
            <button
              onClick={onOpenAccusation}
              className="flex-shrink-0 bg-accent hover:bg-accent-dim border border-accent/50 text-cream font-mono text-xs px-3 py-2 tracking-widest uppercase transition-all"
            >
              Acusar
            </button>
          </div>

          {/* Budget pips */}
          <div className="flex items-center gap-2">
            <span className="text-muted font-mono text-xs">{budget}</span>
            <div className="flex gap-0.5">
              {pips.map((pip, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-sm transition-all duration-300"
                  style={{
                    backgroundColor: pip.isUsed
                      ? '#252532'
                      : pip.isWarning
                      ? '#c0392b'
                      : '#c9a84c',
                    border: `1px solid ${pip.isUsed ? '#3a3a4e' : pip.isWarning ? '#8b2020' : '#a07a30'}`,
                  }}
                />
              ))}
            </div>
            <span className="text-muted font-mono text-xs">preguntas</span>
          </div>
        </div>
      </div>

      {/* Case description */}
      <div className="bg-noir-800/40 border-b border-noir-700 px-4 py-2 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <p className="text-cream/60 font-serif text-xs italic leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Characters strip */}
      <div className="bg-noir-900/40 border-b border-noir-700 px-4 py-2 flex-shrink-0">
        <div className="max-w-2xl mx-auto grid grid-cols-4 gap-2">
          {characters.map((char, i) => {
            const color = CHAR_COLORS[i];
            const isSelected = selectedIds.includes(char.id);
            const isSelectable = targetMode === 'single' || targetMode === 'confront';
            return (
              <button
                key={char.id}
                onClick={() => isSelectable && toggleChar(char.id)}
                disabled={!isSelectable}
                className="p-2 border text-left transition-all duration-200 rounded-sm"
                style={{
                  backgroundColor: isSelected ? color.bg : 'transparent',
                  borderColor: isSelected ? color.border : '#3a3a4e',
                  cursor: isSelectable ? 'pointer' : 'default',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono flex-shrink-0"
                    style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                  >
                    {char.avatar}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xs font-mono truncate leading-tight"
                      style={{ color: isSelected ? color.text : '#e8e6d9' }}
                    >
                      {char.name.split(' ')[0]}
                    </div>
                    <div className="text-muted truncate leading-tight" style={{ fontSize: '0.6rem' }}>
                      {char.role}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {rounds.length === 0 && (
            <div className="text-center py-16">
              <div className="text-muted font-mono text-xs tracking-widest uppercase mb-3">
                — Sala de interrogatorio —
              </div>
              <p className="text-cream/30 font-serif text-sm italic">
                Tienes {budget} preguntas para encontrar al topo.
                <br />
                Pregunta a todos, a uno, o confronta a dos sospechosos.
              </p>
            </div>
          )}

          {rounds.map(round => (
            <div key={round.question.id} className="space-y-3">
              {/* Question bubble */}
              <div className="flex justify-end">
                <div className="max-w-xs bg-noir-600 border border-noir-500 px-4 py-3 rounded-sm">
                  <p className="text-cream text-sm font-serif">{round.question.content}</p>
                  <div className="mt-1.5 flex items-center gap-1 justify-end">
                    <span className="text-muted text-xs font-mono">
                      {round.question.cost === 3
                        ? 'Todos'
                        : round.question.cost === 2
                        ? 'Confrontación'
                        : 'Individual'}{' '}
                      · {round.question.cost}p
                    </span>
                  </div>
                </div>
              </div>

              {/* Answer bubbles */}
              <div className="space-y-2">
                {round.answers.map(answer => {
                  const char = characters.find(c => c.id === answer.characterId);
                  const idx = char ? (charIndex.get(char.id) ?? 0) : 0;
                  const color = CHAR_COLORS[idx];
                  return (
                    <div key={answer.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-mono flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                      >
                        {char?.avatar ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-xs font-mono font-semibold" style={{ color: color.text }}>
                            {char?.name ?? 'Desconocido'}
                          </span>
                          <span className="text-muted font-mono" style={{ fontSize: '0.6rem' }}>
                            {char?.role}
                          </span>
                        </div>
                        <div className="bg-noir-800 border border-noir-600 px-4 py-3 rounded-sm">
                          <p className="text-cream/90 text-sm font-serif leading-relaxed">{answer.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {round.systemMsg && (
                <div className="text-center">
                  <span className="text-muted text-xs font-mono tracking-wider">
                    — {round.systemMsg.content} —
                  </span>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-accent/10 border-t border-accent/30 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="text-accent text-sm font-mono">{error}</span>
            <button
              onClick={onClearError}
              className="text-muted hover:text-cream text-xs font-mono ml-4 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-noir-900 border-t border-noir-600 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Target mode tabs */}
          <div className="flex gap-1.5">
            {(['all', 'single', 'confront'] as TargetMode[]).map(mode => {
              const labels = { all: 'Todos · 3pts', single: 'Individual · 1pt', confront: 'Confrontar · 2pts' };
              const costs = { all: 3, single: 1, confront: 2 };
              const active = targetMode === mode;
              const affordable = budget >= costs[mode];
              return (
                <button
                  key={mode}
                  onClick={() => handleTargetModeChange(mode)}
                  disabled={!affordable}
                  className="flex-1 py-1.5 font-mono text-xs tracking-wider border transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                    borderColor: active ? '#c9a84c' : '#3a3a4e',
                    color: active ? '#c9a84c' : affordable ? '#6b6970' : '#3a3a4e',
                    cursor: affordable ? 'pointer' : 'not-allowed',
                  }}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>

          {/* Selection hint */}
          {targetMode !== 'all' && (
            <div className="text-muted text-xs font-mono text-center" style={{ minHeight: '1rem' }}>
              {targetMode === 'single'
                ? selectedIds.length === 0
                  ? 'Haz clic en un personaje arriba para seleccionarlo'
                  : `Preguntando a: ${characters.find(c => c.id === selectedIds[0])?.name}`
                : selectedIds.length < 2
                ? `Selecciona ${2 - selectedIds.length} personaje${selectedIds.length === 0 ? 's' : ''} más`
                : `Confrontando: ${selectedIds.map(id => characters.find(c => c.id === id)?.name?.split(' ')[0]).join(' vs ')}`}
            </div>
          )}

          {/* Input + send */}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                budget === 0
                  ? 'Sin preguntas. Debes acusar ahora.'
                  : 'Escribe tu pregunta... (Enter para enviar)'
              }
              disabled={budget === 0 || isLoading}
              rows={2}
              className="flex-1 bg-noir-700 border border-noir-500 text-cream placeholder-muted focus:outline-none focus:border-gold px-3 py-2 font-serif text-sm resize-none transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex-shrink-0 self-stretch px-4 bg-noir-700 border border-noir-500 text-cream hover:bg-noir-600 hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs tracking-wider uppercase transition-all"
            >
              {isLoading ? (
                <div className="flex flex-col gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-gold rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

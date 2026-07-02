'use client';

import { useEffect, useRef, useState } from 'react';
import {
  SPEND_CONTEXTS,
  DEFAULT_SPEND_CONTEXT,
  type SpendContext,
} from '@/lib/memory';

interface MemorySheetProps {
  /** Small context line, e.g. "Mr Bean · $4.20". */
  caption?: string;
  /** Called once with the chosen context + note when the sheet resolves. */
  onResolve: (context: SpendContext, note: string) => void;
}

const NOTE_MAX = 40;
const DEFAULT_DEADLINE_MS = 5000;
const TYPING_DEADLINE_MS = 8000;
const TICK_MS = 50;

/**
 * Step 2 of the memory spec — one bottom sheet, two interactions max.
 *  - Tap a context chip → save immediately.
 *  - Do nothing for 5s → save with "Worth It" + no note.
 *  - Start typing a note → countdown resets to 8s and a Save button appears.
 * The keyboard is never forced open (the note field is not autofocused).
 */
export default function MemorySheet({ caption, onResolve }: MemorySheetProps) {
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<SpendContext | null>(null);
  const [typing, setTyping] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 1

  const resolvedRef = useRef(false);
  const startRef = useRef(Date.now());
  const deadlineRef = useRef(DEFAULT_DEADLINE_MS);
  // Keep the latest note/selection available to the timer without resubscribing.
  const noteRef = useRef('');
  const selectedRef = useRef<SpendContext | null>(null);

  const resolve = (context: SpendContext) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onResolve(context, noteRef.current.trim());
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(1, elapsed / deadlineRef.current));
      if (elapsed >= deadlineRef.current) {
        resolve(selectedRef.current ?? DEFAULT_SPEND_CONTEXT);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChip = (context: SpendContext) => {
    setSelected(context);
    selectedRef.current = context;
    resolve(context); // tapping a chip saves immediately
  };

  const handleNoteChange = (value: string) => {
    const clipped = value.slice(0, NOTE_MAX);
    setNote(clipped);
    noteRef.current = clipped;
    if (!typing) {
      // First keystroke: extend the window to 8s and reveal Save.
      setTyping(true);
      startRef.current = Date.now();
      deadlineRef.current = TYPING_DEADLINE_MS;
      setProgress(0);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 3200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--off-white)',
          border: '2.5px solid var(--border-color)',
          borderBottom: 'none',
          width: '100%',
          maxWidth: '430px',
          padding: '22px 20px 0',
          position: 'relative',
        }}
      >
        {caption && (
          <div
            className="text-mono"
            style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}
          >
            {caption}
          </div>
        )}

        {/* The single question */}
        <div
          style={{
            fontFamily: "'Space Grotesk', var(--font-display), sans-serif",
            fontWeight: 700,
            fontSize: '1.4rem',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
          }}
        >
          this spend was...
        </div>

        {/* 2 x 3 grid of context chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {SPEND_CONTEXTS.map((chip) => {
            const active = selected === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleChip(chip.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 12px',
                  border: '2.5px solid var(--border-color)',
                  background: active ? 'var(--nets-red)' : 'var(--card-bg)',
                  color: active ? '#fff' : 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.08s steps(2)',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{chip.emoji}</span>
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Optional note — never autofocused, so no forced keyboard */}
        <input
          type="text"
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="add a note... (optional)"
          maxLength={NOTE_MAX}
          style={{
            width: '100%',
            padding: '11px 12px',
            border: '2px solid var(--border-color)',
            background: 'var(--card-bg)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            outline: 'none',
            marginBottom: typing ? '12px' : '18px',
          }}
        />

        {typing && (
          <button
            className="btn-primary"
            onClick={() => resolve(selectedRef.current ?? DEFAULT_SPEND_CONTEXT)}
            style={{ width: '100%', marginBottom: '18px' }}
          >
            Save memory
          </button>
        )}

        {/* Countdown progress bar */}
        <div style={{ height: '4px', background: 'var(--divider-color)' }}>
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--nets-red)',
              transition: `width ${TICK_MS}ms linear`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

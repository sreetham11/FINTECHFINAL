'use client';

import { useState, useRef, useEffect } from 'react';
import Typewriter from './Typewriter';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const QUICK_PROMPTS = [
  'Am I overspending on food?',
  'How much should I save for Bangkok?',
  'Break down my spending this month',
];

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && chatHistory.length > 0) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) return;

    if (trimmed.length < 2) {
      setInputError("say a bit more so I can help you 👀");
      return;
    }

    setInputError(null);
    setInputValue('');
    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    setChatHistory(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build history for API (exclude last user message, we send it separately)
    const apiHistory = chatHistory.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    try {
      const res = await fetch('/api/chat-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: apiHistory,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "Budget coach is taking a break — try again in a sec 😅";
      setChatHistory(prev => [...prev, { role: 'ai', text: answer }]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: 'ai', text: "Budget coach is taking a break — try again in a sec 😅" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const isEmpty = chatHistory.length === 0;

  return (
    <div style={{ position: 'fixed', bottom: '90px', left: '16px', zIndex: 100 }}>
      {isOpen && (
        <div
          className="animate-slide-up"
          style={{
            position: 'absolute',
            bottom: '72px',
            left: '0',
            width: '320px',
            maxHeight: '480px',
            background: 'var(--card-bg)',
            border: '2.5px solid var(--ink-black)',
            boxShadow: '6px 6px 0 var(--ink-black)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '0',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--ink-black)',
              color: '#fff',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Budget Coach
                </div>
                <div
                  style={{
                    fontSize: '0.6rem',
                    opacity: 0.6,
                    fontFamily: 'monospace',
                  }}
                >
                  Powered by Claude AI
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: 0,
            }}
          >
            {isEmpty && (
              <>
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#f0f0f0',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    borderBottomLeftRadius: '0',
                    border: '1.5px solid var(--ink-black)',
                    fontSize: '0.82rem',
                    maxWidth: '90%',
                    lineHeight: '1.4',
                  }}
                >
                  Hey! I&apos;m your NETS Quest Budget Coach 💸 Ask me anything about your spending, savings goals, or how to prep for your next trip!
                </div>

                {/* Quick prompts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleQuickPrompt(prompt)}
                      style={{
                        background: 'transparent',
                        border: '1.5px solid var(--nets-red)',
                        color: 'var(--nets-red)',
                        borderRadius: '8px',
                        padding: '7px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            )}

            {chatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--nets-red)' : '#f0f0f0',
                  color: msg.role === 'user' ? '#fff' : '#1A1A1A',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? '0' : '12px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '0' : '12px',
                  border: '1.5px solid var(--ink-black)',
                  fontSize: '0.82rem',
                  maxWidth: '88%',
                  lineHeight: '1.45',
                }}
              >
                {msg.role === 'ai' && i === chatHistory.length - 1 ? (
                  <Typewriter text={msg.text} speed={18} />
                ) : (
                  msg.text
                )}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#f0f0f0',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderBottomLeftRadius: '0',
                  border: '1.5px solid var(--ink-black)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                <span className="skeleton-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#999' }} />
                <span className="skeleton-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#999', animationDelay: '0.15s' }} />
                <span className="skeleton-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#999', animationDelay: '0.3s' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input error */}
          {inputError && (
            <div
              style={{
                padding: '4px 12px',
                fontSize: '0.72rem',
                color: 'var(--nets-red)',
                fontStyle: 'italic',
                borderTop: '1px solid var(--divider-color)',
                background: 'var(--card-bg)',
              }}
            >
              {inputError}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              borderTop: '2.5px solid var(--ink-black)',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Ask about your spending..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                outline: 'none',
                background: 'var(--body-bg)',
                fontFamily: 'inherit',
                fontSize: '0.82rem',
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0 16px',
                background: isLoading ? '#999' : 'var(--nets-red)',
                color: '#fff',
                border: 'none',
                borderLeft: '2.5px solid var(--ink-black)',
                fontWeight: 900,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              SEND
            </button>
          </form>
        </div>
      )}

      {/* FAB */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isOpen ? '#555' : 'var(--ink-black)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '4px 4px 0 var(--nets-blue)',
          border: '2.5px solid var(--ink-black)',
          cursor: 'pointer',
          fontSize: isOpen ? '1.1rem' : '1.4rem',
          transition: 'all 0.2s',
          userSelect: 'none',
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </div>
    </div>
  );
}

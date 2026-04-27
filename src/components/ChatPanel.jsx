import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { isChatConfigured } from '../api/anthropic';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';

export default function ChatPanel({ isOpen, onClose }) {
  const { messages, isLoading, error, sendMessage, clearChat, dismissError } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const configured = isChatConfigured();

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && configured) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, configured]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 400,
      background: '#0f172a',
      borderLeft: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0f172a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Sprint Assistant</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>Powered by Claude + Monday.com</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear conversation"
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, padding: '2px 6px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }}>
        {!configured ? (
          <SetupScreen />
        ) : messages.length === 0 ? (
          <EmptyState onSelect={sendMessage} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <ThinkingIndicator />}
            {error && <ErrorBanner message={error} onDismiss={dismissError} onRetry={() => { dismissError(); }} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {configured && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          background: '#0f172a',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#1e293b',
              color: 'white',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              maxHeight: 100,
              overflow: 'auto',
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '8px 14px',
              background: input.trim() && !isLoading ? '#6366f1' : '#334155',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onSelect }) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 20, padding: '0 0 0 4px' }}>
        Ask me anything about your sprints, projects, or team workload. I can query Monday.com in real-time.
      </div>
      <SuggestedPrompts onSelect={onSelect} />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px 12px', color: '#64748b', fontSize: 13 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: '#1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
      }}>
        🤖
      </div>
      <span style={{ color: '#6366f1' }}>Querying Monday.com</span>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        <Dot delay="0s" /><Dot delay="0.2s" /><Dot delay="0.4s" />
      </span>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span style={{
      width: 5, height: 5, borderRadius: '50%', background: '#6366f1',
      display: 'inline-block',
      animation: 'chatDotPulse 1s ease-in-out infinite',
      animationDelay: delay,
    }} />
  );
}

function ErrorBanner({ message, onDismiss }) {
  const isMissingKey = message === 'MISSING_API_KEY';
  return (
    <div style={{
      margin: '4px 16px 12px',
      padding: '10px 14px',
      background: '#1e1020',
      border: '1px solid #7f1d1d',
      borderRadius: 8,
      color: '#fca5a5',
      fontSize: 12,
    }}>
      {isMissingKey
        ? 'Anthropic API key is not configured. Add VITE_ANTHROPIC_API_KEY to your .env file and restart the dev server.'
        : `Error: ${message}`}
      <button
        onClick={onDismiss}
        style={{ marginLeft: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
      >
        Dismiss
      </button>
    </div>
  );
}

function SetupScreen() {
  return (
    <div style={{ padding: '24px 20px', color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
      <div style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Setup Required</div>
      <p style={{ margin: '0 0 12px' }}>
        To use the Sprint Assistant, add your Anthropic API key to the <code style={{ color: '#6366f1' }}>.env</code> file:
      </p>
      <div style={{
        background: '#1e293b', borderRadius: 6, padding: '10px 14px',
        fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', marginBottom: 12,
      }}>
        VITE_ANTHROPIC_API_KEY=sk-ant-...
      </div>
      <p style={{ margin: 0 }}>
        Then restart the dev server with <code style={{ color: '#6366f1' }}>npm run dev</code>.
      </p>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  { label: '📊 Quarterly health', text: "What's the overall health of Q1 2026 commitments?" },
  { label: '🔴 Overdue items',    text: 'What user stories are overdue right now?' },
  { label: '🚧 Blocked work',     text: 'What items are currently blocked across all projects?' },
  { label: '📋 Release status',   text: 'Show me the status of all active releases' },
  { label: '👥 Team workload',    text: 'Who has the most assigned stories right now?' },
];

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10, marginTop: 0 }}>
        Try asking:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SUGGESTED_PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => onSelect(p.text)}
            style={{
              textAlign: 'left',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#cbd5e1',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#273549'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

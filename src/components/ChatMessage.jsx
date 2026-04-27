/* Simple inline markdown renderer — no external deps */
function MdLine({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function SimpleMarkdown({ children }) {
  const lines = (children || '').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      out.push(
        <pre key={i} style={{ background: '#0f172a', borderRadius: 6, padding: '8px 10px', overflowX: 'auto', margin: '6px 0', fontSize: 12 }}>
          <code style={{ color: '#a5f3fc', fontFamily: 'monospace' }}>{codeLines.join('\n')}</code>
        </pre>
      );
      i++; continue;
    }

    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const sz = hMatch[1].length === 1 ? 15 : hMatch[1].length === 2 ? 14 : 13;
      out.push(<div key={i} style={{ fontWeight: 700, fontSize: sz, margin: '8px 0 4px' }}><MdLine text={hMatch[2]} /></div>);
      i++; continue;
    }

    if (/^[-*•]\s/.test(trimmed)) {
      out.push(
        <div key={i} style={{ display: 'flex', gap: 6, margin: '2px 0' }}>
          <span style={{ color: '#818cf8', flexShrink: 0 }}>•</span>
          <span><MdLine text={trimmed.replace(/^[-*•]\s/, '')} /></span>
        </div>
      );
      i++; continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      out.push(
        <div key={i} style={{ display: 'flex', gap: 6, margin: '2px 0' }}>
          <span style={{ color: '#818cf8', flexShrink: 0, minWidth: 16 }}>{numMatch[1]}.</span>
          <span><MdLine text={numMatch[2]} /></span>
        </div>
      );
      i++; continue;
    }

    if (trimmed === '') {
      out.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    out.push(<div key={i} style={{ margin: '1px 0' }}><MdLine text={trimmed} /></div>);
    i++;
  }

  return <div>{out}</div>;
}

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12, padding: '0 16px' }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          🤖
        </div>
      )}
      <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isUser ? '#6366f1' : '#1e293b', color: isUser ? 'white' : '#e2e8f0', fontSize: 13, lineHeight: 1.6 }}>
        {isUser
          ? <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
          : <SimpleMarkdown>{content}</SimpleMarkdown>
        }
      </div>
    </div>
  );
}

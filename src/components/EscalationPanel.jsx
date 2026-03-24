import { useState } from 'react';
import HealthBadge from './HealthBadge';
import { HEALTH_CONFIG, HEALTH_ORDER } from '../hooks/useQuarterlyData';

function daysLabel(endDate) {
  const days = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

export default function EscalationPanel({ escalations }) {
  const [open, setOpen] = useState(true);
  if (escalations.length === 0) return null;

  const grouped = {};
  escalations.forEach(s => { (grouped[s.health] = grouped[s.health] || []).push(s); });
  const healthOrder = ['OVERDUE', 'AT_RISK', 'BEHIND', 'BLOCKED'];

  const td = { padding: '9px 14px', borderBottom: '1px solid #fef2f2', fontSize: 13, verticalAlign: 'middle' };

  return (
    <div style={{ borderRadius: 10, border: '1px solid #fecaca', overflow: 'hidden', marginBottom: 20 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#fee2e2', cursor: 'pointer', borderBottom: open ? '1px solid #fecaca' : 'none' }}
      >
        <span style={{ fontSize: 16 }}>🔴</span>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626', flex: 1 }}>
          Escalation Panel — Items Needing Attention ({escalations.length})
        </div>
        <div style={{ fontSize: 14, color: '#dc2626', userSelect: 'none' }}>{open ? '▴' : '▾'}</div>
      </div>

      {open && (
        <div style={{ background: 'white' }}>
          {healthOrder.filter(h => grouped[h]?.length).map(health => (
            <div key={health}>
              <div style={{ padding: '8px 18px', background: HEALTH_CONFIG[health]?.bg, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HealthBadge health={health} small />
                <span style={{ fontSize: 12, color: '#64748b' }}>{grouped[health].length} item{grouped[health].length !== 1 ? 's' : ''}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {grouped[health].map(story => (
                    <tr key={story.id}>
                      <td style={{ ...td, width: 110, fontWeight: 700, fontSize: 12, color: '#6366f1' }}>
                        {story.boardName.replace(/\s*Project Board\s*$/i, '')}
                      </td>
                      <td style={td}>
                        <a href={story.mondayUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >{story.name}</a>
                      </td>
                      <td style={{ ...td, width: 170 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: story.statusColor }} />
                          {story.status}
                        </span>
                      </td>
                      <td style={{ ...td, width: 90, fontSize: 12, color: '#94a3b8' }}>
                        {story.quarter?.endDate ? `Due ${story.quarter.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '—'}
                      </td>
                      <td style={{ ...td, width: 110, fontSize: 12, fontWeight: 700, color: HEALTH_CONFIG[health]?.color }}>
                        {story.quarter?.endDate ? daysLabel(story.quarter.endDate) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

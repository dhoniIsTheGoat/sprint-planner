import { useState } from 'react';
import HealthBadge from './HealthBadge';
import { HEALTH_ORDER } from '../hooks/useQuarterlyData';

function formatTimeline(text) {
  if (!text) return '—';
  const parts = text.split(' - ');
  if (parts.length < 2) return text;
  const fmt = d => { const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  return `${fmt(parts[0])} — ${fmt(parts[1])}`;
}

const COLS = [
  { key: 'name',     label: 'Story'   },
  { key: 'status',   label: 'Status'  },
  { key: 'timeline', label: 'Timeline'},
  { key: 'health',   label: 'Health'  },
  { key: 'priority', label: 'Priority'},
  { key: 'owner',    label: 'Owner'   },
];

export default function StoryTable({ stories }) {
  const [sortKey, setSortKey] = useState('health');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = [...stories].sort((a, b) => {
    let va, vb;
    if (sortKey === 'health')    { va = HEALTH_ORDER[a.health] ?? 99; vb = HEALTH_ORDER[b.health] ?? 99; }
    else if (sortKey === 'timeline') { va = a.quarter?.endDate?.getTime() ?? 0; vb = b.quarter?.endDate?.getTime() ?? 0; }
    else { va = (a[sortKey] || '').toLowerCase(); vb = (b[sortKey] || '').toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const th = { padding: '8px 12px', background: '#f1f5f9', fontWeight: 600, fontSize: 11, color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 };
  const td = { padding: '9px 12px', borderBottom: '1px solid #f8fafc', fontSize: 13, color: '#374151', verticalAlign: 'middle' };

  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead>
          <tr>
            {COLS.map(col => (
              <th key={col.key} style={{ ...th, color: sortKey === col.key ? '#6366f1' : '#64748b' }} onClick={() => handleSort(col.key)}>
                {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((story, i) => (
            <tr key={story.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
              <td style={td}>
                <a
                  href={story.mondayUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {story.name}
                </a>
                {story.group?.title && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{story.group.title}</div>}
              </td>
              <td style={td}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: story.statusColor, flexShrink: 0 }} />
                  {story.status}
                </span>
              </td>
              <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{formatTimeline(story.timeline)}</td>
              <td style={td}><HealthBadge health={story.health} small /></td>
              <td style={{ ...td, fontSize: 12 }}>
                {story.priority
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: story.priorityColor }} />{story.priority}</span>
                  : '—'}
              </td>
              <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{story.owner || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

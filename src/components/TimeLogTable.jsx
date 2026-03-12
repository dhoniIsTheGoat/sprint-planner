import { useState } from 'react';

const th = {
  padding: '10px 14px',
  background: '#f1f5f9',
  fontWeight: 600,
  color: '#475569',
  fontSize: 12,
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none',
  textAlign: 'left',
};
const td = {
  padding: '9px 14px',
  borderBottom: '1px solid #f1f5f9',
  color: '#374151',
  fontSize: 13,
};

const COLS = [
  { key: 'userName',    label: 'Team Member' },
  { key: 'productName', label: 'Product'     },
  { key: 'boardName',   label: 'Board'       },
  { key: 'taskName',    label: 'Task'        },
  { key: 'hours',       label: 'Hours'       },
];

export default function TimeLogTable({ entries }) {
  const [sortKey, setSortKey] = useState('userName');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...entries].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    av = (av || '').toLowerCase();
    bv = (bv || '').toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <thead>
          <tr>
            {COLS.map(c => (
              <th key={c.key} style={{ ...th, textAlign: c.key === 'hours' ? 'right' : 'left' }} onClick={() => handleSort(c.key)}>
                {c.label}{arrow(c.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
              <td style={{ ...td, fontWeight: 500, color: '#1e293b' }}>{e.userName}</td>
              <td style={td}>{e.productName}</td>
              <td style={{ ...td, color: '#64748b' }}>{e.boardName}</td>
              <td style={{ ...td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.taskName}>
                {e.taskName}
              </td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#6366f1' }}>
                {e.hours.toFixed(1)}h
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...td, textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                No time entries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

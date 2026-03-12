import { useState, useMemo } from 'react';

const td = {
  padding: '10px 14px',
  borderBottom: '1px solid #f1f5f9',
  color: '#374151',
  fontSize: 13,
};

const COLS = [
  { key: 'name',         label: 'Board Name'     },
  { key: 'workspace',    label: 'Workspace'       },
  { key: 'board_kind',   label: 'Type'            },
  { key: 'mappedProduct',label: 'Mapped Product'  },
];

export default function BoardMappingTable({ boards, products, mappings, onMappingChange }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = key => {
    if (key === 'mappedProduct') return; // dropdown column — not sortable
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => [...boards].sort((a, b) => {
    let av = sortKey === 'workspace' ? (a.workspace?.name || '') : (a[sortKey] || '');
    let bv = sortKey === 'workspace' ? (b.workspace?.name || '') : (b[sortKey] || '');
    av = av.toLowerCase(); bv = bv.toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  }), [boards, sortKey, sortDir]);

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const thStyle = (key) => ({
    padding: '10px 14px',
    background: '#f1f5f9',
    fontWeight: 600,
    color: sortKey === key ? '#6366f1' : '#475569',
    textAlign: 'left',
    fontSize: 12,
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    cursor: key === 'mappedProduct' ? 'default' : 'pointer',
    userSelect: 'none',
  });

  return (
    <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontSize: 13 }}>
        <thead>
          <tr>
            {COLS.map(c => (
              <th key={c.key} style={{ ...thStyle(c.key), minWidth: c.key === 'mappedProduct' ? 200 : undefined }}
                onClick={() => handleSort(c.key)}>
                {c.label}{arrow(c.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((board, i) => {
            const mapped = mappings[board.id]?.productName || '';
            const productExists = !mapped || products.some(p => p.name === mapped);
            return (
              <tr key={board.id} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                <td style={{ ...td, fontWeight: 500, color: '#1e293b' }}>
                  {board.name}
                  {!productExists && (
                    <span title="Previously mapped product no longer exists" style={{
                      marginLeft: 8,
                      background: '#fef3c7',
                      color: '#d97706',
                      borderRadius: 99,
                      padding: '1px 7px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      stale
                    </span>
                  )}
                </td>
                <td style={{ ...td, color: '#64748b' }}>{board.workspace?.name || '—'}</td>
                <td style={{ ...td, color: '#64748b' }}>{board.board_kind || '—'}</td>
                <td style={td}>
                  <select
                    value={mapped}
                    onChange={e => onMappingChange(board.id, board.name, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 13,
                      background: mapped ? '#f0fdf4' : 'white',
                      color: '#1e293b',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">— Not Mapped —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

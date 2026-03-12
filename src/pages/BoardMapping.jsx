import { useState, useEffect, useMemo } from 'react';
import { fetchBoards } from '../api/monday';
import BoardMappingTable from '../components/BoardMappingTable';

const STORAGE_KEY = 'sprint_planner_v4';
const MAP_KEY     = 'mondayBoardProductMap';

const btn = { padding: '8px 18px', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 };

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).products || [] : [];
  } catch {
    return [];
  }
}

function loadMappings() {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function BoardMapping() {
  const [boards,   setBoards]   = useState([]);
  const [status,   setStatus]   = useState('loading'); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('');
  const [search,   setSearch]   = useState('');
  const [mappings, setMappings] = useState(loadMappings);
  const [saved,    setSaved]    = useState(false);

  const products = useMemo(() => loadProducts(), []);

  useEffect(() => {
    fetchBoards()
      .then(b => {
        const ALLOWED = new Set(['Connect', 'CRM', 'Prime UI', 'Standalone Products', 'Support', 'Deployments']);
        const filtered = b.filter(b =>
          ALLOWED.has(b.workspace?.name) &&
          !/^subitems/i.test(b.name) &&
          (
            /[\s-](dev|testing)$/i.test(b.name) ||
            (b.workspace?.name === 'Connect' && /deployment/i.test(b.name))
          )
        );
        setBoards(filtered);

        // Auto-map any unmapped Testing boards to "Product Testing"
        setMappings(prev => {
          const next = { ...prev };
          filtered.forEach(board => {
            if (!next[board.id] && /[\s-]testing$/i.test(board.name)) {
              next[board.id] = { boardName: board.name, productName: 'Product Testing' };
            }
          });
          return next;
        });

        setStatus('ready');
      })
      .catch(err => {
        const missing = err.message === 'MISSING_TOKEN';
        setErrorMsg(missing
          ? 'No API token found. Add VITE_MONDAY_API_TOKEN to your .env file and restart the dev server.'
          : `Failed to fetch boards: ${err.message}`
        );
        setStatus('error');
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? boards.filter(b => b.name.toLowerCase().includes(q) || (b.workspace?.name || '').toLowerCase().includes(q)) : boards;
  }, [boards, search]);

  const mappedCount = Object.values(mappings).filter(v => v.productName).length;

  const handleChange = (boardId, boardName, productName) => {
    setSaved(false);
    setMappings(prev => {
      const next = { ...prev };
      if (productName) {
        next[boardId] = { boardName, productName };
      } else {
        delete next[boardId];
      }
      return next;
    });
  };

  const saveMappings = () => {
    localStorage.setItem(MAP_KEY, JSON.stringify(mappings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Board ↔ Product Mapping</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
          Link Monday.com boards to your sprint planner products so time tracking data can be attributed correctly.
        </p>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div>Fetching boards from Monday.com…</div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: 20, color: '#dc2626', fontSize: 14 }}>
          <strong>Error:</strong> {errorMsg}
          {errorMsg.includes('.env') && (
            <pre style={{ marginTop: 10, background: '#fff5f5', borderRadius: 6, padding: 12, fontSize: 12, color: '#7f1d1d' }}>
{`# .env (project root)
VITE_MONDAY_API_TOKEN=your_token_here`}
            </pre>
          )}
        </div>
      )}

      {status === 'ready' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search boards or workspaces…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', width: 280 }}
            />
            <div style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>
              <strong style={{ color: '#1e293b' }}>{mappedCount}</strong> of <strong style={{ color: '#1e293b' }}>{boards.length}</strong> boards mapped
            </div>
          </div>

          <BoardMappingTable
            boards={filtered}
            products={products}
            mappings={mappings}
            onMappingChange={handleChange}
          />

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={saveMappings} style={{ ...btn, background: '#6366f1' }}>
              Save Mappings
            </button>
            {saved && (
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                Saved!
              </span>
            )}
          </div>

          {filtered.length === 0 && search && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
              No boards match &ldquo;{search}&rdquo;
            </div>
          )}
        </>
      )}
    </div>
  );
}

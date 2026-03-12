import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTimeData } from '../hooks/useTimeData';
import SummaryCards  from '../components/SummaryCards';
import TimeLogTable  from '../components/TimeLogTable';
import PersonSummary from '../components/PersonSummary';

// Returns the Monday of the week containing `date`
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

function offsetWeek(weekStart, delta) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta * 7);
  return d;
}

export default function TimeLog() {
  const { entries, users, status, errorMsg, mappings, refresh } = useTimeData();

  const [productFilter, setProductFilter] = useState('');
  const [personFilter,  setPersonFilter]  = useState('');
  const [weekStart,     setWeekStart]     = useState(() => getWeekStart(new Date()));
  const [allTime,       setAllTime]       = useState(false);
  const [view,          setView]          = useState('table');

  const hasMappings = Object.values(mappings).some(v => v.productName);

  const products = useMemo(() => [...new Set(entries.map(e => e.productName))].sort(), [entries]);
  const userList  = useMemo(() => {
    const seen = new Set();
    return entries
      .filter(e => { if (seen.has(e.userId)) return false; seen.add(e.userId); return true; })
      .map(e => ({ id: e.userId, name: e.userName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const filtered = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return entries.filter(e => {
      if (productFilter && e.productName !== productFilter) return false;
      if (personFilter  && e.userId      !== personFilter)  return false;
      if (!allTime && e.startedAt) {
        const d = new Date(e.startedAt);
        if (d < weekStart || d >= weekEnd) return false;
      }
      return true;
    });
  }, [entries, productFilter, personFilter, weekStart, allTime]);

  const selStyle = {
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 13,
    background: 'white',
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer',
  };

  const navBtnStyle = {
    padding: '5px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: 'white',
    fontSize: 13,
    cursor: 'pointer',
    color: '#475569',
    fontWeight: 500,
    lineHeight: 1,
  };

  const hasActiveFilters = productFilter || personFilter || !allTime;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Hours Logged</h1>
          <button
            onClick={refresh}
            disabled={status === 'loading'}
            title="Re-fetch data from Monday.com"
            style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', fontSize: 12, cursor: status === 'loading' ? 'not-allowed' : 'pointer', color: '#64748b', opacity: status === 'loading' ? 0.5 : 1 }}
          >
            {status === 'loading' ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
          Time tracked by team members across mapped Monday.com boards.
        </p>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div>Fetching time tracking data from Monday.com…</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>This may take a moment for large boards.</div>
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

      {status === 'ready' && !hasMappings && (
        <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 8 }}>No Boards Mapped Yet</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>
            Link your Monday.com boards to products before viewing time data.
          </div>
          <Link to="/board-mapping" style={{ padding: '8px 20px', background: '#6366f1', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Go to Board Mapping
          </Link>
        </div>
      )}

      {status === 'ready' && hasMappings && (
        <>
          <SummaryCards entries={filtered} />

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>

            {/* Week filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
              <button
                onClick={() => { setAllTime(false); setWeekStart(w => offsetWeek(w, -1)); }}
                style={{ ...navBtnStyle, border: 'none', borderRight: '1px solid #e2e8f0', borderRadius: 0, padding: '6px 10px' }}
                title="Previous week"
              >‹</button>
              <div style={{ padding: '5px 12px', fontSize: 13, color: allTime ? '#94a3b8' : '#1e293b', fontWeight: allTime ? 400 : 500, minWidth: 160, textAlign: 'center' }}>
                {allTime ? 'All Time' : formatWeekLabel(weekStart)}
              </div>
              <button
                onClick={() => { setAllTime(false); setWeekStart(w => offsetWeek(w, 1)); }}
                style={{ ...navBtnStyle, border: 'none', borderLeft: '1px solid #e2e8f0', borderRadius: 0, padding: '6px 10px' }}
                title="Next week"
              >›</button>
            </div>

            <button
              onClick={() => { setAllTime(true); setWeekStart(getWeekStart(new Date())); }}
              style={{
                ...navBtnStyle,
                background: allTime ? '#6366f1' : 'white',
                color: allTime ? 'white' : '#64748b',
                border: `1px solid ${allTime ? '#6366f1' : '#e2e8f0'}`,
                fontWeight: allTime ? 600 : 400,
              }}
            >
              All Time
            </button>

            <button
              onClick={() => { setAllTime(false); setWeekStart(getWeekStart(new Date())); }}
              style={{
                ...navBtnStyle,
                background: !allTime && formatWeekLabel(weekStart) === formatWeekLabel(getWeekStart(new Date())) ? '#f0fdf4' : 'white',
                color: '#64748b',
                fontSize: 12,
              }}
            >
              This Week
            </button>

            <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

            <select value={productFilter} onChange={e => setProductFilter(e.target.value)} style={selStyle}>
              <option value="">All Products</option>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select value={personFilter} onChange={e => setPersonFilter(e.target.value)} style={selStyle}>
              <option value="">All People</option>
              {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            {hasActiveFilters && (productFilter || personFilter) && (
              <button
                onClick={() => { setProductFilter(''); setPersonFilter(''); }}
                style={{ ...navBtnStyle, fontSize: 12, color: '#94a3b8' }}
              >
                Clear
              </button>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {['table', 'person'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: view === v ? 600 : 400,
                    background: view === v ? '#6366f1' : 'white',
                    color: view === v ? 'white' : '#64748b',
                  }}
                >
                  {v === 'table' ? 'Detail View' : 'By Person'}
                </button>
              ))}
            </div>
          </div>

          {view === 'table' && <TimeLogTable entries={filtered} />}
          {view === 'person' && (
            <>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Per-Person Summary
              </h3>
              <PersonSummary entries={filtered} />
            </>
          )}
        </>
      )}
    </div>
  );
}

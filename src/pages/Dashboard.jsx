import { useState, useMemo } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import WorkspaceCard from '../components/WorkspaceCard';
import BoardCard from '../components/BoardCard';

function ExpandedWorkspace({ workspace, hideCompleted, onClose }) {
  const { name, color, boards } = workspace;

  const totalTasks     = boards.reduce((s, b) => s + b.releases.reduce((rs, r) => rs + r.total, 0), 0);
  const completedTasks = boards.reduce((s, b) => s + b.releases.reduce((rs, r) => rs + r.completedCount, 0), 0);
  const totalReleases  = boards.reduce((s, b) => s + b.releases.length, 0);
  const completion     = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

  const visibleBoards = hideCompleted
    ? boards.filter(b => b.releases.some(r => r.completion < 100))
    : boards;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: `0 4px 20px ${color}30`, border: `1px solid ${color}40` }}>

      {/* Full-width colored banner */}
      <div style={{ background: `linear-gradient(140deg, ${color} 0%, ${color}bb 100%)`, padding: '24px 28px' }}>

        {/* Back button */}
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 14px', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← All Workspaces
        </button>

        {/* Name + stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>Workspace</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 14 }}>{name}</div>
            {/* Completion bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{completedTasks} of {totalTasks} tasks complete</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'white' }}>{completion}%</div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                <div style={{ width: `${completion}%`, height: '100%', background: 'white', borderRadius: 4, opacity: 0.9 }} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { label: 'Boards',   value: boards.length  },
              { label: 'Releases', value: totalReleases  },
              { label: 'Tasks',    value: totalTasks     },
              { label: 'Done',     value: completedTasks },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board grid section */}
      <div style={{ background: '#f8fafc', padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: color }} />
          Project Boards — {visibleBoards.length}
        </div>
        {visibleBoards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>All boards completed.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {visibleBoards.map(board => (
              <BoardCard key={board.id} board={board} hideCompleted={hideCompleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { workspaces, status, errorMsg, refresh } = useDashboardData();
  const [expandedWs,    setExpandedWs]   = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);

  const activeWorkspace = workspaces.find(w => w.name === expandedWs) || null;

  const totalBoards    = useMemo(() => workspaces.reduce((s, w) => s + w.boards.length, 0), [workspaces]);
  const totalTasks     = useMemo(() => workspaces.reduce((s, w) => s + w.boards.reduce((bs, b) => bs + b.releases.reduce((rs, r) => rs + r.total, 0), 0), 0), [workspaces]);
  const completedTasks = useMemo(() => workspaces.reduce((s, w) => s + w.boards.reduce((bs, b) => bs + b.releases.reduce((rs, r) => rs + r.completedCount, 0), 0), 0), [workspaces]);
  const overallPct     = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: 1200, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Release Dashboard</h1>
          <button
            onClick={refresh}
            disabled={status === 'loading'}
            style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', fontSize: 12, cursor: status === 'loading' ? 'not-allowed' : 'pointer', color: '#64748b', opacity: status === 'loading' ? 0.5 : 1 }}
          >
            {status === 'loading' ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
          Release progress across Connect, Support, and Stand Alone Products workspaces.
        </p>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div>Loading release data from Monday.com…</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Fetching all project boards across workspaces.</div>
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
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Workspaces',  value: workspaces.length, color: '#8b5cf6' },
              { label: 'Boards',      value: totalBoards,        color: '#6366f1' },
              { label: 'Total Tasks', value: totalTasks,         color: '#3b82f6' },
              { label: 'Completed',   value: completedTasks,     color: '#10b981' },
              { label: 'Overall',     value: `${overallPct}%`,   color: '#f59e0b' },
            ].map(card => (
              <div key={card.label} style={{ background: 'white', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderTop: `3px solid ${card.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} style={{ cursor: 'pointer' }} />
              Hide completed releases
            </label>
          </div>

          {workspaces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
              No Project Boards found in the configured workspaces.
            </div>
          ) : activeWorkspace ? (
            /* ── Expanded workspace view ── */
            <ExpandedWorkspace
              workspace={activeWorkspace}
              hideCompleted={hideCompleted}
              onClose={() => setExpandedWs(null)}
            />
          ) : (
            /* ── Workspace tile grid ── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {workspaces.map(ws => (
                <WorkspaceCard
                  key={ws.name}
                  workspace={ws}
                  onExpand={() => setExpandedWs(ws.name)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

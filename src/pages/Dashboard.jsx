import { useState, useMemo } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import WorkspaceCard from '../components/WorkspaceCard';
import BoardCard from '../components/BoardCard';

export default function Dashboard() {
  const { workspaces, status, errorMsg, refresh } = useDashboardData();
  const [expandedWs,   setExpandedWs]   = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);

  const totalBoards    = useMemo(() => workspaces.reduce((s, w) => s + w.boards.length, 0), [workspaces]);
  const totalTasks     = useMemo(() => workspaces.reduce((s, w) => s + w.boards.reduce((bs, b) => bs + b.releases.reduce((rs, r) => rs + r.total, 0), 0), 0), [workspaces]);
  const completedTasks = useMemo(() => workspaces.reduce((s, w) => s + w.boards.reduce((bs, b) => bs + b.releases.reduce((rs, r) => rs + r.completedCount, 0), 0), 0), [workspaces]);
  const overallPct     = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

  const activeWorkspace = workspaces.find(w => w.name === expandedWs);
  const visibleBoards   = activeWorkspace
    ? (hideCompleted ? activeWorkspace.boards.filter(b => b.releases.some(r => r.completion < 100)) : activeWorkspace.boards)
    : [];

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

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={e => setHideCompleted(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Hide completed releases
            </label>
          </div>

          {workspaces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
              No Project Boards found in the configured workspaces.
            </div>
          ) : (
            <>
              {/* Workspace tile grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: activeWorkspace ? 20 : 0 }}>
                {workspaces.map(ws => (
                  <WorkspaceCard
                    key={ws.name}
                    workspace={ws}
                    hideCompleted={hideCompleted}
                    isExpanded={expandedWs === ws.name}
                    onExpand={() => setExpandedWs(expandedWs === ws.name ? null : ws.name)}
                  />
                ))}
              </div>

              {/* Expanded workspace board grid */}
              {activeWorkspace && (
                <div style={{ background: '#f8fafc', borderRadius: 12, border: `1px solid ${activeWorkspace.color}30`, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 4, height: 20, borderRadius: 2, background: activeWorkspace.color }} />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{activeWorkspace.name}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      {visibleBoards.length} board{visibleBoards.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {visibleBoards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                      All boards completed.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                      {visibleBoards.map(board => (
                        <BoardCard key={board.id} board={board} hideCompleted={hideCompleted} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

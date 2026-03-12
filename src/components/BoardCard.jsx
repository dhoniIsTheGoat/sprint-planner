import { useState } from 'react';
import ReleaseProgressBar from './ReleaseProgressBar';
import StatusLegend from './StatusLegend';

export default function BoardCard({ board, hideCompleted }) {
  const [expanded, setExpanded] = useState(false);

  const releases = hideCompleted
    ? board.releases.filter(r => r.completion < 100)
    : board.releases;

  const overallTotal      = board.releases.reduce((s, r) => s + r.total, 0);
  const overallCompleted  = board.releases.reduce((s, r) => s + r.completedCount, 0);
  const overallCompletion = overallTotal > 0 ? Math.round(overallCompleted / overallTotal * 100) : 0;

  if (hideCompleted && releases.length === 0) return null;

  const displayName = board.name.replace(/\s*Project Board\s*$/i, '');

  const completionColor = overallCompletion === 100 ? '#16a34a'
    : overallCompletion >= 60 ? '#f59e0b'
    : '#6366f1';

  // Aggregate overall status counts across all releases for the summary bar
  const overallStatusCounts = {};
  board.releases.forEach(r => {
    Object.entries(r.statusCounts).forEach(([label, count]) => {
      overallStatusCounts[label] = (overallStatusCounts[label] || 0) + count;
    });
  });

  return (
    <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Fixed-height tile body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, height: 160, boxSizing: 'border-box' }}>

        {/* Board name */}
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {displayName}
        </div>

        {/* Completion % + stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Big % */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: completionColor, lineHeight: 1 }}>{overallCompletion}%</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>complete</div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 36, background: '#e2e8f0', flexShrink: 0 }} />

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, flex: 1 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{overallTotal}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>tasks</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{board.releases.length}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>releases</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{overallCompleted}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>done</div>
            </div>
          </div>
        </div>

        {/* Overall stacked progress bar */}
        <div>
          <ReleaseProgressBar
            statusCounts={overallStatusCounts}
            total={overallTotal}
            colorMap={board.colorMap}
            completion={overallCompletion}
          />
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', padding: '8px', border: 'none', borderTop: '1px solid #f1f5f9', background: expanded ? '#f0f9ff' : '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: expanded ? '#0369a1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
      >
        {expanded ? '▴ Hide releases' : `▾ Show ${releases.length} release${releases.length !== 1 ? 's' : ''}`}
      </button>

      {/* Expanded release detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #e2e8f0' }}>
          {releases.length === 0 ? (
            <div style={{ padding: '12px 18px', fontSize: 12, color: '#94a3b8' }}>All releases completed.</div>
          ) : (
            releases.map((release, i) => (
              <div
                key={release.id}
                style={{ padding: '10px 18px', borderBottom: i < releases.length - 1 ? '1px solid #f1f5f9' : 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {release.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{release.total} tasks</div>
                  {release.completion === 100 && (
                    <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', borderRadius: 99, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>Done</span>
                  )}
                </div>
                <div style={{ marginBottom: 5 }}>
                  <ReleaseProgressBar
                    statusCounts={release.statusCounts}
                    total={release.total}
                    colorMap={board.colorMap}
                    completion={release.completion}
                  />
                </div>
                <StatusLegend statusCounts={release.statusCounts} colorMap={board.colorMap} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

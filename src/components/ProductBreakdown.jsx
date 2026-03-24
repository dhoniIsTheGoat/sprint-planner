import { useState, useMemo } from 'react';
import StoryTable from './StoryTable';
import { HEALTH_CONFIG, HEALTH_ORDER } from '../hooks/useQuarterlyData';

export default function ProductBreakdown({ product }) {
  const [expanded, setExpanded] = useState(false);
  const { boardName, stories, workspaceName } = product;

  const displayName = boardName.replace(/\s*Project Board\s*$/i, '');
  const complete    = stories.filter(s => s.health === 'COMPLETE').length;
  const completion  = stories.length > 0 ? Math.round(complete / stories.length * 100) : 0;

  const healthCounts = useMemo(() => {
    const counts = {};
    stories.forEach(s => { counts[s.health] = (counts[s.health] || 0) + 1; });
    return counts;
  }, [stories]);

  const worstHealth = Object.keys(healthCounts).sort((a, b) => (HEALTH_ORDER[a] ?? 99) - (HEALTH_ORDER[b] ?? 99))[0];
  const accentColor = HEALTH_CONFIG[worstHealth]?.color || '#6366f1';

  const ALERT_HEALTHS = ['OVERDUE', 'AT_RISK', 'BEHIND', 'BLOCKED'];

  return (
    <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 10 }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: '#f8fafc', borderBottom: expanded ? '1px solid #e2e8f0' : 'none' }}
      >
        <div style={{ width: 4, height: 36, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{displayName}</div>
            {workspaceName && (
              <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', borderRadius: 99, padding: '1px 8px' }}>{workspaceName}</span>
            )}
            <div style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{stories.length} stories</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 100, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
              <div style={{ width: `${completion}%`, height: '100%', background: '#037f4c', borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: completion === 100 ? '#16a34a' : '#64748b', flexShrink: 0 }}>{completion}%</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {ALERT_HEALTHS.filter(h => healthCounts[h]).map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: HEALTH_CONFIG[h]?.color, background: HEALTH_CONFIG[h]?.bg, borderRadius: 99, padding: '1px 7px' }}>
                  {healthCounts[h]} {HEALTH_CONFIG[h]?.label.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', userSelect: 'none', flexShrink: 0 }}>{expanded ? '▴' : '▾'}</div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px', background: 'white' }}>
          <StoryTable stories={stories} />
        </div>
      )}
    </div>
  );
}

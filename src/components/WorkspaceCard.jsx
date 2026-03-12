import { useState, useMemo } from 'react';
import BoardCard from './BoardCard';
import ReleaseProgressBar from './ReleaseProgressBar';

export default function WorkspaceCard({ workspace, hideCompleted, onExpand, isExpanded }) {
  const { name, color, boards } = workspace;

  const totalTasks = useMemo(() =>
    boards.reduce((s, b) => s + b.releases.reduce((rs, r) => rs + r.total, 0), 0),
  [boards]);

  const completedTasks = useMemo(() =>
    boards.reduce((s, b) => s + b.releases.reduce((rs, r) => rs + r.completedCount, 0), 0),
  [boards]);

  const totalReleases = useMemo(() =>
    boards.reduce((s, b) => s + b.releases.length, 0),
  [boards]);

  const completion = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

  const overallStatusCounts = useMemo(() => {
    const counts = {};
    boards.forEach(b => b.releases.forEach(r => {
      Object.entries(r.statusCounts).forEach(([label, count]) => {
        counts[label] = (counts[label] || 0) + count;
      });
    }));
    return counts;
  }, [boards]);

  const mergedColorMap = useMemo(() => {
    const map = {};
    boards.forEach(b => Object.assign(map, b.colorMap));
    return map;
  }, [boards]);

  const completionColor = completion === 100 ? '#16a34a'
    : completion >= 60 ? '#f59e0b'
    : color;

  return (
    <div
      onClick={onExpand}
      style={{
        background: 'white',
        borderRadius: 12,
        border: `1px solid ${isExpanded ? color : '#e2e8f0'}`,
        boxShadow: isExpanded ? `0 0 0 2px ${color}30, 0 4px 12px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 4, background: color }} />

      {/* Fixed-height tile body */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, height: 170, boxSizing: 'border-box' }}>

        {/* Workspace name */}
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{name}</div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Boards',   value: boards.length   },
            { label: 'Releases', value: totalReleases    },
            { label: 'Tasks',    value: totalTasks       },
            { label: 'Done',     value: completedTasks, highlight: '#16a34a' },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.highlight || '#1e293b' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar + % */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Overall progress</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: completionColor }}>{completion}%</div>
          </div>
          <ReleaseProgressBar
            statusCounts={overallStatusCounts}
            total={totalTasks}
            colorMap={mergedColorMap}
            completion={completion}
          />
        </div>
      </div>

      {/* Footer toggle */}
      <div style={{ padding: '8px 20px', borderTop: '1px solid #f1f5f9', background: isExpanded ? `${color}10` : '#f8fafc', fontSize: 12, fontWeight: 600, color: isExpanded ? color : '#64748b', textAlign: 'center' }}>
        {isExpanded ? '▴ Collapse' : `▾ View ${boards.length} board${boards.length !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}

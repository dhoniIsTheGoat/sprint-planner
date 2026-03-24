import { useMemo } from 'react';

export default function WorkspaceCard({ workspace, onExpand }) {
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

  return (
    <div
      onClick={onExpand}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid transparent',
        cursor: 'pointer',
        background: `linear-gradient(140deg, ${color} 0%, ${color}bb 100%)`,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
    >
      {/* Card body */}
      <div style={{ padding: '20px 22px' }}>

        {/* Label */}
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>
          Workspace
        </div>

        {/* Name */}
        <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.2 }}>
          {name}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
          {[
            { label: 'Boards',   value: boards.length  },
            { label: 'Releases', value: totalReleases  },
            { label: 'Tasks',    value: totalTasks     },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Completion bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{completedTasks} of {totalTasks} done</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'white' }}>{completion}%</div>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ width: `${completion}%`, height: '100%', background: 'white', borderRadius: 4, opacity: 0.9 }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 22px', background: 'rgba(0,0,0,0.12)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        Click to explore boards →
      </div>
    </div>
  );
}

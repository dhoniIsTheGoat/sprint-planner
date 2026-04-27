import { useState } from 'react';
import { useSprintReview, formatDuration } from '../hooks/useSprintReview';

/* ── Person accent palette ── */
const PALETTE = [
  { accent: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { accent: '#0ea5e9', bg: '#e0f2fe', border: '#bae6fd' },
  { accent: '#10b981', bg: '#d1fae5', border: '#a7f3d0' },
  { accent: '#f59e0b', bg: '#fef3c7', border: '#fde68a' },
  { accent: '#ec4899', bg: '#fce7f3', border: '#fbcfe8' },
  { accent: '#8b5cf6', bg: '#ede9fe', border: '#ddd6fe' },
  { accent: '#14b8a6', bg: '#ccfbf1', border: '#99f6e4' },
  { accent: '#f97316', bg: '#ffedd5', border: '#fed7aa' },
  { accent: '#06b6d4', bg: '#cffafe', border: '#a5f3fc' },
  { accent: '#84cc16', bg: '#ecfccb', border: '#d9f99d' },
];

/* ── Board tag colors ── */
const BOARD_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316','#06b6d4','#ef4444'];
const _bc = {};
let _bci = 0;
function boardColor(name) {
  if (!_bc[name]) _bc[name] = BOARD_COLORS[_bci++ % BOARD_COLORS.length];
  return _bc[name];
}

/* ── Status badge ── */
const STATUS_STYLES = {
  'Working on it':       { bg: '#fef3c7', color: '#b45309', dot: '#f59e0b' },
  'In Progress':         { bg: '#ccfbf1', color: '#0d9488', dot: '#14b8a6' },
  'Work In Progress':    { bg: '#ccfbf1', color: '#0d9488', dot: '#14b8a6' },
  'Testing in Progress': { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  'Test Complete':       { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  'Release Ready':       { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  'Done':                { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  'Stuck':               { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  'Blocked':             { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  'Work Scheduled':      { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1' },
  'Gathering Req':       { bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9' },
  'Groomed':             { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
};
function StatusBadge({ status }) {
  if (!status) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
  const s = STATUS_STYLES[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

/* ── Priority badge ── */
const PRIORITY_STYLES = {
  Critical: { bg: '#fee2e2', color: '#b91c1c' },
  High:     { bg: '#ffedd5', color: '#c2410c' },
  Medium:   { bg: '#fef9c3', color: '#a16207' },
  Low:      { bg: '#f0fdf4', color: '#15803d' },
};
function PriorityBadge({ priority }) {
  if (!priority) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
  const s = PRIORITY_STYLES[priority] || { bg: '#f1f5f9', color: '#475569' };
  return <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '3px 9px', fontSize: 12, fontWeight: 600 }}>{priority}</span>;
}

function BoardTag({ name }) {
  const c = boardColor(name);
  return <span style={{ background: c + '18', color: c, border: `1px solid ${c}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>;
}

function HoursChip({ value, color }) {
  const text = formatDuration(value);
  if (text === '—') return <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>;
  return <span style={{ background: color + '15', color, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{text}</span>;
}

/* ── Summary card ── */
function SummaryCard({ label, value, gradient, icon }) {
  return (
    <div style={{ borderRadius: 12, padding: '18px 20px', background: gradient, color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ position: 'absolute', right: 16, top: 12, fontSize: 28, opacity: 0.25 }}>{icon}</div>
    </div>
  );
}

/* ── Mini status dots on tile ── */
function StatusDots({ tasks }) {
  const counts = {};
  tasks.forEach(t => {
    const s = STATUS_STYLES[t.status];
    const dot = s?.dot || '#94a3b8';
    counts[dot] = (counts[dot] || 0) + 1;
  });
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
      {Object.entries(counts).map(([dot, n]) => (
        <span key={dot} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{n}</span>
        </span>
      ))}
    </div>
  );
}

/* ── Person tile ── */
function PersonTile({ person, info, palette, selected, onClick }) {
  const boards = [...new Set(info.tasks.map(t => t.board))];
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: `2px solid ${selected ? palette.accent : palette.border}`,
        background: selected ? palette.bg : 'white',
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? `0 0 0 3px ${palette.accent}22` : '0 1px 4px rgba(0,0,0,0.05)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: palette.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
          {person.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.2 }}>{person}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {info.tasks.length} task{info.tasks.length !== 1 ? 's' : ''}
          </div>
        </div>
        {selected && (
          <span style={{ marginLeft: 'auto', fontSize: 16, color: palette.accent }}>▾</span>
        )}
      </div>

      {/* Board tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {boards.map(b => <BoardTag key={b} name={b} />)}
      </div>

      {/* Status dot summary */}
      <StatusDots tasks={info.tasks} />
    </div>
  );
}

/* ── Group tasks by owner ── */
function groupByPerson(tasks) {
  const grouped = {};
  tasks.forEach(task => {
    const owners  = task.owner ? task.owner.split(',').map(s => s.trim()).filter(Boolean) : [];
    const primary = owners[0] || 'Unassigned';
    if (!grouped[primary]) grouped[primary] = { tasks: [] };
    grouped[primary].tasks.push(task);
  });
  return grouped;
}

/* ── Task table (shared) ── */
function TaskTable({ tasks }) {
  const headers = ['Task', 'Project', 'Status', 'Priority', 'Est. Hours', 'Time Spent', 'Story', 'Req'];
  const leftAlign = new Set(['Task', 'Project']);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#f8fafc' }}>
          {headers.map(h => (
            <th key={h} style={{ padding: '9px 14px', textAlign: leftAlign.has(h) ? 'left' : 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tasks.map((task, tIdx) => {
          const mondayUrl = `https://veritasprime-products.monday.com/boards/${task.boardId}/pulses/${task.id}`;
          return (
            <tr
              key={task.id}
              onClick={() => window.open(mondayUrl, '_blank', 'noopener,noreferrer')}
              style={{ borderBottom: '1px solid #f8fafc', background: tIdx % 2 === 0 ? 'white' : '#fafbff', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = tIdx % 2 === 0 ? 'white' : '#fafbff'; }}
            >
              <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 500, maxWidth: 320 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {task.name}
                  <span style={{ fontSize: 10, color: '#c7d2fe', flexShrink: 0 }}>↗</span>
                </span>
              </td>
              <td style={{ padding: '10px 14px' }}><BoardTag name={task.board} /></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><StatusBadge status={task.status} /></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><PriorityBadge priority={task.priority} /></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><HoursChip value={task.estHours}   color="#6366f1" /></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}><HoursChip value={task.timeSpent} color="#10b981" /></td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                {task.storyUrl
                  ? <a href={task.storyUrl} target="_blank" rel="noopener noreferrer" title="Open user story" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: '#fef3c7', color: '#b45309', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>★</a>
                  : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>
                }
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                {task.reqUrl
                  ? <a href={task.reqUrl} target="_blank" rel="noopener noreferrer" title="Open requirement" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', color: '#0369a1', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>⎗</a>
                  : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>
                }
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Main page ── */
export default function SprintReview() {
  const { tasks, loading, error, refresh } = useSprintReview();
  const [selected, setSelected] = useState(null);

  const grouped    = groupByPerson(tasks);
  const people     = Object.keys(grouped).sort((a, b) => grouped[b].tasks.length - grouped[a].tasks.length);
  const paletteFor = idx => PALETTE[idx % PALETTE.length];
  const totalBoards = new Set(tasks.map(t => t.board)).size;

  // When a tile is selected, find its palette index
  const selectedIdx = people.indexOf(selected);
  const selectedPalette = selectedIdx >= 0 ? paletteFor(selectedIdx) : PALETTE[0];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Sprint Review</h1>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Active work · Connect · Support · Stand Alone Products</div>
        </div>
        <button onClick={refresh} disabled={loading} style={{ padding: '8px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, boxShadow: '0 1px 4px rgba(99,102,241,0.4)' }}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: 16, color: '#dc2626', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 80, color: '#64748b', fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
          Fetching active tasks from all Dev boards…
        </div>
      )}

      {!loading && !error && (
        <>
          {tasks.length > 0 && !selected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
              <SummaryCard icon="✅" label="Active Tasks"  value={tasks.length}  gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" />
              <SummaryCard icon="👥" label="Team Members" value={people.length} gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" />
              <SummaryCard icon="📦" label="Projects"     value={totalBoards}   gradient="linear-gradient(135deg,#10b981,#14b8a6)" />
            </div>
          )}

          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}>
              No active tasks found. Check your API token in <a href="/setup" style={{ color: '#6366f1' }}>Setup</a>.
            </div>
          ) : selected ? (
            /* ── Detail view: banner + task table ── */
            <div>
              {/* Banner */}
              <div style={{
                borderRadius: 14,
                border: `2px solid ${selectedPalette.accent}`,
                background: `linear-gradient(135deg, ${selectedPalette.bg}, white)`,
                padding: '20px 24px',
                marginBottom: 16,
                boxShadow: `0 4px 20px ${selectedPalette.accent}30`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: selectedPalette.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {selected.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', lineHeight: 1.2 }}>{selected}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                    {grouped[selected].tasks.length} active task{grouped[selected].tasks.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                    {[...new Set(grouped[selected].tasks.map(t => t.board))].map(b => <BoardTag key={b} name={b} />)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <StatusDots tasks={grouped[selected].tasks} />
                  <button
                    onClick={() => setSelected(null)}
                    style={{ padding: '7px 16px', background: 'white', color: selectedPalette.accent, border: `1.5px solid ${selectedPalette.accent}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Task table */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TaskTable tasks={grouped[selected].tasks} />
              </div>
            </div>
          ) : (
            /* ── Tile grid ── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, alignItems: 'start' }}>
              {people.map((person, idx) => {
                const info    = grouped[person];
                const palette = paletteFor(idx);
                const boards  = [...new Set(info.tasks.map(t => t.board))];

                return (
                  <div
                    key={person}
                    onClick={() => setSelected(person)}
                    style={{
                      borderRadius: 12,
                      border: `2px solid ${palette.border}`,
                      background: 'white',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = palette.accent;
                      e.currentTarget.style.boxShadow = `0 4px 16px ${palette.accent}22`;
                      e.currentTarget.style.background = palette.bg;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = palette.border;
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: palette.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                        {person.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.2 }}>{person}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {info.tasks.length} task{info.tasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 13, color: palette.accent, fontWeight: 700 }}>▸</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                      {boards.map(b => <BoardTag key={b} name={b} />)}
                    </div>
                    <StatusDots tasks={info.tasks} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

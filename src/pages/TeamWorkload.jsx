import { useState, useMemo, useRef, useEffect } from 'react';
import { useTeamWorkload } from '../hooks/useTeamWorkload';

/* ── Palette for user tiles ── */
const PALETTE = [
  { accent: '#6366f1', light: '#eef2ff', border: '#c7d2fe' },
  { accent: '#0ea5e9', light: '#e0f2fe', border: '#bae6fd' },
  { accent: '#10b981', light: '#d1fae5', border: '#a7f3d0' },
  { accent: '#f59e0b', light: '#fef3c7', border: '#fde68a' },
  { accent: '#ec4899', light: '#fce7f3', border: '#fbcfe8' },
  { accent: '#8b5cf6', light: '#ede9fe', border: '#ddd6fe' },
  { accent: '#14b8a6', light: '#ccfbf1', border: '#99f6e4' },
  { accent: '#f97316', light: '#ffedd5', border: '#fed7aa' },
  { accent: '#06b6d4', light: '#cffafe', border: '#a5f3fc' },
  { accent: '#84cc16', light: '#ecfccb', border: '#d9f99d' },
];

/* ── Board tag colors ── */
const BOARD_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316','#06b6d4','#ef4444'];
const _bc = {}; let _bci = 0;
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
  if (!status) return <span style={{ color: '#94a3b8', fontSize: 11 }}>No status</span>;
  const s = STATUS_STYLES[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {status}
    </span>
  );
}

/* ── Filter helpers ── */
// A filter is { selected: Set<string>, mode: 'include' | 'exclude' }
const emptyFilter = () => ({ selected: new Set(), mode: 'include' });

function passesFilter(value, filter) {
  if (filter.selected.size === 0) return true;
  const inSet = filter.selected.has(value);
  return filter.mode === 'include' ? inSet : !inSet;
}

function filterIsActive(filter) {
  return filter.selected.size > 0;
}

/* ── Multi-select dropdown with Include / Exclude toggle ── */
function MultiSelect({ label, options, filter, onChange, compact = false }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { selected, mode } = filter;
  const isExclude = mode === 'exclude';
  const count     = selected.size;
  const active    = count > 0;

  const activeColor = isExclude ? '#dc2626' : '#6366f1';
  const activeBg    = isExclude ? '#fee2e2' : '#eef2ff';
  const activeBorder= isExclude ? '#fca5a5' : '#a5b4fc';

  const visibleOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  function toggleOption(opt) {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    onChange({ ...filter, selected: next });
  }

  function setMode(m) { onChange({ ...filter, mode: m }); }

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: compact ? '5px 9px' : '7px 12px',
    background: active ? activeBg : 'white',
    border: `1px solid ${active ? activeBorder : '#e2e8f0'}`,
    borderRadius: 8, cursor: 'pointer',
    fontSize: compact ? 12 : 13,
    color: active ? activeColor : '#475569',
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={btnStyle}>
        {active && isExclude && <span style={{ fontWeight: 700 }}>≠</span>}
        {label}
        {active ? ` (${count})` : ''}
        <span style={{ fontSize: 9, opacity: 0.55, marginLeft: 1 }}>▼</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.13)', zIndex: 300, minWidth: 230, display: 'flex', flexDirection: 'column' }}>

          {/* Include / Exclude toggle */}
          <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setMode('include')}
                style={{ flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: !isExclude ? '#6366f1' : 'transparent', color: !isExclude ? 'white' : '#64748b', transition: 'all 0.15s' }}
              >
                Include
              </button>
              <button
                onClick={() => setMode('exclude')}
                style={{ flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: isExclude ? '#dc2626' : 'transparent', color: isExclude ? 'white' : '#64748b', transition: 'all 0.15s' }}
              >
                ≠ Exclude
              </button>
            </div>
            {isExclude && active && (
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 5, fontWeight: 500 }}>
                Hiding tasks where {label.toLowerCase()} matches selected
              </div>
            )}
          </div>

          {/* Option search (only when many options) */}
          {options.length > 8 && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                style={{ width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: 240, padding: '4px 0' }}>
            {visibleOptions.length === 0 && (
              <div style={{ padding: '8px 14px', fontSize: 12, color: '#94a3b8' }}>No matches</div>
            )}
            {visibleOptions.map(opt => {
              const checked = selected.has(opt);
              const rowBg   = checked ? (isExclude ? '#fff1f2' : '#f5f3ff') : 'transparent';
              const rowColor= checked ? (isExclude ? '#dc2626' : '#6366f1') : '#374151';
              return (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', background: rowBg, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(opt)}
                    style={{ accentColor: isExclude ? '#dc2626' : '#6366f1', flexShrink: 0 }}
                  />
                  <span style={{ color: rowColor, fontWeight: checked ? 600 : 400 }}>{opt}</span>
                  {checked && isExclude && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#dc2626', fontWeight: 700 }}>excluded</span>}
                </label>
              );
            })}
          </div>

          {/* Footer */}
          {active && (
            <div style={{ padding: '7px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{count} selected</span>
              <button
                onClick={() => onChange(emptyFilter())}
                style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── User avatar ── */
function Avatar({ user, size = 40, accent }) {
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (user.photo_thumb) {
    return <img src={user.photo_thumb} alt={user.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}40`, flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ── Task row ── */
function TaskRow({ task }) {
  const bc  = boardColor(task.board);
  const url = `https://veritasprime-products.monday.com/boards/${task.boardId}/pulses/${task.id}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{ padding: '8px 12px', borderBottom: '1px solid #f8fafc', display: 'flex', flexDirection: 'column', gap: 5, transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, lineHeight: 1.3 }}>{task.name}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <StatusBadge status={task.status} />
          <span style={{ background: bc + '18', color: bc, border: `1px solid ${bc}40`, borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {task.board}
          </span>
          {task.sprint && (
            <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '2px 7px', fontSize: 11 }}>{task.sprint}</span>
          )}
          {task.group && (
            <span style={{ background: '#f8fafc', color: '#94a3b8', borderRadius: 6, padding: '2px 7px', fontSize: 11 }}>{task.group}</span>
          )}
        </div>
      </div>
    </a>
  );
}

/* ── User tile ── */
function UserTile({ user, tasks, paletteIdx, localFilter, onLocalFilterChange }) {
  const pal = PALETTE[paletteIdx % PALETTE.length];
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_LIMIT = 5;

  const localStatusOptions = useMemo(() => {
    const s = new Set();
    tasks.forEach(t => { if (t.status) s.add(t.status); });
    return [...s].sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (localFilter.search && !t.name.toLowerCase().includes(localFilter.search.toLowerCase())) return false;
      if (!passesFilter(t.status, localFilter.statusFilter)) return false;
      return true;
    });
  }, [tasks, localFilter]);

  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_LIMIT);
  const hasMore = filtered.length > COLLAPSED_LIMIT;

  return (
    <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${pal.border}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      <div style={{ background: pal.light, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${pal.border}`, borderRadius: '11px 11px 0 0' }}>
        <Avatar user={user} size={42} accent={pal.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          {user.email && <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <span style={{ background: pal.accent, color: 'white', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
          {tasks.length !== filtered.length && (
            <span style={{ fontSize: 11, color: pal.accent, fontWeight: 600 }}>{filtered.length} shown</span>
          )}
        </div>
      </div>

      {/* Local filters */}
      <div style={{ padding: '10px 12px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={localFilter.search}
          onChange={e => onLocalFilterChange({ ...localFilter, search: e.target.value })}
          placeholder="Search tasks…"
          style={{ flex: 1, padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, outline: 'none', color: '#374151' }}
        />
        <MultiSelect
          label="Status"
          options={localStatusOptions}
          filter={localFilter.statusFilter}
          onChange={f => onLocalFilterChange({ ...localFilter, statusFilter: f })}
          compact
        />
        {filterIsActive(localFilter.statusFilter) && (
          <button
            onClick={() => onLocalFilterChange({ ...localFilter, statusFilter: emptyFilter() })}
            style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
            title="Clear status filter"
          >
            ✕
          </button>
        )}
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: expanded ? 'auto' : 'visible', maxHeight: expanded ? 400 : 'none' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            {tasks.length > 0 ? 'No tasks match the filters' : 'No assigned tasks'}
          </div>
        ) : (
          visible.map(task => <TaskRow key={`${task.id}-${task.boardId}`} task={task} />)
        )}
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ padding: '9px 14px', background: '#f8fafc', border: 'none', borderTop: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12, color: pal.accent, fontWeight: 600, textAlign: 'center', width: '100%', borderRadius: '0 0 11px 11px' }}
        >
          {expanded ? '▲ Show less' : `▼ Show ${filtered.length - COLLAPSED_LIMIT} more`}
        </button>
      )}
    </div>
  );
}

/* ── Active filter chip ── */
function FilterChip({ value, mode, onRemove }) {
  const isExclude = mode === 'exclude';
  const bg    = isExclude ? '#fee2e2' : '#eef2ff';
  const color = isExclude ? '#dc2626' : '#6366f1';
  return (
    <span style={{ background: bg, color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {isExclude && <span style={{ fontWeight: 800, fontSize: 11 }}>≠</span>}
      {value}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 13, padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
    </span>
  );
}

/* ── Main page ── */
export default function TeamWorkload() {
  const { users, tasksByUser, allBoards, loading, progress, error, refresh } = useTeamWorkload();

  const [globalSearch,   setGlobalSearch]   = useState('');
  const [globalStatuses, setGlobalStatuses] = useState(emptyFilter);
  const [globalBoards,   setGlobalBoards]   = useState(emptyFilter);
  const [globalSprints,  setGlobalSprints]  = useState(emptyFilter);
  const [showEmpty,      setShowEmpty]      = useState(false);
  const [localFilters,   setLocalFilters]   = useState({});

  /* ── Derive filter options ── */
  const { allStatuses, allBoardNames, allSprints } = useMemo(() => {
    const statuses = new Set(), boards = new Set(), sprints = new Set();
    Object.values(tasksByUser).forEach(tasks =>
      tasks.forEach(t => {
        if (t.status) statuses.add(t.status);
        if (t.board)  boards.add(t.board);
        if (t.sprint) sprints.add(t.sprint);
      })
    );
    return { allStatuses: [...statuses].sort(), allBoardNames: [...boards].sort(), allSprints: [...sprints].sort() };
  }, [tasksByUser]);

  /* ── Global filter application ── */
  function getGlobalFiltered(userId) {
    return (tasksByUser[userId] || []).filter(t => {
      if (globalSearch && !t.name.toLowerCase().includes(globalSearch.toLowerCase())) return false;
      if (!passesFilter(t.status, globalStatuses)) return false;
      if (!passesFilter(t.board,  globalBoards))   return false;
      if (!passesFilter(t.sprint, globalSprints))  return false;
      return true;
    });
  }

  /* ── Sorted user list ── */
  const sortedUsers = useMemo(() => {
    return users
      .map((u, idx) => ({ user: u, idx, filtered: getGlobalFiltered(String(u.id)) }))
      .filter(({ filtered }) => showEmpty || filtered.length > 0)
      .sort((a, b) => b.filtered.length - a.filtered.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, tasksByUser, globalSearch, globalStatuses, globalBoards, globalSprints, showEmpty]);

  const totalTasks  = useMemo(() => Object.values(tasksByUser).reduce((s, t) => s + t.length, 0), [tasksByUser]);
  const activeUsers = useMemo(() => Object.keys(tasksByUser).length, [tasksByUser]);

  const hasFilters = globalSearch || filterIsActive(globalStatuses) || filterIsActive(globalBoards) || filterIsActive(globalSprints);

  function clearAllFilters() {
    setGlobalSearch('');
    setGlobalStatuses(emptyFilter());
    setGlobalBoards(emptyFilter());
    setGlobalSprints(emptyFilter());
  }

  function removeChip(filter, setFilter, value) {
    const next = new Set(filter.selected);
    next.delete(value);
    setFilter({ ...filter, selected: next });
  }

  /* ── Loading ── */
  if (loading) {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 16 }}>Loading team workload…</div>
        {progress.total > 0 && (
          <>
            <div style={{ background: '#e2e8f0', borderRadius: 99, height: 8, width: 300, margin: '0 auto 10px' }}>
              <div style={{ background: '#6366f1', height: 8, borderRadius: 99, width: `${pct}%`, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{progress.done} / {progress.total} boards scanned</div>
          </>
        )}
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 10, padding: '16px 24px', display: 'inline-block', fontSize: 14 }}>{error}</div>
        <br /><button onClick={refresh} style={{ marginTop: 16, padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Retry</button>
      </div>
    );
  }

  const hasChips = filterIsActive(globalStatuses) || filterIsActive(globalBoards) || filterIsActive(globalSprints);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Team Workload</h1>
          {totalTasks > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
              {activeUsers} members · {totalTasks} tasks across {allBoards.length} boards
            </p>
          )}
        </div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Global filter bar */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search all tasks…"
              style={{ width: '100%', padding: '7px 10px 7px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
            />
          </div>

          <MultiSelect label="Status" options={allStatuses}   filter={globalStatuses} onChange={setGlobalStatuses} />
          <MultiSelect label="Board"  options={allBoardNames} filter={globalBoards}   onChange={setGlobalBoards} />
          {allSprints.length > 0 && (
            <MultiSelect label="Sprint" options={allSprints} filter={globalSprints} onChange={setGlobalSprints} />
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={showEmpty} onChange={e => setShowEmpty(e.target.checked)} style={{ accentColor: '#6366f1', width: 14, height: 14 }} />
            Show unassigned
          </label>

          {hasFilters && (
            <button onClick={clearAllFilters} style={{ padding: '7px 14px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              ✕ Clear all
            </button>
          )}
        </div>

        {/* Active filter chips row */}
        {hasChips && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            {[...globalStatuses.selected].map(v => (
              <FilterChip key={v} value={v} mode={globalStatuses.mode} onRemove={() => removeChip(globalStatuses, setGlobalStatuses, v)} />
            ))}
            {[...globalBoards.selected].map(v => (
              <FilterChip key={v} value={v} mode={globalBoards.mode} onRemove={() => removeChip(globalBoards, setGlobalBoards, v)} />
            ))}
            {[...globalSprints.selected].map(v => (
              <FilterChip key={v} value={v} mode={globalSprints.mode} onRemove={() => removeChip(globalSprints, setGlobalSprints, v)} />
            ))}
          </div>
        )}
      </div>

      {/* Empty states */}
      {sortedUsers.length === 0 && totalTasks === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No assigned tasks found</div>
          <div style={{ fontSize: 13 }}>Tasks with a person/developer column assigned will appear here.</div>
        </div>
      )}
      {sortedUsers.length === 0 && totalTasks > 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 13 }}>No tasks match the current filters.</div>
          <button onClick={clearAllFilters} style={{ marginTop: 12, padding: '7px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Clear filters</button>
        </div>
      )}

      {/* User tiles grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {sortedUsers.map(({ user, idx, filtered }) => {
          const uid = String(user.id);
          const localFilter = localFilters[uid] || { search: '', statusFilter: emptyFilter() };
          return (
            <UserTile
              key={uid}
              user={user}
              tasks={filtered}
              paletteIdx={idx}
              localFilter={localFilter}
              onLocalFilterChange={f => setLocalFilters(prev => ({ ...prev, [uid]: f }))}
            />
          );
        })}
      </div>
    </div>
  );
}

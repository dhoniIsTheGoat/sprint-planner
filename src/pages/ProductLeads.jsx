import { useState } from 'react';
import { useProductLeads } from '../hooks/useProductLeads';

/* ── Palette – same as Team Workload ── */
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

const GOAL_STATUSES = ['Not Started', 'In Progress', 'At Risk', 'On Hold', 'Completed'];

const STATUS_STYLES = {
  'Not Started': { bg: '#f1f5f9', color: '#475569',  dot: '#94a3b8' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8',  dot: '#3b82f6' },
  'At Risk':     { bg: '#fee2e2', color: '#b91c1c',  dot: '#ef4444' },
  'On Hold':     { bg: '#fef3c7', color: '#92400e',  dot: '#f59e0b' },
  'Completed':   { bg: '#d1fae5', color: '#065f46',  dot: '#10b981' },
};

/* ── Helpers ── */
function progressColor(progress, status, dueDate) {
  if (status === 'Completed' || progress >= 100) return '#10b981';
  if (status === 'At Risk') return '#ef4444';
  if (dueDate) {
    const d = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (d < 0) return '#ef4444';
    if (d < 7) return '#f97316';
  }
  return '#6366f1';
}

function dueDateInfo(dueDate) {
  if (!dueDate) return null;
  const d = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (d < 0)   return { text: `${Math.abs(d)}d overdue`, color: '#b91c1c', bg: '#fee2e2' };
  if (d === 0) return { text: 'Due today',                color: '#c2410c', bg: '#ffedd5' };
  if (d <= 7)  return { text: `${d}d left`,              color: '#c2410c', bg: '#ffedd5' };
  if (d <= 14) return { text: `${d}d left`,              color: '#b45309', bg: '#fef3c7' };
  return         { text: `${d}d left`,                   color: '#64748b', bg: '#f1f5f9' };
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Avatar ── */
function Avatar({ name, size = 42, accent }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.color, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {status}
    </span>
  );
}

/* ── Goal card (display + edit mode) ── */
function GoalCard({ goal, leadId, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: goal.title, description: goal.description || '', dueDate: goal.dueDate || '', status: goal.status, progress: goal.progress });

  function save() {
    onUpdate(leadId, goal.id, { ...form, progress: Number(form.progress) });
    setEditing(false);
  }

  function cancel() {
    setForm({ title: goal.title, description: goal.description || '', dueDate: goal.dueDate || '', status: goal.status, progress: goal.progress });
    setEditing(false);
  }

  const color  = progressColor(goal.progress, goal.status, goal.dueDate);
  const ddInfo = dueDateInfo(goal.dueDate);

  if (editing) {
    return (
      <div style={{ margin: '8px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: 12 }}>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Goal title"
          style={inputSt}
        />
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          style={{ ...inputSt, resize: 'vertical', marginTop: 6 }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={labelSt}>Due date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inputSt} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelSt}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
              {GOAL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={labelSt}>Progress</label>
            <span style={{ fontSize: 12, fontWeight: 700, color: progressColor(form.progress, form.status, form.dueDate) }}>{form.progress}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={form.progress}
            onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: progressColor(form.progress, form.status, form.dueDate) }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
          <button onClick={cancel} style={cancelBtnSt}>Cancel</button>
          <button onClick={save}   style={saveBtnSt}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: '10px 12px', borderBottom: '1px solid #f8fafc' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, flex: 1 }}>{goal.title}</span>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => setEditing(true)} style={iconBtnSt} title="Edit">✏️</button>
          <button onClick={() => onRemove(leadId, goal.id)} style={{ ...iconBtnSt, color: '#ef4444' }} title="Remove">×</button>
        </div>
      </div>

      {goal.description && (
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{goal.description}</p>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Progress</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{goal.progress}%</span>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${goal.progress}%`, background: color, borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <StatusBadge status={goal.status} />
        {goal.dueDate && (
          <>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(goal.dueDate)}</span>
            {ddInfo && (
              <span style={{ background: ddInfo.bg, color: ddInfo.color, borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                {ddInfo.text}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Add goal inline form ── */
function AddGoalForm({ leadId, onAdd, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', status: 'Not Started' });
  const [err, setErr] = useState('');

  function submit() {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.dueDate)       { setErr('Due date is required'); return; }
    onAdd(leadId, { ...form, title: form.title.trim() });
    onCancel();
  }

  return (
    <div style={{ margin: '8px 12px 12px', background: '#f8fafc', borderRadius: 10, border: '1px dashed #c7d2fe', padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>New Goal</div>
      {err && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 6 }}>{err}</div>}
      <input
        value={form.title}
        onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErr(''); }}
        placeholder="Goal title *"
        style={inputSt}
        autoFocus
      />
      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        rows={2}
        style={{ ...inputSt, resize: 'vertical', marginTop: 6 }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={labelSt}>Due date *</label>
          <input type="date" value={form.dueDate} onChange={e => { setForm(f => ({ ...f, dueDate: e.target.value })); setErr(''); }} style={inputSt} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelSt}>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
            {GOAL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={cancelBtnSt}>Cancel</button>
        <button onClick={submit}   style={saveBtnSt}>Add Goal</button>
      </div>
    </div>
  );
}

/* ── Lead tile ── */
function LeadTile({ lead, paletteIdx, onUpdateGoal, onRemoveGoal, onAddGoal, onRemoveLead, onUpdateLead }) {
  const pal = PALETTE[paletteIdx % PALETTE.length];
  const [addingGoal, setAddingGoal]   = useState(false);
  const [editingLead, setEditingLead] = useState(false);
  const [leadForm, setLeadForm]       = useState({ name: lead.name, email: lead.email || '', role: lead.role || '', product: lead.product || '' });

  const done   = lead.goals.filter(g => g.status === 'Completed').length;
  const atRisk = lead.goals.filter(g => g.status === 'At Risk').length;
  const avg    = lead.goals.length ? Math.round(lead.goals.reduce((s, g) => s + g.progress, 0) / lead.goals.length) : 0;

  function saveLead() {
    if (!leadForm.name.trim()) return;
    onUpdateLead(lead.id, { name: leadForm.name.trim(), email: leadForm.email, role: leadForm.role, product: leadForm.product });
    setEditingLead(false);
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${pal.border}`, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Header */}
      {editingLead ? (
        <div style={{ background: pal.light, padding: '12px 14px', borderBottom: `1px solid ${pal.border}`, borderRadius: '11px 11px 0 0' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input value={leadForm.name}    onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))}    placeholder="Name *"    style={{ ...inputSt, flex: 1 }} autoFocus />
            <input value={leadForm.role}    onChange={e => setLeadForm(f => ({ ...f, role: e.target.value }))}    placeholder="Role"      style={{ ...inputSt, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={leadForm.email}   onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}   placeholder="Email"     style={{ ...inputSt, flex: 1 }} />
            <input value={leadForm.product} onChange={e => setLeadForm(f => ({ ...f, product: e.target.value }))} placeholder="Product area" style={{ ...inputSt, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditingLead(false)} style={cancelBtnSt}>Cancel</button>
            <button onClick={saveLead} style={saveBtnSt}>Save</button>
          </div>
        </div>
      ) : (
        <div style={{ background: pal.light, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${pal.border}`, borderRadius: '11px 11px 0 0' }}>
          <Avatar name={lead.name} size={44} accent={pal.accent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              {[lead.role, lead.product].filter(Boolean).join(' · ')}
            </div>
          </div>
          {/* Summary badges */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ background: pal.accent, color: 'white', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
              {lead.goals.length} goal{lead.goals.length !== 1 ? 's' : ''}
            </span>
            {lead.goals.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {done > 0   && <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 99, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{done} done</span>}
                {atRisk > 0 && <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 99, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{atRisk} at risk</span>}
              </div>
            )}
          </div>
          {/* Edit / delete lead */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => setEditingLead(true)} style={iconBtnSt} title="Edit lead">✏️</button>
            <button onClick={() => { if (window.confirm(`Remove ${lead.name}?`)) onRemoveLead(lead.id); }} style={{ ...iconBtnSt, color: '#ef4444' }} title="Remove lead">×</button>
          </div>
        </div>
      )}

      {/* Overall progress bar (only when there are goals) */}
      {lead.goals.length > 0 && (
        <div style={{ padding: '8px 14px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${avg}%`, background: pal.accent, borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: pal.accent, whiteSpace: 'nowrap' }}>{avg}% avg</span>
        </div>
      )}

      {/* Goal list */}
      <div style={{ flex: 1 }}>
        {lead.goals.length === 0 && !addingGoal && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No goals yet — add one below</div>
        )}
        {lead.goals.map(g => (
          <GoalCard key={g.id} goal={g} leadId={lead.id} onUpdate={onUpdateGoal} onRemove={onRemoveGoal} />
        ))}
        {addingGoal && (
          <AddGoalForm leadId={lead.id} onAdd={onAddGoal} onCancel={() => setAddingGoal(false)} />
        )}
      </div>

      {/* Add goal button */}
      {!addingGoal && (
        <button
          onClick={() => setAddingGoal(true)}
          style={{ padding: '10px 14px', background: '#f8fafc', border: 'none', borderTop: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12, color: pal.accent, fontWeight: 600, textAlign: 'center', width: '100%', borderRadius: '0 0 11px 11px' }}
        >
          + Add Goal
        </button>
      )}
    </div>
  );
}

/* ── Add lead inline form ── */
function AddLeadForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Product Lead', product: '' });
  const [err, setErr] = useState('');

  function submit() {
    if (!form.name.trim()) { setErr('Name is required'); return; }
    onAdd({ ...form, name: form.name.trim() });
    onCancel();
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '2px dashed #a5b4fc', padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>New Product Lead</div>
      {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={form.name}    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErr(''); }} placeholder="Name *"       style={{ ...inputSt, flex: 1 }} autoFocus />
        <input value={form.role}    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}                placeholder="Role"          style={{ ...inputSt, flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={form.email}   onChange={e => setForm(f => ({ ...f, email: e.target.value }))}              placeholder="Email"         style={{ ...inputSt, flex: 1 }} />
        <input value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}            placeholder="Product area"  style={{ ...inputSt, flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={cancelBtnSt}>Cancel</button>
        <button onClick={submit}   style={saveBtnSt}>Add Lead</button>
      </div>
    </div>
  );
}

/* ── Shared micro-styles ── */
const inputSt = {
  width: '100%', padding: '6px 9px', border: '1px solid #e2e8f0', borderRadius: 7,
  fontSize: 12, outline: 'none', color: '#374151', boxSizing: 'border-box', background: 'white',
};
const labelSt  = { display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3, fontWeight: 500 };
const saveBtnSt   = { padding: '6px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const cancelBtnSt = { padding: '6px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const iconBtnSt   = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 4, lineHeight: 1 };

/* ── Main page ── */
export default function ProductLeads() {
  const { leads, addLead, updateLead, removeLead, addGoal, updateGoal, removeGoal } = useProductLeads();
  const [showAddLead, setShowAddLead] = useState(false);
  const [search, setSearch]           = useState('');

  const filtered = leads.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.product || '').toLowerCase().includes(search.toLowerCase())
  );

  /* Stats */
  const totalGoals     = leads.reduce((s, l) => s + l.goals.length, 0);
  const completedGoals = leads.reduce((s, l) => s + l.goals.filter(g => g.status === 'Completed').length, 0);
  const atRiskGoals    = leads.reduce((s, l) => s + l.goals.filter(g => g.status === 'At Risk').length, 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1600, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Product Leads</h1>
          {totalGoals > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
              {leads.length} leads · {totalGoals} goals
              {completedGoals > 0 && <span style={{ color: '#10b981', fontWeight: 600 }}> · {completedGoals} completed</span>}
              {atRiskGoals   > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}> · {atRiskGoals} at risk</span>}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddLead(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
        >
          {showAddLead ? '✕ Cancel' : '+ Add Lead'}
        </button>
      </div>

      {/* Search bar */}
      {leads.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads or product areas…"
              style={{ width: '100%', padding: '7px 10px 7px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
            />
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>

        {/* Add lead form as first cell */}
        {showAddLead && (
          <AddLeadForm onAdd={lead => { addLead(lead); setShowAddLead(false); }} onCancel={() => setShowAddLead(false)} />
        )}

        {filtered.map((lead, idx) => (
          <LeadTile
            key={lead.id}
            lead={lead}
            paletteIdx={idx}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onRemoveGoal={removeGoal}
            onRemoveLead={removeLead}
            onUpdateLead={updateLead}
          />
        ))}
      </div>

      {/* Empty state */}
      {leads.length === 0 && !showAddLead && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🎯</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No product leads yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Add a product lead to start tracking their goals and progress.</div>
          <button onClick={() => setShowAddLead(true)} style={{ padding: '9px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Add First Lead
          </button>
        </div>
      )}

      {filtered.length === 0 && leads.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 13 }}>
          No leads match "{search}"
        </div>
      )}
    </div>
  );
}

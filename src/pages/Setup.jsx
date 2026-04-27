import { useState, useCallback } from 'react';

/* ── Shared constants ── */
const COLORS = [
  "#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6",
  "#14b8a6","#f97316","#ef4444","#0ea5e9","#84cc16","#f43f5e",
  "#06b6d4","#a855f7","#eab308","#64748b","#22c55e"
];
const SK = "sprint_planner_v4";
const uid = () => Math.random().toString(36).slice(2, 8);
const btn = { padding: "6px 14px", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 };

function loadSprintData() {
  try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch { return {}; }
}
function persistSprintData(data) {
  try { localStorage.setItem(SK, JSON.stringify(data)); } catch {}
}
/* ── Sidebar sections ── */
const SECTIONS = [
  { id: 'resources',  label: 'Resources & Products' },
  { id: 'api-config', label: 'API Configuration'    },
  { id: 'about',      label: 'About'                },
];

/* ──────────────────────────────────────────
   Resources & Products section
────────────────────────────────────────── */
function ResourcesSection() {
  const [d, setD]             = useState(() => loadSprintData());
  const [newRes, setNewRes]   = useState({ name: "", capacity: "80" });
  const [newProd, setNewProd] = useState({ name: "" });
  const [colorIdx, setColorIdx] = useState(0);

  const save = useCallback(nd => { setD(nd); persistSprintData(nd); }, []);

  const addResource = () => {
    if (!newRes.name.trim()) return;
    save({ ...d, resources: [...(d.resources || []), { id: uid(), name: newRes.name.trim(), capacity: parseInt(newRes.capacity) || 80 }] });
    setNewRes({ name: "", capacity: "80" });
  };

  const addProduct = () => {
    if (!newProd.name.trim()) return;
    save({ ...d, products: [...(d.products || []), { id: uid(), name: newProd.name.trim(), color: COLORS[colorIdx] }] });
    setColorIdx((colorIdx + 1) % COLORS.length);
    setNewProd({ name: "" });
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Resources & Products</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>Manage your team members and product categories.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Resources */}
        <div>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Resources</h3>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {(d.resources || []).length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No resources added yet</div>
            )}
            {(d.resources || []).map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.capacity}h / sprint</div>
                </div>
                <button onClick={() => save({ ...d, resources: d.resources.filter(x => x.id !== r.id) })}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px 8px" }}>×</button>
              </div>
            ))}
            <div style={{ padding: 12, display: "flex", gap: 8, background: "#f8fafc", alignItems: "center" }}>
              <input placeholder="Full name" value={newRes.name} onChange={e => setNewRes({ ...newRes, name: e.target.value })}
                onKeyDown={e => e.key === "Enter" && addResource()}
                style={{ flex: 1, padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none" }} />
              <input type="number" placeholder="Hours" value={newRes.capacity} onChange={e => setNewRes({ ...newRes, capacity: e.target.value })}
                style={{ width: 76, padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none" }} />
              <button onClick={addResource} style={{ ...btn, background: "#6366f1", padding: "6px 12px" }}>Add</button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Products</h3>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {(d.products || []).length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No products added yet</div>
            )}
            {(d.products || []).map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{p.name}</div>
                </div>
                <button onClick={() => save({ ...d, products: d.products.filter(x => x.id !== p.id) })}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px 8px" }}>×</button>
              </div>
            ))}
            <div style={{ padding: 12, background: "#f8fafc" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input placeholder="Product name" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && addProduct()}
                  style={{ flex: 1, padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none" }} />
                <button onClick={addProduct} style={{ ...btn, background: "#6366f1", padding: "6px 12px" }}>Add</button>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                {COLORS.map((c, i) => (
                  <div key={c} onClick={() => setColorIdx(i)} style={{
                    width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                    border: `2px solid ${colorIdx === i ? "#1e293b" : "transparent"}`,
                    boxSizing: "border-box", transform: colorIdx === i ? "scale(1.2)" : "scale(1)", transition: "transform 0.1s"
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   API Configuration section
────────────────────────────────────────── */
function ApiConfigSection() {
  const mondayToken = import.meta.env.VITE_MONDAY_API_TOKEN;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  function StatusBadge({ connected }) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
        background: connected ? '#dcfce7' : '#fee2e2',
        color: connected ? '#16a34a' : '#dc2626',
      }}>
        {connected ? '✅ Connected' : '❌ Missing'}
      </span>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>API Configuration</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
          Status of your API credentials. Set these in a <code>.env</code> file at the project root.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Monday.com token */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>Monday.com API Token</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Required for Sprint Review, Time Log, Dashboard, and Quarterly Goals</div>
            </div>
            <StatusBadge connected={!!mondayToken} />
          </div>
          {!mondayToken && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>How to set up:</div>
              <ol style={{ margin: 0, paddingLeft: 18, color: '#64748b', lineHeight: 1.8 }}>
                <li>Go to <strong>Monday.com</strong> → Profile → Developers → API</li>
                <li>Copy your Personal API Token (v2)</li>
                <li>Add to <code>.env</code> at the project root:</li>
              </ol>
              <pre style={{ marginTop: 10, background: '#1e293b', borderRadius: 6, padding: 12, fontSize: 12, color: '#94a3b8', overflow: 'auto' }}>
                {`VITE_MONDAY_API_TOKEN=your_token_here`}
              </pre>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Restart the dev server after adding the token.</div>
            </div>
          )}
        </div>

        {/* Anthropic key */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>Anthropic API Key</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Required for the AI Sprint Assistant (chat panel)</div>
            </div>
            <StatusBadge connected={!!anthropicKey} />
          </div>
          {!anthropicKey && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>How to set up:</div>
              <ol style={{ margin: 0, paddingLeft: 18, color: '#64748b', lineHeight: 1.8 }}>
                <li>Go to <strong>console.anthropic.com</strong> → API Keys</li>
                <li>Create a new API key</li>
                <li>Add to <code>.env</code> at the project root:</li>
              </ol>
              <pre style={{ marginTop: 10, background: '#1e293b', borderRadius: 6, padding: 12, fontSize: 12, color: '#94a3b8', overflow: 'auto' }}>
                {`VITE_ANTHROPIC_API_KEY=your_key_here`}
              </pre>
            </div>
          )}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16, fontSize: 13, color: '#92400e' }}>
          <strong>Security note:</strong> These tokens are stored in <code>.env</code> and bundled at build time.
          This is appropriate for an internal tool. Do not deploy publicly with these credentials.
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   About section
────────────────────────────────────────── */
function AboutSection() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>About</h2>
      </div>
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#6366f1' }}>Planer</div>
          <div style={{ fontSize: 12, background: '#e0e7ff', color: '#4f46e5', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
            v1.0
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.7 }}>
          Planer is an internal sprint planning and review tool for engineering teams.
          It connects to Monday.com to surface sprint data, time tracking, release health,
          and quarterly goal progress in one place.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Sprint Review', desc: 'Per-person task breakdown with time tracking from Monday.com sprints' },
            { label: 'Hours Logged', desc: 'Aggregated time tracking across all mapped Monday.com boards' },
            { label: 'Dashboard', desc: 'Release progress bars for all Project Boards in Connect workspace' },
            { label: 'Quarterly Goals', desc: 'Health tracking for quarterly commitments with escalation alerts' },
            { label: 'AI Assistant', desc: 'Claude-powered chat that queries Monday.com in real time' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 5, flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{f.label}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}> — {f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main Setup page
────────────────────────────────────────── */
export default function Setup() {
  const [activeSection, setActiveSection] = useState('resources');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 47px)', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, flexShrink: 0,
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 0',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 16px', marginBottom: 8 }}>
          Settings
        </div>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 16px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400,
              color: activeSection === s.id ? '#6366f1' : '#374151',
              background: activeSection === s.id ? '#eff0ff' : 'transparent',
              borderLeft: activeSection === s.id ? '3px solid #6366f1' : '3px solid transparent',
              transition: 'background 0.1s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, padding: 32, maxWidth: 900, overflowY: 'auto' }}>
        {activeSection === 'resources'  && <ResourcesSection />}
        {activeSection === 'api-config' && <ApiConfigSection />}
        {activeSection === 'about'      && <AboutSection />}
      </div>
    </div>
  );
}

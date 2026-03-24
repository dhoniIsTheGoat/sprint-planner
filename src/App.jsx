import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import * as XLSX from "xlsx";
import NavBar       from "./components/NavBar";
import BoardMapping from "./pages/BoardMapping";
import TimeLog      from "./pages/TimeLog";
import Setup        from "./pages/Setup";
import Dashboard      from "./pages/Dashboard";
import QuarterlyGoals from "./pages/QuarterlyGoals";

const COLORS = [
  "#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6",
  "#14b8a6","#f97316","#ef4444","#0ea5e9","#84cc16","#f43f5e",
  "#06b6d4","#a855f7","#eab308","#64748b","#22c55e"
];
const SK  = "sprint_planner_v4";
const uid = () => Math.random().toString(36).slice(2, 8);

const DEFAULT_RESOURCES = [
  "Piyush","Adelene","Parameswar","Sham","Kiran","Animesh",
  "Kamal","Pramod","Tyler","Prem","Nirupam","Srimathi",
  "Bhaskar","Dominick","Satya","Deepanshu","Yashwanth","Yogi"
].map((name, i) => ({ id: `r${i + 1}`, name, capacity: 80 }));

const DEFAULT_PRODUCTS = [
  "Clarity","Prime UI","HMC","Connect","Pay Portal","DSH",
  "Deployments","Equifax Connectors","EWA","SF Pay Connectors",
  "W4","PlanSource","WOTC","PrimeTime Tracking","Overtime Approval",
  "Misc (Training)","PTO / Holidays","Product Testing"
].map((name, i) => ({ id: `p${i + 1}`, name, color: COLORS[i % COLORS.length] }));

const SEED = {
  resources: DEFAULT_RESOURCES,
  products: DEFAULT_PRODUCTS,
  sprints: [],
  currentSprintId: null,
};

/* ── Styles ── */
const tbl = { width:"100%", borderCollapse:"collapse", background:"white", borderRadius:10, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", fontSize:13 };
const th  = { padding:"10px 14px", background:"#f1f5f9", fontWeight:600, color:"#475569", textAlign:"center", fontSize:12, borderBottom:"1px solid #e2e8f0", whiteSpace:"nowrap", position:"sticky", top:0, zIndex:1 };
const td  = { padding:"10px 14px", borderBottom:"1px solid #f1f5f9", color:"#374151", textAlign:"center" };
const btn = { padding:"6px 14px", color:"white", border:"none", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:600 };
const inp = { padding:"6px 10px", borderRadius:6, border:"1px solid #334155", background:"#1e293b", color:"white", fontSize:13 };

/* ── Helpers ── */
const normalize = s => (s || "").toString().toLowerCase().replace(/[\s\-_/]+/g, "").replace(/[^a-z0-9]/g, "");

function matchName(cell, list) {
  const n = normalize(cell);
  return list.find(x =>
    normalize(x.name) === n ||
    normalize(x.name).startsWith(n) ||
    n.startsWith(normalize(x.name))
  );
}

function parseSheet(ws, resources, products) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!rows.length) return [];
  let headerRowIdx = 0, bestScore = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const score = rows[i].filter(c => matchName(c, products)).length;
    if (score > bestScore) { bestScore = score; headerRowIdx = i; }
  }
  const headerRow = rows[headerRowIdx];
  const colMap = {};
  headerRow.forEach((cell, ci) => {
    const p = matchName(cell, products);
    if (p) colMap[ci] = p;
  });
  const allocations = [];
  for (let ri = headerRowIdx + 1; ri < rows.length; ri++) {
    const row = rows[ri];
    const resource = matchName(row[0], resources);
    if (!resource) continue;
    Object.entries(colMap).forEach(([ci, product]) => {
      const hours = parseFloat(row[ci]);
      if (!isNaN(hours) && hours > 0)
        allocations.push({ rId: resource.id, pId: product.id, hours });
    });
  }
  return allocations;
}

/* ── localStorage helpers ── */
function loadData() {
  try {
    const raw = localStorage.getItem(SK);
    if (!raw) {
      persistData(SEED);
      return SEED;
    }
    const stored = JSON.parse(raw);
    // Merge in any default products that don't exist yet (e.g. newly added ones)
    const existingNames = new Set((stored.products || []).map(p => p.name));
    const missing = DEFAULT_PRODUCTS.filter(p => !existingNames.has(p.name));
    if (missing.length > 0) {
      const merged = { ...stored, products: [...(stored.products || []), ...missing] };
      persistData(merged);
      return merged;
    }
    return stored;
  } catch {
    persistData(SEED);
    return SEED;
  }
}

function persistData(data) {
  try { localStorage.setItem(SK, JSON.stringify(data)); } catch {}
}

/* ── Import Modal ── */
function ImportModal({ d, onImport, onClose }) {
  const fileRef = useRef();
  const [status,   setStatus]   = useState("idle");
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState([]);
  const [selected, setSelected] = useState({});

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus("parsing");
    setError("");
    try {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: "array" });
      const items = [];
      wb.SheetNames.forEach(name => {
        const lower = name.trim().toLowerCase();
        let type = null;
        if (lower.startsWith("prep"))    type = "plan";
        if (lower.startsWith("planned")) type = "actual";
        if (!type) return;
        const ws         = wb.Sheets[name];
        const allocs     = parseSheet(ws, d.resources, d.products);
        const sprintName = name.trim().replace(/^(prep|planned)\s*/i, "").trim() || name;
        items.push({ sheetName: name, type, sprintName, allocs });
      });
      if (!items.length) throw new Error("No sheets found with 'Prep' or 'Planned' prefix.");
      const grouped = {};
      items.forEach(item => {
        if (!grouped[item.sprintName]) grouped[item.sprintName] = { sprintName: item.sprintName, plan: [], actual: [] };
        if (item.type === "plan")   grouped[item.sprintName].plan   = item.allocs;
        if (item.type === "actual") grouped[item.sprintName].actual = item.allocs;
      });
      const result = Object.values(grouped);
      const sel = {};
      result.forEach((_, i) => sel[i] = true);
      setPreview(result);
      setSelected(sel);
      setStatus("preview");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const doImport = () => {
    const toImport = preview.filter((_, i) => selected[i]);
    if (!toImport.length) return;
    const newSprints = [...d.sprints];
    let lastId = d.currentSprintId;
    toImport.forEach(({ sprintName, plan, actual }) => {
      const aMap = {};
      plan.forEach(({ rId, pId, hours }) => { aMap[`${rId}__${pId}`] = { rId, pId, planned: hours, actual: 0 }; });
      actual.forEach(({ rId, pId, hours }) => {
        const k = `${rId}__${pId}`;
        if (aMap[k]) aMap[k].actual = hours;
        else aMap[k] = { rId, pId, planned: 0, actual: hours };
      });
      const existing = newSprints.find(s => s.name === sprintName);
      if (existing) {
        existing.allocations = Object.values(aMap);
      } else {
        const id = uid();
        newSprints.push({ id, name: sprintName, start: "", end: "", allocations: Object.values(aMap) });
        lastId = id;
      }
    });
    onImport({ ...d, sprints: newSprints, currentSprintId: lastId });
  };

  const overlay = { position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24 };
  const modal   = { background:"white",borderRadius:14,width:"100%",maxWidth:580,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#1e293b"}}>📥 Import from Spreadsheet</h2>
            <p style={{margin:"4px 0 0",fontSize:13,color:"#64748b"}}>Upload your .xlsx — Prep tabs → Plan, Planned tabs → Actuals</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#94a3b8",lineHeight:1}}>×</button>
        </div>
        <div style={{padding:24}}>
          {status === "idle" && (
            <div>
              <div style={{background:"#f8fafc",border:"2px dashed #cbd5e1",borderRadius:10,padding:32,textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:36,marginBottom:8}}>📊</div>
                <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:4}}>Select your .xlsx file</div>
                <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Google Sheets → File → Download → Microsoft Excel (.xlsx)</div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{display:"none"}} />
                <button onClick={() => fileRef.current.click()} style={{...btn,background:"#6366f1",padding:"10px 24px",fontSize:14}}>Choose File</button>
              </div>
              <div style={{background:"#f0f9ff",borderRadius:8,padding:12,fontSize:12,color:"#0369a1"}}>
                <strong>Tip:</strong> Tabs starting with <code>Prep</code> → planned hours. Tabs starting with <code>Planned</code> → actuals.
              </div>
            </div>
          )}
          {status === "parsing" && (
            <div style={{textAlign:"center",padding:40,color:"#64748b"}}>
              <div style={{fontSize:32,marginBottom:8}}>⏳</div>Parsing spreadsheet...
            </div>
          )}
          {status === "error" && (
            <div>
              <div style={{background:"#fee2e2",borderRadius:8,padding:16,color:"#dc2626",marginBottom:16,fontSize:13}}><strong>Error:</strong> {error}</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{display:"none"}} />
              <button onClick={() => fileRef.current.click()} style={{...btn,background:"#6366f1"}}>Try Again</button>
            </div>
          )}
          {status === "preview" && (
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#475569",marginBottom:12}}>Found {preview.length} sprint(s) — select which to import:</div>
              {preview.map((item, i) => (
                <div key={i} style={{border:`2px solid ${selected[i]?"#6366f1":"#e2e8f0"}`,borderRadius:10,padding:14,marginBottom:10,cursor:"pointer",background:selected[i]?"#f5f3ff":"white"}}
                  onClick={() => setSelected({ ...selected, [i]: !selected[i] })}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selected[i]?"#6366f1":"#cbd5e1"}`,background:selected[i]?"#6366f1":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {selected[i] && <span style={{color:"white",fontSize:11,fontWeight:700}}>✓</span>}
                      </div>
                      <div>
                        <div style={{fontWeight:700,color:"#1e293b",fontSize:14}}>{item.sprintName}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>
                          {item.plan.length > 0 && `${item.plan.length} planned allocations`}
                          {item.plan.length > 0 && item.actual.length > 0 && " · "}
                          {item.actual.length > 0 && `${item.actual.length} actual allocations`}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {item.plan.length   > 0 && <span style={{background:"#e0e7ff",color:"#4f46e5",borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:600}}>Plan</span>}
                      {item.actual.length > 0 && <span style={{background:"#dcfce7",color:"#16a34a",borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:600}}>Actuals</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
                <button onClick={onClose} style={{...btn,background:"#94a3b8"}}>Cancel</button>
                <button onClick={doImport} disabled={!Object.values(selected).some(Boolean)}
                  style={{...btn,background:"#6366f1",opacity:Object.values(selected).some(Boolean)?1:0.4}}>
                  Import {Object.values(selected).filter(Boolean).length} Sprint(s)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Root App with routing ── */
export default function App() {
  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <NavBar />
      <Routes>
        <Route path="/"              element={<SprintPlanner />} />
        <Route path="/board-mapping" element={<BoardMapping />} />
        <Route path="/time-log"      element={<TimeLog />} />
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/quarterly-goals" element={<QuarterlyGoals />} />
        <Route path="/setup"           element={<Setup />} />
      </Routes>
    </div>
  );
}

/* ── Sprint Planner (original App) ── */
function SprintPlanner() {
  const [d, setD]             = useState(() => loadData());
  const [tab, setTab]         = useState("plan");
  const [ns, setNs]           = useState({ show: false, name: "", start: "", end: "" });
  const [showImport, setShowImport] = useState(false);

  const save = useCallback(nd => {
    setD(nd);
    persistData(nd);
  }, []);

  const handleImport = nd => { save(nd); setShowImport(false); };

  const sprint = d.sprints.find(s => s.id === d.currentSprintId);

  const getA = (rId, pId, type = "planned") => {
    if (!sprint) return 0;
    return sprint.allocations?.find(x => x.rId === rId && x.pId === pId)?.[type] ?? 0;
  };

  const setA = (rId, pId, val, type = "planned") => {
    if (!sprint) return;
    const allocs = [...(sprint.allocations || [])];
    const n = parseFloat(val) || 0;
    const i = allocs.findIndex(x => x.rId === rId && x.pId === pId);
    if (i >= 0) allocs[i] = { ...allocs[i], [type]: n };
    else allocs.push({ rId, pId, planned: type === "planned" ? n : 0, actual: type === "actual" ? n : 0 });
    save({ ...d, sprints: d.sprints.map(s => s.id === sprint.id ? { ...s, allocations: allocs } : s) });
  };

  const rTotal = (rId, t = "planned") => d.products.reduce((s, p) => s + (getA(rId, p.id, t) || 0), 0);
  const pTotal = (pId, t = "planned") => d.resources.reduce((s, r) => s + (getA(r.id, pId, t) || 0), 0);
  const grand  = (t = "planned")      => d.resources.reduce((s, r) => s + rTotal(r.id, t), 0);

  const createSprint = () => {
    if (!ns.name.trim()) return;
    const id = uid();
    save({ ...d, sprints: [...d.sprints, { id, name: ns.name.trim(), start: ns.start, end: ns.end, allocations: [] }], currentSprintId: id });
    setNs({ show: false, name: "", start: "", end: "" });
  };

  const TABS = [
    { id: "plan",    label: "📋 Plan" },
    { id: "summary", label: "📊 Summary" },
    { id: "actuals", label: "✅ Actuals" },
  ];

  const shared = { d, sprint, getA, setA, rTotal, pTotal, grand };

  return (
    <div>
      {showImport && <ImportModal d={d} onImport={handleImport} onClose={() => setShowImport(false)} />}

      {/* Header */}
      <div style={{ background:"#1e293b", color:"white", padding:"16px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:"-0.3px" }}>🚀 Sprint Planner</h1>
            {sprint?.start && <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{sprint.start} → {sprint.end}</div>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            {d.sprints.length > 0 && (
              <select value={d.currentSprintId || ""} onChange={e => save({ ...d, currentSprintId: e.target.value })}
                style={{ padding:"6px 10px", borderRadius:6, border:"1px solid #334155", background:"#0f172a", color:"white", fontSize:13 }}>
                {d.sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <button onClick={() => setShowImport(true)} style={{ ...btn, background:"#0f172a", border:"1px solid #334155" }}>📥 Import</button>
            <button onClick={() => setNs({ ...ns, show: !ns.show })} style={{ ...btn, background:"#6366f1" }}>+ New Sprint</button>
          </div>
        </div>

        {ns.show && (
          <div style={{ marginTop:16, background:"#0f172a", borderRadius:8, padding:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>Sprint Name *</div>
              <input value={ns.name} onChange={e => setNs({ ...ns, name: e.target.value })} placeholder="Sprint 42"
                style={{ ...inp, width:140 }} onKeyDown={e => e.key === "Enter" && createSprint()} />
            </div>
            <div>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>Start</div>
              <input type="date" value={ns.start} onChange={e => setNs({ ...ns, start: e.target.value })} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>End</div>
              <input type="date" value={ns.end} onChange={e => setNs({ ...ns, end: e.target.value })} style={inp} />
            </div>
            <button onClick={createSprint} style={{ ...btn, background:"#10b981" }}>Create</button>
            <button onClick={() => setNs({ ...ns, show: false })} style={{ ...btn, background:"#475569" }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", display:"flex", position:"sticky", top:46, zIndex:90 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"12px 20px", border:"none", background:"transparent", cursor:"pointer", fontSize:13,
            fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? "#6366f1" : "#64748b",
            borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:24 }}>
        {tab === "plan"    && <PlanTab    {...shared} />}
        {tab === "summary" && <SummaryTab {...shared} />}
        {tab === "actuals" && <ActualsTab {...shared} />}
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div style={{ textAlign:"center", padding:64, color:"#94a3b8" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
      <div style={{ fontSize:16, fontWeight:600, color:"#475569", marginBottom:4 }}>No Sprint Selected</div>
      <div style={{ fontSize:14 }}>Create a new sprint or import your spreadsheet using the buttons above.</div>
    </div>
  );
}

/* ── Plan Tab ── */
function PlanTab({ d, sprint, getA, setA, rTotal, pTotal, grand }) {
  if (!sprint) return <EmptyState />;
  const totalCap = d.resources.reduce((s, r) => s + r.capacity, 0);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1e293b" }}>{sprint.name}</h2>
          <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>
            Total planned: <strong>{grand("planned")}h</strong> · Team capacity: <strong>{totalCap}h</strong>
          </div>
        </div>
      </div>
      <div style={{ overflow:"auto", maxHeight:"calc(100vh - 230px)" }}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign:"left", width:160 }}>Resource</th>
              {d.products.map(p => (
                <th key={p.id} style={{ ...th, minWidth:110 }}>
                  <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:p.color, marginRight:5 }} />
                  {p.name}
                </th>
              ))}
              <th style={{ ...th, background:"#e2e8f0" }}>Total</th>
              <th style={{ ...th, background:"#e2e8f0" }}>Capacity</th>
              <th style={{ ...th, background:"#e2e8f0" }}>Used</th>
            </tr>
          </thead>
          <tbody>
            {d.resources.map((r, i) => {
              const total = rTotal(r.id), pct = r.capacity > 0 ? Math.round(total / r.capacity * 100) : 0, over = total > r.capacity;
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                  <td style={{ ...td, textAlign:"left", fontWeight:600, color:"#1e293b" }}>{r.name}</td>
                  {d.products.map(p => {
                    const val = getA(r.id, p.id);
                    return (
                      <td key={p.id} style={td}>
                        <input type="number" min="0" value={val || ""}
                          onChange={e => setA(r.id, p.id, e.target.value)}
                          style={{ width:70, padding:"4px 8px", border:`1px solid ${val > 0 ? "#a5b4fc" : "#e2e8f0"}`,
                            borderRadius:4, fontSize:13, textAlign:"center", background: val > 0 ? "#eef2ff" : "white", outline:"none" }} />
                      </td>
                    );
                  })}
                  <td style={{ ...td, fontWeight:700, color: over ? "#ef4444" : "#1e293b", background:"#f1f5f9" }}>{total}h</td>
                  <td style={{ ...td, color:"#64748b", background:"#f1f5f9" }}>{r.capacity}h</td>
                  <td style={{ ...td, background:"#f1f5f9" }}>
                    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:99, fontSize:12, fontWeight:600,
                      background: over ? "#fee2e2" : pct > 80 ? "#fef3c7" : "#dcfce7",
                      color: over ? "#dc2626" : pct > 80 ? "#d97706" : "#16a34a" }}>{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:"#f1f5f9", fontWeight:700 }}>
              <td style={{ ...td, textAlign:"left" }}>Total</td>
              {d.products.map(p => <td key={p.id} style={{ ...td, color:"#4f46e5", fontWeight:700 }}>{pTotal(p.id)}h</td>)}
              <td style={{ ...td, color:"#4f46e5", fontSize:15, fontWeight:800 }}>{grand()}h</td>
              <td style={td}>{totalCap}h</td>
              <td style={td} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Summary Tab ── */
function SummaryTab({ d, sprint, getA, rTotal, pTotal, grand }) {
  if (!sprint) return <EmptyState />;
  return (
    <div>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#1e293b" }}>{sprint.name} — Planning Summary</h2>
          {sprint.start && <div style={{ fontSize:13, color:"#64748b" }}>{sprint.start} → {sprint.end}</div>}
        </div>
        <button className="no-print" onClick={() => window.print()} style={{ ...btn, background:"#6366f1" }}>🖨 Print</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
        {d.products.map(p => (
          <div key={p.id} style={{ background:"white", borderRadius:10, padding:16, borderLeft:`4px solid ${p.color}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight:700, color:"#1e293b", marginBottom:6 }}>{p.name}</div>
            <div style={{ fontSize:28, fontWeight:800, color:p.color }}>{pTotal(p.id)}h</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:10 }}>{d.resources.filter(r => getA(r.id, p.id) > 0).length} contributor(s)</div>
            {d.resources.filter(r => getA(r.id, p.id) > 0).map(r => (
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#475569", padding:"3px 0", borderTop:"1px solid #f1f5f9" }}>
                <span>{r.name}</span><span style={{ fontWeight:600 }}>{getA(r.id, p.id)}h</span>
              </div>
            ))}
            {d.resources.filter(r => getA(r.id, p.id) > 0).length === 0 && <div style={{ fontSize:12, color:"#cbd5e1" }}>No allocations yet</div>}
          </div>
        ))}
      </div>
      <h3 style={{ fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.5px" }}>Resource Breakdown</h3>
      <div style={{ overflow:"auto", maxHeight:"calc(100vh - 230px)" }}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign:"left" }}>Resource</th>
              {d.products.map(p => <th key={p.id} style={th}><span style={{ color:p.color }}>■</span> {p.name}</th>)}
              <th style={th}>Total</th><th style={th}>Capacity</th><th style={th}>Available</th>
            </tr>
          </thead>
          <tbody>
            {d.resources.map((r, i) => {
              const total = rTotal(r.id), avail = r.capacity - total;
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                  <td style={{ ...td, textAlign:"left", fontWeight:600 }}>{r.name}</td>
                  {d.products.map(p => <td key={p.id} style={td}>{getA(r.id, p.id) || "—"}</td>)}
                  <td style={{ ...td, fontWeight:700 }}>{total}h</td>
                  <td style={td}>{r.capacity}h</td>
                  <td style={{ ...td, fontWeight:600, color: avail < 0 ? "#dc2626" : avail === 0 ? "#d97706" : "#16a34a" }}>{avail > 0 ? "+" : ""}{avail}h</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:"#f1f5f9", fontWeight:700 }}>
              <td style={{ ...td, textAlign:"left" }}>Total</td>
              {d.products.map(p => <td key={p.id} style={{ ...td, color:"#4f46e5" }}>{pTotal(p.id)}h</td>)}
              <td style={{ ...td, color:"#4f46e5" }}>{grand()}h</td>
              <td style={td}>{d.resources.reduce((s, r) => s + r.capacity, 0)}h</td>
              <td style={td} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Actuals Tab ── */
function ActualsTab({ d, sprint, getA, setA, rTotal, pTotal, grand }) {
  if (!sprint) return <EmptyState />;
  const gPl = grand("planned"), gAc = grand("actual"), gDiff = gAc - gPl;
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1e293b" }}>{sprint.name} — Planned vs Actual</h2>
        <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
          Planned: <strong>{gPl}h</strong> · Actual: <strong>{gAc}h</strong> · Variance:{" "}
          <strong style={{ color: gDiff > 0 ? "#dc2626" : gDiff < 0 ? "#16a34a" : "#64748b" }}>{gDiff > 0 ? "+" : ""}{gDiff}h</strong>
        </div>
      </div>
      <div style={{ overflow:"auto", maxHeight:"calc(100vh - 230px)" }}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign:"left" }} rowSpan={2}>Resource</th>
              {d.products.map(p => <th key={p.id} style={{ ...th, borderBottom:"none" }} colSpan={3}><span style={{ color:p.color }}>■</span> {p.name}</th>)}
              <th style={th} colSpan={3}>Total</th>
            </tr>
            <tr>
              {d.products.flatMap(p => [
                <th key={p.id + "-pl"} style={{ ...th, fontSize:10, fontWeight:500, color:"#94a3b8" }}>Plan</th>,
                <th key={p.id + "-ac"} style={{ ...th, fontSize:10, fontWeight:500, color:"#94a3b8" }}>Act</th>,
                <th key={p.id + "-d"}  style={{ ...th, fontSize:10, fontWeight:500, color:"#94a3b8" }}>Δ</th>,
              ])}
              <th style={{ ...th, fontSize:10, fontWeight:500, color:"#94a3b8" }}>Plan</th>
              <th style={{ ...th, fontSize:10, fontWeight:500, color:"#94a3b8" }}>Act</th>
              <th style={{ ...th, fontSize:10, fontWeight:500, color:"#94a3b8" }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {d.resources.map((r, i) => {
              const tPl = rTotal(r.id, "planned"), tAc = rTotal(r.id, "actual"), tDiff = tAc - tPl;
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                  <td style={{ ...td, textAlign:"left", fontWeight:600 }}>{r.name}</td>
                  {d.products.flatMap(p => {
                    const plan = getA(r.id, p.id, "planned"), act = getA(r.id, p.id, "actual"), diff = act - plan;
                    return [
                      <td key={`${r.id}-${p.id}-p`} style={{ ...td, color:"#64748b" }}>{plan || "—"}</td>,
                      <td key={`${r.id}-${p.id}-a`} style={td}>
                        <input type="number" min="0" value={act || ""} onChange={e => setA(r.id, p.id, e.target.value, "actual")}
                          style={{ width:54, padding:"3px 6px", border:"1px solid #e2e8f0", borderRadius:4, fontSize:12, textAlign:"center", outline:"none" }} />
                      </td>,
                      <td key={`${r.id}-${p.id}-d`} style={td}>
                        {(plan > 0 || act > 0) ? <span style={{ fontSize:12, fontWeight:600, color: diff > 0 ? "#dc2626" : diff < 0 ? "#16a34a" : "#94a3b8" }}>{diff > 0 ? "+" : ""}{diff}</span> : "—"}
                      </td>,
                    ];
                  })}
                  <td style={{ ...td, fontWeight:700 }}>{tPl}h</td>
                  <td style={{ ...td, fontWeight:700 }}>{tAc}h</td>
                  <td style={td}><span style={{ fontWeight:700, color: tDiff > 0 ? "#dc2626" : tDiff < 0 ? "#16a34a" : "#94a3b8" }}>{tDiff > 0 ? "+" : ""}{tDiff}</span></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:"#f1f5f9", fontWeight:700 }}>
              <td style={{ ...td, textAlign:"left" }}>Total</td>
              {d.products.flatMap(p => {
                const pl = pTotal(p.id, "planned"), ac = pTotal(p.id, "actual"), diff = ac - pl;
                return [
                  <td key={p.id + "-fp"} style={td}>{pl}h</td>,
                  <td key={p.id + "-fa"} style={td}>{ac}h</td>,
                  <td key={p.id + "-fd"} style={{ ...td, color: diff > 0 ? "#dc2626" : diff < 0 ? "#16a34a" : "#94a3b8" }}>{diff > 0 ? "+" : ""}{diff}</td>,
                ];
              })}
              <td style={{ ...td, color:"#4f46e5" }}>{gPl}h</td>
              <td style={{ ...td, color:"#4f46e5" }}>{gAc}h</td>
              <td style={{ ...td, fontWeight:800, color: gDiff > 0 ? "#dc2626" : gDiff < 0 ? "#16a34a" : "#94a3b8" }}>{gDiff > 0 ? "+" : ""}{gDiff}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Setup Tab ── */

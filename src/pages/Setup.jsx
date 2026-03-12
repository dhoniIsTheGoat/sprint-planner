import { useState, useCallback } from 'react';

const COLORS = [
  "#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6",
  "#14b8a6","#f97316","#ef4444","#0ea5e9","#84cc16","#f43f5e",
  "#06b6d4","#a855f7","#eab308","#64748b","#22c55e"
];
const SK  = "sprint_planner_v4";
const uid = () => Math.random().toString(36).slice(2, 8);
const btn = { padding:"6px 14px", color:"white", border:"none", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:600 };

function loadData() {
  try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch { return {}; }
}

function persistData(data) {
  try { localStorage.setItem(SK, JSON.stringify(data)); } catch {}
}

export default function Setup() {
  const [d, setD]             = useState(() => loadData());
  const [newRes, setNewRes]   = useState({ name: "", capacity: "80" });
  const [newProd, setNewProd] = useState({ name: "" });
  const [colorIdx, setColorIdx] = useState(0);

  const save = useCallback(nd => { setD(nd); persistData(nd); }, []);

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
    <div style={{ padding: 24, fontFamily: "system-ui,-apple-system,sans-serif", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Setup</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>Manage your team resources and products.</p>
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

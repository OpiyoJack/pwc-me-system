"use client";
import { useState } from "react";
import { addFrameworkNode, deleteFrameworkNode, addIndicatorToNode, assignIndicatorToNode } from "./actions";
import IndicatorProgress from "../IndicatorProgress";

const inputStyle = { padding: "7px 9px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };

function IndicatorLine({ indicator, projectId, canEdit }) {
  return <IndicatorProgress indicator={indicator} canEdit={canEdit} projectId={projectId} />;
}

function NodeForm({ onSubmit, onCancel, placeholderTitle }) {
  return (
    <form action={onSubmit} style={{ background: "#F3EDE0", borderRadius: 8, padding: 10, marginTop: 8, display: "grid", gap: 6 }}>
      <input name="levelLabel" placeholder="Level label (e.g. Outcome, Output)" required style={inputStyle} />
      <input name="title" placeholder={placeholderTitle || "Title / statement"} required style={inputStyle} />
      <textarea name="description" placeholder="Description (optional)" style={{ ...inputStyle, minHeight: 44 }} />
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Save</button>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, cursor: "pointer" }}>Cancel</button>
      </div>
    </form>
  );
}

function IndicatorForm({ onSubmit, onCancel }) {
  return (
    <form action={onSubmit} style={{ background: "#F3EDE0", borderRadius: 8, padding: 10, marginTop: 8, display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 6 }}>
      <input name="name" placeholder="Indicator name" required style={inputStyle} />
      <input name="target" type="number" placeholder="Target" required style={inputStyle} />
      <input name="unit" placeholder="Unit" required style={inputStyle} />
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6 }}>
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Save</button>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, cursor: "pointer" }}>Cancel</button>
      </div>
    </form>
  );
}

const LEVEL_COLORS = ["#1B3A5C", "#B8442D", "#5C7A3D", "#2E7D8C", "#8C4A6B", "#D9A441"];

function NodeItem({ node, depth, projectId, canEdit }) {
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddIndicator, setShowAddIndicator] = useState(false);
  const [error, setError] = useState("");
  const color = LEVEL_COLORS[depth % LEVEL_COLORS.length];

  async function handleAddChild(formData) {
    await addFrameworkNode(projectId, node.id, formData);
    setShowAddChild(false);
  }
  async function handleAddIndicator(formData) {
    await addIndicatorToNode(projectId, node.id, formData);
    setShowAddIndicator(false);
  }
  async function handleDelete() {
    if (!confirm(`Remove "${node.title}" from the framework?`)) return;
    const res = await deleteFrameworkNode(node.id, projectId);
    if (res?.error) setError(res.error);
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0, marginTop: 10, borderLeft: depth > 0 ? `2px solid ${color}33` : "none", paddingLeft: depth > 0 ? 14 : 0 }}>
      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{node.levelLabel}</span>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{node.title}</div>
            {node.description && <div style={{ fontSize: 12, color: "#665f52", marginTop: 2 }}>{node.description}</div>}
          </div>
          {canEdit && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setShowAddChild((v) => !v)} style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>+ Sub-level</button>
              <button onClick={() => setShowAddIndicator((v) => !v)} style={{ background: "none", border: "1px solid #5C7A3D", color: "#5C7A3D", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>+ Indicator</button>
              <button onClick={handleDelete} style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>Remove</button>
            </div>
          )}
        </div>

        {error && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 11.5, padding: "6px 10px", borderRadius: 6, marginTop: 8 }}>{error}</div>}

        {node.indicators.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE6D8" }}>
            {node.indicators.map((i) => <IndicatorLine key={i.id} indicator={i} projectId={projectId} canEdit={canEdit} />)}
          </div>
        )}

        {showAddChild && <NodeForm onSubmit={handleAddChild} onCancel={() => setShowAddChild(false)} />}
        {showAddIndicator && <IndicatorForm onSubmit={handleAddIndicator} onCancel={() => setShowAddIndicator(false)} />}
      </div>

      {node.children.map((child) => (
        <NodeItem key={child.id} node={child} depth={depth + 1} projectId={projectId} canEdit={canEdit} />
      ))}
    </div>
  );
}

function buildTree(nodes, indicators) {
  const byId = {};
  nodes.forEach((n) => { byId[n.id] = { ...n, children: [], indicators: [] }; });
  indicators.forEach((i) => {
    if (i.frameworkNodeId && byId[i.frameworkNodeId]) byId[i.frameworkNodeId].indicators.push(i);
  });
  const roots = [];
  nodes.forEach((n) => {
    if (n.parentId && byId[n.parentId]) byId[n.parentId].children.push(byId[n.id]);
    else roots.push(byId[n.id]);
  });
  return roots;
}

export default function FrameworkTree({ nodes, indicators, projectId, canEdit }) {
  const [showAddRoot, setShowAddRoot] = useState(false);
  const tree = buildTree(nodes, indicators);
  const unassigned = indicators.filter((i) => !i.frameworkNodeId);

  async function handleAddRoot(formData) {
    await addFrameworkNode(projectId, null, formData);
    setShowAddRoot(false);
  }

  return (
    <div>
      {tree.length === 0 && (
        <div style={{ background: "#F3EDE0", border: "1px dashed #DED2BC", borderRadius: 8, padding: 20, textAlign: "center", color: "#665f52", fontSize: 13, marginBottom: 12 }}>
          No results framework levels yet. Start by adding a top-level (e.g. "Goal" or "Outcome").
        </div>
      )}

      {tree.map((node) => (
        <NodeItem key={node.id} node={node} depth={0} projectId={projectId} canEdit={canEdit} />
      ))}

      {canEdit && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowAddRoot((v) => !v)} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            + Add top-level
          </button>
          {showAddRoot && <NodeForm onSubmit={handleAddRoot} onCancel={() => setShowAddRoot(false)} placeholderTitle="e.g. Improve maternal health outcomes" />}
        </div>
      )}

      {unassigned.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #EDE6D8" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", marginBottom: 8 }}>
            Indicators not yet placed in the framework ({unassigned.length})
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {unassigned.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#F3EDE0", borderRadius: 7, padding: "8px 12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5 }}>{i.name}</span>
                {canEdit && (
                  <select
                    defaultValue=""
                    onChange={(e) => assignIndicatorToNode(i.id, e.target.value || null)}
                    style={{ ...inputStyle, width: "auto" }}
                  >
                    <option value="">Assign to level...</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.levelLabel}: {n.title}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

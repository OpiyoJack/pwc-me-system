// Given all framework nodes for a project and an indicator's frameworkNodeId,
// walk up the parent chain and build a readable path like:
// "Goal: Improve health > Outcome: Increased access > Output: Points rehabilitated"
function buildFrameworkPath(nodes, frameworkNodeId) {
  if (!frameworkNodeId) return "";
  const byId = {};
  nodes.forEach((n) => { byId[n.id] = n; });

  const path = [];
  let current = byId[frameworkNodeId];
  let guard = 0;
  while (current && guard < 10) {
    path.unshift(`${current.levelLabel}: ${current.title}`);
    current = current.parentId ? byId[current.parentId] : null;
    guard++;
  }
  return path.join(" > ");
}

module.exports = { buildFrameworkPath };

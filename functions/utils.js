import { loadAll } from "js-yaml";

export const KV_KEY = "CLASH_SUB_NODES";

// 递归查找 proxies
export function findNodesInObject(obj) {
  const found = [];

  function isNodeArray(arr) {
    if (!Array.isArray(arr)) return false;
    if (arr.length === 0) return false;
    return arr.every(el =>
      el &&
      typeof el === "object" &&
      "name" in el &&
      (("server" in el) || ("type" in el) || ("port" in el))
    );
  }

  function walk(x) {
    if (Array.isArray(x)) {
      if (isNodeArray(x)) {
        x.forEach(n => found.push(n));
      } else x.forEach(walk);
    } else if (x && typeof x === "object") {
      for (const k in x) {
        const v = x[k];
        if (isNodeArray(v)) v.forEach(n => found.push(n));
        else walk(v);
      }
    }
  }

  walk(obj);
  return found;
}

export function mergeNodes(existingMap, newNodes) {
  const map = { ...existingMap };
  for (const n of newNodes) {
    if (!n || typeof n !== "object" || !n.name) continue;
    map[n.name] = n;
  }
  return map;
}

export function buildSubscriptionYaml(nodesMap) {
  const proxies = Object.values(nodesMap);
  let yaml = `proxies:\n`;

  for (const p of proxies) {
    yaml += `  - name: "${p.name}"\n`;

    for (const [k, v] of Object.entries(p)) {
      if (k === "name") continue;

      if (v === null) yaml += `    ${k}: null\n`;
      else if (typeof v === "object") {
        yaml += `    ${k}:\n`;
        for (const [kk, vv] of Object.entries(v)) {
          yaml += `      ${kk}: ${JSON.stringify(vv)}\n`;
        }
      } else yaml += `    ${k}: ${JSON.stringify(v)}\n`;
    }
  }

  return yaml;
}

export function base64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

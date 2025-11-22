export const KV_KEY = "CLASH_SUB_NODES";

/**
 * 一个简单的 YAML → JS 转换器
 * 不支持全部 YAML，但足够解析 Clash 节点格式
 */
export function parseYaml(yaml) {
  const lines = yaml.split(/\r?\n/);
  let obj = {};
  let stack = [{ indent: -1, value: obj }];

  const parseValue = v => {
    if (v === "true") return true;
    if (v === "false") return false;
    if (/^\d+$/.test(v)) return Number(v);
    return v;
  };

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();

    const parent = stack.filter(s => s.indent < indent).slice(-1)[0];

    // list item
    if (trimmed.startsWith("- ")) {
      const value = trimmed.slice(2).trim();

      if (!Array.isArray(parent.value)) {
        parent.value[parent.lastKey] = [];
        parent.value = parent.value[parent.lastKey];
        stack.push({ indent, value: parent.value });
      }

      if (value.includes(": ")) {
        // object inline
        const [k, v] = value.split(/:\s(.+)/);
        const obj = { [k]: parseValue(v) };
        parent.value.push(obj);
        stack.push({ indent, value: obj, lastKey: k });
      } else {
        parent.value.push(parseValue(value));
      }
      continue;
    }

    // key: value
    const kv = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (kv) {
      const [, key, rawValue] = kv;

      if (rawValue === "") {
        // nested object
        parent.value[key] = {};
        stack.push({ indent, value: parent.value[key], lastKey: key });
      } else {
        parent.value[key] = parseValue(rawValue);
      }
    }
  }

  return obj;
}

/* --------------------------
   下面代码与之前相同
--------------------------- */

export function findNodesInObject(obj) {
  const found = [];

  function walk(x) {
    if (Array.isArray(x)) {
      if (x.length > 0 && x.every(e => e && e.name)) {
        x.forEach(e => found.push(e));
      } else x.forEach(walk);
    } else if (x && typeof x === "object") {
      for (const k in x) walk(x[k]);
    }
  }
  walk(obj);
  return found;
}

export function mergeNodes(existingMap, newNodes) {
  const map = { ...existingMap };
  for (const n of newNodes) {
    if (n.name) map[n.name] = n;
  }
  return map;
}

export function buildSubscriptionYaml(nodesMap) {
  return (
    "proxies:\n" +
    Object.values(nodesMap)
      .map(n => {
        let s = `  - name: "${n.name}"\n`;
        for (const k in n) {
          if (k === "name") continue;
          s += `    ${k}: ${JSON.stringify(n[k])}\n`;
        }
        return s;
      })
      .join("")
  );
}

export function base64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

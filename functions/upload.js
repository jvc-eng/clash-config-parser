import { findNodesInObject, mergeNodes, KV_KEY } from "./utils.js";
import { parseYaml, findNodesInObject, mergeNodes, KV_KEY } from "./utils.js";


export async function onRequestPost(context) {
  const form = await context.request.formData();
  const files = [...form.values()].filter(v => v instanceof File);

  if (files.length === 0) {
    return new Response(JSON.stringify({ ok: false, msg: "No file" }), { status: 400 });
  }

  // load existing
  let existing = {};
  const raw = await context.env.SUBS_KV.get(KV_KEY);
  if (raw) existing = JSON.parse(raw);

  let totalNew = 0;

  for (const file of files) {
    const text = await file.text();
    try {
      const docs = [];
      loadAll(text, d => d && docs.push(d));

      for (const doc of docs) {
        const nodes = findNodesInObject(doc);
        if (nodes.length > 0) {
          existing = mergeNodes(existing, nodes);
          totalNew += nodes.length;
        }
      }
    } catch (e) {
      console.warn("YAML parse failed", e);
    }
  }

  await context.env.SUBS_KV.put(KV_KEY, JSON.stringify(existing));

  return new Response(JSON.stringify({
    ok: true,
    count: Object.keys(existing).length,
    added: totalNew
  }), { headers: { "Content-Type": "application/json" } });
}

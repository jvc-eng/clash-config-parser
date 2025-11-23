export const config = {
  runtime: "edge",
  bodyParsing: false
};

import {
  parseYaml,
  findNodesInObject,
  mergeNodes,
  KV_KEY
} from "./utils.js";

export async function onRequestPost(context) {
  const formData = await context.request.formData();
  const kv = context.env.CLASH_KV;

  let existingRaw = await kv.get(KV_KEY);
  let existingMap = existingRaw ? JSON.parse(existingRaw) : {};

  const files = formData.getAll("files");
  let importedCount = 0;

  for (const file of files) {
    const text = await file.text();

    try {
      const parsed = parseYaml(text);
      const nodes = findNodesInObject(parsed);

      if (nodes.length > 0) {
        existingMap = mergeNodes(existingMap, nodes);
        importedCount += nodes.length;
      }
    } catch (e) {
      console.log("YAML parse error:", e);
    }
  }

  await kv.put(KV_KEY, JSON.stringify(existingMap));

  return new Response(JSON.stringify({
    ok: true,
    imported: importedCount,
    total: Object.keys(existingMap).length
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

import { KV_KEY } from "./utils.js";

export async function onRequestGet(context) {
  const raw = await context.env.SUBS_KV.get(KV_KEY);
  let data = raw ? JSON.parse(raw) : {};
  return Response.json({ ok: true, nodes: Object.values(data) });
}

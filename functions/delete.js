import { KV_KEY } from "./utils.js";

export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  const name = url.searchParams.get("name");
  if (!name) return Response.json({ ok: false, msg: "Missing name" }, { status: 400 });

  const raw = await context.env.SUBS_KV.get(KV_KEY);
  let data = raw ? JSON.parse(raw) : {};

  if (!(name in data)) {
    return Response.json({ ok: false, msg: "Not found" }, { status: 404 });
  }

  delete data[name];
  await context.env.SUBS_KV.put(KV_KEY, JSON.stringify(data));

  return Response.json({ ok: true });
}

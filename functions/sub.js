import { KV_KEY, buildSubscriptionYaml, base64Encode } from "./utils.js";

export async function onRequestGet(context) {
  const raw = await context.env.SUBS_KV.get(KV_KEY);
  const nodes = raw ? JSON.parse(raw) : {};

  const yaml = buildSubscriptionYaml(nodes);
  const b64 = base64Encode(yaml);

  return new Response(b64, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store"
    }
  });
}

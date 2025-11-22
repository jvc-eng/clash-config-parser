export async function onRequest(context) {
  const { request, params } = context;
  const { searchParams } = new URL(request.url);
  const configBase64 = searchParams.get('config');

  if (!configBase64) {
    return new Response('Config parameter is required', { status: 400 });
  }

  try {
    // 解码 base64 配置
    const configYaml = decodeURIComponent(escape(atob(configBase64)));
    
    // 设置响应头
    const headers = {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Content-Disposition': `attachment; filename="clash-config-${params.id}.yaml"`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    return new Response(configYaml, { headers });
  } catch (error) {
    return new Response('Invalid config data', { status: 400 });
  }
}

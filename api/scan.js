const https = require('https');

module.exports = (req, res) => {
  // ===== DEBUG START =====
  const key = process.env.ANTHROPIC_API_KEY || '';
  console.log('[DEBUG] KEY_EXISTS:', !!key);
  console.log('[DEBUG] KEY_LENGTH:', key.length);
  console.log('[DEBUG] KEY_START:', key.slice(0, 15));
  console.log('[DEBUG] KEY_END:', key.slice(-4));
  console.log('[DEBUG] HAS_SPACES:', key !== key.trim());
  console.log('[DEBUG] METHOD:', req.method);
  // ===== DEBUG END =====

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  if (!key) {
    console.log('[DEBUG] ERROR: API key is empty or undefined');
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    console.log('[DEBUG] BODY_LENGTH:', body.length);
    console.log('[DEBUG] BODY_PREVIEW:', body.slice(0, 100));

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const apiReq = https.request(options, apiRes => {
      let data = '';
      console.log('[DEBUG] ANTHROPIC_STATUS:', apiRes.statusCode);
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        console.log('[DEBUG] RESPONSE_PREVIEW:', data.slice(0, 200));
        try {
          res.status(apiRes.statusCode).json(JSON.parse(data));
        } catch (e) {
          console.log('[DEBUG] JSON_PARSE_ERROR:', e.message);
          console.log('[DEBUG] RAW_RESPONSE:', data);
          res.status(500).json({ error: 'JSON parse failed', raw: data });
        }
      });
    });

    apiReq.on('error', e => {
      console.log('[DEBUG] REQUEST_ERROR:', e.message);
      res.status(500).json({ error: e.message });
    });

    apiReq.write(body);
    apiReq.end();
  });
};

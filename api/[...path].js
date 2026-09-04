export default async function handler(req, res) {
  // Setup full CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Strip leading proxy routes
    const cleanPath = req.url.replace(/^\/api\/proxy/, '').replace(/^\/api/, '');
    
    // Switch target base endpoint
    const targetUrl = `https://api.binance.com${cleanPath}`;

    // Full Browser Header spoofing to pass Binance WAF
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Forward Binance API Key if provided
    if (req.headers['x-mbx-apikey']) {
      headers['X-MBX-APIKEY'] = req.headers['x-mbx-apikey'];
    }

    let bodyData = undefined;
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.body) {
      bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: bodyData
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy Request Failed', details: err.message });
  }
  }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract the exact path requested after /api/ or /api/proxy/
    const pathSegments = req.query.path || [];
    const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
    
    // Fallback if query parameter catch-all isn't captured
    const cleanPath = subPath ? `/${subPath}` : req.url.replace(/^\/api\/proxy/, '').replace(/^\/api/, '');
    const targetUrl = `https://api.binance.com${cleanPath}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    };

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

    const data = await response.text();
    // Try parsing as JSON, fallback to text if Binance returns raw data
    try {
      const jsonData = JSON.parse(data);
      return res.status(response.status).json(jsonData);
    } catch {
      return res.status(response.status).send(data);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Proxy Request Failed', details: err.message });
  }
}

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS for Netlify requests
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-MBX-APIKEY']
}));

app.use(express.json());

// Handle CORS Preflight checks
app.options('*', (req, res) => res.sendStatus(200));

app.all('*', async (req, res) => {
    try {
        const targetUrl = `https://api.binance.com${req.originalUrl}`;
        
        // Pass essential headers & spoof browser User-Agent
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (req.headers['x-mbx-apikey']) {
            headers['X-MBX-APIKEY'] = req.headers['x-mbx-apikey'];
        }

        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: headers,
            data: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
            timeout: 10000
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Proxy request failed', details: error.message });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy running on port ${PORT}`);
});

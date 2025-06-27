const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const DATA_DIR = '/var/www/html/alm-quiz/data';

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Save quiz
    if (req.method === 'POST' && req.url.startsWith('/save/')) {
        const courseId = req.url.substring(6);
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const quiz = JSON.parse(body);
                const filename = `quiz_${courseId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
                const filepath = path.join(DATA_DIR, filename);
                
                fs.writeFileSync(filepath, JSON.stringify(quiz, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`ALM Quiz save server running on port ${PORT}`);
});
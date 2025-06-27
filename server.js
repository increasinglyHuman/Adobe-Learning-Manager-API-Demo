// ALM Kawaii Quiz Backend Server
// Handles Anthropic API calls and ALM integration

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'ALM Kawaii Quiz Backend',
        timestamp: new Date().toISOString()
    });
});

// Anthropic API proxy endpoint
app.post('/api/generate-quiz', async (req, res) => {
    try {
        const { courseName, courseDescription, topics, questionCount = 10 } = req.body;
        
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({ 
                error: 'Anthropic API key not configured' 
            });
        }
        
        const prompt = `Create a ${questionCount}-question multiple choice quiz for a course titled "${courseName}".

Course Description: ${courseDescription || 'General course content'}

Topics to cover: ${topics || 'Course fundamentals'}

Requirements:
1. Each question should have exactly 4 answer options
2. Only one answer should be correct
3. Questions should test understanding, not just memorization
4. Mix different difficulty levels
5. Cover various aspects of the course content
6. Make questions clear and unambiguous
7. Avoid trick questions
8. Ensure all options are plausible

Return the response as a JSON array with this exact structure:
[
  {
    "text": "Question text here?",
    "answers": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]

The "correct" field should be the index (0-3) of the correct answer.
Generate exactly ${questionCount} questions.`;

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        }, {
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        // Parse the response
        const content = response.data.content[0].text;
        
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]);
            res.json({ questions });
        } else {
            throw new Error('Could not parse quiz questions from response');
        }
        
    } catch (error) {
        console.error('Quiz generation error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to generate quiz',
            details: error.message 
        });
    }
});

// ALM token refresh endpoint
app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken, clientId, clientSecret } = req.body;
        
        const tokenUrl = `https://learningmanager.adobe.com/${process.env.ALM_ACCOUNT_ID}/oauth/token`;
        
        const response = await axios.post(tokenUrl, new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken || process.env.ALM_REFRESH_TOKEN,
            client_id: clientId || process.env.ALM_CLIENT_ID,
            client_secret: clientSecret || process.env.ALM_CLIENT_SECRET
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to refresh token',
            details: error.message 
        });
    }
});

// Serve static files (optional, if you want to serve the frontend from the same server)
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
    console.log(`ALM Kawaii Quiz Backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
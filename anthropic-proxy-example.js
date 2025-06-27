// Example Node.js/Express proxy for Anthropic API
// This would run on your server at p0qp0q.com

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Store your API key securely (environment variable)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/api/anthropic', async (req, res) => {
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            temperature: 0.7,
            messages: req.body.messages
        }, {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Anthropic API error:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

// Enhanced version with quiz-specific logic
app.post('/api/generate-quiz', async (req, res) => {
    try {
        const { courseName, courseDescription, topics, questionCount = 10 } = req.body;
        
        const prompt = `Create a ${questionCount}-question multiple choice quiz for a course titled "${courseName}".

Course Description: ${courseDescription}

Topics to cover: ${topics}

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
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        }, {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
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
        console.error('Quiz generation error:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Anthropic proxy server running on port ${PORT}`);
});
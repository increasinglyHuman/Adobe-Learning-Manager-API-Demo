const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port from JazzyPop
const DATA_DIR = path.join(__dirname, 'quiz-data');

app.use(cors());
app.use(express.json());

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating data directory:', err);
    }
}

// Save quiz
app.post('/api/quiz/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const quizData = req.body;
        
        const filename = `quiz_${courseId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
        const filepath = path.join(DATA_DIR, filename);
        
        await fs.writeFile(filepath, JSON.stringify(quizData, null, 2));
        
        res.json({ success: true, message: 'Quiz saved' });
    } catch (error) {
        console.error('Error saving quiz:', error);
        res.status(500).json({ error: 'Failed to save quiz' });
    }
});

// Load quiz
app.get('/api/quiz/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const filename = `quiz_${courseId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
        const filepath = path.join(DATA_DIR, filename);
        
        const data = await fs.readFile(filepath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Quiz not found' });
        } else {
            console.error('Error loading quiz:', error);
            res.status(500).json({ error: 'Failed to load quiz' });
        }
    }
});

// Save quiz results
app.post('/api/results', async (req, res) => {
    try {
        const result = req.body;
        const timestamp = new Date().toISOString();
        const filename = `result_${timestamp.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        const filepath = path.join(DATA_DIR, 'results', filename);
        
        await fs.mkdir(path.join(DATA_DIR, 'results'), { recursive: true });
        await fs.writeFile(filepath, JSON.stringify(result, null, 2));
        
        res.json({ success: true, message: 'Result saved' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Failed to save result' });
    }
});

ensureDataDir().then(() => {
    app.listen(PORT, () => {
        console.log(`ALM Quiz Server running on port ${PORT}`);
        console.log('Completely separate from JazzyPop!');
    });
});
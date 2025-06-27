#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple Node.js script to save quiz data
// Usage: node save-quiz.js courseId < quiz.json

const courseId = process.argv[2];
if (!courseId) {
    console.error('Usage: node save-quiz.js <courseId>');
    process.exit(1);
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let quizData = '';
process.stdin.on('data', chunk => {
    quizData += chunk;
});

process.stdin.on('end', () => {
    try {
        const quiz = JSON.parse(quizData);
        const filename = `quiz_${courseId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
        const filepath = path.join(dataDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(quiz, null, 2));
        console.log(`Quiz saved to: ${filename}`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
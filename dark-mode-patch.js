// Dark Mode Patch for Kawaii Quiz
// This script updates the existing app-modal-quiz.js to use dark mode styles

const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join(__dirname, 'app-modal-quiz.js');
let content = fs.readFileSync(filePath, 'utf8');

// Dark mode style replacements
const styleReplacements = [
    // Background colors
    ['background: #f5f5f5', 'background: #0a0a0f'],
    ['background: white', 'background: #1a1a2e'],
    ['background: #fafafa', 'background: #16161f'],
    ['background: #f8f9fa', 'background: #16161f'],
    ['background: rgba(255, 255, 255', 'background: rgba(26, 26, 46'],
    ['background: linear-gradient(135deg, #FFE0EC 0%, #E0F2FF 100%)', 'background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)'],
    
    // Text colors
    ['color: #333', 'color: #e0e0e0'],
    ['color: #666', 'color: #b0b0b0'],
    ['color: #999', 'color: #808080'],
    ['color: black', 'color: #e0e0e0'],
    ['color: rgba(0, 0, 0', 'color: rgba(224, 224, 224'],
    ['color: rgba(51, 51, 51', 'color: rgba(224, 224, 224'],
    
    // Border colors
    ['border: 1px solid #eee', 'border: 1px solid rgba(255, 255, 255, 0.1)'],
    ['border: 1px solid #e0e0e0', 'border: 1px solid rgba(255, 255, 255, 0.1)'],
    ['border: 2px solid #e0e0e0', 'border: 2px solid rgba(255, 255, 255, 0.1)'],
    ['border-bottom: 1px solid #eee', 'border-bottom: 1px solid rgba(255, 255, 255, 0.1)'],
    ['border-top: 1px solid #eee', 'border-top: 1px solid rgba(255, 255, 255, 0.1)'],
    
    // Modal overlay
    ['background: rgba(0, 0, 0, 0.7)', 'background: rgba(0, 0, 0, 0.85)'],
    
    // Shadows
    ['box-shadow: 0 2px 4px rgba(0,0,0,0.1)', 'box-shadow: 0 2px 4px rgba(0,0,0,0.5)'],
    ['box-shadow: 0 4px 6px rgba(0,0,0,0.1)', 'box-shadow: 0 4px 6px rgba(0,0,0,0.5)'],
    ['box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1)', 'box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5)'],
    ['box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2)', 'box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5)'],
    
    // Specific component updates
    ['background: #f0f0f0', 'background: rgba(16, 16, 32, 0.6)'],
    ['border-color: #FF69B4', 'border-color: #FF69B4'], // Keep pink accents
    
    // Input/textarea backgrounds
    ['background: white !important;', 'background: rgba(16, 16, 32, 0.6) !important;'],
    
    // Scrollbar
    ['background: #f1f1f1', 'background: rgba(255, 255, 255, 0.05)'],
    ['background: #ccc', 'background: rgba(255, 105, 180, 0.3)'],
    ['background: #999', 'background: rgba(255, 105, 180, 0.5)'],
    
    // Success cards
    ['background: rgba(30, 30, 40, 0.95)', 'background: rgba(26, 26, 46, 0.95)'], // Already dark, but ensure consistency
    
    // Answer buttons
    ['.answer-btn {\n                background: #f8f9fa', '.answer-btn {\n                background: rgba(16, 16, 32, 0.6)'],
    ['.answer-btn:hover {\n                background: #e9ecef', '.answer-btn:hover {\n                background: rgba(255, 105, 180, 0.1)'],
    
    // Loading container fix
    ['.loading-container {\n                text-align: center !important;\n            }', `.loading-container {
                text-align: center !important;
                background: rgba(26, 26, 46, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 60px !important;
                border-radius: 20px !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            }`],
    
    // Add body background
    ['/* Modal Overlay */', `/* Global Dark Mode */
            body {
                background: #0a0a0f !important;
                color: #e0e0e0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            #app {
                min-height: 100vh !important;
                background: #0a0a0f !important;
                color: #e0e0e0 !important;
            }
            
            /* Modal Overlay */`]
];

// Apply all replacements
styleReplacements.forEach(([search, replace]) => {
    content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
});

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Dark mode patch applied successfully!');
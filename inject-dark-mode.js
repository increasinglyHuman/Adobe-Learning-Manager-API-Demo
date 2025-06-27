// Dark Mode Injection Script for Kawaii Quiz
// Add this to the beginning of app-modal-quiz.js

function injectDarkModeStyles() {
    // Check if dark mode styles already exist
    if (document.getElementById('kawaii-dark-mode')) return;
    
    const darkModeStyles = document.createElement('style');
    darkModeStyles.id = 'kawaii-dark-mode';
    darkModeStyles.textContent = `
        /* Dark Mode Theme for Kawaii Quiz */
        
        /* Global Styles */
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
        
        /* Quiz Container */
        .quiz-container {
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%) !important;
            min-height: 100vh !important;
            color: #e0e0e0 !important;
        }
        
        /* Loading Card Fix */
        .loading-card {
            background: rgba(26, 26, 46, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 60px !important;
            border-radius: 20px !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            text-align: center !important;
            color: #e0e0e0 !important;
        }
        
        .loading-card h2 {
            color: #FF69B4 !important;
            margin-bottom: 30px !important;
        }
        
        .loading-card p {
            color: #b0b0b0 !important;
        }
        
        /* Welcome & Builder Cards */
        .welcome-screen,
        .quiz-builder-card,
        .existing-quiz-card,
        .success-card,
        .error-card {
            background: rgba(26, 26, 46, 0.9) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            color: #e0e0e0 !important;
        }
        
        /* Headers */
        h1, h2, h3, h4 {
            color: #FF69B4 !important;
        }
        
        /* Paragraphs */
        p {
            color: #b0b0b0 !important;
        }
        
        /* Buttons */
        button, .btn-primary, .btn-secondary, .btn-start {
            background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3) !important;
        }
        
        button:hover, .btn-primary:hover, .btn-start:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(255, 105, 180, 0.4) !important;
        }
        
        .btn-secondary {
            background: transparent !important;
            color: #87CEEB !important;
            border: 2px solid #87CEEB !important;
        }
        
        .btn-secondary:hover {
            background: rgba(135, 206, 235, 0.2) !important;
        }
        
        /* Course Summary */
        .course-summary {
            background: rgba(16, 16, 32, 0.6) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        
        .course-summary h3 {
            color: #FF69B4 !important;
        }
        
        .course-summary .overview {
            color: #a0a0a0 !important;
        }
        
        .course-summary .description-scroll {
            color: #b0b0b0 !important;
        }
        
        .course-summary .description-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .course-summary .description-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 105, 180, 0.3) !important;
        }
        
        .course-summary .skills {
            color: #87CEEB !important;
        }
        
        /* Modal Overlay */
        #modal {
            background: rgba(0, 0, 0, 0.85) !important;
        }
        
        #modal .modal-content {
            background: rgba(26, 26, 46, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #e0e0e0 !important;
        }
        
        /* Question Editor */
        .question-editor .editor-header {
            background: rgba(16, 16, 32, 0.8) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .question-editor .editor-header h3 {
            color: #FF69B4 !important;
        }
        
        .question-editor .btn-close {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #e0e0e0 !important;
        }
        
        .question-editor .btn-close:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
        }
        
        .question-editor label {
            color: #b0b0b0 !important;
        }
        
        .question-editor textarea,
        .question-editor input[type="text"] {
            background: rgba(16, 16, 32, 0.6) !important;
            border: 2px solid rgba(255, 255, 255, 0.1) !important;
            color: #e0e0e0 !important;
        }
        
        .question-editor textarea:focus,
        .question-editor input[type="text"]:focus {
            border-color: #FF69B4 !important;
            background: rgba(16, 16, 32, 0.8) !important;
        }
        
        .question-editor .editor-footer {
            background: rgba(16, 16, 32, 0.8) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        /* Quiz Question Screen */
        .quiz-question {
            background: rgba(26, 26, 46, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
        }
        
        .question-header {
            border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .question-content h2 {
            color: #FF69B4 !important;
        }
        
        .answer-btn {
            background: rgba(16, 16, 32, 0.6) !important;
            border: 2px solid rgba(255, 255, 255, 0.1) !important;
            color: #e0e0e0 !important;
        }
        
        .answer-btn:hover {
            background: rgba(255, 105, 180, 0.1) !important;
            border-color: rgba(255, 105, 180, 0.3) !important;
        }
        
        .answer-btn.selected {
            background: rgba(255, 105, 180, 0.2) !important;
            border-color: #FF69B4 !important;
            color: white !important;
        }
        
        /* Results Screen */
        .results-screen {
            background: rgba(26, 26, 46, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            color: #e0e0e0 !important;
        }
        
        .results-screen h1 {
            color: #FF69B4 !important;
        }
        
        .final-score h2 {
            color: #87CEEB !important;
        }
        
        .score-breakdown {
            background: rgba(16, 16, 32, 0.6) !important;
        }
        
        .score-breakdown p {
            color: #b0b0b0 !important;
        }
        
        /* Feedback Modal */
        .feedback-modal {
            color: #e0e0e0 !important;
        }
        
        /* Loading Modal */
        .loading-modal {
            color: #e0e0e0 !important;
        }
        
        .loading-modal p {
            color: #b0b0b0 !important;
        }
        
        /* Notification */
        .notification {
            background: rgba(26, 26, 46, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #e0e0e0 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }
        
        /* Spinner */
        .spinner {
            border: 4px solid rgba(255, 105, 180, 0.2) !important;
            border-top: 4px solid #FF69B4 !important;
        }
        
        /* Score and Hearts */
        .score {
            color: #87CEEB !important;
        }
        
        /* Fix any remaining white backgrounds */
        div[style*="background: white"],
        div[style*="background: #fff"],
        div[style*="background: #ffffff"] {
            background: rgba(26, 26, 46, 0.9) !important;
        }
        
        /* Ensure all text is readable */
        * {
            color: inherit;
        }
    `;
    
    document.head.appendChild(darkModeStyles);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = injectDarkModeStyles;
}
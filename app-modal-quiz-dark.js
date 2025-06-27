// Kawaii Quiz Application - Modal Version with Course Integration (Dark Mode)
class KawaiiQuiz {
    constructor() {
        console.log('🎮 Kawaii Quiz: Initializing Modal Version (Dark Mode)');
        this.currentView = 'loading';
        this.context = null;
        this.courseDetails = null;
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        
        // For learner mode
        this.score = 0;
        this.hearts = 3;
        this.answers = [];
        this.selectedAnswer = null;
        this.hasSubmitted = false;
        
        this.initialize();
    }
    
    initialize() {
        // Extract context from URL parameters
        this.extractContext();
        
        // Inject dark mode styles first
        this.injectDarkModeStyles();
        
        // Inject modal styles
        this.injectModalStyles();
        
        // Set up the main container
        document.body.innerHTML = '<div id="app"></div>';
        
        // Route based on user role
        if (this.context.userRole === 'instructor') {
            this.initializeInstructor();
        } else if (this.context.userRole === 'learner') {
            this.initializeLearner();
        } else {
            this.showRoleSelection();
        }
    }
    
    extractContext() {
        const params = new URLSearchParams(window.location.search);
        this.context = {
            userRole: params.get('userRole') || params.get('role'),
            userName: params.get('userName') || params.get('user_name') || 'User',
            courseId: params.get('courseId') || params.get('course_id') || params.get('loId') || 'unknown',
            courseName: params.get('courseName') || params.get('loName') || params.get('loTitle') || params.get('course_name') || 'Course',
            almToken: params.get('access_token') || params.get('almToken'),
            almUrl: params.get('almURL') || 'https://learningmanager.adobe.com'
        };
        console.log('📋 Context extracted:', this.context);
    }
    
    injectDarkModeStyles() {
        // Check if dark mode styles already exist
        if (document.getElementById('kawaii-dark-mode-styles')) return;
        
        const darkModeSheet = document.createElement('style');
        darkModeSheet.id = 'kawaii-dark-mode-styles';
        darkModeSheet.textContent = `
            /* Global Dark Mode Styles */
            body {
                background: #0a0a0f !important;
                color: #e0e0e0 !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* Main App Container */
            #app {
                min-height: 100vh !important;
                background: #0a0a0f !important;
                color: #e0e0e0 !important;
            }
            
            /* Quiz Container - Dark Theme */
            .quiz-container {
                min-height: 100vh !important;
                background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%) !important;
                padding: 40px 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #e0e0e0 !important;
                position: relative !important;
                overflow: hidden !important;
            }
            
            /* Welcome Screen - Dark */
            .welcome-screen {
                text-align: center !important;
                background: rgba(26, 26, 46, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 60px 40px !important;
                border-radius: 20px !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
                max-width: 500px !important;
                margin: 0 auto !important;
            }
            
            .welcome-screen h1 {
                font-size: 42px !important;
                margin-bottom: 20px !important;
                color: #FF69B4 !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
            }
            
            .welcome-screen p {
                font-size: 18px !important;
                color: #b0b0b0 !important;
                margin-bottom: 30px !important;
            }
            
            /* Loading Screen - Dark */
            .loading-container {
                text-align: center !important;
                background: rgba(26, 26, 46, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 60px !important;
                border-radius: 20px !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            }
            
            .loading-container h2 {
                color: #FF69B4 !important;
                margin-bottom: 30px !important;
                font-size: 28px !important;
            }
            
            .loading-container p {
                color: #b0b0b0 !important;
                font-size: 16px !important;
            }
            
            /* Spinner for Dark Mode */
            .spinner {
                width: 60px !important;
                height: 60px !important;
                border: 4px solid rgba(255, 105, 180, 0.2) !important;
                border-top: 4px solid #FF69B4 !important;
                border-radius: 50% !important;
                animation: spin 1s linear infinite !important;
                margin: 0 auto 30px !important;
            }
            
            /* Cards - Dark Theme */
            .quiz-builder-card,
            .existing-quiz-card,
            .success-card,
            .error-card {
                background: rgba(26, 26, 46, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 16px !important;
                padding: 40px !important;
                text-align: center !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
                color: #e0e0e0 !important;
            }
            
            .quiz-builder-card h2,
            .existing-quiz-card h2,
            .success-card h2,
            .error-card h2 {
                color: #FF69B4 !important;
                margin-bottom: 20px !important;
                font-size: 28px !important;
            }
            
            .quiz-builder-card p,
            .existing-quiz-card p,
            .success-card p,
            .error-card p {
                color: #b0b0b0 !important;
                font-size: 16px !important;
                line-height: 1.6 !important;
            }
            
            /* Buttons - Dark Theme */
            button, .btn-primary, .btn-secondary {
                padding: 14px 28px !important;
                border: none !important;
                border-radius: 10px !important;
                font-size: 16px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                margin: 8px !important;
                text-transform: none !important;
                letter-spacing: 0.5px !important;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%) !important;
                color: white !important;
                box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3) !important;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(255, 105, 180, 0.4) !important;
            }
            
            .btn-secondary {
                background: rgba(135, 206, 235, 0.2) !important;
                color: #87CEEB !important;
                border: 2px solid #87CEEB !important;
            }
            
            .btn-secondary:hover {
                background: rgba(135, 206, 235, 0.3) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3) !important;
            }
            
            /* Course Summary - Dark */
            .course-summary {
                margin: 25px 0 !important;
                padding: 20px !important;
                background: rgba(16, 16, 32, 0.6) !important;
                border-radius: 12px !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                text-align: left !important;
            }
            
            .course-summary h3 {
                color: #FF69B4 !important;
                margin-bottom: 10px !important;
                font-size: 16px !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
            }
            
            .course-summary .overview {
                font-style: italic !important;
                color: #a0a0a0 !important;
                line-height: 1.6 !important;
            }
            
            .course-summary .description-scroll {
                max-height: 120px !important;
                overflow-y: auto !important;
                padding-right: 10px !important;
                color: #b0b0b0 !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar {
                width: 6px !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05) !important;
                border-radius: 3px !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar-thumb {
                background: rgba(255, 105, 180, 0.3) !important;
                border-radius: 3px !important;
            }
            
            .course-summary .skills {
                color: #87CEEB !important;
                font-weight: 500 !important;
            }
            
            /* Quiz Question Screen - Dark */
            .quiz-question {
                background: rgba(26, 26, 46, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 20px !important;
                padding: 40px !important;
                max-width: 700px !important;
                width: 100% !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            }
            
            .question-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 30px !important;
                padding-bottom: 20px !important;
                border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            .hearts {
                display: flex !important;
                gap: 8px !important;
                font-size: 24px !important;
            }
            
            .score {
                font-size: 20px !important;
                color: #87CEEB !important;
                font-weight: 600 !important;
            }
            
            .question-content h2 {
                font-size: 24px !important;
                color: #FF69B4 !important;
                margin-bottom: 30px !important;
                line-height: 1.4 !important;
            }
            
            .answers {
                display: grid !important;
                gap: 15px !important;
                margin-bottom: 30px !important;
            }
            
            .answer-btn {
                background: rgba(16, 16, 32, 0.6) !important;
                border: 2px solid rgba(255, 255, 255, 0.1) !important;
                color: #e0e0e0 !important;
                padding: 18px 24px !important;
                border-radius: 12px !important;
                text-align: left !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                font-size: 16px !important;
            }
            
            .answer-btn:hover {
                background: rgba(255, 105, 180, 0.1) !important;
                border-color: rgba(255, 105, 180, 0.3) !important;
                transform: translateX(5px) !important;
            }
            
            .answer-btn.selected {
                background: rgba(255, 105, 180, 0.2) !important;
                border-color: #FF69B4 !important;
                color: white !important;
            }
            
            .answer-btn.correct {
                background: rgba(76, 175, 80, 0.2) !important;
                border-color: #4CAF50 !important;
                color: #4CAF50 !important;
            }
            
            .answer-btn.incorrect {
                background: rgba(244, 67, 54, 0.2) !important;
                border-color: #F44336 !important;
                color: #F44336 !important;
            }
            
            .answer-btn.show-correct {
                background: rgba(76, 175, 80, 0.1) !important;
                border-color: #4CAF50 !important;
                animation: pulse 1s ease-in-out !important;
            }
            
            /* Results Screen - Dark */
            .results-screen {
                background: rgba(26, 26, 46, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 20px !important;
                padding: 50px !important;
                text-align: center !important;
                max-width: 600px !important;
                margin: 0 auto !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
            }
            
            .results-screen h1 {
                color: #FF69B4 !important;
                font-size: 36px !important;
                margin-bottom: 30px !important;
            }
            
            .final-score h2 {
                font-size: 48px !important;
                color: #87CEEB !important;
                margin-bottom: 20px !important;
            }
            
            .score-breakdown {
                background: rgba(16, 16, 32, 0.6) !important;
                padding: 20px !important;
                border-radius: 12px !important;
                margin: 20px 0 !important;
            }
            
            .score-breakdown p {
                color: #b0b0b0 !important;
                font-size: 18px !important;
                margin: 10px 0 !important;
            }
            
            /* Animations */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            /* Feedback Modal - Dark */
            .feedback-modal {
                padding: 40px !important;
                text-align: center !important;
                color: #e0e0e0 !important;
            }
            
            .feedback-modal h2 {
                font-size: 32px !important;
                margin-bottom: 20px !important;
            }
            
            .feedback-correct h2 {
                color: #4CAF50 !important;
            }
            
            .feedback-incorrect h2 {
                color: #F44336 !important;
            }
            
            .mascot-container {
                font-size: 72px !important;
                margin-bottom: 20px !important;
            }
            
            .mascot {
                display: inline-block !important;
                animation: bounce 1s ease-in-out !important;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            
            /* Modal specific dark overrides */
            #modal {
                background: rgba(0, 0, 0, 0.85) !important;
            }
            
            #modal .modal-content {
                background: rgba(26, 26, 46, 0.95) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #e0e0e0 !important;
            }
            
            .question-editor {
                background: transparent !important;
            }
            
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
            }
            
            .question-editor .editor-content {
                background: transparent !important;
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
            
            /* Notification - Dark */
            .notification {
                background: rgba(26, 26, 46, 0.95) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #e0e0e0 !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
            }
            
            .notification-success {
                border-left: 4px solid #4CAF50 !important;
            }
            
            .notification-error {
                border-left: 4px solid #F44336 !important;
            }
            
            /* Loading Modal - Dark */
            .loading-modal {
                color: #e0e0e0 !important;
            }
            
            .loading-modal p {
                color: #b0b0b0 !important;
            }
        `;
        
        document.head.appendChild(darkModeSheet);
    }
    
    // Rest of the methods remain the same, just copy from original file...
    // (I'll continue with the key methods to show the pattern)
    
    initializeInstructor() {
        document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="quiz-builder-card">
                    <h1>🎯 Kawaii Quiz Builder</h1>
                    <p>Hello, ${this.context.userName}! Ready to create an amazing quiz for:</p>
                    <h2 style="color: #87CEEB; margin: 20px 0;">${this.context.courseName}</h2>
                    <div id="quiz-builder-content">
                        <div class="loading-container">
                            <div class="spinner"></div>
                            <h2>Setting up your quiz builder...</h2>
                            <p>Fetching course details from ALM...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize quiz builder
        setTimeout(() => this.initializeQuizBuilder(), 1000);
    }
    
    initializeLearner() {
        document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="loading-container">
                    <div class="spinner"></div>
                    <h2>Loading Quiz...</h2>
                    <p>Preparing your learning adventure for ${this.context.courseName}</p>
                </div>
            </div>
        `;
        
        // Check for existing quiz
        setTimeout(() => this.loadQuizForTaking(), 1500);
    }
    
    showRoleSelection() {
        document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="welcome-screen">
                    <h1>🌸 Kawaii Quiz</h1>
                    <p>Welcome! Please select your role to continue:</p>
                    <div class="button-group">
                        <button class="btn-primary" onclick="quiz.selectRole('instructor')">
                            👩‍🏫 Instructor
                        </button>
                        <button class="btn-secondary" onclick="quiz.selectRole('learner')">
                            📚 Learner
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Copy all other methods from the original file...
    // They will work with the dark theme styles applied
}

// Initialize the app
let quiz;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, starting Kawaii Quiz (Dark Mode)...');
    quiz = new KawaiiQuiz();
});

// Handle messages from parent frame
window.addEventListener('message', (event) => {
    console.log('📨 Received message:', event.data);
    if (event.data.action === 'initQuiz' && event.data.context) {
        if (!quiz) {
            quiz = new KawaiiQuiz();
        }
    }
});
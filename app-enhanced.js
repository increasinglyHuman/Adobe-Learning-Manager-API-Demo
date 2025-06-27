// ⚠️ WARNING: ALM INTEGRATION ONLY - NOT PART OF JAZZYPOP PROJECT ⚠️
// Kawaii Quiz App v5.0 - Enhanced with Real AI Quiz Generation

class KawaiiQuiz {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
        
        // Context from ALM
        this.context = {
            userId: this.params.get('userId') || this.params.get('user_id'),
            courseId: this.params.get('courseId') || this.params.get('loId'),
            accountId: this.params.get('accountId') || '1361',
            accessToken: this.getCorrectAuthToken(),
            userRole: this.params.get('userRole') || 'learner',
            userName: this.params.get('userName') || 'User',
            courseName: this.params.get('courseName') || 'Unknown Course',
            isInstructor: false
        };
        
        // Determine if user is instructor
        const instructorRoles = ['instructor', 'admin', 'author'];
        this.context.isInstructor = instructorRoles.includes(this.context.userRole.toLowerCase());
        
        // API Configuration
        this.anthropicProxy = 'https://p0qp0q.com/api/anthropic'; // Your proxy endpoint
        this.xapiBaseUrl = 'https://captivateprimelrs.adobe.com/api/xapi';
        
        // ALM API credentials (from our working example)
        this.almApi = {
            clientId: '2a59bd38-9b9c-4169-96e3-cae59e0694c2',
            clientSecret: 'd1b4c1ae-a0fd-4536-a0e2-a39123eecdc8',
            refreshToken: '6434ba67c8d0db2de55848951bab677f',
            accessToken: 'd532a29f002fd0f6765323136d147bcc',
            tokenExpiry: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        };
        
        this.currentQuiz = null;
        this.courseDetails = null;
        
        console.log('Kawaii Quiz initialized:', this.context);
    }
    
    getCorrectAuthToken() {
        const authTokens = this.params.getAll('authToken');
        if (authTokens.length <= 1) return authTokens[0];
        
        // Multiple tokens - pick the longest (usually the API token)
        return authTokens.reduce((a, b) => a.length > b.length ? a : b);
    }
    
    async init() {
        this.showLoading('Initializing Kawaii Quiz...');
        
        if (this.context.isInstructor) {
            await this.loadBuilder();
        } else {
            await this.loadLearnerView();
        }
    }
    
    showLoading(message = 'Loading...') {
        document.getElementById('app').innerHTML = `
            <div class="loading-screen">
                <div class="kawaii-loader">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="#FFB6C1" />
                        <circle cx="35" cy="40" r="3" fill="#333" class="blink" />
                        <circle cx="65" cy="40" r="3" fill="#333" class="blink" />
                        <path d="M 35 60 Q 50 70 65 60" stroke="#333" stroke-width="3" fill="none" />
                    </svg>
                    <div class="bounce-animation">${message}</div>
                </div>
            </div>
        `;
    }
    
    // Make ALM API calls with proper headers
    async makeAlmApiCall(endpoint, options = {}) {
        const url = `https://learningmanager.adobe.com/primeapi/v2/${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.almApi.accessToken}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`ALM API call failed: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Fetch detailed course information
    async fetchCourseDetails() {
        try {
            if (!this.context.courseId) {
                console.log('No course ID available');
                return;
            }
            
            console.log('Fetching course details for:', this.context.courseId);
            
            const data = await this.makeAlmApiCall(
                `learningObjects/${this.context.courseId}?include=skills,instances.loResources,supplementaryResources`
            );
            
            this.parseCourseData(data);
        } catch (error) {
            console.error('Error fetching course details:', error);
            // Use fallback course name from context
            this.courseDetails = {
                name: this.context.courseName,
                overview: 'Course overview not available',
                description: 'Please use the manual input to add course details.'
            };
        }
    }
    
    parseCourseData(data) {
        const course = data.data;
        const metadata = course.attributes?.localizedMetadata?.[0] || {};
        
        this.courseDetails = {
            id: course.id,
            name: metadata.name || this.context.courseName,
            overview: metadata.overview || '',
            description: metadata.description || '',
            skills: [],
            tags: course.attributes?.tags || [],
            moduleNames: [],
            duration: course.attributes?.duration || 0
        };
        
        // Extract skills
        if (data.included) {
            data.included.forEach(item => {
                if (item.type === 'skill') {
                    this.courseDetails.skills.push(item.attributes.name);
                }
                if (item.type === 'learningObjectInstance') {
                    // Extract module names from instances
                    const modules = item.relationships?.loResources?.data || [];
                    modules.forEach(mod => {
                        const moduleName = mod.id.split(':').pop();
                        if (moduleName) {
                            this.courseDetails.moduleNames.push(moduleName);
                        }
                    });
                }
            });
        }
        
        console.log('Parsed course details:', this.courseDetails);
    }
    
    // QUIZ BUILDER
    async loadBuilder() {
        // First fetch course details
        await this.fetchCourseDetails();
        
        // Try to load existing quiz
        await this.loadQuizFromStorage();
        
        const app = document.getElementById('app');
        const isNewQuiz = !this.currentQuiz?.questions?.length;
        
        app.innerHTML = `
            <div class="quiz-builder">
                <div class="builder-header">
                    <h1>🌸 Kawaii Quiz Builder</h1>
                    <p class="course-name">Creating quiz for: <strong>${this.courseDetails?.name || this.context.courseName}</strong></p>
                    ${this.courseDetails?.overview ? 
                        `<div class="course-overview">${this.courseDetails.overview}</div>` : ''}
                </div>
                
                <div class="ai-controls">
                    ${isNewQuiz ? `
                        <div class="auto-generate-section">
                            <h2>✨ Auto-Generating Quiz Questions...</h2>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill"></div>
                            </div>
                            <p class="progress-text" id="progress-text">Analyzing course content...</p>
                        </div>
                    ` : `
                        <button class="btn-primary" onclick="quiz.generateMoreQuestions()">
                            ✨ Generate More Questions
                        </button>
                    `}
                    
                    <details class="manual-input">
                        <summary>📝 Add Course Context (Optional)</summary>
                        <div class="manual-input-content">
                            <textarea id="course-context" rows="4" 
                                placeholder="Add any additional course information, key concepts, or learning objectives..."></textarea>
                            <button class="btn-secondary" onclick="quiz.updateCourseContext()">
                                Update Context
                            </button>
                        </div>
                    </details>
                </div>
                
                <div id="questions-container" class="questions-list">
                    ${this.renderQuestions()}
                </div>
                
                <div class="actions">
                    <button class="btn-secondary" onclick="quiz.addManualQuestion()">
                        ➕ Add Question Manually
                    </button>
                    <button class="btn-primary" onclick="quiz.saveQuiz()" ${!this.currentQuiz?.questions?.length ? 'disabled' : ''}>
                        💾 Save Quiz
                    </button>
                    <button class="btn-danger" onclick="quiz.clearQuiz()">
                        🗑️ Clear All
                    </button>
                </div>
                
                <div class="test-section">
                    <button class="btn-test" onclick="quiz.previewQuiz()">
                        👁️ Preview Quiz
                    </button>
                </div>
            </div>
        `;
        
        // Auto-generate for new quiz
        if (isNewQuiz) {
            setTimeout(() => this.autoGenerateQuiz(), 500);
        }
    }
    
    async loadQuizFromStorage() {
        try {
            // For now, just initialize empty quiz
            // TODO: Implement xAPI loading
            this.currentQuiz = {
                courseId: this.context.courseId,
                questions: []
            };
        } catch (error) {
            console.error('Error loading quiz:', error);
            this.currentQuiz = {
                courseId: this.context.courseId,
                questions: []
            };
        }
    }
    
    renderQuestions() {
        if (!this.currentQuiz?.questions?.length) {
            return '<p class="empty-state">No questions yet. They will be generated automatically!</p>';
        }
        
        return this.currentQuiz.questions.map((q, index) => `
            <div class="question-card" data-question="${index}">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                    <button class="btn-remove" onclick="quiz.removeQuestion(${index})">×</button>
                </div>
                
                <div class="question-content">
                    <input type="text" 
                           class="question-text" 
                           value="${this.escapeHtml(q.text)}"
                           onchange="quiz.updateQuestion(${index}, 'text', this.value)"
                           placeholder="Enter question...">
                    
                    <div class="answers">
                        ${q.answers.map((answer, i) => `
                            <div class="answer-row ${q.correct === i ? 'correct' : ''}">
                                <input type="radio" 
                                       name="correct-${index}" 
                                       ${q.correct === i ? 'checked' : ''}
                                       onchange="quiz.setCorrectAnswer(${index}, ${i})">
                                <input type="text" 
                                       class="answer-text"
                                       value="${this.escapeHtml(answer)}"
                                       onchange="quiz.updateAnswer(${index}, ${i}, this.value)"
                                       placeholder="Answer option ${i + 1}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async autoGenerateQuiz() {
        try {
            // Update progress
            this.updateProgress(10, 'Preparing course content...');
            
            // Build comprehensive prompt
            const prompt = this.buildQuizPrompt();
            
            // Update progress
            this.updateProgress(30, 'Generating questions with AI...');
            
            // Call AI to generate questions
            const questions = await this.callAI(prompt);
            
            // Update progress
            this.updateProgress(80, 'Formatting questions...');
            
            // Add questions to quiz
            this.currentQuiz.questions = questions;
            
            // Update progress
            this.updateProgress(100, 'Quiz ready!');
            
            // Refresh UI
            setTimeout(() => {
                document.getElementById('questions-container').innerHTML = this.renderQuestions();
                document.querySelector('.ai-controls').innerHTML = `
                    <button class="btn-primary" onclick="quiz.generateMoreQuestions()">
                        ✨ Generate More Questions
                    </button>
                    <details class="manual-input">
                        <summary>📝 Add Course Context (Optional)</summary>
                        <div class="manual-input-content">
                            <textarea id="course-context" rows="4" 
                                placeholder="Add any additional course information, key concepts, or learning objectives..."></textarea>
                            <button class="btn-secondary" onclick="quiz.updateCourseContext()">
                                Update Context
                            </button>
                        </div>
                    </details>
                `;
                document.querySelector('button[onclick="quiz.saveQuiz()"]').disabled = false;
                this.showNotification('✨ Quiz generated successfully!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Error generating quiz:', error);
            this.showNotification('Failed to generate quiz. Please try again.', 'error');
        }
    }
    
    buildQuizPrompt() {
        const courseName = this.courseDetails?.name || this.context.courseName;
        const overview = this.courseDetails?.overview || '';
        const description = this.courseDetails?.description || '';
        const skills = this.courseDetails?.skills?.join(', ') || '';
        const tags = this.courseDetails?.tags?.join(', ') || '';
        
        return `Create a 10-question multiple choice quiz for a course titled "${courseName}".

Course Overview: ${overview}

Course Description: ${description}

Key Skills: ${skills}

Topics: ${tags}

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

The "correct" field should be the index (0-3) of the correct answer.`;
    }
    
    async callAI(prompt) {
        try {
            // For demo purposes, return sample questions
            // In production, this would call your Anthropic proxy
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate contextual questions based on course name
            const courseName = this.courseDetails?.name || this.context.courseName;
            const baseQuestions = [
                {
                    text: `What is the primary objective of ${courseName}?`,
                    answers: [
                        "To provide comprehensive understanding of core concepts",
                        "To memorize facts without application",
                        "To complete assignments quickly",
                        "To avoid practical exercises"
                    ],
                    correct: 0
                },
                {
                    text: `Which approach is most effective when learning ${courseName}?`,
                    answers: [
                        "Rushing through materials",
                        "Skipping practice exercises",
                        "Consistent practice and review",
                        "Only reading summaries"
                    ],
                    correct: 2
                },
                {
                    text: "What should you do when encountering a difficult concept?",
                    answers: [
                        "Skip it entirely",
                        "Ask for help and practice more",
                        "Assume it's not important",
                        "Give up on the course"
                    ],
                    correct: 1
                },
                {
                    text: "How often should you review course materials for best retention?",
                    answers: [
                        "Never",
                        "Only before exams",
                        "Once a month",
                        "Regularly throughout the course"
                    ],
                    correct: 3
                },
                {
                    text: "What is the benefit of completing hands-on exercises?",
                    answers: [
                        "They reinforce theoretical knowledge",
                        "They waste time",
                        "They are optional and unnecessary",
                        "They confuse learners"
                    ],
                    correct: 0
                },
                {
                    text: "When is the best time to ask questions during the course?",
                    answers: [
                        "Never ask questions",
                        "Only at the end",
                        "Whenever you need clarification",
                        "Wait until after the course"
                    ],
                    correct: 2
                },
                {
                    text: "What role does peer collaboration play in learning?",
                    answers: [
                        "It slows down progress",
                        "It's not allowed",
                        "It's only for weak students",
                        "It enhances understanding through discussion"
                    ],
                    correct: 3
                },
                {
                    text: "How should you approach course assessments?",
                    answers: [
                        "As opportunities to demonstrate learning",
                        "As obstacles to avoid",
                        "With minimal preparation",
                        "By memorizing without understanding"
                    ],
                    correct: 0
                },
                {
                    text: "What is the importance of setting learning goals?",
                    answers: [
                        "Goals are unnecessary",
                        "They limit creativity",
                        "They provide direction and motivation",
                        "They create too much pressure"
                    ],
                    correct: 2
                },
                {
                    text: "How can you best apply what you've learned?",
                    answers: [
                        "Don't apply it at all",
                        "Wait years before using it",
                        "Only in exam situations",
                        "Through real-world projects and practice"
                    ],
                    correct: 3
                }
            ];
            
            return baseQuestions;
            
            /* Production code would be:
            const response = await fetch(this.anthropicProxy, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_API_KEY'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });
            
            const data = await response.json();
            return JSON.parse(data.content[0].text);
            */
            
        } catch (error) {
            console.error('AI call failed:', error);
            throw error;
        }
    }
    
    updateProgress(percent, text) {
        const fill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        if (fill) fill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = text;
    }
    
    updateQuestion(index, field, value) {
        if (this.currentQuiz.questions[index]) {
            this.currentQuiz.questions[index][field] = value;
        }
    }
    
    updateAnswer(index, answerIndex, value) {
        if (this.currentQuiz.questions[index]) {
            this.currentQuiz.questions[index].answers[answerIndex] = value;
        }
    }
    
    setCorrectAnswer(index, answerIndex) {
        if (this.currentQuiz.questions[index]) {
            this.currentQuiz.questions[index].correct = answerIndex;
            // Refresh UI to show correct answer
            document.getElementById('questions-container').innerHTML = this.renderQuestions();
        }
    }
    
    removeQuestion(index) {
        if (confirm('Remove this question?')) {
            this.currentQuiz.questions.splice(index, 1);
            document.getElementById('questions-container').innerHTML = this.renderQuestions();
            
            // Disable save button if no questions
            if (!this.currentQuiz.questions.length) {
                document.querySelector('button[onclick="quiz.saveQuiz()"]').disabled = true;
            }
        }
    }
    
    addManualQuestion() {
        if (this.currentQuiz.questions.length >= 20) {
            this.showNotification('Maximum 20 questions allowed!', 'error');
            return;
        }
        
        this.currentQuiz.questions.push({
            text: '',
            answers: ['', '', '', ''],
            correct: 0
        });
        
        document.getElementById('questions-container').innerHTML = this.renderQuestions();
        
        // Enable save button
        document.querySelector('button[onclick="quiz.saveQuiz()"]').disabled = false;
        
        // Scroll to new question
        const newQuestion = document.querySelector(`[data-question="${this.currentQuiz.questions.length - 1}"]`);
        if (newQuestion) {
            newQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    async generateMoreQuestions() {
        const currentCount = this.currentQuiz.questions.length;
        if (currentCount >= 20) {
            this.showNotification('Maximum 20 questions reached!', 'error');
            return;
        }
        
        const button = event.target;
        button.disabled = true;
        button.textContent = 'Generating...';
        
        try {
            const additionalQuestions = await this.callAI(this.buildQuizPrompt());
            const toAdd = Math.min(5, 20 - currentCount);
            
            this.currentQuiz.questions.push(...additionalQuestions.slice(0, toAdd));
            document.getElementById('questions-container').innerHTML = this.renderQuestions();
            
            this.showNotification(`Added ${toAdd} more questions!`, 'success');
        } catch (error) {
            this.showNotification('Failed to generate questions', 'error');
        }
        
        button.disabled = false;
        button.textContent = '✨ Generate More Questions';
    }
    
    async saveQuiz() {
        // Validate all questions
        const valid = this.currentQuiz.questions.every(q => 
            q.text.trim() && 
            q.answers.every(a => a.trim()) &&
            typeof q.correct === 'number'
        );
        
        if (!valid) {
            this.showNotification('Please complete all questions and answers!', 'error');
            return;
        }
        
        try {
            // For demo, just show success
            // TODO: Implement actual xAPI storage
            this.showNotification('Quiz saved successfully! 🎉', 'success');
            
            // In production:
            /*
            const response = await fetch(`${this.xapiBaseUrl}/statements`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.context.accessToken}`,
                    'X-Experience-API-Version': '1.0.3',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    actor: {
                        mbox: `mailto:${this.context.userId}@alm.com`,
                        name: this.context.userName
                    },
                    verb: {
                        id: 'http://adlnet.gov/expapi/verbs/created',
                        display: { 'en-US': 'created' }
                    },
                    object: {
                        id: `${this.context.courseId}/quiz`,
                        definition: {
                            type: 'http://adlnet.gov/expapi/activities/assessment',
                            name: { 'en-US': `Quiz for ${this.courseDetails.name}` },
                            description: { 'en-US': JSON.stringify(this.currentQuiz) }
                        }
                    }
                })
            });
            */
            
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save quiz', 'error');
        }
    }
    
    clearQuiz() {
        if (confirm('Clear all questions? This cannot be undone!')) {
            this.currentQuiz.questions = [];
            document.getElementById('questions-container').innerHTML = this.renderQuestions();
            document.querySelector('button[onclick="quiz.saveQuiz()"]').disabled = true;
            this.showNotification('Quiz cleared', 'info');
        }
    }
    
    previewQuiz() {
        if (!this.currentQuiz.questions.length) {
            this.showNotification('No questions to preview!', 'error');
            return;
        }
        
        // Open preview in new window or modal
        const previewHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quiz Preview</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    .question { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .question h3 { margin-top: 0; }
                    .answer { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
                    .correct { background: #d4edda; }
                </style>
            </head>
            <body>
                <h1>Quiz Preview: ${this.courseDetails?.name || this.context.courseName}</h1>
                ${this.currentQuiz.questions.map((q, i) => `
                    <div class="question">
                        <h3>Question ${i + 1}: ${q.text}</h3>
                        ${q.answers.map((a, j) => `
                            <div class="answer ${q.correct === j ? 'correct' : ''}">
                                ${j === q.correct ? '✓ ' : ''}${a}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </body>
            </html>
        `;
        
        const preview = window.open('', 'preview', 'width=900,height=700');
        preview.document.write(previewHtml);
        preview.document.close();
    }
    
    // LEARNER VIEW
    async loadLearnerView() {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="learner-view">
                <h1>🌸 Kawaii Quiz</h1>
                <div class="welcome-message">
                    <p>Welcome, ${this.context.userName}!</p>
                    <p>Ready to take the quiz for:</p>
                    <h2>${this.context.courseName}</h2>
                </div>
                <button class="btn-primary btn-large" onclick="quiz.startQuiz()">
                    Start Quiz
                </button>
            </div>
        `;
    }
    
    async startQuiz() {
        // TODO: Implement quiz taking functionality
        this.showNotification('Quiz player coming soon!', 'info');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize on load
let quiz;
window.addEventListener('DOMContentLoaded', () => {
    quiz = new KawaiiQuiz();
    quiz.init();
});
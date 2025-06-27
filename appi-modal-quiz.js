// Kawaii Quiz App v6.0 - Modal-based Single Question Display

class KawaiiQuiz {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
        
        // Dark mode styles are now handled by styles-modal.css
        
        // Debug: Log all parameters to find course name
        // console.log('🔍 All URL parameters from ALM:');
        for (let [key, value] of this.params) {
            // console.log(`  ${key}: ${value}`);
        }
        
        // Context from ALM - check multiple possible parameter names
        this.context = {
            userId: this.params.get('userId') || this.params.get('user_id') || this.params.get('CSUSER'),
            courseId: this.params.get('courseId') || this.params.get('loId') || this.params.get('course_id'),
            accountId: this.params.get('accountId') || this.params.get('account_id') || '1361',
            accessToken: this.getCorrectAuthToken(),
            userRole: this.params.get('userRole') || this.params.get('user_role') || this.params.get('role') || 'learner',
            userName: this.params.get('userName') || this.params.get('user_name') || this.params.get('name') || 'Learner',
            courseName: this.params.get('courseName') || this.params.get('course_name') || 
                       this.params.get('loName') || this.params.get('lo_name') || 
                       this.params.get('loTitle') || this.params.get('title') || 'Course',
            isInstructor: false
        };
        
        // Determine instructor role
        const instructorRoles = ['instructor', 'admin', 'author'];
        this.context.isInstructor = instructorRoles.includes(this.context.userRole.toLowerCase());
        
        // Quiz state
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.hearts = 5; // More hearts for more fun
        this.answers = [];
        this.quizMode = null; // 'create' or 'take'
        
        // ALM API config - Will be populated from server
        this.almApi = {
            clientId: null,
            clientSecret: null,
            refreshToken: null,
            accessToken: null,
            tokenExpiry: null
        };
    }
    
    getCorrectAuthToken() {
        const authTokens = this.params.getAll('authToken');
        if (authTokens.length <= 1) return authTokens[0];
        return authTokens.reduce((a, b) => a.length > b.length ? a : b);
    }
    
    async getServerToken(type = 'admin') {
        try {
            console.log('🔐 Fetching token from server...');
            const response = await fetch('/alm-quiz/get-token-simple.php?type=' + type);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to get token');
            }
            
            // Update local token info
            this.almApi.accessToken = data.access_token;
            this.almApi.tokenExpiry = new Date(data.expires_at);
            this.almApi.clientId = data.client_id;
            
            // Store in localStorage for debugging
            localStorage.setItem('alm_admin_token', data.access_token);
            localStorage.setItem('alm_token_expiry', data.expires_at);
            
            console.log('✅ Token fetched successfully, expires at:', data.expires_at);
            return data.access_token;
        } catch (error) {
            console.error('❌ Failed to get server token:', error);
            // Show user-friendly error
            console.error('Authentication failed - please refresh the page');
            throw error;
        }
    }
    
    async ensureValidToken() {
        // Check if token expires within 1 hour
        if (!this.almApi.tokenExpiry) {
            await this.getServerToken('admin');
            return;
        }
        
        const hoursUntilExpiry = (this.almApi.tokenExpiry - new Date()) / (1000 * 60 * 60);
        if (hoursUntilExpiry < 1) {
            console.log('🔄 Token expiring soon, refreshing...');
            await this.getServerToken('admin');
        }
    }
    
    // Token refresh functions - keeping for future use
    // For now, we'll manually update tokens when they expire
    /*
    async refreshAccessToken() {
        // Commented out for safety - manual refresh for now
    }
    */
    
    async init() {
        try {
            // Fetch server token first
            await this.getServerToken('admin');
            
            // Add fullscreen button
            this.addFullscreenButton();
            
            // Set up event delegation for answer selection
            this.setupEventDelegation();
            
            if (this.context.isInstructor) {
                this.quizMode = 'create';
                await this.showQuizBuilder();
            } else {
                this.quizMode = 'take';
                await this.showQuizTaker();
            }
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showErrorState();
        }
    }
    
    addFullscreenButton() {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.title = 'Toggle Fullscreen';
        fullscreenBtn.onclick = () => this.toggleFullscreen();
        
        // More conventional mobile styling
        fullscreenBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.7);
            color: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Hover effects
        fullscreenBtn.onmouseover = () => {
            fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.9)';
            fullscreenBtn.style.transform = 'scale(1.1)';
            fullscreenBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
        };
        
        fullscreenBtn.onmouseout = () => {
            fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.7)';
            fullscreenBtn.style.transform = 'scale(1)';
            fullscreenBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        };
        
        document.body.appendChild(fullscreenBtn);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { // Safari
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { // IE/Edge
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
        }
    }
    
    // QUIZ BUILDER MODE
    async showQuizBuilder() {
        document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <h1><img src="icons/boxMod.svg" alt="Quiz Builder" style="width: 120px; height: 120px;"></h1>
                </div>
                
                <div class="quiz-builder-content" id="quiz-builder-content">
                    <div class="loading-card">
                        <h2>🔍 Loading Course Details...</h2>
                        <div class="spinner"></div>
                        <p>Fetching course information from ALM</p>
                    </div>
                </div>
            </div>
        `;
        
        // Automatically start the process
        setTimeout(() => this.initializeQuizBuilder(), 500);
    }
    
    // QUIZ TAKER MODE
    async showQuizTaker() {
        // Try to get the learner's actual name from ALM
        await this.fetchLearnerName();
        
        // Check what quizzes are available for this learner
        const availableQuiz = await this.findQuizForLearner();
        
        document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="welcome-screen">
                    <div id="mystery-icon-container" style="display: flex; justify-content: center; margin: 40px 0; height: 150px;">
                        <!-- Mystery icon animation will go here -->
                    </div>
                    <div style="text-align: center; margin: 60px 0;">
                        <div style="font-size: 0; white-space: nowrap;">${this.renderHearts()}</div>
                    </div>
                    <div style="text-align: center; margin-top: 80px;">
                        <img id="start-button" src="icons/save.svg" onclick="quiz.startQuiz()" style="width: 80px; height: 80px; cursor: pointer;">
                    </div>
                    <style>
                        @keyframes pulseGreen {
                            0%, 100% { 
                                filter: brightness(1) sepia(1) saturate(10) hue-rotate(80deg) drop-shadow(0 0 5px rgba(124, 252, 0, 0.5)); 
                            }
                            50% { 
                                filter: brightness(1.4) sepia(1) saturate(10) hue-rotate(80deg) drop-shadow(0 0 25px rgba(124, 252, 0, 1)); 
                            }
                        }
                        @keyframes subtlePulse {
                            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255,255,255,0.5)); }
                            50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(255,255,255,0.7)); }
                        }
                    </style>
                </div>
            </div>
        `;
        
        // Start the mystery icon animation
        this.startMysteryIconAnimation();
        
        // Start save button pulse after strobe effect (about 6.5 seconds)
        setTimeout(() => {
            const saveBtn = document.getElementById('start-button');
            if (saveBtn) {
                saveBtn.style.animation = 'pulseGreen 2s ease-in-out infinite';
            }
        }, 6500);
    }
    
    async fetchLearnerName() {
        // Use LEARNER token from context, not admin token
        if (!this.context.accessToken) return;
        
        try {
            const response = await fetch('https://learningmanager.adobe.com/primeapi/v2/user', {
                headers: {
                    'Authorization': `Bearer ${this.context.accessToken}`,
                    'Accept': 'application/vnd.api+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const userData = data.data;
                if (userData && userData.attributes) {
                    const firstName = userData.attributes.firstName || '';
                    const lastName = userData.attributes.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    
                    if (fullName) {
                        this.context.userName = fullName;
                    }
                }
            }
        } catch (error) {
            // console.log('Could not fetch learner name:', error);
            // Keep using the default userName from params
        }
    }
    
    async initializeQuizBuilder() {
        try {
            // Step 1: Fetch course details from ALM
            this.updateBuilderStatus('Fetching course details from ALM...');
            await this.fetchCourseDetails();
            
            // Step 2: Check if quiz already exists
            this.updateBuilderStatus('Checking for existing quiz...');
            const hasExistingQuiz = await this.loadExistingQuiz();
            
            if (hasExistingQuiz) {
                // Show existing quiz options
                this.showExistingQuizOptions();
            } else {
                // Step 3: Auto-generate quiz from course content
                this.updateBuilderStatus('Generating quiz questions from course content...');
                await this.autoGenerateFromCourse();
            }
        } catch (error) {
            // console.error('Error initializing quiz builder:', error);
            this.showErrorState();
        }
    }
    
    updateBuilderStatus(message) {
        const content = document.getElementById('quiz-builder-content');
        content.innerHTML = `
            <div class="loading-card">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
    
    async fetchCourseDetails() {
        // console.log('🔍 Attempting to fetch course details...');
        // console.log('Context:', this.context);
        // console.log('Course ID:', this.context.courseId);
        // console.log('Access Token:', this.almApi.accessToken ? 'Present' : 'Missing');
        
        try {
            if (!this.context.courseId) {
                // console.warn('⚠️ No course ID available, using fallback');
                throw new Error('No course ID available');
            }
            
            // Try API call to get real course data
            // console.log('📋 Attempting to fetch real course data...');
            
            // Use LEARNER token for course details
            const token = this.context.accessToken || this.almApi.accessToken;
            const response = await fetch(
                `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${this.context.courseId}?include=skills,instances.loResources`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.api+json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                this.parseCourseData(data);
                // console.log('✅ Successfully fetched course details from ALM!');
            } else {
                throw new Error(`API call failed: ${response.status}`);
            }
            
        } catch (error) {
            // console.error('❌ Error in fetchCourseDetails:', error);
            // Use fallback
            this.courseDetails = {
                name: this.context.courseName || 'Course',
                description: 'Course content will be used to generate relevant quiz questions.',
                overview: ''
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
            modules: []
        };
        
        // Extract skills and modules from included data
        if (data.included) {
            data.included.forEach(item => {
                if (item.type === 'skill') {
                    this.courseDetails.skills.push(item.attributes.name);
                }
            });
        }
        
        // console.log('Parsed course details:', this.courseDetails);
    }
    
    async loadExistingQuiz() {
        try {
            // First try to load from server
            const serverData = await this.loadQuizFromServer();
            
            if (serverData && serverData.quiz) {
                // console.log('🌐 Found existing quiz on server');
                this.currentQuiz = serverData.quiz;
                return true;
            }
            
            // Check localStorage as fallback
            const localData = localStorage.getItem(`quiz_${this.context.courseId}`);
            if (localData) {
                const parsed = JSON.parse(localData);
                if (parsed.quiz || parsed.questions) {
                    // console.log('💾 Found existing quiz in localStorage');
                    this.currentQuiz = parsed.quiz || parsed;
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            // console.error('Error loading existing quiz:', error);
            return false;
        }
    }
    
    showExistingQuizOptions() {
        const content = document.getElementById('quiz-builder-content');
        content.innerHTML = `
            <div class="existing-quiz-card">
                <h2>📋 Existing Quiz Found</h2>
                <p>${this.currentQuiz.questions.length} questions already created for this course</p>
                <div class="button-group">
                    <button class="btn-primary" onclick="quiz.editQuiz()">
                        Edit Existing Quiz
                    </button>
                    <button class="btn-secondary" onclick="quiz.createNewQuiz()">
                        Create New Quiz
                    </button>
                </div>
            </div>
        `;
    }
    
    async autoGenerateFromCourse() {
        try {
            // Generate AI-powered questions using course details
            this.updateBuilderStatus('Creating AI-powered questions based on course content...');
            
            const prompt = this.buildQuizPrompt();
            // console.log('🎨 Sending creative prompt to AI:', prompt);
            
            const response = await fetch('/alm-quiz/generate-quiz.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });
            
            const result = await response.json();
            
            if (result.success && result.questions) {
                // console.log('✅ AI generated questions:', result.questions);
                // Deep copy questions to avoid reference issues
                // Handle both old and new API formats
                this.currentQuiz = {
                    courseId: this.context.courseId,
                    courseName: this.courseDetails.name,
                    questions: result.questions.map(q => ({
                        text: q.question || q.text,
                        answers: q.options ? [...q.options] : [...q.answers],  // Create new array for each question
                        correct: q.answer !== undefined ? q.answer : q.correct
                    }))
                };
                
                // Show success and auto-open editor
                this.showGenerationSuccess();
            } else {
                console.error('AI generation failed - no quiz data returned');
                this.showErrorState('Failed to generate quiz questions. Please try again.');
                return;
            }
            
        } catch (error) {
            console.error('Error generating quiz:', error);
            this.showErrorState('Failed to generate quiz: ' + error.message);
            return;
        }
    }
    
    buildQuizPrompt() {
        const courseName = this.courseDetails?.name || this.context.courseName;
        const overview = this.courseDetails?.overview || '';
        const description = this.courseDetails?.description || '';
        const skills = this.courseDetails?.skills?.join(', ') || '';
        const tags = this.courseDetails?.tags?.join(', ') || '';
        
        // Determine creative style based on course content
        let styleGuidance = '';
        if (courseName.includes('Seuss') || courseName.includes('Geisel')) {
            styleGuidance = `
CRITICAL STYLE REQUIREMENT: Write questions in a whimsical, Dr. Seuss-inspired style!
- Use playful language and unexpected word combinations
- Add rhythm and rhyme where possible (but maintain clarity)
- Channel the spirit of "Oh, the Places You'll Go!" and "Green Eggs and Ham"
- Make questions delightfully unusual while still testing knowledge
- Example: "In a box? With a fox? How many words did Seuss use to write his green eggs talks?"`;
        } else if (courseName.toLowerCase().includes('communication') || courseName.toLowerCase().includes('theory')) {
            styleGuidance = `
STYLE REQUIREMENT: Write questions that explore communication concepts creatively!
- Use real-world scenarios and relatable examples
- Frame questions as "decode this message" puzzles
- Include questions about miscommunication mishaps
- Reference famous speeches, viral memes, or communication breakdowns
- Example: "If Shannon and Weaver's model was a pizza delivery, what role would static on the phone play?"`;
        } else if (courseName.toLowerCase().includes('poetry') || courseName.toLowerCase().includes('literature')) {
            styleGuidance = `
STYLE REQUIREMENT: Write questions with literary flair!
- Use metaphors and vivid imagery
- Incorporate poetic devices where appropriate
- Make questions intellectually stimulating and creative
- Reference famous literary works when relevant`;
        } else if (courseName.toLowerCase().includes('science') || courseName.toLowerCase().includes('technology')) {
            styleGuidance = `
STYLE REQUIREMENT: Write questions that spark scientific curiosity!
- Frame questions as intriguing puzzles or thought experiments
- Use "What if..." scenarios when possible
- Make learners think like scientists/engineers
- Include "lab mishap" scenarios for fun`;
        } else if (courseName.toLowerCase().includes('history')) {
            styleGuidance = `
STYLE REQUIREMENT: Make history come alive with engaging questions!
- Use "time traveler" scenarios
- Create "what would happen if..." alternate history questions
- Include questions about historical figures' Twitter feeds
- Make connections to modern day parallels`;
        } else if (courseName.toLowerCase().includes('math') || courseName.toLowerCase().includes('calculus')) {
            styleGuidance = `
STYLE REQUIREMENT: Make math questions fun and relatable!
- Use real-world applications (pizza slices, video game stats)
- Include "mathematician as superhero" scenarios
- Frame problems as puzzles or mysteries to solve
- Add humor about common math fears`;
        } else {
            styleGuidance = `
STYLE REQUIREMENT: Write questions that are creative and engaging!
- Use unexpected angles and fresh perspectives
- Make questions memorable and thought-provoking
- Add personality that matches the course subject
- Include pop culture references where appropriate`;
        }
        
        return `Create a 10-question multiple choice quiz for a course titled "${courseName}".

Course Overview: ${overview}

Course Description: ${description}

Key Skills: ${skills}

Topics: ${tags}

${styleGuidance}

Requirements:
1. Each question should have exactly 4 answer options
2. Only one answer should be correct
3. Questions should test understanding, not just memorization
4. Mix different difficulty levels
5. Cover various aspects of the course content
6. Make questions creative, unusual, and memorable
7. Wrong answers should be plausible but clearly incorrect when you know the material
8. Inject personality and flair that matches the course subject

Return the response as a JSON array with this exact structure:
[
  {
    "text": "Question text here?",
    "answers": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]`;
    }
    
    // Simplified fallback - AI should handle all question generation
    generateContextualQuestions() {
        // console.warn('⚠️ Fallback: AI generation failed, returning minimal quiz');
        return [{
            text: `Welcome to ${this.courseDetails?.name || 'this course'}! AI quiz generation is temporarily unavailable.`,
            answers: [
                "I'm ready to try again later",
                "Please refresh the page",
                "Contact support for help",
                "Check my internet connection"
            ],
            correct: 0
        }];
    }
    
    // Original method kept for reference but not used
    generateContextualQuestions_OLD() {
        const courseName = this.courseDetails.name;
        const topics = [
            ...this.courseDetails.skills,
            ...this.courseDetails.tags
        ].filter(Boolean);
        
        // console.log('🎯 Generating questions for course:', courseName);
        // console.log('📚 Course details:', this.courseDetails);
        
        // Generate questions based on course context
        const questions = [];
        
        // For Dr. Seuss course, create specific questions
        if (courseName.includes("Seuss") || courseName.includes("Geisel")) {
            // console.log('✅ Detected Dr. Seuss course! Generating specific questions...');
            questions.push(
                {
                    text: "What was Dr. Seuss's real name?",
                    answers: [
                        "Theodor Seuss Geisel",
                        "Theodore Roosevelt Seuss",
                        "Samuel Seuss Green",
                        "William Seuss Gardner"
                    ],
                    correct: 0
                },
                {
                    text: "Which book did Dr. Seuss write using only 50 words?",
                    answers: [
                        "The Cat in the Hat",
                        "One Fish Two Fish Red Fish Blue Fish",
                        "Green Eggs and Ham",
                        "Hop on Pop"
                    ],
                    correct: 2
                },
                {
                    text: "What educational approach did Dr. Seuss challenge with his books?",
                    answers: [
                        "The 'Dick and Jane' primers",
                        "Phonics-based reading",
                        "Whole language learning",
                        "Silent reading method"
                    ],
                    correct: 0
                },
                {
                    text: "What writing technique did Dr. Seuss famously use in his books?",
                    answers: [
                        "Iambic pentameter",
                        "Free verse poetry",
                        "Anapestic tetrameter",
                        "Haiku structure"
                    ],
                    correct: 2
                },
                {
                    text: "Which Dr. Seuss book explores environmental responsibility?",
                    answers: [
                        "The Cat in the Hat",
                        "The Lorax",
                        "Green Eggs and Ham",
                        "Oh, the Places You'll Go!"
                    ],
                    correct: 1
                },
                {
                    text: "What theme does 'The Sneetches' address?",
                    answers: [
                        "Environmental conservation",
                        "Mathematical concepts",
                        "Prejudice and discrimination",
                        "Scientific exploration"
                    ],
                    correct: 2
                },
                {
                    text: "During WWII, what type of work did Dr. Seuss create?",
                    answers: [
                        "Children's books only",
                        "Political cartoons and propaganda films",
                        "Scientific textbooks",
                        "Musical compositions"
                    ],
                    correct: 1
                },
                {
                    text: "What was the result of Bennett Cerf's bet with Dr. Seuss?",
                    answers: [
                        "The Cat in the Hat",
                        "Green Eggs and Ham",
                        "One Fish Two Fish",
                        "The Lorax"
                    ],
                    correct: 1
                },
                {
                    text: "How many words did Dr. Seuss use to write 'Green Eggs and Ham'?",
                    answers: [
                        "25 words",
                        "50 words",
                        "100 words",
                        "200 words"
                    ],
                    correct: 1
                },
                {
                    text: "What year was Dr. Seuss born?",
                    answers: [
                        "1894",
                        "1899",
                        "1904",
                        "1914"
                    ],
                    correct: 2
                }
            );
        }
        
        // Add general questions about the course
        questions.push({
            text: `What is a key learning objective of "${courseName}"?`,
            answers: [
                "Understanding the subject's impact and innovations",
                "Memorizing dates and facts only",
                "Completing assignments quickly",
                "Avoiding critical thinking"
            ],
            correct: 0
        });
        
        // Add topic-specific questions if we have topics
        if (topics.length > 0) {
            topics.slice(0, 3).forEach(topic => {
                questions.push({
                    text: `Which best describes the role of ${topic} in this course?`,
                    answers: [
                        `It's a fundamental concept that supports other learning`,
                        `It's optional and can be skipped`,
                        `It's only for advanced learners`,
                        `It's not related to the course objectives`
                    ],
                    correct: 0
                });
            });
        }
        
        // Add general learning questions
        const generalQuestions = [
            {
                text: "What's the most effective way to retain knowledge from this course?",
                answers: [
                    "Regular practice and application of concepts",
                    "Reading once and never reviewing",
                    "Memorizing without understanding",
                    "Skipping exercises and projects"
                ],
                correct: 0
            },
            {
                text: "When encountering difficulties in the course material, you should:",
                answers: [
                    "Skip the difficult parts entirely",
                    "Give up and move to another course",
                    "Review prerequisites and ask for help",
                    "Assume it's too advanced for you"
                ],
                correct: 2
            },
            {
                text: "How do hands-on exercises contribute to learning?",
                answers: [
                    "They waste valuable study time",
                    "They reinforce theoretical concepts through practice",
                    "They're optional and unnecessary",
                    "They're only for testing, not learning"
                ],
                correct: 1
            },
            {
                text: "What indicates mastery of course concepts?",
                answers: [
                    "Ability to apply knowledge in various contexts",
                    "Memorizing all definitions perfectly",
                    "Completing the course quickly",
                    "Never making any mistakes"
                ],
                correct: 0
            },
            {
                text: "The best approach to course assessments is to:",
                answers: [
                    "Cram all information the night before",
                    "Skip them if they're not mandatory",
                    "Use them to gauge understanding and identify gaps",
                    "Copy answers from other sources"
                ],
                correct: 2
            }
        ];
        
        // Only add general questions if we need more to reach 10
        if (questions.length < 10) {
            const needed = 10 - questions.length;
            // console.log(`📝 Adding ${needed} general questions to reach 10 total`);
            questions.push(...generalQuestions.slice(0, needed));
        }
        
        // console.log(`📊 Final quiz: ${questions.length} questions generated`);
        return questions.slice(0, 10);
    }
    
    showGenerationSuccess() {
        const content = document.getElementById('quiz-builder-content');
        content.innerHTML = `
            <div class="generation-success-container">
                <div class="success-card">
                    <div class="success-icon"><img src="icons/boxMod.svg" alt="Success" style="width: 80px; height: 80px;"></div>
                    <h2>Quiz Generated Successfully!</h2>
                    <p>Created 10 questions based on <strong>${this.courseDetails.name}</strong></p>
                    <div class="course-summary">
                        ${this.courseDetails.overview ? `<div class="overview-section"><h3>Overview</h3><p class="overview">${this.courseDetails.overview}</p></div>` : ''}
                        ${this.courseDetails.description ? `<div class="description-section"><h3>Description</h3><div class="description-scroll"><p>${this.courseDetails.description}</p></div></div>` : ''}
                        ${this.courseDetails.skills && this.courseDetails.skills.length > 0 ? 
                            `<div class="skills-section"><h3>Key Topics</h3><p class="skills">${this.courseDetails.skills.join(', ')}</p></div>` : ''}
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn-primary btn-large" onclick="quiz.editQuiz()">
                        Review & Edit Questions
                    </button>
                    <button class="btn-secondary" onclick="quiz.saveQuizDirectly()">
                        Save As Is
                    </button>
                </div>
            </div>
        `;
    }
    
    showErrorState() {
        const content = document.getElementById('quiz-builder-content');
        content.innerHTML = `
            <div class="error-card">
                <h2>Unable to Auto-Generate Quiz</h2>
                <p>We couldn't fetch course details or generate questions automatically.</p>
                <button class="btn-primary" onclick="quiz.startManualCreation()">
                    Create Quiz Manually
                </button>
                <button class="btn-secondary" onclick="quiz.retryGeneration()">
                    Try Again
                </button>
            </div>
        `;
    }
    
    async retryGeneration() {
        await this.initializeQuizBuilder();
    }
    
    createNewQuiz() {
        this.currentQuiz = null;
        this.autoGenerateFromCourse();
    }
    
    startManualCreation() {
        this.currentQuiz = {
            courseId: this.context.courseId,
            courseName: this.courseDetails?.name || this.context.courseName,
            questions: [{
                text: '',
                answers: ['', '', '', ''],
                correct: 0
            }]
        };
        this.currentQuestionIndex = 0;
        this.showQuestionEditor();
    }
    
    async saveQuizToServer(saveData) {
        try {
            const formData = new FormData();
            formData.append('action', 'save');
            formData.append('courseId', this.context.courseId);
            formData.append('quiz', JSON.stringify(saveData));
            
            console.log('📤 Saving to server...');
            const response = await fetch('/alm-quiz/save-quiz.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Server save successful:', result);
            return true;
        } catch (error) {
            console.error('❌ Server save failed:', error);
            return false;
        }
    }
    
    async saveScoreToServer() {
        try {
            const formData = new FormData();
            formData.append('action', 'save');
            formData.append('courseId', this.context.courseId);
            formData.append('userId', this.context.userId || 'unknown');
            formData.append('userName', this.context.userName || 'Learner');
            formData.append('score', this.score);
            formData.append('totalQuestions', this.currentQuiz.questions.length);
            
            console.log('💾 Saving score to server...');
            const response = await fetch('/alm-quiz/save-score.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Score saved successfully:', result);
            console.log(`📊 Attempt #${result.attemptNumber}, Score: ${result.percentage}%`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save score:', error);
            return false;
        }
    }
    
    async loadQuizFromServer() {
        try {
            console.log('🔍 Loading quiz from server for course:', this.context.courseId);
            const response = await fetch(`/alm-quiz/save-quiz.php?courseId=${encodeURIComponent(this.context.courseId)}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📭 No saved quiz found on server');
                    return null;
                }
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Quiz loaded from server:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to load quiz from server:', error);
            return null;
        }
    }
    
    async saveQuiz() {
        // First validate all questions are complete
        for (let i = 0; i < this.currentQuiz.questions.length; i++) {
            const q = this.currentQuiz.questions[i];
            if (!q.text || q.text.trim() === '') {
                alert(`Question ${i + 1} is blank. All 10 questions must be completed before saving.`);
                this.currentQuestionIndex = i;
                this.showQuestionEditor();
                return false;
            }
            // Check if all answers are filled
            for (let j = 0; j < q.answers.length; j++) {
                if (!q.answers[j] || q.answers[j].trim() === '') {
                    alert(`Question ${i + 1} has blank answers. All answers must be filled in.`);
                    this.currentQuestionIndex = i;
                    this.showQuestionEditor();
                    return false;
                }
            }
            // Check if a correct answer is selected
            if (q.correct === undefined || q.correct === null || q.correct < 0 || q.correct >= q.answers.length) {
                alert(`Question ${i + 1} needs a correct answer selected.`);
                this.currentQuestionIndex = i;
                this.showQuestionEditor();
                return false;
            }
        }
        
        // Save to localStorage as backup
        const quizKey = `kawaii_quiz_${this.context.courseId}`;
        const quizData = {
            courseId: this.context.courseId,
            courseName: this.context.courseName,
            questions: this.currentQuiz.questions,
            createdBy: this.context.userName,
            createdAt: new Date().toISOString(),
            version: 1
        };
        
        try {
            // Save to localStorage first (backup)
            localStorage.setItem(quizKey, JSON.stringify(quizData));
            console.log('📝 Quiz saved to localStorage');
            
            // Now save to server
            const formData = new FormData();
            formData.append('action', 'save');
            formData.append('courseId', this.context.courseId);
            formData.append('quiz', JSON.stringify(quizData));
            
            console.log('📤 Sending quiz to server...');
            const response = await fetch('/alm-quiz/save-quiz.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Server save result:', result);
            
            return result.success === true;
        } catch (e) {
            console.error('❌ Failed to save quiz:', e);
            console.error('Error details:', {
                message: e.message,
                stack: e.stack
            });
            // Check if it's a network error
            if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
                console.error('Network error - check if save-quiz.php exists at /alm-quiz/save-quiz.php');
            }
            // At least we have localStorage backup
            return false;
        }
    }
    
    async saveQuizDirectly() {
        this.showLoadingModal('Saving quiz to database...');
        
        try {
            const saved = await this.saveQuiz();
            this.hideModal();
            
            if (saved) {
                this.showNotification('Quiz saved successfully!', 'success');
                setTimeout(() => this.showQuizSavedConfirmation(), 1000);
            } else {
                this.showNotification('Failed to save quiz to server', 'error');
            }
        } catch (error) {
            this.hideModal();
            console.error('Save error:', error);
            this.showNotification('❌ Failed to save quiz', 'error');
        }
    }
    
    showQuizSavedConfirmation() {
        // Show as a modal
        this.showModal(`
            <div class="success-card">
                <div class="success-icon"></div>
                <h2>Quiz Saved Successfully!</h2>
                <p>Your quiz has been saved and is ready for learners.</p>
                <p style="margin-top: 20px; color: rgba(255, 255, 255, 0.7);">You can close this window or return to ALM.</p>
                <div class="button-group" style="margin-top: 30px;">
                    <button class="btn-primary btn-large" onclick="quiz.hideModal(); quiz.closeEditor();">
                        Close Editor
                    </button>
                    <button class="btn-secondary" onclick="quiz.hideModal();">
                        Continue Editing
                    </button>
                </div>
            </div>
        `);
    }
    
    exitBuilder() {
        if (window.parent !== window) {
            // We're in an iframe, try to communicate with parent
            window.parent.postMessage({ action: 'closeQuizBuilder' }, '*');
        }
        // Show a simple fading icon
        document.getElementById('app').innerHTML = `
            <div class="quiz-container" style="display: flex; align-items: center; justify-content: center; height: 100vh;">
                <img src="icons/spiralTight.svg" style="
                    width: 120px; 
                    height: 120px; 
                    animation: rotateWiggle 2s ease-in-out infinite, fadeOut 3s ease-out forwards;
                ">
            </div>
            <style>
                @keyframes rotateWiggle {
                    0%, 100% { transform: rotate(-10deg); }
                    50% { transform: rotate(10deg); }
                }
                @keyframes fadeOut {
                    0% { opacity: 1; }
                    70% { opacity: 1; }
                    100% { opacity: 0; }
                }
            </style>
        `;
    }
    
    async autoGenerateQuiz() {
        this.showLoadingModal('Generating amazing questions...');
        
        try {
            // This appears to be a demo function - show error
            this.hideModal();
            this.showErrorState('Quiz generation not implemented in this demo mode');
            
            // Update UI
            document.getElementById('existing-quiz-card').style.display = 'block';
            document.getElementById('question-count').textContent = this.currentQuiz.questions.length;
            
            // Auto-open editor
            setTimeout(() => this.editQuiz(), 500);
            
        } catch (error) {
            this.hideModal();
            this.showNotification('Failed to generate quiz', 'error');
        }
    }
    
    // Removed generateSampleQuestions - was returning fake non-functional options
    
    
    editQuiz() {
        if (!this.currentQuiz || !this.currentQuiz.questions.length) {
            this.showNotification('No quiz to edit!', 'error');
            return;
        }
        
        this.currentQuestionIndex = 0;
        this.showQuestionEditor();
    }
    
    showQuestionEditor() {
        // console.log(`📝 showQuestionEditor called for question ${this.currentQuestionIndex + 1}`);
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        // console.log('Question data:', JSON.parse(JSON.stringify(question))); // Log a copy to avoid console reference issues
        
        // Ensure each question has its own answers array
        if (!Array.isArray(question.answers)) {
            question.answers = ['', '', '', ''];
        }
        const questionNum = this.currentQuestionIndex + 1;
        const totalQuestions = this.currentQuiz.questions.length;
        
        this.showModal(`
            <div class="question-editor">
                <div class="editor-header">
                    <h2>Question ${questionNum} of ${totalQuestions}</h2>
                    <button class="btn-close" onclick="quiz.closeEditor()">×</button>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label>Question Text:</label>
                        <textarea id="question-text" rows="3">${question.text}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Answer Options (Click to select correct answer):</label>
                        <div class="answer-options-editor">
                            ${question.answers.map((answer, i) => `
                                <div class="answer-editor-row ${question.correct === i ? 'correct-answer' : ''}">
                                    <button class="mark-correct-btn ${question.correct === i ? 'selected' : ''}" 
                                        data-answer-index="${i}"
                                        title="Click to mark as correct answer">
                                        ${question.correct === i ? '<img src="icons/heartCheck.svg" class="icon-check" alt="Correct">' : '○'}
                                    </button>
                                    <textarea class="answer-text" 
                                        id="answer-${i}" 
                                        onchange="quiz.updateAnswer(${i}, this.value)"
                                        placeholder="Enter answer option ${i + 1}"
                                        rows="1">${answer}</textarea>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="editor-footer brutalist-nav">
                    <div class="nav-group left">
                        <button class="btn-brutalist btn-delete" onclick="quiz.deleteQuestion()" 
                            ${totalQuestions <= 1 ? 'disabled' : ''} title="Delete Question"
                            style="background: transparent !important; background-color: transparent !important; border: none !important;">
                            <img src="icons/delete.svg" alt="Delete" class="icon-brutal">
                        </button>
                    </div>
                    
                    <div class="nav-group center">
                        <button class="btn-brutalist btn-prev" onclick="quiz.previousQuestion()" 
                            ${questionNum <= 1 ? 'disabled' : ''} title="Previous Question"
                            style="background: transparent !important; background-color: transparent !important; border: none !important;">
                            <img src="icons/brutalistArrowIconRight.svg" alt="Previous" class="icon-brutal icon-flip">
                        </button>
                        
                        <button class="btn-brutalist btn-save" onclick="quiz.saveQuestion()" title="Save Question"
                            style="background: transparent !important; background-color: transparent !important; border: none !important;">
                            <img src="icons/save.svg" alt="Save" class="icon-brutal">
                        </button>
                        
                        <button class="btn-brutalist btn-next" onclick="quiz.nextQuestion()" 
                            ${questionNum >= totalQuestions ? 'disabled' : ''} title="Next Question"
                            style="background: transparent !important; background-color: transparent !important; border: none !important;">
                            <img src="icons/brutalistArrowIconRight.svg" alt="Next" class="icon-brutal">
                        </button>
                    </div>
                    
                    <div class="nav-group right">
                        <button class="btn-brutalist btn-save-all" onclick="quiz.saveAllQuestions()" title="Save All"
                            style="background: transparent !important; background-color: transparent !important; border: none !important;">
                            <img src="icons/saveAll.svg" alt="Save All" class="icon-brutal">
                        </button>
                    </div>
                </div>
            </div>
        `);
    }
    
    saveQuestion() {
        try {
            console.log(`💾 Saving question ${this.currentQuestionIndex}`);
            
            // Validate quiz state
            if (!this.currentQuiz || !this.currentQuiz.questions) {
                throw new Error('No quiz loaded');
            }
            
            if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.currentQuiz.questions.length) {
                throw new Error(`Invalid question index: ${this.currentQuestionIndex}`);
            }
            
            const question = this.currentQuiz.questions[this.currentQuestionIndex];
            
            // Get form elements with error checking
            const questionTextEl = document.getElementById('question-text');
            if (!questionTextEl) {
                throw new Error('Question text field not found');
            }
            
            const newText = questionTextEl.value.trim();
            if (!newText) {
                this.showNotification('Question text cannot be empty!', 'error');
                return false;
            }
            
            // Collect and validate answers
            const newAnswers = [];
            let emptyAnswers = 0;
            
            for (let i = 0; i < 4; i++) {
                const answerEl = document.getElementById(`answer-${i}`);
                if (!answerEl) {
                    throw new Error(`Answer field ${i} not found`);
                }
                
                const answerText = answerEl.value.trim();
                if (!answerText) {
                    emptyAnswers++;
                }
                newAnswers[i] = answerText;
            }
            
            // Validate we have at least 2 non-empty answers
            if (emptyAnswers > 2) {
                this.showNotification('Please provide at least 2 answer options!', 'error');
                return false;
            }
            
            // Validate correct answer is not empty
            if (question.correct !== undefined && !newAnswers[question.correct]) {
                this.showNotification('The correct answer cannot be empty!', 'error');
                return false;
            }
            
            // Update question data
            question.text = newText;
            question.answers = [...newAnswers];
            
            // console.log(`✅ Question ${this.currentQuestionIndex} saved successfully`);
            this.showNotification('Question saved!', 'success');
            
            // Auto-save to localStorage as backup
            // this.autoSaveQuiz(); // TODO: Function doesn't exist yet!
            
            return true;
            
        } catch (error) {
            console.error('❌ Error saving question:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                error: error
            });
            const errorMessage = error.message || 'Unknown error occurred';
            this.showNotification(`Error: ${errorMessage}`, 'error');
            return false;
        }
    }
    
    previousQuestion() {
        // console.log(`⬅ previousQuestion called from index ${this.currentQuestionIndex}`);
        
        // Save current question first
        const saved = this.saveQuestion();
        if (saved === false) {
            // console.log('Question validation failed, staying on current question');
            return;
        }
        
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            // console.log(`Moving to question ${this.currentQuestionIndex + 1}`);
            this.showQuestionEditor();
        } else {
            // console.log('Already at first question');
            this.showNotification('Already at first question', 'info');
        }
    }
    
    nextQuestion() {
        console.log(`➡️ NEXT BUTTON CLICKED! Current index: ${this.currentQuestionIndex}`);
        
        // Save current question first
        const saved = this.saveQuestion();
        if (saved === false) {
            // console.log('Question validation failed, staying on current question');
            return;
        }
        
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.currentQuestionIndex++;
            // console.log(`Moving to question ${this.currentQuestionIndex + 1}`);
            this.showQuestionEditor();
        } else {
            // console.log('Already at last question');
            this.showNotification('Already at last question', 'info');
        }
    }
    
    deleteQuestion() {
        if (confirm('Delete this question?')) {
            this.currentQuiz.questions.splice(this.currentQuestionIndex, 1);
            
            // If we now have less than 10 questions, add a blank one
            if (this.currentQuiz.questions.length < 10) {
                const blankQuestion = {
                    text: "",
                    answers: ["", "", "", ""],
                    correct: 0
                };
                this.currentQuiz.questions.push(blankQuestion);
                // Navigate to the new blank question
                this.currentQuestionIndex = this.currentQuiz.questions.length - 1;
            } else if (this.currentQuestionIndex >= this.currentQuiz.questions.length) {
                this.currentQuestionIndex = this.currentQuiz.questions.length - 1;
            }
            
            this.showQuestionEditor();
        }
    }
    
    saveAllQuestions() {
        // console.log(`💾 Saving all questions...`);
        
        // Save current question first
        const saved = this.saveQuestion();
        if (saved === false) {
            // console.log('Current question validation failed');
            return;
        }
        
        // Validate entire quiz
        try {
            this.validateQuiz();
        } catch (error) {
            this.showNotification(`Quiz validation failed: ${error.message}`, 'error');
            return;
        }
        
        // Save to server or local storage
        this.showLoadingModal('Saving quiz...');
        
        // Auto-hide modal after 5 seconds no matter what
        const modalTimeout = setTimeout(() => {
            console.log('⏰ 5-second timeout reached, hiding modal...');
            this.hideModal();
        }, 5000);
        
        setTimeout(async () => {
            try {
                // Prepare save data
                const saveData = {
                    quiz: this.currentQuiz,
                    metadata: {
                        userId: this.context.userId,
                        userName: this.context.userName,
                        savedAt: new Date().toISOString(),
                        version: '1.0'
                    }
                };
                
                // Save to localStorage
                const key = `quiz_${this.context.courseId}`;
                localStorage.setItem(key, JSON.stringify(saveData));
                
                // Save to server
                const serverSaved = await this.saveQuizToServer(saveData);
                
                if (!serverSaved) {
                    // Warn user that only local save succeeded
                    this.showNotification('Quiz saved locally only (server unavailable)', 'warning');
                }
                
                this.hideModal();
                this.showNotification('✅ All questions saved successfully!', 'success');
                
            } catch (error) {
                // console.error('❌ Save error:', error);
                this.hideModal();
                this.showNotification(`Save failed: ${error.message}`, 'error');
            }
        }, 1000);
    }
    
    validateQuiz() {
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            throw new Error('No quiz data');
        }
        
        if (this.currentQuiz.questions.length === 0) {
            throw new Error('Quiz has no questions');
        }
        
        // Validate each question
        this.currentQuiz.questions.forEach((q, index) => {
            if (!q.text || !q.text.trim()) {
                throw new Error(`Question ${index + 1} has no text`);
            }
            
            const nonEmptyAnswers = q.answers.filter(a => a && a.trim()).length;
            if (nonEmptyAnswers < 2) {
                throw new Error(`Question ${index + 1} needs at least 2 answers`);
            }
            
            if (q.correct === undefined || q.correct === null) {
                throw new Error(`Question ${index + 1} has no correct answer selected`);
            }
            
            if (!q.answers[q.correct] || !q.answers[q.correct].trim()) {
                throw new Error(`Question ${index + 1}: correct answer is empty`);
            }
        });
        
        return true;
    }
    
    selectCorrectAnswer(index) {
        // console.log(`🎯 selectCorrectAnswer called with index: ${index}`);
        // console.log(`Current question index: ${this.currentQuestionIndex}`);
        // console.log(`Total questions: ${this.currentQuiz.questions.length}`);
        
        // Direct call now that we're using event delegation
        this._doSelectCorrectAnswer(index);
    }
    
    setupEventDelegation() {
        // Use event delegation on the document body for answer buttons
        document.body.addEventListener('click', (event) => {
            // Check if clicked element or its parent is a mark-correct-btn
            const button = event.target.closest('.mark-correct-btn');
            if (button) {
                event.preventDefault();
                event.stopPropagation();
                
                const index = parseInt(button.dataset.answerIndex);
                // console.log(`🎯 Event delegation: Clicked answer ${index}`);
                
                if (!isNaN(index)) {
                    this.selectCorrectAnswer(index);
                } else {
                    // console.error('❌ Invalid answer index from data attribute');
                }
            }
        });
        
        // console.log('✅ Event delegation set up for answer selection');
    }
    
    _doSelectCorrectAnswer(index) {
        try {
            // Check if we have the current quiz and question
            if (!this.currentQuiz || !this.currentQuiz.questions || !this.currentQuiz.questions[this.currentQuestionIndex]) {
                // console.error('❌ No current quiz or question found!');
                // console.log('Current quiz:', this.currentQuiz);
                return;
            }
            
            // Update visual selection
            const buttons = document.querySelectorAll('.mark-correct-btn');
            // console.log(`Found ${buttons.length} answer buttons`);
            
            if (buttons.length === 0) {
                // console.error('❌ No answer buttons found in DOM!');
                // Try one more time after a longer delay
                setTimeout(() => {
                    // console.log('🔄 Retrying selection...');
                    const retryButtons = document.querySelectorAll('.mark-correct-btn');
                    if (retryButtons.length > 0) {
                        this._doSelectCorrectAnswer(index);
                    }
                }, 200);
                return;
            }
            
            if (index >= buttons.length) {
                // console.error(`❌ Index ${index} is out of bounds! Only ${buttons.length} buttons exist.`);
                return;
            }
            
            buttons.forEach((btn, i) => {
                if (i === index) {
                    // console.log(`✅ Setting button ${i} as selected`);
                    btn.classList.add('selected');
                    btn.innerHTML = '<img src="icons/heartCheck.svg" class="icon-check" alt="Correct">';
                } else {
                    btn.classList.remove('selected');
                    btn.textContent = '○';
                }
            });
            
            // Update row highlighting
            const rows = document.querySelectorAll('.answer-editor-row');
            // console.log(`Found ${rows.length} answer rows`);
            rows.forEach((row, i) => {
                if (i === index) {
                    row.classList.add('correct-answer');
                } else {
                    row.classList.remove('correct-answer');
                }
            });
            
            // Update the question data
            const oldCorrect = this.currentQuiz.questions[this.currentQuestionIndex].correct;
            this.currentQuiz.questions[this.currentQuestionIndex].correct = index;
            // console.log(`✅ Updated correct answer from ${oldCorrect} to ${index}`);
            
        } catch (error) {
            // console.error('❌ Error in selectCorrectAnswer:', error);
            // console.error('Stack trace:', error.stack);
        }
    }
    
    updateAnswer(index, value) {
        this.currentQuiz.questions[this.currentQuestionIndex].answers[index] = value;
    }
    
    closeEditor() {
        this.hideModal();
        const questionCountEl = document.getElementById('question-count');
        if (questionCountEl) {
            questionCountEl.textContent = this.currentQuiz.questions.length;
        }
    }
    
    // Function to find quiz for learner
    async findQuizForLearner() {
        try {
            console.log('🔍 Finding available quizzes for learner...');
            
            // If we have a courseId from URL, use it
            let courseIdToUse = this.context.courseId;
            
            // If no courseId, fetch learner's enrollments using admin API
            if (!courseIdToUse && this.context.userId) {
                console.log('📚 No courseId provided, fetching learner enrollments...');
                const enrollments = await this.fetchLearnerEnrollments();
                if (enrollments && enrollments.length > 0) {
                    if (enrollments.length === 1) {
                        // Single enrollment - use it directly
                        courseIdToUse = enrollments[0].courseId;
                        this.context.courseId = courseIdToUse;
                        this.context.courseName = enrollments[0].courseName || 'Course';
                        console.log(`📖 Found single enrollment: ${this.context.courseName} (${courseIdToUse})`);
                    } else {
                        console.log(`🎯 Multiple enrollments found (${enrollments.length}), checking for saved preference...`);
                        // Multiple enrollments - check for saved preference first
                        const savedCourse = localStorage.getItem('lastSelectedCourse');
                        if (savedCourse && enrollments.find(e => e.courseId === savedCourse)) {
                            courseIdToUse = savedCourse;
                            const savedEnrollment = enrollments.find(e => e.courseId === savedCourse);
                            this.context.courseId = courseIdToUse;
                            this.context.courseName = savedEnrollment.courseName || 'Course';
                            console.log(`📖 Using saved course preference: ${this.context.courseName} (${courseIdToUse})`);
                        } else {
                            // No saved preference or invalid - let user choose
                            console.log('🎨 Showing course selection modal...');
                            courseIdToUse = await this.showCourseSelectionModal(enrollments);
                            console.log('📝 User selected:', courseIdToUse);
                            if (!courseIdToUse) {
                                // User cancelled - show fun quiz
                                this.quizType = 'fun';
                                await this.generateFunQuiz();
                                return 'fun';
                            }
                            // Save the selection
                            localStorage.setItem('lastSelectedCourse', courseIdToUse);
                        }
                    }
                }
            }
            
            // If we have a courseId now, check for quiz
            if (courseIdToUse) {
                // First check if they already aced this quiz
                const perfectScore = await this.checkForPerfectScore();
                if (perfectScore) {
                    console.log('🏆 Learner already passed this quiz!');
                    
                    // Check if there are other incomplete quizzes
                    const allEnrollments = await this.fetchLearnerEnrollments();
                    if (allEnrollments && allEnrollments.length > 1) {
                        // Check each enrollment for completion
                        const incompleteQuizzes = [];
                        for (const enrollment of allEnrollments) {
                            if (enrollment.courseId !== this.context.courseId) {
                                // Check if this other course has been passed
                                const tempCourseId = this.context.courseId;
                                this.context.courseId = enrollment.courseId;
                                const otherScore = await this.checkForPerfectScore();
                                this.context.courseId = tempCourseId;
                                
                                if (!otherScore) {
                                    incompleteQuizzes.push(enrollment);
                                }
                            }
                        }
                        
                        if (incompleteQuizzes.length > 0) {
                            console.log(`📚 Found ${incompleteQuizzes.length} more quiz(es) to complete`);
                            // Clear the saved preference to force selection modal
                            localStorage.removeItem('lastSelectedCourse');
                            // Show selection modal with remaining quizzes
                            courseIdToUse = await this.showCourseSelectionModal(allEnrollments);
                            if (courseIdToUse && courseIdToUse !== this.context.courseId) {
                                // User selected a different quiz, update context
                                this.context.courseId = courseIdToUse;
                                const selectedEnrollment = allEnrollments.find(e => e.courseId === courseIdToUse);
                                this.context.courseName = selectedEnrollment.courseName || 'Course';
                                localStorage.setItem('lastSelectedCourse', courseIdToUse);
                                // Continue to load the newly selected quiz
                            } else if (!courseIdToUse) {
                                // User chose fun quiz
                                this.showPerfectScoreMessage();
                                this.quizType = 'fun';
                                await this.generateFunQuiz();
                                return 'fun';
                            }
                        } else {
                            // All quizzes completed!
                            console.log('🎉 All assigned quizzes completed!');
                            this.showPerfectScoreMessage();
                            this.quizType = 'fun';
                            await this.generateFunQuiz();
                            return 'fun';
                        }
                    } else {
                        // Only one quiz assigned and it's completed
                        this.showPerfectScoreMessage();
                        this.quizType = 'fun';
                        await this.generateFunQuiz();
                        return 'fun';
                    }
                }
                
                const quiz = await this.loadQuizFromServer();
                if (quiz && quiz.quiz) {
                    console.log('✅ Found quiz for enrolled course');
                    this.currentQuiz = quiz.quiz;
                    this.quizType = 'enrolled';
                    
                    // Update course name from quiz data if available
                    if (this.currentQuiz.courseName) {
                        this.context.courseName = this.currentQuiz.courseName;
                        console.log('📚 Updated course name to:', this.context.courseName);
                    }
                    
                    // Show course announcement modal
                    console.log('🎯 About to show announcement for:', this.context.courseName);
                    this.showCourseAnnouncement();
                    
                    return 'enrolled';
                }
            }
            
            // No enrolled quiz found - will generate fun quiz
            console.log('🎉 No enrolled course quiz - generating fun quiz!');
            this.quizType = 'fun';
            await this.generateFunQuiz();
            return 'fun';
            
        } catch (error) {
            console.error('Error finding quiz:', error);
            this.quizType = 'fun';
            await this.generateFunQuiz();
            return 'fun';
        }
    }
    
    // Fetch learner's enrollments using admin API
    async fetchLearnerEnrollments() {
        try {
            // Ensure token is valid before API call
            await this.ensureValidToken();
            
            console.log('📋 Fetching enrollments for userId:', this.context.userId);
            console.log('🔑 Using admin token:', this.almApi.accessToken.substring(0, 10) + '...');
            
            const response = await fetch(
                `https://learningmanager.adobe.com/primeapi/v2/users/${this.context.userId}/enrollments?include=learningObject&page[limit]=10&filter.loTypes=course`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.almApi.accessToken}`,
                        'Accept': 'application/vnd.api+json'
                    }
                }
            );
            
            if (!response.ok) {
                console.error('Failed to fetch enrollments:', response.status);
                const errorText = await response.text();
                console.error('Error details:', errorText);
                return null;
            }
            
            const data = await response.json();
            const enrollments = [];
            
            if (data.data && Array.isArray(data.data)) {
                for (const enrollment of data.data) {
                    const loId = enrollment.relationships?.learningObject?.data?.id;
                    if (loId) {
                        // Find the course name from included data
                        let courseName = 'Course';
                        if (data.included) {
                            const course = data.included.find(item => item.id === loId);
                            if (course && course.attributes?.name) {
                                courseName = course.attributes.name;
                            }
                        }
                        
                        // Only add ENROLLED courses
                        const state = enrollment.attributes?.state;
                        if (state === 'ENROLLED') {
                            enrollments.push({
                                courseId: loId,
                                courseName: courseName,
                                enrollmentId: enrollment.id,
                                state: state
                            });
                        }
                    }
                }
            }
            
            console.log(`📚 Found ${enrollments.length} active enrollments`);
            return enrollments;
            
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            return null;
        }
    }
    
    // Check if learner has perfect score on this course
    async checkForPerfectScore() {
        try {
            const response = await fetch(`/alm-quiz/save-score.php?courseId=${encodeURIComponent(this.context.courseId)}`);
            if (!response.ok) return false;
            
            const scorebook = await response.json();
            if (!scorebook.scores) return false;
            
            // Check if this user has any passing scores (80% or higher)
            const userScores = scorebook.scores.filter(s => s.userId === this.context.userId);
            const hasPerfectScore = userScores.some(s => s.percentage >= 80);
            
            return hasPerfectScore;
        } catch (error) {
            console.error('Error checking scores:', error);
            return false;
        }
    }
    
    // Show message that they already aced the quiz
    showPerfectScoreMessage() {
        const modal = document.createElement('div');
        modal.className = 'announcement-modal';
        modal.innerHTML = `
            <div class="announcement-content">
                <img src="icons/stilletto.svg" class="announcement-icon rotating">
                <h2>YOU ALREADY ACED THIS QUIZ!</h2>
                <p>Enjoy some fun quizzes instead!</p>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 500);
        }, 3000);
    }
    
    // Show course selection modal for multiple enrollments
    async showCourseSelectionModal(enrollments) {
        // First, fetch scores for each enrollment to show progress
        const enrollmentsWithScores = await Promise.all(enrollments.map(async (enrollment) => {
            try {
                const response = await fetch(`/alm-quiz/save-score.php?courseId=${encodeURIComponent(enrollment.courseId)}`);
                if (response.ok) {
                    const scorebook = await response.json();
                    const userScores = scorebook.scores?.filter(s => s.userId === this.context.userId) || [];
                    const bestScore = userScores.length > 0 ? Math.max(...userScores.map(s => s.percentage)) : 0;
                    return { ...enrollment, bestScore };
                }
            } catch (error) {
                console.error('Error fetching score for', enrollment.courseId, error);
            }
            return { ...enrollment, bestScore: 0 };
        }));
        
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal quiz-modal course-selection-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
            `;
            modal.innerHTML = `
                <div class="modal-content" style="background: transparent; color: white; padding: 20px; max-width: 600px; max-height: 80vh; overflow-y: auto; border-radius: 0; position: relative;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: normal;">Quiz</h2>
                        <img src="icons-128/CloseX.svg" style="width: 24px; height: 24px; cursor: pointer;" class="close-btn" />
                    </div>
                    <div class="course-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        ${enrollmentsWithScores.map((enrollment, index) => {
                            const iconOptions = ['gear.svg', 'noodles.svg', 'robot.svg', 'guitar.svg', 'atomic.svg', 'sailboat.svg', 'coffee.svg', 'kiwi.svg'];
                            const icon = iconOptions[index % iconOptions.length];
                            const isCompleted = enrollment.bestScore >= 80;
                            
                            return `
                            <button class="course-card" data-courseid="${enrollment.courseId}" 
                                style="background: #2a2a2a; border: 2px solid #444; border-radius: 0; 
                                       padding: 30px; cursor: pointer; 
                                       transition: all 0.2s; position: relative; text-align: center;
                                       display: flex; flex-direction: column; align-items: center; justify-content: center;
                                       aspect-ratio: 1;">
                                <img src="icons-128/${icon}" style="width: 192px; height: 192px; margin-bottom: 10px;" title="${enrollment.courseName || 'Unnamed Course'}" />
                                ${isCompleted ? `
                                    <img src="icons-128/heartCheck.svg" style="position: absolute; top: 10px; right: 10px; 
                                                width: 24px; height: 24px;" />
                                ` : ''}
                            </button>
                        `}).join('')}
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="fun-quiz-btn" style="background: none; border: none; 
                                                           padding: 0; cursor: pointer;">
                            <img src="icons-128/spiralTight.svg" style="width: 96px; height: 96px; opacity: 0.7; transition: all 0.3s;" title="Crazy Quiz" />
                        </button>
                    </div>
                </div>
            `;
            
            // Add hover effects via JavaScript
            const cards = modal.querySelectorAll('.course-card');
            cards.forEach(card => {
                card.onmouseover = () => {
                    card.style.background = '#4a4a4a';
                    card.style.borderColor = '#888';
                    card.style.transform = 'scale(0.98)';
                };
                card.onmouseout = () => {
                    card.style.background = '#2a2a2a';
                    card.style.borderColor = '#444';
                    card.style.transform = 'scale(1)';
                };
                
                card.onclick = () => {
                    const courseId = card.dataset.courseid;
                    const course = enrollmentsWithScores.find(e => e.courseId === courseId);
                    this.context.courseId = courseId;
                    this.context.courseName = course.courseName;
                    modal.remove();
                    resolve(courseId);
                };
            });
            
            // Close button handler
            modal.querySelector('.close-btn').onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            // Fun quiz button handler
            const funBtn = modal.querySelector('.fun-quiz-btn img');
            funBtn.onmouseover = () => {
                funBtn.style.opacity = '1';
                funBtn.style.transform = 'rotate(180deg) scale(1.1)';
                funBtn.style.filter = 'drop-shadow(0 0 20px #0f0)';
            };
            funBtn.onmouseout = () => {
                funBtn.style.opacity = '0.5';
                funBtn.style.transform = 'rotate(0deg)';
            };
            modal.querySelector('.fun-quiz-btn').onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            document.body.appendChild(modal);
            console.log('📊 Modal appended to body:', modal);
            console.log('📏 Modal dimensions:', modal.offsetWidth, 'x', modal.offsetHeight);
            console.log('📍 Modal position:', window.getComputedStyle(modal).position);
            console.log('👁️ Modal display:', window.getComputedStyle(modal).display);
        });
    }
    
    // Generate fun quiz using AI
    async generateFunQuiz() {
        // console.log('🎆 Generating fun random quiz!');
        
        // Use the existing generate-quiz.php endpoint
        // It will create whimsical questions when no specific course content is provided
        const funPrompts = [
            // Original themes
            'Space Cats Academy',
            'Pizza Physics 101',
            'Zombie Survival Training',
            'Unicorn Economics',
            'Dragon Training School',
            'Time Travel Etiquette',
            'Alien Cooking Class',
            'Pirate Programming',
            'Robot Dance Academy',
            'Ninja Housekeeping 101',
            'Vampire Dentistry',
            'Mermaid Marketing',
            'Ghost Photography',
            'Wizard IT Support',
            'Dinosaur Fashion Design',
            'Superhero Tax Preparation',
            'Yeti Yoga Institute',
            'Cyborg Gardening',
            'Werewolf Customer Service',
            'Fairy Tale Law School',
            
            // Food & Culinary
            'Sushi Rolling for Robots',
            'Interdimensional Baking',
            'Taco Teleportation',
            'Molecular Gastronomy for Monsters',
            'Ice Cream Alchemy',
            'Sandwich Architecture',
            'Donut Dynamics',
            'Cheese Portal Physics',
            'Bubble Tea Biomechanics',
            'Cookie Cryptography',
            
            // Animals & Creatures
            'Penguin Personal Finance',
            'Octopus Orchestra',
            'Hamster Hotel Management',
            'Llama Life Coaching',
            'Platypus Philosophy',
            'Squirrel Stock Trading',
            'Flamingo Fashion Week',
            'Koala Conflict Resolution',
            'Giraffe Graphics Design',
            'Hedgehog Happiness Studies',
            
            // Fantasy & Mythology
            'Phoenix Retirement Planning',
            'Goblin Gift Wrapping',
            'Centaur Car Repair',
            'Kraken Customer Relations',
            'Sphinx Social Media',
            'Troll Toll Management',
            'Pegasus Pilot School',
            'Minotaur Maze Design',
            'Hydra Head Management',
            'Basilisk Beauty School',
            
            // Science & Technology
            'Quantum Knitting',
            'Black Hole Housekeeping',
            'Asteroid Agriculture',
            'Nebula Navigation',
            'Photon Photography',
            'Gravity Gymnastics',
            'Dark Matter Dating',
            'Wormhole Weather Forecasting',
            'Particle Party Planning',
            'String Theory Sewing',
            
            // Pop Culture Mashups
            'Jedi Janitorial Services',
            'Hobbit Home Improvement',
            'Pokémon Postal Service',
            'Muggle Management Consulting',
            'Transformer Traffic School',
            'Avenger Accounting',
            'Sith Sensitivity Training',
            'Ewok Engineering',
            'Vulcan Vacation Planning',
            'Klingon Kindergarten',
            
            // Everyday Life Twisted
            'Invisible Interior Design',
            'Telepathic Telephone Support',
            'Levitating Laundry',
            'Psychic Pet Grooming',
            'Dimensional Door Installation',
            'Time Loop Traffic School',
            'Antigravity Athletics',
            'Parallel Universe Plumbing',
            'Quantum Queue Management',
            'Telekinetic Typing',
            
            // Historical Hijinks
            'Caveman Cryptocurrency',
            'Medieval Meme Making',
            'Renaissance Robot Repair',
            'Victorian Vlogging',
            'Ancient Egyptian Email',
            'Roman Reality TV',
            'Aztec App Development',
            'Viking Virtual Reality',
            'Samurai Social Networking',
            'Gladiator Gaming',
            
            // Pop Culture & Entertainment
            'Oscar Night Ninja Training',
            'Grammy Award Gardening',
            'Super Bowl Sorcery',
            'Broadway Breakfast Club',
            'Hollywood Hair Styling for Aliens',
            'Netflix Navigation School',
            'TikTok Time Machine',
            'Spotify Space Station',
            'YouTube Yeti University',
            'Instagram for Invisible People',
            
            // Music & Musicians
            'Taylor Swift Spacecraft Design',
            'Beyoncé Beekeeping',
            'Drake Dragon Training',
            'Beatles Bug Biology',
            'Elvis Elevator Repair',
            'Madonna Mermaid School',
            'Kanye Koala Conservation',
            'Lady Gaga Galactic Tours',
            'Ed Sheeran Elf Economics',
            'Rihanna Robot Repair',
            
            // Movies & TV
            'Star Wars Sandwich Making',
            'Marvel Meal Planning',
            'Harry Potter HVAC Repair',
            'Game of Thrones Gardening',
            'Breaking Bad Baking',
            'Friends Furniture Assembly',
            'The Office Organization Skills',
            'Stranger Things Stress Management',
            'Disney Princess Data Science',
            'Pixar Plumbing Academy',
            
            // Sports & Athletes
            'LeBron\'s Llama Training',
            'Messi\'s Monster Management',
            'Serena\'s Submarine School',
            'Tiger\'s Time Travel Golf',
            'Ronaldo\'s Robot Soccer',
            'Olympics for Ogres',
            'World Cup Wizard Training',
            'NBA Ninja Basketball',
            'NFL Necromancy',
            'FIFA Fairy Football',
            
            // Internet & Social Media
            'Meme Magic University',
            'Viral Video Veterinary',
            'Influencer Ice Sculpture',
            'Hashtag Helicopter School',
            'Emoji Engineering',
            'GIF Geology',
            'Podcast Portal Physics',
            'Blog Bioluminescence',
            'Vlog Volcano Studies',
            'Tweet Teleportation'
        ];
        
        // Better randomization - use timestamp to ensure variety
        const seed = new Date().getSeconds() + new Date().getMinutes();
        const randomIndex = seed % funPrompts.length;
        const randomCourse = funPrompts[randomIndex];
        
        try {
            // console.log('🚀 Calling generate-quiz.php for:', randomCourse);
            
            // Add timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('/alm-quiz/generate-quiz.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `Generate a fun quiz about ${randomCourse} with EXACTLY 10 questions. 

IMPORTANT REQUIREMENTS:
- Make questions directly related to the theme (${randomCourse})
- The correct answer should be clearly the most logical choice
- Wrong answers should be obviously silly or nonsensical
- Keep questions fun but ensure there's a clear right answer
- Each question must have exactly 4 answer options
- Make it whimsical and entertaining!

Example: For 'Space Cats Academy', ask about cat astronaut training, zero-gravity litter boxes, or moon mouse hunting techniques.`
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            // console.log('📡 Response status:', response.status);
            const result = await response.json();
            // console.log('📡 Quiz result:', result);
            
            if (result.success && result.questions) {
                // Convert API format to our format
                const formattedQuestions = result.questions.map(q => {
                    // Handle all possible formats from the API
                    let correctIndex = q.correct;
                    
                    // If correctAnswer is a string, find its index
                    if (q.correctAnswer && typeof q.correctAnswer === 'string') {
                        correctIndex = (q.answers || q.options || []).indexOf(q.correctAnswer);
                    } else if (q.answer !== undefined) {
                        correctIndex = q.answer;
                    }
                    
                    return {
                        text: q.question || q.text,
                        answers: q.options || q.answers || [],
                        correct: correctIndex
                    };
                });
                
                this.currentQuiz = {
                    courseId: 'fun_' + Date.now(),
                    courseName: randomCourse,
                    questions: formattedQuestions,
                    isFunQuiz: true,
                    funIcon: 'mutantSpiral'
                };
            }
        } catch (error) {
            // console.error('❌ Failed to generate fun quiz:', error);
            // console.error('Error details:', error.message, error.stack);
            
            // For now, generate a fun topic quiz locally
            this.currentQuiz = {
                courseId: 'fun_' + Date.now(),
                courseName: '🎉 ' + randomCourse,
                questions: [],
                isFunQuiz: true
            };
        }
    }
    
    // QUIZ TAKING FUNCTIONS
    async startQuiz() {
        // Always load fresh quiz
        await this.loadQuizForTaking();
        
        if (!this.currentQuiz || !this.currentQuiz.questions.length) {
            this.showNotification('No quiz available!', 'error');
            return;
        }
        
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.hearts = 5;
        this.answers = [];
        
        this.showQuestion();
    }
    
    async loadQuizForTaking() {
        // If we already have a quiz loaded (from findQuizForLearner), use it!
        if (this.currentQuiz && this.currentQuiz.questions && this.currentQuiz.questions.length > 0) {
            // console.log('📚 Using already loaded quiz');
            return;
        }
        
        // First, always try to load quiz from localStorage
        const quizKey = `kawaii_quiz_${this.context.courseId}`;
        const savedQuiz = localStorage.getItem(quizKey);
        
        if (savedQuiz) {
            // Found a saved quiz for this course!
            const quizData = JSON.parse(savedQuiz);
            this.currentQuiz = {
                questions: quizData.questions
            };
            // console.log('📚 Loaded saved quiz for course:', this.context.courseName);
        } else if (!this.context.courseId || this.context.courseId === 'unknown' || this.context.courseName === 'Course') {
            // No course ID or generic course name - generate a fun random quiz!
            // console.log('🎲 No course found, generating random topic quiz');
            this.currentQuiz = {
                questions: this.generateRandomTopicQuiz()
            };
        } else {
            // We have a course but no saved quiz - generate AI questions!
            // console.log('🤖 No saved quiz found, generating AI questions for:', this.context.courseName);
            
            // Show loading state
            document.getElementById('app').innerHTML = `
                <div class="quiz-container">
                    <div class="loading-card">
                        <div class="spinner"></div>
                        <h2>Creating your personalized quiz...</h2>
                        <p>Using AI to generate questions based on ${this.context.courseName}</p>
                    </div>
                </div>
            `;
            
            // Fetch course details and generate AI quiz
            await this.fetchCourseDetails();
            const prompt = this.buildQuizPrompt();
            
            try {
                const response = await fetch('/alm-quiz/generate-quiz.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                
                const result = await response.json();
                
                if (result.success && result.questions) {
                    console.log('✅ AI generated quiz for learner:', result.questions);
        console.log('📊 Number of questions generated:', result.questions.length);
                    // Convert API format to our format
                    const formattedQuestions = result.questions.map(q => {
                        // Handle all possible formats from the API
                        let correctIndex = q.correct;
                        
                        // If correctAnswer is a string, find its index
                        if (q.correctAnswer && typeof q.correctAnswer === 'string') {
                            correctIndex = (q.answers || q.options || []).indexOf(q.correctAnswer);
                        } else if (q.answer !== undefined) {
                            correctIndex = q.answer;
                        }
                        
                        return {
                            text: q.question || q.text,
                            answers: q.options || q.answers || [],
                            correct: correctIndex
                        };
                    });
                    
                    this.currentQuiz = {
                        questions: formattedQuestions
                    };
                    
                    // Save it for next time
                    localStorage.setItem(quizKey, JSON.stringify(this.currentQuiz));
                } else {
                    throw new Error('AI generation failed');
                }
            } catch (error) {
                console.error('AI generation failed:', error);
                this.showErrorState('Failed to generate quiz. Please refresh and try again.');
                return;
            }
            
            // Continue to show the first question
            // The quiz is now loaded in this.currentQuiz
        }
    }
    
    generateRandomTopicQuiz() {
        // Fun topics appropriate for ages 15-50
        const topics = [
            { name: "Space & Astronomy", emoji: "🚀" },
            { name: "Ocean Life", emoji: "🐙" },
            { name: "Technology Trends", emoji: "💻" },
            { name: "World Geography", emoji: "🌍" },
            { name: "Music History", emoji: "🎵" },
            { name: "Food Science", emoji: "🧪" },
            { name: "Sports & Games", emoji: "⚽" },
            { name: "Art & Design", emoji: "🎨" }
        ];
        
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        // Update the context to show the random topic
        this.context.courseName = `${randomTopic.emoji} ${randomTopic.name} Challenge`;
        
        // Generate topic-specific questions
        return this.generateTopicQuestions(randomTopic.name);
    }
    
    generateTopicQuestions(topic) {
        const questionSets = {
            "Space & Astronomy": [
                {
                    text: "Which planet is known as the 'Red Planet'?",
                    answers: ["Venus", "Mars", "Jupiter", "Mercury"],
                    correct: 1
                },
                {
                    text: "How many moons does Earth have?",
                    answers: ["None", "One", "Two", "Three"],
                    correct: 1
                },
                {
                    text: "What is the largest planet in our solar system?",
                    answers: ["Saturn", "Neptune", "Jupiter", "Uranus"],
                    correct: 2
                },
                {
                    text: "What causes a solar eclipse?",
                    answers: ["Earth blocks the Sun", "Moon blocks the Sun", "Sun turns off", "Clouds block the Sun"],
                    correct: 1
                },
                {
                    text: "Which was the first human-made object to leave our solar system?",
                    answers: ["Voyager 1", "Apollo 11", "Hubble Telescope", "International Space Station"],
                    correct: 0
                }
            ],
            "Ocean Life": [
                {
                    text: "What is the largest animal ever known to exist?",
                    answers: ["Great White Shark", "Giant Squid", "Blue Whale", "Megalodon"],
                    correct: 2
                },
                {
                    text: "How much of Earth's surface is covered by oceans?",
                    answers: ["50%", "60%", "71%", "85%"],
                    correct: 2
                },
                {
                    text: "Which sea creature has three hearts?",
                    answers: ["Dolphin", "Octopus", "Shark", "Jellyfish"],
                    correct: 1
                },
                {
                    text: "What is the deepest part of the ocean called?",
                    answers: ["Mariana Trench", "Atlantic Ridge", "Pacific Basin", "Bermuda Triangle"],
                    correct: 0
                },
                {
                    text: "Which ocean animal can change color to camouflage?",
                    answers: ["Whale", "Dolphin", "Octopus", "Tuna"],
                    correct: 2
                }
            ],
            "Technology Trends": [
                {
                    text: "What does 'AI' stand for?",
                    answers: ["Automated Internet", "Artificial Intelligence", "Advanced Integration", "Apple iPhone"],
                    correct: 1
                },
                {
                    text: "Which company created ChatGPT?",
                    answers: ["Google", "Microsoft", "OpenAI", "Meta"],
                    correct: 2
                },
                {
                    text: "What is the 'cloud' in cloud computing?",
                    answers: ["Weather system", "Remote servers", "Soft pillows", "Sky storage"],
                    correct: 1
                },
                {
                    text: "What does 'VR' stand for?",
                    answers: ["Very Radical", "Virtual Reality", "Video Recording", "Visual Range"],
                    correct: 1
                },
                {
                    text: "Which was the first popular web browser?",
                    answers: ["Chrome", "Safari", "Netscape", "Internet Explorer"],
                    correct: 2
                }
            ]
        };
        
        // If we have questions for this topic, use them
        if (questionSets[topic]) {
            // Add 5 more generic questions to make 10
            const topicQuestions = questionSets[topic];
            const genericQuestions = [
                {
                    text: "What's the best way to learn something new?",
                    answers: ["Never try", "Practice regularly", "Read once", "Avoid challenges"],
                    correct: 1
                },
                {
                    text: "How many hours of sleep do adults typically need?",
                    answers: ["3-4 hours", "5-6 hours", "7-9 hours", "12+ hours"],
                    correct: 2
                },
                {
                    text: "What's the most spoken language in the world?",
                    answers: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
                    correct: 2
                },
                {
                    text: "Which vitamin do we get from sunlight?",
                    answers: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin E"],
                    correct: 2
                },
                {
                    text: "What percentage of Earth is water?",
                    answers: ["50%", "60%", "71%", "90%"],
                    correct: 2
                }
            ];
            
            return [...topicQuestions, ...genericQuestions];
        }
        
        // If we get here, something went wrong
        console.error('Failed to generate random topic quiz');
        return [];
    }
    
    showQuestion() {
        console.log('📝 showQuestion called for question:', this.currentQuestionIndex + 1);
        console.log('🎯 Quiz data:', this.currentQuiz);
        
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const questionNum = this.currentQuestionIndex + 1;
        const totalQuestions = this.currentQuiz.questions.length;
        
        // Reset state for new question
        this.selectedAnswer = null;
        this.hasSubmitted = false;
        
        // Show question after brief delay
        setTimeout(() => {
            document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="quiz-status" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: transparent;">
                    <div class="hearts" style="white-space: nowrap;">
                        ${this.renderHearts(40)}
                    </div>
                    <div class="score" style="display: flex; align-items: center; gap: 10px;">
                        ${this.renderScoreDice()}
                    </div>
                </div>
                
                <div class="question-modal">
                    <div class="mascot-container">
                        <div class="mascot mascot-thinking">🤖</div>
                    </div>
                    
                    <div class="question-content">
                        <h2>${question.text}</h2>
                        
                        <div class="answer-options" id="answer-options">
                            ${question.answers.map((answer, i) => `
                                <button class="answer-btn" id="answer-${i}" onclick="quiz.selectAnswer(${i})">
                                    ${answer}
                                </button>
                            `).join('')}
                        </div>
                        
                        <div style="text-align: center; margin-top: 40px;">
                            <img id="submit-btn" src="icons/save.svg" onclick="quiz.submitAnswer()" style="width: 60px; height: 60px; cursor: pointer; opacity: 0.3; transition: all 0.3s ease;">
                        </div>
                    </div>
                </div>
            </div>
        `;
        }, 800); // Wait for plinko animation to start
    }
    
    renderHearts(size = 80) {
        let hearts = '';
        const maxHearts = 5; // 5 hearts total
        const brokenHearts = maxHearts - this.hearts; // How many broken hearts to show
        
        for (let i = 0; i < maxHearts; i++) {
            if (i < this.hearts) {
                // Regular heart for remaining lives
                hearts += `<img src="icons/heart.svg" style="width: ${size}px; height: ${size}px; margin: 0; vertical-align: middle;">`;
            } else if (i < this.hearts + brokenHearts) {
                // Broken heart for lost lives
                hearts += `<img src="icons/brokenHeart.svg" style="width: ${size}px; height: ${size}px; margin: 0; vertical-align: middle; opacity: 0.8;">`;
            }
        }
        return hearts;
    }
    
    getScoreIcon(size = 80) {
        // For correct answer feedback, show "ten" icon for +10 points
        return `<img src="icons/ten.svg" style="width: ${size}px; height: ${size}px; filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.8)); animation: pulse-score 2s infinite;">`;
    }
    
    renderScoreDice() {
        // Show score using number icons
        const scoreStr = this.score.toString();
        let scoreDisplay = '';
        
        // Map digits to number words
        const numberWords = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        
        // Display each digit as an icon
        for (let digit of scoreStr) {
            const num = parseInt(digit);
            if (num === 0) {
                // Use a special icon for zero or just skip
                scoreDisplay += `<img src="icons/cowSkull.svg" style="width: 50px; height: 50px; opacity: 0.5; margin: 0 2px;">`;
            } else {
                scoreDisplay += `<img src="icons/${numberWords[num]}.svg" style="width: 50px; height: 50px; margin: 0 2px; filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.5));">`;
            }
        }
        
        // If score is 10 or more, we might want to use the ten.svg
        if (this.score === 10) {
            scoreDisplay = `<img src="icons/ten.svg" style="width: 60px; height: 60px; filter: drop-shadow(0 0 15px rgba(76, 175, 80, 0.8));">`;
        } else if (this.score > 10) {
            // For scores above 10, just show the number digits
            scoreDisplay = '';
            for (let digit of scoreStr) {
                const num = parseInt(digit);
                if (num === 0) {
                    scoreDisplay += `<img src="icons/cowSkull.svg" style="width: 50px; height: 50px; opacity: 0.5; margin: 0 2px;">`;
                } else {
                    scoreDisplay += `<img src="icons/${numberWords[num]}.svg" style="width: 50px; height: 50px; margin: 0 2px; filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.5));">`;
                }
            }
        }
        
        return scoreDisplay;
    }
    
    startMysteryIconAnimation() {
        const icons = [
            'alien.svg', 'apple.svg', 'atomic.svg', 'axe.svg', 'banjo.svg',
            'baoBun.svg', 'barn.svg', 'beachBall.svg', 'burger.svg', 'coffee.svg',
            'cowSkull.svg', 'deadToast.svg', 'gear.svg', 'guitar.svg', 'handcuffs.svg',
            'horseshoe.svg', 'hotAirBaloon.svg', 'kiwi.svg', 'lightbulb.svg',
            'mutantSpiral.svg', 'noodles.svg', 'robot.svg', 'sailboat.svg', 'splat.svg',
            'stilletto.svg', 'strawberry.svg', 'swissCheese.svg', 'tank.svg', 'virus.svg'
        ];
        
        const container = document.getElementById('mystery-icon-container');
        if (!container) return;
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Create 3 slots for side-by-side icons
        const slots = [];
        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                position: relative;
                width: 120px;
                height: 120px;
                display: inline-block;
                margin: 0;
                vertical-align: middle;
            `;
            container.appendChild(slot);
            slots.push(slot);
        }
        
        // Function to animate a single slot
        const animateSlot = (slot, slotIndex, delay = 0) => {
            let cycleCount = 0;
            const maxCycles = 3 + Math.floor(Math.random() * 2); // 3-4 cycles before lock
            
            setTimeout(() => {
                const cycleIcon = () => {
                    // Pick random icon
                    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
                    
                    const img = document.createElement('img');
                    img.src = `icons/${randomIcon}`;
                    img.style.cssText = `
                        width: 120px;
                        height: 120px;
                        filter: blur(2px) drop-shadow(0 0 10px rgba(255,255,255,0.3));
                        opacity: 0;
                        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        position: absolute;
                        top: 0;
                        left: 0;
                    `;
                    
                    // Clear previous icon
                    slot.innerHTML = '';
                    slot.appendChild(img);
                    
                    // Fade in with unblur
                    setTimeout(() => {
                        img.style.opacity = '1';
                        img.style.filter = 'blur(0px) drop-shadow(0 0 10px rgba(255,255,255,0.3))';
                    }, 50);
                    
                    cycleCount++;
                    
                    if (cycleCount < maxCycles) {
                        // Continue cycling
                        const holdDuration = 800 + Math.random() * 400; // Faster cycling
                        
                        setTimeout(() => {
                            // Fade out with blur
                            img.style.opacity = '0';
                            img.style.filter = 'blur(3px)';
                            
                            // Schedule next cycle
                            setTimeout(() => {
                                cycleIcon();
                            }, 300);
                        }, holdDuration);
                    } else {
                        // Final lock-in
                        setTimeout(() => {
                            img.style.filter = 'blur(0px) drop-shadow(0 0 15px rgba(255,255,255,0.5))';
                            // Store the slot element for strobe effect
                            slot.finalIcon = img;
                        }, 500);
                    }
                };
                
                // Start cycling for this slot
                cycleIcon();
            }, delay);
        };
        
        // Start all three slots with different delays for variety
        animateSlot(slots[0], 0, 0);
        animateSlot(slots[1], 1, 800);
        animateSlot(slots[2], 2, 1600);
        
        // After all icons lock (about 5.5 seconds), run strobe effect
        setTimeout(() => {
            // Just flash the icons in sequence without visible overlay
            slots.forEach((slot, index) => {
                setTimeout(() => {
                    if (slot.finalIcon) {
                        // Quick bright flash
                        slot.finalIcon.style.transition = 'all 0.1s ease-out';
                        slot.finalIcon.style.filter = 'brightness(3) contrast(1.5) drop-shadow(0 0 40px rgba(255,255,255,1))';
                        
                        // Then settle to final state
                        setTimeout(() => {
                            slot.finalIcon.style.transition = 'all 0.5s ease-in';
                            slot.finalIcon.style.filter = 'brightness(1) drop-shadow(0 0 15px rgba(255,255,255,0.5))';
                            slot.finalIcon.style.animation = 'subtlePulse 2s ease-in-out infinite';
                        }, 150);
                    }
                }, index * 200); // Sequential flash
            });
        }, 5500);
    }
    
    
    selectAnswer(answerIndex) {
        if (this.hasSubmitted) return; // Prevent selection after submission
        
        // Clear previous selection
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Mark new selection
        this.selectedAnswer = answerIndex;
        document.getElementById(`answer-${answerIndex}`).classList.add('selected');
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.style.opacity = '1';
        submitBtn.style.animation = 'pulseGreen 2s ease-in-out infinite';
    }
    
    submitAnswer() {
        if (this.selectedAnswer === null || this.hasSubmitted) return;
        
        this.hasSubmitted = true;
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correct;
        
        // Disable all answer buttons and show feedback
        document.querySelectorAll('.answer-btn').forEach((btn, i) => {
            btn.onclick = null;
            btn.disabled = true;
            
            // Reset button styles first
            btn.classList.remove('selected');
            
            // Always show the correct answer in green
            if (i === question.correct) {
                // Force override all possible background properties
                btn.style.setProperty('background-color', '#4CAF50', 'important');
                btn.style.setProperty('background', '#4CAF50', 'important');
                btn.style.setProperty('background-image', 'none', 'important');
                btn.style.setProperty('border-color', '#4CAF50', 'important');
                btn.style.setProperty('border-width', '3px', 'important');
                btn.style.setProperty('color', '#ffffff', 'important');
                btn.style.setProperty('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)', 'important');
                btn.style.setProperty('box-shadow', 'inset 0 0 0 1000px #4CAF50, 0 0 20px rgba(76, 175, 80, 0.8)', 'important');
                
                // Add class for additional styling
                btn.classList.add('correct-answer-highlight');
                
                // Add jiggle animation if user was wrong
                if (!isCorrect) {
                    btn.style.animation = 'jiggle 0.5s ease-in-out 3';
                }
            }
            // If user selected wrong answer, make it red
            else if (i === this.selectedAnswer && !isCorrect) {
                // Force override all possible background properties
                btn.style.setProperty('background-color', '#ff3333', 'important');
                btn.style.setProperty('background', '#ff3333', 'important');
                btn.style.setProperty('background-image', 'none', 'important');
                btn.style.setProperty('border-color', '#ff3333', 'important');
                btn.style.setProperty('border-width', '3px', 'important');
                btn.style.setProperty('color', '#ffffff', 'important');
                btn.style.setProperty('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)', 'important');
                btn.style.setProperty('box-shadow', 'inset 0 0 0 1000px #ff3333, 0 0 20px rgba(255, 51, 51, 0.8)', 'important');
                
                // Add class for additional styling
                btn.classList.add('wrong-answer-highlight');
            }
        });
        
        // Update submit button
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.style.opacity = '0.3';
        submitBtn.style.animation = 'none';
        submitBtn.onclick = null;
        
        // Store answer
        this.answers.push({
            questionIndex: this.currentQuestionIndex,
            selectedAnswer: this.selectedAnswer,
            isCorrect: isCorrect
        });
        
        // Update score and hearts
        if (isCorrect) {
            this.score += 1;
        } else {
            this.hearts = Math.max(0, this.hearts - 1);
        }
        
        // Show feedback after a longer delay to let them see the correct answer
        setTimeout(() => {
            this.showAnswerFeedback(isCorrect);
        }, isCorrect ? 1500 : 2500); // Longer delay for wrong answers
    }
    
    showAnswerFeedback(isCorrect) {
        // Create floating icon overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            pointer-events: none;
        `;
        
        if (isCorrect) {
            // Use checkmark icon for correct
            overlay.innerHTML = `
                <img src="icons/heartCheck.svg" style="
                    width: 150px; 
                    height: 150px; 
                    filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8));
                    animation: bounceIn 0.6s ease-out;
                ">
            `;
        } else {
            // Use broken heart for incorrect
            overlay.innerHTML = `
                <img src="icons/brokenHeart.svg" style="
                    width: 150px; 
                    height: 150px; 
                    filter: drop-shadow(0 0 40px rgba(255, 51, 51, 0.8));
                    animation: shakeIn 0.6s ease-out;
                ">
            `;
        }
        
        document.body.appendChild(overlay);
        
        // Remove overlay and advance after delay
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                overlay.remove();
                this.nextQuizQuestion();
            }, 300);
        }, isCorrect ? 1500 : 2000); // Slightly longer for incorrect to study the answer
    }
    
    nextQuizQuestion() {
        console.log('🔄 nextQuizQuestion called');
        console.log('📍 Current question index:', this.currentQuestionIndex);
        console.log('📋 Total questions:', this.currentQuiz?.questions?.length || 0);
        
        this.hideModal();
        
        // Check if game over (no hearts left)
        if (this.hearts === 0) {
            console.log('💔 Game over - no hearts left');
            this.showGameOver();
            return;
        }
        
        // Check if quiz complete
        if (this.currentQuestionIndex >= this.currentQuiz.questions.length - 1) {
            console.log('🏁 Quiz complete - showing results');
            this.showResults();
            return;
        }
        
        this.currentQuestionIndex++;
        console.log('➡️ Advanced to question:', this.currentQuestionIndex + 1);
        this.showQuestion();
    }
    
    showGameOver() {
        // Same visual treatment as regular results
        this.showResults();
    }
    
    showResults() {
        // Save score if this is an enrolled quiz
        if (this.quizType === 'enrolled' && this.context.courseId) {
            console.log('📊 Saving score for enrolled quiz...');
            this.saveScoreToServer();
        }
        
        // Start the mystery icon animation
        setTimeout(() => {
            this.startMysteryIconAnimation();
        }, 100);
        
        document.getElementById('app').innerHTML = `
            <div class="quiz-container">
                <div class="results-screen" style="background: #1a1a1a; border-radius: 20px; padding: 40px; text-align: center;">
                    <!-- Mystery icons container -->
                    <div id="mystery-icon-container" style="height: 120px; margin-bottom: 40px; display: flex; justify-content: center; align-items: center; gap: 0;"></div>
                    
                    <!-- Score display with wiggly number icon -->
                    <div id="score-display" style="margin: 40px 0; display: flex; justify-content: center; height: 120px; align-items: center;">
                        <!-- Score will be animated here -->
                    </div>
                    
                    <!-- Hearts display -->
                    <div style="margin: 40px 0; display: flex; justify-content: center;">
                        ${this.renderFinalHearts()}
                    </div>
                    
                    <!-- Play again button -->
                    <div style="margin-top: 40px;">
                        <img src="icons/spiralTight.svg" onclick="quiz.retryQuiz()" style="width: 80px; height: 80px; cursor: pointer; filter: drop-shadow(0 0 20px rgba(255,255,255,0.5)); transition: all 0.3s ease; animation: spin 4s linear infinite;" onmouseover="this.style.animationDuration='1s'; this.style.filter='drop-shadow(0 0 30px rgba(255,255,255,0.8))';" onmouseout="this.style.animationDuration='4s'; this.style.filter='drop-shadow(0 0 20px rgba(255,255,255,0.5))';">
                    </div>
                </div>
            </div>
        `;
        
        // Animate the score counting up
        this.animateScoreCount();
    }
    
    animateScoreCount() {
        const scoreDisplay = document.getElementById('score-display');
        if (!scoreDisplay) return;
        
        const numberWords = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        let currentCount = 0;
        const finalScore = this.score;
        
        const countUp = () => {
            currentCount++;
            
            // Clear previous
            scoreDisplay.innerHTML = '';
            
            // Get the icon for current number
            let iconHtml = '';
            // Check if this is the final number
            const isFinal = currentCount === finalScore;
            const baseStyle = isFinal ? 
                'opacity: 0; animation: flashIn 0.3s ease-out forwards, wiggle 2s ease-in-out infinite 0.5s;' :
                'opacity: 0; animation: flashIn 0.3s ease-out forwards;';
            
            if (currentCount === 0) {
                iconHtml = `<img src="icons/cowSkull.svg" style="width: 120px; height: 120px; ${baseStyle}">`;
            } else if (currentCount === 10) {
                iconHtml = `<img src="icons/ten.svg" style="width: 120px; height: 120px; ${baseStyle}">`;
            } else if (currentCount < 10) {
                iconHtml = `<img src="icons/${numberWords[currentCount]}.svg" style="width: 120px; height: 120px; ${baseStyle}">`;
            } else {
                // For scores > 10, show digits
                const scoreStr = currentCount.toString();
                for (let digit of scoreStr) {
                    const num = parseInt(digit);
                    if (num === 0) {
                        iconHtml += `<img src="icons/cowSkull.svg" style="width: 100px; height: 100px; margin: 0 5px; ${baseStyle}">`;
                    } else {
                        iconHtml += `<img src="icons/${numberWords[num]}.svg" style="width: 100px; height: 100px; margin: 0 5px; ${baseStyle}">`;
                    }
                }
            }
            
            scoreDisplay.innerHTML = iconHtml;
            
            // Continue counting or just leave final score visible
            if (currentCount < finalScore) {
                setTimeout(countUp, 300); // Next number
            }
            // Final score will already have wiggle animation applied
        };
        
        // Start counting after a delay
        setTimeout(() => {
            if (finalScore === 0) {
                // Just show skull for 0
                scoreDisplay.innerHTML = `<img src="icons/cowSkull.svg" style="width: 120px; height: 120px; animation: wiggle 2s ease-in-out infinite;">`;
            } else {
                countUp();
            }
        }, 500);
    }
    
    renderFinalScore() {
        // Get the appropriate number icon for the score
        const numberWords = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        
        if (this.score === 0) {
            return `<img src="icons/cowSkull.svg" style="width: 120px; height: 120px; animation: wiggle 2s ease-in-out infinite;">`;
        } else if (this.score === 10) {
            return `<img src="icons/ten.svg" style="width: 120px; height: 120px; animation: wiggle 2s ease-in-out infinite;">`;
        } else if (this.score < 10) {
            return `<img src="icons/${numberWords[this.score]}.svg" style="width: 120px; height: 120px; animation: wiggle 2s ease-in-out infinite;">`;
        } else {
            // For scores > 10, show digits
            const scoreStr = this.score.toString();
            let display = '';
            for (let digit of scoreStr) {
                const num = parseInt(digit);
                if (num === 0) {
                    display += `<img src="icons/cowSkull.svg" style="width: 100px; height: 100px; margin: 0 5px; animation: wiggle 2s ease-in-out infinite;">`;
                } else {
                    display += `<img src="icons/${numberWords[num]}.svg" style="width: 100px; height: 100px; margin: 0 5px; animation: wiggle 2s ease-in-out infinite;">`;
                }
            }
            return display;
        }
    }
    
    renderFinalHearts() {
        let hearts = '';
        const maxHearts = 5;
        
        for (let i = 0; i < maxHearts; i++) {
            if (i < this.hearts) {
                // Red heart for remaining lives
                hearts += `<img src="icons/heart.svg" style="width: 60px; height: 60px; margin: 0 5px; filter: brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(7481%) hue-rotate(358deg) brightness(96%) contrast(108%);">`;
            } else {
                // Broken heart for lost lives
                hearts += `<img src="icons/brokenHeart.svg" style="width: 60px; height: 60px; margin: 0 5px; opacity: 0.8;">`;
            }
        }
        return hearts;
    }
    
    retryQuiz() {
        // Reset game state immediately
        this.hearts = 5;
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.answers = [];
        
        // Then reinitialize
        this.init();
    }
    
    // MODAL FUNCTIONS
    showModal(content, isCentered = false) {
        // Inject styles first
        this.injectModalStyles();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal';
        
        if (isCentered) {
            // Centered modal with semi-transparent background
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            modal.innerHTML = `
                <div style="max-width: 500px;">
                    ${content}
                </div>
            `;
        } else {
            // Regular full modal
            modal.innerHTML = `
                <div class="modal-content">
                    ${content}
                </div>
            `;
        }
        
        document.body.appendChild(modal);
    }
    
    injectModalStyles() {
        // Check if styles already exist
        if (document.getElementById('kawaii-modal-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'kawaii-modal-styles';
        styleSheet.textContent = `
            /* Modal Overlay */
            #modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.7) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 999999 !important;
                padding: 20px !important;
            }
            
            /* Modal Content Container */
            #modal .modal-content {
                background: white !important;
                border-radius: 16px !important;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
                max-width: 700px !important;
                width: 100% !important;
                max-height: 85vh !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
            }
            
            /* Question Editor */
            .question-editor {
                display: flex !important;
                flex-direction: column !important;
                height: 100% !important;
                background: white !important;
            }
            
            .question-editor .editor-header {
                padding: 20px 30px !important;
                border-bottom: 1px solid #eee !important;
                background: #f8f9fa !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }
            
            .question-editor .editor-header h2 {
                margin: 0 !important;
                color: #FF69B4 !important;
                font-size: 1.5em !important;
                font-weight: 600 !important;
            }
            
            .question-editor .btn-close {
                background: none !important;
                border: none !important;
                font-size: 30px !important;
                cursor: pointer !important;
                color: #999 !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.2s !important;
                padding: 0 !important;
                line-height: 1 !important;
            }
            
            .question-editor .btn-close:hover {
                background: #f5f5f5 !important;
                color: #333 !important;
            }
            
            .question-editor .editor-content {
                padding: 30px !important;
                flex: 1 !important;
                overflow-y: auto !important;
                background: white !important;
            }
            
            .question-editor .form-group {
                margin-bottom: 25px !important;
            }
            
            .question-editor .form-group label {
                display: block !important;
                margin-bottom: 10px !important;
                font-weight: 600 !important;
                color: #333 !important;
                font-size: 14px !important;
            }
            
            .question-editor textarea,
            .question-editor input[type="text"] {
                width: 100% !important;
                padding: 12px !important;
                border: 2px solid #e0e0e0 !important;
                border-radius: 8px !important;
                font-size: 16px !important;
                font-family: inherit !important;
                transition: border-color 0.2s !important;
                background: white !important;
                color: #333 !important;
                box-sizing: border-box !important;
            }
            
            .question-editor textarea:focus,
            .question-editor input[type="text"]:focus {
                outline: none !important;
                border-color: #FF69B4 !important;
            }
            
            .question-editor textarea {
                resize: vertical !important;
                min-height: 80px !important;
            }
            
            .question-editor .answer-input-group {
                display: flex !important;
                align-items: stretch !important;
                margin-bottom: 12px !important;
                gap: 0 !important;
            }
            
            .question-editor .answer-input-group input[type="radio"] {
                display: none !important;
            }
            
            .question-editor .answer-option {
                flex: 1 !important;
                padding: 16px 20px !important;
                background: rgba(16, 16, 32, 0.6) !important;
                border: 2px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 10px !important;
                color: #e0e0e0 !important;
                font-size: 16px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                text-align: left !important;
                position: relative !important;
                overflow: hidden !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
            }
            
            .question-editor .answer-option:hover {
                background: rgba(255, 105, 180, 0.1) !important;
                border-color: rgba(255, 105, 180, 0.3) !important;
            }
            
            .question-editor .answer-option.selected {
                background: rgba(255, 105, 180, 0.2) !important;
                border-color: #FF69B4 !important;
            }
            
            .question-editor .answer-option .radio-indicator {
                width: 20px !important;
                height: 20px !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
                border-radius: 50% !important;
                flex-shrink: 0 !important;
                position: relative !important;
            }
            
            .question-editor .answer-option.selected .radio-indicator {
                border-color: #FF69B4 !important;
            }
            
            .question-editor .answer-option.selected .radio-indicator::after {
                content: '' !important;
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 10px !important;
                height: 10px !important;
                background: #FF69B4 !important;
                border-radius: 50% !important;
            }
            
            .question-editor .answer-text {
                flex: 1 !important;
                font-size: 16px !important;
                line-height: 1.4 !important;
                word-wrap: break-word !important;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                color: inherit !important;
                padding: 0 !important;
                width: 100% !important;
            }
            
            .question-editor .answer-text:focus {
                outline: 2px solid #FF69B4 !important;
                outline-offset: 2px !important;
                border-radius: 4px !important;
            }
            
            .question-editor .editor-footer {
                padding: 20px 30px !important;
                border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
                background: rgba(16, 16, 32, 0.8) !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 15px !important;
            }
            
            .question-editor .nav-buttons {
                display: flex !important;
                gap: 10px !important;
                flex-wrap: wrap !important;
                justify-content: flex-end !important;
            }
            
            /* Buttons in modal */
            .question-editor button {
                padding: 10px 20px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                font-family: inherit !important;
            }
            
            .question-editor .btn-primary {
                background: #FF69B4 !important;
                color: white !important;
            }
            
            .question-editor .btn-primary:hover:not(:disabled) {
                background: #FF1493 !important;
                transform: translateY(-1px) !important;
            }
            
            .question-editor .btn-secondary {
                background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%) !important;
                color: white !important;
            }
            
            .question-editor .btn-secondary:hover:not(:disabled) {
                background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%) !important;
                transform: translateY(-1px) !important;
            }
            
            .question-editor .btn-nav {
                background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%) !important;
                color: white !important;
                border: none !important;
            }
            
            .question-editor .btn-nav:hover:not(:disabled) {
                background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%) !important;
                transform: translateY(-1px) !important;
            }
            
            .question-editor button:disabled {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
            }
            
            /* Mobile adjustments for modal */
            @media (max-width: 600px) {
                .question-editor .editor-footer {
                    padding: 15px 20px !important;
                }
                
                .question-editor button {
                    padding: 8px 16px !important;
                    font-size: 13px !important;
                }
                
                .question-editor .nav-buttons {
                    width: 100% !important;
                    justify-content: space-between !important;
                }
            }
            
            .question-editor .btn-nav:hover:not(:disabled) {
                background: #e0e0e0 !important;
            }
            
            .question-editor button:disabled {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                transform: none !important;
            }
            
            /* Course Summary Styles */
            .course-summary {
                background: rgba(0, 0, 0, 0.3) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 8px !important;
                padding: 20px !important;
                margin: 20px 0 !important;
                text-align: left !important;
            }
            
            .course-summary h3 {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #FF69B4 !important;
                margin-bottom: 8px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            
            .course-summary .overview-section,
            .course-summary .description-section,
            .course-summary .skills-section {
                margin-bottom: 15px !important;
            }
            
            .course-summary .overview-section:last-child,
            .course-summary .description-section:last-child,
            .course-summary .skills-section:last-child {
                margin-bottom: 0 !important;
            }
            
            .course-summary .description-scroll {
                max-height: 120px !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                padding-right: 10px !important;
                line-height: 1.5 !important;
                color: rgba(255, 255, 255, 0.9) !important;
                display: block !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar {
                width: 6px !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar-track {
                background: #f1f1f1 !important;
                border-radius: 3px !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar-thumb {
                background: #ccc !important;
                border-radius: 3px !important;
            }
            
            .course-summary .description-scroll::-webkit-scrollbar-thumb:hover {
                background: #999 !important;
            }
            
            .course-summary .overview {
                font-style: italic !important;
                color: rgba(255, 255, 255, 0.8) !important;
                line-height: 1.5 !important;
            }
            
            .course-summary .skills {
                color: #87CEEB !important;
                font-weight: 500 !important;
            }
            
            /* Success card styles */
            .success-card {
                background: rgba(30, 30, 40, 0.95) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                border-radius: 16px !important;
                padding: 40px !important;
                text-align: center !important;
                box-shadow: 0 8px 16px rgba(0,0,0,0.3) !important;
                color: white !important;
            }
            
            .success-icon {
                font-size: 60px !important;
                margin-bottom: 20px !important;
            }
            
            .success-card h2 {
                color: #FF69B4 !important;
                margin-bottom: 15px !important;
            }
            
            .success-card p {
                color: rgba(255, 255, 255, 0.9) !important;
            }
            
            .btn-large {
                font-size: 18px !important;
                padding: 14px 30px !important;
                margin: 10px !important;
            }
            
            /* Main container buttons */
            .quiz-container button {
                padding: 12px 24px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 16px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                margin: 5px !important;
            }
            
            .quiz-container .btn-primary {
                background: #FF69B4 !important;
                color: white !important;
            }
            
            .quiz-container .btn-primary:hover {
                background: #FF1493 !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3) !important;
            }
            
            .quiz-container .btn-secondary {
                background: #87CEEB !important;
                color: #1a1a2e !important;
            }
            
            .quiz-container .btn-secondary:hover {
                background: #6BB6D6 !important;
                transform: translateY(-2px) !important;
            }
            
            /* Loading spinner */
            .loading-modal {
                text-align: center !important;
                padding: 40px !important;
                color: white !important;
            }
            
            .loading-modal p {
                color: rgba(255, 255, 255, 0.9) !important;
            }
            
            .spinner {
                width: 50px !important;
                height: 50px !important;
                border: 3px solid rgba(255, 255, 255, 0.1) !important;
                border-top: 3px solid #FF69B4 !important;
                border-radius: 50% !important;
                animation: spin 1s linear infinite !important;
                margin: 0 auto 20px !important;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Jiggle animation for correct answer */
            @keyframes jiggle {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            
            /* Bounce in animation for correct answer icon */
            @keyframes bounceIn {
                0% { 
                    transform: scale(0) rotate(-180deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2) rotate(10deg);
                }
                100% { 
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
            
            /* Shake in animation for wrong answer icon */
            @keyframes shakeIn {
                0% { 
                    transform: scale(0);
                    opacity: 0;
                }
                20% { transform: scale(1.1) rotate(-5deg); }
                40% { transform: scale(0.9) rotate(5deg); }
                60% { transform: scale(1.05) rotate(-3deg); }
                80% { transform: scale(0.95) rotate(2deg); }
                100% { 
                    transform: scale(1) rotate(0);
                    opacity: 1;
                }
            }
            
            /* Fade out animation */
            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.8); }
            }
            
            /* Notification styles */
            .notification {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                padding: 15px 20px !important;
                border-radius: 8px !important;
                background: white !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                animation: slideInRight 0.3s ease !important;
                z-index: 10000 !important;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            .notification.fade-out {
                animation: fadeOutRight 0.3s ease !important;
            }
            
            @keyframes fadeOutRight {
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification-success {
                border-left: 4px solid #4CAF50 !important;
            }
            
            .notification-error {
                border-left: 4px solid #F44336 !important;
            }
        `;
        
        document.head.appendChild(styleSheet);
    }
    
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            console.log('🔍 Hiding modal:', modal);
            modal.remove();
        } else {
            console.log('⚠️ No modal found to hide');
        }
    }
    
    showCourseAnnouncement() {
        const courseName = this.context.courseName || 'Course';
        console.log('🎭 Modal showing course:', courseName);
        console.log('🎭 Context:', this.context);
        
        // Random non-navigational icons (actual files from server)
        const announcementIcons = [
            'Balloon.svg', 'alien.svg', 'apple.svg', 'atomic.svg', 'axe.svg',
            'banjo.svg', 'baoBun.svg', 'barn.svg', 'bento.svg',
            'brightEye.svg',
            'burger.svg', 'burger2.svg', 'cappucino.svg', 'car.svg', 'coffee.svg',
            'cowSkull.svg', 'deadToast.svg', 'dogTags.svg', 'emergencyMan.svg',
            'eye.svg', 'fence.svg', 'gear.svg', 'gear2.svg', 'gondola.svg',
            'guitar.svg', 'handcuffs.svg', 'hatchet.svg',
            'horseshoe.svg', 'hotAirBaloon.svg', 'infinity.svg',
            'kissLips.svg', 'kissLips2.svg', 'kiwi.svg', 'lightbulb.svg', 'man.svg',
            'mutantSpiral.svg', 'noodles.svg', 'noodles2.svg', 'raman.svg', 'robot.svg',
            'sailboat.svg', 'skullbk.svg', 'spiralLoose.svg',
            'splat.svg', 'splat2.svg', 'stilletto.svg',
            'swissCheese.svg', 'tank.svg', 'toast.svg', 'virus.svg', 'woman.svg'
        ];
        
        const randomIcon = announcementIcons[Math.floor(Math.random() * announcementIcons.length)];
        
        this.showModal(`
            <div style="
                background: #000000;
                color: #ffffff;
                padding: 60px 40px;
                text-align: center;
                border: 2px solid #333;
                position: relative;
            ">
                <div style="margin-bottom: 40px;">
                    <img src="icons/${randomIcon}" style="
                        width: 100px;
                        height: 100px;
                        opacity: 0.9;
                    " alt="" onerror="this.style.display='none'">
                </div>
                
                <h2 style="
                    color: #ffffff;
                    font-size: 28px;
                    margin: 0 0 20px 0;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                ">QUIZ ASSIGNED</h2>
                
                <p style="
                    color: #ffffff;
                    font-size: 20px;
                    margin: 0 0 40px 0;
                    opacity: 0.9;
                ">for course</p>
                
                <h3 style="
                    color: #ffffff;
                    font-size: 24px;
                    margin: 0 0 30px 0;
                    font-weight: bold;
                ">"${courseName}"</h3>
                
                <div style="
                    width: 100px;
                    height: 4px;
                    background: #333;
                    margin: 0 auto;
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div style="
                        width: 100%;
                        height: 100%;
                        background: #ffffff;
                        animation: shrink 5s linear forwards;
                    "></div>
                </div>
            </div>
        `, true);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            this.hideModal();
        }, 5000);
    }
    
    showLoadingModal(message) {
        this.showModal(`
            <div class="loading-modal">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `);
    }
    
    showNotification(message, type = 'info') {
        console.log(`📢 Showing notification: "${message}" (type: ${type})`);
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = 'color: black !important; background: #f0f0f0 !important; z-index: 99999; border: 2px solid #333;';
        notification.innerHTML = `
            <span class="icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span style="color: black !important; font-weight: bold;">${message || 'No message provided'}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize
let quiz;
window.addEventListener('DOMContentLoaded', () => {
    quiz = new KawaiiQuiz();
    quiz.init();
});
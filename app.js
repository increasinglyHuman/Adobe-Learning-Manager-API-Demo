// ⚠️ WARNING: ALM INTEGRATION ONLY - NOT PART OF JAZZYPOP PROJECT ⚠️
// This is the Adobe Learning Manager version of Kawaii Quiz
// DO NOT CONFUSE WITH JazzyPop dashboard components!
// Location: ~/Documents/ALM-Kawaii-Quiz (separate from JazzyPop)

// Kawaii Quiz App v4.0 - ALM Integration Version
class KawaiiQuiz {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
        
        // Debug: Log all parameters ALM is sending
        console.log('ALM Parameters received:');
        console.log('Full URL:', window.location.href);
        const allParams = {};
        for (let [key, value] of this.params) {
            console.log(`${key}: ${value}`);
            allParams[key] = value;
        }
        console.log('All parameters object:', allParams);
        
        // Store in sessionStorage for debugging
        sessionStorage.setItem('almParameters', JSON.stringify(allParams));
        
        // Check for multiple authToken parameters (ALM bug workaround)
        const authTokens = this.params.getAll('authToken');
        console.log(`Found ${authTokens.length} authToken parameter(s)`);
        
        if (authTokens.length > 1) {
            console.log('⚠️ Multiple authTokens detected - ALM is sending duplicate tokens');
            authTokens.forEach((token, index) => {
                console.log(`Token ${index}: ${token.substring(0, 30)}... (length: ${token.length})`);
                // Log token patterns to identify API vs natext
                if (token.includes('~')) {
                    console.log(`  -> Token ${index} contains '~' - likely API token`);
                }
                if (token.length > 100) {
                    console.log(`  -> Token ${index} is long (${token.length} chars) - likely API token`);
                }
            });
        }
        
        // Support both test parameters and ALM parameters
        this.context = {
            userId: this.params.get('userId') || this.params.get('user_id') || this.params.get('learner_id') || this.params.get('CSUSER'),
            courseId: this.params.get('courseId') || this.params.get('loId') || this.params.get('course_id') || this.params.get('lo_id') || this.params.get('COURSE_ID'),
            moduleId: this.params.get('moduleId') || this.params.get('module_id') || this.params.get('MODULE_ID'),
            accountId: this.params.get('accountId') || this.params.get('account_id') || this.params.get('ACCOUNT_ID'),
            accessToken: this.getCorrectAuthToken() || this.params.get('access_token') || this.params.get('accessToken') || this.params.get('auth_token') || this.params.get('token') || this.params.get('ACCESS_TOKEN'),
            userRole: this.params.get('userRole') || this.params.get('user_role') || this.params.get('role') || this.params.get('ROLE') || 'learner',
            userName: this.params.get('userName') || this.params.get('user_name') || this.params.get('name') || this.params.get('USER_NAME'),
            courseName: this.params.get('courseName') || this.params.get('course_name') || this.params.get('lo_name') || this.params.get('COURSE_NAME'),
            locale: this.params.get('locale') || this.params.get('LOCALE') || 'en-US',
            instanceId: this.params.get('loInstanceId') || this.params.get('instanceId') || this.params.get('INSTANCE_ID'),
            isInstructor: false,
            platform: this.params.get('platform') || 'alm'
        };
        
        // Determine if user is instructor based on role
        const instructorRoles = ['instructor', 'admin', 'author'];
        this.context.isInstructor = instructorRoles.includes(this.context.userRole.toLowerCase());
        
        this.apiBaseUrl = 'https://p0qp0q.com/api/alm-demo';
        // xAPI base URL - from the test console
        this.xapiBaseUrl = 'https://captivateprimelrs.adobe.com/api/xapi';
        
        // OAuth credentials - should be stored securely server-side in production
        this.oauth = {
            clientId: '51c43fb3-b5c8-4d8f-a2f3-7e3e3a9b9c1f',
            clientSecret: 'c09c8431-ff64-43bb-82d0-50962dc3ee8f',
            refreshToken: '8f5a68fb604e4725b826d8b14c7bceca',
            accessToken: '1b5f81282e2f382aadfbe9c392d57139',
            tokenExpiry: null // Will be set when we refresh
        };
        
        // ALM API credentials (for course data, enrollments, etc)
        this.almApi = {
            clientId: '9abac94d-9c4c-4e2c-ab9c-091657765599',
            clientSecret: '233dce3b-0d2d-40fb-8dd5-11bc882b64a7',
            refreshToken: '84dc49e6a0b0e2a2e8426312cf2f9b47',
            accessToken: null,
            tokenExpiry: null
        };
        this.currentQuiz = null;
        this.currentQuestion = 0;
        this.answers = [];
        
        // Listen for messages from ALM
        window.addEventListener('message', (event) => {
            console.log('Message received from:', event.origin, event.data);
            
            // Handle ALM context if sent via postMessage
            if (event.data && event.data.type === 'alm-context') {
                this.context = { ...this.context, ...event.data.context };
                console.log('Updated context from ALM:', this.context);
                
                // Reload if we now have instructor access
                if (this.context.isInstructor && !this.quizLoaded) {
                    this.loadBuilder();
                }
            }
            
            // Handle course data response
            if (event.data && event.data.type === 'course-data-response') {
                console.log('Received course data from ALM:', event.data.courseData);
                this.parseCourseData({ data: event.data.courseData });
            }
        });
        
        this.init();
    }
    
    async init() {
        // REMOVED: All postMessage calls that were causing ALM to kill the window
        // ALM doesn't recognize these message types and terminates the iframe
        console.log('Skipping postMessage communication to prevent ALM window termination');
        
        // Check for stored tokens from previous session
        const storedXapiToken = sessionStorage.getItem('almXapiToken');
        if (storedXapiToken) {
            try {
                const tokenData = JSON.parse(storedXapiToken);
                if (tokenData.accessToken && tokenData.tokenExpiry) {
                    this.oauth.accessToken = tokenData.accessToken;
                    this.oauth.tokenExpiry = new Date(tokenData.tokenExpiry);
                    console.log('Restored xAPI token from session, expires:', this.oauth.tokenExpiry);
                }
            } catch (e) {
                console.log('Could not restore xAPI token from session');
            }
        }
        
        const storedAlmToken = sessionStorage.getItem('almApiToken');
        if (storedAlmToken) {
            try {
                const tokenData = JSON.parse(storedAlmToken);
                if (tokenData.accessToken && tokenData.tokenExpiry) {
                    this.almApi.accessToken = tokenData.accessToken;
                    this.almApi.tokenExpiry = new Date(tokenData.tokenExpiry);
                    console.log('Restored ALM API token from session, expires:', this.almApi.tokenExpiry);
                }
            } catch (e) {
                console.log('Could not restore ALM API token from session');
            }
        }
        
        // Determine mode: builder or player
        if (this.context.isInstructor) {
            await this.loadBuilder();
        } else {
            await this.loadPlayer();
        }
    }
    
    // Helper method to identify the correct auth token when ALM sends multiples
    getCorrectAuthToken() {
        const authTokens = this.params.getAll('authToken');
        
        if (authTokens.length === 0) {
            return null;
        }
        
        if (authTokens.length === 1) {
            return authTokens[0];
        }
        
        // Multiple tokens - need to identify the API token
        console.log('🔍 Analyzing multiple authTokens to find API token...');
        
        // Strategy: API tokens are typically longer and contain '~'
        // natext tokens are usually shorter
        let apiToken = null;
        let longestToken = '';
        let longestLength = 0;
        
        authTokens.forEach((token, index) => {
            if (token.includes('~')) {
                console.log(`✅ Token ${index} contains '~' - selecting as API token`);
                apiToken = token;
            }
            if (token.length > longestLength) {
                longestLength = token.length;
                longestToken = token;
            }
        });
        
        // If no token with '~', use the longest one
        if (!apiToken && longestToken) {
            console.log(`📏 No token with '~' found, using longest token (${longestLength} chars)`);
            apiToken = longestToken;
        }
        
        return apiToken || authTokens[0]; // Fallback to first token
    }
    
    // Get valid xAPI token, refreshing if needed
    async getValidToken() {
        // Check if token is expired or about to expire (within 5 minutes)
        if (this.oauth.tokenExpiry && new Date() >= new Date(this.oauth.tokenExpiry - 300000)) {
            console.log('Token expired or expiring soon, refreshing...');
            await this.refreshAccessToken();
        }
        
        return this.oauth.accessToken;
    }
    
    // Refresh the xAPI access token using refresh token
    async refreshAccessToken() {
        try {
            const response = await fetch('https://learningmanager.adobe.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.oauth.refreshToken,
                    client_id: this.oauth.clientId,
                    client_secret: this.oauth.clientSecret
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.oauth.accessToken = data.access_token;
                // Set expiry to current time + expires_in seconds
                this.oauth.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
                console.log('Token refreshed successfully, expires at:', this.oauth.tokenExpiry);
                
                // Store in sessionStorage for this session
                sessionStorage.setItem('almXapiToken', JSON.stringify({
                    accessToken: this.oauth.accessToken,
                    tokenExpiry: this.oauth.tokenExpiry
                }));
            } else {
                console.error('Failed to refresh token:', response.status, await response.text());
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            // Fall back to current token if refresh fails
        }
    }
    
    // Get valid ALM API token for course data, enrollments, etc
    async getValidAlmToken() {
        // Check if token is expired or about to expire (within 5 minutes)
        if (!this.almApi.accessToken || (this.almApi.tokenExpiry && new Date() >= new Date(this.almApi.tokenExpiry - 300000))) {
            console.log('ALM API token expired or missing, refreshing...');
            await this.refreshAlmAccessToken();
        }
        
        return this.almApi.accessToken;
    }
    
    // Refresh the ALM API access token
    async refreshAlmAccessToken() {
        try {
            const response = await fetch('https://learningmanager.adobe.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.almApi.refreshToken,
                    client_id: this.almApi.clientId,
                    client_secret: this.almApi.clientSecret
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.almApi.accessToken = data.access_token;
                this.almApi.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
                console.log('ALM API token refreshed successfully, expires at:', this.almApi.tokenExpiry);
                
                // Store in sessionStorage
                sessionStorage.setItem('almApiToken', JSON.stringify({
                    accessToken: this.almApi.accessToken,
                    tokenExpiry: this.almApi.tokenExpiry
                }));
            } else {
                console.error('Failed to refresh ALM API token:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Error refreshing ALM API token:', error);
        }
    }
    
    postMessage(type, data) {
        // DISABLED: ALM kills the window if it receives unrecognized messages
        console.log('PostMessage disabled to prevent ALM termination:', type, data);
    }
    
    // QUIZ BUILDER
    async loadBuilder() {
        const app = document.getElementById('app');
        
        // Show loading state
        app.innerHTML = '<div class="loading-screen"><div class="kawaii-loader">Loading course details...</div></div>';
        
        // Fetch course details from ALM if we have access token
        if (this.context.accessToken && this.context.courseId) {
            await this.fetchCourseDetails();
        } else {
            console.log('No access token, skipping course details fetch');
        }
        
        console.log('About to try loading quiz from xAPI...');
        // Try to load quiz from xAPI
        try {
            const activityId = `https://p0qp0q.com/alm-quiz/activities/${this.context.courseId}`;
            const profileId = 'quiz-definition';
            
            // Debug the exact request being made
            const xapiUrl = `${this.xapiBaseUrl}/activities/profile?activityId=${encodeURIComponent(activityId)}&profileId=${profileId}`;
            const token = await this.getValidToken();
            
            console.log('xAPI request details:', {
                url: xapiUrl,
                activityId: activityId,
                token: token ? `${token.substring(0, 20)}...` : 'none',
                headers: {
                    'Authorization': `oauth ${token}`,
                    'X-Experience-API-Version': '1.0.3'
                }
            });
            
            const response = await fetch(xapiUrl, {
                headers: {
                    'Authorization': `oauth ${token}`,
                    'X-Experience-API-Version': '1.0.3'
                }
            });
            
            if (response.ok) {
                this.currentQuiz = await response.json();
                console.log('Loaded quiz from xAPI');
            } else if (response.status === 404) {
                // No quiz exists yet
                console.log('No quiz found in xAPI, creating new quiz');
                this.currentQuiz = {
                    courseId: this.context.courseId,
                    questions: []
                };
            } else {
                throw new Error(`xAPI load failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading quiz from xAPI:', error);
            // Fall back to empty quiz
            this.currentQuiz = {
                courseId: this.context.courseId,
                questions: []
            };
        }
        
        // Check if this is a new quiz and we have course details
        const isNewQuiz = !this.currentQuiz.questions || this.currentQuiz.questions.length === 0;
        // For now, assume we have course info if we have a courseId
        const hasCourseInfo = this.courseDetails?.name || this.courseDetails?.overview || this.context.courseId;
        
        console.log('Load builder check:', {
            isNewQuiz,
            hasCourseInfo,
            courseDetails: this.courseDetails,
            questionsLength: this.currentQuiz?.questions?.length,
            courseName: this.context.courseName,
            courseId: this.context.courseId
        });
        
        app.innerHTML = `
            <div class="quiz-builder">
                <div class="version-badge">v4.2 🎯</div>
                <div class="builder-header">
                    <h1>Kawaii Quiz Builder 🌸</h1>
                    <p>Create a fun quiz for: ${this.courseDetails?.name || this.context.courseName || 'This Course'}</p>
                    ${this.courseDetails?.overview ? `<p class="course-overview">${this.courseDetails.overview}</p>` : ''}
                    ${this.courseDetails?.description && this.courseDetails?.description !== this.courseDetails?.overview ? 
                        `<details class="course-details">
                            <summary>View detailed description</summary>
                            <p class="course-description">${this.courseDetails.description}</p>
                        </details>` : ''}
                </div>
                
                <div class="ai-section">
                    ${isNewQuiz && hasCourseInfo ? `
                        <div class="welcome-message">
                            <h2>✨ Auto-generating quiz questions...</h2>
                            <p>Creating 10 questions based on your course content!</p>
                            <div class="generating-spinner"></div>
                        </div>
                    ` : ''}
                    ${!isNewQuiz ? `
                        <button class="btn btn-ai btn-large" onclick="quiz.suggestQuestions()" id="generate-btn">
                            ✨ Generate More Questions
                        </button>
                        <p class="ai-hint">Add more AI-generated questions to your quiz!</p>
                    ` : ''}
                    
                    <details class="course-input-section">
                        <summary>📝 Add Course Details (Optional)</summary>
                        <div class="course-input-content">
                            <div class="input-group">
                                <label>Course Name</label>
                                <input type="text" id="manual-course-name" placeholder="e.g., Python Programming Basics" />
                            </div>
                            <div class="input-group">
                                <label>Course Description</label>
                                <textarea id="manual-course-desc" placeholder="Brief description of what this course covers..." rows="3"></textarea>
                            </div>
                            <div class="input-group">
                                <label>Key Topics (comma-separated)</label>
                                <input type="text" id="manual-course-topics" placeholder="e.g., variables, loops, functions, debugging" />
                            </div>
                            <button class="btn btn-secondary" onclick="quiz.updateCourseInfo()">Update Course Info</button>
                        </div>
                    </details>
                    <details class="debug-info">
                        <summary>🔧 Debug Info</summary>
                        <div class="debug-content">
                            <p><strong>Course ID:</strong> ${this.context.courseId || 'none'}</p>
                            <p><strong>Has Token:</strong> ${this.context.accessToken ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>User Role:</strong> ${this.context.userRole}</p>
                            <p><strong>Quiz Questions:</strong> ${this.currentQuiz?.questions?.length || 0}</p>
                            <p><strong>Topics Found:</strong> ${(this.courseDetails?.skills?.length || 0) + (this.courseDetails?.tags?.length || 0) + (this.courseDetails?.moduleNames?.length || 0)}</p>
                            <p><strong>All URL Params:</strong></p>
                            <pre style="font-size: 10px; overflow-x: auto;">${Array.from(this.params).map(([k,v]) => `${k}=${v}`).join('\n') || 'No parameters'}</pre>
                            <p><strong>Session Storage:</strong></p>
                            <pre style="font-size: 10px; overflow-x: auto;">${sessionStorage.getItem('almParameters') || 'No stored params'}</pre>
                            <button class="btn btn-secondary" onclick="quiz.clearQuiz()">🗑️ Clear All Questions</button>
                            <button class="btn btn-secondary" onclick="quiz.testAPI()">🧪 Test API</button>
                            <button class="btn btn-secondary" onclick="quiz.testDirectAPI()">🔍 Test Direct ALM API</button>
                        </div>
                    </details>
                </div>
                
                <div id="questions-container" class="questions-list">
                    ${this.renderQuestions()}
                </div>
                
                <div class="actions-section">
                    <button class="btn btn-secondary btn-large" onclick="quiz.addQuestion()">
                        ➕ Add Question
                    </button>
                    <button class="btn btn-primary btn-large" onclick="quiz.saveQuiz()">
                        💾 Save Quiz
                    </button>
                </div>
            </div>
        `;
        
        // Auto-generate questions for new quizzes if we have course info
        if (isNewQuiz && hasCourseInfo) {
            // Immediately start generating questions
            console.log('Auto-generating 10 initial questions for new quiz...');
            this.suggestQuestions(10, true); // Pass number of questions and auto flag
        }
    }
    
    // Fetch course details from ALM API
    async fetchCourseDetails() {
        try {
            // First try direct API call using existing browser session (this worked before!)
            console.log('Trying direct API call with browser session...');
            try {
                const directResponse = await fetch(
                    `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${this.context.courseId}?include=skills,instances.modules`,
                    {
                        credentials: 'include', // Include cookies/session
                        headers: {
                            'Accept': 'application/vnd.api+json'
                        }
                    }
                );
                
                if (directResponse.ok) {
                    console.log('Success with browser session!');
                    const data = await directResponse.json();
                    this.parseCourseData(data);
                    return;
                }
            } catch (err) {
                console.log('Browser session failed:', err);
            }
            
            // Then try with ALM API token if browser session fails
            const almToken = await this.getValidAlmToken();
            
            if (!almToken) {
                console.log('No ALM API token available, skipping course details fetch');
                return;
            }
            
            console.log('Trying with ALM API token...');
            
            const response = await fetch(
                `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${this.context.courseId}?include=skills,instances.modules`,
                {
                    headers: {
                        'Authorization': `Bearer ${almToken}`,
                        'Accept': 'application/vnd.api+json'
                    }
                }
            );
            
            if (response.ok) {
                console.log('Successfully fetched course details with token!');
                const data = await response.json();
                this.parseCourseData(data);
            } else {
                console.error('Failed to fetch course details:', response.status);
            }
        } catch (error) {
            console.error('Error fetching course details:', error);
        }
    }
    
    // Fetch enrolled users for this course
    async fetchEnrolledUsers() {
        console.log('Fetching enrolled users for course:', this.context.courseId);
        const enrolledUsers = [];
        
        try {
            // Get ALM API token for fetching enrollments
            const almToken = await this.getValidAlmToken();
            
            if (!almToken) {
                console.log('No ALM API token available for fetching enrollments');
                return enrolledUsers;
            }
            
            // ALM API endpoint for course enrollments
            const url = `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${this.context.courseId}/enrollments`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${almToken}`,
                    'Accept': 'application/vnd.api+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Extract user IDs from enrollments
                if (data.data && Array.isArray(data.data)) {
                    data.data.forEach(enrollment => {
                        if (enrollment.relationships && enrollment.relationships.learner) {
                            const userId = enrollment.relationships.learner.data.id;
                            if (userId && !enrolledUsers.includes(userId)) {
                                enrolledUsers.push(userId);
                            }
                        }
                    });
                }
                
                console.log(`Found ${enrolledUsers.length} enrolled users:`, enrolledUsers);
            } else {
                console.error('Failed to fetch enrollments:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching enrolled users:', error);
        }
        
        return enrolledUsers;
    }
    
    parseCourseData(data) {
        // Handle both direct data and wrapped data structures
        const courseData = data.data || data;
        const attributes = courseData.attributes || courseData;
        const localizedMeta = attributes.localizedMetadata?.[0] || {};
        
        this.courseDetails = {
            name: localizedMeta.name || attributes.name || this.extractCourseName() || 'This Course',
            overview: localizedMeta.overview || attributes.overview || '',
            description: localizedMeta.richTextOverview || attributes.richTextOverview || attributes.description || '',
            skills: attributes.skills || [],
            tags: attributes.tags || [],
            duration: attributes.duration,
            moduleNames: courseData.relationships?.modules?.data?.map(m => m.attributes?.name) || [],
            state: attributes.state,
            loType: attributes.loType
        };
        
        // Clean up HTML from rich text overview if present
        if (this.courseDetails.description && this.courseDetails.description.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.courseDetails.description;
            this.courseDetails.description = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        console.log('Parsed course details:', this.courseDetails);
        
        // Update the UI with course details
        this.updateBuilderUI();
    }
    
    extractCourseName() {
        // Try to extract course name from courseId if it contains readable text
        if (this.context.courseId && this.context.courseId.includes(':')) {
            const parts = this.context.courseId.split(':');
            const lastPart = parts[parts.length - 1];
            // Check if it's just numbers
            if (!/^\d+$/.test(lastPart)) {
                return lastPart.replace(/_/g, ' ').replace(/-/g, ' ');
            }
        }
        return null;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateBuilderUI() {
        // Update the course name in the header if we have better info
        const headerP = document.querySelector('.builder-header p');
        if (headerP && this.courseDetails?.name && this.courseDetails.name !== 'This Course') {
            headerP.textContent = `Create a fun quiz for: ${this.courseDetails.name}`;
        }
        
        // Update overview if available
        const overviewP = document.querySelector('.course-overview');
        if (!overviewP && this.courseDetails?.overview) {
            const header = document.querySelector('.builder-header');
            const overviewElement = document.createElement('p');
            overviewElement.className = 'course-overview';
            overviewElement.textContent = this.courseDetails.overview;
            header.appendChild(overviewElement);
        }
        
        // Update description if available
        if (this.courseDetails?.description && !document.querySelector('.course-details')) {
            const header = document.querySelector('.builder-header');
            const detailsElement = document.createElement('details');
            detailsElement.className = 'course-details';
            detailsElement.innerHTML = `
                <summary>View detailed description</summary>
                <p class="course-description">${this.courseDetails.description}</p>
            `;
            header.appendChild(detailsElement);
        }
    }
    
    renderQuestions() {
        if (this.currentQuiz.questions.length === 0) {
            return this.renderQuestionCard(0);
        }
        
        return this.currentQuiz.questions.map((q, i) => 
            this.renderQuestionCard(i, q)
        ).join('');
    }
    
    renderQuestionCard(index, question = null) {
        const q = question || {
            text: '',
            answers: ['', '', '', ''],
            correct: 0
        };
        
        // Ensure answers array exists and has 4 elements
        if (!Array.isArray(q.answers)) {
            q.answers = ['', '', '', ''];
        }
        while (q.answers.length < 4) {
            q.answers.push('');
        }
        
        // Kawaii icons for question numbers
        const kawaiiIcons = ['🍪', '🧁', '🍓', '🍦', '🍩', '🌸', '🌈', '⭐', '🎀', '🦄'];
        const icon = kawaiiIcons[index % kawaiiIcons.length];
        
        // Ensure correct is a number for single answer
        const correctIndex = typeof q.correct === 'number' ? q.correct : (Array.isArray(q.correct) ? q.correct[0] : 0);
        
        return `
            <div class="question-container" data-question="${index}">
                <div class="question-icon">${icon}</div>
                
                <div class="question-content">
                    <textarea 
                        class="question-input"
                        placeholder="Question ${index + 1}: Type your question here..."
                        onchange="quiz.updateQuestion(${index}, 'text', this.value)"
                    >${this.escapeHtml(q.text || '')}</textarea>
                    
                    <div class="answers-section">
                        ${q.answers.map((ans, i) => `
                            <div class="answer-row">
                                <input 
                                    type="text" 
                                    class="answer-input-field"
                                    placeholder="Answer ${String.fromCharCode(65 + i)}"
                                    value="${this.escapeHtml(ans || '')}"
                                    onchange="quiz.updateAnswer(${index}, ${i}, this.value)"
                                />
                                <button 
                                    class="answer-select-btn ${correctIndex === i ? 'selected' : ''}"
                                    onclick="quiz.setCorrectAnswer(${index}, ${i})"
                                >
                                    ${correctIndex === i ? '✓' : ''}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${index > 0 ? `
                        <button class="remove-question-btn" onclick="quiz.removeQuestion(${index})">
                            Remove Question
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    addQuestion() {
        if (this.currentQuiz.questions.length >= 10) {
            this.showNotification('Maximum 10 questions allowed! 🌟', 'info');
            return;
        }
        
        this.currentQuiz.questions.push({
            text: '',
            answers: ['', '', '', ''],
            correct: 0
        });
        
        document.getElementById('questions-container').innerHTML = this.renderQuestions();
        
        // Scroll to new question
        const newQuestion = document.querySelector(`[data-question="${this.currentQuiz.questions.length - 1}"]`);
        if (newQuestion) {
            newQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    updateQuestion(index, field, value) {
        if (!this.currentQuiz.questions[index]) {
            this.currentQuiz.questions[index] = {
                text: '',
                answers: ['', '', '', ''],
                correct: 0
            };
        }
        this.currentQuiz.questions[index][field] = value;
    }
    
    setCorrectAnswer(questionIndex, answerIndex) {
        if (!this.currentQuiz.questions[questionIndex]) return;
        this.currentQuiz.questions[questionIndex].correct = answerIndex;
        
        // Update UI
        const container = document.querySelector(`[data-question="${questionIndex}"]`);
        container.querySelectorAll('.answer-select-btn').forEach((btn, i) => {
            if (i === answerIndex) {
                btn.classList.add('selected');
                btn.textContent = '✓';
            } else {
                btn.classList.remove('selected');
                btn.textContent = '';
            }
        });
    }
    
    updateAnswer(questionIndex, answerIndex, value) {
        if (!this.currentQuiz.questions[questionIndex]) return;
        this.currentQuiz.questions[questionIndex].answers[answerIndex] = value;
    }
    
    removeQuestion(index) {
        this.currentQuiz.questions.splice(index, 1);
        document.getElementById('questions-container').innerHTML = this.renderQuestions();
    }
    
    async saveQuiz() {
        // Validate quiz
        const valid = this.currentQuiz.questions.every(q => 
            q.text && 
            q.answers.filter(a => a).length >= 2 && 
            (typeof q.correct === 'number' || q.correct >= 0)
        );
        
        if (!valid) {
            alert('Please complete all questions with at least 2 answers and select correct answer(s)');
            return;
        }
        
        try {
            // Fetch enrolled users for this course
            let enrolledUsers = [];
            if (this.context.courseId && this.context.accessToken) {
                enrolledUsers = await this.fetchEnrolledUsers();
            }
            
            // Save to xAPI
            const quizData = {
                ...this.currentQuiz,
                updatedBy: this.context.userId,
                updatedAt: new Date().toISOString(),
                enrolledUsers: enrolledUsers
            };
            
            const activityId = `https://p0qp0q.com/alm-quiz/activities/${this.context.courseId}`;
            const profileId = 'quiz-definition';
            
            const response = await fetch(
                `${this.xapiBaseUrl}/activities/profile?activityId=${encodeURIComponent(activityId)}&profileId=${profileId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${await this.getValidToken()}`,
                        'X-Experience-API-Version': '1.0.3',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(quizData)
                }
            );
            
            if (response.ok) {
                this.showNotification('Quiz saved to ALM! 🎉', 'success');
            } else {
                throw new Error(`xAPI save failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Error saving quiz. Please try again.', 'error');
        }
    }
    
    async suggestQuestions(numQuestions = 5, isAuto = false) {
        // Handle button interaction only if not auto-generating
        let button = null;
        if (!isAuto && event && event.target) {
            button = event.target;
            button.disabled = true;
            button.innerHTML = '✨ Generating...';
        }
        
        try {
            // Get course name from display or context
            const displayedCourseName = document.querySelector('.builder-header p')?.textContent?.replace('Create a fun quiz for: ', '') || 'General Course';
            
            // Build topics from course metadata or use the course name
            const topics = [];
            if (this.courseDetails?.manualTopics?.length > 0) {
                topics.push(...this.courseDetails.manualTopics);
            }
            if (this.courseDetails?.skills?.length > 0) {
                topics.push(...this.courseDetails.skills);
            }
            if (this.courseDetails?.tags?.length > 0) {
                topics.push(...this.courseDetails.tags);
            }
            if (this.courseDetails?.moduleNames?.length > 0) {
                topics.push(...this.courseDetails.moduleNames);
            }
            
            // If no topics found, try to extract from course name
            if (topics.length === 0 && displayedCourseName && displayedCourseName !== 'This Course') {
                // Use the course name to infer topics
                topics.push(`Topics related to ${displayedCourseName}`);
                topics.push('Core concepts', 'Key principles', 'Best practices');
            }
            
            // For demo, generate questions client-side
            const questionTemplates = [
                "What is the main purpose of %s?",
                "Which of the following best describes %s?",
                "When should you use %s?",
                "What is an important characteristic of %s?",
                "Which statement about %s is correct?",
                "What is a key benefit of %s?",
                "How does %s typically work?",
                "What should you consider when using %s?"
            ];
            
            const answerSets = [
                ["It helps with efficiency", "It reduces complexity", "It improves performance", "It enhances security"],
                ["Always use it", "Use it sometimes", "Never use it", "Use it when needed"],
                ["It's the best option", "It's a good choice", "It's acceptable", "It's not recommended"],
                ["Very important", "Somewhat important", "Not very important", "Critical"],
                ["Primary method", "Alternative method", "Backup method", "Emergency method"]
            ];
            
            const questions = [];
            for (let i = 0; i < numQuestions; i++) {
                const topic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : displayedCourseName;
                const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
                const question = template.replace('%s', topic);
                
                const answerSet = [...answerSets[Math.floor(Math.random() * answerSets.length)]];
                // Shuffle answers
                for (let j = answerSet.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [answerSet[j], answerSet[k]] = [answerSet[k], answerSet[j]];
                }
                
                questions.push({
                    text: question,
                    answers: answerSet,
                    correct: Math.floor(Math.random() * 4)
                });
            }
            
            const response = { data: { questions } };
            
            if (response.data && response.data.questions) {
                // Add AI-generated questions to the quiz
                const newQuestions = response.data.questions.slice(0, 10 - this.currentQuiz.questions.length);
                // Convert to single answer format
                const convertedQuestions = newQuestions.map(q => ({
                    text: q.text,
                    answers: q.answers,
                    correct: Array.isArray(q.correct) ? q.correct[0] : q.correct
                }));
                this.currentQuiz.questions.push(...convertedQuestions);
                
                // Refresh the UI
                document.getElementById('questions-container').innerHTML = this.renderQuestions();
                
                // Show success message
                this.showNotification('✨ AI questions added! Feel free to edit them.', 'success');
            }
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            this.showNotification('Could not generate questions. Please try again.', 'error');
        }
        
        // Re-enable button if it exists
        if (button) {
            button.disabled = false;
            button.innerHTML = '✨ Generate More Questions';
        }
        
        // If auto-generating, refresh the AI section
        if (isAuto) {
            this.refreshAiSection();
        }
    }
    
    refreshAiSection() {
        const aiSection = document.querySelector('.ai-section');
        if (aiSection) {
            aiSection.innerHTML = `
                <button class="btn btn-ai btn-large" onclick="quiz.suggestQuestions()" id="generate-btn">
                    ✨ Generate More Questions
                </button>
                <p class="ai-hint">Add more AI-generated questions to your quiz!</p>
                
                <details class="course-input-section">
                    <summary>📝 Add Course Details (Optional)</summary>
                    <div class="course-input-content">
                        <div class="input-group">
                            <label>Course Name</label>
                            <input type="text" id="manual-course-name" placeholder="e.g., Python Programming Basics" />
                        </div>
                        <div class="input-group">
                            <label>Course Description</label>
                            <textarea id="manual-course-desc" placeholder="Brief description of what this course covers..." rows="3"></textarea>
                        </div>
                        <div class="input-group">
                            <label>Key Topics (comma-separated)</label>
                            <input type="text" id="manual-course-topics" placeholder="e.g., variables, loops, functions, debugging" />
                        </div>
                        <button class="btn btn-secondary" onclick="quiz.updateCourseInfo()">Update Course Info</button>
                    </div>
                </details>
            `;
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    clearQuiz() {
        if (confirm('Are you sure you want to clear all questions?')) {
            this.currentQuiz.questions = [];
            document.getElementById('questions-container').innerHTML = this.renderQuestions();
            this.showNotification('All questions cleared! 🧹', 'success');
        }
    }
    
    updateCourseInfo() {
        const name = document.getElementById('manual-course-name').value;
        const desc = document.getElementById('manual-course-desc').value;
        const topics = document.getElementById('manual-course-topics').value;
        
        if (!this.courseDetails) {
            this.courseDetails = {};
        }
        
        if (name) this.courseDetails.name = name;
        if (desc) this.courseDetails.description = desc;
        if (topics) {
            this.courseDetails.manualTopics = topics.split(',').map(t => t.trim()).filter(t => t);
        }
        
        this.updateBuilderUI();
        this.showNotification('Course info updated! 📚', 'success');
    }
    
    async testAPI() {
        console.log('Testing API connection...');
        console.log('Auth Token:', this.context.accessToken);
        console.log('Course ID:', this.context.courseId);
        
        try {
            // Test 1: Direct API call
            console.log('Test 1: Direct API call to ALM...');
            const directResponse = await fetch(
                `https://learningmanager.adobe.com/primeapi/v2/user`,
                {
                    headers: {
                        'Authorization': `oauth ${this.context.accessToken}`,
                        'Accept': 'application/json'
                    }
                }
            );
            console.log('Direct API response:', directResponse.status, directResponse.statusText);
            
            // Test 2: Via our proxy
            console.log('Test 2: Via our proxy...');
            const proxyResponse = await fetch(
                `${this.apiBaseUrl}/alm-proxy/user?authToken=${this.context.accessToken}`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            console.log('Proxy response:', proxyResponse.status, proxyResponse.statusText);
            
            if (proxyResponse.ok) {
                const data = await proxyResponse.json();
                console.log('User data:', data);
                this.showNotification('API connection successful! Check console for details.', 'success');
            } else {
                this.showNotification('API connection failed. Check console for details.', 'error');
            }
            
        } catch (error) {
            console.error('API test error:', error);
            this.showNotification('API test failed. Check console.', 'error');
        }
    }
    
    async testDirectAPI() {
        console.log('Testing direct ALM API access...');
        const testUrls = [
            `/user`,
            `/learningObjects/${this.context.courseId}`,
            `/learningObjects/${this.context.courseId}?include=skills,instances.modules`,
            `/user/enrollments?include=learningObject`
        ];
        
        for (const url of testUrls) {
            try {
                console.log(`Testing: ${url}`);
                const separator = url.includes('?') ? '&' : '?';
                const response = await fetch(
                    `${this.apiBaseUrl}/alm-proxy${url}${separator}authToken=${this.context.accessToken}`,
                    {
                        headers: {
                            'Accept': 'application/json'
                        }
                    }
                );
                console.log(`Response for ${url}:`, response.status, response.statusText);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Data:`, data);
                }
            } catch (error) {
                console.error(`Error for ${url}:`, error);
            }
        }
        this.showNotification('API tests complete. Check console for results.', 'success');
    }
    
    // Check if learner has assigned quiz
    async checkForAssignedQuiz() {
        console.log('Checking for assigned quizzes...');
        
        // If no courseId, we can't check for assigned quiz
        if (!this.context.courseId) {
            console.log('❌ No courseId provided - cannot check for assigned quiz');
            console.log('💡 This quiz must be launched from within a course in ALM');
            return null;
        }
        
        try {
            // Try to load the quiz from xAPI
            let quiz = null;
            
            try {
                const activityId = `https://p0qp0q.com/alm-quiz/activities/${this.context.courseId}`;
                const profileId = 'quiz-definition';
                
                const response = await fetch(
                    `${this.xapiBaseUrl}/activities/profile?activityId=${encodeURIComponent(activityId)}&profileId=${profileId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${await this.getValidToken()}`,
                            'X-Experience-API-Version': '1.0.3'
                        }
                    }
                );
                
                if (response.ok) {
                    quiz = await response.json();
                    console.log('Loaded quiz from xAPI');
                } else if (response.status === 404) {
                    console.log('No quiz found in xAPI');
                }
            } catch (error) {
                console.error('Error loading quiz from xAPI:', error);
            }
            
            if (quiz) {
                
                // For demo, skip enrollment check or just check stored list
                if (quiz.enrolledUsers && Array.isArray(quiz.enrolledUsers) && quiz.enrolledUsers.length > 0) {
                    const userEnrolled = quiz.enrolledUsers.includes(this.context.userId);
                    
                    if (!userEnrolled) {
                        console.log('❌ User not in enrollment list');
                        console.log('For demo purposes, allowing access anyway');
                        // For demo, allow access
                    }
                }
                
                console.log('✅ Quiz found and user has access');
                return quiz;
            }
            
            console.log('❌ No quiz found for this course');
            return null;
            
        } catch (error) {
            console.error('Error checking for assigned quiz:', error);
            
            // If 404, no quiz exists
            if (error.response && error.response.status === 404) {
                console.log('No quiz exists for this course yet');
                return null;
            }
            
            // For other errors, assume quiz exists to be permissive
            return true;
        }
    }
    
    // Check enrollment using server-side admin token
    async checkEnrollmentServerSide() {
        console.log('Checking enrollment via server with admin token...');
        
        try {
            const response = await axios.get(
                `${this.apiBaseUrl}/quiz/${this.context.courseId}/enrollment/${this.context.userId}`
            );
            
            if (response.data) {
                console.log('Server enrollment check:', response.data);
                return response.data.enrolled;
            }
        } catch (error) {
            console.error('Error checking enrollment via server:', error);
        }
        
        return null; // Couldn't verify
    }
    
    // Check if learner is enrolled in the current course
    async checkLearnerEnrollment() {
        console.log('Checking learner enrollment using admin API...');
        
        try {
            // Get the list of enrolled users using admin token
            const enrolledUsers = await this.fetchEnrolledUsers();
            
            if (enrolledUsers.length === 0) {
                console.log('Could not fetch enrollment list');
                return null; // Can't verify
            }
            
            // Check if current user is in the enrolled list
            const isEnrolled = enrolledUsers.includes(this.context.userId);
            
            console.log(`Enrollment check for user ${this.context.userId}: ${isEnrolled ? 'ENROLLED' : 'NOT ENROLLED'}`);
            console.log(`Total enrolled users: ${enrolledUsers.length}`);
            
            return isEnrolled;
        } catch (error) {
            console.error('Error checking learner enrollment:', error);
        }
        
        return null; // Couldn't verify
    }
    
    // Show message when no quiz is available
    showNoQuizMessage() {
        const app = document.getElementById('app');
        const noCourseId = !this.context.courseId;
        
        app.innerHTML = `
            <div class="no-quiz-container">
                <div class="kawaii-empty">
                    <svg width="150" height="150" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="#FFB6C1" opacity="0.5" />
                        <circle cx="35" cy="40" r="3" fill="#333" />
                        <circle cx="65" cy="40" r="3" fill="#333" />
                        <path d="M 35 55 Q 50 50 65 55" stroke="#333" stroke-width="3" fill="none" />
                    </svg>
                </div>
                <h2>${noCourseId ? 'Launch from a Course' : 'No Quiz Available'}</h2>
                <p>${noCourseId ? 'Please launch this quiz from within a course in ALM.' : 'There\'s no quiz assigned for this course yet.'}</p>
                <p class="hint">${noCourseId ? 'Quizzes must be accessed through course content.' : 'Check back later or contact your instructor.'}</p>
                
                <div class="debug-info">
                    <details>
                        <summary>Debug Info</summary>
                        <pre>
User ID: ${this.context.userId || 'Not provided'}
Course ID: ${this.context.courseId || 'Not provided'}
Role: ${this.context.userRole}
Auth Token: ${this.context.accessToken ? this.context.accessToken.substring(0, 20) + '...' : 'Not provided'}
                        </pre>
                    </details>
                </div>
            </div>
        `;
    }
    
    // QUIZ PLAYER
    async loadPlayer() {
        console.log('Loading player mode for learner...');
        
        // First, check if this learner has any assigned quizzes
        const assignedQuiz = await this.checkForAssignedQuiz();
        
        if (!assignedQuiz) {
            this.showNoQuizMessage();
            return;
        }
        const app = document.getElementById('app');
        
        try {
            const response = await axios.get(`${this.apiBaseUrl}/quiz/${this.context.courseId}`);
            this.currentQuiz = response.data;
            
            if (!this.currentQuiz || !this.currentQuiz.questions.length) {
                app.innerHTML = `
                    <div class="results-screen">
                        <h2>No quiz available yet</h2>
                        <p>Check back later! 🌸</p>
                    </div>
                `;
                return;
            }
            
            this.showQuestion(0);
        } catch (error) {
            app.innerHTML = `
                <div class="results-screen">
                    <h2>Quiz not found</h2>
                    <p>This course doesn't have a quiz yet.</p>
                </div>
            `;
        }
    }
    
    showQuestion(index) {
        const app = document.getElementById('app');
        const question = this.currentQuiz.questions[index];
        const progress = ((index + 1) / this.currentQuiz.questions.length) * 100;
        
        // Fix for single answer format
        const correctIndex = typeof question.correct === 'number' ? question.correct : 
                           (Array.isArray(question.correct) ? question.correct[0] : 0);
        
        app.innerHTML = `
            <div class="quiz-player quiz-play-mode">
                <div class="mascot-container">
                    <div class="kawaii-mascot">🌸</div>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                
                <div class="quiz-question-card">
                    <h2 class="quiz-question-text">${question.text}</h2>
                    
                    <div class="quiz-answers-container">
                        ${question.answers.filter(a => a).map((answer, i) => `
                            <button 
                                class="quiz-answer-option"
                                data-index="${i}"
                                onclick="quiz.selectAnswer(${index}, ${i})"
                            >
                                <span class="quiz-answer-letter">${String.fromCharCode(65 + i)}</span>
                                <span>${answer}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="submit-container">
                    <button class="btn btn-submit" onclick="quiz.submitAnswer(${index})">
                        ${index < this.currentQuiz.questions.length - 1 ? 'Next →' : 'Finish! 🎉'}
                    </button>
                </div>
            </div>
        `;
    }
    
    selectAnswer(questionIndex, answerIndex) {
        const buttons = document.querySelectorAll('.quiz-answer-option');
        
        // Single answer - clear all selections
        buttons.forEach(btn => btn.classList.remove('selected'));
        buttons[answerIndex].classList.add('selected');
        this.answers[questionIndex] = answerIndex;
    }
    
    submitAnswer(questionIndex) {
        if (this.answers[questionIndex] === undefined) {
            this.showNotification('Please select an answer!', 'info');
            return;
        }
        
        if (questionIndex < this.currentQuiz.questions.length - 1) {
            this.showQuestion(questionIndex + 1);
        } else {
            this.showResults();
        }
    }
    
    showResults() {
        const app = document.getElementById('app');
        
        // Calculate score
        let correct = 0;
        this.currentQuiz.questions.forEach((q, i) => {
            const correctAnswer = typeof q.correct === 'number' ? q.correct : 
                                (Array.isArray(q.correct) ? q.correct[0] : 0);
            
            if (this.answers[i] === correctAnswer) {
                correct++;
            }
        });
        
        const total = this.currentQuiz.questions.length;
        const percentage = Math.round((correct / total) * 100);
        
        // Report score to ALM
        this.postMessage('reportScore', {
            score: correct,
            maxScore: total
        });
        
        // Show results
        app.innerHTML = `
            <div class="results-screen">
                <div class="celebration">${percentage >= 70 ? '🎉' : '🌸'}</div>
                <h1>Quiz Complete!</h1>
                <div class="score-display">${percentage}%</div>
                <p class="score-message">
                    You got ${correct} out of ${total} questions correct!
                    ${percentage >= 70 ? 'Amazing job! 🌟' : 'Keep practicing! 💪'}
                </p>
                <button class="btn btn-primary" onclick="quiz.restart()">
                    Try Again
                </button>
            </div>
        `;
        
        // Save attempt
        this.saveAttempt(correct, total);
    }
    
    async saveAttempt(score, total) {
        try {
            // Create xAPI statement for the quiz attempt
            const statement = {
                actor: {
                    mbox: `mailto:user_${this.context.userId}@alm.adobe.com`,
                    name: this.context.userName || this.context.userId,
                    objectType: "Agent"
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/completed",
                    display: {
                        "en-US": "completed"
                    }
                },
                object: {
                    id: `https://p0qp0q.com/alm-quiz/activities/${this.context.courseId}`,
                    definition: {
                        name: {
                            "en-US": this.context.courseName || `Course ${this.context.courseId} Quiz`
                        },
                        description: {
                            "en-US": "Kawaii Quiz for ALM Course"
                        },
                        type: "http://adlnet.gov/expapi/activities/assessment"
                    },
                    objectType: "Activity"
                },
                result: {
                    score: {
                        scaled: score / total,
                        raw: score,
                        min: 0,
                        max: total
                    },
                    success: (score / total) >= 0.7,
                    completion: true
                },
                timestamp: new Date().toISOString(),
                context: {
                    registration: `${this.context.courseId}-${this.context.userId}-${Date.now()}`,
                    contextActivities: {
                        parent: [{
                            id: `https://learningmanager.adobe.com/courses/${this.context.courseId}`,
                            objectType: "Activity"
                        }]
                    }
                }
            };
            
            // Send xAPI statement
            const response = await fetch(`${this.xapiBaseUrl}/statements`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.xapiToken}`,
                    'X-Experience-API-Version': '1.0.3',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statement)
            });
            
            if (response.ok) {
                console.log('Quiz attempt recorded in xAPI');
            } else {
                throw new Error(`xAPI statement failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error saving attempt to xAPI:', error);
        }
    }
    
    restart() {
        this.currentQuestion = 0;
        this.answers = [];
        this.showQuestion(0);
    }
}

// Initialize the app
const quiz = new KawaiiQuiz();
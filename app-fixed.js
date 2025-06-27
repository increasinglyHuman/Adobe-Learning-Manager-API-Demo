// ⚠️ WARNING: ALM INTEGRATION ONLY - NOT PART OF JAZZYPOP PROJECT ⚠️
// This is the Adobe Learning Manager version of Kawaii Quiz
// DO NOT CONFUSE WITH JazzyPop dashboard components!
// Location: ~/Documents/ALM-Kawaii-Quiz (separate from JazzyPop)

// Kawaii Quiz App v4.1 - ALM Integration Version (FIXED)
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
            accountId: this.params.get('accountId') || this.params.get('account_id') || this.params.get('ACCOUNT_ID') || '1361', // Your account ID
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
        // UPDATED with working credentials from our ELI5 tutorial!
        this.almApi = {
            clientId: '2a59bd38-9b9c-4169-96e3-cae59e0694c2',
            clientSecret: 'd1b4c1ae-a0fd-4536-a0e2-a39123eecdc8',
            refreshToken: '6434ba67c8d0db2de55848951bab677f',
            accessToken: 'd532a29f002fd0f6765323136d147bcc', // Your current valid token
            tokenExpiry: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days from now
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
        });
        
        console.log('Context:', this.context);
        console.log('Is Instructor:', this.context.isInstructor);
    }
    
    getCorrectAuthToken() {
        const authTokens = this.params.getAll('authToken');
        
        if (authTokens.length === 0) {
            return null;
        }
        
        if (authTokens.length === 1) {
            return authTokens[0];
        }
        
        // Multiple tokens - need to pick the right one
        // The longer token is typically the API token
        let apiToken = authTokens[0];
        for (let token of authTokens) {
            if (token.length > apiToken.length) {
                apiToken = token;
            }
        }
        
        console.log('Selected API token from multiple authTokens:', apiToken.substring(0, 30) + '...');
        return apiToken;
    }
    
    async init() {
        console.log('Initializing Kawaii Quiz...');
        
        // Show loading screen
        this.showLoading();
        
        // Check context and load appropriate view
        if (this.context.isInstructor) {
            console.log('Loading instructor view...');
            await this.loadBuilder();
        } else {
            console.log('Loading learner view...');
            await this.loadLearnerView();
        }
    }
    
    showLoading() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="loading-screen">
                <div class="kawaii-loader">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="#FFB6C1" />
                        <circle cx="35" cy="40" r="3" fill="#333" />
                        <circle cx="65" cy="40" r="3" fill="#333" />
                        <path d="M 35 60 Q 50 70 65 60" stroke="#333" stroke-width="3" fill="none" />
                    </svg>
                    <div class="bounce-animation">Loading...</div>
                </div>
            </div>
        `;
    }
    
    // Get valid xAPI token for quiz tracking
    async getValidToken() {
        // Check if token is expired or about to expire (within 5 minutes)
        if (!this.oauth.accessToken || (this.oauth.tokenExpiry && new Date() >= new Date(this.oauth.tokenExpiry - 300000))) {
            console.log('xAPI token expired or missing, refreshing...');
            await this.refreshAccessToken();
        }
        
        return this.oauth.accessToken;
    }
    
    // FIXED: Refresh the xAPI access token using refresh token
    async refreshAccessToken() {
        try {
            const tokenUrl = `https://learningmanager.adobe.com/${this.context.accountId}/oauth/token`;
            const response = await fetch(tokenUrl, {
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
    
    // FIXED: Refresh the ALM API access token
    async refreshAlmAccessToken() {
        try {
            const tokenUrl = `https://learningmanager.adobe.com/${this.context.accountId}/oauth/token`;
            const response = await fetch(tokenUrl, {
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
    
    // FIXED: Make ALM API calls with proper headers
    async makeAlmApiCall(endpoint, options = {}) {
        const token = await this.getValidAlmToken();
        const url = `https://learningmanager.adobe.com/primeapi/v2/${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.api+json', // CRITICAL: Use the correct media type!
                'Content-Type': 'application/vnd.api+json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            console.error('ALM API call failed:', response.status, await response.text());
            throw new Error(`ALM API call failed: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Example: Get course details
    async getCourseDetails() {
        try {
            if (!this.context.courseId) {
                console.log('No course ID available');
                return null;
            }
            
            const data = await this.makeAlmApiCall(`learningObjects/${this.context.courseId}`);
            console.log('Course details:', data);
            return data;
        } catch (error) {
            console.error('Error getting course details:', error);
            return null;
        }
    }
    
    // Example: Get user enrollments
    async getUserEnrollments() {
        try {
            const userId = this.context.userId || 'me';
            const data = await this.makeAlmApiCall(`users/${userId}/userLearningObjects`);
            console.log('User enrollments:', data);
            return data;
        } catch (error) {
            console.error('Error getting enrollments:', error);
            return null;
        }
    }
    
    postMessage(type, data) {
        // DISABLED: ALM kills the window if it receives unrecognized messages
        console.log('PostMessage disabled to prevent ALM termination:', type, data);
    }
    
    // QUIZ BUILDER
    async loadBuilder() {
        const app = document.getElementById('app');
        
        // Test the API connection
        console.log('Testing ALM API connection...');
        try {
            const courseDetails = await this.getCourseDetails();
            console.log('Successfully connected to ALM API!', courseDetails);
        } catch (error) {
            console.error('Failed to connect to ALM API:', error);
        }
        
        app.innerHTML = `
            <div class="quiz-builder">
                <h1>🌸 Kawaii Quiz Builder</h1>
                <div class="api-status">
                    <h3>API Connection Status</h3>
                    <p>Account ID: ${this.context.accountId}</p>
                    <p>User ID: ${this.context.userId}</p>
                    <p>Course ID: ${this.context.courseId}</p>
                    <p>ALM API Token: ${this.almApi.accessToken ? '✅ Active' : '❌ Missing'}</p>
                </div>
                <button onclick="quiz.testApiConnection()">Test API Connection</button>
                <p>Builder interface coming soon...</p>
            </div>
        `;
    }
    
    // Test API connection
    async testApiConnection() {
        console.log('Testing API connections...');
        
        try {
            // Test ALM API
            console.log('1. Testing ALM API...');
            const users = await this.makeAlmApiCall('users?page[limit]=5');
            console.log('✅ ALM API working! Found users:', users);
            
            // Test course details if we have a course ID
            if (this.context.courseId) {
                console.log('2. Testing course details...');
                const course = await this.getCourseDetails();
                console.log('✅ Course details retrieved:', course);
            }
            
            alert('API connection successful! Check console for details.');
        } catch (error) {
            console.error('❌ API test failed:', error);
            alert('API connection failed! Check console for details.');
        }
    }
    
    // LEARNER VIEW
    async loadLearnerView() {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="learner-view">
                <h1>🌸 Kawaii Quiz</h1>
                <div class="api-status">
                    <h3>Learner Status</h3>
                    <p>Welcome, ${this.context.userName || 'Learner'}!</p>
                    <p>Course: ${this.context.courseName || 'Unknown'}</p>
                </div>
                <button onclick="quiz.startQuiz()">Start Quiz</button>
            </div>
        `;
    }
    
    startQuiz() {
        alert('Quiz functionality coming soon!');
    }
}

// Initialize on load
let quiz;
window.addEventListener('DOMContentLoaded', () => {
    quiz = new KawaiiQuiz();
    quiz.init();
});
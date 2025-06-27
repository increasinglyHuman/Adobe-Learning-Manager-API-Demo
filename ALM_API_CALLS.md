# ALM Quiz App - All ALM Communication Points

## 1. Initial Page Load
- **URL Parameters** received from ALM:
  - userId, courseId, authToken (multiple), locale, userRole, etc.
  - See lines 10-43 in app.js

## 2. PostMessage Communications (app → ALM)
Located in `init()` method (lines 92-110):

```javascript
// a) Notify ALM we're ready
this.postMessage('ready', {});

// b) Request context from ALM  
this.postMessage('request-context', {});

// c) Request course data
this.postMessage('request-course-data', { courseId: this.context.courseId });

// d) ALM native extension format
window.parent.postMessage({
    type: 'ALM_EXTENSION_APP',
    eventType: 'getCourseData',
    courseId: this.context.courseId
}, '*');
```

## 3. Message Listeners (ALM → app)
Lines 67-87: Listens for messages from ALM:
- `alm-context` - Updates context with ALM data
- `course-data-response` - Receives course details

## 4. API Calls to Backend

### a) Check Assigned Quiz (lines 801-810)
```javascript
GET ${this.apiBaseUrl}/quiz/assigned
Params: userId, courseId, authToken
```

### b) Fetch Course Details via Proxy (lines 296-311)
```javascript
GET ${this.apiBaseUrl}/alm-proxy/learningObjects/${courseId}
GET ${this.apiBaseUrl}/alm-proxy/user/enrollments
etc.
```

### c) Test Direct ALM API (lines 725-743)
```javascript
// Direct call (usually fails due to CORS)
GET https://learningmanager.adobe.com/primeapi/v2/user

// Via proxy
GET ${this.apiBaseUrl}/alm-proxy/user?authToken=${token}
```

### d) Load Quiz for Player (line 870)
```javascript
GET ${this.apiBaseUrl}/quiz/${this.context.courseId}
```

### e) Save Quiz (line 411)
```javascript
POST ${this.apiBaseUrl}/quiz
Body: { courseId, questions }
```

## 5. Key Issues to Check:
1. Is `this.apiBaseUrl` correct? (https://p0qp0q.com/api/kawaii-quiz)
2. Are the proxy endpoints working?
3. Is the authToken being passed correctly?
4. Are CORS headers set up on the backend?
5. Is the backend running and accessible?
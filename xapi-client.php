<?php
// xAPI Client for ALM
// Handles quiz persistence via xAPI statements

class XAPIClient {
    private $config;
    private $accessToken;
    
    public function __construct($configPath = null) {
        if ($configPath && file_exists($configPath)) {
            $this->config = require($configPath);
        } else {
            // Default config path
            $this->config = require(__DIR__ . '/config.php');
        }
        
        $this->accessToken = $this->config['xapi']['admin']['accessToken'];
    }
    
    /**
     * Refresh the access token using refresh token
     */
    public function refreshAccessToken() {
        $tokenUrl = 'https://learningmanager.adobe.com/oauth/token';
        $postData = [
            'refresh_token' => $this->config['xapi']['admin']['refreshToken'],
            'client_id' => $this->config['xapi']['admin']['clientId'],
            'client_secret' => $this->config['xapi']['admin']['clientSecret'],
            'grant_type' => 'refresh_token'
        ];
        
        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $tokens = json_decode($response, true);
            if (isset($tokens['access_token'])) {
                $this->accessToken = $tokens['access_token'];
                // TODO: Update config file with new access token
                return $tokens['access_token'];
            }
        }
        
        throw new Exception('Failed to refresh access token: ' . $response);
    }
    
    /**
     * Send an xAPI statement
     * ALM uses xAPI via their endpoint
     */
    public function sendStatement($statement) {
        $url = $this->config['xapi']['admin']['baseUrl'] . '/xapi/statements';
        
        // Ensure statement has required fields
        if (!isset($statement['id'])) {
            $statement['id'] = $this->generateUUID();
        }
        if (!isset($statement['timestamp'])) {
            $statement['timestamp'] = date('c');
        }
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($statement));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json',
            'X-Experience-API-Version: 1.0.3',
            'Accept: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($httpCode === 401) {
            // Try refreshing token and retry
            $this->refreshAccessToken();
            return $this->sendStatement($statement);
        }
        
        return [
            'success' => $httpCode === 200 || $httpCode === 204,
            'httpCode' => $httpCode,
            'response' => $response,
            'error' => $error,
            'url' => $url
        ];
    }
    
    /**
     * Get statements by activity ID
     */
    public function getStatements($activityId, $limit = 10) {
        $params = [
            'activity' => $activityId,
            'limit' => $limit
        ];
        
        $url = $this->config['xapi']['admin']['baseUrl'] . '/xapi/statements?' . http_build_query($params);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->accessToken,
            'X-Experience-API-Version: 1.0.3'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 401) {
            // Try refreshing token and retry
            $this->refreshAccessToken();
            return $this->getStatements($activityId, $limit);
        }
        
        if ($httpCode === 200) {
            return json_decode($response, true);
        }
        
        return null;
    }
    
    /**
     * Save quiz data as xAPI statement
     */
    public function saveQuiz($quizData) {
        $activityId = 'https://p0qp0q.com/kawaii-quiz/' . $quizData['courseId'];
        
        $statement = [
            'actor' => [
                'mbox' => 'mailto:' . ($quizData['instructorEmail'] ?? 'admin@p0qp0q.com'),
                'name' => $quizData['instructorName'] ?? 'Admin',
                'objectType' => 'Agent'
            ],
            'verb' => [
                'id' => 'http://adlnet.gov/expapi/verbs/created',
                'display' => ['en-US' => 'created']
            ],
            'object' => [
                'id' => $activityId,
                'objectType' => 'Activity',
                'definition' => [
                    'name' => ['en-US' => 'Kawaii Quiz: ' . $quizData['courseName']],
                    'description' => ['en-US' => 'Interactive quiz for ' . $quizData['courseName']],
                    'type' => 'http://adlnet.gov/expapi/activities/assessment',
                    'extensions' => [
                        'https://p0qp0q.com/xapi/quiz-data' => $quizData
                    ]
                ]
            ],
            'context' => [
                'platform' => 'Adobe Learning Manager',
                'language' => 'en-US',
                'extensions' => [
                    'https://p0qp0q.com/xapi/course-id' => $quizData['courseId']
                ]
            ]
        ];
        
        return $this->sendStatement($statement);
    }
    
    /**
     * Load quiz data from xAPI
     */
    public function loadQuiz($courseId) {
        $activityId = 'https://p0qp0q.com/kawaii-quiz/' . $courseId;
        $statements = $this->getStatements($activityId, 1);
        
        if ($statements && isset($statements['statements']) && count($statements['statements']) > 0) {
            $latestStatement = $statements['statements'][0];
            if (isset($latestStatement['object']['definition']['extensions']['https://p0qp0q.com/xapi/quiz-data'])) {
                return $latestStatement['object']['definition']['extensions']['https://p0qp0q.com/xapi/quiz-data'];
            }
        }
        
        return null;
    }
    
    /**
     * Save quiz completion
     */
    public function saveQuizCompletion($completionData) {
        $activityId = 'https://p0qp0q.com/kawaii-quiz/' . $completionData['courseId'];
        
        $statement = [
            'actor' => [
                'mbox' => 'mailto:' . $completionData['learnerEmail'],
                'name' => $completionData['learnerName'],
                'objectType' => 'Agent'
            ],
            'verb' => [
                'id' => 'http://adlnet.gov/expapi/verbs/completed',
                'display' => ['en-US' => 'completed']
            ],
            'object' => [
                'id' => $activityId,
                'objectType' => 'Activity',
                'definition' => [
                    'name' => ['en-US' => 'Kawaii Quiz: ' . $completionData['courseName']],
                    'type' => 'http://adlnet.gov/expapi/activities/assessment'
                ]
            ],
            'result' => [
                'score' => [
                    'raw' => $completionData['score'],
                    'max' => $completionData['maxScore'],
                    'scaled' => $completionData['score'] / $completionData['maxScore']
                ],
                'success' => $completionData['passed'],
                'completion' => true,
                'duration' => 'PT' . $completionData['duration'] . 'S'
            ],
            'context' => [
                'platform' => 'Adobe Learning Manager',
                'language' => 'en-US',
                'extensions' => [
                    'https://p0qp0q.com/xapi/course-id' => $completionData['courseId'],
                    'https://p0qp0q.com/xapi/responses' => $completionData['responses']
                ]
            ]
        ];
        
        return $this->sendStatement($statement);
    }
    
    /**
     * Generate UUID v4
     */
    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

// API endpoints for AJAX calls
if (isset($_SERVER['REQUEST_METHOD'])) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
    
    try {
        $xapi = new XAPIClient();
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($_GET['action'] ?? '') {
            case 'save_quiz':
                $result = $xapi->saveQuiz($input);
                echo json_encode($result);
                break;
                
            case 'load_quiz':
                $courseId = $_GET['courseId'] ?? $input['courseId'];
                $quiz = $xapi->loadQuiz($courseId);
                echo json_encode(['success' => true, 'quiz' => $quiz]);
                break;
                
            case 'save_completion':
                $result = $xapi->saveQuizCompletion($input);
                echo json_encode($result);
                break;
                
            case 'test':
                // Test the connection
                $testStatement = [
                    'actor' => [
                        'mbox' => 'mailto:test@p0qp0q.com',
                        'objectType' => 'Agent'
                    ],
                    'verb' => [
                        'id' => 'http://adlnet.gov/expapi/verbs/tested',
                        'display' => ['en-US' => 'tested']
                    ],
                    'object' => [
                        'id' => 'https://p0qp0q.com/kawaii-quiz/test',
                        'objectType' => 'Activity'
                    ]
                ];
                $result = $xapi->sendStatement($testStatement);
                echo json_encode($result);
                break;
                
            default:
                echo json_encode(['error' => 'Invalid action']);
        }
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
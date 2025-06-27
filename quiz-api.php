<?php
/**
 * ALM Quiz Storage API
 * 
 * CRITICAL: This API is strictly isolated to handle ONLY quiz data
 * - Never touches JazzyPop/Ferrari directories
 * - Uses dedicated quiz-data directory
 * - Strict input validation
 * - No external dependencies
 */

// Security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://learningmanager.adobe.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// CRITICAL: Define isolated data directory
define('QUIZ_DATA_DIR', __DIR__ . '/quiz-data');
define('QUIZ_DIR', QUIZ_DATA_DIR . '/quizzes');
define('RESULTS_DIR', QUIZ_DATA_DIR . '/results');

// Ensure directories exist with proper permissions
if (!file_exists(QUIZ_DATA_DIR)) {
    mkdir(QUIZ_DATA_DIR, 0755, true);
}
if (!file_exists(QUIZ_DIR)) {
    mkdir(QUIZ_DIR, 0755, true);
}
if (!file_exists(RESULTS_DIR)) {
    mkdir(RESULTS_DIR, 0755, true);
}

// Create .htaccess to prevent directory listing
$htaccess = QUIZ_DATA_DIR . '/.htaccess';
if (!file_exists($htaccess)) {
    file_put_contents($htaccess, "Options -Indexes\nDeny from all");
}

/**
 * Strict input sanitization - only alphanumeric, dash, underscore, colon
 */
function sanitizeId($id) {
    return preg_replace('/[^a-zA-Z0-9_:\-]/', '_', $id);
}

/**
 * Validate quiz structure
 */
function validateQuiz($quiz) {
    if (!isset($quiz['courseId']) || !isset($quiz['questions']) || !is_array($quiz['questions'])) {
        return false;
    }
    
    // Validate each question
    foreach ($quiz['questions'] as $q) {
        if (!isset($q['text']) || !isset($q['answers']) || !is_array($q['answers']) || count($q['answers']) < 2) {
            return false;
        }
        if (!isset($q['correct']) || !is_numeric($q['correct'])) {
            return false;
        }
    }
    
    return true;
}

/**
 * Safe file operations
 */
function safeReadFile($filepath) {
    // Ensure file is within allowed directory
    $realpath = realpath($filepath);
    if ($realpath === false || strpos($realpath, realpath(QUIZ_DATA_DIR)) !== 0) {
        return false;
    }
    
    return file_get_contents($realpath);
}

function safeWriteFile($filepath, $content) {
    // Ensure file will be within allowed directory
    $dir = dirname($filepath);
    $realdir = realpath($dir);
    if ($realdir === false || strpos($realdir, realpath(QUIZ_DATA_DIR)) !== 0) {
        return false;
    }
    
    return file_put_contents($filepath, $content, LOCK_EX);
}

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'POST':
            handlePost($action);
            break;
            
        case 'GET':
            handleGet($action);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log('Quiz API Error: ' . $e->getMessage());
    sendError('Internal server error', 500);
}

/**
 * Handle POST requests
 */
function handlePost($action) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'save-quiz':
            saveQuiz($input);
            break;
            
        case 'save-result':
            saveResult($input);
            break;
            
        default:
            sendError('Invalid action', 400);
    }
}

/**
 * Handle GET requests
 */
function handleGet($action) {
    switch ($action) {
        case 'load-quiz':
            loadQuiz($_GET['courseId'] ?? '');
            break;
            
        case 'list-quizzes':
            listQuizzes();
            break;
            
        case 'get-results':
            getResults($_GET['courseId'] ?? '', $_GET['userId'] ?? '');
            break;
            
        default:
            sendError('Invalid action', 400);
    }
}

/**
 * Save quiz (instructor)
 */
function saveQuiz($data) {
    if (!$data || !isset($data['quiz'])) {
        sendError('Invalid quiz data', 400);
        return;
    }
    
    $quiz = $data['quiz'];
    if (!validateQuiz($quiz)) {
        sendError('Invalid quiz structure', 400);
        return;
    }
    
    $courseId = sanitizeId($quiz['courseId']);
    $filename = QUIZ_DIR . '/quiz_' . $courseId . '.json';
    
    // Add metadata
    $saveData = [
        'quiz' => $quiz,
        'metadata' => [
            'savedAt' => date('c'),
            'savedBy' => sanitizeId($data['metadata']['userId'] ?? 'unknown'),
            'version' => '1.0'
        ]
    ];
    
    $result = safeWriteFile($filename, json_encode($saveData, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        sendError('Failed to save quiz', 500);
    } else {
        sendSuccess([
            'message' => 'Quiz saved successfully',
            'courseId' => $courseId
        ]);
    }
}

/**
 * Load quiz
 */
function loadQuiz($courseId) {
    if (!$courseId) {
        sendError('Course ID required', 400);
        return;
    }
    
    $courseId = sanitizeId($courseId);
    $filename = QUIZ_DIR . '/quiz_' . $courseId . '.json';
    
    if (!file_exists($filename)) {
        sendError('Quiz not found', 404);
        return;
    }
    
    $content = safeReadFile($filename);
    if ($content === false) {
        sendError('Failed to read quiz', 500);
        return;
    }
    
    $data = json_decode($content, true);
    if (!$data) {
        sendError('Invalid quiz data', 500);
        return;
    }
    
    sendSuccess($data);
}

/**
 * Save quiz result (learner)
 */
function saveResult($data) {
    if (!isset($data['courseId']) || !isset($data['userId']) || !isset($data['results'])) {
        sendError('Missing required fields', 400);
        return;
    }
    
    $courseId = sanitizeId($data['courseId']);
    $userId = sanitizeId($data['userId']);
    $timestamp = date('Y-m-d_H-i-s');
    
    $filename = RESULTS_DIR . '/result_' . $courseId . '_' . $userId . '_' . $timestamp . '.json';
    
    // Validate results structure
    if (!is_array($data['results']['answers'])) {
        sendError('Invalid results structure', 400);
        return;
    }
    
    $saveData = [
        'courseId' => $courseId,
        'userId' => $userId,
        'results' => $data['results'],
        'metadata' => [
            'submittedAt' => date('c'),
            'completionTime' => $data['completionTime'] ?? null,
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]
    ];
    
    $result = safeWriteFile($filename, json_encode($saveData, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        sendError('Failed to save results', 500);
    } else {
        sendSuccess([
            'message' => 'Results saved successfully',
            'timestamp' => $saveData['metadata']['submittedAt']
        ]);
    }
}

/**
 * Get quiz results
 */
function getResults($courseId, $userId) {
    $results = [];
    $pattern = RESULTS_DIR . '/result_';
    
    if ($courseId) {
        $pattern .= sanitizeId($courseId) . '_';
    }
    if ($userId) {
        $pattern .= sanitizeId($userId) . '_';
    }
    $pattern .= '*.json';
    
    $files = glob($pattern);
    
    foreach ($files as $file) {
        $content = safeReadFile($file);
        if ($content !== false) {
            $data = json_decode($content, true);
            if ($data) {
                $results[] = $data;
            }
        }
    }
    
    // Sort by date, newest first
    usort($results, function($a, $b) {
        return strtotime($b['metadata']['submittedAt']) - strtotime($a['metadata']['submittedAt']);
    });
    
    sendSuccess(['results' => $results]);
}

/**
 * List available quizzes
 */
function listQuizzes() {
    $quizzes = [];
    $files = glob(QUIZ_DIR . '/quiz_*.json');
    
    foreach ($files as $file) {
        $content = safeReadFile($file);
        if ($content !== false) {
            $data = json_decode($content, true);
            if ($data && isset($data['quiz'])) {
                $quizzes[] = [
                    'courseId' => $data['quiz']['courseId'],
                    'courseName' => $data['quiz']['courseName'] ?? 'Unnamed Course',
                    'questionCount' => count($data['quiz']['questions']),
                    'savedAt' => $data['metadata']['savedAt'] ?? 'Unknown',
                    'savedBy' => $data['metadata']['savedBy'] ?? 'Unknown'
                ];
            }
        }
    }
    
    // Sort by save date, newest first
    usort($quizzes, function($a, $b) {
        return strtotime($b['savedAt']) - strtotime($a['savedAt']);
    });
    
    sendSuccess(['quizzes' => $quizzes]);
}

/**
 * Response helpers
 */
function sendSuccess($data) {
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    exit;
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

// Log that the API is being accessed (for monitoring)
error_log('Quiz API accessed: ' . $_SERVER['REQUEST_METHOD'] . ' ' . $action . ' from ' . $_SERVER['REMOTE_ADDR']);
?>
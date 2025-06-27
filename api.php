<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load environment variables from .env file
function loadEnv() {
    // Try multiple possible locations
    $envFiles = [
        '/var/www/html/LO/.env',
        '/var/www/p0qp0q.com/LO/.env',
        __DIR__ . '/.env'
    ];
    
    foreach ($envFiles as $envFile) {
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    $value = trim($value);
                    // Remove quotes if present
                    $value = trim($value, '"\'');
                    putenv("$key=$value");
                }
            }
            break; // Stop after first found file
        }
    }
}

loadEnv();

// Directory to store quiz JSON files
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

// Parse the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove the base path to get the API endpoint
$basePath = '/api/kawaii-quiz';
if (strpos($path, $basePath) === 0) {
    $endpoint = substr($path, strlen($basePath));
} else {
    // Handle direct access to api.php
    $endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
}

// Function to check if user is enrolled in course using admin token
function checkUserEnrollment($userId, $courseId) {
    $adminToken = getenv('ALM_ADMIN_TOKEN');
    if (!$adminToken) {
        error_log('No ALM_ADMIN_TOKEN found in environment');
        return null;
    }
    
    // ALM API endpoint to check course enrollments
    $url = "https://learningmanager.adobe.com/primeapi/v2/learningObjects/{$courseId}/enrollments";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $adminToken,
        'Accept: application/vnd.api+json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("Failed to fetch enrollments: HTTP $httpCode");
        return null;
    }
    
    $data = json_decode($response, true);
    
    // Check if user is in the enrollment list
    if (isset($data['data']) && is_array($data['data'])) {
        foreach ($data['data'] as $enrollment) {
            if (isset($enrollment['relationships']['learner']['data']['id'])) {
                if ($enrollment['relationships']['learner']['data']['id'] === $userId) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Route the request
if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('/^\/quiz\/(.+)$/', $endpoint, $matches)) {
    // GET /quiz/{courseId}
    $courseId = $matches[1];
    $filename = $dataDir . '/quiz_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $courseId) . '.json';
    
    if (file_exists($filename)) {
        echo file_get_contents($filename);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $endpoint === '/quiz') {
    // POST /quiz
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['courseId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid quiz data']);
        exit;
    }
    
    $courseId = $input['courseId'];
    $filename = $dataDir . '/quiz_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $courseId) . '.json';
    
    // Save the quiz
    file_put_contents($filename, json_encode($input, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true, 'message' => 'Quiz saved']);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $endpoint === '/ai-suggestions') {
    // POST /ai-suggestions - Generate quiz questions
    $input = json_decode(file_get_contents('php://input'), true);
    
    $courseName = $input['courseName'] ?? 'General Knowledge';
    $topics = $input['topics'] ?? [];
    
    // Simple template-based question generation
    $questionTemplates = [
        "What is the main purpose of %s?",
        "Which of the following best describes %s?",
        "When should you use %s?",
        "What is an important characteristic of %s?",
        "Which statement about %s is correct?",
        "What is a key benefit of %s?",
        "How does %s typically work?",
        "What should you consider when using %s?"
    ];
    
    $answerTemplates = [
        ["It helps with efficiency", "It reduces complexity", "It improves performance", "It enhances security"],
        ["Always use it", "Use it sometimes", "Never use it", "Use it when needed"],
        ["It's the best option", "It's a good choice", "It's acceptable", "It's not recommended"],
        ["Very important", "Somewhat important", "Not very important", "Critical"],
        ["Primary method", "Alternative method", "Backup method", "Emergency method"]
    ];
    
    $questions = [];
    
    // Generate 5 questions
    for ($i = 0; $i < 5; $i++) {
        $topic = !empty($topics) ? $topics[array_rand($topics)] : $courseName;
        $template = $questionTemplates[array_rand($questionTemplates)];
        $question = sprintf($template, $topic);
        
        $answerSet = $answerTemplates[array_rand($answerTemplates)];
        shuffle($answerSet);
        
        $questions[] = [
            'text' => $question,
            'answers' => $answerSet,
            'correct' => rand(0, 3)
        ];
    }
    
    echo json_encode(['questions' => $questions]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('/^\/quiz\/(.+)\/enrollment\/(.+)$/', $endpoint, $matches)) {
    // GET /quiz/{courseId}/enrollment/{userId}
    $courseId = $matches[1];
    $userId = $matches[2];
    
    $enrolled = checkUserEnrollment($userId, $courseId);
    
    if ($enrolled === null) {
        // Couldn't verify, return success to be permissive
        echo json_encode(['enrolled' => true, 'verified' => false]);
    } else {
        echo json_encode(['enrolled' => $enrolled, 'verified' => true]);
    }
    
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}
?>
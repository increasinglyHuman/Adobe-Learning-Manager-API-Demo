<?php
// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['content']) || empty($input['content'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Course content is required']);
    exit;
}

// Get API key from environment
$apiKey = getenv('ANTHROPIC_API_KEY') ?: $_ENV['ANTHROPIC_API_KEY'] ?? $_SERVER['ANTHROPIC_API_KEY'] ?? null;

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$content = $input['content'];
$quizType = $input['quizType'] ?? 'course';

// Different prompts based on quiz type
if ($quizType === 'fun') {
    $prompt = "Create a fun, engaging quiz with 10 multiple choice questions. The questions should be entertaining, slightly silly, and cover random interesting topics. Make them light-hearted and enjoyable. Each question should have 4 answer options with only one correct answer.";
} else {
    $prompt = "Based on the following course content, create a quiz with 10 multiple choice questions that test understanding of the key concepts. Each question should have 4 answer options with only one correct answer.\n\nCourse content:\n" . $content;
}

// Call Anthropic API
$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey,
    'anthropic-version: 2023-06-01'
]);

$requestData = [
    'model' => 'claude-3-haiku-20240307',
    'max_tokens' => 4000,
    'messages' => [
        [
            'role' => 'user',
            'content' => $prompt . "\n\nReturn the quiz as a JSON object with this structure:\n{\n  \"title\": \"Quiz Title\",\n  \"questions\": [\n    {\n      \"question\": \"Question text\",\n      \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"],\n      \"correctAnswer\": 0\n    }\n  ]\n}\n\nThe correctAnswer should be the index (0-3) of the correct option."
        ]
    ]
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to generate quiz', 'details' => $response]);
    exit;
}

$responseData = json_decode($response, true);

if (!isset($responseData['content'][0]['text'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid response from AI']);
    exit;
}

// Extract JSON from the response
$aiResponse = $responseData['content'][0]['text'];

// Try to find JSON in the response
$jsonStart = strpos($aiResponse, '{');
$jsonEnd = strrpos($aiResponse, '}') + 1;

if ($jsonStart !== false && $jsonEnd !== false) {
    $jsonString = substr($aiResponse, $jsonStart, $jsonEnd - $jsonStart);
    $quiz = json_decode($jsonString, true);
    
    if ($quiz && isset($quiz['questions'])) {
        echo json_encode($quiz);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to parse quiz data']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'No valid JSON found in response']);
}
?>
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'save' && isset($_POST['courseId']) && isset($_POST['quiz'])) {
        $courseId = $_POST['courseId'];
        $quizData = $_POST['quiz'];
        
        // Sanitize courseId for filename
        $filename = $dataDir . '/quiz_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $courseId) . '.json';
        
        // Save quiz
        if (file_put_contents($filename, $quizData)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save quiz']);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['courseId'])) {
    $courseId = $_GET['courseId'];
    $filename = $dataDir . '/quiz_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $courseId) . '.json';
    
    if (file_exists($filename)) {
        header('Content-Type: application/json');
        echo file_get_contents($filename);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
?>
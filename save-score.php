<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'save' && isset($_POST['courseId']) && isset($_POST['score'])) {
        $courseId = $_POST['courseId'];
        $userId = $_POST['userId'] ?? 'unknown';
        $userName = $_POST['userName'] ?? 'Learner';
        $score = intval($_POST['score']);
        $totalQuestions = intval($_POST['totalQuestions'] ?? 10);
        $percentage = round(($score / $totalQuestions) * 100);
        
        // Sanitize courseId for filename
        $filename = $dataDir . '/scores_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $courseId) . '.json';
        
        // Load existing scores or create new structure
        $scorebook = [];
        if (file_exists($filename)) {
            $content = file_get_contents($filename);
            $scorebook = json_decode($content, true);
        }
        
        // Initialize if new
        if (empty($scorebook)) {
            $scorebook = [
                'courseId' => $courseId,
                'scores' => []
            ];
        }
        
        // Count attempts for this user
        $attemptNumber = 1;
        foreach ($scorebook['scores'] as $entry) {
            if ($entry['userId'] === $userId) {
                $attemptNumber++;
            }
        }
        
        // Add new score entry
        $newScore = [
            'userId' => $userId,
            'userName' => $userName,
            'score' => $score,
            'totalQuestions' => $totalQuestions,
            'percentage' => $percentage,
            'timestamp' => date('c'), // ISO 8601 format
            'attemptNumber' => $attemptNumber
        ];
        
        $scorebook['scores'][] = $newScore;
        
        // Save scorebook
        if (file_put_contents($filename, json_encode($scorebook, JSON_PRETTY_PRINT))) {
            echo json_encode([
                'success' => true,
                'attemptNumber' => $attemptNumber,
                'percentage' => $percentage
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save score']);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['courseId'])) {
    $courseId = $_GET['courseId'];
    $filename = $dataDir . '/scores_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $courseId) . '.json';
    
    if (file_exists($filename)) {
        header('Content-Type: application/json');
        echo file_get_contents($filename);
    } else {
        echo json_encode(['courseId' => $courseId, 'scores' => []]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
?>
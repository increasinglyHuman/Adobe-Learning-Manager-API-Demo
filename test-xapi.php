<?php
// Test xAPI Connection to ALM

$config = require('config.php');

// Function to get access token using refresh token
function getAccessToken($config) {
    $tokenUrl = 'https://learningmanager.adobe.com/oauth/token';
    
    $postData = [
        'refresh_token' => $config['xapi']['admin']['refreshToken'],
        'client_id' => $config['xapi']['admin']['clientId'],
        'client_secret' => $config['xapi']['admin']['clientSecret'],
        'grant_type' => 'refresh_token'
    ];
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $tokens = json_decode($response, true);
        return $tokens['access_token'];
    }
    
    return null;
}

// Function to send a test xAPI statement
function sendTestStatement($accessToken, $config) {
    $xapiUrl = $config['xapi']['admin']['baseUrl'] . '/statements';
    
    // Create a simple test statement
    $statement = [
        'actor' => [
            'mbox' => 'mailto:test@example.com',
            'name' => 'Test User',
            'objectType' => 'Agent'
        ],
        'verb' => [
            'id' => 'http://adlnet.gov/expapi/verbs/experienced',
            'display' => [
                'en-US' => 'experienced'
            ]
        ],
        'object' => [
            'id' => 'https://p0qp0q.com/alm-kawaii-quiz/test',
            'objectType' => 'Activity',
            'definition' => [
                'name' => [
                    'en-US' => 'Kawaii Quiz Test'
                ],
                'description' => [
                    'en-US' => 'Testing xAPI connection from Kawaii Quiz'
                ]
            ]
        ],
        'timestamp' => date('c')
    ];
    
    $ch = curl_init($xapiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($statement));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
        'X-Experience-API-Version: 1.0.3'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'httpCode' => $httpCode,
        'response' => $response
    ];
}

// Main test flow
?>
<!DOCTYPE html>
<html>
<head>
    <title>xAPI Connection Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            color: #4CAF50;
            font-weight: bold;
        }
        .error {
            color: #F44336;
            font-weight: bold;
        }
        .code-block {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            overflow-x: auto;
            margin: 10px 0;
        }
        .endpoint {
            background: #e3f2fd;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>🧪 Testing xAPI Connection to ALM</h1>
        <?php

// Check if refresh token is configured
if (empty($config['xapi']['admin']['refreshToken'])) {
    echo '<div class="error">❌ ERROR: No refresh token configured!</div>';
    echo '<p>Please run generate-xapi-token.php first to get your refresh token.</p>';
    echo '</div></body></html>';
    exit;
}

echo '<h2>1. Getting access token...</h2>';
$accessToken = getAccessToken($config);

if (!$accessToken) {
    echo '<div class="error">❌ Failed to get access token!</div>';
    echo '<p>Check your refresh token and credentials.</p>';
    echo '</div></body></html>';
    exit;
}

echo '<div class="success">✅ Got access token!</div>';
echo '<div class="code-block">' . substr($accessToken, 0, 40) . '...</div>';

echo '<h2>2. Sending test xAPI statement...</h2>';
$result = sendTestStatement($accessToken, $config);

echo '<p><strong>HTTP Code:</strong> ' . $result['httpCode'] . '</p>';
echo '<p><strong>Response:</strong></p>';
echo '<div class="code-block">' . htmlspecialchars($result['response']) . '</div>';

if ($result['httpCode'] === 200 || $result['httpCode'] === 204) {
    echo '<div class="success">✅ SUCCESS! xAPI is working!</div>';
    echo '<p>You can now save and retrieve data from ALM\'s LRS.</p>';
} else {
    echo '<div class="error">❌ Failed to send statement.</div>';
    echo '<p>Check the response above for error details.</p>';
}

echo '<h2>3. xAPI Endpoints Available:</h2>';
echo '<div class="endpoint">Statements: ' . $config['xapi']['admin']['baseUrl'] . '/statements</div>';
echo '<div class="endpoint">State: ' . $config['xapi']['admin']['baseUrl'] . '/activities/state</div>';
echo '<div class="endpoint">Activities Profile: ' . $config['xapi']['admin']['baseUrl'] . '/activities/profile</div>';
echo '<div class="endpoint">Agents Profile: ' . $config['xapi']['admin']['baseUrl'] . '/agents/profile</div>';

echo '</div></body></html>';
?>
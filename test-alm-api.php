<?php
// Test ALM API connection directly

$config = require(__DIR__ . '/config.php');
$accessToken = $config['xapi']['admin']['accessToken'];

// Test endpoints
$tests = [
    'User Info' => [
        'url' => 'https://learningmanager.adobe.com/primeapi/v2/user',
        'method' => 'GET'
    ],
    'About' => [
        'url' => 'https://learningmanager.adobe.com/primeapi/v2/about',
        'method' => 'GET'
    ],
    'xAPI About' => [
        'url' => 'https://learningmanager.adobe.com/primeapi/v2/xapi/about',
        'method' => 'GET'
    ]
];

$results = [];

foreach ($tests as $name => $test) {
    $ch = curl_init($test['url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Accept: application/vnd.api+json'
    ]);
    
    if ($test['method'] === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    $results[$name] = [
        'httpCode' => $httpCode,
        'response' => json_decode($response, true) ?: $response,
        'error' => $error
    ];
}

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT);
?>
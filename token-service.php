<?php
// ALM Token Service - Handles token refresh securely server-side
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// In production, these should come from environment variables or secure config
$config = [
    'xapi' => [
        'clientId' => '51c43fb3-b5c8-4d8f-a2f3-7e3e3a9b9c1f',
        'clientSecret' => 'c09c8431-ff64-43bb-82d0-50962dc3ee8f',
        'refreshToken' => '8f5a68fb604e4725b826d8b14c7bceca'
    ],
    'alm' => [
        'clientId' => '9abac94d-9c4c-4e2c-ab9c-091657765599',
        'clientSecret' => '233dce3b-0d2d-40fb-8dd5-11bc882b64a7',
        'refreshToken' => '84dc49e6a0b0e2a2e8426312cf2f9b47'
    ]
];

function refreshToken($type = 'xapi') {
    global $config;
    
    $credentials = $config[$type] ?? $config['xapi'];
    
    $ch = curl_init('https://learningmanager.adobe.com/oauth/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'refresh_token',
        'refresh_token' => $credentials['refreshToken'],
        'client_id' => $credentials['clientId'],
        'client_secret' => $credentials['clientSecret']
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        return [
            'success' => true,
            'access_token' => $data['access_token'],
            'expires_in' => $data['expires_in'],
            'token_type' => $data['token_type']
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Failed to refresh token',
            'status' => $httpCode,
            'response' => $response
        ];
    }
}

// Handle token refresh request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? 'xapi';
    
    $result = refreshToken($type);
    echo json_encode($result);
    exit;
}

// GET request returns current token (for testing)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'message' => 'Token service ready',
        'endpoints' => [
            'POST /' => 'Refresh token (include {"type": "xapi" or "alm"} in body)'
        ]
    ]);
}
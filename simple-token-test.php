<?php
// Simple token refresh test

$refreshToken = '9f446b5018395920b1184768161c2d6e';
$clientId = 'f7728015-753e-4ff6-be61-33f2ee2539f8';
$clientSecret = '42ae9985-88d0-47ee-a24b-a23762238fb1';

// Test both endpoints
$endpoints = [
    'US' => 'https://learningmanager.adobe.com/oauth/token',
    'EU' => 'https://learningmanagereu.adobe.com/oauth/token'
];

echo "<!DOCTYPE html><html><head><title>Token Refresh Test</title></head><body>";
echo "<h1>Testing Token Refresh</h1>";
echo "<pre>";
echo "Refresh Token: " . substr($refreshToken, 0, 20) . "...\n";
echo "Client ID: $clientId\n";
echo "Client Secret: " . substr($clientSecret, 0, 20) . "...\n\n";

foreach ($endpoints as $region => $tokenUrl) {
    echo "\n--- Testing $region endpoint ---\n";
    echo "URL: $tokenUrl\n";
    
    $postData = http_build_query([
        'refresh_token' => $refreshToken,
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'grant_type' => 'refresh_token'
    ]);
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: " . $response . "\n";
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['access_token'])) {
            echo "✅ SUCCESS! Got new access token: " . substr($data['access_token'], 0, 20) . "...\n";
        }
    }
}

echo "</pre></body></html>";
?>
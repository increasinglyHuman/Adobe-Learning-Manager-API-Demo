<?php
// Refresh ALM access token

$config = require(__DIR__ . '/config.php');

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
    'Content-Type: application/x-www-form-urlencoded',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

$result = [
    'httpCode' => $httpCode,
    'response' => json_decode($response, true) ?: $response,
    'error' => $error
];

if ($httpCode === 200 && isset($result['response']['access_token'])) {
    // Update config with new access token
    $newAccessToken = $result['response']['access_token'];
    $newRefreshToken = $result['response']['refresh_token'] ?? $config['xapi']['admin']['refreshToken'];
    
    // Read current config
    $configContent = file_get_contents(__DIR__ . '/config.php');
    
    // Update access token
    $configContent = preg_replace(
        "/'accessToken' => '[^']*'/",
        "'accessToken' => '$newAccessToken'",
        $configContent
    );
    
    // Update refresh token if new one provided
    if (isset($result['response']['refresh_token'])) {
        $configContent = preg_replace(
            "/'refreshToken' => '[^']*'/",
            "'refreshToken' => '$newRefreshToken'",
            $configContent
        );
    }
    
    // Save updated config
    file_put_contents(__DIR__ . '/config.php', $configContent);
    
    $result['message'] = 'Token refreshed successfully and config updated!';
}

header('Content-Type: application/json');
echo json_encode($result, JSON_PRETTY_PRINT);
?>
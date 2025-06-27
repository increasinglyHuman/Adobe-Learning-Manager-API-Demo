<?php
// Manually exchange authorization code for tokens

$config = require('config.php');

// The code you received
$code = '89b7b84d27c476cef55f1dd526ab23f2';

$clientId = $config['xapi']['admin']['clientId'];
$clientSecret = $config['xapi']['admin']['clientSecret'];

// Try different redirect URIs since ALM sent it to root
$redirectUris = [
    'https://p0qp0q.com/',
    'https://p0qp0q.com/alm-kawaii-quiz/oauth-callback.php',
    'https://p0qp0q.com'
];

foreach ($redirectUris as $redirectUri) {
    echo "Trying with redirect URI: $redirectUri\n\n";
    
    $tokenUrl = 'https://learningmanager.adobe.com/oauth/token';
    
    $postData = [
        'code' => $code,
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code'
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
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n\n";
    
    if ($httpCode === 200) {
        $tokens = json_decode($response, true);
        echo "✅ SUCCESS! Got tokens:\n\n";
        echo "Refresh Token: " . $tokens['refresh_token'] . "\n\n";
        echo "Access Token: " . $tokens['access_token'] . "\n\n";
        echo "Add this to your config.php:\n";
        echo "'refreshToken' => '" . $tokens['refresh_token'] . "',\n\n";
        break;
    }
    
    echo "-------------------\n\n";
}
?>
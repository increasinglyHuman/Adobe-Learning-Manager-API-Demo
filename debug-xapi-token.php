<?php
// Debug xAPI Token Exchange

$config = require('config.php');

// Function to get access token with detailed debugging
function debugTokenExchange($config) {
    $tokenUrl = 'https://learningmanager.adobe.com/oauth/token';
    
    $postData = [
        'refresh_token' => $config['xapi']['admin']['refreshToken'],
        'client_id' => $config['xapi']['admin']['clientId'],
        'client_secret' => $config['xapi']['admin']['clientSecret'],
        'grant_type' => 'refresh_token'
    ];
    
    echo "<h2>Token Exchange Debug Info</h2>";
    echo "<h3>Request Details:</h3>";
    echo "<pre>";
    echo "URL: " . $tokenUrl . "\n";
    echo "Client ID: " . $config['xapi']['admin']['clientId'] . "\n";
    echo "Client Secret: " . substr($config['xapi']['admin']['clientSecret'], 0, 10) . "...\n";
    echo "Refresh Token: " . substr($config['xapi']['admin']['refreshToken'], 0, 20) . "...\n";
    echo "</pre>";
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    
    curl_close($ch);
    
    echo "<h3>Response:</h3>";
    echo "<pre>";
    echo "HTTP Code: " . $httpCode . "\n\n";
    echo "Headers:\n" . $headers . "\n";
    echo "Body:\n" . htmlspecialchars($body) . "\n";
    echo "</pre>";
    
    if ($httpCode === 200) {
        $tokens = json_decode($body, true);
        if (isset($tokens['access_token'])) {
            echo '<div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">';
            echo '<h3>✅ Success! Got Access Token</h3>';
            echo '<p>Token: ' . substr($tokens['access_token'], 0, 40) . '...</p>';
            echo '</div>';
        }
    } else {
        echo '<div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">';
        echo '<h3>❌ Failed to get token</h3>';
        echo '<p>Check the error message in the response body above.</p>';
        echo '</div>';
        
        // Try with EU endpoint
        echo '<h3>Trying EU endpoint...</h3>';
        $tokenUrl = 'https://learningmanagereu.adobe.com/oauth/token';
        
        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        
        $response2 = curl_exec($ch);
        $httpCode2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "<pre>";
        echo "EU Endpoint HTTP Code: " . $httpCode2 . "\n";
        echo "EU Response: " . htmlspecialchars($response2) . "\n";
        echo "</pre>";
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Debug xAPI Token Exchange</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        h3 { color: #888; }
        pre {
            background: white;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <h1>🔍 Debug xAPI Token Exchange</h1>
    <?php debugTokenExchange($config); ?>
</body>
</html>
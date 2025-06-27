<?php
// Test different authorization formats for ALM xAPI

$accessToken = '17011366fe530fd13e1c1f953c70f3d2';

// Different auth header formats ALM might expect
$authFormats = [
    'Bearer ' . $accessToken,
    'OAuth ' . $accessToken,
    'oauth ' . $accessToken,
    $accessToken
];

// Test endpoint - just try to GET statements
$endpoint = 'https://learningmanager.adobe.com/primeapi/v2/xapi/statements';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Authorization Formats</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }
        .test { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; }
        .error { background: #f8d7da; }
        pre { background: white; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Testing ALM xAPI Authorization Formats</h1>
    <p>Access Token: <?php echo substr($accessToken, 0, 20); ?>...</p>
    
    <?php
    foreach ($authFormats as $format) {
        echo '<div class="test">';
        echo '<h3>Testing Authorization Header: ' . htmlspecialchars($format ? 'Authorization: ' . $format : 'No Authorization header') . '</h3>';
        
        $headers = [
            'Content-Type: application/json',
            'X-Experience-API-Version: 1.0.3'
        ];
        
        if ($format) {
            $headers[] = 'Authorization: ' . $format;
        }
        
        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $responseHeaders = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        curl_close($ch);
        
        echo '<p>HTTP Code: <strong>' . $httpCode . '</strong></p>';
        
        if ($httpCode === 200) {
            echo '<p class="success">✅ This format works!</p>';
        }
        
        echo '<details>';
        echo '<summary>Response Details</summary>';
        echo '<pre>' . htmlspecialchars($body) . '</pre>';
        echo '</details>';
        echo '</div>';
    }
    ?>
    
    <div class="test">
        <h2>Also Testing Regular ALM API</h2>
        <?php
        // Test if the token works with regular ALM API
        $almEndpoint = 'https://learningmanager.adobe.com/primeapi/v2/user';
        
        $ch = curl_init($almEndpoint);
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: oauth ' . $accessToken,
            'Accept: application/vnd.api+json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo '<p>Regular ALM API Test - HTTP Code: <strong>' . $httpCode . '</strong></p>';
        if ($httpCode === 200) {
            echo '<p class="success">✅ Token works with regular ALM API</p>';
            $data = json_decode($response, true);
            if (isset($data['data'])) {
                echo '<p>User: ' . htmlspecialchars($data['data']['attributes']['name'] ?? 'Unknown') . '</p>';
            }
        } else {
            echo '<p class="error">❌ Token does not work with regular ALM API</p>';
        }
        ?>
    </div>
    
    <div class="test">
        <h2>Conclusion</h2>
        <p>If none of the xAPI formats work but the regular ALM API works, it means:</p>
        <ul>
            <li>The access token is valid for ALM</li>
            <li>But it doesn't have xAPI permissions</li>
            <li>You need an access token from an xAPI-specific OAuth app</li>
        </ul>
    </div>
</body>
</html>
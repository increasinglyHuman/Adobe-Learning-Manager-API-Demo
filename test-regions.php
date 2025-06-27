<?php
// Test both US and EU ALM regions

$accessToken = '17011366fe530fd13e1c1f953c70f3d2';

$regions = [
    'US' => 'https://learningmanager.adobe.com',
    'EU' => 'https://learningmanagereu.adobe.com'
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>Test ALM Regions</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }
        .test { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; }
        .error { background: #f8d7da; }
    </style>
</head>
<body>
    <h1>Testing ALM Regions</h1>
    <p>Access Token: <?php echo substr($accessToken, 0, 20); ?>...</p>
    
    <?php
    foreach ($regions as $region => $baseUrl) {
        echo '<div class="test">';
        echo '<h2>' . $region . ' Region: ' . $baseUrl . '</h2>';
        
        // Test regular API
        $userEndpoint = $baseUrl . '/primeapi/v2/user';
        
        $ch = curl_init($userEndpoint);
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: oauth ' . $accessToken,
            'Accept: application/vnd.api+json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo '<p>Regular API - HTTP Code: <strong>' . $httpCode . '</strong></p>';
        
        if ($httpCode === 200) {
            echo '<p class="success">✅ This is the correct region!</p>';
            $data = json_decode($response, true);
            if (isset($data['data']['attributes']['name'])) {
                echo '<p>User: ' . htmlspecialchars($data['data']['attributes']['name']) . '</p>';
            }
            
            // Now test xAPI
            echo '<h3>Testing xAPI endpoints:</h3>';
            
            $xapiEndpoints = [
                $baseUrl . '/primeapi/v2/xapi/statements',
                $baseUrl . '/xapi/statements',
                'https://captivateprime' . ($region === 'EU' ? 'eu' : '') . '.adobe.com/xapi/statements'
            ];
            
            foreach ($xapiEndpoints as $xapi) {
                $ch = curl_init($xapi);
                curl_setopt($ch, CURLOPT_HTTPGET, true);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: oauth ' . $accessToken,
                    'X-Experience-API-Version: 1.0.3'
                ]);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                echo '<p>' . $xapi . ' - HTTP: <strong>' . $httpCode . '</strong></p>';
                if ($httpCode === 200) {
                    echo '<p class="success">✅ xAPI endpoint found!</p>';
                }
            }
        }
        
        echo '</div>';
    }
    ?>
    
    <div class="test">
        <h2>If all fail...</h2>
        <p>The access token might be:</p>
        <ul>
            <li>Expired (tokens last 7 days)</li>
            <li>From a different ALM account</li>
            <li>Not generated with the correct OAuth flow</li>
        </ul>
        <p>You'll need to generate a new one through the OAuth flow.</p>
    </div>
</body>
</html>
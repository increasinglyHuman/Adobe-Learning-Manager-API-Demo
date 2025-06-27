<?php
// Test xAPI with Direct Access Token

// Use the access token you already have
$accessToken = '17011366fe530fd13e1c1f953c70f3d2';
$accountId = '1361';

// Try different xAPI endpoints
$endpoints = [
    'https://learningmanager.adobe.com/primeapi/v2/xapi/statements',
    'https://learningmanager.adobe.com/primeapi/v2/account/' . $accountId . '/xapi/statements',
    'https://captivateprime.adobe.com/primeapi/v2/xapi/statements',
    'https://captivateprime.adobe.com/primeapi/v2/account/' . $accountId . '/xapi/statements'
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>Test xAPI with Direct Token</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-result {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .success { border-left: 5px solid #4CAF50; }
        .error { border-left: 5px solid #F44336; }
        pre {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }
        h1 { color: #333; }
        h2 { color: #666; }
    </style>
</head>
<body>
    <h1>🔍 Testing xAPI with Your Access Token</h1>
    <p>Using access token: <?php echo substr($accessToken, 0, 20); ?>...</p>
    
    <?php
    foreach ($endpoints as $endpoint) {
        echo '<div class="test-result">';
        echo '<h2>Testing: ' . $endpoint . '</h2>';
        
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
                        'en-US' => 'Kawaii Quiz xAPI Test'
                    ]
                ]
            ]
        ];
        
        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($statement));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: oauth ' . $accessToken,
            'Content-Type: application/json',
            'X-Experience-API-Version: 1.0.3'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        curl_close($ch);
        
        echo '<p><strong>HTTP Code:</strong> ' . $httpCode . '</p>';
        
        if ($httpCode === 200 || $httpCode === 204) {
            echo '<p class="success">✅ SUCCESS! This endpoint works!</p>';
        } else {
            echo '<p class="error">❌ Failed</p>';
        }
        
        echo '<details>';
        echo '<summary>Response Details</summary>';
        echo '<pre>Headers:' . "\n" . htmlspecialchars($headers) . '</pre>';
        echo '<pre>Body:' . "\n" . htmlspecialchars($body) . '</pre>';
        echo '</details>';
        
        echo '</div>';
    }
    ?>
    
    <div class="test-result">
        <h2>Next Steps</h2>
        <p>If none of the endpoints work, we might need to:</p>
        <ol>
            <li>Check if xAPI is enabled for your ALM account</li>
            <li>Verify the correct xAPI endpoint URL</li>
            <li>Ensure the access token has xAPI permissions</li>
        </ol>
    </div>
</body>
</html>
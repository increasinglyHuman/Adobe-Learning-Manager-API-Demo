<?php
// Comprehensive xAPI OAuth Debug Page
// This page captures all xAPI configuration info and tests OAuth flow

$config = [
    'admin' => [
        'clientId' => '57162d17-a056-4bb5-9451-f5c61fada9d4',
        'clientSecret' => '1582bf0c-6d0d-4582-a0cb-84382330f6e7',
        'redirectUri' => 'https://p0qp0q.com',
        'accountId' => '1361'
    ]
];

// Function to test OAuth URLs
function testOAuthUrl($params) {
    $baseUrl = 'https://learningmanager.adobe.com/oauth/authorize';
    $queryString = http_build_query($params);
    return $baseUrl . '?' . $queryString;
}

// Function to attempt token exchange
function exchangeToken($code) {
    global $config;
    $tokenUrl = 'https://learningmanager.adobe.com/oauth/token';
    
    $postData = [
        'code' => $code,
        'client_id' => $config['admin']['clientId'],
        'client_secret' => $config['admin']['clientSecret'],
        'redirect_uri' => $config['admin']['redirectUri'],
        'grant_type' => 'authorization_code'
    ];
    
    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    
    curl_close($ch);
    
    return [
        'httpCode' => $httpCode,
        'headers' => $headers,
        'body' => $body,
        'error' => $error,
        'effectiveUrl' => $effectiveUrl,
        'postData' => $postData
    ];
}

// Handle OAuth callback
$tokenExchangeResult = null;
if (isset($_GET['code'])) {
    $tokenExchangeResult = exchangeToken($_GET['code']);
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>xAPI OAuth Comprehensive Debug</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 1200px; 
            margin: 30px auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        .info-box {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
        }
        .success-box {
            background: #c8e6c9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .error-box {
            background: #ffcdd2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f44336;
        }
        .debug-section {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
        }
        .oauth-url {
            background: #fff;
            padding: 15px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .url-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
        }
        .url-text {
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            color: #333;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #45a049;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .checklist {
            list-style: none;
            padding: 0;
        }
        .checklist li {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
        }
        .checklist li:before {
            position: absolute;
            left: 0;
        }
        .check { color: #4CAF50; }
        .check:before { content: "✓ "; }
        .cross { color: #f44336; }
        .cross:before { content: "✗ "; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 xAPI OAuth Comprehensive Debug</h1>
        
        <div class="info-box">
            <h2>📋 Current Configuration</h2>
            <p><strong>Client ID:</strong> <code><?php echo $config['admin']['clientId']; ?></code></p>
            <p><strong>Client Secret:</strong> <code><?php echo substr($config['admin']['clientSecret'], 0, 10); ?>...<?php echo substr($config['admin']['clientSecret'], -4); ?></code></p>
            <p><strong>Redirect URI:</strong> <code><?php echo $config['admin']['redirectUri']; ?></code></p>
            <p><strong>Account ID:</strong> <code><?php echo $config['admin']['accountId']; ?></code></p>
        </div>

        <?php if (isset($_GET['code'])): ?>
            <div class="success-box">
                <h2>✅ Authorization Code Received!</h2>
                <p><strong>Code:</strong> <code><?php echo htmlspecialchars(substr($_GET['code'], 0, 20)); ?>...</code></p>
                <?php if (isset($_GET['state'])): ?>
                    <p><strong>State:</strong> <code><?php echo htmlspecialchars($_GET['state']); ?></code></p>
                <?php endif; ?>
            </div>

            <?php if ($tokenExchangeResult): ?>
                <div class="<?php echo $tokenExchangeResult['httpCode'] == 200 ? 'success-box' : 'error-box'; ?>">
                    <h2>Token Exchange Result</h2>
                    <p><strong>HTTP Code:</strong> <?php echo $tokenExchangeResult['httpCode']; ?></p>
                    <p><strong>Effective URL:</strong> <?php echo $tokenExchangeResult['effectiveUrl']; ?></p>
                    
                    <?php if ($tokenExchangeResult['error']): ?>
                        <p><strong>cURL Error:</strong> <?php echo $tokenExchangeResult['error']; ?></p>
                    <?php endif; ?>
                    
                    <h3>Request Data:</h3>
                    <div class="debug-section">
                        <pre><?php echo json_encode($tokenExchangeResult['postData'], JSON_PRETTY_PRINT); ?></pre>
                    </div>
                    
                    <h3>Response Headers:</h3>
                    <div class="debug-section">
                        <pre><?php echo htmlspecialchars($tokenExchangeResult['headers']); ?></pre>
                    </div>
                    
                    <h3>Response Body:</h3>
                    <div class="debug-section">
                        <pre><?php echo htmlspecialchars($tokenExchangeResult['body']); ?></pre>
                    </div>
                    
                    <?php 
                    if ($tokenExchangeResult['httpCode'] == 200) {
                        $tokens = json_decode($tokenExchangeResult['body'], true);
                        if (isset($tokens['refresh_token'])) {
                            echo '<div class="success-box">';
                            echo '<h2>🎉 SUCCESS! Refresh Token Obtained!</h2>';
                            echo '<p><strong>Refresh Token:</strong></p>';
                            echo '<div class="debug-section"><code>' . htmlspecialchars($tokens['refresh_token']) . '</code></div>';
                            echo '<p>Add this to your config.php in the admin.refreshToken field!</p>';
                            echo '</div>';
                        }
                    }
                    ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <h2>🔗 OAuth URL Variations</h2>
        <p>Click any of these URLs to test the OAuth flow:</p>

        <?php
        $oauthVariations = [
            'Standard Admin Scope' => [
                'client_id' => $config['admin']['clientId'],
                'redirect_uri' => $config['admin']['redirectUri'],
                'scope' => 'admin:read,admin:write',
                'response_type' => 'code',
                'state' => 'xapi_admin_' . time()
            ],
            'With Account ID' => [
                'client_id' => $config['admin']['clientId'],
                'redirect_uri' => $config['admin']['redirectUri'],
                'scope' => 'admin:read,admin:write',
                'response_type' => 'code',
                'account' => $config['admin']['accountId'],
                'state' => 'xapi_admin_account_' . time()
            ],
            'Learner Scope' => [
                'client_id' => $config['admin']['clientId'],
                'redirect_uri' => $config['admin']['redirectUri'],
                'scope' => 'learner:read,learner:write',
                'response_type' => 'code',
                'state' => 'xapi_learner_' . time()
            ],
            'Combined Scope' => [
                'client_id' => $config['admin']['clientId'],
                'redirect_uri' => $config['admin']['redirectUri'],
                'scope' => 'learner:read,learner:write,admin:read,admin:write',
                'response_type' => 'code',
                'state' => 'xapi_combined_' . time()
            ],
            'Minimal Scope' => [
                'client_id' => $config['admin']['clientId'],
                'redirect_uri' => $config['admin']['redirectUri'],
                'scope' => 'learner:read',
                'response_type' => 'code',
                'state' => 'xapi_minimal_' . time()
            ]
        ];

        foreach ($oauthVariations as $label => $params):
            $url = testOAuthUrl($params);
        ?>
            <div class="oauth-url">
                <div class="url-label"><?php echo $label; ?>:</div>
                <div class="url-text"><?php echo htmlspecialchars($url); ?></div>
                <button onclick="window.open('<?php echo htmlspecialchars($url); ?>', '_blank')">
                    Test in New Window
                </button>
                <button onclick="window.location.href='<?php echo htmlspecialchars($url); ?>'">
                    Test in Same Window
                </button>
            </div>
        <?php endforeach; ?>

        <div class="info-box">
            <h2>📝 xAPI Integration Checklist</h2>
            <ul class="checklist">
                <li class="<?php echo isset($_GET['code']) ? 'check' : 'cross'; ?>">
                    OAuth authorization code received
                </li>
                <li class="<?php echo ($tokenExchangeResult && $tokenExchangeResult['httpCode'] == 200) ? 'check' : 'cross'; ?>">
                    Token exchange successful
                </li>
                <li class="<?php echo (isset($tokens['refresh_token'])) ? 'check' : 'cross'; ?>">
                    Refresh token obtained
                </li>
                <li class="cross">xAPI statements tested</li>
                <li class="cross">Quiz data persisted via xAPI</li>
                <li class="cross">Instructor→Learner flow working</li>
            </ul>
        </div>

        <div class="info-box">
            <h2>🔧 Troubleshooting Guide</h2>
            <h3>Common 400 Bad Request Causes:</h3>
            <ul>
                <li><strong>Wrong Client ID:</strong> Verify the client ID matches exactly</li>
                <li><strong>Redirect URI Mismatch:</strong> Must match exactly (no trailing slash)</li>
                <li><strong>Wrong Region:</strong> US vs EU endpoint mismatch</li>
                <li><strong>Invalid Scope:</strong> Using scopes not available to the app</li>
                <li><strong>Expired Code:</strong> Authorization codes expire quickly</li>
            </ul>

            <h3>Debug Steps:</h3>
            <ol>
                <li>Verify you're logged into ALM as an admin</li>
                <li>Check that the app is configured in ALM Integration Admin</li>
                <li>Confirm the redirect URI matches exactly (no trailing slash)</li>
                <li>Try different scope combinations above</li>
                <li>Check browser console for any JavaScript errors</li>
            </ol>
        </div>

        <div class="debug-section">
            <h3>Raw Request Data:</h3>
            <pre><?php
            echo "GET Parameters:\n";
            print_r($_GET);
            echo "\nPOST Parameters:\n";
            print_r($_POST);
            echo "\nServer Variables:\n";
            echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
            echo "HTTP_HOST: " . $_SERVER['HTTP_HOST'] . "\n";
            ?></pre>
        </div>
    </div>
</body>
</html>
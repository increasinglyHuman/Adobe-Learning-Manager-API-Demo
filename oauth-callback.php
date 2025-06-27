<?php
// OAuth Callback Handler for xAPI Token Generation

$config = require('config.php');

// Check if we got an authorization code
if (!isset($_GET['code'])) {
    die('Error: No authorization code received. ' . (isset($_GET['error']) ? $_GET['error'] : ''));
}

$code = $_GET['code'];
$clientId = $config['xapi']['admin']['clientId'];
$clientSecret = $config['xapi']['admin']['clientSecret'];
$redirectUri = 'https://p0qp0q.com';

// Exchange authorization code for tokens
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

$tokens = json_decode($response, true);

?>
<!DOCTYPE html>
<html>
<head>
    <title>xAPI Token Generated</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .token-box {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            word-break: break-all;
            margin: 10px 0;
            font-family: monospace;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>🎉 xAPI OAuth Callback</h1>
    
    <?php if ($httpCode === 200 && isset($tokens['refresh_token'])): ?>
        <div class="success">
            <h2>✅ Success! Tokens Generated</h2>
        </div>
        
        <div class="info">
            <h3>Your Refresh Token:</h3>
            <div class="token-box"><?php echo htmlspecialchars($tokens['refresh_token']); ?></div>
            
            <h3>Your Access Token (expires in <?php echo $tokens['expires_in']; ?> seconds):</h3>
            <div class="token-box"><?php echo htmlspecialchars($tokens['access_token']); ?></div>
            
            <h3>Next Steps:</h3>
            <ol>
                <li>Copy the refresh token above</li>
                <li>Update <code>config.php</code> with this refresh token</li>
                <li>The app will use this to generate access tokens automatically</li>
            </ol>
        </div>
        
        <div class="info">
            <h3>Update your config.php:</h3>
            <pre class="token-box">'xapi' => [
    'admin' => [
        'clientId' => '<?php echo $clientId; ?>',
        'clientSecret' => '<?php echo $clientSecret; ?>',
        'refreshToken' => '<?php echo htmlspecialchars($tokens['refresh_token']); ?>',
        'baseUrl' => 'https://learningmanagereu.adobe.com/primeapi/v2/xapi'
    ],
    // ... rest of config
]</pre>
        </div>
        
    <?php else: ?>
        <div class="error">
            <h2>❌ Error Getting Tokens</h2>
            <p><strong>HTTP Code:</strong> <?php echo $httpCode; ?></p>
            <p><strong>Response:</strong></p>
            <div class="token-box"><?php echo htmlspecialchars($response); ?></div>
        </div>
        
        <div class="info">
            <h3>Debug Information:</h3>
            <p><strong>Authorization Code:</strong> <?php echo htmlspecialchars($code); ?></p>
            <p><strong>Client ID:</strong> <?php echo $clientId; ?></p>
            <p><strong>Token URL:</strong> <?php echo $tokenUrl; ?></p>
        </div>
    <?php endif; ?>
    
</body>
</html>
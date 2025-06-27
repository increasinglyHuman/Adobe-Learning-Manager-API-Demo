<?php
// OAuth Handler for root domain
// Place this at the root of p0qp0q.com or include it in index.php

// Check if we have an OAuth code from ALM
if (isset($_GET['code']) && isset($_GET['PRIME_BASE'])) {
    
    // Load config from the kawaii quiz directory
    $config = require('/var/www/html/alm-kawaii-quiz/config.php');
    
    $code = $_GET['code'];
    $clientId = $config['xapi']['admin']['clientId'];
    $clientSecret = $config['xapi']['admin']['clientSecret'];
    $redirectUri = 'https://p0qp0q.com';
    
    // Exchange code for tokens
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
    
    if ($httpCode === 200) {
        $tokens = json_decode($response, true);
        ?>
        <!-- Debug info -->
        <!-- Code: <?php echo htmlspecialchars($code); ?> -->
        <!-- Response: <?php echo htmlspecialchars($response); ?> -->
        <!DOCTYPE html>
        <html>
        <head>
            <title>ALM xAPI Token Success</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .success-box {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .token-display {
                    background: #f0f0f0;
                    padding: 15px;
                    border-radius: 5px;
                    word-break: break-all;
                    font-family: monospace;
                    margin: 10px 0;
                }
                h1 { color: #4CAF50; }
                .instructions {
                    background: #e3f2fd;
                    padding: 20px;
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
            <div class="success-box">
                <h1>✅ Success! ALM xAPI Tokens Generated</h1>
                
                <h2>Your Refresh Token:</h2>
                <div class="token-display"><?php echo htmlspecialchars($tokens['refresh_token']); ?></div>
                
                <div class="instructions">
                    <h3>Next Steps:</h3>
                    <ol>
                        <li>Copy the refresh token above</li>
                        <li>SSH into your server</li>
                        <li>Edit <code>/var/www/html/alm-kawaii-quiz/config.php</code></li>
                        <li>Add the refresh token to the admin xAPI section</li>
                    </ol>
                    
                    <h3>Update your config.php:</h3>
                    <div class="token-display">'refreshToken' => '<?php echo htmlspecialchars($tokens['refresh_token']); ?>',</div>
                </div>
                
                <p><a href="/alm-kawaii-quiz/test-xapi.php">Test xAPI Connection →</a></p>
            </div>
        </body>
        </html>
        <?php
        exit;
    } else {
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Error</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                }
                .error-box {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .debug-info {
                    background: #f0f0f0;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 10px 0;
                    word-break: break-all;
                }
                pre {
                    background: white;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <h1>OAuth Token Exchange Error</h1>
            
            <div class="error-box">
                <h2>HTTP Code: <?php echo $httpCode; ?></h2>
                <p>The token exchange failed. See details below.</p>
            </div>
            
            <h3>Response from ALM:</h3>
            <pre><?php echo htmlspecialchars($response); ?></pre>
            
            <div class="debug-info">
                <h3>Debug Information:</h3>
                <p><strong>Authorization Code:</strong> <?php echo htmlspecialchars($code); ?></p>
                <p><strong>Client ID:</strong> <?php echo $clientId; ?></p>
                <p><strong>Client Secret:</strong> <?php echo substr($clientSecret, 0, 10); ?>...</p>
                <p><strong>Redirect URI:</strong> <?php echo $redirectUri; ?></p>
                <p><strong>Token URL:</strong> <?php echo $tokenUrl; ?></p>
            </div>
            
            <div class="debug-info">
                <h3>What to check:</h3>
                <ul>
                    <li>Ensure the redirect URI in ALM is exactly: <code><?php echo $redirectUri; ?></code></li>
                    <li>Verify the client ID and secret are correct</li>
                    <li>Try the OAuth flow again (codes expire quickly)</li>
                </ul>
                
                <p><a href="/alm-kawaii-quiz/generate-xapi-token.php">Try OAuth flow again →</a></p>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}
?>
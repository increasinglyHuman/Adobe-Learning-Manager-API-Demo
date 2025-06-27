<?php
// Generate xAPI Refresh Token for ALM
// Run this script in your browser to get the OAuth URL

$config = require('config.php');

$clientId = $config['xapi']['admin']['clientId'];
$redirectUri = urlencode('https://p0qp0q.com');
$accountId = $config['alm']['accountId'];

// ALM OAuth authorization URL for US region
$authUrl = "https://learningmanager.adobe.com/oauth/authorize";
$authUrl .= "?client_id={$clientId}";
$authUrl .= "&redirect_uri={$redirectUri}";
$authUrl .= "&scope=learner:read,learner:write,admin:read,admin:write";
$authUrl .= "&response_type=code";
$authUrl .= "&account={$accountId}";

?>
<!DOCTYPE html>
<html>
<head>
    <title>Generate xAPI Token</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .url-box {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            word-break: break-all;
            margin: 20px 0;
        }
        button {
            background: #FF69B4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #FF1493;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>🔑 Generate xAPI Refresh Token</h1>
    
    <div class="info">
        <h2>Instructions:</h2>
        <ol>
            <li>Click the button below to go to ALM login</li>
            <li>Log in with your ALM admin credentials</li>
            <li>Authorize the xAPI application</li>
            <li>You'll be redirected back with an authorization code</li>
            <li>The callback page will exchange the code for tokens</li>
        </ol>
    </div>
    
    <div class="url-box">
        <strong>OAuth URL:</strong><br>
        <?php echo htmlspecialchars($authUrl); ?>
    </div>
    
    <button onclick="window.location.href='<?php echo htmlspecialchars($authUrl); ?>'">
        Start OAuth Flow →
    </button>
    
    <div class="info" style="margin-top: 30px;">
        <h3>Current Configuration:</h3>
        <p><strong>Client ID:</strong> <?php echo $clientId; ?></p>
        <p><strong>Account ID:</strong> <?php echo $accountId; ?></p>
        <p><strong>Redirect URI:</strong> <?php echo urldecode($redirectUri); ?></p>
    </div>
</body>
</html>
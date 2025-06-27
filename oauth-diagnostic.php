<?php
$config = require('config.php');

$clientId = $config['xapi']['admin']['clientId'];
$accountId = $config['alm']['accountId'];

// Generate OAuth URLs for both regions
$urls = [
    'US Direct' => "https://learningmanager.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode('https://p0qp0q.com/') . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code&account={$accountId}",
    
    'US Without Account' => "https://learningmanager.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode('https://p0qp0q.com/') . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code",
    
    'EU Direct' => "https://learningmanagereu.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode('https://p0qp0q.com/') . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code&account={$accountId}",
    
    'EU Without Account' => "https://learningmanagereu.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode('https://p0qp0q.com/') . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code",
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Diagnostic</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .info-box {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .url-box {
            background: #f0f0f0;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
        }
        button {
            background: #FF69B4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #FF1493;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaba;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🔍 OAuth Diagnostic Tool</h1>
    
    <div class="info-box">
        <h2>Current Configuration</h2>
        <p><strong>Client ID:</strong> <?php echo $clientId; ?></p>
        <p><strong>Account ID:</strong> <?php echo $accountId; ?></p>
        <p><strong>Redirect URI:</strong> https://p0qp0q.com/</p>
    </div>
    
    <div class="warning">
        <h3>⚠️ Before you proceed:</h3>
        <ol>
            <li>Make sure your xAPI app in ALM has <strong>https://p0qp0q.com/</strong> as the redirect URI</li>
            <li>The app must be approved/active in ALM</li>
            <li>You need to be logged in as an admin</li>
        </ol>
    </div>
    
    <div class="info-box">
        <h2>Try these OAuth URLs:</h2>
        <?php foreach ($urls as $label => $url): ?>
            <h3><?php echo $label; ?>:</h3>
            <div class="url-box"><?php echo htmlspecialchars($url); ?></div>
            <button onclick="window.location.href='<?php echo htmlspecialchars($url); ?>'">
                Try <?php echo $label; ?>
            </button>
        <?php endforeach; ?>
    </div>
    
    <div class="info-box">
        <h2>Common 401 Causes:</h2>
        <ul>
            <li><strong>Wrong Region:</strong> Your app might be in EU but you're trying US endpoint (or vice versa)</li>
            <li><strong>Client ID not found:</strong> The app might have been deleted or the ID is incorrect</li>
            <li><strong>App not approved:</strong> xAPI apps sometimes need approval in ALM</li>
            <li><strong>Wrong redirect URI:</strong> The redirect URI in the app must match exactly</li>
        </ul>
    </div>
    
    <div class="info-box">
        <h2>What to check in ALM:</h2>
        <ol>
            <li>Go to <strong>Integration Admin → Applications</strong></li>
            <li>Find your xAPI app with Client ID: <code><?php echo $clientId; ?></code></li>
            <li>Check:
                <ul>
                    <li>Is it Active/Approved?</li>
                    <li>Is the redirect URI exactly: <code>https://p0qp0q.com/</code>?</li>
                    <li>What region is shown?</li>
                </ul>
            </li>
        </ol>
    </div>
</body>
</html>
<?php
// Direct OAuth test with explicit parameters

$clientId = '57162d17-a056-4bb5-9451-f5c61fada9d4';
$redirectUri = 'https://p0qp0q.com';
$accountId = '1361';

// Try different OAuth URL variations
$urls = [
    'With Account' => "https://learningmanager.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode($redirectUri) . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code&account={$accountId}",
    
    'Without Account' => "https://learningmanager.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode($redirectUri) . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code",
    
    'Minimal Scope' => "https://learningmanager.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode($redirectUri) . "&scope=learner:read&response_type=code",
    
    'With State' => "https://learningmanager.adobe.com/oauth/authorize?client_id={$clientId}&redirect_uri=" . urlencode($redirectUri) . "&scope=learner:read,learner:write,admin:read,admin:write&response_type=code&state=test123"
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Direct Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }
        .test-url { background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .url { word-break: break-all; font-family: monospace; font-size: 12px; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>OAuth Direct Test</h1>
    
    <div class="info">
        <h3>Current Setup:</h3>
        <p><strong>Client ID:</strong> <?php echo $clientId; ?></p>
        <p><strong>Redirect URI:</strong> <?php echo $redirectUri; ?></p>
        <p><strong>Account ID:</strong> <?php echo $accountId; ?></p>
    </div>
    
    <h2>Try these OAuth URLs:</h2>
    
    <?php foreach ($urls as $label => $url): ?>
        <div class="test-url">
            <h3><?php echo $label; ?>:</h3>
            <div class="url"><?php echo htmlspecialchars($url); ?></div>
            <button onclick="window.open('<?php echo htmlspecialchars($url); ?>', '_blank')">
                Test in New Window
            </button>
            <button onclick="window.location.href='<?php echo htmlspecialchars($url); ?>'">
                Test in Same Window
            </button>
        </div>
    <?php endforeach; ?>
    
    <div class="info">
        <h3>Debugging Steps:</h3>
        <ol>
            <li>Try each URL above</li>
            <li>Note which one gets furthest (login page vs immediate error)</li>
            <li>If you get to login and authorize, check if redirect happens</li>
            <li>If redirect works, visit: <a href="/oauth-debug.php" target="_blank">OAuth Debug Page</a></li>
        </ol>
        
        <h3>Common Issues:</h3>
        <ul>
            <li><strong>400 Bad Request:</strong> Usually means parameter mismatch</li>
            <li><strong>401 Unauthorized:</strong> Client ID not found</li>
            <li><strong>Redirect fails:</strong> Domain mismatch</li>
        </ul>
    </div>
</body>
</html>
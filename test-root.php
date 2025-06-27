<?php
// Test if OAuth parameters are being received

?>
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Parameter Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .param { background: #f0f0f0; padding: 10px; margin: 5px 0; border-radius: 5px; }
        .found { background: #d4edda; }
        .missing { background: #f8d7da; }
    </style>
</head>
<body>
    <h1>OAuth Parameter Test</h1>
    
    <h2>Current URL Parameters:</h2>
    <?php if (empty($_GET)): ?>
        <p class="param missing">No parameters found in URL</p>
    <?php else: ?>
        <?php foreach ($_GET as $key => $value): ?>
            <div class="param found">
                <strong><?php echo htmlspecialchars($key); ?>:</strong> 
                <?php echo htmlspecialchars(substr($value, 0, 50)); ?>...
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <h2>OAuth Handler Check:</h2>
    <?php
    $handlerPath = '/home/ubuntu/alm-kawaii-quiz/oauth-handler.php';
    if (file_exists($handlerPath)) {
        echo '<p class="param found">✅ OAuth handler file exists at: ' . $handlerPath . '</p>';
    } else {
        echo '<p class="param missing">❌ OAuth handler file NOT found at: ' . $handlerPath . '</p>';
    }
    
    $rootIndex = '/var/www/html/index.php';
    if (file_exists($rootIndex)) {
        echo '<p class="param found">✅ Root index.php exists</p>';
        $content = file_get_contents($rootIndex);
        if (strpos($content, 'PRIME_BASE') !== false) {
            echo '<p class="param found">✅ Root index.php contains OAuth check</p>';
        } else {
            echo '<p class="param missing">❌ Root index.php does NOT contain OAuth check</p>';
        }
    }
    ?>
    
    <h2>Test OAuth Redirect:</h2>
    <p>Try visiting this URL directly:</p>
    <code>https://p0qp0q.com/?code=test123&PRIME_BASE=https://learningmanager.adobe.com</code>
    
    <h2>Next Steps:</h2>
    <ol>
        <li>If you see parameters above, the OAuth redirect is working</li>
        <li>If the handler file is missing, we need to check the deployment</li>
        <li>If the root index.php doesn't have the OAuth check, we need to update it</li>
    </ol>
</body>
</html>
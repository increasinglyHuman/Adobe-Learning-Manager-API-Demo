<?php
// This should be placed at /var/www/html/index.php on p0qp0q.com

// Check for ALM OAuth callback
if (isset($_GET['code']) && isset($_GET['PRIME_BASE'])) {
    require_once('alm-kawaii-quiz/oauth-handler.php');
    exit;
}

// Normal homepage content
?>
<!DOCTYPE html>
<html>
<head>
    <title>p0qp0q.com</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .project-link {
            display: inline-block;
            margin: 10px;
            padding: 15px 25px;
            background: #FF69B4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .project-link:hover {
            background: #FF1493;
        }
    </style>
</head>
<body>
    <h1>Welcome to p0qp0q.com</h1>
    
    <h2>Projects:</h2>
    <a href="/alm-kawaii-quiz/" class="project-link">ALM Kawaii Quiz</a>
    
    <?php if (isset($_GET['code'])): ?>
        <div style="background: #ffebee; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>OAuth Code Received</h3>
            <p>Code: <?php echo htmlspecialchars($_GET['code']); ?></p>
            <p>But missing PRIME_BASE parameter. This might be from a different OAuth flow.</p>
        </div>
    <?php endif; ?>
</body>
</html>
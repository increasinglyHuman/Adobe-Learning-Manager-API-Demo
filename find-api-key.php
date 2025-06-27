<?php
// Simple script to find where ANTHROPIC_API_KEY is stored

$locations = [
    '/var/www/html/Merlin/.env',
    '/var/www/html/jazzypop/.env',
    '/var/www/p0qp0q.com/Merlin/.env',
    '/var/www/p0qp0q.com/jazzypop/.env',
    '/home/ubuntu/Merlin/.env',
    '/home/ubuntu/jazzypop/.env',
    '/var/www/html/.env',
    '/var/www/.env',
    '/home/ubuntu/.env',
    '/etc/environment'
];

echo "<h3>Searching for ANTHROPIC_API_KEY...</h3>\n";

foreach ($locations as $file) {
    if (file_exists($file)) {
        echo "<p><strong>$file</strong>: EXISTS";
        $content = file_get_contents($file);
        if (strpos($content, 'ANTHROPIC_API_KEY') !== false) {
            echo " ✅ <span style='color:green'>Contains ANTHROPIC_API_KEY!</span>";
            
            // Try to load it
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, 'ANTHROPIC_API_KEY') === 0) {
                    list($key, $value) = explode('=', $line, 2);
                    $value = trim($value, '"\'');
                    echo " (starts with: " . substr($value, 0, 10) . "...)";
                    break;
                }
            }
        }
        echo "</p>\n";
    }
}

// Also check system environment
echo "<h3>System Environment:</h3>\n";
echo "<p>getenv('ANTHROPIC_API_KEY'): " . (getenv('ANTHROPIC_API_KEY') ? 'SET' : 'NOT SET') . "</p>\n";
echo "<p>Shell exec 'echo $ANTHROPIC_API_KEY': " . shell_exec('echo $ANTHROPIC_API_KEY') . "</p>\n";
?>
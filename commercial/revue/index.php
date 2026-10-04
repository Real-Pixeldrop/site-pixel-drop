<?php
declare(strict_types=1);

// Local checkout, then the private directory outside public_html in production.
$candidates = [
    dirname(__DIR__, 2) . '/private/revue-access.php',
    dirname(__DIR__, 3) . '/commercial-jonathan-private/revue-access.php',
];

foreach ($candidates as $candidate) {
    if (is_file($candidate)) {
        require $candidate;
        exit;
    }
}

http_response_code(503);
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store, private');
echo 'Document temporairement indisponible.';

<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $kind = 'image';
    $maxBytes = 6 * 1024 * 1024;
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
} elseif (isset($_FILES['video'])) {
    $file = $_FILES['video'];
    $kind = 'video';
    $maxBytes = 8 * 1024 * 1024;
    $allowed = [
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/ogg' => 'ogv',
    ];
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Upload file is required']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Upload failed']);
    exit;
}

if ($file['size'] > $maxBytes) {
    http_response_code(413);
    echo json_encode(['success' => false, 'error' => ucfirst($kind) . ' is too large']);
    exit;
}

if ($kind === 'image') {
    $info = @getimagesize($file['tmp_name']);
    $mime = $info['mime'] ?? '';
} else {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? finfo_file($finfo, $file['tmp_name']) : '';
    if ($finfo) finfo_close($finfo);
}

if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $kind === 'image' ? 'Only JPG, PNG or WEBP images are allowed' : 'Only MP4, WEBM or OGG videos are allowed']);
    exit;
}

$dir = __DIR__ . '/../images/uploads';
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not create upload directory']);
    exit;
}

try {
    $suffix = bin2hex(random_bytes(4));
} catch (Exception $e) {
    $suffix = uniqid('', true);
}

$name = 'product-' . $kind . '-' . date('Ymd-His') . '-' . $suffix . '.' . $allowed[$mime];
$target = $dir . '/' . $name;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not save uploaded file']);
    exit;
}

echo json_encode([
    'success' => true,
    'path' => 'images/uploads/' . $name,
]);
?>

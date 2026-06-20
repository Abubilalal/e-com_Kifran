<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

function normalizeProduct($product) {
    foreach (['images', 'gallery', 'colors', 'sizes', 'features'] as $field) {
        $product[$field] = json_decode($product[$field] ?? '[]', true) ?: [];
    }
    $product['specs'] = json_decode($product['specs'] ?? '{}', true) ?: [];
    foreach (['showDiscount', 'showFreeDelivery', 'showDelivery', 'showRating', 'showStock'] as $field) {
        $product[$field] = !empty($product[$field]);
    }
    return $product;
}

try {
switch ($method) {
    case 'GET':
        // Get all products or single product
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            if ($product) {
                echo json_encode(normalizeProduct($product));
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll();
            foreach ($products as &$p) {
                $p = normalizeProduct($p);
            }
            echo json_encode($products);
        }
        break;

    case 'POST':
    case 'PUT':
        // Create or Update product
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
            exit;
        }

        $id = $data['id'] ?? ('p' . time());
        $fields = [
            'name', 'brand', 'material', 'cat', 'price', 'mrp', 'stock',
            'badge', 'rating', 'reviews', 'img', 'video', 'description',
            'showDiscount', 'showFreeDelivery', 'showDelivery', 'showRating', 'showStock'
        ];
        
        $jsonFields = ['images', 'gallery', 'colors', 'sizes', 'features', 'specs'];

        $existsStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE id = ?");
        $existsStmt->execute([$id]);
        $exists = (int)$existsStmt->fetchColumn() > 0;

        $cols = ['id'];
        $vals = [$id];
        $placeholders = ['?'];
        $updates = [];

        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $cols[] = $f;
                $vals[] = is_bool($data[$f]) ? ($data[$f] ? 1 : 0) : $data[$f];
                $placeholders[] = '?';
                $updates[] = "$f = VALUES($f)";
            }
        }
        foreach ($jsonFields as $f) {
            if (array_key_exists($f, $data)) {
                $cols[] = $f;
                $vals[] = json_encode($data[$f]);
                $placeholders[] = '?';
                $updates[] = "$f = VALUES($f)";
            }
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No product fields supplied']);
            exit;
        }

        $updates[] = "updated_at = NOW()";
        $sql = "INSERT INTO products (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")
                ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);
        echo json_encode(['success' => true, 'id' => $id, 'action' => $exists ? 'updated' : 'created']);
        break;

    case 'DELETE':
        // Delete product
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID required']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'id' => $id, 'action' => 'deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY date DESC");
        $orders = $stmt->fetchAll();
        foreach ($orders as &$o) {
            $o['items'] = json_decode($o['items'] ?? '[]', true);
            $o['totals'] = json_decode($o['totals'] ?? '{}', true);
            $o['customer'] = json_decode($o['customer'] ?? '{}', true);
            $o['reviews'] = json_decode($o['reviews'] ?? '{}', true);
        }
        echo json_encode($orders);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO orders 
            (id, date, status, payment, customer, items, couponPct, totals, trackingId, courier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status=VALUES(status), trackingId=VALUES(trackingId), courier=VALUES(courier)");
        
        $stmt->execute([
            $data['id'],
            $data['date'] ?? date('c'),
            $data['status'] ?? 'Pending',
            $data['payment'] ?? 'UPI',
            json_encode($data['customer'] ?? []),
            json_encode($data['items'] ?? []),
            $data['couponPct'] ?? 0,
            json_encode($data['totals'] ?? []),
            $data['trackingId'] ?? null,
            $data['courier'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $data['id']]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID required']);
            exit;
        }
        
        $sets = [];
        $values = [];
        
        if (isset($data['status'])) { $sets[] = "status = ?"; $values[] = $data['status']; }
        if (isset($data['trackingId'])) { $sets[] = "trackingId = ?"; $values[] = $data['trackingId']; }
        if (isset($data['courier'])) { $sets[] = "courier = ?"; $values[] = $data['courier']; }
        if (isset($data['reviews'])) { $sets[] = "reviews = ?"; $values[] = json_encode($data['reviews']); }
        
        if (empty($sets)) {
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit;
        }
        
        $values[] = $data['id'];
        $sql = "UPDATE orders SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        echo json_encode(['success' => true, 'id' => $data['id']]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
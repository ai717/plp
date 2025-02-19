<?php
// 添加举报功能
header('Content-Type: application/json');
require_once 'db.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $bottle_id = $data['bottle_id'] ?? 0;
    $reason = $data['reason'] ?? '';
    
    if (empty($bottle_id) || empty($reason)) {
        echo json_encode(['success' => false, 'message' => '参数不完整']);
        exit;
    }
    
    $sql = "INSERT INTO reports (bottle_id, reason, reported_at) VALUES (?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('is', $bottle_id, $reason);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => '举报成功']);
    } else {
        echo json_encode(['success' => false, 'message' => '举报失败']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => '系统错误']);
}
?> 
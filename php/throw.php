<?php
header('Content-Type: application/json');
require_once 'db.php';

// 记录请求信息
error_log("Received request: " . file_get_contents('php://input'));

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $content = $data['content'] ?? '';

    if (empty($content)) {
        error_log("Empty content received");
        echo json_encode(['success' => false, 'message' => '内容不能为空']);
        exit;
    }

    $conn = DB::getConnection();
    $content = $conn->real_escape_string($content);
    $sql = "INSERT INTO bottles (content, created_at, picked) VALUES ('$content', NOW(), 0)";

    if ($conn->query($sql)) {
        error_log("Successfully inserted bottle with content: " . $content);
        echo json_encode(['success' => true, 'message' => '漂流瓶已扔出']);
    } else {
        error_log("Failed to insert bottle: " . $conn->error);
        echo json_encode(['success' => false, 'message' => '保存失败: ' . $conn->error]);
    }
} catch (Exception $e) {
    error_log("Error in throw.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '系统错误：' . $e->getMessage()]);
}
?> 
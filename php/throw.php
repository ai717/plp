<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$content = $data['content'] ?? '';

if (empty($content)) {
    echo json_encode(['success' => false, 'message' => '内容不能为空']);
    exit;
}

$conn = DB::getConnection();
$content = $conn->real_escape_string($content);
$sql = "INSERT INTO bottles (content, created_at) VALUES ('$content', NOW())";

if ($conn->query($sql)) {
    echo json_encode(['success' => true, 'message' => '漂流瓶已扔出']);
} else {
    echo json_encode(['success' => false, 'message' => '保存失败']);
}
?> 
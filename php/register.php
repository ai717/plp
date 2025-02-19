<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');
require_once 'db.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    // 验证用户名
    if (!preg_match('/^[a-zA-Z0-9]{5,}$/', $username)) {
        echo json_encode(['success' => false, 'message' => '用户名必须至少5位数的字母和数字组合']);
        exit;
    }

    // 验证密码
    if (strlen($password) < 5) {
        echo json_encode(['success' => false, 'message' => '密码必须至少5位']);
        exit;
    }

    $conn = DB::getConnection();
    
    // 检查用户名是否已存在
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => '用户名已存在']);
        exit;
    }

    // 创建新用户
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())");
    $stmt->bind_param('ss', $username, $hash);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => '注册成功']);
    } else {
        echo json_encode(['success' => false, 'message' => '注册失败']);
    }
} catch (Exception $e) {
    error_log("Error in register.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '系统错误']);
}
?> 
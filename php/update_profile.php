<?php
header('Content-Type: application/json');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '请先登录']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $type = $data['type'] ?? '';
    $conn = DB::getConnection();

    if ($type === 'username') {
        $newUsername = $data['value'] ?? '';
        
        if (!preg_match('/^[a-zA-Z0-9]{5,}$/', $newUsername)) {
            echo json_encode(['success' => false, 'message' => '用户名必须至少5位数的字母和数字组合']);
            exit;
        }

        // 检查用户名是否已存在
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->bind_param('si', $newUsername, $_SESSION['user_id']);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => '用户名已存在']);
            exit;
        }

        // 更新用户名
        $stmt = $conn->prepare("UPDATE users SET username = ? WHERE id = ?");
        $stmt->bind_param('si', $newUsername, $_SESSION['user_id']);
        
        if ($stmt->execute()) {
            $_SESSION['username'] = $newUsername;
            echo json_encode(['success' => true, 'message' => '用户名修改成功']);
        } else {
            echo json_encode(['success' => false, 'message' => '修改失败']);
        }
    } elseif ($type === 'password') {
        $oldPassword = $data['oldPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (strlen($newPassword) < 5) {
            echo json_encode(['success' => false, 'message' => '新密码必须至少5位']);
            exit;
        }

        // 验证旧密码
        $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->bind_param('i', $_SESSION['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if (!password_verify($oldPassword, $user['password'])) {
            echo json_encode(['success' => false, 'message' => '当前密码错误']);
            exit;
        }

        // 更新密码
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param('si', $hash, $_SESSION['user_id']);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => '密码修改成功']);
        } else {
            echo json_encode(['success' => false, 'message' => '修改失败']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => '无效的请求类型']);
    }
} catch (Exception $e) {
    error_log("Error in update_profile.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '系统错误']);
}
?> 
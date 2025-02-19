<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');
require_once 'db.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => '请输入用户名和密码']);
        exit;
    }

    $conn = DB::getConnection();
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => '用户名或密码错误']);
        exit;
    }

    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        // 更新最后登录时间
        $stmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();

        // 启动会话
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        echo json_encode([
            'success' => true, 
            'message' => '登录成功',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => '用户名或密码错误']);
    }
} catch (Exception $e) {
    error_log("Error in login.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '系统错误']);
}
?> 
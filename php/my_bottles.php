<?php
header('Content-Type: application/json');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '请先登录']);
    exit;
}

try {
    $type = $_GET['type'] ?? 'thrown';
    $user_id = $_SESSION['user_id'];
    error_log("Loading bottles for user: $user_id, type: $type");
    $conn = DB::getConnection();

    if ($type === 'thrown') {
        // 获取我扔出的瓶子
        $sql = "SELECT * FROM bottles WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $user_id);
    } else {
        // 获取我捡到的瓶子
        $sql = "SELECT b.* FROM bottles b 
                INNER JOIN bottle_picks bp ON b.id = bp.bottle_id 
                WHERE bp.user_id = ? 
                ORDER BY bp.picked_at DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $user_id);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    error_log("Found " . $result->num_rows . " bottles");
    
    $bottles = [];
    while ($row = $result->fetch_assoc()) {
        $bottles[] = [
            'id' => $row['id'],
            'content' => $row['content'],
            'created_at' => $row['created_at'],
            'pick_count' => $row['pick_count']
        ];
    }

    error_log("Returning bottles: " . json_encode($bottles));
    echo json_encode(['success' => true, 'bottles' => $bottles]);
} catch (Exception $e) {
    error_log("Error in my_bottles.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    echo json_encode(['success' => false, 'message' => '获取漂流瓶失败']);
}
?> 
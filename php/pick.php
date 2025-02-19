<?php
// 允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

try {
    $conn = DB::getConnection();
    // 随机获取一个未被捡走的漂流瓶
    $sql = "SELECT * FROM bottles WHERE picked = 0 ORDER BY RAND() LIMIT 1";
    error_log("Executing query: " . $sql);
    
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $bottle = $result->fetch_assoc();
        // 标记为已捡走
        $updateSql = "UPDATE bottles SET picked = 1 WHERE id = " . $bottle['id'];
        error_log("Updating bottle: " . $updateSql);
        
        $conn->query($updateSql);
        echo json_encode([
            'success' => true,
            'bottle' => [
                'content' => $bottle['content'],
                'time' => $bottle['created_at']
            ]
        ]);
        error_log("Successfully picked bottle ID: " . $bottle['id']);
    } else {
        error_log("No bottles available");
        echo json_encode(['success' => false, 'message' => '海里暂时没有漂流瓶']);
    }
} catch (Exception $e) {
    error_log("Error in pick.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '系统错误：' . $e->getMessage()]);
}
?> 
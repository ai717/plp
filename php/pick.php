<?php
header('Content-Type: application/json');
require_once 'db.php';

$conn = DB::getConnection();
// 随机获取一个未被捡走的漂流瓶
$sql = "SELECT * FROM bottles WHERE picked = 0 ORDER BY RAND() LIMIT 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $bottle = $result->fetch_assoc();
    // 标记为已捡走
    $conn->query("UPDATE bottles SET picked = 1 WHERE id = " . $bottle['id']);
    echo json_encode([
        'success' => true,
        'bottle' => [
            'content' => $bottle['content'],
            'time' => $bottle['created_at']
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => '海里暂时没有漂流瓶']);
}
?> 
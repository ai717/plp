<?php
header('Content-Type: application/json');
require_once 'db.php';

try {
    $conn = DB::getConnection();
    $stats = [
        'total' => 0,
        'today' => 0,
        'picked' => 0,
        'waiting' => 0
    ];
    
    // 总数
    $result = $conn->query("SELECT COUNT(*) as count FROM bottles");
    $stats['total'] = $result->fetch_assoc()['count'];
    
    // 今日数量
    $result = $conn->query("SELECT COUNT(*) as count FROM bottles WHERE DATE(created_at) = CURDATE()");
    $stats['today'] = $result->fetch_assoc()['count'];
    
    // 已捡走数量
    $result = $conn->query("SELECT COUNT(*) as count FROM bottles WHERE picked = 1");
    $stats['picked'] = $result->fetch_assoc()['count'];
    
    // 等待被捡数量
    $stats['waiting'] = $stats['total'] - $stats['picked'];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => '获取统计信息失败']);
}
?> 
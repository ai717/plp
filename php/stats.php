<?php
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
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
    
    // 已捡走数量（被捡满5次的瓶子）
    $result = $conn->query("SELECT COUNT(*) as count FROM bottles WHERE pick_count >= 5");
    $stats['picked'] = $result->fetch_assoc()['count'];
    
    // 等待被捡数量（还没被捡满5次的瓶子）
    $result = $conn->query("SELECT COUNT(*) as count FROM bottles WHERE pick_count < 5");
    $stats['waiting'] = $result->fetch_assoc()['count'];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
} catch (Exception $e) {
    error_log("Error in stats.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '获取统计信息失败']);
}
?> 
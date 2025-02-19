<?php
require_once 'db.php';
try {
    $conn = DB::getConnection();
    echo "数据库连接成功！\n";
    
    // 测试数据库表
    $result = $conn->query("SHOW TABLES LIKE 'bottles'");
    if ($result->num_rows > 0) {
        echo "bottles表存在！\n";
        
        // 显示未被捡走的漂流瓶数量
        $result = $conn->query("SELECT COUNT(*) as count FROM bottles WHERE picked = 0");
        $row = $result->fetch_assoc();
        echo "当前有 " . $row['count'] . " 个未被捡走的漂流瓶\n";
        
        // 显示最新的漂流瓶
        $result = $conn->query("SELECT * FROM bottles ORDER BY created_at DESC LIMIT 1");
        if ($result->num_rows > 0) {
            $bottle = $result->fetch_assoc();
            echo "最新漂流瓶内容：" . $bottle['content'] . "\n";
            echo "创建时间：" . $bottle['created_at'] . "\n";
            echo "是否被捡走：" . ($bottle['picked'] ? '是' : '否') . "\n";
        }
    } else {
        echo "bottles表不存在！\n";
    }
} catch (Exception $e) {
    echo "连接失败：" . $e->getMessage();
}
?> 
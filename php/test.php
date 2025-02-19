<?php
require_once 'db.php';
try {
    $conn = DB::getConnection();
    echo "数据库连接成功！\n";
    
    // 显示MySQL版本和连接信息
    $version = $conn->query("SELECT VERSION() as ver")->fetch_assoc();
    echo "MySQL版本: " . $version['ver'] . "\n";
    echo "字符集: " . $conn->character_set_name() . "\n\n";
    
    // 测试数据库表
    $result = $conn->query("SHOW TABLES LIKE 'bottles'");
    if ($result->num_rows > 0) {
        echo "bottles表存在！\n";
        
        // 显示表结构
        $result = $conn->query("DESCRIBE bottles");
        echo "表结构：\n";
        while ($row = $result->fetch_assoc()) {
            echo $row['Field'] . " - " . $row['Type'] . "\n";
        }
        echo "\n";
        
        // 显示未被捡走的漂流瓶数量
        $result = $conn->query("SELECT COUNT(*) as count FROM bottles WHERE pick_count < 5");
        $row = $result->fetch_assoc();
        echo "当前有 " . $row['count'] . " 个可被捡的漂流瓶\n";
        
        // 显示最新的漂流瓶
        $result = $conn->query("SELECT * FROM bottles ORDER BY created_at DESC LIMIT 5");
        if ($result->num_rows > 0) {
            echo "\n最新5个漂流瓶：\n";
            while ($bottle = $result->fetch_assoc()) {
                echo "ID: " . $bottle['id'] . "\n";
                echo "内容: " . $bottle['content'] . "\n";
                echo "IP: " . $bottle['ip'] . "\n";
                echo "时间: " . $bottle['created_at'] . "\n";
                echo "被捡次数: " . $bottle['pick_count'] . "/5\n\n";
            }
        }

        // 显示瓶子的捡拾记录
        $result = $conn->query("
            SELECT b.id, b.content, b.pick_count, 
                   GROUP_CONCAT(DISTINCT bp.ip) as picked_by,
                   GROUP_CONCAT(bp.picked_at) as pick_times
            FROM bottles b
            LEFT JOIN bottle_picks bp ON b.id = bp.bottle_id
            GROUP BY b.id
            ORDER BY b.created_at DESC
            LIMIT 5
        ");

        if ($result->num_rows > 0) {
            echo "\n最新5个漂流瓶的捡拾记录：\n";
            while ($bottle = $result->fetch_assoc()) {
                echo "ID: " . $bottle['id'] . "\n";
                echo "内容: " . $bottle['content'] . "\n";
                echo "被捡次数: " . $bottle['pick_count'] . "/5\n";
                echo "捡瓶子的IP: " . ($bottle['picked_by'] ?: '无') . "\n";
                echo "捡瓶时间: " . ($bottle['pick_times'] ?: '无') . "\n\n";
            }
        }
    } else {
        echo "bottles表不存在！\n";
        
        // 尝试创建表
        $createTableSql = "CREATE TABLE bottles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content TEXT NOT NULL,
            ip VARCHAR(45) NOT NULL,
            created_at DATETIME NOT NULL,
            pick_count INT DEFAULT 0,
            INDEX (pick_count)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        if ($conn->query($createTableSql)) {
            echo "成功创建bottles表！\n";
        } else {
            echo "创建表失败：" . $conn->error . "\n";
        }
    }
} catch (Exception $e) {
    echo "连接失败：" . $e->getMessage() . "\n";
    echo "错误详情：" . print_r($e, true) . "\n";
}
?> 
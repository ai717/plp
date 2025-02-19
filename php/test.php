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
        
        // 测试写入
        $testSql = "INSERT INTO bottles (content, created_at, picked) VALUES ('测试漂流瓶', NOW(), 0)";
        if ($conn->query($testSql)) {
            echo "测试写入成功！\n";
            echo "插入ID: " . $conn->insert_id . "\n\n";
        } else {
            echo "写入失败：" . $conn->error . "\n\n";
        }
        
        // 显示所有漂流瓶
        $result = $conn->query("SELECT * FROM bottles ORDER BY created_at DESC");
        if ($result) {
            echo "当前所有漂流瓶：\n";
            while ($row = $result->fetch_assoc()) {
                echo "ID: " . $row['id'] . "\n";
                echo "内容: " . $row['content'] . "\n";
                echo "时间: " . $row['created_at'] . "\n";
                echo "状态: " . ($row['picked'] ? '已捡走' : '未捡走') . "\n\n";
            }
        } else {
            echo "查询失败：" . $conn->error . "\n";
        }
    } else {
        echo "bottles表不存在！\n";
        
        // 尝试创建表
        $createTableSql = "CREATE TABLE bottles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            picked TINYINT(1) DEFAULT 0,
            INDEX (picked)
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
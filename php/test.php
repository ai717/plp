<?php
require_once 'db.php';
try {
    $conn = DB::getConnection();
    echo "数据库连接成功！";
} catch (Exception $e) {
    echo "连接失败：" . $e->getMessage();
}
?> 
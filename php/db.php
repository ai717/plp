<?php
require_once 'config.php';

class DB {
    private static $conn = null;
    
    public static function getConnection() {
        if (self::$conn === null) {
            self::$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            if (self::$conn->connect_error) {
                die("连接失败: " . self::$conn->connect_error);
            }
            self::$conn->set_charset("utf8mb4");
        }
        return self::$conn;
    }
}

// 添加数据库连接池
class DBPool {
    private static $connections = [];
    private static $maxConnections = 10;
    
    public static function getConnection() {
        if (count(self::$connections) < self::$maxConnections) {
            $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            self::$connections[] = $conn;
            return $conn;
        }
        return self::$connections[array_rand(self::$connections)];
    }
}
?> 
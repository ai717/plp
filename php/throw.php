<?php
// 允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json');

// 记录所有请求头
$headers = getallheaders();
error_log("All headers: " . print_r($headers, true));

// 记录请求方法和内容类型
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Content Type: " . $_SERVER['CONTENT_TYPE'] ?? 'not set');
error_log("Raw input: " . file_get_contents('php://input'));

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit(0);
}

require_once 'db.php';

try {
    // 获取原始POST数据
    $raw_data = file_get_contents('php://input');
    error_log("Raw POST data: " . $raw_data);
    
    // 尝试解析JSON
    $data = json_decode($raw_data, true);
    error_log("Parsed data: " . print_r($data, true));
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg());
    }
    
    $content = $data['content'] ?? '';

    if (empty($content)) {
        error_log("Empty content received");
        echo json_encode(['success' => false, 'message' => '内容不能为空']);
        exit;
    }

    $conn = DB::getConnection();
    $content = $conn->real_escape_string($content);
    $sql = "INSERT INTO bottles (content, created_at, picked) VALUES ('$content', NOW(), 0)";

    if ($conn->query($sql)) {
        error_log("Successfully inserted bottle with content: " . $content);
        echo json_encode(['success' => true, 'message' => '漂流瓶已扔出']);
    } else {
        error_log("Failed to insert bottle: " . $conn->error);
        echo json_encode(['success' => false, 'message' => '保存失败: ' . $conn->error]);
    }
} catch (Exception $e) {
    error_log("Error in throw.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    echo json_encode(['success' => false, 'message' => '系统错误：' . $e->getMessage()]);
}
?> 
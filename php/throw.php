<?php
// 允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

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

session_start();

require_once 'db.php';

// 添加内容敏感词过滤
function containsSensitiveWords($content) {
    $sensitiveWords = ['广告', '违法', '色情', '赌博']; // 可以扩展
    foreach ($sensitiveWords as $word) {
        if (stripos($content, $word) !== false) {
            return true;
        }
    }
    return false;
}

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
    $ip = $_SERVER['REMOTE_ADDR'];
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }

    if (empty($content)) {
        error_log("Empty content received");
        echo json_encode(['success' => false, 'message' => '内容不能为空']);
        exit;
    }

    // 添加内容长度限制
    if (mb_strlen($content) > 1000) {
        error_log("Content too long");
        echo json_encode(['success' => false, 'message' => '内容不能超过1000字']);
        exit;
    }
    
    // 添加内容过滤
    $content = strip_tags($content);
    $content = htmlspecialchars($content, ENT_QUOTES, 'UTF-8');
    
    // 在内容检查时添加
    if (containsSensitiveWords($content)) {
        error_log("Sensitive content detected");
        echo json_encode(['success' => false, 'message' => '内容包含敏感词']);
        exit;
    }
    
          // 频率限制已移除（测试用）
  
      // 插入漂流瓶
      $conn = DB::getConnection();
-     $sql = "INSERT INTO bottles (content, ip, created_at, pick_count) VALUES (?, ?, NOW(), 0)";
+     $sql = "INSERT INTO bottles (content, ip, user_id, created_at, pick_count) VALUES (?, ?, ?, NOW(), 0)";
      $stmt = $conn->prepare($sql);
+     $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
-     $stmt->bind_param('ss', $content, $ip);
+     $stmt->bind_param('ssi', $content, $ip, $user_id);

      if ($stmt->execute()) {
          error_log("Successfully inserted bottle with content: " . $content);
        echo json_encode(['success' => true, 'message' => '漂流瓶已扔出']);
        // 在返回响应之前添加调试信息
        error_log("Response data: " . json_encode([
            'success' => true,
            'message' => '漂流瓶已扔出'
        ]));
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
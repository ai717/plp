<?php
// 允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit(0);
}

session_start();

require_once 'db.php';

try {
    // 检查是否登录
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => '请先登录']);
        exit;
    }

    $conn = DB::getConnection();
    $ip = $_SERVER['REMOTE_ADDR'];
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }

    // 随机获取一个可被当前用户捡的漂流瓶
    $sql = "SELECT b.* FROM bottles b 
            WHERE b.pick_count < 5 
            AND NOT EXISTS (
                SELECT 1 FROM bottle_picks bp 
                WHERE bp.bottle_id = b.id AND (bp.ip = ? OR bp.user_id = ?)
            )
            ORDER BY RAND() * id LIMIT 1";
            
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('si', $ip, $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $bottle = $result->fetch_assoc();
        
        // 开始事务
        $conn->begin_transaction();
        
        try {
            // 更新捡瓶次数
            $updateSql = "UPDATE bottles SET pick_count = pick_count + 1 WHERE id = ?";
            $stmt = $conn->prepare($updateSql);
            $stmt->bind_param('i', $bottle['id']);
            $stmt->execute();
            
            // 记录谁捡的
            $pickSql = "INSERT INTO bottle_picks (bottle_id, ip, user_id, picked_at) VALUES (?, ?, ?, NOW())";
            $stmt = $conn->prepare($pickSql);
            $stmt->bind_param('isi', $bottle['id'], $ip, $_SESSION['user_id']);
            $stmt->execute();
            
            // 提交事务
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'bottle' => [
                    'id' => $bottle['id'],
                    'content' => $bottle['content'],
                    'time' => $bottle['created_at'],
                    'pick_count' => $bottle['pick_count'] + 1  // 加1因为我们刚刚更新了
                ]
            ]);
            error_log("Successfully picked bottle ID: " . $bottle['id']);
        } catch (Exception $e) {
            // 出错时回滚
            $conn->rollback();
            throw $e;
        }
    } else {
        error_log("No available bottles for IP: $ip");
        echo json_encode(['success' => false, 'message' => '暂时没有可以捡的漂流瓶']);
    }
} catch (Exception $e) {
    error_log("Error in pick.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '系统错误：' . $e->getMessage()]);
}
?> 
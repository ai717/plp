<?php
class Logger {
    public static function log($level, $message, $context = []) {
        $date = date('Y-m-d H:i:s');
        $logMessage = "[$date] [$level] $message " . 
                     json_encode($context, JSON_UNESCAPED_UNICODE) . "\n";
        
        file_put_contents(
            __DIR__ . '/../logs/app.log',
            $logMessage,
            FILE_APPEND
        );
    }
} 
<?php
/**
 * 响应类
 */
class Response
{
    public static function json($data = [], $code = 200, $message = 'success')
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        http_response_code($code);
        
        echo json_encode([
            'code' => $code,
            'message' => $message,
            'data' => $data,
            'timestamp' => time()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function success($data = [], $message = '操作成功')
    {
        return self::json($data, 200, $message);
    }
    
    public static function error($message = '操作失败', $code = 400)
    {
        return self::json([], $code, $message);
    }
    
    public static function unauthorized($message = '未授权访问')
    {
        return self::json([], 401, $message);
    }
    
    public static function forbidden($message = '权限不足')
    {
        return self::json([], 403, $message);
    }
    
    public static function notFound($message = '资源不存在')
    {
        return self::json([], 404, $message);
    }
}

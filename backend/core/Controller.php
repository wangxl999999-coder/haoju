<?php
/**
 * 控制器基类
 */
class Controller
{
    protected $db;
    protected $user = null;
    
    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    
    protected function getParam($key, $default = null)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($input === null) {
            $input = $_REQUEST;
        }
        
        return isset($input[$key]) ? $input[$key] : $default;
    }
    
    protected function getParams()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($input === null) {
            $input = $_REQUEST;
        }
        
        return $input ?: [];
    }
    
    protected function requireLogin()
    {
        $token = JWT::getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('请先登录');
        }
        
        $payload = JWT::decode($token);
        
        if (!$payload || !isset($payload['sub'])) {
            Response::unauthorized('登录已过期，请重新登录');
        }
        
        $userId = $payload['sub'];
        
        $user = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $userId]
        );
        
        if (!$user) {
            Response::unauthorized('用户不存在');
        }
        
        $this->user = $user;
        return $user;
    }
    
    protected function requireAdmin()
    {
        $token = JWT::getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('请先登录');
        }
        
        $payload = JWT::decode($token);
        
        if (!$payload || !isset($payload['sub']) || !isset($payload['type']) || $payload['type'] !== 'admin') {
            Response::unauthorized('登录已过期，请重新登录');
        }
        
        $adminId = $payload['sub'];
        
        $admin = $this->db->fetch(
            'SELECT * FROM `admins` WHERE `id` = :id LIMIT 1',
            ['id' => $adminId]
        );
        
        if (!$admin) {
            Response::unauthorized('管理员不存在');
        }
        
        if (!$admin['status']) {
            Response::forbidden('账号已被禁用');
        }
        
        return $admin;
    }
    
    protected function validatePhone($phone)
    {
        return preg_match('/^1[3-9]\d{9}$/', $phone);
    }
    
    protected function validatePageParams($page, $pageSize)
    {
        $page = max(1, intval($page));
        $pageSize = max(1, min(100, intval($pageSize)));
        $offset = ($page - 1) * $pageSize;
        
        return [$page, $pageSize, $offset];
    }
}

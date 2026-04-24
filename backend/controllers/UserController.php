<?php
/**
 * 用户控制器
 */
class UserController extends Controller
{
    /**
     * 发送短信验证码
     */
    public function sendCode()
    {
        $phone = $this->getParam('phone');
        
        if (!$phone) {
            Response::error('请输入手机号');
        }
        
        if (!$this->validatePhone($phone)) {
            Response::error('手机号格式不正确');
        }
        
        $code = sprintf('%06d', rand(0, 999999));
        
        $config = require __DIR__ . '/../config/app.php';
        $expireMinutes = $config['sms']['expire_minutes'];
        $expireAt = date('Y-m-d H:i:s', time() + $expireMinutes * 60);
        
        $this->db->insert('sms_codes', [
            'phone' => $phone,
            'code' => $code,
            'expire_at' => $expireAt,
            'used' => 0
        ]);
        
        $debug = $config['debug'];
        if ($debug) {
            Response::success([
                'debug_code' => $code,
                'expire_at' => $expireAt
            ], '验证码已发送（调试模式）');
        }
        
        $this->sendSms($phone, $code);
        
        Response::success([], '验证码已发送');
    }
    
    /**
     * 发送短信
     */
    private function sendSms($phone, $code)
    {
        $config = require __DIR__ . '/../config/app.php';
        $smsConfig = $config['sms'];
        
        if ($smsConfig['driver'] === 'tencent') {
            $this->sendTencentSms($phone, $code);
        } elseif ($smsConfig['driver'] === 'aliyun') {
            $this->sendAliyunSms($phone, $code);
        }
    }
    
    /**
     * 腾讯云短信
     */
    private function sendTencentSms($phone, $code)
    {
        $config = require __DIR__ . '/../config/app.php';
        $smsConfig = $config['sms'];
        
        // 这里需要集成腾讯云短信SDK
        // 实际使用时需要安装腾讯云SDK
        // 此处为示例代码
    }
    
    /**
     * 阿里云短信
     */
    private function sendAliyunSms($phone, $code)
    {
        $config = require __DIR__ . '/../config/app.php';
        $smsConfig = $config['sms'];
        
        // 这里需要集成阿里云短信SDK
        // 实际使用时需要安装阿里云SDK
        // 此处为示例代码
    }
    
    /**
     * 登录/注册
     */
    public function login()
    {
        $phone = $this->getParam('phone');
        $code = $this->getParam('code');
        $inviteCode = $this->getParam('invite_code');
        
        if (!$phone) {
            Response::error('请输入手机号');
        }
        
        if (!$this->validatePhone($phone)) {
            Response::error('手机号格式不正确');
        }
        
        if (!$code) {
            Response::error('请输入验证码');
        }
        
        $smsCode = $this->db->fetch(
            'SELECT * FROM `sms_codes` 
             WHERE `phone` = :phone AND `code` = :code AND `used` = 0 
             ORDER BY `id` DESC LIMIT 1',
            ['phone' => $phone, 'code' => $code]
        );
        
        if (!$smsCode) {
            Response::error('验证码错误');
        }
        
        if (strtotime($smsCode['expire_at']) < time()) {
            Response::error('验证码已过期');
        }
        
        $this->db->update(
            'sms_codes',
            ['used' => 1],
            '`id` = :id',
            ['id' => $smsCode['id']]
        );
        
        $user = $this->db->fetch(
            'SELECT * FROM `users` WHERE `phone` = :phone LIMIT 1',
            ['phone' => $phone]
        );
        
        $isNewUser = false;
        
        if (!$user) {
            $isNewUser = true;
            $inviterId = null;
            
            if ($inviteCode) {
                $inviter = $this->db->fetch(
                    'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
                    ['id' => $inviteCode]
                );
                if ($inviter) {
                    $inviterId = $inviter['id'];
                }
            }
            
            $userId = $this->db->insert('users', [
                'phone' => $phone,
                'nickname' => '用户' . substr($phone, -4),
                'points' => 0,
                'inviter_id' => $inviterId
            ]);
            
            $user = $this->db->fetch(
                'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
                ['id' => $userId]
            );
            
            if ($inviterId) {
                $this->db->insert('invites', [
                    'inviter_id' => $inviterId,
                    'invitee_id' => $userId,
                    'reward_given' => 0
                ]);
            }
        }
        
        $token = JWT::generateToken($user['id'], 'user');
        
        Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'phone' => $user['phone'],
                'nickname' => $user['nickname'],
                'avatar' => $user['avatar'],
                'points' => $user['points']
            ],
            'is_new_user' => $isNewUser
        ], '登录成功');
    }
    
    /**
     * 获取用户信息
     */
    public function info()
    {
        $user = $this->requireLogin();
        
        Response::success([
            'id' => $user['id'],
            'phone' => $user['phone'],
            'nickname' => $user['nickname'],
            'avatar' => $user['avatar'],
            'points' => $user['points'],
            'created_at' => $user['created_at']
        ]);
    }
    
    /**
     * 更新用户信息
     */
    public function update()
    {
        $user = $this->requireLogin();
        
        $nickname = $this->getParam('nickname');
        $avatar = $this->getParam('avatar');
        
        $updateData = [];
        
        if ($nickname) {
            if (mb_strlen($nickname) > 20) {
                Response::error('昵称不能超过20个字符');
            }
            $updateData['nickname'] = $nickname;
        }
        
        if ($avatar) {
            $updateData['avatar'] = $avatar;
        }
        
        if (empty($updateData)) {
            Response::error('没有需要更新的内容');
        }
        
        $this->db->update(
            'users',
            $updateData,
            '`id` = :id',
            ['id' => $user['id']]
        );
        
        Response::success([], '更新成功');
    }
    
    /**
     * 我的积分记录
     */
    public function pointsLog()
    {
        $user = $this->requireLogin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $total = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `points_log` WHERE `user_id` = :user_id',
            ['user_id' => $user['id']]
        );
        
        $logs = $this->db->fetchAll(
            'SELECT * FROM `points_log` 
             WHERE `user_id` = :user_id 
             ORDER BY `id` DESC 
             LIMIT :offset, :limit',
            [
                'user_id' => $user['id'],
                'offset' => $offset,
                'limit' => $pageSize
            ]
        );
        
        $typeNames = [
            'publish' => '发布奖励',
            'invite' => '邀请奖励',
            'invited' => '被邀请奖励'
        ];
        
        foreach ($logs as &$log) {
            $log['type_name'] = isset($typeNames[$log['type']]) ? $typeNames[$log['type']] : $log['type'];
        }
        
        Response::success([
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $logs
        ]);
    }
    
    /**
     * 我的邀请列表
     */
    public function invites()
    {
        $user = $this->requireLogin();
        
        $page = $this->getParam('page', 1);
        $pageSize = $this->getParam('page_size', 20);
        list($page, $pageSize, $offset) = $this->validatePageParams($page, $pageSize);
        
        $total = $this->db->fetch(
            'SELECT COUNT(*) as count FROM `invites` WHERE `inviter_id` = :inviter_id',
            ['inviter_id' => $user['id']]
        );
        
        $invites = $this->db->fetchAll(
            'SELECT i.*, u.nickname, u.avatar, u.phone 
             FROM `invites` i 
             LEFT JOIN `users` u ON i.invitee_id = u.id 
             WHERE i.inviter_id = :inviter_id 
             ORDER BY i.id DESC 
             LIMIT :offset, :limit',
            [
                'inviter_id' => $user['id'],
                'offset' => $offset,
                'limit' => $pageSize
            ]
        );
        
        Response::success([
            'total' => intval($total['count']),
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $invites
        ]);
    }
}

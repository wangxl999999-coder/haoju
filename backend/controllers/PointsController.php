<?php
/**
 * 积分控制器
 */
class PointsController extends Controller
{
    /**
     * 处理发布内容审核通过的积分奖励
     * 这个方法通常被后台调用
     */
    public function rewardPublish($contentId)
    {
        $content = $this->db->fetch(
            'SELECT * FROM `contents` WHERE `id` = :id LIMIT 1',
            ['id' => $contentId]
        );
        
        if (!$content) {
            return false;
        }
        
        if (!$content['user_id']) {
            return false;
        }
        
        $user = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $content['user_id']]
        );
        
        if (!$user) {
            return false;
        }
        
        $config = require __DIR__ . '/../config/app.php';
        $rewardPoints = $config['points']['publish_reward'];
        
        $this->db->beginTransaction();
        
        try {
            $newBalance = $user['points'] + $rewardPoints;
            
            $this->db->update(
                'users',
                ['points' => $newBalance],
                '`id` = :id',
                ['id' => $user['id']]
            );
            
            $this->db->insert('points_log', [
                'user_id' => $user['id'],
                'points' => $rewardPoints,
                'balance' => $newBalance,
                'type' => 'publish',
                'related_id' => $contentId,
                'description' => '发布内容审核通过奖励'
            ]);
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    
    /**
     * 处理邀请奖励
     * 被邀请人登录后，给邀请人和被邀请人发放奖励
     */
    public function rewardInvite($inviteeId)
    {
        $invitee = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $inviteeId]
        );
        
        if (!$invitee) {
            return false;
        }
        
        if (!$invitee['inviter_id']) {
            return false;
        }
        
        $invite = $this->db->fetch(
            'SELECT * FROM `invites` WHERE `invitee_id` = :invitee_id LIMIT 1',
            ['invitee_id' => $inviteeId]
        );
        
        if (!$invite || $invite['reward_given']) {
            return false;
        }
        
        $inviter = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $invitee['inviter_id']]
        );
        
        if (!$inviter) {
            return false;
        }
        
        $config = require __DIR__ . '/../config/app.php';
        $inviteReward = $config['points']['invite_reward'];
        $invitedReward = $config['points']['invited_reward'];
        
        $this->db->beginTransaction();
        
        try {
            $inviterNewBalance = $inviter['points'] + $inviteReward;
            $this->db->update(
                'users',
                ['points' => $inviterNewBalance],
                '`id` = :id',
                ['id' => $inviter['id']]
            );
            
            $this->db->insert('points_log', [
                'user_id' => $inviter['id'],
                'points' => $inviteReward,
                'balance' => $inviterNewBalance,
                'type' => 'invite',
                'related_id' => $inviteeId,
                'description' => '邀请好友注册奖励'
            ]);
            
            $inviteeNewBalance = $invitee['points'] + $invitedReward;
            $this->db->update(
                'users',
                ['points' => $inviteeNewBalance],
                '`id` = :id',
                ['id' => $invitee['id']]
            );
            
            $this->db->insert('points_log', [
                'user_id' => $invitee['id'],
                'points' => $invitedReward,
                'balance' => $inviteeNewBalance,
                'type' => 'invited',
                'related_id' => $inviter['id'],
                'description' => '被邀请注册奖励'
            ]);
            
            $this->db->update(
                'invites',
                ['reward_given' => 1],
                '`id` = :id',
                ['id' => $invite['id']]
            );
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    
    /**
     * 绑定邀请关系
     * 被邀请人访问小程序时调用
     */
    public function bindInvite()
    {
        $inviterId = $this->getParam('inviter_id');
        $inviteeId = $this->getParam('invitee_id');
        
        if (!$inviterId || !$inviteeId) {
            Response::error('参数错误');
        }
        
        if ($inviterId == $inviteeId) {
            Response::error('不能邀请自己');
        }
        
        $invitee = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $inviteeId]
        );
        
        if (!$invitee) {
            Response::error('被邀请人不存在');
        }
        
        if ($invitee['inviter_id']) {
            Response::error('已绑定过邀请关系');
        }
        
        $inviter = $this->db->fetch(
            'SELECT * FROM `users` WHERE `id` = :id LIMIT 1',
            ['id' => $inviterId]
        );
        
        if (!$inviter) {
            Response::error('邀请人不存在');
        }
        
        $this->db->update(
            'users',
            ['inviter_id' => $inviterId],
            '`id` = :id',
            ['id' => $inviteeId]
        );
        
        $this->db->insert('invites', [
            'inviter_id' => $inviterId,
            'invitee_id' => $inviteeId,
            'reward_given' => 0
        ]);
        
        Response::success([], '绑定成功');
    }
}

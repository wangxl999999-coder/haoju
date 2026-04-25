-- 好句好段小程序数据库结构
-- 兼容MySQL 5.5+ 所有版本
-- 设置SQL模式，避免严格模式导致的默认值错误
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `haoju` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `haoju`;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `phone` varchar(20) NOT NULL COMMENT '手机号',
    `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
    `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
    `points` int(11) NOT NULL DEFAULT '0' COMMENT '积分',
    `openid` varchar(100) DEFAULT NULL COMMENT '微信openid',
    `unionid` varchar(100) DEFAULT NULL COMMENT '微信unionid',
    `inviter_id` int(11) DEFAULT NULL COMMENT '邀请人ID',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    `updated_at` datetime NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `phone` (`phone`),
    KEY `openid` (`openid`),
    KEY `inviter_id` (`inviter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 分类表
CREATE TABLE IF NOT EXISTS `categories` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(50) NOT NULL COMMENT '分类名称',
    `icon` varchar(255) DEFAULT NULL COMMENT '分类图标',
    `sort` int(11) NOT NULL DEFAULT '0' COMMENT '排序',
    `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态：0禁用，1启用',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    `updated_at` datetime NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- 初始化分类数据
INSERT INTO `categories` (`name`, `sort`, `status`, `created_at`, `updated_at`) VALUES
('名人名句', 1, 1, NOW(), NOW()),
('好段', 2, 1, NOW(), NOW()),
('格言', 3, 1, NOW(), NOW()),
('语录', 4, 1, NOW(), NOW()),
('美文短句', 5, 1, NOW(), NOW());

-- 3. 内容表
CREATE TABLE IF NOT EXISTS `contents` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `category_id` int(11) NOT NULL COMMENT '分类ID',
    `title` varchar(200) DEFAULT NULL COMMENT '标题',
    `content` text NOT NULL COMMENT '内容',
    `author` varchar(100) DEFAULT NULL COMMENT '作者/来源',
    `user_id` int(11) DEFAULT NULL COMMENT '发布用户ID（后台发布为NULL）',
    `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态：0待审核，1已通过，2已拒绝',
    `view_count` int(11) NOT NULL DEFAULT '0' COMMENT '浏览次数',
    `favorite_count` int(11) NOT NULL DEFAULT '0' COMMENT '收藏次数',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    `updated_at` datetime NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `category_id` (`category_id`),
    KEY `user_id` (`user_id`),
    KEY `status` (`status`),
    KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容表';

-- 4. 收藏表
CREATE TABLE IF NOT EXISTS `favorites` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL COMMENT '用户ID',
    `content_id` int(11) NOT NULL COMMENT '内容ID',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_content` (`user_id`, `content_id`),
    KEY `user_id` (`user_id`),
    KEY `content_id` (`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- 5. 积分记录表
CREATE TABLE IF NOT EXISTS `points_log` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL COMMENT '用户ID',
    `points` int(11) NOT NULL COMMENT '积分变化值',
    `balance` int(11) NOT NULL COMMENT '变动后余额',
    `type` varchar(50) NOT NULL COMMENT '类型：publish发布奖励，invite邀请奖励，invited被邀请奖励',
    `related_id` int(11) DEFAULT NULL COMMENT '关联ID',
    `description` varchar(255) DEFAULT NULL COMMENT '描述',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `type` (`type`),
    KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';

-- 6. 邀请关系表
CREATE TABLE IF NOT EXISTS `invites` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `inviter_id` int(11) NOT NULL COMMENT '邀请人ID',
    `invitee_id` int(11) NOT NULL COMMENT '被邀请人ID',
    `reward_given` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已发放奖励',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `invitee_id` (`invitee_id`),
    KEY `inviter_id` (`inviter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请关系表';

-- 7. 每日推荐表
CREATE TABLE IF NOT EXISTS `daily_recommendations` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL COMMENT '日期',
    `content_id` int(11) NOT NULL COMMENT '内容ID',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `date` (`date`),
    KEY `content_id` (`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日推荐表';

-- 8. 验证码表
CREATE TABLE IF NOT EXISTS `sms_codes` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `phone` varchar(20) NOT NULL COMMENT '手机号',
    `code` varchar(10) NOT NULL COMMENT '验证码',
    `expire_at` datetime NOT NULL COMMENT '过期时间',
    `used` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已使用',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `phone` (`phone`),
    KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验证码表';

-- 9. 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL COMMENT '用户名',
    `password` varchar(255) NOT NULL COMMENT '密码（加密）',
    `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
    `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态：0禁用，1启用',
    `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
    `created_at` datetime NOT NULL COMMENT '创建时间',
    `updated_at` datetime NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 初始化管理员账号（密码：admin123，需要自行修改）
INSERT INTO `admins` (`username`, `password`, `nickname`, `status`, `created_at`, `updated_at`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '超级管理员', 1, NOW(), NOW());

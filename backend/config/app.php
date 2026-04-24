<?php
/**
 * 应用配置文件
 */
return [
    'name' => '好句好段小程序',
    'debug' => true,
    'timezone' => 'Asia/Shanghai',
    
    // 微信小程序配置
    'miniprogram' => [
        'appid' => 'your_appid',
        'secret' => 'your_secret',
    ],
    
    // 短信验证码配置（可接入阿里云/腾讯云短信服务）
    'sms' => [
        'driver' => 'tencent', // tencent, aliyun
        'access_key' => 'your_access_key',
        'secret_key' => 'your_secret_key',
        'sign_name' => '好句好段',
        'template_code' => 'your_template_code',
        'expire_minutes' => 5,
    ],
    
    // JWT配置
    'jwt' => [
        'secret' => 'your_jwt_secret_key',
        'expire_hours' => 24 * 7, // 7天过期
    ],
    
    // 上传配置
    'upload' => [
        'max_size' => 2 * 1024 * 1024, // 2MB
        'allowed_types' => ['image/jpeg', 'image/png', 'image/gif'],
        'save_path' => __DIR__ . '/../uploads/',
    ],
    
    // 积分配置
    'points' => [
        'publish_reward' => 1, // 发布内容奖励积分
        'invite_reward' => 1, // 邀请奖励积分
        'invited_reward' => 1, // 被邀请奖励积分
    ],
];

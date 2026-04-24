<?php
/**
 * JWT工具类
 */
class JWT
{
    private static function getSecret()
    {
        $config = require __DIR__ . '/../config/app.php';
        return $config['jwt']['secret'];
    }
    
    private static function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data)
    {
        $data .= str_repeat('=', 4 - strlen($data) % 4);
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    public static function encode($payload)
    {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];
        
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac(
            'sha256',
            "$headerEncoded.$payloadEncoded",
            self::getSecret(),
            true
        );
        
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }
    
    public static function decode($token)
    {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        $signature = hash_hmac(
            'sha256',
            "$headerEncoded.$payloadEncoded",
            self::getSecret(),
            true
        );
        
        $expectedSignature = self::base64UrlEncode($signature);
        
        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            return null;
        }
        
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    public static function generateToken($userId, $type = 'user')
    {
        $config = require __DIR__ . '/../config/app.php';
        $expireHours = $config['jwt']['expire_hours'];
        
        $payload = [
            'sub' => $userId,
            'type' => $type,
            'iat' => time(),
            'exp' => time() + $expireHours * 3600
        ];
        
        return self::encode($payload);
    }
    
    public static function getTokenFromHeader()
    {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        
        if (isset($headers['authorization'])) {
            if (preg_match('/Bearer\s+(.*)$/i', $headers['authorization'], $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
}

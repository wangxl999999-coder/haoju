<?php
/**
 * API入口文件
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../core/autoload.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$basePath = '/api';
$path = substr($uri, strlen($basePath));

if (empty($path) || $path === '/') {
    Response::success([
        'name' => '好句好段小程序API',
        'version' => '1.0.0',
        'time' => date('Y-m-d H:i:s')
    ]);
}

function hyphenToCamelCase($string) {
    return lcfirst(str_replace(' ', '', ucwords(str_replace('-', ' ', $string))));
}

$path = ltrim($path, '/');
$segments = explode('/', $path);

$controllerName = !empty($segments[0]) ? ucfirst($segments[0]) . 'Controller' : '';
$action = !empty($segments[1]) ? $segments[1] : 'index';

$action = hyphenToCamelCase($action);

if (empty($controllerName)) {
    Response::notFound('接口不存在');
}

$controllerFile = __DIR__ . '/../controllers/' . $controllerName . '.php';

if (!file_exists($controllerFile)) {
    Response::notFound('接口不存在');
}

require_once $controllerFile;

if (!class_exists($controllerName)) {
    Response::notFound('接口不存在');
}

$controller = new $controllerName();

if (!method_exists($controller, $action)) {
    Response::notFound('接口不存在');
}

$reflection = new ReflectionMethod($controller, $action);

if (!$reflection->isPublic()) {
    Response::forbidden('无权访问');
}

try {
    $reflection->invoke($controller);
} catch (Exception $e) {
    $config = require __DIR__ . '/../config/app.php';
    if ($config['debug']) {
        Response::error($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(), 500);
    } else {
        Response::error('服务器内部错误', 500);
    }
}

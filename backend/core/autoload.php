<?php
/**
 * 自动加载类
 */
spl_autoload_register(function ($className) {
    $corePath = __DIR__ . '/' . $className . '.php';
    $controllerPath = __DIR__ . '/../controllers/' . $className . '.php';
    $modelPath = __DIR__ . '/../models/' . $className . '.php';
    $utilPath = __DIR__ . '/../utils/' . $className . '.php';
    
    if (file_exists($corePath)) {
        require_once $corePath;
    } elseif (file_exists($controllerPath)) {
        require_once $controllerPath;
    } elseif (file_exists($modelPath)) {
        require_once $modelPath;
    } elseif (file_exists($utilPath)) {
        require_once $utilPath;
    }
});

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/Controller.php';

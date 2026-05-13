<?php
require_once __DIR__ . '/../requestHandlers/get.php';
require_once __DIR__ . '/../requestHandlers/post.php';
require_once __DIR__ . '/../requestHandlers/put.php';
require_once __DIR__ . '/../requestHandlers/delete.php';

$routes = require __DIR__ . '/routes.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

$path = parse_url($uri, PHP_URL_PATH);
$path = str_replace('/gry/public', '', $path);

function matchRoute($routes, $method, $path)
{
    if (!isset($routes[$method])) {
        return null;
    }

    $urlParts = explode('/', trim($path, '/'));

    foreach ($routes[$method] as $route => $handler) {
        $routeParts = explode('/', trim($route, '/'));

        if (count($routeParts) !== count($urlParts)) {
            continue;
        }

        $params = [];
        $match = true;

        foreach ($routeParts as $i => $part) {
            if (str_starts_with($part, '{') && str_ends_with($part, '}')) {
                $name = trim($part, '{}');
                $params[$name] = $urlParts[$i];
            } elseif ($part !== $urlParts[$i]) {
                $match = false;
                break;
            }
        }

        if ($match) {
            return [$handler, $params];
        }
    }

    return null;
}

$result = matchRoute($routes, $method, $path);

if ($result) {
    [$handler, $params] = $result;

    if (is_callable($handler)) {
        $handler($params);
        exit;
    }
}

jsonResponse([
    'ok' => false,
    'errorCode' => 404,
    'errorName' => 'NotFound',
], 404);
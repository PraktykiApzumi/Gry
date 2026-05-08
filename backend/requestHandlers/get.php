<?php
require_once __DIR__ . '/helpers/json.php';
require_once __DIR__ . '/helpers/validation.php';
function getStatsWins($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'winData' => [],
    ]);
}

function getStatsPoints($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'pointData' => [],
    ]);
}

function getStatsPlayed($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'playedData' => [],
    ]);
}

function getPlayerByName($params)
{
    $playerName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'playerName' => $playerName,
        'playerData' => [],
    ]);
}

function getGameByName($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'gameData' => [],
    ]);
}

?>
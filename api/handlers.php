<?php

function jsonResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function postPlayer()
{
    jsonResponse(['ok' => true], 201);
}

function postGame()
{
    jsonResponse(['ok' => true], 201);
}

function postMatch()
{
    jsonResponse(['ok' => true], 201);
}

function getStatsWins($params)
{
    jsonResponse([
        'ok' => true,
        'gameName' => $params['name'],
        'winData' => [],
    ]);
}

function getStatsPoints($params)
{
    jsonResponse([
        'ok' => true,
        'gameName' => $params['name'],
        'pointData' => [],
    ]);
}

function getStatsPlayed($params)
{
    jsonResponse([
        'ok' => true,
        'gameName' => $params['name'],
        'playedData' => [],
    ]);
}

function getPlayerByName($params)
{
    jsonResponse([
        'ok' => true,
        'playerName' => $params['name'],
        'playerData' => [],
    ]);
}

function getGameByName($params)
{
    jsonResponse([
        'ok' => true,
        'gameName' => $params['name'],
        'gameData' => [],
    ]);
}

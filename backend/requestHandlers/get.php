<?php
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/json.php';
require_once __DIR__ . '/helpers/validation.php';

function getStatsWins($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'filter' => 'wins',
        'data' => dbHandle()->getWinSortedLeaderboard($gameName),
    ]);
}

function getStatsPoints($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'filter' => 'points',
        'data' => dbHandle()->getPointsSortedLeaderboard($gameName),
    ]);
}

function getStatsPlayed($params)
{
    $gameName = validateRouteNameParam($params);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'filter' => 'played',
        'data' => dbHandle()->getPlayedSortedLeaderboard($gameName),
    ]);
}

function getPlayerByName($params)
{
    $playerName = validateRouteNameParam($params);

    $row = dbHandle()->getPlayerByNick($playerName);
    if ($row === null) {
        errorResponse('Nie znaleziono gracza.', 404);
    }

    jsonResponse([
        'ok' => true,
        'playerName' => $playerName,
        'playerData' => $row,
    ]);
}

function getGameByName($params)
{
    $gameName = validateRouteNameParam($params);

    $row = dbHandle()->getGameRowByName($gameName);
    if ($row === null) {
        errorResponse('Nie znaleziono gry.', 404);
    }

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'gameData' => $row,
    ]);
}

function getPlayerSuggestions($params)
{
    $prefix = validateRouteNameParam($params, 1, 100);
    jsonResponse([
        'ok' => true,
        'prefix' => $prefix,
        'suggestions' => dbHandle()->getPlayerSuggestionsByPrefix($prefix, 3),
    ]);
}

function getGameSuggestions($params)
{
    $prefix = validateRouteNameParam($params, 1, 100);
    jsonResponse([
        'ok' => true,
        'prefix' => $prefix,
        'suggestions' => dbHandle()->getGameSuggestionsByPrefix($prefix, 3),
    ]);
}

function getGameHistory($params)
{
    $gameName = validateRouteNameParam($params);
    $history = dbHandle()->getMatchHistoryByGame($gameName);

    jsonResponse([
        'ok' => true,
        'gameName' => $gameName,
        'history' => $history,
    ]);
}

function getPlayerHistory($params)
{
    $playerName = validateRouteNameParam($params);
    $history = dbHandle()->getMatchHistoryByPlayer($playerName);

    jsonResponse([
        'ok' => true,
        'playerName' => $playerName,
        'history' => $history,
    ]);
}

function getRecentGames($params = [])
{
    jsonResponse([
        'ok' => true,
        'history' => dbHandle()->getRecentMatches(20),
    ]);
}

?>
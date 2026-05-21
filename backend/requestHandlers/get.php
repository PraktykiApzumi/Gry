<?php
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/json.php';
require_once __DIR__ . '/helpers/validation.php';

function getStats($params)
{
    $scope = $params['scope'] ?? '';
    $name = validateRouteNameParam($params);

    if (!in_array($scope, ['game', 'type'], true)) {
        errorResponse('Niepoprawny zakres statystyk.', 400, ['scope' => 'Dozwolone: game, type.']);
    }

    jsonResponse([
        'ok' => true,
        'scope' => $scope,
        'name' => $name,
        'data' => dbHandle()->getLeaderboard($scope, $name),
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

function getAdminPlayers($params = [])
{
    jsonResponse([
        'ok' => true,
        'data' => dbHandle()->getAllPlayers(),
    ]);
}

function getAdminGames($params = [])
{
    jsonResponse([
        'ok' => true,
        'data' => dbHandle()->getAllGames(),
    ]);
}

function getAdminMatches($params = [])
{
    jsonResponse([
        'ok' => true,
        'data' => dbHandle()->getAllMatches(),
    ]);
}

function getGameScores($params)
{    
    $id = validateRouteIdParam($params, 'gameId');
    jsonResponse([
        'ok' => true,
        'data' => dbHandle()->getAllScores($id),
    ]);
}

?>

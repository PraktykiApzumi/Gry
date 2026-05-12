<?php
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/json.php';
require_once __DIR__ . '/helpers/validation.php';

function deletePlayer($params)
{
    $id = validateRouteIdParam($params);
    if (!dbHandle()->playerExists($id)) {
        errorResponse('Nie znaleziono gracza.', 404);
    }

    dbHandle()->deactivatePlayer($id);
    jsonResponse(['ok' => true]);
}

function deleteGame($params)
{
    $id = validateRouteIdParam($params);
    if (!dbHandle()->gameExists($id)) {
        errorResponse('Nie znaleziono gry.', 404);
    }

    dbHandle()->deactivateGame($id);
    jsonResponse(['ok' => true]);
}

function deleteMatch($params)
{
    $id = validateRouteIdParam($params);
    if (!dbHandle()->matchExists($id)) {
        errorResponse('Nie znaleziono rozgrywki.', 404);
    }

    dbHandle()->deleteMatchWithScores($id);
    jsonResponse(['ok' => true]);
}

?>

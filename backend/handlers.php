<?php

function jsonResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function errorResponse($message, $statusCode = 400, $details = [])
{
    jsonResponse([
        'ok' => false,
        'error' => $message,
        'details' => $details,
    ], $statusCode);
}

function readJsonBody()
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        errorResponse('Body requestu nie moze byc puste.');
    }

    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) {
        errorResponse('Nieprawidlowy JSON w body.');
    }
    return $decoded;
}

function validateRequiredString($data, $field, $min = 1, $max = 100)
{
    if (!array_key_exists($field, $data)) {
        return 'Pole jest wymagane.';
    }

    if (!is_string($data[$field])) {
        return 'Pole musi byc tekstem.';
    }

    $value = trim($data[$field]);
    $length = mb_strlen($value);
    if ($length < $min || $length > $max) {
        return "Pole musi miec od {$min} do {$max} znakow.";
    }

    return null;
}

function validateRequiredInt($data, $field, $min = null, $max = null)
{
    if (!array_key_exists($field, $data)) {
        return 'Pole jest wymagane.';
    }

    if (!is_int($data[$field])) {
        return 'Pole musi byc liczba calkowita.';
    }

    $value = $data[$field];
    if ($min !== null && $value < $min) {
        return "Pole nie moze byc mniejsze niz {$min}.";
    }

    if ($max !== null && $value > $max) {
        return "Pole nie moze byc wieksze niz {$max}.";
    }

    return null;
}

function validateRouteNameParam($params)
{
    if (!isset($params['name']) || !is_string($params['name'])) {
        errorResponse('Parametr "name" jest wymagany.');
    }

    $name = trim($params['name']);
    $length = mb_strlen($name);
    if ($length < 2 || $length > 100) {
        errorResponse('Parametr "name" musi miec od 2 do 100 znakow.');
    }

    return $name;
}

function postPlayer()
{
    $data = readJsonBody();
    $errors = [];

    $nameError = validateRequiredString($data, 'name', 2, 100);
    if ($nameError !== null) {
        $errors['name'] = $nameError;
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    jsonResponse(['ok' => true], 201);
}

function postGame()
{
    $data = readJsonBody();
    $errors = [];

    $nameError = validateRequiredString($data, 'name', 2, 100);
    if ($nameError !== null) {
        $errors['name'] = $nameError;
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    jsonResponse(['ok' => true], 201);
}

function postMatch()
{
    $data = readJsonBody();
    $errors = [];

    $gameNameError = validateRequiredString($data, 'gameName', 2, 100);

    if ($gameNameError !== null) {
        $errors['gameName'] = $gameNameError;
    }

    if (
        !isset($data['players']) ||
        !is_array($data['players']) ||
        count($data['players']) === 0
    ) {
        $errors['players'] = 'Lista graczy jest wymagana.';
    } else {

        foreach ($data['players'] as $index => $player) {

            if (!is_array($player)) {
                $errors["players.$index"] = 'Niepoprawny gracz.';
                continue;
            }

            $nameError = validateRequiredString($player, 'name', 2, 100);

            if ($nameError !== null) {
                $errors["players.$index.name"] = $nameError;
            }

            $pointsError = validateRequiredInt($player, 'points', 0);

            if ($pointsError !== null) {
                $errors["players.$index.points"] = $pointsError;
            }
        }
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    jsonResponse([
        'ok' => true,
        'match' => $data
    ], 201);
}
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

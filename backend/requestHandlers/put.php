<?php
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/json.php';
require_once __DIR__ . '/helpers/validation.php';

function putPlayer($params)
{
    $id = validateRouteIdParam($params);
    $data = readJsonBody();
    $errors = [];

    $nameError = validateRequiredString($data, 'name', 2, 100);
    if ($nameError !== null) {
        $errors['name'] = $nameError;
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    if (!dbHandle()->playerExists($id)) {
        errorResponse('Nie znaleziono gracza.', 404);
    }

    $updated = dbHandle()->updatePlayer($id, trim($data['name']));
    if (!$updated) {
        errorResponse('Nie udalo sie zaktualizowac gracza. Nick moze juz istniec.', 409);
    }

    jsonResponse(['ok' => true]);
}

function putGame($params)
{
    $id = validateRouteIdParam($params);
    $data = readJsonBody();
    $errors = [];

    $nameError = validateRequiredString($data, 'name', 2, 100);
    if ($nameError !== null) {
        $errors['name'] = $nameError;
    }

    $typeError = validateRequiredString($data, 'type', 1, 100);
    if ($typeError !== null) {
        $errors['type'] = $typeError;
    }

    $winTypeError = validateRequiredString($data, 'winType', 1, 100);
    if ($winTypeError !== null) {
        $errors['winType'] = $winTypeError;
    }

    $minPlayersError = validateRequiredInt($data, 'minPlayers', 1);
    if ($minPlayersError !== null) {
        $errors['minPlayers'] = $minPlayersError;
    }

    $maxPlayersError = validateRequiredInt($data, 'maxPlayers', 1);
    if ($maxPlayersError !== null) {
        $errors['maxPlayers'] = $maxPlayersError;
    }

    if (isset($data['minPlayers'], $data['maxPlayers']) && $data['minPlayers'] > $data['maxPlayers']) {
        $errors['minPlayers'] = 'minPlayers nie moze byc mniejsze niz maxPlayers.';
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    if (!dbHandle()->gameExists($id)) {
        errorResponse('Nie znaleziono gry.', 404);
    }

    $updated = dbHandle()->updateGame(
        $id,
        trim($data['name']),
        trim($data['type']),
        (int) $data['minPlayers'],
        (int) $data['maxPlayers'],
        trim($data['winType'])
    );
    if (!$updated) {
        errorResponse('Nie udalo sie zaktualizowac gry. Nazwa moze juz istniec.', 409);
    }

    jsonResponse(['ok' => true]);
}

function putMatch($params)
{
    $id = validateRouteIdParam($params);
    $data = readJsonBody();
    $errors = [];

    $gameIdError = validateRequiredInt($data, 'gameId', 1);
    if ($gameIdError !== null) {
        $errors['gameId'] = $gameIdError;
    }

    $winnerIdError = validateRequiredInt($data, 'winnerId', 1);
    if ($winnerIdError !== null) {
        $errors['winnerId'] = $winnerIdError;
    }

    $playerCountError = validateRequiredInt($data, 'playerCount', 1);
    if ($playerCountError !== null) {
        $errors['playerCount'] = $playerCountError;
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    if (!dbHandle()->matchExists($id)) {
        errorResponse('Nie znaleziono rozgrywki.', 404);
    }
    if (!dbHandle()->gameExists((int) $data['gameId'])) {
        errorResponse('Nie znaleziono gry.', 404, ['gameId' => 'Brak gry o podanym ID.']);
    }
    if (!dbHandle()->playerExists((int) $data['winnerId'])) {
        errorResponse('Nie znaleziono gracza-zwyciezcy.', 404, ['winnerId' => 'Brak gracza o podanym ID.']);
    }

    dbHandle()->updateMatch(
        $id,
        (int) $data['winnerId'],
        (int) $data['gameId'],
        (int) $data['playerCount']
    );

    jsonResponse(['ok' => true]);
}

function putScore($params)
{
    $id = validateRouteIdParam($params);
    $data = readJsonBody();
    $errors = [];

    $matchIdError = validateRequiredInt($data, 'matchId', 1);
    if ($matchIdError !== null) {
        $errors['matchId'] = $matchIdError;
    }

    $playerIdError = validateRequiredInt($data, 'playerId', 1);
    if ($playerIdError !== null) {
        $errors['playerId'] = $playerIdError;
    }

    $pointsError = validateRequiredInt($data, 'points', 0);
    if ($pointsError !== null) {
        $errors['points'] = $pointsError;
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    if (!dbHandle()->matchExists((int) $data['matchId'])) {
        errorResponse('Nie znaleziono rozgrywki.', 404, ['matchId' => 'Brak rozgrywki o podanym ID.']);
    }
    if (!dbHandle()->playerExists((int) $data['playerId'])) {
        errorResponse('Nie znaleziono gracza.', 404, ['playerId' => 'Brak gracza o podanym ID.']);
    }
    if ((int) $id !== (int) $data['playerId']) {
        errorResponse('Nieprawidlowy identyfikator wyniku.', 400, ['playerId' => 'ID w URL musi byc takie samo jak playerId.']);
    }
    if (!dbHandle()->matchScoreExists((int) $data['matchId'], (int) $data['playerId'])) {
        errorResponse('Nie znaleziono wyniku dla podanej rozgrywki i gracza.', 404);
    }

    dbHandle()->updateScore(
        $id,
        (int) $data['matchId'],
        (int) $data['playerId'],
        (int) $data['points']
    );

    jsonResponse(['ok' => true]);
}

?>

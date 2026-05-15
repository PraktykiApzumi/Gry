<?php
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/json.php';
require_once __DIR__ . '/helpers/validation.php';

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

    $name = trim($data['name']);
    if (!dbHandle()->addPlayer($name)) {
        errorResponse('Gracz o takim nicku juz istnieje.', 409);
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

    $minPlayers = $data['minPlayers'];
    $maxPlayers = $data['maxPlayers'];
    if ($minPlayers > $maxPlayers) {
        $errors['minPlayers'] = 'minPlayers nie moze byc mniejsze niz maxPlayers.';
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    $name = trim($data['name']);
    $type = trim($data['type']);
    $winType = trim($data['winType']);

    if (!dbHandle()->addGame($name, $type, $minPlayers, $maxPlayers, $winType)) {
        errorResponse('Gra o takiej nazwie juz istnieje.', 409);
    }

    jsonResponse(['ok' => true], 201);
}

function postMatch()
{
    $data = readJsonBody();
    $errors = [];
    $seenPlayerNames = [];
    $game = null;
    $winType = 'punktowa';

    $gameNameError = validateRequiredString($data, 'gameName', 2, 100);

    if ($gameNameError !== null) {
        $errors['gameName'] = $gameNameError;
    } else {
        $game = dbHandle()->getGameRowByName(trim($data['gameName']));
        if ($game === null) {
            $errors['gameName'] = 'Brak gry w bazie.';
        } else {
            $winType = trim((string) $game['rodzaj_wygranej']);
        }
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
            } else {
                $normalizedName = mb_strtolower(trim((string) $player['name']));
                if (isset($seenPlayerNames[$normalizedName])) {
                    $errors["players.$index.name"] = 'Ten gracz jest juz dodany do tej rozgrywki.';
                } else {
                    $seenPlayerNames[$normalizedName] = true;
                }
            }

            if ($winType !== 'inna') {
                $pointsError = validateRequiredInt($player, 'points', 0);

                if ($pointsError !== null) {
                    $errors["players.$index.points"] = $pointsError;
                }
            }
        }
    }

    if ($winType === 'inna') {
        $winnerNameError = validateRequiredString($data, 'winnerName', 2, 100);
        if ($winnerNameError !== null) {
            $errors['winnerName'] = $winnerNameError;
        }
    }

    if (!empty($errors)) {
        errorResponse('Bledne dane wejsciowe.', 400, $errors);
    }

    $gameName = trim($data['gameName']);
    $gameId = (int) $game['id'];
    $players = $data['players'];

    $playerRowsByIndex = [];
    $missingPlayers = [];
    foreach ($players as $i => $player) {
        $nick = trim($player['name']);
        $row = dbHandle()->getPlayerByNick($nick);
        if ($row === null) {
            $missingPlayers[] = $nick;
        } else {
            $playerRowsByIndex[$i] = $row;
        }
    }
    if (!empty($missingPlayers)) {
        errorResponse(
            'Nie wszyscy gracze istnieja w bazie.',
            404,
            ['players' => $missingPlayers]
        );
    }

    $winnerIndex = 0;
    if ($winType === 'inna') {
        $winnerName = mb_strtolower(trim((string) $data['winnerName']));
        $winnerIndex = null;
        foreach ($players as $i => $player) {
            if (mb_strtolower(trim((string) $player['name'])) === $winnerName) {
                $winnerIndex = $i;
                break;
            }
        }

        if ($winnerIndex === null) {
            errorResponse('Zwyciezca musi byc jednym z graczy rozgrywki.', 400, ['winnerName' => 'Wybierz gracza z listy.']);
        }
    } else {
        $bestPoints = (int) $players[0]['points'];
        foreach ($players as $i => $player) {
            $points = (int) $player['points'];
            $isBetter = $winType === 'punktowa-malejaca'
                ? $points < $bestPoints
                : $points > $bestPoints;

            if ($isBetter) {
                $bestPoints = $points;
                $winnerIndex = $i;
            }
        }
    }

    $winnerId = (int) $playerRowsByIndex[$winnerIndex]['id'];

    $matchDate = date('Y-m-d H:i:s');
    $playerCount = count($players);
    $matchId = dbHandle()->addMatch($winnerId, $gameId, $matchDate, $playerCount);

    foreach ($players as $i => $player) {
        $pid = (int) $playerRowsByIndex[$i]['id'];
        $points = $winType === 'inna' ? 0 : (int) $player['points'];
        dbHandle()->addScore($matchId, $pid, $points);
    }

    jsonResponse([
        'ok' => true,
        'matchId' => $matchId,
    ], 201);
}

?>

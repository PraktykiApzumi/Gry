<?php
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

?>
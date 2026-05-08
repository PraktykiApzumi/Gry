<?php
require_once __DIR__ . '/json.php';
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
?>
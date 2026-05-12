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

function validateRouteNameParam($params, $min = 2, $max = 100)
{
    if (!isset($params['name']) || !is_string($params['name'])) {
        errorResponse('Parametr "name" jest wymagany.');
    }

    $name = trim($params['name']);
    $length = mb_strlen($name);
    if ($length < $min || $length > $max) {
        errorResponse("Parametr \"name\" musi miec od {$min} do {$max} znakow.");
    }

    return $name;
}

function validateRouteIdParam($params, $field = 'id')
{
    if (!isset($params[$field])) {
        errorResponse("Parametr \"{$field}\" jest wymagany.");
    }

    $id = filter_var($params[$field], FILTER_VALIDATE_INT);
    if ($id === false || $id <= 0) {
        errorResponse("Parametr \"{$field}\" musi byc dodatnia liczba calkowita.");
    }

    return (int) $id;
}
?>
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

?>
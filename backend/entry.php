<?php
require_once('vendor/autoload.php');

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();

require_once __DIR__ . '/../api/router.php';

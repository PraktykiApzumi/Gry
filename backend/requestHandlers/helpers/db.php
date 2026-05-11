<?php
require_once __DIR__ . '/../../database/databaseHandler.php';

function dbHandle(): DatabaseHandle
{
    return DatabaseHandle::getInstance();
}


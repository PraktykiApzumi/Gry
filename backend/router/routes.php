<?php

return [
    'POST' => [
        'api/player' => 'postPlayer',
        'api/game' => 'postGame',
        'api/match' => 'postMatch',
    ],
    'GET' => [
        'api/stats/wins/{name}' => 'getStatsWins',
        'api/stats/points/{name}' => 'getStatsPoints',
        'api/stats/played/{name}' => 'getStatsPlayed',
        'api/player/{name}' => 'getPlayerByName',
        'api/game/{name}' => 'getGameByName',
    ],
];

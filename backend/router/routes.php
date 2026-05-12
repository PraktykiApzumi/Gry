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

        'api/suggest/player/{name}' => 'getPlayerSuggestions',
        'api/suggest/game/{name}' => 'getGameSuggestions',

        'api/history/game/{name}' => 'getGameHistory',        
        'api/history/player/{name}' => 'getPlayerHistory',        
        'api/history/recent' => 'getRecentGames',

        'api/admin/players' => 'getAdminPlayers',
        'api/admin/games' => 'getAdminGames',
        'api/admin/matches' => 'getAdminMatches',
        'api/admin/scores/{gameId}' => 'getGameScores',
    ],
    'PUT' => [
        'api/player/{id}' => 'putPlayer',
        'api/game/{id}' => 'putGame',
        'api/match/{id}' => 'putMatch',
        'api/score/{id}' => 'putScore',
    ],
    'DELETE' => [
        'api/player/{id}' => 'deletePlayer',
        'api/game/{id}' => 'deleteGame',
        'api/match/{id}' => 'deleteMatch',
    ],
];

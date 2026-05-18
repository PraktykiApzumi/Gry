<?php

return [
    'POST' => [
        'api/player' => 'postPlayer',
        'api/game' => 'postGame',
        'api/match' => 'postMatch',
    ],
    'GET' => [
        'api/stats/{scope}/{filter}/{name}' => 'getStats',

        'api/player/{name}' => 'getPlayerByName',
        'api/game/{name}' => 'getGameByName',

        'api/suggest/player/{name}' => 'getPlayerSuggestions',
        'api/suggest/game/{name}' => 'getGameSuggestions',

        'api/history/game/{name}' => 'getGameHistory',        
        'api/history/player/{name}' => 'getPlayerHistory',        
        'api/history/recent' => 'getRecentGames',

        'api/panel/players' => 'getAdminPlayers',
        'api/panel/games' => 'getAdminGames',
        'api/panel/matches' => 'getAdminMatches',
        'api/panel/scores/{gameId}' => 'getGameScores',
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

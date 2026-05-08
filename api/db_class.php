<?php

class DatabaseHandle {

    private static ?DatabaseHandle $instance = null;
    private PDO $connection;

    private function __construct($host, $dbname, $username, $password) {
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";

        try {
            $this->connection = new PDO($dsn, $username, $password);
        } catch (PDOException $e) {
            die("connection error: " . $e->getMessage());
        }
    }

    public static function getInstance(): DatabaseHandle {
        $host = 'localhost';
        $dbname = 'planszowki';
        $username = 'root';
        $password = '';

        if (self::$instance === null) {
            self::$instance = new DatabaseHandle($host, $dbname, $username, $password);
        }
        return self::$instance;
    }

    public function addPlayer($nickname) {
        $sql = "INSERT INTO gracze (nick) VALUES (:nickname)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'nickname' => $nickname,
        ]);
    }

    public function addGame($name, $type, $minPlayers, $maxPlayers, $winType) {
        $sql = "INSERT INTO gry (nazwa, rodzaj, min_graczy, max_graczy, rodzaj_wygranej)
                VALUES (:name, :type, :min_players, :max_players, :win_type)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'name' => $name,
            'type' => $type,
            'min_players' => $minPlayers,
            'max_players' => $maxPlayers,
            'win_type' => $winType
        ]);
    }

    public function addMatch($winnerId, $gameId, $matchDate, $result) {
        $sql = "INSERT INTO rozgrywki (id_zwyciezcy, id_gry, data_rozgrywki, wynik)
                VALUES (:winner_id, :game_id, :match_date, :result)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'winner_id' => $winnerId,
            'game_id' => $gameId,
            'match_date' => $matchDate,
            'result' => $result
        ]);
    }

    public function addScore($matchId, $playerId, $points) {
        $sql = "INSERT INTO wyniki (id_rozgrywki, id_gracza, punkty)
                VALUES (:match_id, :player_id, :points)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'match_id' => $matchId,
            'player_id' => $playerId,
            'points' => $points
        ]);
    }

    public function getWinSortedLeaderboard($gameName)
    {
        $sql = "
        SELECT 
            g.id,
            g.nazwa,
            COUNT(w.id_rozgrywki) AS played_games,
            COUNT(r.id_wygranego) AS wins,
            SUM(w.punkty) AS total_points
        FROM gracze g
        JOIN rozgrywki r 
            ON g.id = r.id_wygranego
        JOIN gry gr 
            ON r.id_gry = gr.id
        WHERE gr.nazwa = :game_name
        GROUP BY g.id, g.nazwa
        ORDER BY wins DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPlayedSortedLeaderboard($gameName)
    {
        $sql = "
        SELECT 
            g.id,
            g.nazwa,
            COUNT(w.id_rozgrywki) AS played_games,
            COUNT(r.id_wygranego) AS wins,
            SUM(w.punkty) AS total_points
        FROM gracze g
        JOIN wyniki w 
            ON g.id = w.id_gracza
        JOIN rozgrywki r 
            ON w.id_rozgrywki = r.id
        JOIN gry gr 
            ON r.id_gry = gr.id
        WHERE gr.nazwa = :game_name
        GROUP BY g.id, g.nazwa
        ORDER BY played_games DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPointsSortedLeaderboard($gameName)
    {
        $sql = "
        SELECT 
            g.id,
            g.nazwa,
            COUNT(w.id_rozgrywki) AS played_games,
            COUNT(r.id_wygranego) AS wins,
            SUM(w.punkty) AS total_points
        FROM gracze g
        JOIN wyniki w 
            ON g.id = w.id_gracza
        JOIN rozgrywki r 
            ON w.id_rozgrywki = r.id
        JOIN gry gr 
            ON r.id_gry = gr.id
        WHERE gr.nazwa = :game_name
        GROUP BY g.id, g.nazwa
        ORDER BY total_points DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
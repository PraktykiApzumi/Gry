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

    public static function getInstance($host, $dbname, $username, $password): DatabaseHandle {
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
}
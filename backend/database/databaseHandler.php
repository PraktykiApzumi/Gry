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
        $host = $_ENV['DB_HOST'];
        $dbname = $_ENV['DB_NAME'];
        $username = $_ENV['DB_USER'];
        $password = $_ENV['DB_PASSWORD'];

        if (self::$instance === null) {
            self::$instance = new DatabaseHandle($host, $dbname, $username, $password);
        }
        return self::$instance;
    }

    public function addPlayer($nickname): bool {
        $sql = "SELECT * from `gracze` where `gracze`.`nick` = :nick";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            "nick"=> $nickname
        ]);
        if( $stmt->rowCount() > 0) return false;

        $sql = "INSERT INTO gracze (nick) VALUES (:nickname)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'nickname' => $nickname,
        ]);
        return true;
    }

    public function addGame($name, $type, $minPlayers, $maxPlayers, $winType): bool {
        $sql = "SELECT * from `gry` where `gry`.`nazwa` = :nazwa"; 
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            "nazwa"=> $name
        ]);
        if( $stmt->rowCount() > 0) return false;

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
        return true;
    }

    public function addMatch($winnerId, $gameId, $matchDate, $playerCount): int {
        $sql = "INSERT INTO rozgrywki (id_zwyciezcy, id_gry, data, ilosc_graczy)
                VALUES (:winner_id, :game_id, :match_date, :result)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'winner_id' => $winnerId,
            'game_id' => $gameId,
            'match_date' => $matchDate,
            'result' => $playerCount
        ]);
        return (int) $this->connection->lastInsertId();
    }

    public function getPlayerByNick(string $nick): ?array {
        $sql = 'SELECT * FROM gracze WHERE nick = :nick LIMIT 1';
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nick' => $nick]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    public function getGameRowByName(string $name): ?array {
        $sql = 'SELECT * FROM gry WHERE nazwa = :nazwa LIMIT 1';
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nazwa' => $name]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    public function getPlayerSuggestionsByPrefix(string $prefix, int $limit = 3): array {
        $safeLimit = max(1, min(10, $limit));
        $sql = "SELECT nick FROM gracze WHERE nick LIKE :prefix ORDER BY nick ASC LIMIT {$safeLimit}";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['prefix' => $prefix . '%']);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getGameSuggestionsByPrefix(string $prefix, int $limit = 3): array {
        $safeLimit = max(1, min(10, $limit));
        $sql = "SELECT nazwa FROM gry WHERE nazwa LIKE :prefix ORDER BY nazwa ASC LIMIT {$safeLimit}";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['prefix' => $prefix . '%']);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function addScore($matchId, $playerId, $points) {
        $sql = "INSERT INTO wyniki (id_rozgrywki, id_gracza, liczba_punktow)
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
            g.nick,
            COUNT(DISTINCT r.id) AS played_games,
            COUNT(DISTINCT CASE WHEN r.id_zwyciezcy = g.id THEN r.id END) AS wins,
            SUM(w.liczba_punktow) AS total_points
        FROM gracze g
        JOIN wyniki w
            ON g.id = w.id_gracza
        JOIN rozgrywki r
            ON w.id_rozgrywki = r.id
        JOIN gry gr
            ON r.id_gry = gr.id
        WHERE gr.nazwa = :game_name
        GROUP BY g.id, g.nick
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
            g.nick,
            COUNT(DISTINCT r.id) AS played_games,
            COUNT(DISTINCT CASE WHEN r.id_zwyciezcy = g.id THEN r.id END) AS wins,
            SUM(w.liczba_punktow) AS total_points
        FROM gracze g
        JOIN wyniki w 
            ON g.id = w.id_gracza
        JOIN rozgrywki r 
            ON w.id_rozgrywki = r.id
        JOIN gry gr 
            ON r.id_gry = gr.id
        WHERE gr.nazwa = :game_name
        GROUP BY g.id, g.nick
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
            g.nick,
            COUNT(DISTINCT r.id) AS played_games,
            COUNT(DISTINCT CASE WHEN r.id_zwyciezcy = g.id THEN r.id END) AS wins,
            SUM(w.liczba_punktow) AS total_points
        FROM gracze g
        JOIN wyniki w 
            ON g.id = w.id_gracza
        JOIN rozgrywki r 
            ON w.id_rozgrywki = r.id
        JOIN gry gr 
            ON r.id_gry = gr.id
        WHERE gr.nazwa = :game_name
        GROUP BY g.id, g.nick
        ORDER BY total_points DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
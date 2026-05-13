<?php

class DatabaseHandle {

    private static ?DatabaseHandle $instance = null;
    private PDO $connection;

    private function __construct(string $host, string $dbname, string $username, string $password) {
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

    public function addPlayer(string $nickname): bool {
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

    public function addGame(string $name, string $type, int $minPlayers, int $maxPlayers, string $winType): bool {
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

    public function addMatch(int $winnerId, int $gameId, string $matchDate, int $playerCount): int {
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
        $sql = 'SELECT * FROM gracze WHERE nick = :nick AND aktywny = 1 LIMIT 1';
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nick' => $nick]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    public function getGameRowByName(string $name): ?array {
        $sql = 'SELECT * FROM gry WHERE nazwa = :nazwa AND aktywna = 1 LIMIT 1';
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nazwa' => $name]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    public function getPlayerSuggestionsByPrefix(string $prefix, int $limit = 3): array {
        $safeLimit = max(1, min(10, $limit));
        $sql = "SELECT nick FROM gracze WHERE nick LIKE :prefix AND aktywny = 1 ORDER BY nick ASC LIMIT {$safeLimit}";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['prefix' => $prefix . '%']);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getGameSuggestionsByPrefix(string $prefix, int $limit = 3): array {
        $safeLimit = max(1, min(10, $limit));
        $sql = "SELECT nazwa FROM gry WHERE nazwa LIKE :prefix AND aktywna = 1 ORDER BY nazwa ASC LIMIT {$safeLimit}";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['prefix' => $prefix . '%']);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function addScore(int $matchId, string $playerId, string $points) {
        $sql = "INSERT INTO wyniki (id_rozgrywki, id_gracza, liczba_punktow)
                VALUES (:match_id, :player_id, :points)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'match_id' => $matchId,
            'player_id' => $playerId,
            'points' => $points
        ]);
    }

    public function getWinSortedLeaderboard(string $gameName): array
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
          AND g.aktywny = 1
          AND gr.aktywna = 1
        GROUP BY g.id, g.nick
        ORDER BY wins DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPlayedSortedLeaderboard(string $gameName): array
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
          AND g.aktywny = 1
          AND gr.aktywna = 1
        GROUP BY g.id, g.nick
        ORDER BY played_games DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPointsSortedLeaderboard(string $gameName): array
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
          AND g.aktywny = 1
          AND gr.aktywna = 1
        GROUP BY g.id, g.nick
        ORDER BY total_points DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'game_name' => $gameName
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function getMatchHistoryByGame(string $gameName): array
    {
        $sql = "
            SELECT 
                r.id,
                r.data AS match_date,
                r.ilosc_graczy AS player_count,
                g.nick AS winner,
                gr.nazwa AS game_name
            FROM rozgrywki r
            JOIN gracze g  
                ON r.id_zwyciezcy = g.id
            JOIN gry gr    
                ON r.id_gry = gr.id
            WHERE gr.nazwa = :game_name
              AND g.aktywny = 1
              AND gr.aktywna = 1
            ORDER BY r.data DESC
            LIMIT 20
        ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['game_name' => $gameName]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMatchHistoryByPlayer(string $playerNick): array
    {
        $sql = "
            SELECT 
                r.id,
                r.data AS match_date,
                r.ilosc_graczy AS player_count,
                gr.nazwa AS game_name,
                g_winner.nick AS winner,
                w.liczba_punktow AS points_scored
            FROM rozgrywki r
            JOIN wyniki w        
                ON r.id = w.id_rozgrywki
            JOIN gracze g        
                ON w.id_gracza = g.id
            JOIN gracze g_winner 
                ON r.id_zwyciezcy = g_winner.id
            JOIN gry gr           
                ON r.id_gry = gr.id
            WHERE g.nick = :player_nick
              AND g.aktywny = 1
              AND g_winner.aktywny = 1
              AND gr.aktywna = 1
            ORDER BY r.data DESC
            LIMIT 20
        ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['player_nick' => $playerNick]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecentMatches(int $limit = 20): array
    {
        $sql = "
            SELECT 
                r.id,
                r.data AS match_date,
                r.ilosc_graczy AS player_count,
                gr.nazwa AS game_name,
                g.nick AS winner
            FROM rozgrywki r
            JOIN gracze g 
                ON r.id_zwyciezcy = g.id
            JOIN gry gr   
                ON r.id_gry = gr.id
            WHERE g.aktywny = 1
              AND gr.aktywna = 1
            ORDER BY r.data DESC
            LIMIT :limit
        ";

        $stmt = $this->connection->prepare($sql);
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllPlayers(): array
    {
        $sql = "SELECT id, nick FROM gracze WHERE aktywny = 1 ORDER BY id DESC";
        $stmt = $this->connection->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllGames(): array
    {
        $sql = "SELECT id, nazwa, rodzaj, min_graczy, max_graczy, rodzaj_wygranej FROM gry WHERE aktywna = 1 ORDER BY id DESC";
        $stmt = $this->connection->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllMatches(): array
    {
        $sql = "
            SELECT
                r.id,
                r.id_gry,
                gr.nazwa AS game_name,
                r.id_zwyciezcy,
                g.nick AS winner_nick,
                r.data,
                r.ilosc_graczy
            FROM rozgrywki r
            JOIN gry gr ON gr.id = r.id_gry
            JOIN gracze g ON g.id = r.id_zwyciezcy
            WHERE gr.aktywna = 1
              AND g.aktywny = 1
            ORDER BY r.id DESC
        ";
        $stmt = $this->connection->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllScores(int $matchId): array
    {
        $sql = "
        SELECT
            w.id,
            w.id_rozgrywki,
            w.id_gracza,
            w.liczba_punktow,
            g.nick AS player_nick
        FROM wyniki w
        JOIN gracze g ON g.id = w.id_gracza
        JOIN rozgrywki r ON r.id = w.id_rozgrywki
        JOIN gry gr ON gr.id = r.id_gry
        WHERE g.aktywny = 1
          AND gr.aktywna = 1
          AND w.id_rozgrywki = :rozgrywka_id
        ORDER BY w.id DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'rozgrywka_id' => $matchId
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function playerExists(int $id): bool
    {
        $sql = "SELECT id FROM gracze WHERE id = :id AND aktywny = 1 LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function gameExists(int $id): bool
    {
        $sql = "SELECT id FROM gry WHERE id = :id AND aktywna = 1 LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function matchExists(int $id): bool
    {
        $sql = "SELECT id FROM rozgrywki WHERE id = :id LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function scoreExists(int $id): bool
    {
        $sql = "SELECT id FROM wyniki WHERE id = :id LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    public function updatePlayer(int $id, string $nickname): bool
    {
        $sql = "SELECT id FROM gracze WHERE nick = :nick AND id != :id AND aktywny = 1 LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nick' => $nickname, 'id' => $id]);
        if ($stmt->fetch(PDO::FETCH_ASSOC) !== false) {
            return false;
        }

        $sql = "UPDATE gracze SET nick = :nick WHERE id = :id AND aktywny = 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nick' => $nickname, 'id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function updateGame(int $id, string $name, string $type, int $minPlayers, int $maxPlayers, string $winType): bool
    {
        $sql = "SELECT id FROM gry WHERE nazwa = :name AND id != :id AND aktywna = 1 LIMIT 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['name' => $name, 'id' => $id]);
        if ($stmt->fetch(PDO::FETCH_ASSOC) !== false) {
            return false;
        }

        $sql = "
            UPDATE gry
            SET nazwa = :name, rodzaj = :type, min_graczy = :min_players, max_graczy = :max_players, rodzaj_wygranej = :win_type
            WHERE id = :id AND aktywna = 1
        ";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'type' => $type,
            'min_players' => $minPlayers,
            'max_players' => $maxPlayers,
            'win_type' => $winType,
        ]);
        return $stmt->rowCount() > 0;
    }

    public function updateMatch(int $id, int $winnerId, int $gameId, int $playerCount): bool
    {
        $sql = "
            UPDATE rozgrywki
            SET id_zwyciezcy = :winner_id, id_gry = :game_id, ilosc_graczy = :player_count
            WHERE id = :id
        ";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'winner_id' => $winnerId,
            'game_id' => $gameId,
            'player_count' => $playerCount,
        ]);
        return $stmt->rowCount() > 0;
    }

    public function updateScore(int $id, int $matchId, int $playerId, int $points): bool
    {
        $sql = "
            UPDATE wyniki
            SET id_rozgrywki = :match_id, id_gracza = :player_id, liczba_punktow = :points
            WHERE id = :id
        ";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'match_id' => $matchId,
            'player_id' => $playerId,
            'points' => $points,
        ]);
        return $stmt->rowCount() > 0;
    }

    public function deleteMatchWithScores(int $matchId): void
    {
        $sql = "DELETE FROM wyniki WHERE id_rozgrywki = :match_id";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['match_id' => $matchId]);

        $sql = "DELETE FROM rozgrywki WHERE id = :match_id";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['match_id' => $matchId]);
    }

    public function deactivatePlayer(int $playerId): bool
    {
        $deletedNick = 'deleted_user_' . bin2hex(random_bytes(16));

        $sql = "
        UPDATE gracze
        SET aktywny = 0,
            nick = :deleted_nick
        WHERE id = :player_id
          AND aktywny = 1
    ";

        $stmt = $this->connection->prepare($sql);

        $stmt->execute([
            'player_id' => $playerId,
            'deleted_nick' => $deletedNick
        ]);

        return $stmt->rowCount() > 0;
    }

    public function deactivateGame(int $gameId): bool
    {
        $deletedName = 'deleted_game_' . bin2hex(random_bytes(16));

        $sql = "
        UPDATE gry
        SET aktywna = 0,
            nazwa = :deleted_name
        WHERE id = :game_id
          AND aktywna = 1
    ";

        $stmt = $this->connection->prepare($sql);

        $stmt->execute([
            'game_id' => $gameId,
            'deleted_name' => $deletedName
        ]);

        return $stmt->rowCount() > 0;
    }

    public function deleteScore(int $scoreId): bool
    {
        $sql = "DELETE FROM wyniki WHERE id = :score_id";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['score_id' => $scoreId]);
        return $stmt->rowCount() > 0;
    }
}
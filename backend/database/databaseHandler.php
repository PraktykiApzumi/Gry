<?php

class DatabaseHandle {

    private static ?DatabaseHandle $instance = null;
    private PDO $connection;

    private function __construct(string $host, string $dbname, string $username, string $password) {
        $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

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

    private function exists(string $sql, array $params): bool
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    private function fetchRow(string $sql, array $params): ?array
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    public function addPlayer(string $nickname): bool {
        if ($this->exists('SELECT id FROM gracze WHERE nick = :nick LIMIT 1', ['nick' => $nickname])) {
            return false;
        }

        $sql = "INSERT INTO gracze (nick) VALUES (:nickname)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'nickname' => $nickname,
        ]);
        return true;
    }

    public function addGame(string $name, string $type, int $minPlayers, int $maxPlayers, string $winType): bool {
        if ($this->exists('SELECT id FROM gry WHERE nazwa = :name LIMIT 1', ['name' => $name])) {
            return false;
        }

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
        return $this->fetchRow(
            'SELECT * FROM gracze WHERE nick = :nick AND aktywny = 1 LIMIT 1',
            ['nick' => $nick]
        );
    }

    public function getGameRowByName(string $name): ?array {
        return $this->fetchRow(
            'SELECT * FROM gry WHERE nazwa = :name AND aktywna = 1 LIMIT 1',
            ['name' => $name]
        );
    }

    private function filterByStrictPrefix(array $values, string $prefix): array
    {
        $prefixLength = mb_strlen($prefix, 'UTF-8');
        if ($prefixLength === 0) {
            return $values;
        }

        $prefixLower = mb_strtolower($prefix, 'UTF-8');

        return array_values(array_filter($values, function ($value) use ($prefixLength, $prefixLower) {
            $head = mb_substr($value, 0, $prefixLength, 'UTF-8');
            return mb_strtolower($head, 'UTF-8') === $prefixLower;
        }));
    }

    public function getPlayerSuggestionsByPrefix(string $prefix, int $limit = 3): array {
        $safeLimit = max(1, min(10, $limit));
        $prefixLower = mb_strtolower($prefix, 'UTF-8');
        $fetchLimit = $safeLimit * 5;
        $sql = "SELECT nick FROM gracze WHERE LOWER(nick) COLLATE utf8mb4_bin LIKE :prefix AND aktywny = 1 ORDER BY nick ASC LIMIT {$fetchLimit}";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['prefix' => $prefixLower . '%']);
        $rows = $this->filterByStrictPrefix($stmt->fetchAll(PDO::FETCH_COLUMN), $prefix);

        return array_slice($rows, 0, $safeLimit);
    }

    public function getGameSuggestionsByPrefix(string $prefix, int $limit = 3): array {
        $safeLimit = max(1, min(10, $limit));
        $prefixLower = mb_strtolower($prefix, 'UTF-8');
        $fetchLimit = $safeLimit * 5;
        $sql = "SELECT nazwa FROM gry WHERE LOWER(nazwa) COLLATE utf8mb4_bin LIKE :prefix AND aktywna = 1 ORDER BY nazwa ASC LIMIT {$fetchLimit}";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['prefix' => $prefixLower . '%']);
        $rows = $this->filterByStrictPrefix($stmt->fetchAll(PDO::FETCH_COLUMN), $prefix);

        return array_slice($rows, 0, $safeLimit);
    }

    private function getStatsScopeColumn(string $scope): string
    {
        return $scope === 'type' ? 'gr.rodzaj' : 'gr.nazwa';
    }

    private function sqlEffectiveWinnerId(string $matchAlias = 'r', string $gameAlias = 'gr'): string
    {
        return "CASE
            WHEN {$gameAlias}.rodzaj_wygranej = 'inna' THEN {$matchAlias}.id_zwyciezcy
            WHEN (
                SELECT COUNT(*) FROM wyniki w_eff WHERE w_eff.id_rozgrywki = {$matchAlias}.id
            ) = 0 THEN {$matchAlias}.id_zwyciezcy
            WHEN {$gameAlias}.rodzaj_wygranej = 'punktowa-malejaca' THEN (
                SELECT w_eff.id_gracza FROM wyniki w_eff
                WHERE w_eff.id_rozgrywki = {$matchAlias}.id
                ORDER BY w_eff.liczba_punktow ASC, w_eff.id_gracza ASC
                LIMIT 1
            )
            ELSE (
                SELECT w_eff.id_gracza FROM wyniki w_eff
                WHERE w_eff.id_rozgrywki = {$matchAlias}.id
                ORDER BY w_eff.liczba_punktow DESC, w_eff.id_gracza ASC
                LIMIT 1
            )
        END";
    }

    public function getLeaderboard(string $scope, string $value): array
    {
        $scopeColumn = $this->getStatsScopeColumn($scope);
        $effectiveWinnerId = $this->sqlEffectiveWinnerId();

        $sql = "
        SELECT 
            g.id,
            g.nick,
            COUNT(DISTINCT r.id) AS played_games,
            COUNT(DISTINCT CASE WHEN ({$effectiveWinnerId}) = g.id THEN r.id END) AS wins,
            COALESCE(SUM(w.liczba_punktow), 0) AS total_points,
            AVG(w.liczba_punktow) AS average_points
        FROM gracze g
        JOIN wyniki w
            ON g.id = w.id_gracza
        JOIN rozgrywki r
            ON w.id_rozgrywki = r.id
        JOIN gry gr
            ON r.id_gry = gr.id
        WHERE {$scopeColumn} = :stats_value
          AND g.aktywny = 1
          AND gr.aktywna = 1
        GROUP BY g.id, g.nick
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'stats_value' => $value
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addScore(int $matchId, int $playerId, int $points): void {
        $sql = "INSERT INTO wyniki (id_rozgrywki, id_gracza, liczba_punktow)
                VALUES (:match_id, :player_id, :points)";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'match_id' => $matchId,
            'player_id' => $playerId,
            'points' => $points
        ]);
    }

    public function getMatchHistoryByGame(string $gameName): array
    {
        $effectiveWinnerId = $this->sqlEffectiveWinnerId();

        $sql = "
            SELECT 
                r.id,
                r.data AS match_date,
                r.ilosc_graczy AS player_count,
                g.nick AS winner,
                gr.nazwa AS game_name
            FROM rozgrywki r
            JOIN gry gr    
                ON r.id_gry = gr.id
            JOIN gracze g  
                ON g.id = ({$effectiveWinnerId})
            WHERE gr.nazwa = :game_name
            ORDER BY r.data DESC
            LIMIT 20
        ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['game_name' => $gameName]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMatchHistoryByPlayer(string $playerNick): array
    {
        $effectiveWinnerId = $this->sqlEffectiveWinnerId();

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
            JOIN gry gr           
                ON r.id_gry = gr.id
            JOIN gracze g_winner 
                ON g_winner.id = ({$effectiveWinnerId})
            WHERE g.nick = :player_nick
              AND g_winner.aktywny = 1
            ORDER BY r.data DESC
            LIMIT 20
        ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['player_nick' => $playerNick]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecentMatches(int $limit = 20): array
    {
        $effectiveWinnerId = $this->sqlEffectiveWinnerId();

        $sql = "
            SELECT 
                r.id,
                r.data AS match_date,
                r.ilosc_graczy AS player_count,
                gr.nazwa AS game_name,
                g.nick AS winner
            FROM rozgrywki r
            JOIN gry gr   
                ON r.id_gry = gr.id
            JOIN gracze g 
                ON g.id = ({$effectiveWinnerId})
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
                gr.rodzaj_wygranej,
                r.id_zwyciezcy,
                g.nick AS winner_nick,
                r.data,
                r.ilosc_graczy
            FROM rozgrywki r
            JOIN gry gr ON gr.id = r.id_gry
            JOIN gracze g ON g.id = r.id_zwyciezcy
            ORDER BY r.id DESC
        ";
        $stmt = $this->connection->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllScores(int $matchId): array
    {
        $sql = "
        SELECT
            w.id_gracza AS id,
            w.id_rozgrywki,
            w.id_gracza,
            w.liczba_punktow,
            g.nick AS player_nick
        FROM wyniki w
        JOIN gracze g ON g.id = w.id_gracza
        JOIN rozgrywki r ON r.id = w.id_rozgrywki
        JOIN gry gr ON gr.id = r.id_gry
        WHERE w.id_rozgrywki = :rozgrywka_id
        ORDER BY w.id_gracza DESC
    ";

        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
            'rozgrywka_id' => $matchId
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function playerExists(int $id): bool
    {
        return $this->exists(
            'SELECT id FROM gracze WHERE id = :id AND aktywny = 1 LIMIT 1',
            ['id' => $id]
        );
    }

    public function gameExists(int $id): bool
    {
        return $this->exists(
            'SELECT id FROM gry WHERE id = :id AND aktywna = 1 LIMIT 1',
            ['id' => $id]
        );
    }

    public function matchExists(int $id): bool
    {
        return $this->exists(
            'SELECT id FROM rozgrywki WHERE id = :id LIMIT 1',
            ['id' => $id]
        );
    }

    public function matchScoreExists(int $matchId, int $playerId): bool
    {
        return $this->exists(
            'SELECT id_gracza FROM wyniki WHERE id_rozgrywki = :match_id AND id_gracza = :player_id LIMIT 1',
            [
                'match_id' => $matchId,
                'player_id' => $playerId,
            ]
        );
    }

    public function updatePlayer(int $id, string $nickname): bool
    {
        if ($this->exists(
            'SELECT id FROM gracze WHERE nick = :nick AND id != :id AND aktywny = 1 LIMIT 1',
            ['nick' => $nickname, 'id' => $id]
        )) {
            return false;
        }

        $sql = "UPDATE gracze SET nick = :nick WHERE id = :id AND aktywny = 1";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute(['nick' => $nickname, 'id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function updateGame(int $id, string $name, string $type, int $minPlayers, int $maxPlayers, string $winType): bool
    {
        if ($this->exists(
            'SELECT id FROM gry WHERE nazwa = :name AND id != :id AND aktywna = 1 LIMIT 1',
            ['name' => $name, 'id' => $id]
        )) {
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

    public function updateScore(int $matchId, int $playerId, int $points): bool
    {
        $sql = "
            UPDATE wyniki
            SET liczba_punktow = :points
            WHERE id_rozgrywki = :match_id AND id_gracza = :player_id
        ";
        $stmt = $this->connection->prepare($sql);
        $stmt->execute([
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

} 

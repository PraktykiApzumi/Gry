<?php
class Dbh{
    private $host;
    private $user;
    private $pwd;
    private $dbName;

    protected function connect(){
        $this->host = "localhost";
        $this->user = "root";
        $this->pwd = "";
        $this->dbName = "planszowka";

        $dsn = "mysql:host=".$this->host.";dbname=".$this->dbName;
        $pdo = new PDO($dsn, $this->user, $this->pwd);

    }
    function dodaj_gracza($imie, $nazwisko){
        $sql = "INSERT INTO gracze (imie, nazwisko) VALUES (?, ?)";
        $stmt = $this->connect()->prepare($sql);
        $stmt->execute([$imie, $nazwisko]);
    }
    function dodaj_gre($nazwa, $rodzaj,$min_graczy, $max_graczy, $rodzaj_wygranej){
        $sql = "INSERT INTO gry (nazwa, rodzaj, min_graczy, max_graczy, rodzaj_wygranej) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->connect()->prepare($sql);
        $stmt->execute([$nazwa, $rodzaj, $min_graczy, $max_graczy, $rodzaj_wygranej]);
    }
    function dodaj_rozgrywke($id_zwyciezcy, $id_gry, $data_rozgrywki, $wynik){
        $sql = "INSERT INTO rozgrywki (id_zwyciezcy, id_gry, data_rozgrywki, wynik) VALUES (?, ?, ?, ?)";
        $stmt = $this->connect()->prepare($sql);
        $stmt->execute([$id_zwyciezcy, $id_gry, $data_rozgrywki, $wynik]);
    }
    function dodaj_wynik($id_rozgrywki, $id_gracza, $punkty){
        $sql = "INSERT INTO wyniki (id_rozgrywki, id_gracza, punkty) VALUES (?, ?, ?)";
        $stmt = $this->connect()->prepare($sql);
        $stmt->execute([$id_rozgrywki, $id_gracza, $punkty]);
    }
    
}
?>